import React, { useState } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { getAssetUrl } from '../../shared/services/api';
import { User, ShieldCheck, FileText, Mail, GraduationCap, Award, Briefcase, Calendar, CheckCircle2 } from 'lucide-react';

export const UserProfileView = () => {
  const { user } = useAuth();
  if (!user) return null;

  const isStudent = user.role === 'STUDENT';
  const isAlumni = user.role === 'ALUMNI';

  const cardUrl = isStudent ? user.profile?.student_id_card_url : user.profile?.alumni_id_card_url;

  return (
    <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1.5rem' }}>
      
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #311b92 100%)',
          padding: '2.5rem 2rem',
          borderRadius: '20px',
          color: '#ffffff',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '2rem',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)'
            }}
          >
            {user.name ? user.name.trim().charAt(0).toUpperCase() : 'U'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>{user.name}</h1>
              <span className={`badge ${user.verification_status === 'VERIFIED' ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.75rem' }}>
                <ShieldCheck size={13} /> {user.verification_status || 'VERIFIED'}
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Mail size={14} /> {user.email} • <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>{user.role}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem' }}>
        
        {/* Personal & Academic Details Card */}
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} color="var(--primary)" /> Academic & Personal Profile
          </h3>

          {isStudent && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border-card)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Register Number</span>
                <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.1rem' }}>
                  {user.profile?.reg_number || '7376231BT111'}
                </p>
              </div>

              <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border-card)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Department & Academic Year</span>
                <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.1rem' }}>
                  {user.profile?.department || 'Biotechnology'} ({user.profile?.academic_year || '3rd Year'})
                </p>
              </div>

              <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border-card)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Career Goals & Specializations</span>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary)', marginTop: '0.1rem' }}>
                  {user.profile?.career_goals || 'Targeting full-stack software development & engineering systems roles.'}
                </p>
              </div>
            </div>
          )}

          {isAlumni && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border-card)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Designation & Organization</span>
                <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.1rem' }}>
                  {user.profile?.designation || 'Lead Systems Engineer'} at {user.profile?.company || 'Tech Solutions'}
                </p>
              </div>

              <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border-card)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Experience & Capacity</span>
                <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.1rem' }}>
                  {user.profile?.experience_years || 6} Years Experience • Max Mentee Capacity: {user.profile?.max_capacity || 5}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Official ID Credential Card */}
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} color="var(--primary)" /> Official University ID Credential
            </h3>

            <div style={{ textAlign: 'center', background: 'var(--bg-subtle)', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-card)' }}>
              {cardUrl ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <img
                    src={getAssetUrl(cardUrl)}
                    alt="ID Credential Document"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80';
                    }}
                    style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '10px', border: '1px solid var(--border-card)', objectFit: 'cover', boxShadow: 'var(--shadow-sm)' }}
                  />
                  <span className="badge badge-emerald">
                    <CheckCircle2 size={12} /> Verification Document Attached
                  </span>
                </div>
              ) : (
                <div style={{ padding: '1.5rem 0' }}>
                  <FileText size={42} color="var(--text-subtle)" style={{ marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    No ID credential document attached yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-subtle)', textAlign: 'center' }}>
            Verification Status: <strong>{user.verification_status || 'VERIFIED'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
