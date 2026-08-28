import React, { useState } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { useNotification } from '../../shared/context/NotificationContext';
import { X, LogIn, Sparkles, User, ShieldCheck } from 'lucide-react';

export const LoginModal = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      showNotification('Successfully logged in!', 'success');
      onClose();
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
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
        justify: 'center',
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        padding: '1rem'
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '540px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-lg)',
          padding: '1.75rem',
          margin: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Account Sign In</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Access your CampusBridge portal dashboard</p>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Demo Account Fast Select */}
        <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid var(--border-card)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            1-Click Demo Testing Credentials:
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickLogin('ashwanth.bt23@bitsathy.ac.in', '7376231BT111')}
            >
              <Sparkles size={12} color="var(--primary)" /> Student (Ashwanth)
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickLogin('arumugam@tech.gmail.com', '7376231EC001')}
            >
              <User size={12} color="var(--accent-purple)" /> Mentor (Arumugam)
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickLogin('admin@university.edu', 'password123')}
            >
              <ShieldCheck size={12} color="var(--accent-emerald)" /> Administrator
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="user@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            <LogIn size={16} /> {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
