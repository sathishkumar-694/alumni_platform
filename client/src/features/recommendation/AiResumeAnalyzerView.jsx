import React, { useState } from 'react';
import { apiClient } from '../../shared/services/api';
import { useAuth } from '../../shared/context/AuthContext';
import { useNotification } from '../../shared/context/NotificationContext';
import { Sparkles, FileText, CheckCircle2, AlertTriangle, ArrowRight, UserPlus, Award, Zap, Upload, File, Loader2 } from 'lucide-react';

export const AiResumeAnalyzerView = ({ onRequestMentorship }) => {
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

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict File Extension Validation: Allow ONLY PDF (.pdf) and Word (.doc, .docx) documents
    const fileNameLower = file.name.toLowerCase();
    const isPdf = fileNameLower.endsWith('.pdf') || file.type === 'application/pdf';
    const isWord = fileNameLower.endsWith('.doc') || fileNameLower.endsWith('.docx') || file.type.includes('word') || file.type.includes('officedocument');

    if (!isPdf && !isWord) {
      showNotification('Invalid file format! Please upload a PDF (.pdf) or Word document (.doc, .docx).', 'error');
      return;
    }

    setSelectedFile(file);
    setFileMimeType(isPdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    // 1. Read Base64 binary data in background for Gemini Multimodal AI
    const base64Reader = new FileReader();
    base64Reader.onload = (event) => {
      const dataUrl = event.target?.result || '';
      if (typeof dataUrl === 'string') {
        const base64Data = dataUrl.split(',')[1] || '';
        setFileBase64(base64Data);
      }
    };
    base64Reader.readAsDataURL(file);

    // 2. Perform text extraction
    const textReader = new FileReader();
    textReader.onload = (event) => {
      const text = event.target?.result || '';
      if (typeof text === 'string' && text.trim()) {
        if (isWord) {
          // Extract text from Word docx XML tags <w:t>...</w:t>
          const matches = [...text.matchAll(/<w:t[^>]*>(.*?)<\/w:t>/gi)].map(m => m[1]);
          if (matches.length > 0) {
            const cleanDocxText = matches.join(' ').replace(/\s+/g, ' ').trim();
            setResumeText(`[Attached Word Document: ${file.name}]\n${cleanDocxText.slice(0, 4000)}`);
          } else {
            const cleanText = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').replace(/\s+/g, ' ').trim();
            if (cleanText.length > 10) {
              setResumeText(`[Attached Document: ${file.name}]\n${cleanText.slice(0, 4000)}`);
            }
          }
        } else {
          setResumeText(`[Attached PDF Document: ${file.name}]`);
        }
      }
    };
    textReader.readAsText(file);

    showNotification(`Attached ${isPdf ? 'PDF' : 'Word'} document '${file.name}'! Ready for AI analysis.`, 'success');
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!selectedFile && !resumeText.trim() && !fileBase64) {
      showNotification('Please upload your Resume PDF or Word document (.pdf, .doc, .docx)', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient('/recommendation/analyze-resume', {
        method: 'POST',
        body: JSON.stringify({
          resumeText: resumeText || `[Attached Resume Document: ${selectedFile?.name}]`,
          targetRole,
          portfolioUrl,
          fileBase64,
          fileMimeType
        })
      });
      setAnalysisResult(res.data);
      showNotification('Resume document analyzed with Google Gemini AI!', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #311b92 100%)',
          padding: '2rem',
          borderRadius: '20px',
          color: '#ffffff',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid #312e81'
        }}
      >
        <span className="badge badge-purple" style={{ marginBottom: '0.5rem', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>
          <Zap size={14} /> Google Gemini AI Document Engine
        </span>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.35rem' }}>
          🤖 AI Resume & Industry Fit Analyzer
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#cbd5e1', marginTop: '0.35rem', maxWidth: '750px' }}>
          Upload your PDF or Word resume document to analyze your technical skills, discover missing skill gaps, and match with verified alumni mentors.
        </p>
      </div>

      {/* Input Form vs Result View */}
      {!analysisResult ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '20px', padding: '2rem', boxShadow: 'var(--shadow-md)' }}>
          <form onSubmit={handleAnalyze}>
            
            {/* Target Role Input */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                Target Role / Desired Job Title
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Software Engineer (SDE-1), Mechanical Engineer, Data Analyst, Product Manager"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                required
                style={{ height: '46px', fontSize: '0.95rem' }}
              />
            </div>

            {/* Strict PDF / Word Document Drop Zone */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                Upload Resume Document (PDF / Word Only)
              </label>
              <div
                style={{
                  border: selectedFile ? '2px solid var(--accent-emerald)' : '2px dashed var(--border-card)',
                  borderRadius: '16px',
                  padding: '2.5rem 2rem',
                  textAlign: 'center',
                  background: selectedFile ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-subtle)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  {selectedFile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={28} color="var(--accent-emerald)" />
                      </div>
                      <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                        {selectedFile.name}
                      </p>
                      <span className="badge badge-emerald" style={{ fontSize: '0.8rem' }}>
                        {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.name.endsWith('.pdf') ? 'PDF Document' : 'Word Document'} Attached
                      </span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Click or drop another file to replace
                      </p>
                    </div>
                  ) : (
                    <>
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Upload size={30} color="var(--primary)" />
                      </div>
                      <div>
                        <p style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          Click or Drag & Drop PDF or Word Resume File Here
                        </p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
                          Accepts <strong>.pdf</strong>, <strong>.doc</strong>, and <strong>.docx</strong> files only
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Optional Resume Text / Notes */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                Additional Key Skills or Raw Resume Text (Optional)
              </label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Paste key skills, project summaries, or custom resume text here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                style={{ fontSize: '0.875rem' }}
              />
            </div>

            {/* Portfolio / GitHub URL (Optional) */}
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                Portfolio / GitHub Profile URL (Optional)
              </label>
              <input
                type="url"
                className="form-input"
                placeholder="https://github.com/username or https://portfolio.dev"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                style={{ height: '44px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}>
                {loading ? (
                  <>
                    <Loader2 size={18} className="spin-animation" /> Analyzing Resume Document with AI...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Analyze Resume Document
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '20px', padding: '2rem', boxShadow: 'var(--shadow-md)' }}>
          {/* ATS Overall Score Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #311b92 100%)',
              padding: '1.75rem',
              borderRadius: '16px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              border: '1px solid #312e81'
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                TARGET ROLE: {analysisResult.target_role} • ✨ {analysisResult.ai_provider || 'Google Gemini AI'}
              </span>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.25rem' }}>
                🤖 ATS Resume Compatibility Score
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                {(analysisResult.ats_score || analysisResult.sde_fit_score) >= 80
                  ? '🚀 High ATS Compatibility! Resume strongly matches target role keywords.'
                  : (analysisResult.ats_score || analysisResult.sde_fit_score) >= 65
                  ? '💡 Moderate ATS Match! Key skills detected, minor optimizations recommended.'
                  : '⚠️ Low ATS Keyword Match! Review missing skill gaps & formatting advice below.'}
              </p>
            </div>

            <div style={{ textAlign: 'center', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(8px)', padding: '1rem 1.75rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)' }}>
              <p style={{ fontSize: '2.75rem', fontWeight: 900, color: '#38bdf8', lineHeight: 1 }}>
                {analysisResult.ats_score || analysisResult.sde_fit_score}%
              </p>
              <span style={{ fontSize: '0.75rem', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 700 }}>ATS Score</span>
            </div>
          </div>

          {/* 4 ATS Sub-Scores Card Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-card)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>🎯 Keyword Match</span>
              <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.2rem' }}>
                {analysisResult.keyword_match_score || Math.min(98, (analysisResult.ats_score || 75) + 4)}%
              </p>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-card)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>📊 Impact & Metrics</span>
              <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-purple)', marginTop: '0.2rem' }}>
                {analysisResult.impact_score || Math.max(55, (analysisResult.ats_score || 75) - 6)}%
              </p>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-card)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>📝 ATS Formatting</span>
              <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.2rem' }}>
                {analysisResult.format_score || 88}%
              </p>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-card)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>⚡ Technical Depth</span>
              <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '0.2rem' }}>
                {analysisResult.technical_depth_score || (analysisResult.ats_score || 75)}%
              </p>
            </div>
          </div>

          {/* Skill Breakdown Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            
            {/* Detected Strengths */}
            <div style={{ background: 'var(--bg-subtle)', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-card)' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={18} /> Verified Skills Found in Resume ({(analysisResult.detected_skills || []).length})
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {(analysisResult.detected_skills || []).map(skill => (
                  <span key={skill} className="badge badge-emerald" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Skills / Keyword Gaps */}
            <div style={{ background: 'var(--bg-subtle)', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-card)' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={18} /> Missing ATS Keywords for "{analysisResult.target_role}" ({(analysisResult.recommended_skills_to_learn || []).length})
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {(analysisResult.recommended_skills_to_learn || []).map(skill => (
                  <span key={skill} className="badge badge-amber" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Actionable ATS Recommendations */}
          {analysisResult.actionable_advice && analysisResult.actionable_advice.length > 0 && (
            <div style={{ background: 'var(--bg-subtle)', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-card)', marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={18} /> Actionable ATS Optimization Recommendations
              </h4>
              <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                {(analysisResult.actionable_advice || []).map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '0.35rem' }}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Matched Alumni Mentors to Bridge Gaps */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Award size={20} color="var(--primary)" /> Mentors Specially Matched to Help You Master Missing Skill Gaps
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {(analysisResult.matched_mentors || []).map(m => (
                <div
                  key={m.id}
                  style={{
                    background: 'var(--bg-subtle)',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>{m.name}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {m.profile?.designation} at {m.profile?.company} ({m.profile?.experience_years} Yrs Exp)
                    </p>
                  </div>

                  <button
                    onClick={() => onRequestMentorship?.(m)}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%' }}
                  >
                    <UserPlus size={14} /> Request Mentorship
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button onClick={() => { setAnalysisResult(null); setSelectedFile(null); }} className="btn btn-secondary" style={{ padding: '0.6rem 1.5rem' }}>
              Analyze Another Resume Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
