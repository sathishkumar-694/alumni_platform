import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Compass,
  BookOpen,
  Bell,
  ShieldCheck,
  User,
  Sparkles,
  Users,
  MessageSquare,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  BookMarked,
  Briefcase,
  Award,
  Video,
  TrendingUp,
  UserCheck,
  Clock
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const [menuSearch, setMenuSearch] = useState('');

  // Accordion toggle states per section
  const [openSections, setOpenSections] = useState({
    main: true,
    mentorship: true,
    updates: true,
    admin: true
  });

  const toggleSection = (sec) => {
    setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  if (!user && activeTab === 'home') {
    return null; // Full width landing page when public visitor
  }

  const handleNavClick = (tab) => {
    setActiveTab(tab);
  };

  const isStudent = user?.role === 'STUDENT';
  const isAlumni = user?.role === 'ALUMNI';
  const isAdmin = user?.role === 'ADMIN';

  // Reusable Nav Item Renderer
  const renderNavItem = (tabId, label, IconComponent) => {
    if (menuSearch.trim() && !label.toLowerCase().includes(menuSearch.toLowerCase().trim())) {
      return null;
    }

    const isActive = activeTab === tabId;

    return (
      <button
        key={tabId}
        onClick={() => handleNavClick(tabId)}
        className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.45rem 0.75rem',
          borderRadius: '6px',
          fontSize: '0.8125rem',
          fontWeight: isActive ? 600 : 500,
          border: isActive ? '1px solid var(--sidebar-active-border)' : '1px solid transparent',
          cursor: 'pointer',
          background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
          color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
          textAlign: 'left',
          transition: 'all 0.15s ease'
        }}
      >
        <IconComponent
          size={14}
          color={isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)'}
          style={{ flexShrink: 0 }}
        />
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <aside
      className="sidebar-container"
      style={{
        width: '240px',
        minWidth: '240px',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border-card)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: 'calc(100vh - 60px)',
        position: 'sticky',
        top: '60px',
        zIndex: 90
      }}
    >
      <div style={{ overflowY: 'auto', flex: 1, padding: '1rem 0.75rem' }}>
        
        {/* Search Menu Input */}
        <div style={{ marginBottom: '1.25rem', padding: '0 0.15rem' }}>
          <input
            type="text"
            className="sidebar-search-input"
            placeholder="Search menu"
            value={menuSearch}
            onChange={(e) => setMenuSearch(e.target.value)}
            style={{
              width: '100%',
              height: '34px',
              padding: '0.4rem 0.75rem',
              fontSize: '0.8rem',
              borderRadius: '6px',
              border: '1px solid var(--border-card)',
              background: 'var(--sidebar-search-bg)',
              color: 'var(--text-main)',
              outline: 'none'
            }}
          />
        </div>

        {/* ========================================================
            SECTION 0: ADMIN CONTROLS (ADMIN ONLY - PROMINENT AT TOP)
        ======================================================== */}
        {isAdmin && (
          <div style={{ marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-card)' }}>
            <div
              onClick={() => toggleSection('admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.35rem 0.5rem',
                cursor: 'pointer',
                color: 'var(--accent-rose)',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.02em',
                background: 'rgba(244, 63, 94, 0.08)',
                borderRadius: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={14} color="var(--accent-rose)" />
                <span style={{ color: 'var(--accent-rose)' }}>Admin Controls</span>
              </div>
              {openSections.admin ? <ChevronDown size={13} color="var(--accent-rose)" /> : <ChevronRight size={13} color="var(--accent-rose)" />}
            </div>

            {openSections.admin && (
              <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {renderNavItem('admin_analytics', 'Overview & Analytics', TrendingUp)}
                {renderNavItem('admin_verifications', 'Pending ID Verifications', UserCheck)}
                {renderNavItem('admin_matrix', 'Active Mentorship Pairings', Users)}
                {renderNavItem('admin_requests', 'Mentorship Requests', Clock)}
                {renderNavItem('admin_users', 'User Accounts & Overrides', User)}
                {renderNavItem('admin_domains', 'Technical Domains & Requests', Compass)}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            SECTION 1: MAIN WORKSPACE (STUDENTS & ALUMNI ONLY - HIDDEN FOR ADMIN)
        ======================================================== */}
        {!isAdmin && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div
              onClick={() => toggleSection('main')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.35rem 0.5rem',
                cursor: 'pointer',
                color: 'var(--text-subtle)',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.02em'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LayoutDashboard size={14} color="var(--text-subtle)" />
                <span>Main Workspace</span>
              </div>
              {openSections.main ? <ChevronDown size={13} color="var(--text-subtle)" /> : <ChevronRight size={13} color="var(--text-subtle)" />}
            </div>

            {openSections.main && (
              <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {renderNavItem(
                  'dashboard',
                  isStudent ? 'Student Dashboard' : 'Mentor Dashboard',
                  LayoutDashboard
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            SECTION 2: ROLE-BASED MENTORSHIP & AI TOOLS
        ======================================================== */}
        {user && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div
              onClick={() => toggleSection('mentorship')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.35rem 0.5rem',
                cursor: 'pointer',
                color: 'var(--text-subtle)',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.02em'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={14} color="var(--text-subtle)" />
                <span>
                  {isAdmin
                    ? 'Mentorship Oversight & Practice'
                    : isStudent
                    ? 'My Mentorship & Academics'
                    : 'My Mentee Management'}
                </span>
              </div>
              {openSections.mentorship ? <ChevronDown size={13} color="var(--text-subtle)" /> : <ChevronRight size={13} color="var(--text-subtle)" />}
            </div>

            {openSections.mentorship && (
              <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {isAdmin && renderNavItem('dashboard', 'Mentor Dashboard', LayoutDashboard)}
                {renderNavItem('explore', 'Technical Domain Directory', Compass)}
                {renderNavItem('resume_analyzer', 'AI Resume Analyzer', Sparkles)}
                {isStudent && renderNavItem('recommended_mentors', 'Recommended Mentors', Award)}
                <button
                  type="button"
                  style={{ display: 'none' }}
                />
                {renderNavItem(
                  'active_mentorships',
                  isStudent ? 'My Alumni Mentors' : 'Active Student Mentees',
                  Users
                )}
                {renderNavItem(
                  'requests',
                  isStudent ? 'My Sent Requests' : 'Incoming Mentee Requests',
                  MessageSquare
                )}
                {renderNavItem('sessions', '1-on-1 Virtual Sessions', Video)}
                {!isAdmin && renderNavItem('chat', 'Private Mentorship Chat', MessageCircle)}
                {renderNavItem('referrals', 'Job Referrals', Briefcase)}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            SECTION 3: UPDATES & RESOURCES
        ======================================================== */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div
            onClick={() => toggleSection('updates')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.35rem 0.5rem',
              cursor: 'pointer',
              color: 'var(--text-subtle)',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.02em'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={14} color="var(--text-subtle)" />
              <span>Updates & Resources</span>
            </div>
            {openSections.updates ? <ChevronDown size={13} color="var(--text-subtle)" /> : <ChevronRight size={13} color="var(--text-subtle)" />}
          </div>

          {openSections.updates && (
            <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {renderNavItem('announcements', 'University Feed', Bell)}
              {renderNavItem('resources', 'Study Resources', BookMarked)}
            </div>
          )}
        </div>

      </div>
    </aside>
  );
};
