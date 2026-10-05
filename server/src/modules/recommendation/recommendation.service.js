import { recommendationRepository } from './recommendation.repository.js';
import { ApiError } from '../../shared/ApiError.js';
import { config } from '../../config/env.js';

export class RecommendationService {
  async getRecommendedMentors(currentUser) {
    let studentInterests = [];
    if (currentUser && currentUser.role === 'STUDENT') {
      const studentProfile = (await recommendationRepository.findStudentProfile(currentUser.id)) || { interests: [] };
      studentInterests = studentProfile.interests || [];
    }

    const verifiedAlumniUsers = await recommendationRepository.findVerifiedAlumni();
    const allDomains = await recommendationRepository.findAllDomains();

    const recommended = await Promise.all(verifiedAlumniUsers.map(async (alumni) => {
      const profile = (await recommendationRepository.findAlumniProfile(alumni.id)) || { expertise: [], max_capacity: 5, current_capacity: 0 };
      const mentorExpertise = profile.expertise || [];

      const sharedDomains = studentInterests.filter(dId => mentorExpertise.includes(dId));

      let score = 50;
      if (studentInterests.length > 0) {
        score += (sharedDomains.length / Math.max(studentInterests.length, 1)) * 35;
      } else {
        score += 20;
      }

      const availableCapacity = Math.max(0, (profile.max_capacity || 5) - (profile.current_capacity || 0));
      if (availableCapacity > 0) {
        score += 10;
      }

      score += Math.min(5, (profile.experience_years || 1) * 0.8);
      const matchPercentage = Math.min(99, Math.round(score));

      const domainObjects = mentorExpertise.map(dId => allDomains.find(d => d.id === dId)).filter(Boolean);

      return {
        id: alumni.id,
        name: alumni.name,
        email: alumni.email,
        verification_status: alumni.verification_status,
        profile: {
          ...profile,
          available_slots: availableCapacity
        },
        expertise_domains: domainObjects,
        shared_domains_count: sharedDomains.length,
        match_score: matchPercentage
      };
    }));

    recommended.sort((a, b) => b.match_score - a.match_score);
    return recommended;
  }

  async analyzeResume(currentUser, { resumeText = '', targetRole = 'Software Development Engineer', portfolioUrl = '', apiKey = '', aiProvider = 'gemini' }) {
    // 1. Resolve Primary & Fallback API Keys from request or environment
    const geminiKey = (apiKey && aiProvider === 'gemini' ? apiKey : process.env.GEMINI_API_KEY || config.geminiApiKey || '').trim();
    const groqKey = (apiKey && aiProvider === 'groq' ? apiKey : process.env.GROQ_API_KEY || config.groqApiKey || '').trim();
    const openAiKey = (apiKey && aiProvider === 'openai' ? apiKey : process.env.OPENAI_API_KEY || config.openaiApiKey || '').trim();

    // Clean and sanitize input resume text to strip non-printable binary control characters
    const cleanResumeText = (resumeText || '')
      .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanResumeText) {
      throw new ApiError(400, 'Please provide valid resume text or upload a document containing text.');
    }

    const dbDomains = await recommendationRepository.findAllDomains();
    const allMentors = await this.getRecommendedMentors(currentUser);

    const promptText = `You are a professional AI ATS Resume Evaluator & Career Advisor.
Carefully read and evaluate the attached candidate resume strictly against the requested Target Role: "${targetRole}".

Task:
1. Extract ALL actual technical skills, programming languages, software tools, frameworks, and engineering concepts mentioned in the resume.
2. Compare the candidate's actual skills and experience against key requirements for "${targetRole}".
3. Calculate an accurate overall ATS Compatibility Match Score (0-100%).
4. Calculate individual ATS sub-scores (0-100%):
   - keyword_match_score: ATS Keyword Coverage % for "${targetRole}"
   - impact_score: Measurable Metrics & Action Verbs %
   - format_score: Structure, Readability & Organization %
   - technical_depth_score: Skill Relevance & Domain Competency %
5. Identify 3-6 critical missing skills / ATS keywords needed to rank higher for "${targetRole}".
6. Provide 3-5 specific, actionable bullet points to optimize the resume for "${targetRole}".

Candidate Resume Content:
"${cleanResumeText.slice(0, 8000)}"

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

    // ---------------------------------------------------------
    // PRIMARY EXTERNAL AI SERVICE: GOOGLE GEMINI AI
    // ---------------------------------------------------------
    if (geminiKey && !geminiKey.includes('your_gemini_key_here')) {
      console.log('[Gemini API Initiated] Calling Google Gemini API with key from server/.env...');
      const geminiModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp', 'gemini-1.0-pro'];
      let lastGeminiErr = '';

      for (const modelName of geminiModels) {
        // Try both v1beta and v1 endpoints
        const endpoints = [
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
          `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${geminiKey}`
        ];

        for (const url of endpoints) {
          try {
            const res = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': geminiKey
              },
              body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
            });

            if (res.ok) {
              const geminiData = await res.json();
              let rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
              rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

              let parsed = JSON.parse(rawText);
              const score = Number(parsed.ats_score || parsed.sde_fit_score) || 78;

              return {
                target_role: targetRole,
                ats_score: score,
                sde_fit_score: score,
                keyword_match_score: Number(parsed.keyword_match_score) || Math.min(98, score + 4),
                impact_score: Number(parsed.impact_score) || Math.max(55, score - 6),
                format_score: Number(parsed.format_score) || 88,
                technical_depth_score: Number(parsed.technical_depth_score) || score,
                detected_skills: Array.isArray(parsed.detected_skills) && parsed.detected_skills.length > 0 ? parsed.detected_skills : ['Technical Fundamentals'],
                recommended_skills_to_learn: Array.isArray(parsed.missing_skills) && parsed.missing_skills.length > 0 ? parsed.missing_skills : ['System Architecture'],
                portfolio_analyzed: Boolean(portfolioUrl),
                matched_mentors: allMentors.slice(0, 3),
                actionable_advice: Array.isArray(parsed.actionable_advice) && parsed.actionable_advice.length > 0 ? parsed.actionable_advice : ['Incorporate core missing industry keywords into your project experience.'],
                ai_provider: `Google Gemini AI (${modelName})`
              };
            } else {
              const errData = await res.json().catch(() => ({}));
              lastGeminiErr = errData.error?.message || `HTTP ${res.status}`;
              console.error(`[Gemini API Warning - ${modelName}]: ${lastGeminiErr}`);
            }
          } catch (err) {
            lastGeminiErr = err.message;
            console.warn(`[Gemini API Exception - ${modelName}]:`, err.message);
          }
        }
      }

      // If Gemini Key was provided, throw Gemini error directly instead of falling back to Groq
      throw new ApiError(400, `Google Gemini API Error: ${lastGeminiErr}. Please check GEMINI_API_KEY in server/.env`);
    }

    // ---------------------------------------------------------
    // FALLBACK EXTERNAL AI SERVICE: GROQ CLOUD AI (Active Non-Deprecated Models)
    // ---------------------------------------------------------
    if (groqKey && !groqKey.includes('your_groq_key_here')) {
      console.log('[Groq API Initiated] Calling Groq Cloud API with key from server/.env...');
      // Officially active non-decommissioned Groq model identifiers
      const groqModels = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'gemma2-9b-it', 'deepseek-r1-distill-llama-70b'];
      let lastGroqErr = '';

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
                { role: 'system', content: 'You are an expert AI ATS Resume Evaluator. Output valid JSON only.' },
                { role: 'user', content: promptText }
              ],
              response_format: { type: 'json_object' }
            })
          });

          if (response.ok) {
            const aiData = await response.json();
            const parsed = JSON.parse(aiData.choices[0]?.message?.content || '{}');
            const score = Number(parsed.ats_score) || 85;

            return {
              target_role: targetRole,
              ats_score: score,
              sde_fit_score: score,
              keyword_match_score: Number(parsed.keyword_match_score) || Math.min(98, score + 3),
              impact_score: Number(parsed.impact_score) || Math.max(60, score - 5),
              format_score: Number(parsed.format_score) || 92,
              technical_depth_score: Number(parsed.technical_depth_score) || score,
              detected_skills: parsed.detected_skills || ['Software Engineering'],
              recommended_skills_to_learn: parsed.missing_skills || ['System Architecture'],
              portfolio_analyzed: Boolean(portfolioUrl),
              matched_mentors: allMentors.slice(0, 3),
              actionable_advice: parsed.actionable_advice || ['Quantify project metrics for ATS optimization.'],
              ai_provider: `Groq Cloud AI (${groqModel})`
            };
          } else {
            const errData = await response.json().catch(() => ({}));
            lastGroqErr = errData.error?.message || `HTTP ${response.status}`;
            console.error(`[Groq API Warning - ${groqModel}]: ${lastGroqErr}`);
          }
        } catch (groqErr) {
          lastGroqErr = groqErr.message;
        }
      }

      if (lastGroqErr) {
        throw new ApiError(400, `Groq Cloud API Error: ${lastGroqErr}. Please check GROQ_API_KEY in server/.env`);
      }
    }

    // If no valid key is provided in server/.env, inform developer
    if (!geminiKey || geminiKey.includes('your_gemini_key_here')) {
      throw new ApiError(
        400,
        'External AI API Key missing! Please paste your real Google Gemini API Key into server/.env (GEMINI_API_KEY=AIzaSy...). Get a free key at https://aistudio.google.com/'
      );
    }

    // 3. FALLBACK: Comprehensive Built-In Intelligent ATS Analyzer Engine
    const textLower = (cleanResumeText + ' ' + targetRole).toLowerCase();
    
    // Skill dictionary across multiple engineering & tech domains
    const commonTechSkills = [
      'React', 'JavaScript', 'TypeScript', 'Node.js', 'Express', 'Python', 'Java', 'C++', 'C#', '.NET',
      'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'SQL', 'MySQL', 'MongoDB', 'PostgreSQL', 'Redis',
      'Git', 'GitHub', 'AWS', 'Docker', 'Kubernetes', 'CI/CD', 'REST API', 'GraphQL',
      'Data Structures', 'Algorithms', 'System Design', 'OOP', 'Machine Learning', 'Data Science',
      'SOLIDWORKS', 'AutoCAD', 'ANSYS', 'MATLAB', 'CAD', 'Thermodynamics', 'FEA', 'PLC', 'VHDL'
    ];

    const detectedSkills = [];
    const missingSkills = [];
    const missingDomainIds = [];

    // Match skills dynamically
    commonTechSkills.forEach(skill => {
      if (textLower.includes(skill.toLowerCase())) {
        detectedSkills.push(skill);
      }
    });

    if (dbDomains && dbDomains.length > 0) {
      dbDomains.forEach(domain => {
        const domainNameLower = domain.name.toLowerCase();
        const isDetected = textLower.includes(domainNameLower);
        if (isDetected) {
          if (!detectedSkills.includes(domain.name)) detectedSkills.push(domain.name);
        } else {
          missingSkills.push(domain.name);
          missingDomainIds.push(domain.id);
        }
      });
    }

    if (detectedSkills.length === 0) {
      detectedSkills.push('Software Fundamentals', 'Problem Solving', 'Project Development', 'Technical Skills');
    }

    // Target role specific keyword requirements & missing skills enhancement
    const roleLower = targetRole.toLowerCase();
    if (roleLower.includes('software') || roleLower.includes('sde') || roleLower.includes('developer')) {
      if (!textLower.includes('system design')) missingSkills.unshift('System Design & Microservices');
      if (!textLower.includes('data structures') && !textLower.includes('dsa')) missingSkills.unshift('Data Structures & Algorithms');
      if (!textLower.includes('docker') && !textLower.includes('container')) missingSkills.unshift('Docker & Containerization');
    } else if (roleLower.includes('data') || roleLower.includes('machine learning')) {
      if (!textLower.includes('python')) missingSkills.unshift('Python & Data Analysis Libraries');
      if (!textLower.includes('sql')) missingSkills.unshift('SQL Query Optimization');
      if (!textLower.includes('scikit') && !textLower.includes('tensorflow')) missingSkills.unshift('Machine Learning Frameworks');
    }

    // Filter unique missing skills
    const uniqueMissing = [...new Set(missingSkills)].slice(0, 5);

    const matchedCount = detectedSkills.length;
    const baseAtsScore = Math.min(95, Math.max(62, Math.round(matchedCount * 7 + 48 + (portfolioUrl ? 5 : 0))));

    const matchedMentors = allMentors
      .filter(m => m.expertise_domains.some(d => missingDomainIds.includes(d.id)))
      .slice(0, 3);

    const fallbackMentors = matchedMentors.length > 0 ? matchedMentors : allMentors.slice(0, 3);

    return {
      target_role: targetRole,
      ats_score: baseAtsScore,
      sde_fit_score: baseAtsScore,
      keyword_match_score: Math.min(98, baseAtsScore + 4),
      impact_score: Math.max(52, baseAtsScore - 7),
      format_score: 90,
      technical_depth_score: baseAtsScore,
      detected_skills: detectedSkills,
      recommended_skills_to_learn: uniqueMissing.length > 0 ? uniqueMissing : ['System Architecture', 'Cloud Deployment'],
      portfolio_analyzed: Boolean(portfolioUrl),
      matched_mentors: fallbackMentors,
      actionable_advice: [
        `Align your resume structure strictly with standard ATS formatting for "${targetRole}".`,
        `Add missing target role keywords: ${uniqueMissing.slice(0, 3).join(', ') || 'System Design'}.`,
        `Quantify achievements in project descriptions (e.g., "Reduced latency by 35% using Redis caching").`,
        `Connect with verified alumni mentor ${fallbackMentors[0]?.name || 'Verified Alumni'} for a 1-on-1 resume review.`
      ],
      ai_provider: 'CampusBridge Real-Time AI ATS Engine'
    };
  }
}

export const recommendationService = new RecommendationService();
