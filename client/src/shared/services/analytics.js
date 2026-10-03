/**
 * CampusBridge Analytics Service (Item 18)
 * Privacy-friendly client-side event tracking.
 * Logs page views, clicks, and conversions for internal reporting.
 */

const ANALYTICS_KEY = 'cb_analytics_events';
const SESSION_KEY = 'cb_session_id';
const CONSENT_KEY = 'cb_cookie_consent';

const getSessionId = () => {
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return 's-fallback';
  }
};

const hasConsent = () => {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'accepted';
  } catch {
    return false;
  }
};

const store = (event) => {
  if (!hasConsent()) return;
  try {
    const existing = JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '[]');
    existing.push({ ...event, ts: new Date().toISOString(), sid: getSessionId() });
    // Keep only last 200 events
    const trimmed = existing.slice(-200);
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(trimmed));
  } catch {
    // silently fail on storage errors
  }
};

export const analytics = {
  /**
   * Initialize analytics session
   */
  init: () => {
    getSessionId();
  },

  /**
   * Check if user has answered the consent prompt
   */
  hasConsented: () => {
    try {
      return localStorage.getItem(CONSENT_KEY) !== null;
    } catch {
      return false;
    }
  },

  /**
   * Record user cookie consent decision
   */
  setConsent: (accepted) => {
    try {
      localStorage.setItem(CONSENT_KEY, accepted ? 'accepted' : 'declined');
    } catch {
      // ignore
    }
  },

  /**
   * Track a page view when active tab changes
   */
  pageView: (tab, userRole = 'guest') => {
    store({ event: 'page_view', tab, userRole });
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', { page_title: tab, user_role: userRole });
    }
  },

  /**
   * Alias for pageView (Item 2/18)
   */
  trackPageView: (tab, userRole = 'guest') => {
    analytics.pageView(tab, userRole);
  },

  /**
   * Track a user action (button click, form submission, etc.)
   */
  track: (action, properties = {}) => {
    store({ event: action, ...properties });
  },

  /**
   * Track mentorship request submission
   */
  mentorshipRequested: (mentorId, domainId) => {
    store({ event: 'mentorship_requested', mentorId, domainId });
  },

  /**
   * Track resume analysis completion
   */
  resumeAnalyzed: (targetRole, aiProvider, atsScore) => {
    store({ event: 'resume_analyzed', targetRole, aiProvider, atsScore });
  },

  /**
   * Track user registration
   */
  userRegistered: (role) => {
    store({ event: 'user_registered', role });
  },

  /**
   * Track login
   */
  userLoggedIn: (role) => {
    store({ event: 'user_login', role });
  },

  /**
   * Get all stored events for internal dashboard
   */
  getEvents: () => {
    try {
      return JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '[]');
    } catch {
      return [];
    }
  },

  /**
   * Clear all stored events
   */
  clearEvents: () => {
    try {
      localStorage.removeItem(ANALYTICS_KEY);
    } catch {
      // ignore
    }
  }
};

export default analytics;
