import React, { useState, useEffect } from 'react';
import { apiClient } from '../../shared/services/api';
import { useAuth } from '../../shared/context/AuthContext';
import { useNotification } from '../../shared/context/NotificationContext';
import {
  Code,
  Layers,
  Database,
  Cloud,
  Cpu,
  Shield,
  Smartphone,
  Globe,
  Terminal,
  Server,
  Plus,
  Users,
  Award,
  CheckCircle2,
  BookmarkCheck,
  Send,
  X,
  ChevronRight,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

const ICON_MAP = {
  Code: Code,
  Layers: Layers,
  Database: Database,
  Cloud: Cloud,
  Cpu: Cpu,
  Shield: Shield,
  Smartphone: Smartphone,
  Globe: Globe,
  Terminal: Terminal,
  Server: Server
};

export const DomainExplorer = ({ onOpenCreateDomain, onRequestMentorship }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Initialize student/alumni domain interests directly from user context (Frame 1 0ms instant display)
  const [studentInterests, setStudentInterests] = useState(() => {
    return user?.profile?.interests || user?.interests || [];
  });

  const [alumniExpertise, setAlumniExpertise] = useState(() => {
    return user?.profile?.expertise || user?.expertise || [];
  });

  // Sync user context when user object changes
  useEffect(() => {
    if (user?.profile?.interests) {
      setStudentInterests(user.profile.interests);
    }
    if (user?.profile?.expertise) {
      setAlumniExpertise(user.profile.expertise);
    }
  }, [user]);

  // Confirmation modal state for domain action (Add/Remove)
  const [confirmDomainModal, setConfirmDomainModal] = useState(null); // { domain, actionType: 'ADD' | 'REMOVE', roleType: 'STUDENT' | 'ALUMNI' }

  // Modal for domain mentors
  const [selectedDomainModal, setSelectedDomainModal] = useState(null);
  const [domainMentors, setDomainMentors] = useState([]);
  const [loadingMentors, setLoadingMentors] = useState(false);

  const fetchDomains = async () => {
    try {
      const res = await apiClient('/domains');
      setDomains(res.data || []);
    } catch (err) {
      console.error('Failed to load domains:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfiles = async () => {
    if (!user) return;
    try {
      if (user.role === 'STUDENT') {
        const studentRes = await apiClient('/users/me');
        if (studentRes.data?.profile?.interests) {
          setStudentInterests(studentRes.data.profile.interests);
        }
      } else if (user.role === 'ALUMNI') {
        const alumniRes = await apiClient('/users/me');
        if (alumniRes.data?.profile?.expertise) {
          setAlumniExpertise(alumniRes.data.profile.expertise);
        }
      }
    } catch (err) {
      console.error('Failed to load user profiles:', err);
    }
  };

  useEffect(() => {
    fetchDomains();
    fetchUserProfiles();
  }, [user]);

  const executeToggleStudentInterest = async (domainId) => {
    const isCurrentlyInterested = studentInterests.includes(domainId);
    const updated = isCurrentlyInterested
      ? studentInterests.filter(id => id !== domainId)
      : [...studentInterests, domainId];

    setStudentInterests(updated);

    try {
      const res = await apiClient(`/domains/${domainId}/interest`, { method: 'POST' });
      if (res.data?.interests) {
        setStudentInterests(res.data.interests);
      }
      showNotification(res.message || (isCurrentlyInterested ? 'Removed domain interest' : 'Added domain interest'), 'success');
      fetchDomains();
    } catch (err) {
      setStudentInterests(studentInterests);
      showNotification(err.message, 'error');
    }
  };

  const handleStudentInterestClick = (domain, e) => {
    e.stopPropagation();
    const isCurrentlyInterested = studentInterests.includes(domain.id);
    setConfirmDomainModal({
      domain,
      actionType: isCurrentlyInterested ? 'REMOVE' : 'ADD',
      roleType: 'STUDENT'
    });
  };

  const executeToggleAlumniExpertise = async (domainId) => {
    const isCurrentlyExpert = alumniExpertise.includes(domainId);
    const updated = isCurrentlyExpert
      ? alumniExpertise.filter(id => id !== domainId)
      : [...alumniExpertise, domainId];

    setAlumniExpertise(updated);

    try {
      const res = await apiClient(`/domains/${domainId}/expertise`, { method: 'POST' });
      if (res.data?.expertise) {
        setAlumniExpertise(res.data.expertise);
      }
      showNotification(res.message || (isCurrentlyExpert ? 'Removed mentorship track' : 'Added mentorship track'), 'success');
      fetchDomains();
    } catch (err) {
      setAlumniExpertise(alumniExpertise);
      showNotification(err.message, 'error');
    }
  };

  const handleAlumniExpertiseClick = (domain, e) => {
    e.stopPropagation();
    const isCurrentlyExpert = alumniExpertise.includes(domain.id);
    setConfirmDomainModal({
      domain,
      actionType: isCurrentlyExpert ? 'REMOVE' : 'ADD',
      roleType: 'ALUMNI'
    });
  };

  const handleConfirmAction = () => {
    if (!confirmDomainModal) return;
    const { domain, roleType } = confirmDomainModal;

    if (roleType === 'STUDENT') {
      executeToggleStudentInterest(domain.id);
    } else if (roleType === 'ALUMNI') {
      executeToggleAlumniExpertise(domain.id);
    }

    setConfirmDomainModal(null);
  };

  const handleOpenDomainMentors = async (domain) => {
    setSelectedDomainModal(domain);
    setLoadingMentors(true);
    try {
      const res = await apiClient(`/domains/${domain.id}/mentors`);
      setDomainMentors(res.data || []);
    } catch (err) {
      showNotification('Failed to load domain mentors', 'error');
    } finally {
      setLoadingMentors(false);
    }
  };

  const categories = ['ALL', ...new Set(domains.map(d => d.category))];
  const filteredDomains = selectedCategory === 'ALL'
    ? domains
    : domains.filter(d => d.category === selectedCategory);

  return (
    <div style={{ maxWidth: '1280px', margin: '1.5rem auto', padding: '0 1.5rem' }}>
      
      {/* Breadcrumb Trail */}
      <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginBottom: '0.75rem' }}>
        Master Entries <span style={{ margin: '0 0.35rem' }}>›</span> <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Technical Domain Directory</span>
      </div>

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>Technical Domain Directory</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Explore technical domains, discover verified alumni mentors, and select your career interest.
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <button onClick={onOpenCreateDomain} className="btn btn-primary" style={{ background: '#0284c7', borderColor: '#0284c7' }}>
            <Plus size={16} /> Add Technical Domain
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '2rem' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              borderRadius: '9999px',
              padding: '0.35rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Domain Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <p>Loading technical domain directory...</p>
        </div>
      ) : filteredDomains.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No technical domains found in this category.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {filteredDomains.map(domain => {
            const IconComponent = ICON_MAP[domain.icon] || Code;
            const isStudentInterest = studentInterests.includes(domain.id);
            const isAlumniExpertise = alumniExpertise.includes(domain.id);

            return (
              <div
                key={domain.id}
                className="glass-panel glass-panel-glow"
                onClick={() => handleOpenDomainMentors(domain)}
                style={{
                  padding: '1.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  background: 'var(--bg-card)',
                  border: isStudentInterest ? '2px solid var(--primary)' : isAlumniExpertise ? '2px solid var(--accent-purple)' : '1px solid var(--border-card)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ background: 'var(--primary-subtle)', padding: '0.65rem', borderRadius: '10px', display: 'inline-flex', color: 'var(--primary)' }}>
                      <IconComponent size={24} color="var(--primary)" />
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <span className="badge badge-purple">{domain.category}</span>
                      {isStudentInterest && (
                        <span className="badge badge-emerald">
                          <BookmarkCheck size={10} /> Interested
                        </span>
                      )}
                      {isAlumniExpertise && (
                        <span className="badge badge-cyan">
                          <Award size={10} /> Expert
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {domain.name} <ChevronRight size={16} color="var(--primary)" />
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                    {domain.description}
                  </p>
                </div>

                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center', marginBottom: '1rem' }}>
                    <div style={{ background: 'var(--bg-subtle)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}><Users size={12} /> Students</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>{domain.stats?.interested_students || 0}</p>
                    </div>

                    <div style={{ background: 'var(--bg-subtle)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}><Award size={12} /> Mentors</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-purple)' }}>{domain.stats?.available_mentors || 0}</p>
                    </div>

                    <div style={{ background: 'var(--bg-subtle)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}><CheckCircle2 size={12} /> Milestone %</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                        {domain.stats?.milestone_completion_rate || 0}%
                      </p>
                    </div>
                  </div>

                  <div style={{ paddingTop: '0.85rem', borderTop: '1px solid var(--border-card)', display: 'flex', gap: '0.5rem' }}>
                    {user?.role === 'STUDENT' && (
                      <button
                        onClick={(e) => handleStudentInterestClick(domain, e)}
                        className={`btn btn-sm ${isStudentInterest ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ width: '100%' }}
                      >
                        {isStudentInterest ? <><BookmarkCheck size={14} /> Selected Interest</> : <><Plus size={14} /> Add Interest</>}
                      </button>
                    )}

                    {user?.role === 'ALUMNI' && (
                      <button
                        onClick={(e) => handleAlumniExpertiseClick(domain, e)}
                        className={`btn btn-sm ${isAlumniExpertise ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ width: '100%' }}
                      >
                        {isAlumniExpertise ? <><Award size={14} /> Active Track</> : <><Plus size={14} /> Offer Mentorship</>}
                      </button>
                    )}

                    {!user && (
                      <button className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                        View Available Mentors ({domain.stats?.available_mentors || 0})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Popup Modal for ADDING & REMOVING Domain Interest/Expertise */}
      {confirmDomainModal && (
        <div
          className="modal-overlay"
          onClick={() => setConfirmDomainModal(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            zIndex: 99999
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', margin: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: confirmDomainModal.actionType === 'REMOVE' ? '#dc2626' : 'var(--primary)' }}>
              {confirmDomainModal.actionType === 'REMOVE' ? <AlertTriangle size={24} color="#dc2626" /> : <Sparkles size={24} color="var(--primary)" />}
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>
                {confirmDomainModal.actionType === 'REMOVE'
                  ? (confirmDomainModal.roleType === 'STUDENT' ? 'Remove Technical Interest?' : 'Remove Mentorship Track?')
                  : (confirmDomainModal.roleType === 'STUDENT' ? 'Confirm Adding Technical Interest' : 'Confirm Offering Mentorship')}
              </h3>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {confirmDomainModal.actionType === 'REMOVE' ? (
                <>Are you sure you want to remove <strong>{confirmDomainModal.domain?.name}</strong> from your active {confirmDomainModal.roleType === 'STUDENT' ? 'student domain interests' : 'mentorship expertise tracks'}?</>
              ) : (
                <>Are you sure you want to add <strong>{confirmDomainModal.domain?.name}</strong> to your active {confirmDomainModal.roleType === 'STUDENT' ? 'career interests? Verified alumni mentors in this domain will be recommended for 1-on-1 mentorship.' : 'mentorship tracks? Students seeking guidance in this domain will be able to request mentorship.'}</>
              )}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDomainModal(null)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`btn btn-sm ${confirmDomainModal.actionType === 'REMOVE' ? 'btn-danger' : 'btn-primary'}`}
              >
                {confirmDomainModal.actionType === 'REMOVE'
                  ? (confirmDomainModal.roleType === 'STUDENT' ? 'Remove Interest' : 'Remove Track')
                  : (confirmDomainModal.roleType === 'STUDENT' ? 'Confirm & Add Interest' : 'Confirm & Offer Mentorship')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Domain Mentors Popup Modal */}
      {selectedDomainModal && (
        <div className="modal-overlay" onClick={() => setSelectedDomainModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <span className="badge badge-purple" style={{ marginBottom: '0.35rem' }}>{selectedDomainModal.category}</span>
                <h3 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Mentors in {selectedDomainModal.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Verified alumni mentors available for student mentorship</p>
              </div>
              <button onClick={() => setSelectedDomainModal(null)} className="btn btn-secondary btn-sm"><X size={18} /></button>
            </div>

            {loadingMentors ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading specialized mentors...</p>
            ) : domainMentors.length === 0 ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No verified mentors currently assigned to this domain.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {domainMentors.map(m => {
                  const cap = m.profile?.max_capacity || 5;
                  const curr = m.profile?.current_capacity || 0;
                  const availableSlots = Math.max(0, cap - curr);

                  return (
                    <div
                      key={m.id}
                      style={{
                        padding: '1.25rem',
                        borderRadius: '12px',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-card)',
                        display: 'flex',
                        justify: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <h4 style={{ fontSize: '1.15rem', color: 'var(--text-main)' }}>{m.name}</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                          {m.profile?.designation} at {m.profile?.company} ({m.profile?.experience_years} Yrs Exp)
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontStyle: 'italic' }}>
                          "{m.profile?.bio || 'Experienced mentor'}"
                        </p>
                      </div>

                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <span className={`badge ${availableSlots > 0 ? 'badge-emerald' : 'badge-amber'}`}>
                          {availableSlots} / {cap} Slots Free
                        </span>

                        {user?.role === 'STUDENT' && user?.verification_status === 'VERIFIED' && (
                          availableSlots > 0 ? (
                            <button
                              onClick={() => {
                                setSelectedDomainModal(null);
                                onRequestMentorship(m);
                              }}
                              className="btn btn-primary btn-sm"
                            >
                              <Send size={14} /> Request Mentorship
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedDomainModal(null);
                                onRequestMentorship({ ...m, isWaitlist: true });
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ borderColor: '#fde68a', background: '#fffbeb', color: '#b45309' }}
                            >
                              <Clock size={14} color="#b45309" /> Join Waitlist
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
