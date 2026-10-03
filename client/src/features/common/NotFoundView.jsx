import React from 'react';

export const NotFoundView = ({ onNavigateHome, onNavigateExplore }) => {
  return (
    <div style={{ maxWidth: '640px', margin: '4rem auto 6rem', padding: '0 1.5rem', textAlign: 'center' }}>
      <div className="glass-panel" style={{ padding: '3.5rem 2rem', borderRadius: 'var(--radius-lg)' }}>
        
        {/* Visual 404 Accent Tag */}
        <div style={{ fontSize: '5rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.05em', color: 'var(--primary)', marginBottom: '0.5rem', opacity: 0.9 }}>
          404
        </div>

        <span className="badge badge-amber" style={{ marginBottom: '1.25rem' }}>
          Page Not Found
        </span>

        <h1 style={{ fontSize: '1.75rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
          We Couldn't Find That Page
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.975rem', lineHeight: '1.6', marginBottom: '2rem', maxWidth: '480px', margin: '0 auto 2rem' }}>
          The link you followed may be broken, expired, or the requested page has been moved. You can navigate back or explore our verified alumni network.
        </p>

        {/* Helpful Links Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem', textAlign: 'left' }}>
          <div
            onClick={onNavigateHome}
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-card)',
              cursor: 'pointer',
              transition: 'transform 0.15s ease'
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
              🏠 Landing Page
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Return to the CampusBridge home overview
            </div>
          </div>

          <div
            onClick={onNavigateExplore}
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-card)',
              cursor: 'pointer',
              transition: 'transform 0.15s ease'
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
              🔍 Explore Mentors
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Search alumni across AI, Full-Stack, Cloud & Core
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button onClick={onNavigateHome} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
          Back to CampusBridge Home
        </button>

      </div>
    </div>
  );
};
