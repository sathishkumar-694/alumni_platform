import { recommendationRepository } from './recommendation.repository.js';
import { ApiError } from '../../shared/ApiError.js';
import { config } from '../../config/env.js';
import { uploadResumeBackup } from '../../config/cloudinary.js';
import { db } from '../../config/db.js';
import {
  rankMentorsForResumeGaps,
  rankMentorsGeneral,
  getCachedOrCompute
} from './mentorCriteria.js';

export class RecommendationService {
  async getRecommendedMentors(currentUser) {
    const cacheKey = `mentors_rec_${currentUser?.id || 'guest'}`;

    let studentInterests = [];
    if (currentUser && currentUser.role === 'STUDENT') {
      const studentProfile = (await recommendationRepository.findStudentProfile(currentUser.id)) || { interests: [] };
      studentInterests = studentProfile.interests || [];
    }

    const verifiedAlumniUsers = await recommendationRepository.findVerifiedAlumni();
    const allDomains = await recommendationRepository.findAllDomains();

    const alumniWithProfiles = await Promise.all(verifiedAlumniUsers.map(async (alumni) => {
      const profile = (await recommendationRepository.findAlumniProfile(alumni.id)) || {
        expertise: [],
        max_capacity: 5,
        current_capacity: 0,
        experience_years: 1,
        company: 'Technology Leader',
        designation: 'Software Engineer'
      };
      return {
        ...alumni,
        profile
      };
    }));

    // Option B & Option C: Multi-criteria ranking with Level (L1-L5), Company Tier, Domain Alignment & Fast Caching
    return getCachedOrCompute(cacheKey, () => {
      return rankMentorsGeneral(alumniWithProfiles, studentInterests, allDomains);
    });
  }

  async analyzeResume(currentUser, {
    resumeText = '',
    documentBase64 = '',
    documentMimeType = '',
    fileName = '',
    targetRole = '',
    jobDescription = '',
    portfolioUrl = '',
    apiKey = '',
    aiProvider = 'auto'
  }) {
    // 1. Resolve Primary & Fallback API Keys from request or environment
    const passedKey = (apiKey || '').trim();
    const selectedProvider = (aiProvider || 'auto').toLowerCase();

    // Check environment / config keys
    const envGeminiKey = (process.env.GEMINI_API_KEY || config.geminiApiKey || '').trim();
    const envGroqKey = (process.env.GROQ_API_KEY || config.groqApiKey || '').trim();
    const envOpenAiKey = (process.env.OPENAI_API_KEY || config.openaiApiKey || '').trim();

    // Determine final keys per provider
    const geminiKey = (selectedProvider === 'gemini' && passedKey)
      ? passedKey
      : (passedKey && passedKey.startsWith('AIza') ? passedKey : envGeminiKey);

    const groqKey = (selectedProvider === 'groq' && passedKey)
      ? passedKey
      : (passedKey && passedKey.startsWith('gsk_') ? passedKey : envGroqKey);

    const openAiKey = (selectedProvider === 'openai' && passedKey)
      ? passedKey
      : (passedKey && passedKey.startsWith('sk-') ? passedKey : envOpenAiKey);

    const isValidKey = (key, placeholderSubstring) => {
      if (!key || typeof key !== 'string') return false;
      const clean = key.trim();
      return clean.length >= 16 &&
        !clean.toLowerCase().includes(placeholderSubstring.toLowerCase()) &&
        !clean.includes('...');
    };

    const hasValidGeminiKey = isValidKey(geminiKey, 'your_gemini_key');
    const hasValidGroqKey = isValidKey(groqKey, 'your_groq_key');
    const hasValidOpenAiKey = isValidKey(openAiKey, 'your_openai_key');

    // Clean and sanitize input resume text
    const cleanResumeText = (resumeText || '')
      .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const hasDocument = Boolean(documentBase64 && documentBase64.length > 50);

    if (!cleanResumeText && !hasDocument) {
      throw new ApiError(400, 'Please provide valid resume text or upload a resume document (.pdf, .docx, or .txt).');
    }

    const startTime = Date.now();
    // Start automated resume backup to Cloudinary (with local disk fallback)
    const backupPromise = uploadResumeBackup({
      documentBase64,
      documentMimeType,
      fileName,
      resumeText: cleanResumeText,
      userId: currentUser?.id || 'student'
    });

    const dbDomains = await recommendationRepository.findAllDomains();
    const allMentors = await this.getRecommendedMentors(currentUser);

    const isJd = Boolean(jobDescription && jobDescription.trim().length > 10);
    const targetTitle = targetRole.trim() || 'Software Development Engineer';

    const targetContext = isJd
      ? `Job Description (JD):\n"""\n${jobDescription.trim().slice(0, 4000)}\n"""`
      : `Target Role / Job Title: "${targetTitle}"`;

    const promptText = `You are a professional AI ATS Resume Evaluator & Career Advisor.
Carefully read and evaluate the candidate's resume strictly against the following ${targetContext}.

Task:
1. Extract ALL actual technical skills, programming languages, software tools, frameworks, and engineering concepts mentioned in the resume.
2. Compare the candidate's actual skills and experience against key requirements for this ${isJd ? 'Job Description' : 'Target Role'}.
3. Calculate an accurate overall ATS Compatibility Match Score (0-100%).
4. Calculate individual ATS sub-scores (0-100%):
   - keyword_match_score: ATS Keyword Coverage % for this position
   - impact_score: Measurable Metrics & Action Verbs %
   - format_score: Structure, Readability & Organization %
   - technical_depth_score: Skill Relevance & Domain Competency %
5. Identify 3-6 critical missing skills / ATS keywords needed to rank higher.
6. Provide 3-5 specific, actionable bullet points to optimize the resume.

${cleanResumeText ? `Candidate Resume Content:\n"""\n${cleanResumeText.slice(0, 8000)}\n"""\n` : ''}
Return RAW JSON ONLY with NO markdown syntax:
{
  "ats_score": <number 0-100>,
  "keyword_match_score": <number 0-100>,
  "impact_score": <number 0-100>,
  "format_score": <number 0-100>,
  "technical_depth_score": <number 0-100>,
  "detected_skills": ["<skill1>", "<skill2>"],
  "missing_skills": ["<missing_keyword1>", "<missing_keyword2>"],
  "actionable_advice": ["<improvement1>", "<improvement2>"]
}`;

    const aiErrorNotes = [];

    // Determine prioritized execution plan with full cascading failover across all online models
    const providersToAttempt = [];
    if (selectedProvider === 'local') {
      // Direct in-house algorithmic engine requested
    } else {
      const allAvailable = [];
      if (hasValidGeminiKey) allAvailable.push('gemini');
      if (hasValidGroqKey) allAvailable.push('groq');
      if (hasValidOpenAiKey) allAvailable.push('openai');

      if (allAvailable.includes(selectedProvider)) {
        // Put preferred provider first, then add all remaining online providers as active failovers
        providersToAttempt.push(selectedProvider);
        allAvailable.filter(p => p !== selectedProvider).forEach(p => providersToAttempt.push(p));
      } else {
        // Standard cascade order: Google Gemini -> Groq Cloud -> OpenAI
        providersToAttempt.push(...allAvailable);
      }
    }

    // Helper to match mentors with missing skills
    // Option A: Rank Mentors specifically for Resume Skill Gaps, Levels & Achievements
    const resolveMatchedMentors = (missingSkillsArray) => {
      return rankMentorsForResumeGaps(allMentors, missingSkillsArray, targetTitle);
    };

    // Unified Response Builder with Live Verification & Telemetry
    const buildResponse = async ({
      provider,
      isOnline,
      score,
      keywordMatch,
      impact,
      format,
      depth,
      detected,
      missing,
      advice,
      fallbackNote = ''
    }) => {
      const backupInfo = await backupPromise.catch(() => null);
      const latencyMs = Date.now() - startTime;
      const rankedMentors = resolveMatchedMentors(missing);

      // Automatically persist to resume_analyses history dashboard table
      let savedRecord = null;
      try {
        savedRecord = await db.resumeAnalyses.create({
          user_id: currentUser?.id || 'guest',
          file_name: fileName || 'resume.pdf',
          target_role: isJd ? 'Custom Job Description (JD)' : targetTitle,
          ats_score: score,
          keyword_match_score: keywordMatch,
          impact_score: impact,
          format_score: format,
          technical_depth_score: depth,
          detected_skills: detected,
          missing_skills: missing,
          actionable_advice: advice,
          matched_mentors: rankedMentors,
          backup_url: backupInfo?.url || '',
          backup_provider: backupInfo?.provider || 'CampusBridge Storage',
          ai_provider: provider,
          is_online_model: isOnline,
          latency_ms: latencyMs
        });
      } catch (saveErr) {
        console.warn('[Resume History Save Notice]:', saveErr.message);
      }

      return {
        id: savedRecord?.id || `ra-${Date.now()}`,
        target_role: isJd ? 'Custom Job Description (JD)' : targetTitle,
        file_name: fileName || 'resume.pdf',
        ats_score: score,
        sde_fit_score: score,
        keyword_match_score: keywordMatch,
        impact_score: impact,
        format_score: format,
        technical_depth_score: depth,
        detected_skills: detected,
        recommended_skills_to_learn: missing,
        portfolio_analyzed: Boolean(portfolioUrl),
        matched_mentors: rankedMentors,
        actionable_advice: advice,
        ai_provider: provider,
        is_online_model: isOnline,
        analysis_timestamp: new Date().toISOString(),
        ai_inference_time_ms: latencyMs,
        resume_backup: backupInfo,
        fallback_note: fallbackNote
      };
    };


    // ---------------------------------------------------------
    // 1. ONLINE AI SERVICE: GOOGLE GEMINI (Multimodal PDF + Text)
    // ---------------------------------------------------------
    if (providersToAttempt.includes('gemini') && hasValidGeminiKey) {
      const geminiModels = ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-3.8-flash', 'gemini-1.5-flash'];

      // Prepare payload contents
      const parts = [{ text: promptText }];
      if (hasDocument && (documentMimeType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf'))) {
        const cleanBase64 = documentBase64.replace(/^data:[^;]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: cleanBase64
          }
        });
      }

      for (const modelName of geminiModels) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.2
              }
            })
          });

          if (res.ok) {
            const geminiData = await res.json();
            let rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
            rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

            const parsed = JSON.parse(rawText);
            const score = Math.max(10, Math.min(100, Number(parsed.ats_score || parsed.sde_fit_score) || 78));
            const detectedSkills = Array.isArray(parsed.detected_skills) && parsed.detected_skills.length > 0
              ? parsed.detected_skills
              : ['Technical Fundamentals'];
            const missingSkills = Array.isArray(parsed.missing_skills) && parsed.missing_skills.length > 0
              ? parsed.missing_skills
              : ['System Architecture'];
            const advice = Array.isArray(parsed.actionable_advice) && parsed.actionable_advice.length > 0
              ? parsed.actionable_advice
              : ['Incorporate core missing industry keywords into your project experience.'];

            return await buildResponse({
              provider: `Google Gemini (${modelName})`,
              isOnline: true,
              score,
              keywordMatch: Math.max(10, Math.min(100, Number(parsed.keyword_match_score) || Math.min(98, score + 4))),
              impact: Math.max(10, Math.min(100, Number(parsed.impact_score) || Math.max(55, score - 6))),
              format: Math.max(10, Math.min(100, Number(parsed.format_score) || 88)),
              depth: Math.max(10, Math.min(100, Number(parsed.technical_depth_score) || score)),
              detected: detectedSkills,
              missing: missingSkills,
              advice
            });
          } else {
            const errData = await res.json().catch(() => ({}));
            const msg = errData.error?.message || `HTTP ${res.status}`;
            console.warn(`[Gemini API Warning - ${modelName}]: ${msg}`);
            aiErrorNotes.push(`Gemini (${modelName}): ${msg}`);
          }
        } catch (err) {
          console.warn(`[Gemini API Exception - ${modelName}]:`, err.message);
          aiErrorNotes.push(`Gemini (${modelName}): ${err.message}`);
        }
      }
    } else if (providersToAttempt.includes('gemini') && !hasValidGeminiKey) {
      aiErrorNotes.push('Google Gemini API key not configured or contains placeholder value.');
    }

    // ---------------------------------------------------------
    // 2. ONLINE AI SERVICE: GROQ CLOUD (Ultra-Fast Inference)
    // ---------------------------------------------------------
    if (providersToAttempt.includes('groq') && hasValidGroqKey) {
      const groqModels = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

      for (const groqModel of groqModels) {
        try {
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${groqKey}`
            },
            body: JSON.stringify({
              model: groqModel,
              messages: [
                {
                  role: 'system',
                  content: 'You are an expert AI ATS Resume Evaluator and Career Advisor. Evaluate strictly against the target position. Return JSON only.'
                },
                { role: 'user', content: promptText }
              ],
              response_format: { type: 'json_object' },
              temperature: 0.2
            })
          });

          if (response.ok) {
            const aiData = await response.json();
            let rawContent = aiData.choices?.[0]?.message?.content || '{}';
            rawContent = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();

            const parsed = JSON.parse(rawContent);
            const score = Math.max(10, Math.min(100, Number(parsed.ats_score || parsed.sde_fit_score) || 82));
            const detectedSkills = parsed.detected_skills || ['Software Engineering Fundamentals'];
            const missingSkills = parsed.missing_skills || ['System Architecture'];

            return await buildResponse({
              provider: `Groq Cloud (${groqModel})`,
              isOnline: true,
              score,
              keywordMatch: Math.max(10, Math.min(100, Number(parsed.keyword_match_score) || Math.min(98, score + 3))),
              impact: Math.max(10, Math.min(100, Number(parsed.impact_score) || Math.max(60, score - 5))),
              format: Math.max(10, Math.min(100, Number(parsed.format_score) || 90)),
              depth: Math.max(10, Math.min(100, Number(parsed.technical_depth_score) || score)),
              detected: detectedSkills,
              missing: missingSkills,
              advice: parsed.actionable_advice || ['Quantify project achievements with measurable business metrics.']
            });
          } else {
            const errData = await response.json().catch(() => ({}));
            const msg = errData.error?.message || `HTTP ${response.status}`;
            console.warn(`[Groq API Warning - ${groqModel}]: ${msg}`);
            aiErrorNotes.push(`Groq (${groqModel}): ${msg}`);
          }
        } catch (groqErr) {
          console.warn(`[Groq API Exception - ${groqModel}]:`, groqErr.message);
          aiErrorNotes.push(`Groq (${groqModel}): ${groqErr.message}`);
        }
      }
    } else if (providersToAttempt.includes('groq') && !hasValidGroqKey) {
      aiErrorNotes.push('Groq Cloud API key not configured or contains placeholder value.');
    }

    // ---------------------------------------------------------
    // 3. ONLINE AI SERVICE: OPENAI (GPT-4o Mini)
    // ---------------------------------------------------------
    if (providersToAttempt.includes('openai') && hasValidOpenAiKey) {
      const openAiModels = ['gpt-4o-mini', 'gpt-4o'];

      for (const openAiModel of openAiModels) {
        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openAiKey}`
            },
            body: JSON.stringify({
              model: openAiModel,
              messages: [
                {
                  role: 'system',
                  content: 'You are an expert AI ATS Resume Evaluator. Return JSON only.'
                },
                { role: 'user', content: promptText }
              ],
              response_format: { type: 'json_object' },
              temperature: 0.2
            })
          });

          if (response.ok) {
            const aiData = await response.json();
            const parsed = JSON.parse(aiData.choices?.[0]?.message?.content || '{}');
            const score = Math.max(10, Math.min(100, Number(parsed.ats_score) || 84));
            const detectedSkills = parsed.detected_skills || ['Software Engineering'];
            const missingSkills = parsed.missing_skills || ['System Architecture'];

            return await buildResponse({
              provider: `OpenAI (${openAiModel})`,
              isOnline: true,
              score,
              keywordMatch: Math.max(10, Math.min(100, Number(parsed.keyword_match_score) || 85)),
              impact: Math.max(10, Math.min(100, Number(parsed.impact_score) || 78)),
              format: Math.max(10, Math.min(100, Number(parsed.format_score) || 92)),
              depth: Math.max(10, Math.min(100, Number(parsed.technical_depth_score) || 82)),
              detected: detectedSkills,
              missing: missingSkills,
              advice: parsed.actionable_advice || ['Quantify your impact using action verbs and metrics.']
            });
          } else {
            const errData = await response.json().catch(() => ({}));
            const msg = errData.error?.message || `HTTP ${response.status}`;
            aiErrorNotes.push(`OpenAI (${openAiModel}): ${msg}`);
          }
        } catch (openAiErr) {
          aiErrorNotes.push(`OpenAI (${openAiModel}): ${openAiErr.message}`);
        }
      }
    } else if (providersToAttempt.includes('openai') && !hasValidOpenAiKey) {
      aiErrorNotes.push('OpenAI API key not configured or contains placeholder value.');
    }

    // ---------------------------------------------------------
    // 4. TIER 3 FALLBACK: Comprehensive 4-Pillar Algorithmic ATS Engine
    // ---------------------------------------------------------
    const combinedText = (cleanResumeText + ' ' + (fileName || '')).toLowerCase();
    const roleLower = targetTitle.toLowerCase();
    const jdLower = (jobDescription || '').toLowerCase();

    // Standard High-Tech & Engineering Skill Taxonomy (Categorized)
    const skillsTaxonomy = [
      'React', 'Next.js', 'Vue', 'Angular', 'JavaScript', 'TypeScript', 'HTML5', 'CSS3', 'Tailwind CSS',
      'Node.js', 'Express.js', 'Nest.js', 'Python', 'Django', 'FastAPI', 'Flask', 'Java', 'Spring Boot',
      'C++', 'C#', '.NET', 'Go', 'Rust', 'PHP', 'Ruby', 'Ruby on Rails',
      'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB', 'SQLite',
      'AWS', 'Azure', 'Google Cloud', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'GitHub Actions', 'Jenkins', 'Terraform',
      'REST API', 'GraphQL', 'gRPC', 'WebSockets', 'Microservices', 'System Design', 'Event-Driven',
      'Data Structures', 'Algorithms', 'OOP', 'Design Patterns', 'Unit Testing', 'Jest', 'Cypress',
      'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'Scikit-learn', 'Pandas', 'NumPy',
      'NLP', 'Computer Vision', 'LLM', 'LangChain', 'OpenAI',
      'Git', 'Linux', 'Bash', 'Kafka', 'RabbitMQ', 'Agile', 'Scrum'
    ];

    const detectedSkills = [];
    skillsTaxonomy.forEach(skill => {
      const skillRegex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (skillRegex.test(combinedText)) {
        detectedSkills.push(skill);
      }
    });

    // Check DB domains
    if (dbDomains && dbDomains.length > 0) {
      dbDomains.forEach(domain => {
        const domainRegex = new RegExp(`\\b${domain.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (domainRegex.test(combinedText) && !detectedSkills.includes(domain.name)) {
          detectedSkills.push(domain.name);
        }
      });
    }

    if (detectedSkills.length === 0) {
      detectedSkills.push('Software Fundamentals', 'Problem Solving', 'Engineering Practices');
    }

    // PILLAR 1: KEYWORD & JD OVERLAP SCORE
    let missingSkills = [];
    let keywordScore = 70;

    if (isJd) {
      // Extract keywords mentioned in JD
      const jdWords = jdLower.match(/[a-z]{3,}/g) || [];
      const stopWords = new Set(['and', 'the', 'for', 'with', 'you', 'will', 'are', 'that', 'our', 'from', 'this', 'have', 'work', 'team', 'experience', 'ability', 'knowledge', 'years', 'skills', 'role', 'strong', 'good', 'must', 'plus']);
      const uniqueJdKeywords = [...new Set(jdWords.filter(w => !stopWords.has(w)))];

      const matchedJdWords = uniqueJdKeywords.filter(w => combinedText.includes(w));
      const matchRatio = uniqueJdKeywords.length > 0 ? (matchedJdWords.length / uniqueJdKeywords.length) : 0.6;
      keywordScore = Math.min(96, Math.max(48, Math.round(matchRatio * 75 + 25)));

      // Missing skills from JD tech mentions
      skillsTaxonomy.forEach(skill => {
        if (jdLower.includes(skill.toLowerCase()) && !detectedSkills.some(ds => ds.toLowerCase() === skill.toLowerCase())) {
          missingSkills.push(skill);
        }
      });
    } else {
      // Role-based keyword expectations
      if (roleLower.includes('software') || roleLower.includes('sde') || roleLower.includes('developer') || roleLower.includes('full stack')) {
        const expected = ['System Design', 'Docker', 'Kubernetes', 'Data Structures & Algorithms', 'CI/CD', 'Microservices', 'Redis'];
        expected.forEach(exp => {
          if (!combinedText.includes(exp.toLowerCase()) && !detectedSkills.includes(exp)) {
            missingSkills.push(exp);
          }
        });
        keywordScore = Math.min(95, Math.max(55, Math.round(detectedSkills.length * 5 + 40)));
      } else if (roleLower.includes('data') || roleLower.includes('machine learning') || roleLower.includes('ai')) {
        const expected = ['Python', 'SQL', 'PyTorch', 'TensorFlow', 'Data Pipelines', 'Feature Engineering', 'Model Deployment'];
        expected.forEach(exp => {
          if (!combinedText.includes(exp.toLowerCase()) && !detectedSkills.includes(exp)) {
            missingSkills.push(exp);
          }
        });
        keywordScore = Math.min(95, Math.max(55, Math.round(detectedSkills.length * 6 + 35)));
      } else {
        missingSkills.push('System Architecture', 'Cloud Services', 'Automated Testing');
        keywordScore = Math.min(92, Math.max(55, Math.round(detectedSkills.length * 5 + 45)));
      }
    }

    missingSkills = [...new Set(missingSkills)].slice(0, 5);
    if (missingSkills.length === 0) {
      missingSkills = ['System Architecture', 'Performance Optimization', 'Cloud Scalability'];
    }

    // PILLAR 2: MEASURABLE IMPACT & ACTION VERBS (STAR METHOD)
    const strongActionVerbs = [
      'achieved', 'accelerated', 'architected', 'automated', 'built', 'created', 'decreased',
      'deployed', 'designed', 'developed', 'engineered', 'enhanced', 'established', 'expanded',
      'generated', 'implemented', 'improved', 'increased', 'integrated', 'launched', 'led',
      'maximized', 'migrated', 'optimized', 'orchestrated', 'reduced', 'refactored', 'resolved',
      'scaled', 'spearheaded', 'streamlined', 'transformed'
    ];
    let actionVerbsFound = 0;
    strongActionVerbs.forEach(verb => {
      const reg = new RegExp(`\\b${verb}\\b`, 'i');
      if (reg.test(combinedText)) actionVerbsFound++;
    });

    // Check quantified metrics (e.g. 35%, $10k, 2x, 500ms, 10,000 users)
    const metricsRegex = /\b(\d+(?:\.\d+)?%|\$\d+(?:,\d+)*(?:\.\d+)?[kmb]?|\b\d+\s*(?:users|requests|ms|seconds|minutes|hours|days|x|fold|stars|downloads|clients|engineers))\b/gi;
    const metricsMatches = combinedText.match(metricsRegex) || [];
    const metricsCount = metricsMatches.length;

    let impactScore = 55;
    impactScore += Math.min(25, actionVerbsFound * 4);
    impactScore += Math.min(20, metricsCount * 5);
    impactScore = Math.min(95, Math.max(48, impactScore));

    // PILLAR 3: FORMAT & STRUCTURE READABILITY
    let formatScore = 80;
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(combinedText);
    const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(combinedText);
    const hasEducation = /(bachelor|master|b\.tech|m\.tech|b\.e\.|degree|university|college|institute|cgpa|gpa)/i.test(combinedText);
    const hasExperience = /(experience|work history|employment|projects|internship)/i.test(combinedText);

    if (hasEmail) formatScore += 5;
    if (hasPhone) formatScore += 3;
    if (hasEducation) formatScore += 5;
    if (hasExperience) formatScore += 5;
    formatScore = Math.min(98, Math.max(65, formatScore));

    // PILLAR 4: TECHNICAL DEPTH
    let technicalDepthScore = Math.min(95, Math.max(50, Math.round(detectedSkills.length * 6 + 30)));

    // COMPOSITE ATS SCORE
    const atsScore = Math.round(
      (keywordScore * 0.40) +
      (impactScore * 0.25) +
      (formatScore * 0.20) +
      (technicalDepthScore * 0.15)
    );

    const advice = [];
    if (missingSkills.length > 0) {
      advice.push(`Integrate critical target keywords into your bullet points: ${missingSkills.slice(0, 3).join(', ')}.`);
    }
    if (metricsCount < 3) {
      advice.push('Quantify your project outcomes using measurable metrics (e.g., "Reduced page load time by 32% using Redis caching").');
    }
    if (actionVerbsFound < 4) {
      advice.push('Start every experience bullet point with strong active verbs (e.g., "Architected", "Spearheaded", "Optimized", "Scaled").');
    }
    if (!hasEducation || !hasEmail) {
      advice.push('Ensure standard contact information, LinkedIn profile, and education credentials are prominently displayed in header.');
    }
    advice.push(`Connect with a verified alumni mentor for a tailored 1-on-1 resume & portfolio review.`);

    const fallbackNote = aiErrorNotes.length > 0
      ? `Online AI models unavailable (${aiErrorNotes.slice(0, 2).join('; ')}). Evaluated using in-house 4-pillar ATS engine.`
      : 'Evaluated using CampusBridge in-house 4-pillar ATS engine. Add a free Google Gemini or Groq key to enable direct cloud LLM evaluations.';

    return await buildResponse({
      provider: 'CampusBridge In-House ATS Engine',
      isOnline: false,
      score: atsScore,
      keywordMatch: keywordScore,
      impact: impactScore,
      format: formatScore,
      depth: technicalDepthScore,
      detected: detectedSkills,
      missing: missingSkills,
      advice,
      fallbackNote
    });
  }

  async getAnalysisHistory(currentUser) {
    if (!currentUser) return [];
    return await db.resumeAnalyses.findByUserId(currentUser.id);
  }

  async getAnalysisById(currentUser, id) {
    const analysis = await db.resumeAnalyses.findById(id);
    if (!analysis) {
      throw new ApiError(404, 'Resume evaluation record not found');
    }
    if (analysis.user_id !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ApiError(403, 'Unauthorized access to this evaluation record');
    }
    return analysis;
  }

  async deleteAnalysis(currentUser, id) {
    const analysis = await db.resumeAnalyses.findById(id);
    if (!analysis) {
      throw new ApiError(404, 'Resume evaluation record not found');
    }
    if (analysis.user_id !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ApiError(403, 'Unauthorized to delete this evaluation record');
    }
    await db.resumeAnalyses.delete(id, currentUser.id);
    return { success: true, message: 'Resume analysis record deleted successfully' };
  }
}

export const recommendationService = new RecommendationService();

