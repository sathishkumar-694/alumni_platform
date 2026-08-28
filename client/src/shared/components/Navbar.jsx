import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, ShieldCheck, User, LogOut, Compass, BookOpen, Bell, LayoutDashboard, Home } from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab, onOpenLogin, onOpenRegisterStudent, onOpenRegisterAlumni }) => {
  const { user, logout } = useAuth();

  return (
    <header style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, position: 'sticky', top: 0, zIndex: 100, background: '#ffffff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setActiveTab(user ? 'dashboard' : 'home')}>
          <div style={{ background: 'var(--primary)', padding: '0.6rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={22} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>
              CampusBridge
            </h1>
            <p style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 500 }}>
              University Alumni Network & Career Mentorship Platform
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {!user && (
            <button
              onClick={() => setActiveTab('home')}
              className={`btn btn-sm ${activeTab === 'home' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Home size={16} /> Home
            </button>
          )}

          <button
            onClick={() => setActiveTab('explore')}
            className={`btn btn-sm ${activeTab === 'explore' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Compass size={16} /> Explore Domains
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`btn btn-sm ${activeTab === 'announcements' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Bell size={16} /> University Feed
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            className={`btn btn-sm ${activeTab === 'resources' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <BookOpen size={16} /> Resources
          </button>

          {user && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`btn btn-sm ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <LayoutDashboard size={16} /> Dashboard
            </button>
          )}
        </nav>

        {/* Auth & Role Status Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{user.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end' }}>
                  <span className={`badge ${user.role === 'ADMIN' ? 'badge-purple' : user.role === 'ALUMNI' ? 'badge-cyan' : 'badge-emerald'}`}>
                    {user.role}
                  </span>
                  <span className={`badge ${user.verification_status === 'VERIFIED' ? 'badge-emerald' : 'badge-amber'}`}>
                    {user.verification_status}
                  </span>
                </div>
              </div>

              <button onClick={logout} className="btn btn-secondary btn-sm" title="Log Out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={onOpenLogin} className="btn btn-secondary btn-sm">
                <User size={16} /> Log In
              </button>
              <button onClick={onOpenRegisterStudent} className="btn btn-primary btn-sm">
                Join as Student
              </button>
              <button onClick={onOpenRegisterAlumni} className="btn btn-secondary btn-sm" style={{ borderColor: 'var(--accent-purple)' }}>
                <ShieldCheck size={16} color="#7c3aed" /> Volunteer Mentor
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
