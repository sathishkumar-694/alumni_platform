import React, { useState } from 'react';
import { apiClient } from '../../shared/services/api';
import { useAuth } from '../../shared/context/AuthContext';
import { useNotification } from '../../shared/context/NotificationContext';
import { X, Sparkles, FileText, CheckCircle2, AlertTriangle, ArrowRight, UserPlus, Award, Link, Zap, Upload, File } from 'lucide-react';

export const ResumeAnalyzerModal = ({ isOpen, onClose, onRequestMentorship }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('Software Development Engineer (SDE)');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileBase64, setFileBase64] = useState('');
  const [fileMimeType, setFileMimeType] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setFileMimeType(file.type || 'application/pdf');

    // 1. Read Base64 binary for Gemini inline_data
    const base64Reader = new FileReader();
    base64Reader.onload = (event) => {
      const dataUrl = event.target?.result || '';
      if (typeof dataUrl === 'string') {
        const base64Data = dataUrl.split(',')[1] || '';
        setFileBase64(base64Data);
      }
    };
    base64Reader.readAsDataURL(file);

    // 2. Extract plain text content from uploaded file for prompt context
    const textReader = new FileReader();
    textReader.onload = (event) => {
      const text = event.target?.result || '';
      if (typeof text === 'string' && text.trim()) {
        const cleanText = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').replace(/\s+/g, ' ');
        if (cleanText.length > 20) {
          setResumeText(prev => prev ? `${prev}\n\n[Uploaded Resume Content (${file.name})]:\n${cleanText.slice(0, 3000)}` : `[Uploaded Resume Content (${file.name})]:\n${cleanText.slice(0, 3000)}`);
          showNotification(`Extracted resume text from '${file.name}' for AI evaluation!`, 'success');
        } else {
          showNotification(`Attached resume file '${file.name}'!`, 'success');
        }
      }
    };
    textReader.readAsText(file);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!resumeText.trim() && !fileBase64) {
      showNotification('Please paste resume text or upload a PDF/TXT resume document', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient('/recommendation/analyze-resume', {
        method: 'POST',
        body: JSON.stringify({
          resumeText,
          targetRole,
          portfolioUrl,
          fileBase64,
          fileMimeType
        })
      });
      setAnalysisResult(res.data);
      showNotification('Resume document analyzed with Google Gemini Multimodal AI!', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justify: 'center',
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(6px)',
        padding: '1.5rem'
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: '20px',
          boxShadow: 'var(--shadow-lg)',
          padding: '2rem'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <span className="badge badge-purple" style={{ marginBottom: '0.35rem' }}>
              <Zap size={12} /> Google Gemini Multimodal AI
            </span>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--text-main)', fontWeight: 800 }}>
              AI Resume & SDE Industry Fit Analyzer
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Upload your Resume PDF / Document directly to Google Gemini AI for evaluation.
            </p>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Input Form vs Result View */}
        {!analysisResult ? (
          <form onSubmit={handleAnalyze}>
            
            {/* File Upload Drop Zone */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Upload Resume Document (PDF / DOCX / TXT / Image)</label>
              <div
                style={{
                  border: '2px dashed var(--border-card)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  background: 'var(--bg-subtle)',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <input
                  type="file"
                  accept=".pdf,.txt,.doc,.docx,image/*"
                  onChange={handleFileUpload}
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <Upload size={28} color="var(--primary)" />
                  {selectedFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                      <File size={16} /> Attached: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        Click or Drag & Drop Resume PDF / Document File Here
                      </p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                        Direct Base64 upload + Text Extraction to Google Gemini Multimodal AI Engine
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Target Engineering Role</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Full-Stack SDE, Backend Architect, DevOps Engineer, Mechanical Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Extracted Resume Text / Additional Notes</label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Auto-extracted text from uploaded file or paste extra skills here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Portfolio / GitHub Profile URL (Optional)</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://github.com/username or https://portfolio.dev"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Sparkles size={16} /> {loading ? 'Analyzing with Google Gemini AI...' : 'Analyze Resume Document'}
              </button>
            </div>
          </form>
        ) : (
          <div>
            {/* AI Fit Score Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1e1b4b 0%, #311b92 100%)',
                padding: '1.5rem',
                borderRadius: '14px',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                marginBottom: '1.5rem',
                border: '1px solid #312e81'
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 700 }}>
                  Target Role: {analysisResult.target_role} • ✨ {analysisResult.ai_provider || 'Google Gemini AI'}
                </span>
                <h4 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.2rem' }}>
                  Industry Readiness Score
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                  {analysisResult.sde_fit_score >= 80 ? '🚀 High Readiness! Excellent skill alignment.' : '💡 Good foundation! Work on missing skills below.'}
                </p>
              </div>

              <div style={{ textAlign: 'center', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(8px)', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
                <p style={{ fontSize: '2.5rem', fontWeight: 900, color: '#38bdf8', lineHeight: 1 }}>
                  {analysisResult.sde_fit_score}%
                </p>
                <span style={{ fontSize: '0.7rem', color: '#93c5fd', textTransform: 'uppercase' }}>Fit Rating</span>
              </div>
            </div>

            {/* Skill Breakdown Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
              
              {/* Detected Strengths */}
              <div style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={16} /> Verified Skills Found ({analysisResult.detected_skills.length})
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {analysisResult.detected_skills.map(skill => (
                    <span key={skill} className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Skills */}
              <div style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertTriangle size={16} /> Recommended Skill Gaps ({analysisResult.recommended_skills_to_learn.length})
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {analysisResult.recommended_skills_to_learn.map(skill => (
                    <span key={skill} className="badge badge-amber" style={{ fontSize: '0.75rem' }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Matched Alumni Mentors to Bridge Gaps */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Award size={18} color="var(--primary)" /> Mentors Specially Matched to Help You Master Missing Skill Gaps
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {analysisResult.matched_mentors.map(m => (
                  <div
                    key={m.id}
                    style={{
                      background: 'var(--bg-subtle)',
                      padding: '1rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-card)',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between'
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{m.name}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {m.profile?.designation} at {m.profile?.company} ({m.profile?.experience_years} Yrs Exp)
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onRequestMentorship?.(m);
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      <UserPlus size={14} /> Request Mentorship
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setAnalysisResult(null)} className="btn btn-secondary">
                Analyze Another Resume Document
              </button>
              <button onClick={onClose} className="btn btn-primary">
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
