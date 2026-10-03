import React from 'react';

export const ThankYouView = ({
  title = "Submission Received Successfully!",
  subtitle = "Thank you for connecting through CampusBridge. Your request has been recorded.",
  actionType = "default",
  onNavigateDashboard,
  onNavigateHome,
  onNavigateExplore
}) => {
  return (
    <div style={{ maxWidth: '680px', margin: '3rem auto 5rem', padding: '0 1.5rem', textAlign: 'center' }}>
      <div className="glass-panel" style={{ padding: '3.5rem 2.5rem', borderRadius: 'var(--radius-lg)' }}>
        
        {/* Animated Checkmark Icon Badge */}
        <div
          style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 1.75rem',
            borderRadius: '50%',
            background: 'rgba(5, 150, 105, 0.1)',
            border: '2px solid var(--accent-emerald)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-emerald)',
            fontSize: '2.5rem'
          }}
        >
          ✓
        </div>

        <span className="badge badge-emerald" style={{ marginBottom: '1rem' }}>
          Action Confirmed
        </span>

        <h1 style={{ fontSize: '1.85rem', color: 'var(--text-main)', marginBottom: '0.85rem' }}>
          {title}
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem', maxWidth: '520px', margin: '0 auto 2rem' }}>
          {subtitle}
        </p>

        {/* Informational Guidance Cards */}
        <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '2.25rem', textAlign: 'left', border: '1px solid var(--border-card)' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>📌</span> What happens next?
          </h3>
          <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.6' }}>
            <li><strong>Notification:</strong> An update will be posted in your notification feed when the mentor responds.</li>
            <li><strong>Admin Review:</strong> Profile verifications are processed within 24 to 48 working hours.</li>
            <li><strong>Track Status:</strong> You can review the real-time status of all your requests directly in your dashboard.</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {onNavigateDashboard && (
            <button onClick={onNavigateDashboard} className="btn btn-primary">
              Go to My Dashboard
            </button>
          )}
          {onNavigateExplore && (
            <button onClick={onNavigateExplore} className="btn btn-secondary">
              Explore More Mentors
            </button>
          )}
          {onNavigateHome && (
            <button onClick={onNavigateHome} className="btn btn-secondary">
              Return to Home
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
