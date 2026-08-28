import React from 'react';
import {
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Users,
  Award,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Target,
  Compass,
  Briefcase,
  Star,
  Zap,
  TrendingUp,
  MessageSquare
} from 'lucide-react';

export const LandingPage = ({ onOpenLogin, onOpenRegisterStudent, onOpenRegisterAlumni, onExploreDomains }) => {
  return (
    <div style={{ background: 'var(--bg-dark)', color: 'var(--text-main)', overflowX: 'hidden' }}>

      {/* Hero Section */}
      <section style={{ padding: '5rem 1.5rem 4rem', background: 'var(--bg-dark)', borderBottom: '1px solid var(--border-card)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary-subtle)', border: '1px solid var(--primary)', padding: '0.4rem 1rem', borderRadius: '9999px', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.5rem' }}>
            <Sparkles size={16} /> Official University Alumni Mentorship Platform
          </div>

          <h1 style={{ fontSize: '3.25rem', fontWeight: 800, lineHeight: 1.15, color: 'var(--text-main)', letterSpacing: '-0.03em', maxWidth: '900px', margin: '0 auto 1.25rem' }}>
            Bridge the Gap Between <span style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Campus Learning</span> & Industry Careers
          </h1>

          <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: '720px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
            Connect 1-on-1 with verified university alumni working at Google, Microsoft, Amazon, and top tech firms. Accelerated career guidance, milestone roadmaps, and mock interviews.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
            <button onClick={onOpenRegisterStudent} className="btn btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
              <Sparkles size={18} /> Join as Student <ArrowRight size={18} />
            </button>
            <button onClick={onOpenRegisterAlumni} className="btn btn-secondary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem', borderColor: 'var(--border-card)' }}>
              <ShieldCheck size={18} color="#7c3aed" /> Volunteer as Alumni Mentor
            </button>
            <button onClick={onExploreDomains} className="btn btn-secondary" style={{ padding: '0.85rem 1.5rem', fontSize: '1rem' }}>
              <Compass size={18} /> Browse Tech Domains
            </button>
          </div>

          {/* Quick Demo Test Login Banner */}
          <div className="glass-panel" style={{ padding: '1.25rem 1.75rem', borderRadius: '16px', maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>⚡ Fast 1-Click Evaluation Accounts</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>Test student, mentor, or admin dashboards without filling out forms.</p>
              </div>
              <button onClick={onOpenLogin} className="btn btn-primary btn-sm">
                Open 1-Click Demo Login
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Trust & Platform Metrics */}
      <section style={{ padding: '3rem 1.5rem', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-card)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', textAlign: 'center' }}>
          <div>
            <p style={{ fontSize: '2.5rem', fontWeight: 800, color: '#2563eb', fontFamily: 'var(--font-heading)' }}>500+</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Verified Alumni Mentors</p>
          </div>
          <div>
            <p style={{ fontSize: '2.5rem', fontWeight: 800, color: '#7c3aed', fontFamily: 'var(--font-heading)' }}>1,200+</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Student Mentees</p>
          </div>
          <div>
            <p style={{ fontSize: '2.5rem', fontWeight: 800, color: '#059669', fontFamily: 'var(--font-heading)' }}>98%</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Milestone Completion Rate</p>
          </div>
          <div>
            <p style={{ fontSize: '2.5rem', fontWeight: 800, color: '#d97706', fontFamily: 'var(--font-heading)' }}>15+</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Specialized Tech Tracks</p>
          </div>
        </div>
      </section>

      {/* How CampusBridge Works */}
      <section style={{ padding: '4.5rem 1.5rem', background: 'var(--bg-dark)', borderBottom: '1px solid var(--border-card)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span className="badge badge-purple" style={{ marginBottom: '0.5rem' }}>Structured Process</span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)' }}>How CampusBridge Mentorship Works</h2>
            <p style={{ fontSize: '1rem', color: 'var(--text-subtle)', marginTop: '0.5rem' }}>A structured, outcome-focused mentorship methodology designed for student success</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {/* Step 1 */}
            <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
              <div style={{ background: '#eff6ff', color: '#2563eb', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.25rem', marginBottom: '1.25rem' }}>
                01
              </div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>AI Matching & Interest Selection</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Students select target domains (Full Stack, Cloud, AI, Security). Our recommendation engine scores compatibility matches with verified alumni mentors.
              </p>
            </div>

            {/* Step 2 */}
            <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
              <div style={{ background: '#f5f3ff', color: '#7c3aed', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.25rem', marginBottom: '1.25rem' }}>
                02
              </div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>1-on-1 Guidance & Sessions</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Submit mentorship requests or join waitlists. Once accepted, schedule virtual video calls, resume feedback, and mock technical interviews.
              </p>
            </div>

            {/* Step 3 */}
            <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
              <div style={{ background: '#ecfdf5', color: '#059669', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.25rem', marginBottom: '1.25rem' }}>
                03
              </div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Milestone Roadmaps & Graduation</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Track project milestones step by step. Upon completing your roadmap, your mentor marks the relationship complete and frees capacity for new mentees.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Domain Tracks */}
      <section style={{ padding: '4.5rem 1.5rem', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-card)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
            <div>
              <span className="badge badge-cyan" style={{ marginBottom: '0.5rem' }}>Technical Tracks</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>Popular Mentorship Domains</h2>
            </div>
            <button onClick={onExploreDomains} className="btn btn-secondary btn-sm">
              View All Domains <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>Software Engineering</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginBottom: '1rem' }}>Distributed systems, OOP design, API design</p>
              <span className="badge badge-cyan">45 Verified Mentors</span>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>Cloud Systems & DevOps</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginBottom: '1rem' }}>Kubernetes, AWS architecture, CI/CD pipelines</p>
              <span className="badge badge-purple">32 Verified Mentors</span>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>Data Structures & Algorithms</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginBottom: '1rem' }}>LeetCode medium/hard patterns, mock interviews</p>
              <span className="badge badge-emerald">58 Verified Mentors</span>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>Machine Learning & AI</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginBottom: '1rem' }}>LLM pipelines, PyTorch modeling, AI agents</p>
              <span className="badge badge-amber">24 Verified Mentors</span>
            </div>
          </div>
        </div>
      </section>

      {/* Alumni Testimonials */}
      <section style={{ padding: '4.5rem 1.5rem', background: 'var(--bg-dark)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="badge badge-emerald" style={{ marginBottom: '0.5rem' }}>Alumni Impact</span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>What Our Alumni Mentors Say</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '16px' }}>
              <div style={{ display: 'flex', gap: '0.2rem', color: '#eab308', marginBottom: '1rem' }}>
                <Star size={16} fill="#eab308" /><Star size={16} fill="#eab308" /><Star size={16} fill="#eab308" /><Star size={16} fill="#eab308" /><Star size={16} fill="#eab308" />
              </div>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                "Guiding current university students through system design milestones has been extremely fulfilling. CampusBridge's capacity slot management makes mentorship manageable alongside a full-time tech job."
              </p>
              <div>
                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>David Vance</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>Senior Software Engineer at Google</p>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '16px' }}>
              <div style={{ display: 'flex', gap: '0.2rem', color: '#eab308', marginBottom: '1rem' }}>
                <Star size={16} fill="#eab308" /><Star size={16} fill="#eab308" /><Star size={16} fill="#eab308" /><Star size={16} fill="#eab308" /><Star size={16} fill="#eab308" />
              </div>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                "The milestone roadmap feature ensures mentees complete real projects before entering campus placement drives. I've already helped 4 mentees land full-time SDE offers!"
              </p>
              <div>
                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>Sarah Al-Mansoor</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>Principal Cloud Architect at AWS</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
