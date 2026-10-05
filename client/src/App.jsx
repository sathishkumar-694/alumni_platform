import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './shared/context/AuthContext';
import { NotificationProvider } from './shared/context/NotificationContext';

import { Sidebar } from './shared/components/Sidebar';
import { TopHeader } from './shared/components/TopHeader';
import { VerificationBanner } from './shared/components/VerificationBanner';
import { StickyMobileCTA } from './shared/components/StickyMobileCTA';
import { CookieConsentBanner } from './shared/components/CookieConsentBanner';

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
import { AiResumeAnalyzerView } from './features/recommendation/AiResumeAnalyzerView';
import { RecommendedMentorsView } from './features/recommendation/RecommendedMentorsView';
import { UserProfileView } from './features/profile/UserProfileView';

import { PrivacyPolicyView } from './features/legal/PrivacyPolicyView';
import { TermsAndConditionsView } from './features/legal/TermsAndConditionsView';
import { ThankYouView } from './features/common/ThankYouView';
import { NotFoundView } from './features/common/NotFoundView';

import useDocumentMeta from './shared/hooks/useDocumentMeta';
import analytics from './shared/services/analytics';

const getInitialTab = () => {
  const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('campusbridge_token') : null;
  if (hash) return hash;
  if (token) return 'dashboard';
  return 'home';
};

const knownTabs = [
  'home', 'explore', 'announcements', 'resources', 'privacy', 'terms', 'thank-you', '404',
  'dashboard', 'active_mentorships', 'requests', 'sessions', 'profile',
  'resume_analyzer', 'recommended_mentors', 'referrals', 'admin_operations'
];

const MainContent = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTabState] = useState(getInitialTab);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterStudentOpen, setIsRegisterStudentOpen] = useState(false);
  const [isRegisterAlumniOpen, setIsRegisterAlumniOpen] = useState(false);
  const [selectedMentorForRequest, setSelectedMentorForRequest] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic Document Title & Meta Descriptions per tab (Items 2 & 3)
  useDocumentMeta(activeTab);

  // Privacy-friendly Client-side Analytics (Item 18)
  useEffect(() => {
    analytics.init();
    analytics.trackPageView(activeTab);
  }, [activeTab]);

  // Hash change synchronization listener
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== activeTab) {
        setActiveTabState(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

  const handleSetActiveTab = (tab) => {
    setActiveTabState(tab);
    localStorage.setItem('campusbridge_active_tab', tab);
    if (typeof window !== 'undefined') {
      window.location.hash = tab;
    }
  };

  useEffect(() => {
    if (!user) {
      // If visitor is logged out and on a protected tab (like dashboard, profile, requests), force 'home'
      const publicTabs = ['home', 'explore', 'announcements', 'resources', 'privacy', 'terms', 'thank-you', '404'];
      if (!publicTabs.includes(activeTab)) {
        setActiveTabState('home');
        if (typeof window !== 'undefined') window.location.hash = 'home';
      }
    } else {
      const saved = localStorage.getItem('campusbridge_active_tab');
      if (saved && saved !== 'home') {
        setActiveTabState(saved);
        if (typeof window !== 'undefined') window.location.hash = saved;
      } else if (activeTab === 'home') {
        setActiveTabState('dashboard');
        if (typeof window !== 'undefined') window.location.hash = 'dashboard';
      }
    }
  }, [user]);

  const isPublicLanding = !user && activeTab === 'home';
  const isUnknownTab = !knownTabs.includes(activeTab);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-subtle)' }}>
      {/* Persistent Global Header */}
      <TopHeader
        isPublicLanding={isPublicLanding}
        onNavigate={handleSetActiveTab}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenRegisterStudent={() => setIsRegisterStudentOpen(true)}
        onOpenRegisterAlumni={() => setIsRegisterAlumniOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
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
                onExploreDomains={() => handleSetActiveTab('explore')}
              />
            )}

            {/* Legal: Privacy Policy View (Item 15) */}
            {activeTab === 'privacy' && (
              <PrivacyPolicyView onNavigateHome={() => handleSetActiveTab('home')} />
            )}

            {/* Legal: Terms and Conditions View (Item 16) */}
            {activeTab === 'terms' && (
              <TermsAndConditionsView onNavigateHome={() => handleSetActiveTab('home')} />
            )}

            {/* Common: Confirmation / Thank You View (Item 14) */}
            {activeTab === 'thank-you' && (
              <ThankYouView
                onNavigateHome={() => handleSetActiveTab('home')}
                onNavigateDashboard={() => handleSetActiveTab(user ? 'dashboard' : 'home')}
                onNavigateExplore={() => handleSetActiveTab('explore')}
              />
            )}

            {/* Dedicated User Profile & ID Credentials View */}
            {user && activeTab === 'profile' && <UserProfileView />}

            {/* Dedicated AI Resume Analyzer Workspace Tab */}
            {activeTab === 'resume_analyzer' && (
              <AiResumeAnalyzerView
                onRequestMentorship={(mentor) => setSelectedMentorForRequest(mentor)}
              />
            )}

            {/* Dedicated Recommended Alumni Mentors Tab */}
            {activeTab === 'recommended_mentors' && (
              <RecommendedMentorsView
                onRequestMentorship={(mentor) => setSelectedMentorForRequest(mentor)}
                searchQuery={searchQuery}
              />
            )}

            {/* Master Technical Domain Directory */}
            {activeTab === 'explore' && (
              <DomainExplorer
                onOpenCreateDomain={() => handleSetActiveTab('admin_operations')}
                onRequestMentorship={(mentor) => setSelectedMentorForRequest(mentor)}
                searchQuery={searchQuery}
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

            {/* Unmatched / 404 Route Fallback (Item 1) */}
            {(activeTab === '404' || isUnknownTab) && (
              <NotFoundView
                onNavigateHome={() => handleSetActiveTab('home')}
                onNavigateExplore={() => handleSetActiveTab('explore')}
              />
            )}
          </main>

          {/* Footer: Full Institutional on Landing Page, Clean Minimal Copyright in Workspace */}
          {isPublicLanding ? (
            <footer
              style={{
                borderTop: '1px solid var(--border-card)',
                padding: '3rem 2rem 2rem',
                background: 'var(--bg-card)',
                color: 'var(--text-subtle)'
              }}
            >
              <div
                className="footer-content-grid"
                style={{
                  maxWidth: '1200px',
                  margin: '0 auto',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                  gap: '2.5rem',
                  textAlign: 'left',
                  marginBottom: '2.5rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.9rem' }}>
                      CB
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                      CampusBridge
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1rem', maxWidth: '320px' }}>
                    Official University Alumni Network Engagement and Career Mentorship Management Platform. Empowering students with 1-on-1 industry guidance.
                  </p>
                  <span className="badge badge-cyan" style={{ fontSize: '0.725rem' }}>
                    BIT Institutional Network
                  </span>
                </div>

                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-main)', marginBottom: '0.85rem' }}>
                    Campus Address
                  </p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.65' }}>
                    Bannari Amman Institute of Technology<br />
                    Alathukombai Post, Sathyamangalam<br />
                    Erode District, Tamil Nadu – 638401, India
                  </p>
                </div>

                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-main)', marginBottom: '0.85rem' }}>
                    Contact Desk
                  </p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '0.4rem' }}>
                    <strong>Email:</strong>{' '}
                    <a href="mailto:alumni@bitsathy.ac.in" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                      alumni@bitsathy.ac.in
                    </a>
                  </p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '0.4rem' }}>
                    <strong>Phone:</strong> +91 (4295) 226000
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                    Desk Hours: Mon–Fri, 9:00 AM – 5:00 PM IST
                  </p>
                </div>

                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-main)', marginBottom: '0.85rem' }}>
                    Legal & Resources
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.875rem' }}>
                    <button onClick={() => handleSetActiveTab('home')} style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      Platform Home
                    </button>
                    <button onClick={() => handleSetActiveTab('explore')} style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      Find Mentors
                    </button>
                    <button onClick={() => handleSetActiveTab('privacy')} style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>
                      Privacy Policy
                    </button>
                    <button onClick={() => handleSetActiveTab('terms')} style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>
                      Terms & Conditions
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                <p>© 2026 CampusBridge – Bannari Amman Institute of Technology. All rights reserved.</p>
              </div>
            </footer>
          ) : (
            <footer
              style={{
                borderTop: '1px solid var(--border-card)',
                padding: '0.75rem 1.5rem',
                textAlign: 'center',
                fontSize: '0.75rem',
                color: 'var(--text-subtle)',
                background: 'var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap'
              }}
            >
              <span>CampusBridge Portal v2.4</span>
              <span>•</span>
              <span>© 2026 Bannari Amman Institute of Technology. All rights reserved.</span>
              <span>•</span>
              <button
                onClick={() => handleSetActiveTab('privacy')}
                style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', padding: 0, fontSize: '0.75rem', textDecoration: 'underline' }}
              >
                Privacy Policy
              </button>
              <span>•</span>
              <button
                onClick={() => handleSetActiveTab('terms')}
                style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', padding: 0, fontSize: '0.75rem', textDecoration: 'underline' }}
              >
                Terms
              </button>
            </footer>
          )}
        </div>
      </div>

      {/* Sticky Mobile Call to Action (Item 11) */}
      <StickyMobileCTA
        user={user}
        onOpenRegister={() => setIsRegisterStudentOpen(true)}
        onNavigateExplore={() => handleSetActiveTab('explore')}
        onNavigateResumeAnalyzer={() => handleSetActiveTab('resume_analyzer')}
      />

      {/* Cookie Consent Banner (Item 17) */}
      <CookieConsentBanner
        onNavigatePrivacy={() => handleSetActiveTab('privacy')}
      />

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

export function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainContent />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
