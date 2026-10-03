import React from 'react';

export const TermsAndConditionsView = ({ onNavigateHome }) => {
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
          <span className="badge badge-purple">Platform Terms</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-subtle)' }}>Last Updated: September 18, 2026</span>
        </div>
        <h1 style={{ fontSize: '2.25rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          CampusBridge Terms and Conditions
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.6' }}>
          Please review the terms of service governing participation, mentorship interactions, and platform conduct within the CampusBridge alumni engagement network.
        </p>
      </div>

      {/* Main Terms Box */}
      <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Section 1 */}
        <section>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 800 }}>1.</span> Platform Eligibility & Verification
          </h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
            CampusBridge is a closed, institutional platform. Access is restricted to current bona fide students, verified alumni, and faculty coordinators of Bannari Amman Institute of Technology. All account registrations are subject to automated format verification and manual administrator review before reaching fully verified status. Providing false academic credentials or misrepresenting employment history constitutes immediate grounds for account revocation.
          </p>
        </section>

        <hr style={{ borderColor: 'var(--border-card)', opacity: 0.6 }} />

        {/* Section 2 */}
        <section>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 800 }}>2.</span> Mentorship Code of Conduct
          </h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '0.75rem' }}>
            All mentorship interactions, messaging, resume evaluations, and mock interview video meetings must maintain the highest standards of professionalism and institutional mutual respect:
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-muted)', lineHeight: '1.8' }}>
            <li><strong>Punctuality:</strong> Both students and mentors agree to honor scheduled mentorship appointments. If rescheduling is necessary, minimum 24 hours advance notice is required.</li>
            <li><strong>Constructive Focus:</strong> Guidance must be centered on career growth, technical upskilling, resume critiques, and interview preparation.</li>
            <li><strong>Harassment Zero Tolerance:</strong> Any form of discrimination, inappropriate communication, harassment, or solicitation will result in permanent ban and institutional disciplinary action.</li>
          </ul>
        </section>

        <hr style={{ borderColor: 'var(--border-card)', opacity: 0.6 }} />

        {/* Section 3 */}
        <section>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 800 }}>3.</span> Referrals and Job Postings
          </h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
            Alumni post job openings and internal employee referral opportunities voluntarily in good faith. Submitting an application or referral request does not guarantee employment or an interview. Alumni maintain complete discretion over internal candidate referrals according to their employer’s official HR policies.
          </p>
        </section>

        <hr style={{ borderColor: 'var(--border-card)', opacity: 0.6 }} />

        {/* Section 4 */}
        <section>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 800 }}>4.</span> Non-Commercial Voluntary Nature
          </h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
            CampusBridge is a non-commercial educational initiative. Mentors volunteer their personal time without monetary compensation. Charging fees or soliciting monetary payments for mentorship, resume reviews, or referrals through CampusBridge is strictly prohibited.
          </p>
        </section>

        <hr style={{ borderColor: 'var(--border-card)', opacity: 0.6 }} />

        {/* Section 5 */}
        <section>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 800 }}>5.</span> Limitation of Liability & Contact
          </h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '1rem' }}>
            Bannari Amman Institute of Technology and the CampusBridge administrative team do not warrant that all advice or employment tips provided by mentors will result in placement. Inquiries concerning these terms should be directed to the CampusBridge platform administrator:
          </p>
          <div style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
            <p style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>CampusBridge Administration Office</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Bannari Amman Institute of Technology, Sathyamangalam – 638401</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
              Email: <a href="mailto:admin.campusbridge@bitsathy.ac.in" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>admin.campusbridge@bitsathy.ac.in</a>
            </p>
          </div>
        </section>

      </div>
    </div>
  );
};
