import React from 'react';

export const PrivacyPolicyView = ({ onNavigateHome }) => {
  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
      {/* Header Breadcrumb & Title */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={onNavigateHome}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '1rem',
            padding: 0
          }}
        >
          ← Back to Home
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="badge badge-cyan">Legal & Compliance</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-subtle)' }}>Last Updated: September 18, 2026</span>
        </div>
        <h1 style={{ fontSize: '2.25rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          CampusBridge Privacy Policy
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.6' }}>
          Your privacy is paramount. This Privacy Policy outlines how the CampusBridge platform collects, uses, protects, and handles institutional student and alumni member data.
        </p>
      </div>

      {/* Main Content Box */}
      <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Section 1 */}
        <section>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 800 }}>1.</span> Institutional Data Collection
          </h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '0.75rem' }}>
            CampusBridge is designed exclusively for verified members of Bannari Amman Institute of Technology (BIT). To ensure platform integrity and verify alumni credentials, we collect:
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-muted)', lineHeight: '1.8' }}>
            <li><strong>Student Information:</strong> Official University Roll Number, full name, institutional email address (@bitsathy.ac.in), academic department, degree programme, and graduation batch year.</li>
            <li><strong>Alumni Information:</strong> Graduation batch year, department, current employer, job designation, verified LinkedIn profile URL, and industry specializations.</li>
            <li><strong>Profile & Mentorship Records:</strong> Profile photographs, technical interest domains, mentorship availability slots, session bookings, and feedback ratings.</li>
          </ul>
        </section>

        <hr style={{ borderColor: 'var(--border-card)', opacity: 0.6 }} />

        {/* Section 2 */}
        <section>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 800 }}>2.</span> AI Resume Analysis & Gemini Processing
          </h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '0.75rem' }}>
            When students utilize the <strong>AI Resume Analyzer</strong> workspace:
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-muted)', lineHeight: '1.8' }}>
            <li>Resume files (PDF format) are processed using server-side Google Gemini 2.5 Pro multimodal analysis solely to extract technical competencies, projects, and career domain alignment.</li>
            <li>Resume contents are processed ephemerally for the immediate purpose of generating feedback, keyword gap analysis, and tailored alumni mentor recommendations.</li>
            <li>User resumes are never sold, rented, or utilized for commercial ad targeting.</li>
          </ul>
        </section>

        <hr style={{ borderColor: 'var(--border-card)', opacity: 0.6 }} />

        {/* Section 3 */}
        <section>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 800 }}>3.</span> Purpose of Data Processing
          </h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
            All collected personal and academic information is processed strictly to:
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-muted)', lineHeight: '1.8', marginTop: '0.5rem' }}>
            <li>Authenticate user identity against authorized BIT campus registry records.</li>
            <li>Facilitate high-value, verified 1-on-1 mentorship pairings between students and experienced alumni.</li>
            <li>Notify members of upcoming mentorship calls, referral opportunities, and institutional career announcements.</li>
            <li>Maintain institutional safety, prevent impersonation, and uphold community standards.</li>
          </ul>
        </section>

        <hr style={{ borderColor: 'var(--border-card)', opacity: 0.6 }} />

        {/* Section 4 */}
        <section>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 800 }}>4.</span> Cookies & Local Analytics
          </h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
            CampusBridge utilizes privacy-friendly first-party browser cookies and local storage tokens strictly to maintain secure login sessions (<code style={{ color: 'var(--primary)' }}>campusbridge_token</code>), user UI preferences (such as light/dark mode theme), and aggregated navigation analytics to improve site performance. We do not use intrusive third-party cross-site advertising trackers.
          </p>
        </section>

        <hr style={{ borderColor: 'var(--border-card)', opacity: 0.6 }} />

        {/* Section 5 */}
        <section>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 800 }}>5.</span> Contact University Alumni Relations Cell
          </h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '1rem' }}>
            If you have questions regarding this privacy policy, your personal data stored on CampusBridge, or wish to request data correction or account deletion, please contact:
          </p>
          <div style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
            <p style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Alumni Relations & Career Development Cell</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Bannari Amman Institute of Technology</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sathyamangalam, Erode District, Tamil Nadu – 638401, India</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Email: <a href="mailto:alumni@bitsathy.ac.in" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>alumni@bitsathy.ac.in</a> | Phone: +91 (4295) 226000
            </p>
          </div>
        </section>

      </div>
    </div>
  );
};
