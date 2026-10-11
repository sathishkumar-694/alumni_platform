/**
 * CampusBridge Mentor Ranking & Evaluation Engine
 * Implements Multi-Criteria Scoring (Seniority Levels 1-5, Company Prestige Tiers, Achievements, Skill-Gap Matching)
 * Supports Option A (Resume Analyzer Matched Mentors), Option B (General Recommendations), and Option C (Hybrid Fast Cache & Zero-Fallback)
 */

// In-Memory Fast Cache for Option C
const rankingCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const evaluateMentorLevel = (profile = {}) => {
  const expYears = Number(profile.experience_years) || 1;
  const desig = (profile.designation || '').toLowerCase();

  // Level 5: Leadership / Principal / Director / VP / Fellow (10+ yrs or executive designation)
  if (
    expYears >= 10 ||
    desig.includes('director') ||
    desig.includes('vp') ||
    desig.includes('vice president') ||
    desig.includes('chief') ||
    desig.includes('principal') ||
    desig.includes('fellow') ||
    desig.includes('head of') ||
    desig.includes('partner') ||
    desig.includes('distinguished')
  ) {
    return {
      level: 5,
      level_name: 'Level 5 • Principal Architect / Executive',
      badge: '🏆 Level 5 Leader',
      title: 'Principal / Leadership',
      score: 30,
      color: '#e11d48'
    };
  }

  // Level 4: Senior / Staff / Tech Lead / Manager (5-9 yrs or senior designation)
  if (
    expYears >= 5 ||
    desig.includes('staff') ||
    desig.includes('senior') ||
    desig.includes('sr.') ||
    desig.includes('sr ') ||
    desig.includes('lead') ||
    desig.includes('tech lead') ||
    desig.includes('manager') ||
    desig.includes('architect')
  ) {
    return {
      level: 4,
      level_name: 'Level 4 • Senior Staff Engineer',
      badge: '⭐ Level 4 Senior',
      title: 'Senior / Staff Lead',
      score: 24,
      color: '#8b5cf6'
    };
  }

  // Level 3: Mid-Level Specialist (2-4 yrs)
  if (
    expYears >= 2 ||
    desig.includes('sde 2') ||
    desig.includes('sde ii') ||
    desig.includes('software engineer 2') ||
    desig.includes('consultant') ||
    desig.includes('specialist') ||
    desig.includes('developer') ||
    desig.includes('engineer')
  ) {
    return {
      level: 3,
      level_name: 'Level 3 • Mid-Level Specialist',
      badge: '🚀 Level 3 Specialist',
      title: 'Mid-Level Specialist',
      score: 18,
      color: '#3b82f6'
    };
  }

  // Level 2: Associate / Junior Engineer (1 yr)
  if (
    expYears >= 1 ||
    desig.includes('associate') ||
    desig.includes('junior') ||
    desig.includes('jr.') ||
    desig.includes('sde 1') ||
    desig.includes('analyst')
  ) {
    return {
      level: 2,
      level_name: 'Level 2 • Associate Engineer',
      badge: '🌱 Level 2 Associate',
      title: 'Associate Engineer',
      score: 12,
      color: '#10b981'
    };
  }

  // Level 1: Early Career / Trainee (< 1 yr)
  return {
    level: 1,
    level_name: 'Level 1 • Early Career',
    badge: '🎯 Level 1 Early Career',
    title: 'Early Career',
    score: 8,
    color: '#06b6d4'
  };
};

export const evaluateCompanyTier = (companyName = '') => {
  const company = companyName.toLowerCase().trim();

  // Tier 1: Global Tech Giants & Top-Tier Financial Tech
  const tier1Keywords = [
    'google', 'microsoft', 'amazon', 'apple', 'meta', 'netflix', 'uber',
    'adobe', 'stripe', 'nvidia', 'salesforce', 'oracle', 'goldman',
    'jpmorgan', 'jp morgan', 'morgan stanley', 'cisco', 'intel', 'qualcomm',
    'paypal', 'airbnb', 'atlassian', 'linkedin', 'twitter', 'x', 'byte dance'
  ];

  if (tier1Keywords.some(k => company.includes(k))) {
    return {
      tier: 1,
      tier_name: 'Tier-1 Big Tech Leader',
      tier_badge: '🏢 Tier-1 Tech Leader',
      score: 15,
      tag: 'Tier 1'
    };
  }

  // Tier 2: Product Unicorns & High-Growth Scale-Ups
  const tier2Keywords = [
    'swiggy', 'zomato', 'flipkart', 'razorpay', 'cred', 'zoho', 'freshworks',
    'postman', 'inmobi', 'phonepe', 'paytm', 'zepto', 'blinkit', 'groww',
    'zerodha', 'ola', 'meesho', 'browserstack', 'dream11', 'cars24'
  ];

  if (tier2Keywords.some(k => company.includes(k))) {
    return {
      tier: 2,
      tier_name: 'Product Unicorn Tech',
      tier_badge: '🚀 Product Unicorn',
      score: 10,
      tag: 'Tier 2'
    };
  }

  // Tier 3: Global Enterprise Consulting & Core Engineering
  const tier3Keywords = [
    'infosys', 'tcs', 'wipro', 'cognizant', 'accenture', 'capgemini',
    'ibm', 'hcl', 'l&t', 'larsen', 'bosch', 'siemens', 'mahindra',
    'deloitte', 'ey', 'pwc', 'kpmg', 'grid sink', 'honeywell', 'caterpillar'
  ];

  if (tier3Keywords.some(k => company.includes(k))) {
    return {
      tier: 3,
      tier_name: 'Global Enterprise Leader',
      tier_badge: '🏭 Global Enterprise',
      score: 6,
      tag: 'Tier 3'
    };
  }

  // Tier 4: Agile Tech & Startups
  return {
    tier: 4,
    tier_name: 'Agile Tech Company',
    tier_badge: '⚡ Tech Enterprise',
    score: 4,
    tag: 'Tier 4'
  };
};

export const generateMentorAchievements = (mentor, profile, levelInfo, companyInfo) => {
  const achievements = [];

  // 1. CampusBridge Institutional Verification
  achievements.push({
    id: 'verified',
    label: 'CampusBridge Verified Alumni',
    icon: 'ShieldCheck',
    variant: 'emerald'
  });

  // 2. Seniority Level Badge
  achievements.push({
    id: 'level',
    label: levelInfo.badge,
    icon: 'Award',
    variant: 'purple'
  });

  // 3. Company Prestige Badge
  achievements.push({
    id: 'company_tier',
    label: `${companyInfo.tier_badge} (${profile.company || 'Tech'})`,
    icon: 'Building',
    variant: 'blue'
  });

  // 4. Years of Industry Experience
  if (profile.experience_years && profile.experience_years >= 3) {
    achievements.push({
      id: 'experience',
      label: `${profile.experience_years}+ Yrs Industry Experience`,
      icon: 'Clock',
      variant: 'amber'
    });
  }

  // 5. Active Mentorship Capacity
  const availableSlots = Math.max(0, (profile.max_capacity || 5) - (profile.current_capacity || 0));
  if (availableSlots >= 2) {
    achievements.push({
      id: 'active_slots',
      label: `Available for Mentorship (${availableSlots} slots)`,
      icon: 'UserCheck',
      variant: 'cyan'
    });
  }

  // 6. Top 1% Career Mentor Accolade
  if (levelInfo.level >= 4) {
    achievements.push({
      id: 'top_mentor',
      label: 'Top 1% Career Advisor',
      icon: 'Sparkles',
      variant: 'gold'
    });
  }

  return achievements;
};

/**
 * Option A: Ranks Mentors specifically for Resume Analysis based on Detected Skill Gaps,
 * Seniority Level, and Company Prestige, providing AI reasoning & suggested session topics.
 */
export const rankMentorsForResumeGaps = (mentors = [], missingSkills = [], targetRole = 'Software Engineering') => {
  const missingLower = (missingSkills || []).map(s => s.toLowerCase());
  const roleLower = (targetRole || '').toLowerCase();

  const scoredMentors = mentors.map(m => {
    const profile = m.profile || {};
    const levelInfo = evaluateMentorLevel(profile);
    const companyInfo = evaluateCompanyTier(profile.company || '');
    const achievements = generateMentorAchievements(m, profile, levelInfo, companyInfo);

    // 1. Skill Gap Overlap Score (0-40)
    let domainOverlapPoints = 0;
    const coveredGaps = [];

    (m.expertise_domains || []).forEach(d => {
      const dName = (d.name || '').toLowerCase();
      const dDesc = (d.description || '').toLowerCase();

      missingLower.forEach(gap => {
        if (dName.includes(gap) || gap.includes(dName) || dDesc.includes(gap)) {
          if (!coveredGaps.includes(gap)) coveredGaps.push(gap);
          domainOverlapPoints += 15;
        }
      });

      if (dName.includes(roleLower) || roleLower.includes(dName)) {
        domainOverlapPoints += 10;
      }
    });

    domainOverlapPoints = Math.min(40, domainOverlapPoints);

    // 2. Base match calculation
    let totalScore = 30 + domainOverlapPoints + levelInfo.score + companyInfo.score;

    // Available slots bonus
    const availableSlots = profile.available_slots || Math.max(0, (profile.max_capacity || 5) - (profile.current_capacity || 0));
    if (availableSlots > 0) totalScore += 5;

    const finalMatchScore = Math.min(99, Math.max(55, Math.round(totalScore)));

    // AI Match Reason Formulation
    const primarySkill = coveredGaps[0] || (missingSkills[0] || 'core engineering competencies');
    const aiReason = `${m.name} is a ${levelInfo.title} at ${profile.company || 'Tech Leader'} with ${profile.experience_years || 2}+ years experience. Perfectly positioned to coach you on bridging missing skills in ${primarySkill} and mastering hiring benchmarks for ${targetRole}.`;

    // Suggested 1-on-1 Session Topics
    const sessionTopics = [
      `Deep Dive: Mastering ${primarySkill} for ${targetRole}`,
      `Resume & GitHub Project Critique (${profile.company} Hiring Standards)`,
      `1-on-1 Technical Mock Interview & Architecture Discussion`
    ];

    return {
      ...m,
      level_info: levelInfo,
      company_tier: companyInfo,
      achievements,
      covered_skill_gaps: coveredGaps,
      ai_match_score: finalMatchScore,
      ai_match_reason: aiReason,
      suggested_session_topics: sessionTopics
    };
  });

  // Sort descending by AI Match Score, then by Mentor Level
  scoredMentors.sort((a, b) => {
    if (b.ai_match_score !== a.ai_match_score) {
      return b.ai_match_score - a.ai_match_score;
    }
    return (b.level_info?.level || 0) - (a.level_info?.level || 0);
  });

  return scoredMentors.slice(0, 4);
};

/**
 * Option B: Multi-Criteria General Ranking for GET /api/v1/recommendation
 * Evaluates Level (30%), Company Prestige (15%), Domain Overlap (35%), Available Capacity (10%), Verification (10%)
 */
export const rankMentorsGeneral = (alumniList = [], studentInterests = [], allDomains = []) => {
  return alumniList.map(alumni => {
    const profile = alumni.profile || {};
    const mentorExpertise = profile.expertise || [];
    const sharedDomains = studentInterests.filter(dId => mentorExpertise.includes(dId));

    const levelInfo = evaluateMentorLevel(profile);
    const companyInfo = evaluateCompanyTier(profile.company || '');
    const achievements = generateMentorAchievements(alumni, profile, levelInfo, companyInfo);

    // 1. Domain Overlap Score (max 35)
    let domainScore = 20;
    if (studentInterests.length > 0) {
      domainScore = (sharedDomains.length / Math.max(studentInterests.length, 1)) * 35;
    }

    // 2. Level Score (max 30)
    const levelScore = levelInfo.score;

    // 3. Company Prestige Score (max 15)
    const companyScore = companyInfo.score;

    // 4. Available Slots Score (max 10)
    const availableSlots = Math.max(0, (profile.max_capacity || 5) - (profile.current_capacity || 0));
    const capacityScore = availableSlots > 0 ? 10 : 0;

    // 5. Verification Score (max 10)
    const verificationScore = alumni.verification_status === 'VERIFIED' ? 10 : 5;

    // Composite 0-100 Score
    const compositeScore = Math.min(99, Math.round(domainScore + levelScore + companyScore + capacityScore + verificationScore * 0.5));

    const domainObjects = mentorExpertise.map(dId => allDomains.find(d => d.id === dId)).filter(Boolean);

    return {
      id: alumni.id,
      name: alumni.name,
      email: alumni.email,
      verification_status: alumni.verification_status,
      profile: {
        ...profile,
        available_slots: availableSlots
      },
      expertise_domains: domainObjects,
      shared_domains_count: sharedDomains.length,
      level_info: levelInfo,
      company_tier: companyInfo,
      achievements,
      match_score: compositeScore
    };
  }).sort((a, b) => b.match_score - a.match_score);
};

/**
 * Option C: Fast Cache Engine with Zero-Failure Invalidation
 */
export const getCachedOrCompute = (cacheKey, computeFn) => {
  const cached = rankingCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const freshData = computeFn();
  rankingCache.set(cacheKey, { data: freshData, timestamp: Date.now() });
  return freshData;
};
