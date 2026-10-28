import React, { useState, useEffect } from 'react';
import { apiClient, getAssetUrl } from '../../shared/services/api';
import { useAuth } from '../../shared/context/AuthContext';
import { useNotification } from '../../shared/context/NotificationContext';
import { useBatchOnlineStatus } from '../../shared/hooks/usePresence';
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
  Code,
  AlertTriangle,
  X,
  Wifi,
  WifiOff
} from 'lucide-react';

/* ── Online Status Dot ── */
function OnlineDot({ online, loading }) {
  if (loading) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 600, color: online ? '#10b981' : '#94a3b8' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: online ? '#10b981' : '#94a3b8', display: 'inline-block', boxShadow: online ? '0 0 0 2px #10b98130' : 'none' }} />
      {online ? 'Online now' : 'Offline'}
    </span>
  );
}

/* ── Mentor Reassign Request Modal ── */
function ReassignRequestModal({ mentorship, onClose, onSuccess }) {
  const { showNotification } = useNotification();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (reason.trim().length < 20) {
      showNotification('Please provide a more detailed reason (at least 20 characters).', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient('/mentorship/reassign-request', {
        method: 'POST',
        body: JSON.stringify({ mentorshipId: mentorship.id, reason: reason.trim() })
      });
      showNotification('Mentor change request submitted! Admin will review and respond shortly.', 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} color="#f59e0b" /> Request Mentor Change
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
              Current mentor: <strong>{mentorship?.mentor?.name}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', marginBottom: '1.25rem', fontSize: '0.8rem', color: '#92400e', lineHeight: 1.5 }}>
          This request will be reviewed by an admin. Please provide a clear, honest reason — abuse of this feature may result in account review.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Reason for Mentor Change <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea
              rows={5}
              className="form-input"
              placeholder="e.g. My mentor and I have a communication mismatch — they are not responsive to my messages for the past 3 weeks, and I feel I would benefit from a mentor with a different teaching approach..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              style={{ width: '100%', resize: 'vertical', fontSize: '0.85rem' }}
              required
              autoFocus
            />
            <p style={{ fontSize: '0.7rem', color: reason.length < 20 ? '#ef4444' : 'var(--text-subtle)', marginTop: '0.25rem' }}>
              {reason.length} characters (minimum 20 required)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting || reason.trim().length < 20}>
              <AlertTriangle size={14} /> {submitting ? 'Submitting...' : 'Submit to Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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

  // Reassign modal state
  const [reassignMentorship, setReassignMentorship] = useState(null);

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

  // Collect all mentor IDs for batch online status polling
  const activeList = activeMentorships.filter(m => m.status === 'ACTIVE');
  const mentorIds = activeList.map(m => m.mentor?.id).filter(Boolean);
  const onlineStatuses = useBatchOnlineStatus(mentorIds, 20000);

  if (user?.role !== 'STUDENT') return null;

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Academic Year: {user.profile?.academic_year || '3rd Year'} • Department: {user.profile?.department || 'Biotechnology'}
            </p>
            <button onClick={() => setShowProfileCard(!showProfileCard)} className="btn btn-secondary btn-sm" style={{ fontSize: '0.825rem' }}>
              <FileText size={14} /> {showProfileCard ? 'Hide Credential Card' : 'View ID Credential'}
            </button>
          </div>

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
                    <img src={getAssetUrl(cardUrl)} alt="Student ID Card Credential" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80'; }} style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '8px', border: '1px solid var(--border-card)', objectFit: 'cover' }} />
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem' }}>
                      No ID document attached. Upload a Student ID card photo during registration.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
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

          {/* Interested Domains */}
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Compass size={18} color="var(--primary)" /> My Interested Technical Domains ({interestedDomains.length})
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Technical domains you have chosen for mentorship and career tracks</p>
              </div>
              <button onClick={() => { if (typeof window !== 'undefined') window.location.hash = 'explore'; }} className="btn btn-secondary btn-sm" style={{ fontSize: '0.8rem' }}>
                Explore All Domains <ArrowRight size={14} />
              </button>
            </div>
            {interestedDomains.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-subtle)', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
                <Code size={36} color="var(--text-subtle)" style={{ marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>You haven't selected any interested technical domains yet.</p>
                <button onClick={() => { if (typeof window !== 'undefined') window.location.hash = 'explore'; }} className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}>
                  Browse & Select Interested Domains
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {interestedDomains.map(d => (
                  <div key={d.id} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-card)', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Code size={18} color="var(--primary)" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{d.name}</h4>
                      <span className="badge badge-purple" style={{ fontSize: '0.65rem', marginTop: '0.2rem' }}>{d.category || 'Core Engineering'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: SENT REQUESTS */}
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

      {/* SECTION 3: ACTIVE MENTORSHIPS & SESSIONS */}
      {(activeSection === 'active_mentorships' || activeSection === 'sessions') && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>
            {activeSection === 'sessions' ? '1-on-1 Virtual Sessions & Scheduling' : 'Active Mentorship Track & Milestones'}
          </h3>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading active mentorships...</div>
          ) : activeList.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', borderRadius: '16px' }}>
              <Users size={40} color="var(--primary)" style={{ marginBottom: '1rem' }} />
              <h4>No Active Mentorships Yet</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '500px', margin: '0.35rem auto 1.25rem' }}>
                Explore recommended mentors to request mentorship!
              </p>
              <button onClick={() => { if (typeof window !== 'undefined') window.location.hash = 'recommended_mentors'; }} className="btn btn-primary btn-sm">
                <Users size={14} /> Find Alumni Mentors
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {activeList.map((m) => {
                const mentorId = m.mentor?.id;
                const presenceInfo = onlineStatuses[mentorId] || { online: false };

                return (
                  <div key={m.id} className="glass-panel" style={{ padding: '1.75rem', borderRadius: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-card)', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                          <span className="badge badge-emerald">ACTIVE MENTORSHIP</span>
                          <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>Track ID: #{m.id}</span>

                          {/* ── REAL ONLINE STATUS — replaces hardcoded "in a meeting" ── */}
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            padding: '0.15rem 0.55rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 600,
                            background: presenceInfo.online ? 'rgba(16,185,129,0.12)' : 'rgba(148,163,184,0.12)',
                            color: presenceInfo.online ? '#10b981' : '#64748b',
                            border: `1px solid ${presenceInfo.online ? 'rgba(16,185,129,0.3)' : 'rgba(148,163,184,0.3)'}`
                          }}>
                            {presenceInfo.online
                              ? <><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', animation: 'pulse-dot 1.5s ease-in-out infinite' }} /> Online now</>
                              : <><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#94a3b8' }} /> Offline</>
                            }
                          </span>
                        </div>

                        <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                          Mentor: {m.mentor?.name}
                          {m.mentor?.profile?.designation && (
                            <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                              ({m.mentor.profile.designation} at {m.mentor.profile.company})
                            </span>
                          )}
                        </h4>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button onClick={() => setSchedulerMentorshipId(m.id)} className="btn btn-primary btn-sm">
                          <Calendar size={14} /> Schedule 1-on-1 Session
                        </button>
                        {/* ── MENTOR CHANGE REQUEST BUTTON ── */}
                        <button
                          onClick={() => setReassignMentorship(m)}
                          className="btn btn-secondary btn-sm"
                          style={{ borderColor: '#f59e0b', color: '#b45309' }}
                          title="Request mentor change from admin"
                        >
                          <AlertTriangle size={14} color="#f59e0b" /> Request Mentor Change
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: activeSection === 'sessions' ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                      <SessionTracker mentorshipId={m.id} userRole="STUDENT" />
                      {activeSection !== 'sessions' && (
                        <MilestoneTracker mentorshipId={m.id} userRole="STUDENT" />
                      )}
                    </div>
                  </div>
                );
              })}
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

      {/* Reassign Request Modal */}
      {reassignMentorship && (
        <ReassignRequestModal
          mentorship={reassignMentorship}
          onClose={() => setReassignMentorship(null)}
          onSuccess={fetchData}
        />
      )}

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
          50% { opacity: 0.8; box-shadow: 0 0 0 4px rgba(16,185,129,0); }
        }
      `}</style>
    </div>
  );
};
