import React, { useState, useEffect } from 'react';
import { apiClient, getAssetUrl } from '../../shared/services/api';
import { useAuth } from '../../shared/context/AuthContext';
import { useNotification } from '../../shared/context/NotificationContext';
import { MilestoneTracker } from '../sessions/MilestoneTracker';
import { SessionTracker } from '../sessions/SessionTracker';
import { SessionSchedulerModal } from '../sessions/SessionSchedulerModal';
import {
  Users,
  Award,
  CheckCircle2,
  Clock,
  MessageSquare,
  Check,
  X,
  Calendar,
  ShieldCheck,
  FileText,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Building
} from 'lucide-react';

export const MentorDashboard = ({ activeSection = 'dashboard' }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [activeMentorships, setActiveMentorships] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [incomingReferralApps, setIncomingReferralApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfileCard, setShowProfileCard] = useState(true);

  // Scheduler modal state
  const [schedulerMentorshipId, setSchedulerMentorshipId] = useState(null);

  const fetchData = async () => {
    try {
      const [mentorshipsRes, requestsRes, referralAppsRes] = await Promise.all([
        apiClient('/mentorship/my-mentorships'),
        apiClient('/mentorship/my-requests'),
        apiClient('/referrals/mentor/incoming').catch(() => ({ data: [] }))
      ]);

      setActiveMentorships(mentorshipsRes.data || []);
      
      // Filter ONLY pending / waitlisted requests for Incoming Requests View
      const allRequests = requestsRes.data || [];
      const pendingOnly = allRequests.filter(r => r.status === 'PENDING' || r.status === 'WAITLISTED');
      setPendingRequests(pendingOnly);

      setIncomingReferralApps(referralAppsRes.data || []);
    } catch (err) {
      console.error('Failed to load mentor dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ALUMNI') {
      fetchData();
    }
  }, [user]);

  const handleRespond = async (requestId, action) => {
    try {
      await apiClient(`/mentorship/requests/${requestId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ action })
      });
      showNotification(`Mentorship request ${action.toLowerCase()}ed!`, 'success');
      fetchData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleCompleteMentorship = async (mentorshipId, studentName) => {
    if (!window.confirm(`Are you sure you want to mark the mentorship with ${studentName} as COMPLETED? This will release 1 mentee capacity slot.`)) {
      return;
    }

    try {
      await apiClient(`/mentorship/active/${mentorshipId}/complete`, { method: 'POST' });
      showNotification(`Mentorship with ${studentName} marked as COMPLETED! Capacity slot released.`, 'success');
      fetchData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  if (user?.role !== 'ALUMNI') return null;

  const activeList = activeMentorships.filter(m => m.status === 'ACTIVE');
  const completedList = activeMentorships.filter(m => m.status === 'COMPLETED');

  const maxCap = user.profile?.max_capacity || 5;
  const currCap = user.profile?.current_capacity || activeList.length;
  const availableSlots = Math.max(0, maxCap - currCap);

  const cardUrl = user.profile?.alumni_id_card_url;

  return (
    <div style={{ maxWidth: '1280px', margin: '2rem auto', padding: '0 1.5rem' }}>
      
      {/* SECTION 1: DASHBOARD / OVERVIEW */}
      {(activeSection === 'dashboard' || activeSection === 'home') && (
        <div>
          {/* Header Banner */}
          <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', background: 'linear-gradient(135deg, #f5f3ff 0%, #ffffff 100%)', borderColor: '#ddd6fe' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="badge badge-purple" style={{ marginBottom: '0.5rem' }}>Verified Alumni Mentor</span>
                <h2 style={{ fontSize: '2rem', color: '#0f172a' }}>Welcome back, {user.name}! 👨‍🏫</h2>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {user.profile?.designation || 'Senior Software Engineer'} at {user.profile?.company || 'Tech Corp'} • {user.profile?.experience_years || 5} Yrs Exp
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <span className="badge badge-cyan" style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}>
                    Capacity: {currCap} / {maxCap} Mentees ({availableSlots} Slots Free)
                  </span>
                </div>

                <button
                  onClick={() => setShowProfileCard(!showProfileCard)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <FileText size={14} /> {showProfileCard ? 'Hide Credential Card' : 'View My Credential Card'} {showProfileCard ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>

            {/* Mentor Profile & Credential Card */}
            {showProfileCard && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '0.5rem' }}>Mentor Profile & Credentials</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}><strong>Email:</strong> {user.email}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}><strong>Company & Title:</strong> {user.profile?.designation} at {user.profile?.company}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}><strong>Graduation Year:</strong> {user.profile?.graduation_year || 2020} ({user.profile?.experience_years} Yrs Experience)</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '0.5rem' }}>
                    <strong>Bio:</strong> {user.profile?.bio || 'Experienced software mentor passionate about guiding student careers.'}
                  </p>
                </div>

                <div style={{ textAlign: 'center', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    Your Inserted Alumni Credential Document:
                  </p>
                  {cardUrl ? (
                    <img
                      src={getAssetUrl(cardUrl)}
                      alt="Alumni ID Card Credential"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80';
                      }}
                      style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '8px', border: '1px solid #e2e8f0', objectFit: 'cover' }}
                    />
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem' }}>
                      No ID document attached. Upload an Alumni ID card during profile updates to verify credentials.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Active Student Mentees</p>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>{activeList.length}</p>
            </div>
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Available Capacity Slots</p>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{availableSlots}</p>
            </div>
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Pending Requests</p>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{pendingRequests.length}</p>
            </div>
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Job Referral Applicants</p>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-purple)' }}>{incomingReferralApps.length}</p>
            </div>
          </div>

          {/* Incoming Job Referral Applicants Overview */}
          {incomingReferralApps.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Briefcase size={20} color="var(--primary)" /> Incoming Student Job Referral Applicants ({incomingReferralApps.length})
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-subtle)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '0.75rem' }}>Student Applicant</th>
                      <th style={{ padding: '0.75rem' }}>Email</th>
                      <th style={{ padding: '0.75rem' }}>Applied Position</th>
                      <th style={{ padding: '0.75rem' }}>Company</th>
                      <th style={{ padding: '0.75rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomingReferralApps.map(app => (
                      <tr key={app.id} style={{ borderBottom: '1px solid var(--border-card)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>{app.student_name}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{app.student_email}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>{app.job_title}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{app.company}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span className="badge badge-emerald">Referral Active</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: REQUESTS VIEW */}
      {activeSection === 'requests' && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.4rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={22} color="#b45309" /> Incoming Student Mentorship Requests ({pendingRequests.length})
            </h3>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No pending mentorship requests at this moment. All accepted requests are safely paired in Active Student Mentees!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.25rem' }}>
              {pendingRequests.map(r => (
                <div key={r.id} className="glass-panel" style={{ padding: '1.5rem', borderColor: '#fde68a', background: '#fffbeb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.2rem', color: '#0f172a' }}>{r.student_name}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Student Applicant ({r.student_email})</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <span className="badge badge-cyan">{r.domain_name}</span>
                      {r.status === 'WAITLISTED' && <span className="badge badge-amber">Waitlist</span>}
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #fef3c7' }}>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-main)', marginBottom: '0.4rem', fontStyle: 'italic' }}>
                      <MessageSquare size={14} style={{ display: 'inline', marginRight: '0.3rem', color: 'var(--primary)' }} />
                      "{r.message}"
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                      Requested on {new Date(r.requested_at || Date.now()).toLocaleDateString()}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleRespond(r.id, 'ACCEPT')} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                      <Check size={16} /> Accept Request
                    </button>
                    <button onClick={() => handleRespond(r.id, 'REJECT')} className="btn btn-danger btn-sm" style={{ flex: 1 }}>
                      <X size={16} /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: ACTIVE MENTORSHIPS VIEW */}
      {activeSection === 'active_mentorships' && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.4rem', color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} color="var(--primary)" /> Active Student Mentees ({activeList.length})
          </h3>

          {activeList.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No active student mentees right now. Accept an incoming request above or assign student mentees from the directory.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
              {activeList.map(am => (
                <div key={am.id} className="glass-panel" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.25rem', color: '#0f172a' }}>{am.student?.name}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Reg: {am.student?.profile?.reg_number} • {am.student?.profile?.department}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.2rem' }}>
                        Goals: {am.student?.profile?.career_goals || 'General Career Guidance'}
                      </p>
                    </div>
                    <span className="badge badge-emerald">ACTIVE</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <button onClick={() => setSchedulerMentorshipId(am.id)} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                      <Calendar size={14} /> Schedule 1-on-1 Session
                    </button>
                    <button onClick={() => handleCompleteMentorship(am.id, am.student?.name)} className="btn btn-secondary btn-sm" style={{ flex: 1, borderColor: '#7c3aed', color: '#7c3aed' }}>
                      <CheckCircle2 size={14} color="#7c3aed" /> Mark Completed
                    </button>
                  </div>

                  {/* Milestone Tracker */}
                  <MilestoneTracker mentorshipId={am.id} isMentor={true} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: 1-ON-1 SESSIONS VIEW */}
      {activeSection === 'sessions' && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.4rem', color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={20} color="var(--primary)" /> 1-on-1 Sessions & Slot Finalization
          </h3>

          {activeList.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No active mentees to schedule 1-on-1 sessions. Accept incoming student requests first!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {activeList.map(am => (
                <div key={am.id} className="glass-panel" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.2rem', color: '#0f172a' }}>Mentee: {am.student?.name}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{am.student?.profile?.department}</p>
                    </div>
                    <button onClick={() => setSchedulerMentorshipId(am.id)} className="btn btn-primary btn-sm">
                      <Calendar size={14} /> Schedule New Session
                    </button>
                  </div>

                  <SessionTracker mentorshipId={am.id} isMentor={true} />
                </div>
              ))}
            </div>
          )}
        </div>
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
