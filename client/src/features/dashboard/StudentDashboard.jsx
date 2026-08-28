import React, { useState, useEffect } from 'react';
import { apiClient, getAssetUrl } from '../../shared/services/api';
import { useAuth } from '../../shared/context/AuthContext';
import { useNotification } from '../../shared/context/NotificationContext';
import { MilestoneTracker } from '../sessions/MilestoneTracker';
import { SessionTracker } from '../sessions/SessionTracker';
import { SessionSchedulerModal } from '../sessions/SessionSchedulerModal';
import { RecommendedMentorsGrid } from '../recommendation/RecommendedMentorsGrid';
import { RequestMentorshipModal } from '../mentorship/RequestMentorshipModal';
import { ResumeAnalyzerModal } from '../recommendation/ResumeAnalyzerModal';
import {
  Sparkles,
  Users,
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Plus,
  Filter
} from 'lucide-react';

export const StudentDashboard = ({ activeSection = 'dashboard' }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [activeMentorships, setActiveMentorships] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [showResumeAnalyzer, setShowResumeAnalyzer] = useState(false);

  // Scheduler modal state
  const [schedulerMentorshipId, setSchedulerMentorshipId] = useState(null);

  // Request mentorship modal state
  const [selectedMentorForRequest, setSelectedMentorForRequest] = useState(null);

  const fetchData = async () => {
    try {
      const [mentorshipsRes, requestsRes] = await Promise.all([
        apiClient('/mentorship/active/my'),
        apiClient('/mentorship/requests/my')
      ]);

      setActiveMentorships(mentorshipsRes.data || []);
      setMyRequests(requestsRes.data || []);
    } catch (err) {
      console.error('Failed to load student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'STUDENT') {
      fetchData();
    }
  }, [user]);

  if (user?.role !== 'STUDENT') return null;

  const activeList = activeMentorships.filter(m => m.status === 'ACTIVE');
  const completedList = activeMentorships.filter(m => m.status === 'COMPLETED');

  const cardUrl = user.profile?.student_id_card_url;

  return (
    <div style={{ maxWidth: '1280px', margin: '1.5rem auto', padding: '0 1.5rem' }}>
      
      {/* Breadcrumb Trail */}
      <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginBottom: '0.75rem' }}>
        Mentorship & Track <span style={{ margin: '0 0.35rem' }}>›</span> <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Student Dashboard</span>
      </div>

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
          {activeSection === 'active_mentorships' ? 'Active Mentorships' : activeSection === 'requests' ? 'Mentorship Requests' : activeSection === 'sessions' ? '1-on-1 Virtual Sessions' : 'Student Dashboard'}
        </h2>

        <button
          onClick={() => setShowResumeAnalyzer(true)}
          className="btn btn-primary"
          style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)', borderColor: '#7c3aed' }}
        >
          <Sparkles size={16} /> 🤖 AI Resume & SDE Fit Analyzer
        </button>
      </div>

      {/* SECTION 1: DASHBOARD / OVERVIEW */}
      {(activeSection === 'dashboard' || activeSection === 'home') && (
        <div>
          {/* Dashboard Header Bar with View Credential Card Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Academic Year: {user.profile?.academic_year || '3rd Year'} • Department: {user.profile?.department || 'Computer Science'}
            </p>

            <button
              onClick={() => setShowProfileCard(!showProfileCard)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.825rem' }}
            >
              <FileText size={14} /> {showProfileCard ? 'Hide Credential Card' : 'View ID Credential'}
            </button>
          </div>

          {/* Profile Details Card */}
          {showProfileCard && (
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Personal & Academic Profile</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}><strong>Email:</strong> {user.email}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}><strong>Register Number:</strong> {user.profile?.reg_number || 'REG2024-8841'}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}><strong>Department & Year:</strong> {user.profile?.department} ({user.profile?.academic_year})</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '0.5rem' }}>
                    <strong>Career Goals:</strong> {user.profile?.career_goals || 'Targeting full stack software development roles.'}
                  </p>
                </div>

                <div style={{ textAlign: 'center', background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    Your Student ID Credential Document:
                  </p>
                  {cardUrl ? (
                    <img
                      src={getAssetUrl(cardUrl)}
                      alt="Student ID Card Credential"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80';
                      }}
                      style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '8px', border: '1px solid var(--border-card)', objectFit: 'cover' }}
                    />
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem' }}>
                      No ID document attached. Upload a Student ID card photo during registration to verify credentials.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats Counter Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Active Mentors</p>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>{activeList.length}</p>
            </div>
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Completed Mentorships</p>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-purple)' }}>{completedList.length}</p>
            </div>
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Sent Requests</p>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{myRequests.length}</p>
            </div>
          </div>

          {/* Sent Mentorship Requests Table */}
          {myRequests.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 700, marginBottom: '1rem' }}>
                Your Sent Mentorship Requests ({myRequests.length})
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-subtle)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '0.75rem' }}>Alumni Mentor</th>
                      <th style={{ padding: '0.75rem' }}>Domain</th>
                      <th style={{ padding: '0.75rem' }}>Message Note</th>
                      <th style={{ padding: '0.75rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myRequests.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--border-card)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>{r.mentor_name}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{r.domain_name}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>"{r.message}"</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span className={`badge ${r.status === 'ACCEPTED' ? 'badge-emerald' : r.status === 'PENDING' ? 'badge-amber' : 'badge-rose'}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Active Mentorships Data Table */}
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 700 }}>Active Mentorship Tracks</h3>
              <Filter size={16} color="var(--text-subtle)" />
            </div>

            {activeList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', padding: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
                No active mentorship tracks right now. Browse AI recommendations below to connect with alumni mentors!
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-subtle)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '0.75rem' }}>Mentor Name</th>
                      <th style={{ padding: '0.75rem' }}>Company & Role</th>
                      <th style={{ padding: '0.75rem' }}>Technical Domain</th>
                      <th style={{ padding: '0.75rem' }}>Status</th>
                      <th style={{ padding: '0.75rem' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeList.map(am => (
                      <tr key={am.id} style={{ borderBottom: '1px solid var(--border-card)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                          <span style={{ color: 'var(--primary)', textDecoration: 'none' }}>{am.mentor?.name}</span>
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                          {am.mentor?.profile?.designation} at {am.mentor?.profile?.company}
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{am.domain?.name}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span className="badge badge-emerald">ACTIVE</span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <button
                            onClick={() => setSchedulerMentorshipId(am.id)}
                            className="btn btn-sm btn-primary"
                            style={{ fontSize: '0.75rem' }}
                          >
                            <Calendar size={12} /> Schedule Session
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* AI Mentor Recommendations Grid */}
          <RecommendedMentorsGrid onRequestMentorship={(mentor) => setSelectedMentorForRequest(mentor)} />
        </div>
      )}

      {/* SECTION 2: ACTIVE MENTORSHIPS VIEW */}
      {activeSection === 'active_mentorships' && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.3rem', color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} color="var(--primary)" /> Active Student Mentorships ({activeList.length})
          </h3>

          {activeList.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>You do not have an active ongoing mentorship right now. Explore domains or AI recommendations to request an alumni mentor!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
              {activeList.map(am => (
                <div key={am.id} className="glass-panel" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>{am.mentor?.name}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>{am.mentor?.profile?.designation} at {am.mentor?.profile?.company}</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: '0.2rem' }}>Domain: {am.domain?.name}</p>
                    </div>
                    <span className="badge badge-emerald">ACTIVE</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <button onClick={() => setSchedulerMentorshipId(am.id)} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                      <Calendar size={14} /> Request 1-on-1 Session (Propose 3 Slots)
                    </button>
                  </div>

                  {/* Milestone Tracker inside active mentorship */}
                  <MilestoneTracker mentorshipId={am.id} isMentor={false} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: MENTORSHIP REQUESTS VIEW */}
      {activeSection === 'requests' && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.3rem', color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={20} color="var(--accent-purple)" /> Sent Mentorship Requests Status ({myRequests.length})
          </h3>

          {myRequests.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No sent mentorship requests found.
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              {myRequests.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border-card)' }}>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>Request to {r.mentor_name}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>"{r.message}"</p>
                  </div>
                  <span className={`badge ${r.status === 'ACCEPTED' ? 'badge-emerald' : r.status === 'PENDING' ? 'badge-amber' : 'badge-rose'}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: 1-ON-1 SESSIONS VIEW */}
      {activeSection === 'sessions' && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.3rem', color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={20} color="var(--primary)" /> My 1-on-1 Sessions & Scheduled Calls
          </h3>

          {activeList.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No active mentorships to view virtual sessions. Connect with a mentor first!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {activeList.map(am => (
                <div key={am.id} className="glass-panel" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>Mentor: {am.mentor?.name}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>{am.mentor?.profile?.designation} at {am.mentor?.profile?.company}</p>
                    </div>
                    <button onClick={() => setSchedulerMentorshipId(am.id)} className="btn btn-primary btn-sm">
                      <Calendar size={14} /> Request New Session
                    </button>
                  </div>

                  <SessionTracker mentorshipId={am.id} isMentor={false} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Resume & SDE Fit Analyzer Modal */}
      {showResumeAnalyzer && (
        <ResumeAnalyzerModal
          isOpen={showResumeAnalyzer}
          onClose={() => setShowResumeAnalyzer(false)}
          onRequestMentorship={(mentor) => setSelectedMentorForRequest(mentor)}
        />
      )}

      {/* Request Mentorship Modal */}
      {selectedMentorForRequest && (
        <RequestMentorshipModal
          mentor={selectedMentorForRequest}
          isOpen={Boolean(selectedMentorForRequest)}
          onClose={() => setSelectedMentorForRequest(null)}
          onSuccess={fetchData}
        />
      )}

      {schedulerMentorshipId && (
        <SessionSchedulerModal
          mentorshipId={schedulerMentorshipId}
          isOpen={Boolean(schedulerMentorshipId)}
          onClose={() => setSchedulerMentorshipId(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};
