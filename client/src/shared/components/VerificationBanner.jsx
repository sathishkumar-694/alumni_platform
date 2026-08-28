import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, ShieldAlert, CheckCircle } from 'lucide-react';

export const VerificationBanner = () => {
  const { user } = useAuth();

  if (!user || user.verification_status === 'VERIFIED' || user.role === 'ADMIN') {
    return null;
  }

  return (
    <div
      style={{
        maxWidth: '1280px',
        margin: '1rem auto 0',
        padding: '0.85rem 1.25rem',
        borderRadius: '12px',
        background: user.verification_status === 'PENDING' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(244, 63, 94, 0.12)',
        border: `1px solid ${user.verification_status === 'PENDING' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        gap: '1rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {user.verification_status === 'PENDING' ? (
          <Clock size={20} color="#fbbf24" />
        ) : (
          <ShieldAlert size={20} color="#f87171" />
        )}
        <div>
          <h4 style={{ fontSize: '0.925rem', color: user.verification_status === 'PENDING' ? '#fbbf24' : '#f87171' }}>
            {user.verification_status === 'PENDING'
              ? 'Verification Under Administrative Review'
              : 'Verification Status: ' + user.verification_status}
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {user.verification_status === 'PENDING'
              ? `Your uploaded ${user.role === 'STUDENT' ? 'Student ID' : 'Alumni ID'} card and credentials are currently being reviewed by the Mentorship Operations Center.`
              : 'Please contact administration or update your verification documents to unlock full platform access.'}
          </p>
        </div>
      </div>
      <span className={`badge ${user.verification_status === 'PENDING' ? 'badge-amber' : 'badge-rose'}`}>
        {user.verification_status}
      </span>
    </div>
  );
};
