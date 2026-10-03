import React, { useState } from 'react';
import { apiClient } from '../../shared/services/api';
import { useNotification } from '../../shared/context/NotificationContext';
import { X, Compass, Send, Sparkles } from 'lucide-react';

export const RequestDomainModal = ({ isOpen, onClose, onSuccess }) => {
  const { showNotification } = useNotification();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showNotification('Please enter the domain name', 'error');
      return;
    }

    setLoading(true);
    try {
      await apiClient('/domains/request', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim()
        })
      });
      showNotification(`Domain request '${name}' submitted to Admin for approval!`, 'success');
      setName('');
      setDescription('');
      onSuccess?.();
      onClose();
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
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
          maxWidth: '550px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: '20px',
          boxShadow: 'var(--shadow-lg)',
          padding: '2rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <span className="badge badge-purple" style={{ marginBottom: '0.35rem' }}>
              <Compass size={12} /> Technical Domain Management
            </span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Request New Technical Domain
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Propose a new specialization domain. Upon Admin approval, it will appear in the directory.
            </p>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Domain Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Embedded Systems & IoT, Quantum Computing, Game Dev"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Description & Significance</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Describe what skills and technologies this domain covers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Send size={16} /> {loading ? 'Submitting Request...' : 'Submit Domain Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
