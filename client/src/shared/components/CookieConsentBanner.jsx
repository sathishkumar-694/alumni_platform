import React, { useState, useEffect } from 'react';
import analytics from '../services/analytics';

export const CookieConsentBanner = ({ onNavigatePrivacy }) => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already made a decision
    if (!analytics.hasConsented()) {
      // Small timeout for smooth entry animation
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    analytics.setConsent(true);
    analytics.track('cookie_consent_accepted');
    setShowBanner(false);
  };

  const handleDecline = () => {
    analytics.setConsent(false);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent banner"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '1.5rem',
        right: '1.5rem',
        maxWidth: '520px',
        zIndex: 10001,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.18)',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        backdropFilter: 'blur(8px)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>🍪</span>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            We Value Your Academic Privacy
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
            CampusBridge uses essential cookies and privacy-friendly local analytics to keep you authenticated, remember preferences, and improve the mentorship matching experience.{' '}
            <button
              onClick={onNavigatePrivacy}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                padding: 0,
                fontSize: '0.8rem',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Learn more in our Privacy Policy
            </button>
            .
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.25rem' }}>
        <button
          onClick={handleDecline}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
        >
          Essential Only
        </button>
        <button
          onClick={handleAccept}
          className="btn btn-primary btn-sm"
          style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
        >
          Accept All
        </button>
      </div>
    </div>
  );
};
