import { useState } from 'react';
import { apiClient } from '../../shared/services/api';
import { useNotification } from '../../shared/context/NotificationContext';
import { X, Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';

export const ForgotPasswordModal = ({ isOpen, onClose, onBackToLogin }) => {
  const { showNotification } = useNotification();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setEmail('');
    setSent(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      setSent(true);
    } catch {
      // Do not reveal whether an account exists, but don't claim delivery on provider errors.
      showNotification('We could not send the reset email right now. Please try again later.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(event) => { event.stopPropagation(); handleClose(); }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        width: '100vw', height: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(6px)',
        padding: '1rem'
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '480px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: '18px',
          boxShadow: 'var(--shadow-lg)',
          padding: '2rem',
          margin: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
          <div>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '0.85rem'
            }}>
              <Mail size={22} color="#fff" />
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Forgot Password?
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              Enter your email and we'll send a reset link
            </p>
          </div>
          <button onClick={handleClose} className="btn btn-secondary btn-sm" style={{ padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Sent State */}
        {sent ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <CheckCircle size={30} color="#fff" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.6rem' }}>
              Check Your Email
            </h3>
            <p style={{ fontSize: '0.87rem', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '1.5rem', maxWidth: '320px', margin: '0 auto 1.5rem' }}>
              If an account with <strong style={{ color: 'var(--text-main)' }}>{email}</strong> exists, a password reset link has been sent. Check your inbox (and spam folder).
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginBottom: '1.5rem' }}>
              The link expires in <strong>1 hour</strong>.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                Try another email
              </button>
              <button
                onClick={() => { handleClose(); onBackToLogin?.(); }}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem' }}
              >
                Back to Login
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="form-input"
                  placeholder="user@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.25rem' }}
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              disabled={loading}
            >
              <Send size={15} />
              {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              onClick={() => { handleClose(); onBackToLogin?.(); }}
              className="btn btn-secondary"
              style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <ArrowLeft size={14} /> Back to Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
