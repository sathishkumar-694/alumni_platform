import React from 'react';

/**
 * Reusable Skeleton Loader Component (Item 12)
 * Provides animated shimmer placeholders for improved perceived UX.
 */
export const SkeletonLoader = ({ type = 'card', count = 3 }) => {
  const items = Array.from({ length: count }, (_, i) => i);

  if (type === 'table') {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {items.map((i) => (
          <div
            key={i}
            className="skeleton-pulse"
            style={{
              height: '48px',
              width: '100%',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-subtle)'
            }}
          />
        ))}
      </div>
    );
  }

  if (type === 'mentor') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {items.map((i) => (
          <div
            key={i}
            className="glass-panel"
            style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                className="skeleton-pulse"
                style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--bg-subtle)', flexShrink: 0 }}
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="skeleton-pulse" style={{ height: '18px', width: '70%', background: 'var(--bg-subtle)', borderRadius: '4px' }} />
                <div className="skeleton-pulse" style={{ height: '14px', width: '90%', background: 'var(--bg-subtle)', borderRadius: '4px' }} />
              </div>
            </div>
            <div className="skeleton-pulse" style={{ height: '36px', width: '100%', background: 'var(--bg-subtle)', borderRadius: '4px' }} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div className="skeleton-pulse" style={{ height: '24px', width: '30%', background: 'var(--bg-subtle)', borderRadius: '12px' }} />
              <div className="skeleton-pulse" style={{ height: '24px', width: '30%', background: 'var(--bg-subtle)', borderRadius: '12px' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default: generic card grid
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
      {items.map((i) => (
        <div
          key={i}
          className="glass-panel"
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}
        >
          <div className="skeleton-pulse" style={{ height: '24px', width: '60%', background: 'var(--bg-subtle)', borderRadius: '4px' }} />
          <div className="skeleton-pulse" style={{ height: '14px', width: '100%', background: 'var(--bg-subtle)', borderRadius: '4px' }} />
          <div className="skeleton-pulse" style={{ height: '14px', width: '80%', background: 'var(--bg-subtle)', borderRadius: '4px' }} />
          <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="skeleton-pulse" style={{ height: '20px', width: '25%', background: 'var(--bg-subtle)', borderRadius: '4px' }} />
            <div className="skeleton-pulse" style={{ height: '32px', width: '35%', background: 'var(--bg-subtle)', borderRadius: '6px' }} />
          </div>
        </div>
      ))}
    </div>
  );
};
