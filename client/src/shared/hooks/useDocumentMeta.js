import { useEffect } from 'react';

const tabMeta = {
  home: {
    title: 'CampusBridge – University Alumni Mentorship & Career Platform',
    description: 'Connect with verified BIT alumni mentors for 1-on-1 career guidance, domain upskilling, and placement support. Join CampusBridge today.'
  },
  dashboard: {
    title: 'My Dashboard | CampusBridge',
    description: 'View your mentorship progress, active sessions, interested domains, and career analytics on your CampusBridge dashboard.'
  },
  explore: {
    title: 'Technical Domain Directory | CampusBridge',
    description: 'Explore all technical domains – AI/ML, Cloud & DevOps, Software Engineering, Cybersecurity, and more. Find alumni mentors for each field.'
  },
  announcements: {
    title: 'University Feed & Announcements | CampusBridge',
    description: 'Stay updated with latest placement drives, internship opportunities, campus events, and university announcements on CampusBridge.'
  },
  resources: {
    title: 'Study Resources & Materials | CampusBridge',
    description: 'Access curated study materials, interview preparation guides, system design notes, and mentor-shared resources on CampusBridge.'
  },
  referrals: {
    title: 'Job Referrals & Opportunities | CampusBridge',
    description: 'Discover exclusive alumni job referrals, internship openings, and career opportunities on the CampusBridge referral portal.'
  },
  resume_analyzer: {
    title: 'AI Resume Analyzer | CampusBridge',
    description: 'Upload your resume and get instant AI-powered ATS compatibility analysis, skill gap detection, and actionable improvement tips powered by Google Gemini.'
  },
  recommended_mentors: {
    title: 'Recommended Alumni Mentors | CampusBridge',
    description: 'View alumni mentors personally recommended for your career goals and technical interests based on your profile and domain expertise.'
  },
  active_mentorships: {
    title: 'Active Mentorships | CampusBridge',
    description: 'Track your ongoing mentorship pairings, scheduled sessions, and milestone progress on CampusBridge.'
  },
  sessions: {
    title: '1-on-1 Sessions | CampusBridge',
    description: 'Schedule and manage your virtual 1-on-1 mentorship sessions with alumni mentors on CampusBridge.'
  },
  requests: {
    title: 'Mentorship Requests | CampusBridge',
    description: 'Manage your sent and received mentorship requests. Connect with the right alumni mentors on CampusBridge.'
  },
  profile: {
    title: 'My Profile & ID Credentials | CampusBridge',
    description: 'View and manage your CampusBridge profile, university ID credentials, and account verification status.'
  },
  admin_operations: {
    title: 'Admin Operations Center | CampusBridge',
    description: 'Manage user verifications, mentorship pairings, domain approvals, and platform analytics as CampusBridge administrator.'
  },
  privacy: {
    title: 'Privacy Policy | CampusBridge',
    description: 'Read the CampusBridge Privacy Policy to understand how we collect, use, and protect your personal data and university credentials.'
  },
  terms: {
    title: 'Terms & Conditions | CampusBridge',
    description: 'CampusBridge Terms and Conditions governing mentorship code of conduct, platform usage rules, and account policies.'
  },
  'thank-you': {
    title: 'Thank You! | CampusBridge',
    description: 'Your registration or mentorship request has been submitted successfully on CampusBridge.'
  }
};

/**
 * useDocumentMeta - Updates document.title and meta description dynamically
 * per active tab/view for SEO (Item 2 & 3).
 */
export const useDocumentMeta = (activeTab) => {
  useEffect(() => {
    const meta = tabMeta[activeTab] || tabMeta.home;

    // Update page title
    document.title = meta.title;

    // Update or create description meta tag
    let descTag = document.querySelector('meta[name="description"]');
    if (descTag) {
      descTag.setAttribute('content', meta.description);
    }

    // Update Open Graph title and description
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', meta.title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', meta.description);

    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', meta.title);

    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) twitterDesc.setAttribute('content', meta.description);
  }, [activeTab]);
};

export default useDocumentMeta;

