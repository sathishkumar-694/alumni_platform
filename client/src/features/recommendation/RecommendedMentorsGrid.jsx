import React, { useState, useEffect } from 'react';
import { apiClient } from '../../shared/services/api';
import { useAuth } from '../../shared/context/AuthContext';
import { useNotification } from '../../shared/context/NotificationContext';
import { Sparkles, Briefcase, Award, CheckCircle, Send, Linkedin, BookOpen, Clock } from 'lucide-react';

export const RecommendedMentorsGrid = ({ onRequestMentorship }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = async () => {
    try {
      const res = await apiClient('/recommendation');
      setMentors(res.data || []);
    } catch (err) {
      console.error('Failed to load mentor recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'STUDENT' && user?.verification_status === 'VERIFIED') {
      fetchRecommendations();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (user?.role !== 'STUDENT') return null;

  if (user?.verification_status !== 'VERIFIED') {
    return (
      <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem', textAlign: 'center' }}>
        <Sparkles size={32} color="var(--primary)" style={{ marginBottom: '0.75rem' }} />
        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>Intelligent Mentor Recommendations Locked</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Complete your Student ID card verification with administrative operations to unlock AI mentor matching.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '2.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <Sparkles size={24} color="var(--primary)" />
        <h3 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Intelligent Mentor Recommendations</h3>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Calculating mentor recommendation scores...</p>
      ) : mentors.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No verified mentors found matching your criteria.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {mentors.map(mentor => (
            <div key={mentor.id} className="glass-panel glass-panel-glow" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>{mentor.name}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Briefcase size={14} /> {mentor.profile.designation} at {mentor.profile.company}
                    </p>
                  </div>
                  <span className="badge badge-cyan" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                    {mentor.match_score}% Match
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', fontStyle: 'italic' }}>
                  "{mentor.profile.bio || 'Experienced software professional passionate about mentoring.'}"
                </p>

                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                    Expertise Domains:
                  </p>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {mentor.expertise_domains.map(d => (
                      <span key={d.id} className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                        {d.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Available Slots</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: 700, color: mentor.profile.available_slots > 0 ? 'var(--accent-emerald)' : '#b45309' }}>
                    {mentor.profile.available_slots} / {mentor.profile.max_capacity} Mentees
                  </p>
                </div>

                {mentor.profile.available_slots > 0 ? (
                  <button
                    onClick={() => onRequestMentorship(mentor)}
                    className="btn btn-primary btn-sm"
                  >
                    <Send size={14} /> Request Mentorship
                  </button>
                ) : (
                  <button
                    onClick={() => onRequestMentorship({ ...mentor, isWaitlist: true })}
                    className="btn btn-secondary btn-sm"
                    style={{ borderColor: '#fde68a', background: '#fffbeb', color: '#b45309' }}
                  >
                    <Clock size={14} color="#b45309" /> Join Waitlist
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
