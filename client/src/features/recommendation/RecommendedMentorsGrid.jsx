import React, { useState, useEffect } from 'react';
import { apiClient } from '../../shared/services/api';
import { useAuth } from '../../shared/context/AuthContext';
import { useNotification } from '../../shared/context/NotificationContext';
import { Sparkles, Briefcase, Award, CheckCircle, Send, Linkedin, BookOpen, Clock } from 'lucide-react';

export const RecommendedMentorsGrid = ({ onRequestMentorship, hideHeader = false, searchQuery = '' }) => {
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
    if (user?.verification_status === 'VERIFIED') {
      fetchRecommendations();
    } else {
      setLoading(false);
    }
  }, [user]);

  const filteredMentors = searchQuery ? mentors.filter(m => {
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = m.name && m.name.toLowerCase().includes(q);
    const companyMatch = m.company && m.company.toLowerCase().includes(q);
    const designationMatch = m.designation && m.designation.toLowerCase().includes(q);
    const bioMatch = m.bio && m.bio.toLowerCase().includes(q);
    const expertiseMatch = Array.isArray(m.expertise) && m.expertise.some(e => String(e).toLowerCase().includes(q));
    return nameMatch || companyMatch || designationMatch || bioMatch || expertiseMatch;
  }) : mentors;

  if (user?.verification_status !== 'VERIFIED') {
    return (
      <div className="glass-panel" style={{ padding: '2rem', marginTop: '1rem', textAlign: 'center' }}>
        <Sparkles size={32} color="var(--primary)" style={{ marginBottom: '0.75rem' }} />
        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>Intelligent Mentor Recommendations Locked</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Complete your ID card credential verification with administrative operations to unlock AI mentor matching.
        </p>
      </div>
    );
  }

  return (
    <div>
      {!hideHeader && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Sparkles size={22} color="var(--primary)" />
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            Intelligent Mentor Recommendations
          </h3>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Calculating mentor recommendation match scores...
        </div>
      ) : filteredMentors.length === 0 ? (
        <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          {searchQuery ? `No verified alumni mentors found matching "${searchQuery}".` : 'No verified alumni mentors found matching your profile domain criteria.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {filteredMentors.map(mentor => (
            <div
              key={mentor.id}
              className="glass-panel glass-panel-glow"
              style={{
                padding: '1.6rem',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-card)',
                borderRadius: '16px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.35rem',
                        boxShadow: '0 4px 10px rgba(2, 132, 199, 0.3)',
                        flexShrink: 0
                      }}
                    >
                      {(mentor.name || 'M').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 700, margin: 0 }}>
                        {mentor.name}
                      </h4>
                      <p style={{ fontSize: '0.825rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem', margin: 0 }}>
                        <Briefcase size={13} /> {mentor.profile.designation} at {mentor.profile.company}
                      </p>
                    </div>
                  </div>

                  <span className="badge badge-cyan" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', fontWeight: 700, flexShrink: 0 }}>
                    {mentor.match_score}% Match
                  </span>
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border-card)', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, lineHeight: '1.45' }}>
                    "{mentor.profile.bio || 'Experienced software engineering professional passionate about empowering students and providing career guidance.'}"
                  </p>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.725rem', color: 'var(--text-subtle)', marginBottom: '0.4rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.03em' }}>
                    Expertise Specializations:
                  </p>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {(mentor.expertise_domains || []).map(d => (
                      <span key={d.id} className="badge badge-purple" style={{ fontSize: '0.725rem', padding: '0.25rem 0.55rem' }}>
                        {d.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.725rem', color: 'var(--text-subtle)', margin: 0, textTransform: 'uppercase', fontWeight: 700 }}>Mentee Capacity</p>
                  <p style={{ fontSize: '0.9rem', fontWeight: 700, color: mentor.profile.available_slots > 0 ? 'var(--accent-emerald)' : '#b45309', margin: '0.1rem 0 0 0' }}>
                    {mentor.profile.available_slots > 0 ? `🟢 ${mentor.profile.available_slots} / ${mentor.profile.max_capacity} Slots Available` : `⏳ Waitlist Only`}
                  </p>
                </div>

                {mentor.profile.available_slots > 0 ? (
                  <button
                    onClick={() => onRequestMentorship(mentor)}
                    className="btn btn-primary btn-sm"
                    style={{ padding: '0.45rem 1rem' }}
                  >
                    <Send size={14} /> Request Mentorship
                  </button>
                ) : (
                  <button
                    onClick={() => onRequestMentorship({ ...mentor, isWaitlist: true })}
                    className="btn btn-secondary btn-sm"
                    style={{ borderColor: '#fde68a', background: '#fffbeb', color: '#b45309', padding: '0.45rem 1rem' }}
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
