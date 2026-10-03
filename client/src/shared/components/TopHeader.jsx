import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { Search, Bell, Sun, Moon, ChevronDown, LogOut, User, Sparkles, Check, ArrowRight, MessageSquare, Calendar, Briefcase, ShieldCheck } from 'lucide-react';

export const TopHeader = ({ isPublicLanding, onNavigate, onOpenLogin, onOpenRegisterStudent, onOpenRegisterAlumni }) => {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Dynamic Real-Time MySQL Notifications
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoadingNotifs(true);
    try {
      const res = await apiClient('/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.warn('[TopHeader Notifications Fetch Warning]:', err.message);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleToggleNotificationPopup = () => {
    const nextState = !showNotificationPopup;
    setShowNotificationPopup(nextState);
    if (nextState && user) {
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!user) return;
    try {
      await apiClient(`/notifications/${notif.id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    } catch (err) {
      console.warn('[Notification Read Warning]:', err.message);
    }
    setShowNotificationPopup(false);
    if (notif.target_tab || notif.targetTab) {
      onNavigate?.(notif.target_tab || notif.targetTab);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await apiClient('/notifications/read-all', { method: 'PATCH' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.warn('[Mark All Read Warning]:', err.message);
    }
  };

  const notificationRef = useRef(null);
  const userDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotificationPopup(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('campusbridge_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('campusbridge_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const searchInput = document.getElementById('global-header-search');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      onNavigate?.('explore');
    }
  };

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U';

  return (
    <header
      style={{
        height: '60px',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-card)',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 80
      }}
    >
      {/* Portal Name Header (Left) */}
      <div
        onClick={() => onNavigate?.(user ? 'dashboard' : 'home')}
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '240px', flexShrink: 0, cursor: 'pointer' }}
        title="Click to go to Homepage / Dashboard"
      >
        <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          CampusBridge Portal
        </h2>
      </div>

      {/* Center Search Input Pill */}
      {!isPublicLanding ? (
        <div style={{ flex: 1, margin: '0 1.5rem' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
            <Search size={15} color="var(--text-subtle)" style={{ position: 'absolute', left: '0.85rem' }} />
            <input
              id="global-header-search"
              type="text"
              className="form-input"
              placeholder="Search mentors, domains, job referrals... (Press / to focus)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchSubmit}
              style={{
                width: '100%',
                paddingLeft: '2.5rem',
                paddingRight: '2rem',
                height: '38px',
                fontSize: '0.85rem',
                borderRadius: '20px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-card)'
              }}
            />
          </div>
        </div>
      ) : <div style={{ flex: 1 }} />}

      {/* Header Actions (Right) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        
        {/* Pixel-Perfect Centered Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          style={{
            width: '38px',
            height: '38px',
            minWidth: '38px',
            minHeight: '38px',
            borderRadius: '50%',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-card)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-main)',
            padding: 0,
            margin: 0,
            outline: 'none',
            boxSizing: 'border-box',
            flexShrink: 0
          }}
        >
          {theme === 'light' ? (
            <Moon size={17} style={{ display: 'block', margin: 'auto' }} />
          ) : (
            <Sun size={17} color="#f59e0b" style={{ display: 'block', margin: 'auto' }} />
          )}
        </button>

        {user ? (
          <>
            {/* Pixel-Perfect Centered Notification Bell Dropdown Button */}
            <div style={{ position: 'relative' }} ref={notificationRef}>
              <button
                onClick={handleToggleNotificationPopup}
                style={{
                  width: '38px',
                  height: '38px',
                  minWidth: '38px',
                  minHeight: '38px',
                  borderRadius: '50%',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-card)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  color: 'var(--text-main)',
                  padding: 0,
                  margin: 0,
                  outline: 'none',
                  boxSizing: 'border-box',
                  flexShrink: 0
                }}
              >
                <Bell size={17} style={{ display: 'block', margin: 'auto' }} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 0 2px var(--bg-card)',
                      lineHeight: 1
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Popup Card */}
              {showNotificationPopup && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '48px',
                    width: '360px',
                    maxHeight: '440px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '1rem',
                    zIndex: 100,
                    overflowY: 'auto'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-card)' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Bell size={16} color="var(--primary)" /> MySQL Notifications
                    </h4>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          style={{
                            padding: '0.75rem',
                            borderRadius: '10px',
                            background: notif.read ? 'transparent' : 'var(--bg-subtle)',
                            borderLeft: notif.read ? '3px solid transparent' : '3px solid var(--primary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <p style={{ fontSize: '0.825rem', fontWeight: notif.read ? 600 : 800, color: 'var(--text-main)' }}>
                            {notif.title}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: 1.3 }}>
                            {notif.desc}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
                        No notifications found in database.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Authenticated User Profile Pill with 100% Dead-Center Avatar Circle */}
            <div style={{ position: 'relative' }} ref={userDropdownRef}>
              <button
                onClick={() => setShowUserDropdown(prev => !prev)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.3rem 0.75rem 0.3rem 0.3rem',
                  borderRadius: '24px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-card)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    minWidth: '32px',
                    minHeight: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    color: '#ffffff',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    boxShadow: '0 2px 4px rgba(79, 70, 229, 0.3)',
                    flexShrink: 0,
                    margin: 0,
                    padding: 0,
                    overflow: 'hidden'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', textAlign: 'center', lineHeight: 1 }}>
                    {userInitial}
                  </span>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '0.01em' }}>
                  {user.name}
                </span>
                <ChevronDown size={14} color="var(--text-subtle)" />
              </button>

              {/* User Account Dropdown Menu */}
              {showUserDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '44px',
                    width: '200px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '14px',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '0.5rem',
                    zIndex: 100
                  }}
                >
                  <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-card)', marginBottom: '0.35rem' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>{user.name}</p>
                    <p style={{ fontSize: '0.725rem', color: 'var(--text-subtle)' }}>{user.email}</p>
                    <span className="badge badge-purple" style={{ fontSize: '0.65rem', marginTop: '0.35rem' }}>
                      {user.role}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onNavigate?.('profile');
                    }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'none',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <User size={15} /> My Profile
                  </button>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                    }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'none',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#ef4444',
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Public Unauthenticated Header Action Buttons */
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={onOpenLogin} className="btn btn-secondary btn-sm">
              Sign In
            </button>
            <button onClick={onOpenRegisterStudent} className="btn btn-primary btn-sm">
              Join as Student
            </button>
            <button onClick={onOpenRegisterAlumni} className="btn btn-secondary btn-sm" style={{ borderColor: 'var(--primary)' }}>
              Join as Alumni
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
