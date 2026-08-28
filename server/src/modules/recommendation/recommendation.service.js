import { recommendationRepository } from './recommendation.repository.js';
import { ApiError } from '../../shared/ApiError.js';
import { config } from '../../config/env.js';

export class RecommendationService {
  async getRecommendedMentors(studentUser) {
    if (studentUser.role !== 'STUDENT') 
      {
      throw new ApiError(403, 'Recommendation engine is tailored for students');
    }

    const studentProfile = (await recommendationRepository.findStudentProfile(studentUser.id)) || { interests: [] };
    const studentInterests = studentProfile.interests || [];

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

  async analyzeResume(studentUser, { resumeText = '', targetRole = 'Software Development Engineer', portfolioUrl = '', fileBase64 = '', fileMimeType = '' }) {
    if (studentUser.role !== 'STUDENT') {
      throw new ApiError(403, 'Resume analysis is available for students');
    }

    const openAiApiKey = (process.env.OPENAI_API_KEY || config.openaiApiKey || '').trim();
    const geminiApiKey = (process.env.GEMINI_API_KEY || config.geminiApiKey || '').trim();

    const dbDomains = await recommendationRepository.findAllDomains();
    const allMentors = await this.getRecommendedMentors(studentUser);

    // 1. IF GEMINI_API_KEY is configured in .env, call Google Gemini Multimodal Vision/Document Engine
    if (geminiApiKey) {
      console.log('[Gemini API Initiated] Calling Google Gemini API with key:', geminiApiKey.slice(0, 10) + '...');
      
      const promptText = `You are a strict, precise AI Resume Evaluator & Career Advisor. 
Carefully read and analyze the entire attached resume document and text content.
Determine the candidate's actual engineering background (e.g. Mechanical, Civil, Electrical, Software, Data Science, etc.).
Target Role requested by user: "${targetRole}".

Task:
1. Extract ALL actual technical skills, software tools, programming languages, and engineering concepts explicitly mentioned in the candidate's resume (e.g. SOLIDWORKS, Thermodynamics, AutoCAD, FEA, Python, Java, React, SQL, MATLAB, CNC).
2. Identify missing skill gaps required to succeed in the target role ("${targetRole}").
3. Calculate an accurate readiness fit score (0-100%) comparing the candidate's actual resume skills against the target role. (For example, if a Mechanical Engineer applies for Software SDE without programming skills, score should realistically be 35%-50% with missing skills like Data Structures, Databases, Web Development).
4. Provide clear, actionable advice.

Resume Additional Text: "${resumeText}"

Return RAW JSON ONLY with NO markdown formatting block:
{
  "sde_fit_score": <number 0-100>,
  "detected_skills": ["<skill1>", "<skill2>"],
  "missing_skills": ["<missing1>", "<missing2>"],
  "actionable_advice": ["<advice1>", "<advice2>"]
}`;

      const parts = [];

      // Normalize MIME type for Google Gemini inline_data
      if (fileBase64 && fileBase64.trim()) {
        let normalizedMime = 'application/pdf';
        if (fileMimeType.includes('image/')) normalizedMime = fileMimeType;
        else if (fileMimeType.includes('text/')) normalizedMime = 'text/plain';
        else if (fileMimeType.includes('pdf')) normalizedMime = 'application/pdf';

        parts.push({
          inline_data: {
            mime_type: normalizedMime,
            data: fileBase64
          }
        });
      }

      parts.push({ text: promptText });

      // Prioritize multimodal Gemini models (gemini-flash-latest, gemini-3.6-flash, gemini-3.5-flash) over text-only Gemma models
      let geminiModels = ['gemini-flash-latest', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-pro-latest', 'gemini-1.5-flash'];
      try {
        const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`, {
          headers: { 'x-goog-api-key': geminiApiKey }
        });
        if (listRes.ok) {
          const listData = await listRes.json();
          if (Array.isArray(listData.models)) {
            const discovered = listData.models
              .filter(m => {
                const name = m.name.toLowerCase();
                return m.supportedGenerationMethods?.includes('generateContent') &&
                       name.includes('gemini') &&
                       !name.includes('gemma') &&
                       !name.includes('tts') &&
                       !name.includes('clip') &&
                       !name.includes('robotics') &&
                       !name.includes('lyria');
              })
              .map(m => m.name.replace('models/', ''));

            if (discovered.length > 0) {
              const priorityModels = ['gemini-flash-latest', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-pro-latest', 'gemini-1.5-flash'];
              geminiModels = [
                ...priorityModels.filter(p => discovered.includes(p)),
                ...discovered.filter(d => !priorityModels.includes(d))
              ];
              console.log('[Gemini Filtered Multimodal Models]:', geminiModels);
            }
          }
        }
      } catch (listErr) {
        console.warn('[Gemini ListModels Warning]:', listErr.message);
      }

      let geminiData = null;
      let activeModel = '';
      let lastApiErrorText = '';

      for (const modelName of geminiModels) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': geminiApiKey
            },
            body: JSON.stringify({
              contents: [{ parts }]
            })
          });

          if (res.ok) {
            geminiData = await res.json();
            activeModel = modelName;
            console.log(`[Google Gemini AI Multimodal Success] Model '${activeModel}' analyzed resume document!`);
            break;
          } else {
            const errText = await res.text();
            lastApiErrorText = `Status ${res.status} on model ${modelName}: ${errText}`;
            console.warn(`[Gemini Model ${modelName} Error]`, errText);
          }
        } catch (fetchErr) {
          lastApiErrorText = fetchErr.message;
        }
      }

      if (geminiData) {
        let rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        let parsed = {};
        try {
          parsed = JSON.parse(rawText);
        } catch (jsonErr) {
          console.warn('[Gemini Response JSON Parse Error] Raw text was:', rawText);
          parsed = { sde_fit_score: 55, detected_skills: ['Engineering Fundamentals'], missing_skills: ['Data Structures', 'Web Development'] };
        }

        return {
          target_role: targetRole,
          sde_fit_score: Number(parsed.sde_fit_score) || 60,
          detected_skills: Array.isArray(parsed.detected_skills) && parsed.detected_skills.length > 0 ? parsed.detected_skills : ['Technical Fundamentals'],
          recommended_skills_to_learn: Array.isArray(parsed.missing_skills) && parsed.missing_skills.length > 0 ? parsed.missing_skills : ['System Architecture'],
          portfolio_analyzed: Boolean(portfolioUrl),
          matched_mentors: allMentors.slice(0, 3),
          actionable_advice: Array.isArray(parsed.actionable_advice) && parsed.actionable_advice.length > 0 ? parsed.actionable_advice : ['Connect with verified alumni mentors for guidance.'],
          ai_provider: `Google Gemini Multimodal AI (${activeModel})`
        };
      } else {
        throw new ApiError(400, `Google Gemini API error: ${lastApiErrorText}`);
      }
    }

    // 2. IF OPENAI_API_KEY is configured in .env, call ChatGPT OpenAI Engine
    if (openAiApiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiApiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are an expert AI Career Coach & Resume Evaluator. Output valid JSON only with keys: sde_fit_score (number 0-100), detected_skills (array), missing_skills (array), actionable_advice (array).'
              },
              {
                role: 'user',
                content: `Analyze resume text: "${resumeText}" for target role "${targetRole}". Portfolio: "${portfolioUrl}"`
              }
            ],
            response_format: { type: 'json_object' }
          })
        });

        if (response.ok) {
          const aiData = await response.json();
          const parsed = JSON.parse(aiData.choices[0]?.message?.content || '{}');

          return {
            target_role: targetRole,
            sde_fit_score: parsed.sde_fit_score || 85,
            detected_skills: parsed.detected_skills || ['Software Development'],
            recommended_skills_to_learn: parsed.missing_skills || ['System Architecture'],
            portfolio_analyzed: Boolean(portfolioUrl),
            matched_mentors: allMentors.slice(0, 3),
            actionable_advice: parsed.actionable_advice || ['Schedule a 1-on-1 session with alumni mentors.'],
            ai_provider: 'ChatGPT OpenAI GPT-4o Engine'
          };
        }
      } catch (aiErr) {
        console.warn('[OpenAI Warning] OpenAI API call failed:', aiErr.message);
      }
    }

    // 3. FALLBACK: Real-Time MySQL Natural Language Domain Processing Engine
    const textLower = (resumeText + ' ' + targetRole).toLowerCase();
    const detectedSkills = [];
    const missingSkills = [];
    const missingDomainIds = [];

    if (dbDomains && dbDomains.length > 0) {
      dbDomains.forEach(domain => {
        const domainKeywords = [
          domain.name.toLowerCase(),
          ...(domain.description || '').toLowerCase().split(/\s+/).filter(w => w.length > 3)
        ];

        const isDetected = domainKeywords.some(kw => textLower.includes(kw));
        if (isDetected) {
          detectedSkills.push(domain.name);
        } else {
          missingSkills.push(domain.name);
          missingDomainIds.push(domain.id);
        }
      });
    }

    if (detectedSkills.length === 0) {
      detectedSkills.push('Problem Solving & Technical Fundamentals');
    }

    const totalDomainsCount = Math.max(dbDomains.length, 1);
    const rawCoverageRate = (detectedSkills.length / totalDomainsCount);
    const sdeFitScore = Math.min(98, Math.max(45, Math.round(rawCoverageRate * 55 + 40 + (portfolioUrl ? 8 : 0))));

    const matchedMentors = allMentors
      .filter(m => m.expertise_domains.some(d => missingDomainIds.includes(d.id)))
      .slice(0, 3);

    const fallbackMentors = matchedMentors.length > 0 ? matchedMentors : allMentors.slice(0, 3);

    return {
      target_role: targetRole,
      sde_fit_score: sdeFitScore,
      detected_skills: detectedSkills,
      recommended_skills_to_learn: missingSkills.slice(0, 5),
      portfolio_analyzed: Boolean(portfolioUrl),
      matched_mentors: fallbackMentors,
      actionable_advice: [
        `Focus on mastering ${missingSkills[0] || 'System Architecture'} to boost your readiness score.`,
        `Schedule a 1-on-1 mock interview session with alumni mentor ${fallbackMentors[0]?.name || 'Verified Alumni'}.`
      ],
      ai_provider: 'CampusBridge Real-Time AI Skill Engine'
    };
  }
}

export const recommendationService = new RecommendationService();
