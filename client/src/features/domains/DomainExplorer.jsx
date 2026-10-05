import React, { useState, useEffect } from 'react';
import { apiClient } from '../../shared/services/api';
import { useAuth } from '../../shared/context/AuthContext';
import { useNotification } from '../../shared/context/NotificationContext';
import { RequestDomainModal } from './RequestDomainModal';
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
  Sparkles,
  Compass,
  Check,
  Trash2
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

export const DomainExplorer = ({ onOpenCreateDomain, onRequestMentorship, searchQuery = '' }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const [isRequestDomainOpen, setIsRequestDomainOpen] = useState(false);

  // Student domain interests & Alumni expertise tracks
  const [studentInterests, setStudentInterests] = useState(() => {
    return user?.profile?.interests || user?.interests || [];
  });

  const [alumniExpertise, setAlumniExpertise] = useState(() => {
    return user?.profile?.expertise || user?.expertise || [];
  });

  useEffect(() => {
    if (user?.profile?.interests) {
      setStudentInterests(user.profile.interests);
    }
    if (user?.profile?.expertise) {
      setAlumniExpertise(user.profile.expertise);
    }
  }, [user]);

  // Confirmation modal state for removing domain ({ domain, roleType: 'STUDENT' | 'ALUMNI' })
  const [confirmRemoveModal, setConfirmRemoveModal] = useState(null);

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

  useEffect(() => {
    fetchDomains();
  }, []);

  // 1. Student Track Interest Handlers
  const executeToggleStudentInterest = async (domainId) => {
    const isCurrentlyInterested = studentInterests.includes(domainId);
    const updated = isCurrentlyInterested
      ? studentInterests.filter(id => id !== domainId)
      : [...studentInterests, domainId];

    setStudentInterests(updated);

    try {
      const res = await apiClient(`/domains/${domainId}/interests`, { method: 'POST' });
      if (res.data?.interests) {
        setStudentInterests(res.data.interests);
      }
      showNotification(res.message || (isCurrentlyInterested ? 'Removed domain interest' : 'Added to your domain interests!'), 'success');
      fetchDomains();
    } catch (err) {
      setStudentInterests(studentInterests);
      showNotification(err.message, 'error');
    }
  };

  const handleStudentInterestClick = (domain, e) => {
    e.stopPropagation();
    const isCurrentlyInterested = studentInterests.includes(domain.id);
    if (isCurrentlyInterested) {
      // Open confirmation popup modal before removing
      setConfirmRemoveModal({ domain, roleType: 'STUDENT' });
    } else {
      executeToggleStudentInterest(domain.id);
    }
  };

  // 2. Mentor Offer Mentorship Handlers
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
      showNotification(res.message || (isCurrentlyExpert ? 'Removed mentorship track' : 'Mentorship track activated! Students can now connect with you in this domain.'), 'success');
      fetchDomains();
    } catch (err) {
      setAlumniExpertise(alumniExpertise);
      showNotification(err.message, 'error');
    }
  };

  const handleAlumniExpertiseClick = (domain, e) => {
    e.stopPropagation();
    const isCurrentlyExpert = alumniExpertise.includes(domain.id);
    if (isCurrentlyExpert) {
      // Open confirmation popup modal before removing
      setConfirmRemoveModal({ domain, roleType: 'ALUMNI' });
    } else {
      executeToggleAlumniExpertise(domain.id);
    }
  };

  const handleConfirmRemove = () => {
    if (!confirmRemoveModal) return;
    const { domain, roleType } = confirmRemoveModal;
    if (roleType === 'STUDENT') {
      executeToggleStudentInterest(domain.id);
    } else if (roleType === 'ALUMNI') {
      executeToggleAlumniExpertise(domain.id);
    }
    setConfirmRemoveModal(null);
  };

  const categories = ['ALL', ...new Set(domains.map(d => d.category || 'General'))];

  const filteredDomains = domains.filter(d => {
    const matchesCategory = selectedCategory === 'ALL' || d.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      (d.name && d.name.toLowerCase().includes(q)) ||
      (d.category && d.category.toLowerCase().includes(q)) ||
      (d.description && d.description.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

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
            Explore technical domains, discover verified alumni mentors, and select your career interest or mentorship tracks.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {user && (user.role === 'ALUMNI' || user.role === 'STUDENT') && (
            <button onClick={() => setIsRequestDomainOpen(true)} className="btn btn-secondary" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
              <Plus size={16} /> Request New Technical Domain
            </button>
          )}

          {user?.role === 'ADMIN' && (
            <button onClick={onOpenCreateDomain} className="btn btn-primary" style={{ background: '#0284c7', borderColor: '#0284c7' }}>
              <Plus size={16} /> Add Technical Domain
            </button>
          )}
        </div>
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
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-card)' }}>
          <Compass size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
          <h3>No domains found</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Click "+ Request New Technical Domain" to propose a domain.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {filteredDomains.map(domain => {
            const IconComp = ICON_MAP[domain.icon] || Code;
            const isStudentInterested = studentInterests.includes(domain.id);
            const isAlumniExpert = alumniExpertise.includes(domain.id);

            return (
              <div
                key={domain.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconComp size={22} color="var(--primary)" />
                    </div>
                    <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                      {domain.category || 'Core Engineering'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                    {domain.name}
                  </h3>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                    {domain.description}
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--border-card)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                      <strong>{domain.stats?.available_mentors || 1}</strong> Mentors Offering Guidance
                    </div>

                    {/* STUDENT ACTION BUTTON */}
                    {user?.role === 'STUDENT' && (
                      <button
                        onClick={(e) => handleStudentInterestClick(domain, e)}
                        className={`btn btn-sm ${isStudentInterested ? 'btn-secondary' : 'btn-primary'}`}
                        style={{
                          fontSize: '0.75rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        {isStudentInterested ? <CheckCircle2 size={14} color="var(--accent-emerald)" /> : <Plus size={14} />}
                        {isStudentInterested ? 'Interested' : 'Track Interest'}
                      </button>
                    )}

                    {/* ALUMNI MENTOR ACTION BUTTON */}
                    {user?.role === 'ALUMNI' && (
                      <button
                        onClick={(e) => handleAlumniExpertiseClick(domain, e)}
                        className={`btn btn-sm ${isAlumniExpert ? 'btn-secondary' : 'btn-primary'}`}
                        style={{
                          fontSize: '0.75rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          background: isAlumniExpert ? 'var(--bg-subtle)' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                          borderColor: isAlumniExpert ? 'var(--border-card)' : '#059669',
                          color: isAlumniExpert ? 'var(--accent-emerald)' : '#ffffff'
                        }}
                      >
                        {isAlumniExpert ? <CheckCircle2 size={14} color="var(--accent-emerald)" /> : <Plus size={14} />}
                        {isAlumniExpert ? 'Mentoring Track Active' : 'Offer Mentorship'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Popup Modal for Domain Removal */}
      {confirmRemoveModal && (
        <div
          className="modal-overlay"
          onClick={() => setConfirmRemoveModal(null)}
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
            justifyContent: 'center',
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(6px)',
            padding: '1.5rem'
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '460px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              borderRadius: '20px',
              boxShadow: 'var(--shadow-lg)',
              padding: '1.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={22} color="#dc2626" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Remove Domain Track?
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Confirm removal of domain track
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5, marginBottom: '1.5rem', background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
              Are you sure you want to remove <strong>"{confirmRemoveModal.domain.name}"</strong> from your {confirmRemoveModal.roleType === 'STUDENT' ? 'career interest tracks' : 'active mentorship offerings'}?
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmRemoveModal(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleConfirmRemove} className="btn btn-danger">
                <Trash2 size={15} /> Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mentor Domain Request Modal */}
      <RequestDomainModal
        isOpen={isRequestDomainOpen}
        onClose={() => setIsRequestDomainOpen(false)}
        onSuccess={fetchDomains}
      />
    </div>
  );
};
