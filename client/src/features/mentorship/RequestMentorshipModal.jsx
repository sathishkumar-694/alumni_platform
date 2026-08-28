import React, { useState, useEffect } from 'react';
import { apiClient } from '../../shared/services/api';
import { useNotification } from '../../shared/context/NotificationContext';
import { X, Send, Lock } from 'lucide-react';

const DEFAULT_DOMAINS = [
  { id: 'd-1', name: 'Software Engineering & Architecture' },
  { id: 'd-2', name: 'Data Structures & Algorithms' },
  { id: 'd-3', name: 'Full Stack Web Development' },
  { id: 'd-4', name: 'Cloud Systems & DevOps' },
  { id: 'd-5', name: 'Machine Learning & AI Engineering' },
  { id: 'd-6', name: 'Cybersecurity & Information Security' }
];

export const RequestMentorshipModal = ({ mentor, isOpen, onClose, onSuccess }) => {
  const { showNotification } = useNotification();
  const [domainId, setDomainId] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [domainsList, setDomainsList] = useState([]);

  useEffect(() => {
    if (mentor) {
      apiClient('/domains')
        .then(res => {
          const allDomains = res.data || DEFAULT_DOMAINS;

          // Determine mentor's expertise IDs/names
          const rawExpertise = mentor.expertise_domains || mentor.profile?.expertise_domains || mentor.profile?.expertise || mentor.expertise || [];

          let filtered = [];
          if (Array.isArray(rawExpertise) && rawExpertise.length > 0) {
            filtered = allDomains.filter(d =>
              rawExpertise.some(exp =>
                exp === d.id ||
                exp === d.name ||
                (typeof exp === 'object' && (exp.id === d.id || exp.name === d.name))
              )
            );
          }

          // If mentor has single domain_id / domain_name attached
          if (filtered.length === 0 && (mentor.domain_id || mentor.domain_name)) {
            filtered = allDomains.filter(d => d.id === mentor.domain_id || d.name === mentor.domain_name);
          }

          // Fallback if no matching expertise array found: use first available domain
          if (filtered.length === 0) {
            filtered = [allDomains[0] || DEFAULT_DOMAINS[0]];
          }

          setDomainsList(filtered);
          setDomainId(filtered[0]?.id || 'd-1');
        })
        .catch(() => {
          setDomainsList([DEFAULT_DOMAINS[0]]);
          setDomainId(DEFAULT_DOMAINS[0].id);
        });
    }
  }, [mentor]);

  if (!isOpen || !mentor) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient('/mentorship/requests', {
        method: 'POST',
        body: JSON.stringify({
          mentorId: mentor.id,
          domainId,
          message
        })
      });
      showNotification(`Mentorship request sent to ${mentor.name}!`, 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
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
        zIndex: 9999
      }}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ margin: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Send Mentorship Request</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Request guidance from {mentor.name}</p>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid var(--border-card)' }}>
          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{mentor.name}</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
            {mentor.profile?.designation || 'Alumni Mentor'} at {mentor.profile?.company || 'Industry Org'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Primary Mentoring Domain</label>
            {domainsList.length <= 1 ? (
              <div
                style={{
                  padding: '0.65rem 0.9rem',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '8px',
                  color: 'var(--text-main)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>{domainsList[0]?.name || 'Software Engineering'}</span>
                <span className="badge badge-cyan" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                  <Lock size={10} /> Dedicated Domain
                </span>
              </div>
            ) : (
              <select
                className="form-select"
                value={domainId}
                onChange={(e) => setDomainId(e.target.value)}
              >
                {domainsList.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Personal Note / Mentorship Goals</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Introduce yourself, your career goals, and what specific guidance you are hoping to receive..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={submitting}>
            <Send size={16} /> {submitting ? 'Sending...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
};
