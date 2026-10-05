import React, { useState } from 'react';
import { RecommendedMentorsGrid } from './RecommendedMentorsGrid';
import { RequestMentorshipModal } from '../mentorship/RequestMentorshipModal';
import { Sparkles, Award, Users, Compass } from 'lucide-react';
import { useAuth } from '../../shared/context/AuthContext';

export const RecommendedMentorsView = ({ onRequestMentorship, searchQuery = '' }) => {
  const { user } = useAuth();
  const [selectedMentor, setSelectedMentor] = useState(null);

  const handleRequest = (mentor) => {
    if (onRequestMentorship) {
      onRequestMentorship(mentor);
    } else {
      setSelectedMentor(mentor);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '1.5rem auto', padding: '0 1.5rem' }}>
      
      {/* Breadcrumb Navigation */}
      <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginBottom: '0.75rem' }}>
        Mentorship <span style={{ margin: '0 0.35rem' }}>›</span> <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Recommended Alumni Mentors</span>
      </div>

      {/* Main Page Banner Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          padding: '2.25rem 2rem',
          borderRadius: '20px',
          color: '#ffffff',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <span className="badge badge-purple" style={{ marginBottom: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Sparkles size={13} /> Intelligent AI Matching Engine
          </span>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', margin: '0.2rem 0 0.4rem 0' }}>
            ✨ Recommended Alumni Mentors For You
          </h2>
          <p style={{ fontSize: '0.925rem', color: '#cbd5e1', maxWidth: '680px', margin: 0, lineHeight: '1.5' }}>
            Discover top verified alumni mentors dynamically matched to your department, technical interests, and career goals.
          </p>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(10px)',
            padding: '1rem 1.5rem',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.15)',
            textAlign: 'center'
          }}
        >
          <Award size={28} color="#38bdf8" style={{ marginBottom: '0.25rem' }} />
          <p style={{ fontSize: '0.75rem', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>
            Intelligent Matching
          </p>
        </div>
      </div>

      {/* Recommended Mentors Grid Component */}
      <RecommendedMentorsGrid onRequestMentorship={handleRequest} hideHeader={true} searchQuery={searchQuery} />

      {/* Request Mentorship Modal */}
      {selectedMentor && (
        <RequestMentorshipModal
          mentor={selectedMentor}
          isOpen={Boolean(selectedMentor)}
          onClose={() => setSelectedMentor(null)}
        />
      )}
    </div>
  );
};
