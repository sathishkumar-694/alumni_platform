import { useState } from 'react';
import { apiClient } from '../../shared/services/api';
import { useNotification } from '../../shared/context/useNotification';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, ShieldCheck, ArrowRight } from 'lucide-react';

/**
 * ResetPasswordView
 * Rendered inside App.jsx when the URL hash contains "reset-password?token=..."
 * Props:
 *   token        – the raw token string from the URL
 *   onSuccess    – callback to navigate to login after successful reset
 */
export const ResetPasswordView = ({ token, onSuccess }) => {
  const { showNotification } = useNotification();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [tokenValid, setTokenValid] = useState(Boolean(token));

  // Password strength
  const getStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    const len     = pwd.length >= 8;
    const hasUp   = /[A-Z]/.test(pwd);
    const hasNum  = /[0-9]/.test(pwd);
    const hasSpec = /[^A-Za-z0-9]/.test(pwd);
    const score   = (len ? 1 : 0) + (hasUp ? 1 : 0) + (hasNum ? 1 : 0) + (hasSpec ? 1 : 0);
    const labels  = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors  = ['', '#ef4444', '#f59e0b', '#10b981', '#6366f1'];
    return { score, label: labels[score], color: colors[score] };
  };

  const strength = getStrength(newPassword);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showNotification('Password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }
    setLoading(true);
    try {
      await apiClient('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword })
      });
      setDone(true);
    } catch (err) {
      if (err.message?.toLowerCase().includes('invalid') || err.message?.toLowerCase().includes('expired')) {
        setTokenValid(false);
      }
      showNotification(err.message || 'Failed to reset password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-subtle)',
        padding: '2rem 1rem'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: '20px',
          boxShadow: 'var(--shadow-lg)',
          padding: '2.25rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative gradient strip */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)'
        }} />

        {/* ── Invalid / Expired Token ───────────────────────────────── */}
        {!tokenValid && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <XCircle size={30} color="#fff" />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.6rem' }}>
              Link Expired
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '1.5rem' }}>
              This password reset link has expired or was already used. Please request a fresh link.
            </p>
            <button
              onClick={() => onSuccess?.()}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              Back to Login <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* ── Success State ─────────────────────────────────────────── */}
        {tokenValid && done && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <CheckCircle size={30} color="#fff" />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.6rem' }}>
              Password Updated!
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '1.5rem' }}>
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
            <button
              onClick={() => onSuccess?.()}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              Sign In Now <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* ── Reset Form ────────────────────────────────────────────── */}
        {tokenValid && !done && (
          <>
            {/* Header */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <ShieldCheck size={22} color="#fff" />
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Set New Password
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Choose a strong password for your CampusBridge account
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* New Password */}
              <div className="form-group" style={{ marginBottom: '1.1rem' }}>
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ paddingLeft: '2.25rem', paddingRight: '2.75rem' }}
                    required
                    autoFocus
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{
                      position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '0.2rem'
                    }}
                    title={showPassword ? 'Hide' : 'Show'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* Strength bar */}
                {newPassword.length > 0 && (
                  <div style={{ marginTop: '0.55rem' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '0.25rem' }}>
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{
                          flex: 1, height: '4px', borderRadius: '2px',
                          background: i <= strength.score ? strength.color : 'var(--border-card)',
                          transition: 'background 0.3s'
                        }} />
                      ))}
                    </div>
                    <p style={{ fontSize: '0.72rem', color: strength.color, fontWeight: 600 }}>
                      {strength.label} password
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Repeat your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      paddingLeft: '2.25rem', paddingRight: '2.75rem',
                      borderColor: passwordsMismatch ? '#ef4444' : passwordsMatch ? '#10b981' : undefined
                    }}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    style={{
                      position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '0.2rem'
                    }}
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {passwordsMatch && (
                  <p style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600, marginTop: '0.25rem' }}>
                    ✓ Passwords match
                  </p>
                )}
                {passwordsMismatch && (
                  <p style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 600, marginTop: '0.25rem' }}>
                    ✗ Passwords do not match
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                disabled={loading || passwordsMismatch}
              >
                <ShieldCheck size={15} />
                {loading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
