import React, { useState } from 'react';
import { apiClient } from '../../shared/services/api';
import { useAuth } from '../../shared/context/AuthContext';
import { useNotification } from '../../shared/context/NotificationContext';
import {
  Sparkles,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  Award,
  Zap,
  RefreshCw,
  File,
  Globe,
  Building,
  Check,
  Loader2,
  ChevronRight,
  Compass,
  Target
} from 'lucide-react';

export const AiResumeAnalyzerView = ({ onRequestMentorship }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // Form inputs
  const [targetRole, setTargetRole] = useState('Software Development Engineer (SDE-1)');
  const [resumeText, setResumeText] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Preset job roles for 1-click selection
  const presetRoles = [
    'Software Development Engineer (SDE-1)',
    'Full Stack Web Developer',
    'Frontend React Engineer',
    'Backend Node.js / Python Engineer',
    'Data Analyst / Data Scientist',
    'Cloud & DevOps Engineer',
    'Mobile App Developer (Flutter/iOS)',
    'Mechanical / CAD Engineer'
  ];

  // Client-side file reading & text extraction preview
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileNameLower = file.name.toLowerCase();
    const isPdf = fileNameLower.endsWith('.pdf');
    const isWord = fileNameLower.endsWith('.doc') || fileNameLower.endsWith('.docx');
    const isTxt = fileNameLower.endsWith('.txt');

    if (!isPdf && !isWord && !isTxt) {
      showNotification('Unsupported format! Please upload a PDF (.pdf), Word (.doc, .docx), or Text (.txt) file.', 'error');
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawResult = event.target?.result || '';
      let extracted = '';

      if (typeof rawResult === 'string') {
        if (isTxt) {
          extracted = rawResult;
        } else if (isWord) {
          const xmlMatches = [...rawResult.matchAll(/<w:t[^>]*>(.*?)<\/w:t>/gi)].map(m => m[1]);
          if (xmlMatches.length > 0) {
            extracted = xmlMatches.join(' ');
          } else {
            extracted = rawResult.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
          }
        } else {
          extracted = rawResult.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
        }
      }

      const cleanText = extracted.replace(/\s+/g, ' ').trim();
      
      if (cleanText.length > 15) {
        setResumeText(cleanText);
        showNotification(`Extracted resume text from '${file.name}' (${cleanText.length} chars)`, 'success');
      } else {
        setResumeText(`[Attached Document: ${file.name}]\n(You can paste or edit your key resume skills, experience, and project bullet points directly below)`);
        showNotification(`Attached '${file.name}'. You can verify or edit your resume text below.`, 'success');
      }
    };

    reader.readAsText(file);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();

    const textToSubmit = resumeText.trim();
    if (!selectedFile && !textToSubmit) {
      showNotification('Please upload your Resume document or paste your resume content below.', 'error');
      return;
    }

    setLoading(true);

    try {
      const res = await apiClient('/recommendation/analyze-resume', {
        method: 'POST',
        body: JSON.stringify({
          resumeText: textToSubmit || `Resume File: ${selectedFile?.name}`,
          targetRole,
          portfolioUrl
        })
      });

      setAnalysisResult(res.data);
      showNotification('AI ATS Resume & Industry Fit Analysis completed!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to analyze resume', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setSelectedFile(null);
    setResumeText('');
    setPortfolioUrl('');
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return { label: 'EXCELLENT ATS MATCH', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
    if (score >= 60) return { label: 'GOOD MATCH - NEEDS FEW KEYWORDS', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
    return { label: 'NEEDS ATS OPTIMIZATION', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1.5rem' }}>
      
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311b92 100%)',
          padding: '2.25rem',
          borderRadius: '24px',
          color: '#ffffff',
          marginBottom: '2rem',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.25)', color: '#d8b4fe', borderColor: '#a855f7' }}>
            <Zap size={14} /> AI Engine
          </span>
          <span className="badge badge-emerald">Real-Time Evaluation</span>
        </div>

        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', margin: '0.25rem 0 0.5rem' }}>
          🤖 AI Resume & Industry Fit Analyzer
        </h2>
        <p style={{ fontSize: '0.95rem', color: '#cbd5e1', maxWidth: '780px', lineHeight: 1.5, margin: 0 }}>
          Upload your resume or paste your experience content to calculate your ATS compatibility match, detect missing industry keywords, and match with verified alumni mentors.
        </p>
      </div>

      {/* INPUT FORM VIEW */}
      {!analysisResult ? (
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '20px' }}>
          <form onSubmit={handleAnalyze}>
            
            {/* Step 1: Target Role Selection */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Target size={16} color="var(--primary)" /> 1. Select Target Job Role / Desired Title
              </label>

              {/* Preset Role Quick Selector Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                {presetRoles.map(role => (
                  <button
                    type="button"
                    key={role}
                    onClick={() => setTargetRole(role)}
                    style={{
                      background: targetRole === role ? 'var(--primary)' : 'var(--bg-subtle)',
                      color: targetRole === role ? '#ffffff' : 'var(--text-main)',
                      border: targetRole === role ? '1px solid var(--primary)' : '1px solid var(--border-card)',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {role}
                  </button>
                ))}
              </div>

              <input
                type="text"
                className="form-input"
                placeholder="Or type custom role (e.g. Cybersecurity Specialist, ML Engineer)"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                required
                style={{ height: '44px', fontSize: '0.9rem' }}
              />
            </div>

            {/* Step 2: File Upload / Drag Zone */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Upload size={16} color="var(--primary)" /> 2. Upload Resume File (.pdf, .docx, .doc, .txt)
              </label>

              <div
                style={{
                  border: '2px dashed var(--border-card)',
                  borderRadius: '16px',
                  padding: '1.75rem',
                  textAlign: 'center',
                  background: selectedFile ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />

                {selectedFile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                    <FileText size={36} color="var(--primary)" />
                    <p style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem', margin: 0 }}>
                      Selected File: {selectedFile.name}
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', margin: 0 }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB • Click or drag to replace file
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                    <Upload size={32} color="var(--text-subtle)" />
                    <p style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem', margin: 0 }}>
                      Click to Browse or Drag & Drop PDF / Word Resume Here
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', margin: 0 }}>
                      Supports PDF (.pdf), Word (.doc, .docx) & Plain Text (.txt)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Text Preview & Manual Editing Area */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                  <FileText size={16} color="var(--primary)" /> 3. Resume Content & Key Skills Text Preview
                </label>

                {resumeText.trim() && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                    {resumeText.length} characters captured
                  </span>
                )}
              </div>

              <textarea
                className="form-textarea"
                rows={6}
                placeholder="Paste raw resume text, work experience, project descriptions, and technical skills here if not uploading a file..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                style={{ fontSize: '0.85rem', lineHeight: '1.5' }}
              />
            </div>

            {/* Step 4: Optional Portfolio Link */}
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Globe size={14} color="var(--text-subtle)" /> Portfolio / GitHub / LinkedIn Profile URL (Optional)
              </label>
              <input
                type="url"
                className="form-input"
                placeholder="https://github.com/yourusername or https://linkedin.com/in/yourprofile"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                style={{ height: '40px', fontSize: '0.85rem' }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '1rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin-animation" /> Analyzing Resume via AI Engine...
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Analyze Resume & Calculate ATS Match
                </>
              )}
            </button>
          </form>
        </div>
      ) : (

        /* ========================================================
            ANALYSIS RESULT DASHBOARD
        ======================================================== */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* TOP CARD: OVERALL ATS SCORE & ROLE MATCH */}
          {(() => {
            const badge = getScoreBadge(analysisResult.ats_score);
            return (
              <div
                className="glass-panel"
                style={{
                  padding: '2rem',
                  borderRadius: '24px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '2rem',
                  alignItems: 'center',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)'
                }}
              >
                {/* Score Circular Gauge */}
                <div style={{ textAlign: 'center', padding: '1rem', borderRight: '1px solid var(--border-card)' }}>
                  <div
                    style={{
                      width: '130px',
                      height: '130px',
                      borderRadius: '50%',
                      background: `conic-gradient(${badge.color} ${analysisResult.ats_score * 3.6}deg, var(--bg-subtle) 0deg)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem',
                      boxShadow: '0 0 20px rgba(99, 102, 241, 0.2)'
                    }}
                  >
                    <div
                      style={{
                        width: '106px',
                        height: '106px',
                        borderRadius: '50%',
                        background: 'var(--bg-card)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <span style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>
                        {analysisResult.ats_score}%
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase', marginTop: '0.2rem' }}>
                        ATS MATCH
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '20px',
                      background: badge.bg,
                      color: badge.color,
                      fontSize: '0.78rem',
                      fontWeight: 800
                    }}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Target Role & Engine Metadata */}
                <div>
                  <span className="badge badge-purple" style={{ marginBottom: '0.5rem' }}>
                    Target Role Analysis
                  </span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                    {analysisResult.target_role}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
                    Evaluated by <strong>{analysisResult.ai_provider || 'CampusBridge AI Engine'}</strong>. Keywords, formatting, technical depth, and impact verbiage were compared against standard engineering hiring benchmarks.
                  </p>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button onClick={handleReset} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <RefreshCw size={14} /> Analyze Another Resume
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* SUB-SCORES BREAKDOWN GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>ATS Keyword Coverage</p>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>{analysisResult.keyword_match_score}%</p>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden', marginTop: '0.5rem' }}>
                <div style={{ width: `${analysisResult.keyword_match_score}%`, height: '100%', background: 'var(--primary)' }} />
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Measurable Impact & Metrics</p>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-purple)' }}>{analysisResult.impact_score}%</p>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden', marginTop: '0.5rem' }}>
                <div style={{ width: `${analysisResult.impact_score}%`, height: '100%', background: 'var(--accent-purple)' }} />
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>ATS Format & Readability</p>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{analysisResult.format_score}%</p>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden', marginTop: '0.5rem' }}>
                <div style={{ width: `${analysisResult.format_score}%`, height: '100%', background: 'var(--accent-emerald)' }} />
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Technical Depth & Relevance</p>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{analysisResult.technical_depth_score}%</p>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden', marginTop: '0.5rem' }}>
                <div style={{ width: `${analysisResult.technical_depth_score}%`, height: '100%', background: 'var(--accent-amber)' }} />
              </div>
            </div>
          </div>

          {/* DETECTED SKILLS VS MISSING KEYWORDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
            
            {/* Detected Skills */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
              <h4 style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} color="#059669" /> Verified Skills Found in Resume ({(analysisResult.detected_skills || []).length})
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {(analysisResult.detected_skills || []).map((skill, idx) => (
                  <span key={idx} className="badge badge-emerald" style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}>
                    <Check size={12} /> {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Keywords */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
              <h4 style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} color="#d97706" /> Critical Missing Keywords for {analysisResult.target_role}
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {(analysisResult.recommended_skills_to_learn || []).map((skill, idx) => (
                  <span key={idx} className="badge badge-purple" style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}>
                    + {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ACTIONABLE AI OPTIMIZATION ADVICE */}
          <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '20px' }}>
            <h4 style={{ fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={20} color="var(--primary)" /> Actionable AI Optimization Checklist
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {(analysisResult.actionable_advice || []).map((tip, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-card)'
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {idx + 1}
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* MATCHED VERIFIED ALUMNI MENTORS FOR 1-ON-1 GUIDANCE */}
          {(analysisResult.matched_mentors || []).length > 0 && (
            <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Award size={20} color="var(--primary)" /> Recommended Alumni Mentors Matched for Your Target Role
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                    Get 1-on-1 resume reviews and career guidance from alumni working in target engineering domains.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {analysisResult.matched_mentors.map((mentor) => (
                  <div
                    key={mentor.id}
                    style={{
                      padding: '1.25rem',
                      borderRadius: '14px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-card)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <h5 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                            {mentor.name}
                          </h5>
                          <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, margin: '0.2rem 0 0 0' }}>
                            {mentor.profile?.designation} at {mentor.profile?.company}
                          </p>
                        </div>
                        <span className="badge badge-emerald">Verified Alumni</span>
                      </div>

                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                        {mentor.profile?.bio || 'Experienced software mentor passionate about guiding student careers.'}
                      </p>
                    </div>

                    {onRequestMentorship && (
                      <button
                        onClick={() => onRequestMentorship(mentor)}
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', marginTop: '0.5rem' }}
                      >
                        <UserCheck size={14} /> Request 1-on-1 Resume Mentorship
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTION FOOTER */}
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button onClick={handleReset} className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}>
              <RefreshCw size={16} /> Analyze Another Resume Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
