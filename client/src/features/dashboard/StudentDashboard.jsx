import React, { useState, useEffect } from 'react';
import { apiClient, getAssetUrl } from '../../shared/services/api';
import { useAuth } from '../../shared/context/AuthContext';
import { useNotification } from '../../shared/context/NotificationContext';
import { MilestoneTracker } from '../sessions/MilestoneTracker';
import { SessionTracker } from '../sessions/SessionTracker';
import { SessionSchedulerModal } from '../sessions/SessionSchedulerModal';
import { RecommendedMentorsGrid } from '../recommendation/RecommendedMentorsGrid';
import { RequestMentorshipModal } from '../mentorship/RequestMentorshipModal';
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
  Filter,
  Compass,
  Code
} from 'lucide-react';

export const StudentDashboard = ({ activeSection = 'dashboard' }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [activeMentorships, setActiveMentorships] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [allDomains, setAllDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfileCard, setShowProfileCard] = useState(false);

  // Scheduler modal state
  const [schedulerMentorshipId, setSchedulerMentorshipId] = useState(null);

  // Request mentorship modal state
  const [selectedMentorForRequest, setSelectedMentorForRequest] = useState(null);

  const fetchData = async () => {
    try {
      const [mentorshipsRes, requestsRes, domainsRes] = await Promise.all([
        apiClient('/mentorship/active/my'),
        apiClient('/mentorship/requests/my'),
        apiClient('/domains')
      ]);

      setActiveMentorships(mentorshipsRes.data || []);
      setMyRequests(requestsRes.data || []);
      setAllDomains(domainsRes.data || []);
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

  const studentInterestIds = user.profile?.interests || user.interests || [];
  const interestedDomains = allDomains.filter(d => studentInterestIds.includes(d.id));

  const cardUrl = user.profile?.student_id_card_url;

  return (
    <div style={{ maxWidth: '1280px', margin: '1.5rem auto', padding: '0 1.5rem' }}>
      
      {/* Breadcrumb Trail */}
      <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginBottom: '0.75rem' }}>
        Main Workspace <span style={{ margin: '0 0.35rem' }}>›</span> <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Student Dashboard</span>
      </div>

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
          {activeSection === 'active_mentorships' ? 'Active Mentorships' : activeSection === 'requests' ? 'Mentorship Requests' : activeSection === 'sessions' ? '1-on-1 Virtual Sessions' : 'Student Dashboard'}
        </h2>
      </div>

      {/* SECTION 1: DASHBOARD / OVERVIEW */}
      {(activeSection === 'dashboard' || activeSection === 'home') && (
        <div>
          {/* Dashboard Header Bar with View Credential Card Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Academic Year: {user.profile?.academic_year || '3rd Year'} • Department: {user.profile?.department || 'Biotechnology'}
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
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}><strong>Register Number:</strong> {user.profile?.reg_number || '7376231BT111'}</p>
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
              <p style={{ fontSize: '0.725rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>My Interested Domains</p>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{interestedDomains.length}</p>
            </div>
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Sent Requests</p>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{myRequests.length}</p>
            </div>
          </div>

          {/* STUDENT'S INTERESTED DOMAINS ONLY */}
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Compass size={18} color="var(--primary)" /> My Interested Technical Domains ({interestedDomains.length})
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Technical domains you have chosen for mentorship and career tracks
                </p>
              </div>

              <button
                onClick={() => {
                  if (typeof window !== 'undefined') window.location.hash = 'explore';
                }}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.8rem' }}
              >
                Explore All Technical Domains Directory <ArrowRight size={14} />
              </button>
            </div>

            {interestedDomains.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-subtle)', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
                <Code size={36} color="var(--text-subtle)" style={{ marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>You haven't selected any interested technical domains yet.</p>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') window.location.hash = 'explore';
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}
                >
                  Browse & Select Interested Domains
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {interestedDomains.map(d => (
                  <div
                    key={d.id}
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-card)',
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Code size={18} color="var(--primary)" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{d.name}</h4>
                      <span className="badge badge-purple" style={{ fontSize: '0.65rem', marginTop: '0.2rem' }}>
                        {d.category || 'Core Engineering'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: SENT MENTORSHIP REQUESTS (STANDALONE OR DASHBOARD) */}
      {(activeSection === 'dashboard' || activeSection === 'home' || activeSection === 'requests') && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 700, marginBottom: '1rem' }}>
            Your Sent Mentorship Requests ({myRequests.length})
          </h3>
          {myRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <MessageSquare size={32} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>You haven't sent any mentorship requests yet.</p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                Explore Recommended Mentors or the Technical Domain Directory to request mentorship!
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-subtle)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem' }}>Alumni Mentor</th>
                    <th style={{ padding: '0.75rem' }}>Domain</th>
                    <th style={{ padding: '0.75rem' }}>Requested Date</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myRequests.map((req) => (
                    <tr key={req.id} style={{ borderBottom: '1px solid var(--border-card)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>{req.mentor_name}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{req.domain_name}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-subtle)' }}>{new Date(req.requested_at).toLocaleDateString()}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span className={`badge ${req.status === 'ACCEPTED' ? 'badge-emerald' : req.status === 'REJECTED' ? 'badge-rose' : 'badge-amber'}`}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: ACTIVE MENTORSHIPS & 1-ON-1 SESSIONS */}
      {(activeSection === 'active_mentorships' || activeSection === 'sessions') && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>
            {activeSection === 'sessions' ? '1-on-1 Virtual Sessions & Scheduling' : 'Active Mentorship Track & Milestones'}
          </h3>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading active mentorships and session slots...</div>
          ) : activeList.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', borderRadius: '16px' }}>
              {activeSection === 'sessions' ? (
                <>
                  <Calendar size={40} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                  <h4 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>No Active 1-on-1 Sessions Scheduled</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.35rem', maxWidth: '520px', margin: '0.35rem auto 1.25rem' }}>
                    You don't have any accepted alumni mentorship connections to schedule 1-on-1 sessions with right now. Connect with verified alumni mentors to unlock live WebRTC virtual calls!
                  </p>
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') window.location.hash = 'recommended_mentors';
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    <Users size={14} /> Explore Recommended Alumni Mentors
                  </button>
                </>
              ) : (
                <>
                  <Users size={40} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                  <h4>No Active Mentorships Yet</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.35rem', maxWidth: '500px', margin: '0.35rem auto 1.25rem' }}>
                    You don't have any accepted alumni mentorship connections active right now. Explore recommended mentors to request mentorship!
                  </p>
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') window.location.hash = 'recommended_mentors';
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    <Users size={14} /> Find Alumni Mentors
                  </button>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {activeList.map((m) => (
                <div key={m.id} className="glass-panel" style={{ padding: '1.75rem', borderRadius: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-card)' }}>
                    <div>
                      <span className="badge badge-emerald" style={{ marginBottom: '0.35rem' }}>
                        ACTIVE MENTORSHIP
                      </span>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        Mentor: {m.mentor?.name} ({m.mentor?.profile?.designation} at {m.mentor?.profile?.company})
                      </h4>
                    </div>

                    <button
                      onClick={() => setSchedulerMentorshipId(m.id)}
                      className="btn btn-primary btn-sm"
                    >
                      <Calendar size={14} /> Schedule 1-on-1 Session
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <SessionTracker mentorshipId={m.id} userRole="STUDENT" />
                    <MilestoneTracker mentorshipId={m.id} userRole="STUDENT" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scheduler Modal */}
      {schedulerMentorshipId && (
        <SessionSchedulerModal
          mentorshipId={schedulerMentorshipId}
          isOpen={Boolean(schedulerMentorshipId)}
          onClose={() => setSchedulerMentorshipId(null)}
          onSuccess={fetchData}
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
    </div>
  );
};
