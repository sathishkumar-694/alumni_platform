import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './shared/context/AuthContext';
import { NotificationProvider } from './shared/context/NotificationContext';

import { Sidebar } from './shared/components/Sidebar';
import { TopHeader } from './shared/components/TopHeader';
import { VerificationBanner } from './shared/components/VerificationBanner';

import { LandingPage } from './features/landing/LandingPage';
import { LoginModal } from './features/auth/LoginModal';
import { StudentRegisterModal } from './features/auth/StudentRegisterModal';
import { AlumniRegisterModal } from './features/auth/AlumniRegisterModal';

import { DomainExplorer } from './features/domains/DomainExplorer';
import { AnnouncementFeed } from './features/announcements/AnnouncementFeed';
import { ResourceHub } from './features/resources/ResourceHub';
import { JobReferralPortal } from './features/referrals/JobReferralPortal';

import { StudentDashboard } from './features/dashboard/StudentDashboard';
import { MentorDashboard } from './features/dashboard/MentorDashboard';
import { AdminOperationsCenter } from './features/admin/AdminOperationsCenter';

import { RequestMentorshipModal } from './features/mentorship/RequestMentorshipModal';

const getInitialTab = () => {
  const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('campusbridge_token') : null;
  if (hash) return hash;
  if (token) return 'dashboard'; // Authenticated users land on Dashboard by default
  return 'home'; // Public visitors land on Landing Page
};

const MainContent = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTabState] = useState(getInitialTab);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterStudentOpen, setIsRegisterStudentOpen] = useState(false);
  const [isRegisterAlumniOpen, setIsRegisterAlumniOpen] = useState(false);

  const [selectedMentorForRequest, setSelectedMentorForRequest] = useState(null);

  const handleSetActiveTab = (tab) => {
    setActiveTabState(tab);
    localStorage.setItem('campusbridge_active_tab', tab);
    if (typeof window !== 'undefined') {
      window.location.hash = tab;
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('campusbridge_active_tab');
    if (user && saved && saved !== 'home') {
      setActiveTabState(saved);
      if (typeof window !== 'undefined') window.location.hash = saved;
    } else if (user && activeTab === 'home') {
      setActiveTabState('dashboard');
      if (typeof window !== 'undefined') window.location.hash = 'dashboard';
    }
  }, [user]);

  const isPublicLanding = !user && activeTab === 'home';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-subtle)' }}>
      {/* Persistent Global Header */}
      <TopHeader
        isPublicLanding={isPublicLanding}
        onNavigate={handleSetActiveTab}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenRegisterStudent={() => setIsRegisterStudentOpen(true)}
        onOpenRegisterAlumni={() => setIsRegisterAlumniOpen(true)}
      />

      {/* Verification Status Warning Banner */}
      {user && <VerificationBanner />}

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Persistent Collapsible Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={handleSetActiveTab} />

        {/* Main Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <main style={{ flex: 1, paddingBottom: '3rem' }}>
            
            {/* Public Landing View */}
            {activeTab === 'home' && (
              <LandingPage
                onOpenLogin={() => setIsLoginOpen(true)}
                onOpenRegisterStudent={() => setIsRegisterStudentOpen(true)}
                onOpenRegisterAlumni={() => setIsRegisterAlumniOpen(true)}
              />
            )}

            {/* Master Technical Domain Directory */}
            {activeTab === 'explore' && (
              <DomainExplorer
                onOpenCreateDomain={() => handleSetActiveTab('admin_operations')}
                onRequestMentorship={(mentor) => setSelectedMentorForRequest(mentor)}
              />
            )}

            {/* University Announcement & Placement Feed */}
            {activeTab === 'announcements' && (
              <AnnouncementFeed onNavigateToMentors={() => handleSetActiveTab('explore')} />
            )}

            {/* Study Resources Library */}
            {activeTab === 'resources' && <ResourceHub />}

            {/* Alumni Job Referral Portal */}
            {activeTab === 'referrals' && <JobReferralPortal />}

            {/* Admin Operations Center Exclusive Tab */}
            {user && activeTab === 'admin_operations' && (
              <AdminOperationsCenter activeSection={activeTab} />
            )}

            {/* User Specific Views (Dashboard, Active Mentorships, Requests, Sessions) */}
            {user && (activeTab === 'dashboard' || activeTab === 'active_mentorships' || activeTab === 'requests' || activeTab === 'sessions') && (
              user.role === 'ADMIN' ? (
                <AdminOperationsCenter activeSection={activeTab} />
              ) : user.role === 'ALUMNI' ? (
                <MentorDashboard activeSection={activeTab} />
              ) : (
                <StudentDashboard activeSection={activeTab} />
              )
            )}
          </main>

          <footer style={{ borderTop: '1px solid var(--border-card)', padding: '1.25rem 2rem', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.8rem', background: 'var(--bg-card)' }}>
            <p>© 2026 CampusBridge – University Alumni Network Engagement and Career Mentorship Management Platform</p>
          </footer>
        </div>
      </div>

      {/* Modals */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <StudentRegisterModal isOpen={isRegisterStudentOpen} onClose={() => setIsRegisterStudentOpen(false)} />
      <AlumniRegisterModal isOpen={isRegisterAlumniOpen} onClose={() => setIsRegisterAlumniOpen(false)} />

      {selectedMentorForRequest && (
        <RequestMentorshipModal
          mentor={selectedMentorForRequest}
          isOpen={Boolean(selectedMentorForRequest)}
          onClose={() => setSelectedMentorForRequest(null)}
          onSuccess={() => handleSetActiveTab('requests')}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainContent />
      </NotificationProvider>
    </AuthProvider>
  );
}
