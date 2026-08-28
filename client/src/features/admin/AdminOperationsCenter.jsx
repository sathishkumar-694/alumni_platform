import React, { useState, useEffect } from 'react';
import { apiClient, getAssetUrl } from '../../shared/services/api';
import { useNotification } from '../../shared/context/NotificationContext';
import { VirtualMeetingModal } from '../sessions/VirtualMeetingModal';
import {
  ShieldCheck,
  Users,
  Award,
  TrendingUp,
  Clock,
  Check,
  X,
  FileText,
  UserCheck,
  UserX,
  Edit,
  RefreshCw,
  Plus,
  BarChart2,
  BookOpen,
  Video,
  ExternalLink,
  ChevronRight,
  User
} from 'lucide-react';

export const AdminOperationsCenter = ({ activeSection }) => {
  const { showNotification } = useNotification();

  const getTabForSection = (section) => {
    if (section === 'active_mentorships') return 'matrix';
    if (section === 'requests') return 'requests';
    if (section === 'sessions') return 'sessions';
    if (section === 'domains') return 'domains';
    if (section === 'audit') return 'audit';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(() => getTabForSection(activeSection));

  useEffect(() => {
    if (activeSection) {
      setActiveTab(getTabForSection(activeSection));
    }
  }, [activeSection]);

  const [loading, setLoading] = useState(true);

  // Data states
  const [analytics, setAnalytics] = useState(null);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [matrix, setMatrix] = useState([]);
  const [domains, setDomains] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  // Modals & Drawers
  const [previewUser, setPreviewUser] = useState(null);
  const [analysisUser, setAnalysisUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [activeVirtualSession, setActiveVirtualSession] = useState(null);
  const [editForm, setEditForm] = useState({
    maxCapacity: '5',
    verification_status: 'VERIFIED',
    newPassword: ''
  });

  const [reassignMentorship, setReassignMentorship] = useState(null);
  const [newMentorId, setNewMentorId] = useState('');
  const [reassignReason, setReassignReason] = useState('');

  const [showDomainModal, setShowDomainModal] = useState(false);
  const [domainForm, setDomainForm] = useState({
    name: '',
    category: 'Core Engineering',
    description: '',
    icon: 'Code'
  });

  const fetchOperationsData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, pendingRes, allUsersRes, matrixRes, domainsRes, auditRes] = await Promise.all([
        apiClient('/analytics/overview'),
        apiClient('/verification/pending'),
        apiClient('/users/admin/all'),
        apiClient('/mentorship/admin/matrix'),
        apiClient('/domains'),
        apiClient('/audit')
      ]);

      setAnalytics(analyticsRes.data);
      setPendingVerifications(pendingRes.data || []);
      setAllUsers(allUsersRes.data || []);
      setMatrix(matrixRes.data || []);
      setDomains(domainsRes.data || []);
      setAuditLogs(auditRes.data || []);

      // Extract pending mentorship requests from matrix
      const pendingReqs = (matrixRes.data || []).filter(m => m.status === 'PENDING' || m.status === 'WAITLISTED');
      setPendingRequests(pendingReqs);

      // Fetch virtual sessions for active mentorships
      const activeMentorships = (matrixRes.data || []).filter(m => m.status === 'ACTIVE');
      let combinedSessions = [];
      for (const m of activeMentorships) {
        try {
          const sessRes = await apiClient(`/sessions/sessions/mentorship/${m.id}`);
          const sList = (sessRes.data || []).map(s => ({
            ...s,
            student_name: m.student_name,
            mentor_name: m.mentor_name,
            domain_name: m.domain_name
          }));
          combinedSessions = [...combinedSessions, ...sList];
        } catch (e) {
          // ignore individual session errors
        }
      }
      setAllSessions(combinedSessions);

    } catch (err) {
      console.error('Failed to load admin operations data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperationsData();
  }, []);

  const handleVerifyAction = async (userId, action) => {
    try {
      const status = action === 'APPROVE' ? 'VERIFIED' : 'REJECTED';
      await apiClient(`/verification/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      showNotification(`User verification status updated to ${status}!`, 'success');
      fetchOperationsData();
      setPreviewUser(null);
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleAdminUserUpdate = async (e) => {
    e.preventDefault();
    try {
      await apiClient(`/users/admin/${editUser.id}/operations`, {
        method: 'PATCH',
        body: JSON.stringify({
          verification_status: editForm.verification_status,
          maxCapacity: Number(editForm.maxCapacity),
          newPassword: editForm.newPassword || undefined
        })
      });
      showNotification(`Account details for ${editUser.name} updated successfully!`, 'success');
      setEditUser(null);
      fetchOperationsData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient(`/mentorship/admin/${reassignMentorship.id}/reassign`, {
        method: 'POST',
        body: JSON.stringify({
          newMentorId,
          reason: reassignReason
        })
      });
      showNotification(`Mentorship reassigned to new mentor!`, 'success');
      setReassignMentorship(null);
      fetchOperationsData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleCreateDomain = async (e) => {
    e.preventDefault();
    try {
      await apiClient('/domains', {
        method: 'POST',
        body: JSON.stringify(domainForm)
      });
      showNotification(`Domain '${domainForm.name}' created successfully!`, 'success');
      setShowDomainModal(false);
      fetchOperationsData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const studentsList = allUsers.filter(u => u.role === 'STUDENT');
  const alumniList = allUsers.filter(u => u.role === 'ALUMNI');

  // Group active mentorships by Alumni Mentor
  const activePairings = matrix.filter(m => m.status === 'ACTIVE');
  const mentorToStudentsMap = alumniList.map(mentor => {
    const mappedMentees = activePairings.filter(m => m.mentor_id === mentor.id || m.mentor_name === mentor.name);
    return {
      mentor,
      mentees: mappedMentees
    };
  });

  return (
    <div style={{ maxWidth: '1280px', margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* Header Action Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', color: 'var(--text-main)' }}>
            {activeSection === 'active_mentorships' ? 'All Active Mentorship Pairings' :
             activeSection === 'requests' ? 'Pending Requests & Verification Oversight' :
             activeSection === 'sessions' ? 'System 1-on-1 Virtual Sessions' :
             'Mentorship Operations Center'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Institutional Mentorship Management • Role-Based Operations Center
          </p>
        </div>
        <button onClick={fetchOperationsData} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} /> Refresh Center Data
        </button>
      </div>

      {/* KPI Counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Total Students</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>{analytics?.counts?.students || 0}</p>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Verified Alumni Mentors</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-purple)' }}>{analytics?.counts?.alumni || 0}</p>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Active Pairings</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{activePairings.length}</p>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Pending Verifications & Requests</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
            {pendingVerifications.length + pendingRequests.length}
          </p>
        </div>
      </div>

      {/* Operations Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-card)', marginBottom: '1.5rem', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`btn btn-sm ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '8px 8px 0 0' }}
        >
          <BarChart2 size={16} /> Operations Dashboard
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`btn btn-sm ${activeTab === 'matrix' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '8px 8px 0 0' }}
        >
          <TrendingUp size={16} /> Active Mentorship Matrix ({activePairings.length})
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`btn btn-sm ${activeTab === 'requests' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '8px 8px 0 0' }}
        >
          <ShieldCheck size={16} /> Pending Requests ({pendingRequests.length + pendingVerifications.length})
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`btn btn-sm ${activeTab === 'sessions' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '8px 8px 0 0' }}
        >
          <Video size={16} /> Virtual Sessions ({allSessions.length})
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`btn btn-sm ${activeTab === 'students' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '8px 8px 0 0' }}
        >
          <Users size={16} /> Students ({studentsList.length})
        </button>

        <button
          onClick={() => setActiveTab('alumni')}
          className={`btn btn-sm ${activeTab === 'alumni' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '8px 8px 0 0' }}
        >
          <Award size={16} /> Alumni Mentors ({alumniList.length})
        </button>

        <button
          onClick={() => setActiveTab('domains')}
          className={`btn btn-sm ${activeTab === 'domains' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '8px 8px 0 0' }}
        >
          <BookOpen size={16} /> Domains ({domains.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`btn btn-sm ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '8px 8px 0 0' }}
        >
          <Clock size={16} /> Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* VIEW 1: ACTIVE MENTORSHIPS MATRIX */}
      {activeTab === 'matrix' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Active Alumni Mentors & Mapped Student Mentees
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Hierarchical view of each Alumni Mentor and their assigned student mentees.
            </p>
          </div>

          {mentorToStudentsMap.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No active mentorship pairings found in the system.
            </div>
          ) : (
            mentorToStudentsMap.map(({ mentor, mentees }) => (
              <div key={mentor.id} className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-card)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      {mentor.name.charAt(0)}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.15rem', color: 'var(--text-main)' }}>{mentor.name}</h4>
                      <p style={{ fontSize: '0.825rem', color: 'var(--primary)', fontWeight: 600 }}>
                        {mentor.profile?.designation} at {mentor.profile?.company}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="badge badge-cyan" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                      {mentees.length} / {mentor.profile?.max_capacity || 5} Mapped Mentees
                    </span>
                    <button onClick={() => setAnalysisUser(mentor)} className="btn btn-secondary btn-sm">
                      <BarChart2 size={13} /> View Mentor Stats
                    </button>
                  </div>
                </div>

                {mentees.length === 0 ? (
                  <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                    Currently has 0 active mentees assigned. ({mentor.profile?.max_capacity || 5} available slots)
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Mapped Active Mentees ({mentees.length}):
                    </p>
                    {mentees.map(m => (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle)', padding: '0.85rem 1.15rem', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <User size={18} color="var(--primary)" />
                          <div>
                            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{m.student_name}</p>
                            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                              Domain: <strong style={{ color: 'var(--primary)' }}>{m.domain_name}</strong> • Status: <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>ACTIVE</span>
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                            Since {new Date(m.created_at || Date.now()).toLocaleDateString()}
                          </span>
                          <button onClick={() => setReassignMentorship(m)} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                            <RefreshCw size={12} /> Reassign Mentor
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW 2: PENDING REQUESTS & VERIFICATIONS */}
      {activeTab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '1rem' }}>
              Pending ID Card Verifications ({pendingVerifications.length})
            </h3>
            {pendingVerifications.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No pending user ID verifications in queue.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {pendingVerifications.map(u => (
                  <div key={u.id} style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{u.name}</p>
                      <span className={`badge ${u.role === 'STUDENT' ? 'badge-cyan' : 'badge-purple'}`}>{u.role}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{u.email}</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => setPreviewUser(u)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                        <FileText size={13} /> Inspect ID Card
                      </button>
                      <button onClick={() => handleVerifyAction(u.id, 'APPROVE')} className="btn btn-primary btn-sm">
                        <Check size={13} /> Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '1rem' }}>
              Pending Mentorship Applications ({pendingRequests.length})
            </h3>
            {pendingRequests.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No pending mentorship applications awaiting response.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-subtle)' }}>
                    <th style={{ padding: '0.75rem' }}>Applicant Mentee</th>
                    <th style={{ padding: '0.75rem' }}>Target Alumni Mentor</th>
                    <th style={{ padding: '0.75rem' }}>Domain</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                    <th style={{ padding: '0.75rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border-card)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>{r.student_name}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--primary)' }}>{r.mentor_name}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{r.domain_name}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span className="badge badge-amber">{r.status}</span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <button onClick={() => setReassignMentorship(r)} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                          <RefreshCw size={12} /> Reassign Mentor
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: VIRTUAL 1-ON-1 SESSIONS TRACKER */}
      {activeTab === 'sessions' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            System-Wide 1-on-1 Virtual Sessions Tracker
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Overview of proposed, scheduled, and completed virtual meeting sessions between students and alumni mentors.
          </p>

          {allSessions.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No virtual meeting sessions scheduled yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {allSessions.map(s => (
                <div key={s.id} style={{ padding: '1rem 1.25rem', background: 'var(--bg-subtle)', borderRadius: '10px', border: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <Video size={16} color="var(--primary)" />
                      <h4 style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{s.topic}</h4>
                      <span className={`badge ${s.status === 'CONFIRMED' ? 'badge-emerald' : 'badge-amber'}`}>
                        {s.status}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                      Student: <strong>{s.student_name}</strong> • Mentor: <strong style={{ color: 'var(--primary)' }}>{s.mentor_name}</strong> ({s.domain_name})
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveVirtualSession(s)}
                    className="btn btn-primary btn-sm"
                  >
                    <Video size={14} /> Launch In-App Video Call
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: DEFAULT DASHBOARD / USER DIRECTORY */}
      {(activeTab === 'dashboard' || activeTab === 'students' || activeTab === 'alumni' || activeTab === 'domains' || activeTab === 'audit') && (
        <div>
          {(activeTab === 'dashboard' || activeTab === 'students') && (
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.75rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '1rem' }}>Student Management Directory</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-subtle)' }}>
                      <th style={{ padding: '0.75rem' }}>Name & Reg Number</th>
                      <th style={{ padding: '0.75rem' }}>Email</th>
                      <th style={{ padding: '0.75rem' }}>Year & Department</th>
                      <th style={{ padding: '0.75rem' }}>Verification</th>
                      <th style={{ padding: '0.75rem' }}>Operations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsList.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--border-card)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {s.name} <br /><span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{s.profile?.reg_number || 'N/A'}</span>
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{s.email}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                          {s.profile?.academic_year} • {s.profile?.department}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span className={`badge ${s.verification_status === 'VERIFIED' ? 'badge-emerald' : s.verification_status === 'PENDING' ? 'badge-amber' : 'badge-rose'}`}>
                            {s.verification_status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', display: 'flex', gap: '0.35rem' }}>
                          <button onClick={() => setAnalysisUser(s)} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                            <BarChart2 size={12} color="var(--primary)" /> Detailed Analysis
                          </button>
                          <button
                            onClick={() => {
                              setEditUser(s);
                              setEditForm({ maxCapacity: '5', verification_status: s.verification_status, newPassword: '' });
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem' }}
                          >
                            <Edit size={12} /> Edit Account
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(activeTab === 'dashboard' || activeTab === 'alumni') && (
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.75rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '1rem' }}>Alumni Mentor Directory & Capacity Operations</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-subtle)' }}>
                      <th style={{ padding: '0.75rem' }}>Mentor Name</th>
                      <th style={{ padding: '0.75rem' }}>Company & Role</th>
                      <th style={{ padding: '0.75rem' }}>Mentee Capacity</th>
                      <th style={{ padding: '0.75rem' }}>Verification</th>
                      <th style={{ padding: '0.75rem' }}>Operations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alumniList.map(a => (
                      <tr key={a.id} style={{ borderBottom: '1px solid var(--border-card)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>{a.name}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--primary)' }}>
                          {a.profile?.designation} at {a.profile?.company}
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                          <span className="badge badge-cyan">{a.profile?.current_capacity || 0} / {a.profile?.max_capacity || 5} Mentees</span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span className={`badge ${a.verification_status === 'VERIFIED' ? 'badge-emerald' : 'badge-amber'}`}>
                            {a.verification_status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', display: 'flex', gap: '0.35rem' }}>
                          <button onClick={() => setAnalysisUser(a)} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                            <BarChart2 size={12} color="var(--accent-purple)" /> Detailed Analysis
                          </button>
                          <button
                            onClick={() => {
                              setEditUser(a);
                              const initialCap = (a.profile?.max_capacity && Number(a.profile.max_capacity) > 0) ? Number(a.profile.max_capacity) : 5;
                              setEditForm({ maxCapacity: String(initialCap), verification_status: a.verification_status, newPassword: '' });
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem' }}
                          >
                            <Edit size={12} /> Edit Capacity & Status
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'domains' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>Technical Domain Management</h3>
                <button onClick={() => setShowDomainModal(true)} className="btn btn-primary btn-sm">
                  <Plus size={14} /> Add New Domain
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {domains.map(d => (
                  <div key={d.id} className="glass-panel" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{d.name}</h4>
                      <span className="badge badge-purple">{d.category}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{d.description}</p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', background: 'var(--bg-subtle)', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-card)' }}>
                      Students Interested: {d.stats?.interested_students || 0} • Mentors: {d.stats?.available_mentors || 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>Administrative Audit Logs</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                {auditLogs.map(l => (
                  <div key={l.id} style={{ padding: '0.85rem 1rem', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span className="badge badge-purple" style={{ fontSize: '0.7rem', marginRight: '0.5rem' }}>{l.action}</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>{l.details}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{new Date(l.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Embedded 1-on-1 Virtual Video Conference Suite Modal */}
      {activeVirtualSession && (
        <VirtualMeetingModal
          session={activeVirtualSession}
          isOpen={Boolean(activeVirtualSession)}
          onClose={() => setActiveVirtualSession(null)}
        />
      )}

      {/* Detailed Analysis Modal */}
      {analysisUser && (
        <div className="modal-overlay" onClick={() => setAnalysisUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: '0.25rem' }}>Administrative Analysis Report</span>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)' }}>Detailed Profile & Performance Analysis</h3>
              </div>
              <button onClick={() => setAnalysisUser(null)} className="btn btn-secondary btn-sm"><X size={16} /></button>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-card)', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>{analysisUser.name}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{analysisUser.email}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className={`badge ${analysisUser.role === 'STUDENT' ? 'badge-cyan' : 'badge-purple'}`}>{analysisUser.role}</span>
                  <span className={`badge ${analysisUser.verification_status === 'VERIFIED' ? 'badge-emerald' : 'badge-amber'}`}>{analysisUser.verification_status}</span>
                </div>
              </div>

              {analysisUser.role === 'STUDENT' ? (
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}><strong>Register Number:</strong> {analysisUser.profile?.reg_number || 'N/A'}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}><strong>Academic Year:</strong> {analysisUser.profile?.academic_year || 'N/A'}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}><strong>Department:</strong> {analysisUser.profile?.department || 'N/A'}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '0.5rem' }}>
                    <strong>Career Goals:</strong> {analysisUser.profile?.career_goals || 'Building expertise in Software Engineering.'}
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}><strong>Company & Title:</strong> {analysisUser.profile?.designation} at {analysisUser.profile?.company}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}><strong>Experience:</strong> {analysisUser.profile?.experience_years} Years (Graduated {analysisUser.profile?.graduation_year})</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}><strong>Mentee Capacity:</strong> {analysisUser.profile?.current_capacity || 0} / {analysisUser.profile?.max_capacity || 5} Active Mentees</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '0.5rem' }}>
                    <strong>Bio:</strong> {analysisUser.profile?.bio || 'Experienced software mentor.'}
                  </p>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', background: 'var(--bg-card)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-card)', marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                Uploaded ID Credential Document:
              </p>
              <img
                src={getAssetUrl(analysisUser.role === 'STUDENT' ? analysisUser.profile?.student_id_card_url : analysisUser.profile?.alumni_id_card_url)}
                alt="Uploaded ID Credential Card"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80';
                }}
                style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--border-card)', objectFit: 'cover' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setAnalysisUser(null)} className="btn btn-secondary">Close Analysis</button>
            </div>
          </div>
        </div>
      )}

      {/* Review Document Inspection Modal */}
      {previewUser && (
        <div className="modal-overlay" onClick={() => setPreviewUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>Verify Credential Document: {previewUser.name}</h3>
              <button onClick={() => setPreviewUser(null)} className="btn btn-secondary btn-sm"><X size={16} /></button>
            </div>

            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              <img
                src={getAssetUrl(previewUser.role === 'STUDENT' ? previewUser.profile?.student_id_card_url : previewUser.profile?.alumni_id_card_url)}
                alt="ID Credential Card"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80';
                }}
                style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '1px solid var(--border-card)', objectFit: 'cover' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => handleVerifyAction(previewUser.id, 'APPROVE')} className="btn btn-primary" style={{ flex: 1 }}>
                <Check size={16} /> Approve Verification
              </button>
              <button onClick={() => handleVerifyAction(previewUser.id, 'REJECT')} className="btn btn-danger" style={{ flex: 1 }}>
                <X size={16} /> Reject Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '1rem' }}>Administrative Account Operations: {editUser.name}</h3>
            <form onSubmit={handleAdminUserUpdate}>
              <div className="form-group">
                <label className="form-label">Verification Status</label>
                <select
                  className="form-select"
                  value={editForm.verification_status}
                  onChange={(e) => setEditForm({ ...editForm, verification_status: e.target.value })}
                >
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="REJECTED">REJECTED / SUSPENDED</option>
                </select>
              </div>

              {editUser.role === 'ALUMNI' && (
                <div className="form-group">
                  <label className="form-label">Mentee Capacity Limit (Slots)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.maxCapacity}
                    onChange={(e) => setEditForm({ ...editForm, maxCapacity: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Reset Password (Optional)</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Leave blank to keep unchanged"
                  value={editForm.newPassword}
                  onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setEditUser(null)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassign Mentor Modal */}
      {reassignMentorship && (
        <div className="modal-overlay" onClick={() => setReassignMentorship(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '1rem' }}>Reassign Mentor for {reassignMentorship.student_name}</h3>
            <form onSubmit={handleReassignSubmit}>
              <div className="form-group">
                <label className="form-label">Select Target Alumni Mentor</label>
                <select
                  className="form-select"
                  value={newMentorId}
                  onChange={(e) => setNewMentorId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Verified Mentor --</option>
                  {alumniList.filter(a => a.verification_status === 'VERIFIED' && a.id !== reassignMentorship.mentor_id).map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.profile?.company} - {a.profile?.current_capacity || 0}/{a.profile?.max_capacity || 5} Mentees)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Reassignment Reason / Audit Note</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. Previous mentor requested workload transfer..."
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setReassignMentorship(null)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Execute Reassignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Domain Modal */}
      {showDomainModal && (
        <div className="modal-overlay" onClick={() => setShowDomainModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '1rem' }}>Create Technical Career Domain</h3>
            <form onSubmit={handleCreateDomain}>
              <div className="form-group">
                <label className="form-label">Domain Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Distributed Systems & Microservices"
                  value={domainForm.name}
                  onChange={(e) => setDomainForm({ ...domainForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={domainForm.category}
                  onChange={(e) => setDomainForm({ ...domainForm, category: e.target.value })}
                >
                  <option value="Core Engineering">Core Engineering</option>
                  <option value="Cloud & Infrastructure">Cloud & Infrastructure</option>
                  <option value="Data & AI">Data & AI</option>
                  <option value="Security & Systems">Security & Systems</option>
                  <option value="Mobile & Web">Mobile & Web</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Overview of skill tracks, expectations, and mentorship goals..."
                  value={domainForm.description}
                  onChange={(e) => setDomainForm({ ...domainForm, description: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowDomainModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Create Domain</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
