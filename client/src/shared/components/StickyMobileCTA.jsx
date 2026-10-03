import React, { useState, useEffect } from 'react';

export const StickyMobileCTA = ({
  user,
  onOpenRegister,
  onNavigateExplore,
  onNavigateResumeAnalyzer
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky CTA once scrolled down 200px
      if (window.scrollY > 200 && !isDismissed) {
        setIsVisible(true);
      } else if (window.scrollY <= 100) {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  if (!isVisible || isDismissed) return null;

  return (
    <div
      className="sticky-mobile-cta"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 999,
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border-card)',
        boxShadow: '0 -4px 16px rgba(15, 23, 42, 0.12)',
        padding: '0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom, 0px))',
        display: 'none', // Shown via CSS media query @media (max-width: 768px)
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem'
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: '0.825rem', color: 'var(--text-main)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {!user ? "Connect with BIT Alumni" : "Advance Your Career"}
        </p>
        <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', margin: 0 }}>
          {!user ? "1-on-1 mentorship & job referrals" : "AI resume check & bookings"}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        {!user ? (
          <>
            <button
              onClick={onNavigateExplore}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.65rem' }}
            >
              Explore
            </button>
            <button
              onClick={onOpenRegister}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', whiteSpace: 'nowrap' }}
            >
              Join Now
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onNavigateResumeAnalyzer}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.65rem' }}
            >
              AI Resume
            </button>
            <button
              onClick={onNavigateExplore}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
            >
              Find Mentors
            </button>
          </>
        )}

        {/* Dismiss Button */}
        <button
          onClick={() => setIsDismissed(true)}
          aria-label="Dismiss sticky CTA"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-subtle)',
            cursor: 'pointer',
            fontSize: '1rem',
            padding: '0.2rem',
            lineHeight: 1
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};
