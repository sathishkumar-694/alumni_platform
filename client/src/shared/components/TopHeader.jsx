import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Bell, Sun, Moon, ChevronDown, LogOut, User, Sparkles, Check, ArrowRight, MessageSquare, Calendar, Briefcase, ShieldCheck } from 'lucide-react';

export const TopHeader = ({ isPublicLanding, onNavigate, onOpenLogin, onOpenRegisterStudent, onOpenRegisterAlumni }) => {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Persistent Notification Read State
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem('campusbridge_read_notifs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Role-Aware Meaningful Event Notifications
  const getDynamicNotifications = () => {
    if (!user) return [];

    if (user.role === 'ALUMNI') {
      return [
        {
          id: 101,
          type: 'REQUEST',
          title: '📩 New Mentorship Request Received',
          desc: 'Student Ashwanth (Biotechnology) requested 1-on-1 mentorship in Software Engineering.',
          targetTab: 'requests'
        },
        {
          id: 102,
          type: 'REFERRAL',
          title: '💼 Student Requested Internal Referral',
          desc: 'Ashwanth applied for an internal referral for your SDE-1 hiring drive at Google.',
          targetTab: 'referrals'
        },
        {
          id: 103,
          type: 'SESSION',
          title: '📅 1-on-1 Virtual Session Scheduled',
          desc: 'Mentee proposed 3 time slots for System Design guidance. Click to finalize.',
          targetTab: 'sessions'
        }
      ];
    } else if (user.role === 'STUDENT') {
      return [
        {
          id: 201,
          type: 'ACCEPTANCE',
          title: '🎉 Mentorship Request Accepted!',
          desc: 'Alumni Mentor Arumugam accepted your mentorship request. You are now paired!',
          targetTab: 'active_mentorships'
        },
        {
          id: 202,
          type: 'SESSION',
          title: '📅 1-on-1 Meeting Time Finalized',
          desc: 'Your meeting with Arumugam is confirmed for Aug 29. Launch WebRTC video call.',
          targetTab: 'sessions'
        },
        {
          id: 203,
          type: 'REFERRAL',
          title: '💼 New Alumni Job Referral Posted',
          desc: 'Arumugam posted an internal SDE referral opportunity for Google.',
          targetTab: 'referrals'
        }
      ];
    } else {
      return [
        {
          id: 301,
          type: 'VERIFICATION',
          title: '🛡️ Pending User ID Verifications',
          desc: 'New student and alumni ID card upload documents are in queue for verification.',
          targetTab: 'admin_operations'
        },
        {
          id: 302,
          type: 'ANNOUNCEMENT',
          title: '📌 University Placement Announcement Published',
          desc: 'TechCorp placement drive posted to the student feed.',
          targetTab: 'announcements'
        }
      ];
    }
  };

  const baseNotifications = getDynamicNotifications();

  const notifications = baseNotifications.map(n => ({
    ...n,
    read: readIds.includes(n.id)
  }));

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notif) => {
    const updated = [...new Set([...readIds, notif.id])];
    setReadIds(updated);
    localStorage.setItem('campusbridge_read_notifs', JSON.stringify(updated));
    setShowNotificationPopup(false);
    if (notif.targetTab) {
      onNavigate?.(notif.targetTab);
    }
  };

  const handleMarkAllAsRead = () => {
    const allIds = baseNotifications.map(n => n.id);
    setReadIds(allIds);
    localStorage.setItem('campusbridge_read_notifs', JSON.stringify(allIds));
  };

  const notificationRef = useRef(null);
  const userDropdownRef = useRef(null);

  // Auto-close dropdown popups when clicking anywhere outside
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

  // Theme Toggle State ('light' | 'dark')
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

  // Keyboard shortcut listener for 'Press / to search'
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
        justify: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 80
      }}
    >
      {/* Portal Name Header (Left) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '240px', flexShrink: 0 }}>
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
              placeholder="Search domains & mentors (Press / to search)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchSubmit}
              style={{
                width: '100%',
                paddingLeft: '2.3rem',
                height: '36px',
                borderRadius: '9999px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-card)',
                fontSize: '0.825rem',
                color: 'var(--text-main)'
              }}
            />
          </div>
        </div>
      ) : (
        <div style={{ flex: 1 }} />
      )}

      {/* Far Top-Right Corner Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto', flexShrink: 0 }}>
        
        {/* Theme Toggle Icon (Sun / Moon) */}
        <button
          onClick={toggleTheme}
          className="btn btn-secondary btn-sm"
          style={{ border: '1px solid var(--border-card)', background: 'var(--bg-card)', padding: '0.45rem', color: 'var(--text-muted)', borderRadius: '50%' }}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Sun size={18} color="#d97706" /> : <Moon size={18} color="#38bdf8" />}
        </button>

        {/* Notification Bell */}
        {user && (
          <div ref={notificationRef} style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowNotificationPopup(!showNotificationPopup);
              }}
              className="btn btn-secondary btn-sm"
              style={{ border: '1px solid var(--border-card)', background: 'var(--bg-card)', padding: '0.45rem', color: 'var(--text-muted)', position: 'relative', borderRadius: '50%' }}
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '8px',
                    height: '8px',
                    background: '#ef4444',
                    borderRadius: '50%',
                    boxShadow: '0 0 0 2px var(--bg-card)'
                  }}
                />
              )}
            </button>

            {/* Quick Notification Dropdown Popup */}
            {showNotificationPopup && (
              <div
                style={{
                  position: 'absolute',
                  top: '44px',
                  right: 0,
                  width: '350px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '1rem',
                  zIndex: 100
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-card)', paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>Notifications</p>
                    {unreadCount > 0 ? (
                      <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>{unreadCount} Unread</span>
                    ) : (
                      <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>All Read</span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      style={{ border: 'none', background: 'transparent', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '300px', overflowY: 'auto' }}>
                  {notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      style={{
                        padding: '0.65rem 0.75rem',
                        background: notif.read ? 'transparent' : 'var(--primary-subtle)',
                        border: '1px solid',
                        borderColor: notif.read ? 'var(--border-card)' : 'var(--primary)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.2rem' }}>
                        <p style={{ fontSize: '0.825rem', fontWeight: notif.read ? 600 : 700, color: 'var(--text-main)' }}>
                          {notif.title}
                        </p>
                        {!notif.read && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: '4px' }} />}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {notif.desc}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.35rem', color: 'var(--primary)', fontSize: '0.725rem', fontWeight: 600 }}>
                        Open Page <ArrowRight size={11} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Profile Avatar Dropdown Pill */}
        {user ? (
          <div ref={userDropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="btn btn-secondary btn-sm"
              style={{
                borderRadius: '9999px',
                padding: '0.2rem 0.75rem 0.2rem 0.35rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.55rem',
                borderColor: 'var(--border-card)',
                background: 'var(--bg-subtle)'
              }}
            >
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  minWidth: '30px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justify: 'center',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  lineHeight: '30px',
                  flexShrink: 0,
                  overflow: 'hidden'
                }}
              >
                <span style={{ display: 'inline-block', lineHeight: '30px', textAlign: 'center' }}>
                  {userInitial}
                </span>
              </div>

              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                {user.name}
              </span>

              <ChevronDown size={14} color="var(--text-subtle)" />
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '48px',
                  right: 0,
                  width: '220px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '10px',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '0.5rem',
                  zIndex: 100
                }}
              >
                <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-card)', marginBottom: '0.35rem' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>{user.name}</p>
                  <p style={{ fontSize: '0.725rem', color: 'var(--text-subtle)' }}>{user.email}</p>
                  <span className={`badge ${user.role === 'ADMIN' ? 'badge-purple' : user.role === 'ALUMNI' ? 'badge-cyan' : 'badge-emerald'}`} style={{ marginTop: '0.35rem', fontSize: '0.685rem' }}>
                    {user.role}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    logout();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'transparent',
                    color: '#ef4444',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <LogOut size={14} color="#ef4444" /> Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button onClick={onOpenLogin} className="btn btn-primary btn-sm" style={{ background: '#0284c7', borderColor: '#0284c7' }}>
              <Sparkles size={14} /> 1-Click Demo Login
            </button>
          </div>
        )}

      </div>
    </header>
  );
};
