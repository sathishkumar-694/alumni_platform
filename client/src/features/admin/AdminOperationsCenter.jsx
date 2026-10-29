import { useState, useEffect, useCallback } from 'react';
import { apiClient, getAssetUrl } from '../../shared/services/api';
import { useNotification } from '../../shared/context/useNotification';
import {
  ShieldCheck,
  Users,
  Award,
  Check,
  X,
  FileText,
  UserCheck,
  Edit,
  RefreshCw,
  Plus,
  BookOpen,
  ExternalLink,
  Compass,
  Search,
  Lock,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react';

export const AdminOperationsCenter = ({ activeSection }) => {
  const { showNotification } = useNotification();

  const getTabForSection = (section) => {
    if (section === 'active_mentorships' || section === 'admin_matrix' || section === 'matrix') return 'matrix';
    if (section === 'requests' || section === 'admin_requests') return 'requests';
    if (section === 'sessions') return 'sessions';
    if (section === 'domains' || section === 'admin_domains') return 'domains';
    if (section === 'verifications' || section === 'admin_verifications') return 'verifications';
    if (section === 'users' || section === 'admin_users') return 'users';
    if (section === 'analytics' || section === 'admin_analytics' || section === 'admin_operations' || section === 'dashboard') return 'dashboard';
    return 'dashboard';
  };

  const activeTab = getTabForSection(activeSection);

  const [loading, setLoading] = useState(true);

  // Data states
  const [analytics, setAnalytics] = useState(null);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [matrix, setMatrix] = useState([]);
  const [domains, setDomains] = useState([]);
  const [pendingDomainRequests, setPendingDomainRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [reassignRequestsList, setReassignRequestsList] = useState([]);
  const [reviewingReassignId, setReviewingReassignId] = useState(null);

  // Modals & Drawers
  const [editUser, setEditUser] = useState(null);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
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

  // Rejection Reason Modal State ({ type: 'VERIFICATION' | 'DOMAIN', id, title, entityName })
  const [rejectionModal, setRejectionModal] = useState(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');

  // Search states for Admin tabs
  const [verifSearch, setVerifSearch] = useState('');
  const [matrixSearch, setMatrixSearch] = useState('');
  const [requestSearch, setRequestSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [domainSearch, setDomainSearch] = useState('');

  const fetchDomainRequests = useCallback(async () => {
    try {
      const res = await apiClient('/domains/requests/pending');
      const uniqueDomainReqs = [];
      const seen = new Set();
      (res.data || []).forEach(dr => {
        if (dr.id && !seen.has(dr.id)) {
          seen.add(dr.id);
          uniqueDomainReqs.push(dr);
        }
      });
      setPendingDomainRequests(uniqueDomainReqs);
    } catch (err) {
      console.warn('Pending domain requests error:', err.message);
    }
  }, []);

  const fetchOperationsData = useCallback(async () => {
    try {
      const [analyticsRes, pendingRes, usersRes, matrixRes, requestsRes, domainsRes, reassignRes] = await Promise.all([
        apiClient('/analytics/overview').catch(() => ({ data: null })),
        apiClient('/verification/pending').catch(() => ({ data: [] })),
        apiClient('/users').catch(() => ({ data: [] })),
        apiClient('/mentorship/admin/matrix').catch(() => ({ data: [] })),
        apiClient('/mentorship/admin/requests').catch(() => ({ data: [] })),
        apiClient('/domains').catch(() => ({ data: [] })),
        apiClient('/mentorship/reassign-requests').catch(() => ({ data: [] }))
      ]);

      setAnalytics(analyticsRes.data);

      // Deduplicate pending verifications
      const uniqueVerifications = [];
      const seenVerifIds = new Set();
      (pendingRes.data || []).forEach(v => {
        const id = v.user_id || v.id;
        if (id && !seenVerifIds.has(id)) {
          seenVerifIds.add(id);
          uniqueVerifications.push(v);
        }
      });
      setPendingVerifications(uniqueVerifications);

      // Deduplicate all users
      const uniqueUsers = [];
      const seenUserIds = new Set();
      (usersRes.data || []).forEach(u => {
        if (u.id && !seenUserIds.has(u.id)) {
          seenUserIds.add(u.id);
          uniqueUsers.push(u);
        }
      });
      setAllUsers(uniqueUsers);

      // Deduplicate active matrix
      const uniqueMatrix = [];
      const seenMatrixIds = new Set();
      (matrixRes.data || []).forEach(m => {
        if (m.id && !seenMatrixIds.has(m.id)) {
          seenMatrixIds.add(m.id);
          uniqueMatrix.push(m);
        }
      });
      setMatrix(uniqueMatrix);

      // Deduplicate requests
      const uniqueReqs = [];
      const seenReqIds = new Set();
      (requestsRes.data || []).forEach(r => {
        if (r.id && !seenReqIds.has(r.id)) {
          seenReqIds.add(r.id);
          uniqueReqs.push(r);
        }
      });
      setPendingRequests(uniqueReqs);

      // Deduplicate domains
      const uniqueDomains = [];
      const seenDomainIds = new Set();
      (domainsRes.data || []).forEach(d => {
        if (d.id && !seenDomainIds.has(d.id)) {
          seenDomainIds.add(d.id);
          uniqueDomains.push(d);
        }
      });
      setDomains(uniqueDomains);

      // Set reassign requests
      setReassignRequestsList(reassignRes.data || []);

      await fetchDomainRequests();

    } catch (err) {
      console.error('Failed to load admin operations data:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchDomainRequests]);

  const refreshOperationsData = () => {
    setLoading(true);
    fetchOperationsData();
  };

  useEffect(() => {
    void Promise.resolve().then(fetchOperationsData);
  }, [fetchOperationsData]);

  const handleVerifyUser = async (userId, action, reason = '') => {
    try {
      await apiClient(`/verification/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ action, reason })
      });
      showNotification(`Verification status ${action === 'APPROVE' ? 'APPROVED' : 'REJECTED'}`, 'success');
      setRejectionModal(null);
      setRejectionReasonText('');
      refreshOperationsData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleUpdateUserByAdmin = async (e) => {
    e.preventDefault();
    if (!editUser) return;

    try {
      await apiClient(`/users/${editUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          verification_status: editForm.verification_status,
          maxCapacity: Number(editForm.maxCapacity),
          newPassword: editForm.newPassword || undefined
        })
      });
      showNotification(`Updated ${editUser.name}'s profile parameters`, 'success');
      setEditUser(null);
      refreshOperationsData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!reassignMentorship || !newMentorId) return;

    try {
      await apiClient(`/mentorship/admin/${reassignMentorship.id}/reassign`, {
        method: 'POST',
        body: JSON.stringify({
          newMentorId,
          reason: reassignReason
        })
      });
      showNotification('Student successfully reassigned to new Alumni Mentor', 'success');
      setReassignMentorship(null);
      setNewMentorId('');
      setReassignReason('');
      refreshOperationsData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleReviewConnectionRequest = async (request, action) => {
    setReviewingReassignId(request.id);
    try {
      await apiClient(`/mentorship/reassign-requests/${request.id}/review`, {
        method: 'POST',
        body: JSON.stringify({ action })
      });
      showNotification(action === 'APPROVE' ? 'Request approved; existing mentorship connection ended.' : 'Request rejected.', 'success');
      await fetchOperationsData();
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setReviewingReassignId(null);
    }
  };

  const handleApproveDomainRequest = async (requestId) => {
    try {
      await apiClient(`/domains/requests/${requestId}/approve`, { method: 'PATCH' });
      showNotification('Technical domain request approved and created!', 'success');
      refreshOperationsData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleRejectDomainRequest = async (requestId, reason = '') => {
    try {
      await apiClient(`/domains/requests/${requestId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason })
      });
      showNotification('Domain request rejected', 'info');
      setRejectionModal(null);
      setRejectionReasonText('');
      refreshOperationsData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleCreateDomainSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient('/domains', {
        method: 'POST',
        body: JSON.stringify(domainForm)
      });
      showNotification(`Domain '${domainForm.name}' created successfully`, 'success');
      setShowDomainModal(false);
      setDomainForm({ name: '', category: 'Core Engineering', description: '', icon: 'Code' });
      refreshOperationsData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const alumniUsers = allUsers.filter(u => u.role === 'ALUMNI');

  // Filtered lists for admin views
  const filteredVerifications = pendingVerifications.filter(v => {
    if (!verifSearch.trim()) return true;
    const q = verifSearch.toLowerCase().trim();
    const userName = (v.user?.name || v.name || '').toLowerCase();
    const userEmail = (v.user?.email || v.email || '').toLowerCase();
    const userRole = (v.user?.role || v.role || '').toLowerCase();
    return userName.includes(q) || userEmail.includes(q) || userRole.includes(q);
  });

  const filteredMatrix = matrix.filter(item => {
    if (!matrixSearch.trim()) return true;
    const q = matrixSearch.toLowerCase().trim();
    return (
      (item.student_name || '').toLowerCase().includes(q) ||
      (item.student_email || '').toLowerCase().includes(q) ||
      (item.mentor_name || '').toLowerCase().includes(q) ||
      (item.mentor_email || '').toLowerCase().includes(q) ||
      (item.domain_name || '').toLowerCase().includes(q) ||
      (item.status || '').toLowerCase().includes(q)
    );
  });

  const filteredRequests = pendingRequests.filter(req => {
    if (!requestSearch.trim()) return true;
    const q = requestSearch.toLowerCase().trim();
    return (
      (req.student_name || '').toLowerCase().includes(q) ||
      (req.student_email || '').toLowerCase().includes(q) ||
      (req.mentor_name || '').toLowerCase().includes(q) ||
      (req.mentor_email || '').toLowerCase().includes(q) ||
      (req.domain_name || '').toLowerCase().includes(q) ||
      (req.message || '').toLowerCase().includes(q) ||
      (req.status || '').toLowerCase().includes(q)
    );
  });

  const filteredUsers = allUsers.filter(u => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase().trim();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q) ||
      (u.verification_status || '').toLowerCase().includes(q)
    );
  });

  const filteredDomains = domains.filter(d => {
    if (!domainSearch.trim()) return true;
    const q = domainSearch.toLowerCase().trim();
    return (
      (d.name || '').toLowerCase().includes(q) ||
      (d.category || '').toLowerCase().includes(q) ||
      (d.description || '').toLowerCase().includes(q)
    );
  });

  const filteredDomainRequests = pendingDomainRequests.filter(req => {
    if (!domainSearch.trim()) return true;
    const q = domainSearch.toLowerCase().trim();
    return (
      (req.name || '').toLowerCase().includes(q) ||
      (req.description || '').toLowerCase().includes(q) ||
      (req.category || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ maxWidth: '1280px', margin: '1.5rem auto', padding: '0 1.5rem' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', borderBottom: '1px solid var(--border-card)', paddingBottom: '1.25rem' }}>
        <div>
          <span className="badge badge-purple" style={{ marginBottom: '0.4rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <ShieldCheck size={12} />
            {activeTab === 'dashboard' && 'ADMIN CONTROLS • PLATFORM OVERVIEW & ANALYTICS'}
            {activeTab === 'verifications' && `ADMIN CONTROLS • PENDING ID VERIFICATIONS (${pendingVerifications.length})`}
            {activeTab === 'matrix' && `ADMIN CONTROLS • ACTIVE PAIRINGS MATRIX (${matrix.length})`}
            {activeTab === 'requests' && `ADMIN CONTROLS • MENTORSHIP REQUESTS (${pendingRequests.length})`}
            {activeTab === 'users' && `ADMIN CONTROLS • USER ACCOUNTS (${allUsers.length})`}
            {activeTab === 'domains' && `ADMIN CONTROLS • TECHNICAL DOMAINS (${domains.length})`}
          </span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {activeTab === 'dashboard' && 'Overview & Analytics'}
            {activeTab === 'verifications' && 'Pending Student & Alumni ID Verifications'}
            {activeTab === 'matrix' && 'Active Mentorship Pairings Matrix'}
            {activeTab === 'requests' && 'All Student Mentorship Requests'}
            {activeTab === 'users' && 'User Accounts & Capacity Overrides'}
            {activeTab === 'domains' && 'Technical Domain Directory Management'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {activeTab === 'dashboard' && 'Live KPI indicators, session completion rates, and platform engagement tracking.'}
            {activeTab === 'verifications' && 'Review institutional ID cards submitted by students and alumni for official platform approval.'}
            {activeTab === 'matrix' && 'Manage all active student-mentor pairings and execute mentorship reassignments.'}
            {activeTab === 'requests' && 'Monitor all student mentorship requests, status tracks, and target mentors.'}
            {activeTab === 'users' && 'Manage user permissions, password resets, verification overrides, and mentee capacity caps.'}
            {activeTab === 'domains' && 'Review and approve technical domain proposals submitted by mentors or add new domains.'}
          </p>
        </div>

        <button onClick={refreshOperationsData} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="spin" style={{ marginBottom: '1rem' }} />
          <p>Loading Operations Center live matrix...</p>
        </div>
      ) : (
        <div>
          
          {/* TAB 1: OVERVIEW & ANALYTICS */}
          {activeTab === 'dashboard' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Total Registered Students</p>
                  <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{analytics?.kpi?.total_students || 0}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>{analytics?.kpi?.verified_students || 0} Verified</p>
                </div>

                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Total Alumni Mentors</p>
                  <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-purple)' }}>{analytics?.kpi?.total_alumni || 0}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>{analytics?.kpi?.verified_alumni || 0} Verified</p>
                </div>

                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Active Mentorship Pairs</p>
                  <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{matrix.length}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Pairings</p>
                </div>

                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Pending Verification Queue</p>
                  <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-rose)' }}>{pendingVerifications.length}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--accent-rose)' }}>Requires Action</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>
                    📊 Session Completion Overview
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Total 1-on-1 Sessions Scheduled: <strong>{analytics?.sessions_overview?.total || 0}</strong>
                  </p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Completed Virtual Sessions: <strong>{analytics?.sessions_overview?.completed || 0}</strong>
                  </p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700 }}>
                    Completion Rate: {analytics?.kpi?.session_completion_rate || 0}%
                  </p>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>
                    🎯 Milestone Progress Track
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Total Action Milestones Created: <strong>{analytics?.milestones_overview?.total || 0}</strong>
                  </p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Completed Milestones: <strong>{analytics?.milestones_overview?.completed || 0}</strong>
                  </p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--accent-purple)', fontWeight: 700 }}>
                    Milestone Completion Rate: {analytics?.kpi?.milestone_completion_rate || 0}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PENDING ID VERIFICATIONS */}
          {activeTab === 'verifications' && (
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  Pending Student & Alumni ID Verifications ({filteredVerifications.length}{verifSearch ? ` of ${pendingVerifications.length}` : ''})
                </h3>
                <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search by name, email, role..."
                    value={verifSearch}
                    onChange={(e) => setVerifSearch(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '2.25rem', paddingRight: verifSearch ? '2rem' : '0.75rem', height: '36px', fontSize: '0.82rem', width: '100%' }}
                  />
                  {verifSearch && (
                    <button
                      onClick={() => setVerifSearch('')}
                      style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {pendingVerifications.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                  No pending ID verifications in queue. All user credentials verified!
                </p>
              ) : filteredVerifications.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                  No pending verifications match "{verifSearch}".
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
                  {filteredVerifications.map((v) => {
                    const userName = v.user?.name || v.name || 'User Account';
                    const userEmail = v.user?.email || v.email || 'N/A';
                    const userRole = v.user?.role || v.role || 'USER';
                    const targetUserId = v.user_id || v.id;
                    const dateStr = v.submitted_at || v.created_at;
                    const dateVal = dateStr ? new Date(dateStr) : new Date();
                    const validDateStr = isNaN(dateVal.getTime()) ? new Date().toLocaleDateString() : dateVal.toLocaleDateString();

                    return (
                      <div key={v.id || targetUserId} style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-card)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>{userName}</h4>
                          <span className="badge badge-purple">{userRole}</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Email: {userEmail}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Submitted: {validDateStr}</p>

                        <div style={{ display: 'flex', gap: '0.4rem', flexDirection: 'column', marginTop: '0.5rem' }}>
                          <button onClick={() => setSelectedUserForDetails(v)} className="btn btn-secondary btn-sm" style={{ width: '100%', fontSize: '0.78rem' }}>
                            <FileText size={14} /> View Full Details & ID Photo
                          </button>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => handleVerifyUser(targetUserId, 'APPROVE')} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                              <Check size={14} /> Approve ID
                            </button>
                            <button
                              onClick={() => {
                                setRejectionReasonText('');
                                setRejectionModal({
                                  type: 'VERIFICATION',
                                  id: targetUserId,
                                  title: 'ID Verification',
                                  entityName: userName
                                });
                              }}
                              className="btn btn-danger btn-sm"
                              style={{ flex: 1 }}
                            >
                              <X size={14} /> Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACTIVE MENTORSHIP PAIRINGS */}
          {activeTab === 'matrix' && (
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  Active Mentorship Pairings Matrix ({filteredMatrix.length}{matrixSearch ? ` of ${matrix.length}` : ''})
                </h3>
                <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search student, mentor, domain, status..."
                    value={matrixSearch}
                    onChange={(e) => setMatrixSearch(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '2.25rem', paddingRight: matrixSearch ? '2rem' : '0.75rem', height: '36px', fontSize: '0.82rem', width: '100%' }}
                  />
                  {matrixSearch && (
                    <button
                      onClick={() => setMatrixSearch('')}
                      style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {matrix.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                  No active mentorship pairings recorded.
                </p>
              ) : filteredMatrix.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                  No mentorship pairings match "{matrixSearch}".
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-subtle)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '0.75rem' }}>Student Mentee</th>
                        <th style={{ padding: '0.75rem' }}>Alumni Mentor</th>
                        <th style={{ padding: '0.75rem' }}>Domain</th>
                        <th style={{ padding: '0.75rem' }}>Pairing Status</th>
                        <th style={{ padding: '0.75rem' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMatrix.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-card)' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            {item.student_name}
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{item.student_email}</span>
                          </td>
                          <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>
                            {item.mentor_name}
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{item.mentor_email}</span>
                          </td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{item.domain_name}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <span className={`badge ${item.status === 'ACTIVE' ? 'badge-emerald' : 'badge-amber'}`}>
                              {item.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <button onClick={() => setReassignMentorship(item)} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                              Reassign Mentor
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MENTORSHIP REQUESTS */}
          {activeTab === 'requests' && (
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  All Student Mentorship Requests ({filteredRequests.length}{requestSearch ? ` of ${pendingRequests.length}` : ''})
                </h3>
                <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search applicant, mentor, domain, status..."
                    value={requestSearch}
                    onChange={(e) => setRequestSearch(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '2.25rem', paddingRight: requestSearch ? '2rem' : '0.75rem', height: '36px', fontSize: '0.82rem', width: '100%' }}
                  />
                  {requestSearch && (
                    <button
                      onClick={() => setRequestSearch('')}
                      style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {pendingRequests.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                  No mentorship requests found.
                </p>
              ) : filteredRequests.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                  No mentorship requests match "{requestSearch}".
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-subtle)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '0.75rem' }}>Student Applicant</th>
                        <th style={{ padding: '0.75rem' }}>Target Mentor</th>
                        <th style={{ padding: '0.75rem' }}>Domain</th>
                        <th style={{ padding: '0.75rem' }}>Message</th>
                        <th style={{ padding: '0.75rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((req) => (
                        <tr key={req.id} style={{ borderBottom: '1px solid var(--border-card)' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            {req.student_name}
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{req.student_email}</span>
                          </td>
                          <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>
                            {req.mentor_name}
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{req.mentor_email}</span>
                          </td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{req.domain_name}</td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', maxWidth: '250px' }}>
                            "{req.message}"
                          </td>
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

          {/* MENTOR CHANGE REQUESTS from Students */}
          {activeTab === 'requests' && reassignRequestsList.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', marginTop: '1.5rem', borderColor: '#fde68a', background: '#fffbeb' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#92400e', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ⚠️ Student Mentor Change Requests ({reassignRequestsList.filter(r => r.status === 'PENDING').length} pending)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1rem' }}>
                {reassignRequestsList.map(rr => (
                  <div key={rr.id} style={{ background: '#fff', border: '1px solid #fde68a', borderRadius: '12px', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{rr.student_name}</h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>{rr.student_email}</p>
                      </div>
                      <span className={`badge ${rr.status === 'PENDING' ? 'badge-amber' : rr.status === 'APPROVED' ? 'badge-emerald' : 'badge-rose'}`}>{rr.status}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.4rem' }}>
                      Current Mentor: <strong style={{ color: '#0f172a' }}>{rr.mentor_name}</strong>
                    </p>
                    <div style={{ background: '#fefce8', padding: '0.65rem 0.85rem', borderRadius: '8px', marginBottom: '0.75rem', border: '1px solid #fef08a' }}>
                      <p style={{ fontSize: '0.78rem', color: '#78350f', margin: 0, fontStyle: 'italic' }}>Reason: "{rr.reason}"</p>
                    </div>
                    {rr.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          disabled={reviewingReassignId === rr.id}
                          onClick={() => handleReviewConnectionRequest(rr, 'APPROVE')}
                          className="btn btn-primary btn-sm" style={{ flex: 1, fontSize: '0.78rem' }}
                        >
                          ✓ Approve & End Connection
                        </button>
                        <button
                          disabled={reviewingReassignId === rr.id}
                          onClick={() => handleReviewConnectionRequest(rr, 'REJECT')}
                          className="btn btn-danger btn-sm" style={{ flex: 1, fontSize: '0.78rem' }}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: USER ACCOUNTS & CAPACITY OVERRIDES */}
          {activeTab === 'users' && (
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  User Accounts & Capacity Overrides ({filteredUsers.length}{userSearch ? ` of ${allUsers.length}` : ''})
                </h3>
                <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search name, email, role, verification..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '2.25rem', paddingRight: userSearch ? '2rem' : '0.75rem', height: '36px', fontSize: '0.82rem', width: '100%' }}
                  />
                  {userSearch && (
                    <button
                      onClick={() => setUserSearch('')}
                      style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {allUsers.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                  No users registered.
                </p>
              ) : filteredUsers.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                  No user accounts match "{userSearch}".
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-subtle)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '0.75rem' }}>User Name</th>
                        <th style={{ padding: '0.75rem' }}>Email</th>
                        <th style={{ padding: '0.75rem' }}>Role</th>
                        <th style={{ padding: '0.75rem' }}>Verification</th>
                        <th style={{ padding: '0.75rem' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border-card)' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>{u.name}</td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</td>
                          <td style={{ padding: '0.75rem' }}><span className="badge badge-purple">{u.role}</span></td>
                          <td style={{ padding: '0.75rem' }}>
                            <span className={`badge ${u.verification_status === 'VERIFIED' ? 'badge-emerald' : 'badge-amber'}`}>
                              {u.verification_status || 'VERIFIED'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button onClick={() => setSelectedUserForDetails(u)} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                              <FileText size={13} /> View Details
                            </button>
                            <button
                               onClick={() => {
                                 setEditUser(u);
                                 setShowNewPassword(false);
                                 setEditForm({
                                   verification_status: u.verification_status || "VERIFIED",
                                   maxCapacity: String(u.profile?.max_capacity ?? u.profile?.maxCapacity ?? 5),
                                   newPassword: ""
                                 });
                               }}
                               className="btn btn-secondary btn-sm"
                               style={{ fontSize: "0.75rem" }}
                             >
                               <Edit size={13} /> Edit Account
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: TECHNICAL DOMAINS & MENTOR REQUESTS */}
          {activeTab === 'domains' && (
            <div>
              {/* Pending Domain Addition Requests */}
              <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Compass size={20} color="var(--primary)" /> Pending Domain Addition Requests from Alumni Mentors ({pendingDomainRequests.length})
                </h3>

                {pendingDomainRequests.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No pending domain addition requests.</p>
                ) : filteredDomainRequests.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No pending domain requests match "{domainSearch}".</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {filteredDomainRequests.map((req) => (
                      <div key={req.id} style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-card)' }}>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>{req.name}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{req.description || 'No description provided'}</p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleApproveDomainRequest(req.id)} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                            <Check size={14} /> Approve Domain
                          </button>
                          <button
                            onClick={() => {
                              setRejectionReasonText('');
                              setRejectionModal({
                                type: 'DOMAIN',
                                id: req.id,
                                title: 'Domain Addition Proposal',
                                entityName: req.name
                              });
                            }}
                            className="btn btn-danger btn-sm"
                            style={{ flex: 1 }}
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Technical Domain Directory List */}
              <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                    Technical Domain Directory Management ({filteredDomains.length}{domainSearch ? ` of ${domains.length}` : ''})
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', width: '260px' }}>
                      <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        placeholder="Search domain or category..."
                        value={domainSearch}
                        onChange={(e) => setDomainSearch(e.target.value)}
                        className="form-input"
                        style={{ paddingLeft: '2.25rem', paddingRight: domainSearch ? '2rem' : '0.75rem', height: '36px', fontSize: '0.82rem', width: '100%' }}
                      />
                      {domainSearch && (
                        <button
                          onClick={() => setDomainSearch('')}
                          style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                          title="Clear search"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <button onClick={() => setShowDomainModal(true)} className="btn btn-primary btn-sm">
                      <Plus size={14} /> Add Domain
                    </button>
                  </div>
                </div>

                {filteredDomains.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                    {domainSearch ? `No technical domains match "${domainSearch}".` : 'No technical domains registered.'}
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {filteredDomains.map((d) => (
                      <div key={d.id} style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{d.name}</h4>
                        <span className="badge badge-purple" style={{ fontSize: '0.65rem', marginTop: '0.25rem' }}>{d.category || 'Core Engineering'}</span>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{d.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="modal-overlay" onClick={() => { setEditUser(null); setShowNewPassword(false); }}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px', width: '94%' }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-card)' }}>
              <div>
                <span className="badge badge-purple" style={{ marginBottom: '0.35rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <ShieldCheck size={11} /> ADMIN OVERRIDE
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>{editUser.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>{editUser.email} · <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{editUser.role}</span></p>
              </div>
              <button onClick={() => { setEditUser(null); setShowNewPassword(false); }} className="btn btn-secondary btn-sm" style={{ padding: '0.4rem' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateUserByAdmin}>
              {/* Verification Status */}
              <div style={{ marginBottom: '1.1rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <UserCheck size={14} /> Verification Status
                </label>
                <select
                  className="form-input"
                  value={editForm.verification_status}
                  onChange={(e) => setEditForm({ ...editForm, verification_status: e.target.value })}
                >
                  <option value="VERIFIED">✅ VERIFIED</option>
                  <option value="PENDING">⏳ PENDING</option>
                  <option value="REJECTED">❌ REJECTED</option>
                  <option value="SUSPENDED">🚫 SUSPENDED</option>
                </select>
              </div>

              {/* Mentee Capacity Override – Alumni only */}
              {editUser.role === 'ALUMNI' && (
                <div style={{ marginBottom: '1.1rem' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Users size={14} /> Max Mentee Capacity Override
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="form-input"
                    value={editForm.maxCapacity}
                    onChange={(e) => setEditForm({ ...editForm, maxCapacity: e.target.value })}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Current: {editUser.profile?.max_capacity ?? 5} mentees</p>
                </div>
              )}

              {/* ─── Password Reset Override ─── */}
              <div style={{ marginBottom: '1.1rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <KeyRound size={14} /> Force Password Reset
                </label>
                <div
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '12px',
                    padding: '1rem'
                  }}
                >
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                    Set a new password for this user. Leave blank to keep the current password unchanged.
                  </p>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="admin-new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="New password (min 6 characters)"
                      value={editForm.newPassword}
                      onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                      style={{ paddingLeft: '2.25rem', paddingRight: '2.75rem' }}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(v => !v)}
                      style={{
                        position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '0.2rem'
                      }}
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Password strength bar */}
                  {editForm.newPassword.length > 0 && (() => {
                    const len = editForm.newPassword.length;
                    const hasUpper = /[A-Z]/.test(editForm.newPassword);
                    const hasNum   = /[0-9]/.test(editForm.newPassword);
                    const hasSpec  = /[^A-Za-z0-9]/.test(editForm.newPassword);
                    const score = (len >= 8 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNum ? 1 : 0) + (hasSpec ? 1 : 0);
                    const levels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
                    const colors = ['', '#ef4444', '#f59e0b', '#10b981', '#6366f1'];
                    return (
                      <div style={{ marginTop: '0.6rem' }}>
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '0.3rem' }}>
                          {[1,2,3,4].map(i => (
                            <div key={i} style={{
                              flex: 1, height: '4px', borderRadius: '2px',
                              background: i <= score ? colors[score] : 'var(--border-card)',
                              transition: 'background 0.3s'
                            }} />
                          ))}
                        </div>
                        <p style={{ fontSize: '0.72rem', color: colors[score], fontWeight: 600 }}>
                          {levels[score]} {score > 0 ? 'password' : ''}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => { setEditUser(null); setShowNewPassword(false); }} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Check size={15} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Full Student / Alumni User Details Modal */}
      {selectedUserForDetails && (() => {
        const u = selectedUserForDetails.user || selectedUserForDetails;
        const p = selectedUserForDetails.profile || u.profile || {};
        const isAlumni = u.role === 'ALUMNI';
        const isStudent = u.role === 'STUDENT';
        const idCardUrl = isAlumni ? (p.alumni_id_card_url || p.alumniIdCardUrl) : (p.student_id_card_url || p.studentIdCardUrl);
        const formattedIdCardUrl = idCardUrl ? getAssetUrl(idCardUrl) : null;
        const targetUserId = u.id || selectedUserForDetails.user_id;

        return (
          <div className="modal-overlay" onClick={() => setSelectedUserForDetails(null)}>
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '680px', width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem', margin: 'auto' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-card)', paddingBottom: '1rem' }}>
                <div>
                  <span className="badge badge-purple" style={{ marginBottom: '0.4rem' }}>
                    FULL USER DOSSIER ({u.role})
                  </span>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>{u.name}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.email}</p>
                </div>
                <button onClick={() => setSelectedUserForDetails(null)} className="btn btn-secondary btn-sm" style={{ padding: '0.4rem' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Status Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem', background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
                <div>
                  <p style={{ fontSize: '0.725rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Account Role</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>{u.role}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.725rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Verification Status</p>
                  <span className={`badge ${u.verification_status === 'VERIFIED' ? 'badge-emerald' : u.verification_status === 'REJECTED' ? 'badge-rose' : 'badge-amber'}`} style={{ marginTop: '0.2rem' }}>
                    {u.verification_status || 'PENDING'}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: '0.725rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>User ID</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>#{targetUserId}</p>
                </div>
              </div>

              {/* Detailed Fields for Alumni */}
              {isAlumni && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Award size={16} color="var(--primary)" /> Alumni Professional Credentials
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ background: 'var(--bg-card)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Current Organization / Company</p>
                      <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{p.company || 'Not Provided'}</p>
                    </div>

                    <div style={{ background: 'var(--bg-card)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Designation / Job Role</p>
                      <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{p.designation || 'Not Provided'}</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div style={{ background: 'var(--bg-card)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Experience</p>
                      <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{p.experience_years || p.experienceYears || 0} Years</p>
                    </div>

                    <div style={{ background: 'var(--bg-card)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Graduation Year</p>
                      <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{p.graduation_year || p.graduationYear || 'N/A'}</p>
                    </div>

                    <div style={{ background: 'var(--bg-card)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Mentee Capacity</p>
                      <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-purple)' }}>
                        {p.current_capacity || 0} / {p.max_capacity || p.maxCapacity || 5} Mentees
                      </p>
                    </div>
                  </div>

                  {p.linkedin_url && (
                    <div style={{ background: 'var(--bg-card)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>LinkedIn Profile</p>
                      <a href={p.linkedin_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                        {p.linkedin_url} <ExternalLink size={12} />
                      </a>
                    </div>
                  )}

                  {p.bio && (
                    <div style={{ background: 'var(--bg-card)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Professional Bio</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>{p.bio}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Detailed Fields for Student */}
              {isStudent && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <BookOpen size={16} color="var(--primary)" /> Student Academic Dossier
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ background: 'var(--bg-card)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Registration Number</p>
                      <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{p.reg_number || p.regNumber || 'N/A'}</p>
                    </div>

                    <div style={{ background: 'var(--bg-card)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Academic Year</p>
                      <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{p.academic_year || p.academicYear || 'N/A'}</p>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-card)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Department / Major</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{p.department || 'N/A'}</p>
                  </div>

                  {p.career_goals && (
                    <div style={{ background: 'var(--bg-card)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Career Goals & Aspirations</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>{p.career_goals}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Uploaded ID Card Credential Image Preview */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={16} color="var(--primary)" /> Uploaded Verification ID Card Document
                </h4>

                {formattedIdCardUrl ? (
                  <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-card)', textAlign: 'center' }}>
                    <img
                      src={formattedIdCardUrl}
                      alt="Verification ID Card Document"
                      style={{ maxWidth: '100%', maxHeight: '280px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-card)', marginBottom: '0.75rem' }}
                    />
                    <div>
                      <a href={formattedIdCardUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <ExternalLink size={14} /> Open Full Resolution Photo
                      </a>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: '12px', border: '1px dashed var(--border-card)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    ⚠️ No ID card credential photo uploaded for this account.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-card)', paddingTop: '1rem' }}>
                {u.verification_status !== 'VERIFIED' && (
                  <button onClick={() => { handleVerifyUser(targetUserId, 'APPROVE'); setSelectedUserForDetails(null); }} className="btn btn-primary btn-sm">
                    <Check size={14} /> Approve Verification
                  </button>
                )}
                {u.verification_status !== 'REJECTED' && (
                  <button onClick={() => { handleVerifyUser(targetUserId, 'REJECT'); setSelectedUserForDetails(null); }} className="btn btn-danger btn-sm">
                    <X size={14} /> Reject Account
                  </button>
                )}
                <button onClick={() => setSelectedUserForDetails(null)} className="btn btn-secondary btn-sm">
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Reassign Mentor Modal */}
      {reassignMentorship && (
        <div className="modal-overlay" onClick={() => setReassignMentorship(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>Reassign Alumni Mentor</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Student: <strong>{reassignMentorship.student_name}</strong> • Current Mentor: <strong>{reassignMentorship.mentor_name}</strong>
            </p>
            <form onSubmit={handleReassignSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Select New Alumni Mentor</label>
                <select
                  className="form-input"
                  value={newMentorId}
                  onChange={(e) => setNewMentorId(e.target.value)}
                  required
                >
                  <option value="">Select verified mentor...</option>
                  {alumniUsers.filter(a => String(a.id) !== String(reassignMentorship.mentor_id)).map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Reason for Reassignment</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Optional notes for reassignment"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setReassignMentorship(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Reassign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Domain Modal */}
      {showDomainModal && (
        <div className="modal-overlay" onClick={() => setShowDomainModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>Add Technical Domain</h3>
            <form onSubmit={handleCreateDomainSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Domain Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={domainForm.name}
                  onChange={(e) => setDomainForm({ ...domainForm, name: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={domainForm.category}
                  onChange={(e) => setDomainForm({ ...domainForm, category: e.target.value })}
                >
                  <option value="Core Engineering">Core Engineering</option>
                  <option value="Advanced Tech">Advanced Tech</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Security">Security</option>
                  <option value="Data">Data</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  required
                  value={domainForm.description}
                  onChange={(e) => setDomainForm({ ...domainForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowDomainModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Domain</button>
              </div>
            </form>
          </div>
        </div>)}
      {/* Universal Rejection Reason Modal */}
      {rejectionModal && (
        <div className="modal-overlay" onClick={() => setRejectionModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Reject {rejectionModal.title}
              </h3>
              <button
                onClick={() => setRejectionModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
              Specify the rejection reason for <strong>{rejectionModal.entityName}</strong>. This feedback is officially recorded and forwarded to the applicant.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Rejection Reason (Feedback for Applicant):
              </label>
              <textarea
                rows={4}
                className="form-input"
                placeholder="e.g., ID card image is blurred, registration number mismatch, or curriculum overlap with existing domains..."
                value={rejectionReasonText}
                onChange={(e) => setRejectionReasonText(e.target.value)}
                style={{ width: '100%', resize: 'vertical', fontSize: '0.85rem' }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setRejectionModal(null)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (rejectionModal.type === 'VERIFICATION') {
                    handleVerifyUser(rejectionModal.id, 'REJECT', rejectionReasonText);
                  } else if (rejectionModal.type === 'DOMAIN') {
                    handleRejectDomainRequest(rejectionModal.id, rejectionReasonText);
                  }
                }}
                className="btn btn-danger btn-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
