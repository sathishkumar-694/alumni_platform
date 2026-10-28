import { useState } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { useNotification } from '../../shared/context/NotificationContext';
import {
  X, ShieldCheck, Upload, Eye, EyeOff,
  CheckCircle, Circle, AlertCircle, Linkedin, BookOpen
} from 'lucide-react';

// Domain expertise quiz questions — admin/system can verify by reviewing self-assessment
const EXPERTISE_QUESTIONS = [
  {
    id: 'q1',
    label: 'How many years of hands-on professional experience do you have in your mentoring domain?',
    options: ['Less than 1 year', '1–2 years', '3–5 years', '5+ years'],
    weight: [0, 1, 2, 3]
  },
  {
    id: 'q2',
    label: 'Have you completed any certifications, degrees, or formal training in this domain?',
    options: ['None', 'Online course only', 'Professional certification', 'Formal degree / multiple certs'],
    weight: [0, 1, 2, 3]
  },
  {
    id: 'q3',
    label: 'How actively do you currently work in this domain (in your job or projects)?',
    options: ['Not actively', 'Occasionally', 'Regularly', 'Core part of my daily work'],
    weight: [0, 1, 2, 3]
  },
  {
    id: 'q4',
    label: 'Have you mentored, taught, or guided others in this domain before?',
    options: ['Never', 'Informally / 1–2 times', 'A few times', 'Regularly / formally'],
    weight: [0, 1, 2, 3]
  }
];

const getScoreLabel = (score) => {
  if (score >= 10) return { label: 'Expert', color: '#10b981', badge: 'badge-emerald' };
  if (score >= 7) return { label: 'Proficient', color: '#3b82f6', badge: 'badge-cyan' };
  if (score >= 4) return { label: 'Intermediate', color: '#f59e0b', badge: 'badge-amber' };
  return { label: 'Beginner', color: '#ef4444', badge: 'badge-rose' };
};

export const AlumniRegisterModal = ({ isOpen, onClose }) => {
  const { registerAlumni } = useAuth();
  const { showNotification } = useNotification();

  const [step, setStep] = useState(1); // 1 = profile, 2 = expertise quiz

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
    designation: '',
    experienceYears: '5',
    graduationYear: '2020',
    linkedinUrl: '',
    maxCapacity: '5',
    bio: '',
    mentorDomain: '' // The specific domain they claim expertise in
  });

  // Quiz answers: { q1: 2, q2: 1, ... }
  const [quizAnswers, setQuizAnswers] = useState({});
  const [file, setFile] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('image/')) {
      showNotification('Only photo/image files (PNG, JPG, WEBP, SVG) are accepted.', 'error');
      setFile(null);
      e.target.value = '';
      return;
    }
    setFile(selectedFile);
  };

  const resetForm = () => {
    setFormData({
      name: '', email: '', password: '', company: '', designation: '',
      experienceYears: '1', graduationYear: String(new Date().getFullYear()),
      linkedinUrl: '', maxCapacity: '5', bio: '', mentorDomain: ''
    });
    setQuizAnswers({});
    setFile(null);
    setShowPassword(false);
    setStep(1);
  };

  const handleClose = () => { resetForm(); onClose(); };

  // Quiz score
  const quizScore = EXPERTISE_QUESTIONS.reduce((acc, q, idx) => {
    const ans = quizAnswers[q.id];
    console.log(idx)
    return acc + (ans !== undefined ? q.weight[ans] : 0);
  }, 0);
  const maxScore = EXPERTISE_QUESTIONS.reduce((acc, q) => acc + Math.max(...q.weight), 0);
  const scoreInfo = getScoreLabel(quizScore);
  const allAnswered = EXPERTISE_QUESTIONS.every(q => quizAnswers[q.id] !== undefined);

  const handleStep1Next = (e) => {
    e.preventDefault();
    if (!formData.linkedinUrl.trim()) {
      showNotification('LinkedIn profile URL is required for domain verification.', 'error');
      return;
    }
    if (!formData.mentorDomain.trim()) {
      showNotification('Please specify the technical domain you will be mentoring in.', 'error');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allAnswered) {
      showNotification('Please answer all expertise assessment questions.', 'error');
      return;
    }
    if (quizScore < 4) {
      showNotification('Your expertise score is too low for mentoring. Please build more experience in this domain first.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      // Attach quiz results for admin review
      data.append('expertiseScore', quizScore);
      data.append('expertiseLevel', scoreInfo.label);
      data.append('expertiseQuizAnswers', JSON.stringify(quizAnswers));
      if (file) data.append('alumniIdCard', file);

      await registerAlumni(data);
      showNotification('Alumni mentor registered! Your expertise assessment has been submitted for admin review.', 'success');
      resetForm();
      onClose();
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleClose}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ margin: 'auto', maxWidth: '620px', width: '100%' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', margin: 0 }}>Volunteer as Alumni Mentor</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Step {step} of 2 — {step === 1 ? 'Profile & Credentials' : 'Domain Expertise Assessment'}
            </p>
          </div>
          <button onClick={handleClose} className="btn btn-secondary btn-sm" style={{ padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              flex: 1, height: '4px', borderRadius: '999px',
              background: s <= step ? 'var(--primary)' : 'var(--border-card)',
              transition: 'background 0.3s ease'
            }} />
          ))}
        </div>

        {/* ── STEP 1: PROFILE ── */}
        {step === 1 && (
          <form onSubmit={handleStep1Next}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" className="form-input" placeholder="e.g. David Vance" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Work / Professional Email <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="email" className="form-input" placeholder="david@techcorp.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Current Company / Org <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" className="form-input" placeholder="e.g. Google / Microsoft" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Designation / Role <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" className="form-input" placeholder="e.g. Senior Software Engineer" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Experience (Yrs) <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="number" className="form-input" value={formData.experienceYears} onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Grad Year <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="number" className="form-input" value={formData.graduationYear} onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Mentee Capacity <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="number" className="form-input" value={formData.maxCapacity} onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })} required />
              </div>
            </div>

            {/* LinkedIn — now REQUIRED for verification */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Linkedin size={14} color="#0a66c2" /> LinkedIn Profile URL <span style={{ color: '#ef4444' }}>*</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginLeft: 'auto' }}>Required for domain verification</span>
              </label>
              <input type="url" className="form-input" placeholder="https://linkedin.com/in/yourprofile" value={formData.linkedinUrl} onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })} required />
            </div>

            {/* Mentoring Domain — required */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BookOpen size={14} color="var(--primary)" /> Your Mentoring Domain / Specialization <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input type="text" className="form-input" placeholder="e.g. Machine Learning, Web Development, Cloud Architecture" value={formData.mentorDomain} onChange={(e) => setFormData({ ...formData, mentorDomain: e.target.value })} required />
              <p style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '0.3rem' }}>
                This will be verified in Step 2 through a quick self-assessment quiz.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Password <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} className="form-input" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} style={{ paddingRight: '2.5rem' }} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Optional ID upload — no longer compulsory */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Upload Alumni ID / Credential Photo <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 400 }}>(Optional — helps faster admin approval)</span></span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PNG, JPG, WEBP, SVG</span>
              </label>
              <div style={{ border: file ? '2px dashed var(--accent-emerald)' : '2px dashed var(--border-strong)', borderRadius: '8px', padding: '1rem', textAlign: 'center', cursor: 'pointer', background: file ? 'rgba(16,185,129,0.05)' : 'var(--bg-subtle)' }}>
                <Upload size={22} color={file ? 'var(--accent-emerald)' : 'var(--primary)'} style={{ marginBottom: '0.3rem' }} />
                <p style={{ fontSize: '0.8rem', fontWeight: file ? 700 : 400, color: file ? 'var(--accent-emerald)' : 'var(--text-main)', margin: '0 0 0.4rem' }}>
                  {file ? `✓ ${file.name}` : 'Click to upload ID card photo (optional)'}
                </p>
                <input type="file" accept="image/*" style={{ display: 'none' }} id="alumni-id-upload" onChange={handleFileChange} />
                <label htmlFor="alumni-id-upload" className="btn btn-secondary btn-sm">Browse Photo</label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }}>
              Next — Domain Expertise Assessment →
            </button>
          </form>
        )}

        {/* ── STEP 2: DOMAIN EXPERTISE QUIZ ── */}
        {step === 2 && (
          <form onSubmit={handleSubmit}>
            {/* Context header */}
            <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600, margin: '0 0 0.2rem' }}>
                Domain: <strong>{formData.mentorDomain}</strong>
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Answer honestly — admins review your LinkedIn and expertise score before approving your mentor account.
              </p>
            </div>

            {/* Questions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.25rem' }}>
              {EXPERTISE_QUESTIONS.map((q, qIdx) => (
                <div key={q.id} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '1rem' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 0.75rem' }}>
                    {qIdx + 1}. {q.label}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {q.options.map((opt, optIdx) => {
                      const isSelected = quizAnswers[q.id] === optIdx;
                      return (
                        <button
                          type="button"
                          key={optIdx}
                          onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.65rem',
                            padding: '0.55rem 0.85rem', borderRadius: '8px', border: 'none',
                            background: isSelected ? 'rgba(99,102,241,0.12)' : 'var(--bg-card)',
                            cursor: 'pointer', textAlign: 'left', fontSize: '0.82rem',
                            color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                            fontWeight: isSelected ? 600 : 400,
                            outline: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-card)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isSelected
                            ? <CheckCircle size={16} color="var(--primary)" />
                            : <Circle size={16} color="var(--text-subtle)" />
                          }
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Score meter */}
            {allAnswered && (
              <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', background: `${scoreInfo.color}12`, border: `1px solid ${scoreInfo.color}40`, marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: scoreInfo.color }}>
                    Expertise Score: {quizScore}/{maxScore} — {scoreInfo.label}
                  </span>
                  {quizScore < 4 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: '#ef4444' }}>
                      <AlertCircle size={13} /> Score too low to mentor
                    </div>
                  )}
                </div>
                <div style={{ height: '8px', borderRadius: '999px', background: 'var(--border-card)' }}>
                  <div style={{
                    height: '100%', borderRadius: '999px',
                    width: `${(quizScore / maxScore) * 100}%`,
                    background: scoreInfo.color,
                    transition: 'width 0.4s ease'
                  }} />
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', margin: '0.35rem 0 0' }}>
                  Admin will cross-verify with your LinkedIn profile and ID before activating your mentor account.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={() => setStep(1)} className="btn btn-secondary" style={{ flex: 1 }}>
                ← Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2 }}
                disabled={submitting || !allAnswered || quizScore < 4}
              >
                <ShieldCheck size={16} />
                {submitting ? 'Submitting...' : 'Register as Alumni Mentor'}
              </button>
            </div>

            {allAnswered && quizScore < 4 && (
              <p style={{ fontSize: '0.75rem', color: '#ef4444', textAlign: 'center', marginTop: '0.5rem' }}>
                Minimum score of 4/{maxScore} required to register as a mentor. Please gain more experience first.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
