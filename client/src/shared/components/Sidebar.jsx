import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  LayoutDashboard,
  Compass,
  BookOpen,
  Bell,
  ShieldCheck,
  User,
  Sparkles,
  Users,
  MessageSquare,
  Calendar,
  ChevronDown,
  ChevronRight,
  Search,
  BookMarked,
  FolderCheck,
  FileCheck,
  Briefcase,
  UserCheck,
  Clock,
  Settings
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const [menuSearch, setMenuSearch] = useState('');

  // Accordion toggle states per section
  const [openSections, setOpenSections] = useState({
    main: true,
    mentorship: true,
    domains: true,
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

  return (
    <aside
      style={{
        width: '240px',
        minWidth: '240px',
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        justify: 'space-between',
        height: 'calc(100vh - 60px)',
        position: 'sticky',
        top: '60px',
        zIndex: 90
      }}
    >
      <div style={{ overflowY: 'auto', flex: 1, padding: '1rem 0.75rem' }}>
        
        {/* Search Menu Input */}
        <div style={{ marginBottom: '1.25rem', padding: '0 0.25rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search menu"
            value={menuSearch}
            onChange={(e) => setMenuSearch(e.target.value)}
            style={{
              width: '100%',
              height: '34px',
              padding: '0.4rem 0.75rem',
              fontSize: '0.8rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155'
            }}
          />
        </div>

        {/* ========================================================
            SECTION 1: MAIN DASHBOARD (RBAC CUSTOMIZED)
        ======================================================== */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div
            onClick={() => toggleSection('main')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              padding: '0.35rem 0.5rem',
              cursor: 'pointer',
              color: '#64748b',
              fontSize: '0.8rem',
              fontWeight: 700
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <LayoutDashboard size={15} color="#64748b" />
              <span>Main Workspace</span>
            </div>
            {openSections.main ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>

          {openSections.main && (
            <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <button
                onClick={() => handleNavClick('dashboard')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  border: activeTab === 'dashboard' ? '1px solid #7dd3fc' : 'none',
                  cursor: 'pointer',
                  background: activeTab === 'dashboard' ? '#e0f2fe' : 'transparent',
                  color: activeTab === 'dashboard' ? '#0284c7' : '#475569',
                  textAlign: 'left'
                }}
              >
                <span>
                  {isStudent ? 'Student Dashboard' : isAlumni ? 'Mentor Dashboard' : isAdmin ? 'Admin Operations Center' : 'Dashboard Overview'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* ========================================================
            SECTION 2: ROLE-BASED MENTORSHIP MANAGEMENT (RBAC STRICT)
        ======================================================== */}
        {user && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div
              onClick={() => toggleSection('mentorship')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                padding: '0.35rem 0.5rem',
                cursor: 'pointer',
                color: '#64748b',
                fontSize: '0.8rem',
                fontWeight: 700
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={15} color="#64748b" />
                <span>
                  {isStudent ? 'My Mentorship & Academics' : isAlumni ? 'My Mentee Management' : 'Mentorship Oversight'}
                </span>
              </div>
              {openSections.mentorship ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>

            {openSections.mentorship && (
              <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                
                {/* Active Mentorships / Mentees Tab */}
                <button
                  onClick={() => handleNavClick('active_mentorships')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    border: activeTab === 'active_mentorships' ? '1px solid #7dd3fc' : 'none',
                    cursor: 'pointer',
                    background: activeTab === 'active_mentorships' ? '#e0f2fe' : 'transparent',
                    color: activeTab === 'active_mentorships' ? '#0284c7' : '#475569',
                    textAlign: 'left'
                  }}
                >
                  <span>
                    {isStudent ? 'My Alumni Mentors' : isAlumni ? 'Active Student Mentees' : 'All Active Mentorships'}
                  </span>
                </button>

                {/* Mentorship Requests Tab */}
                <button
                  onClick={() => handleNavClick('requests')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    border: activeTab === 'requests' ? '1px solid #7dd3fc' : 'none',
                    cursor: 'pointer',
                    background: activeTab === 'requests' ? '#e0f2fe' : 'transparent',
                    color: activeTab === 'requests' ? '#0284c7' : '#475569',
                    textAlign: 'left'
                  }}
                >
                  <span>
                    {isStudent ? 'My Sent Requests' : isAlumni ? 'Incoming Mentee Requests' : 'All Pending Requests'}
                  </span>
                </button>

                {/* 1-on-1 Sessions Tab */}
                <button
                  onClick={() => handleNavClick('sessions')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    border: activeTab === 'sessions' ? '1px solid #7dd3fc' : 'none',
                    cursor: 'pointer',
                    background: activeTab === 'sessions' ? '#e0f2fe' : 'transparent',
                    color: activeTab === 'sessions' ? '#0284c7' : '#475569',
                    textAlign: 'left'
                  }}
                >
                  <span>1-on-1 Virtual Sessions</span>
                </button>

                {/* Alumni Job Referrals Tab */}
                <button
                  onClick={() => handleNavClick('referrals')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    border: activeTab === 'referrals' ? '1px solid #7dd3fc' : 'none',
                    cursor: 'pointer',
                    background: activeTab === 'referrals' ? '#e0f2fe' : 'transparent',
                    color: activeTab === 'referrals' ? '#0284c7' : '#475569',
                    textAlign: 'left'
                  }}
                >
                  <span>💼 Job Referrals</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            SECTION 3: MASTER ENTRIES & DOMAINS
        ======================================================== */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div
            onClick={() => toggleSection('domains')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              padding: '0.35rem 0.5rem',
              cursor: 'pointer',
              color: '#64748b',
              fontSize: '0.8rem',
              fontWeight: 700
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Compass size={15} color="#64748b" />
              <span>Master Entries</span>
            </div>
            {openSections.domains ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>

          {openSections.domains && (
            <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <button
                onClick={() => handleNavClick('explore')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  border: activeTab === 'explore' ? '1px solid #7dd3fc' : 'none',
                  cursor: 'pointer',
                  background: activeTab === 'explore' ? '#e0f2fe' : 'transparent',
                  color: activeTab === 'explore' ? '#0284c7' : '#475569',
                  textAlign: 'left'
                }}
              >
                <span>Technical Domains</span>
              </button>

              <button
                onClick={() => handleNavClick('resources')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  border: activeTab === 'resources' ? '1px solid #7dd3fc' : 'none',
                  cursor: 'pointer',
                  background: activeTab === 'resources' ? '#e0f2fe' : 'transparent',
                  color: activeTab === 'resources' ? '#0284c7' : '#475569',
                  textAlign: 'left'
                }}
              >
                <span>Study Resources</span>
              </button>
            </div>
          )}
        </div>

        {/* ========================================================
            SECTION 4: UPDATES & COMMUNITY
        ======================================================== */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div
            onClick={() => toggleSection('updates')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              padding: '0.35rem 0.5rem',
              cursor: 'pointer',
              color: '#64748b',
              fontSize: '0.8rem',
              fontWeight: 700
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={15} color="#64748b" />
              <span>Project & Updates</span>
            </div>
            {openSections.updates ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>

          {openSections.updates && (
            <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <button
                onClick={() => handleNavClick('announcements')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  border: activeTab === 'announcements' ? '1px solid #7dd3fc' : 'none',
                  cursor: 'pointer',
                  background: activeTab === 'announcements' ? '#e0f2fe' : 'transparent',
                  color: activeTab === 'announcements' ? '#0284c7' : '#475569',
                  textAlign: 'left'
                }}
              >
                <span>University Feed</span>
              </button>
            </div>
          )}
        </div>

        {/* ========================================================
            SECTION 5: ADMINISTRATION (ADMIN ROLE EXCLUSIVE)
        ======================================================== */}
        {isAdmin && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div
              onClick={() => toggleSection('admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                padding: '0.35rem 0.5rem',
                cursor: 'pointer',
                color: '#64748b',
                fontSize: '0.8rem',
                fontWeight: 700
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={15} color="#7c3aed" />
                <span>Administration</span>
              </div>
              {openSections.admin ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>

            {openSections.admin && (
              <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <button
                  onClick={() => handleNavClick('admin_operations')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    border: activeTab === 'admin_operations' ? '1px solid #7dd3fc' : 'none',
                    cursor: 'pointer',
                    background: activeTab === 'admin_operations' ? '#e0f2fe' : 'transparent',
                    color: activeTab === 'admin_operations' ? '#0284c7' : '#475569',
                    textAlign: 'left'
                  }}
                >
                  <span>Operations Center & Verification</span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </aside>
  );
};
