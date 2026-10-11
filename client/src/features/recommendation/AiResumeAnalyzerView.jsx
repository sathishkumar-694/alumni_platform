import React, { useState, useEffect } from 'react';
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
  Target,
  Info,
  Cloud,
  Clock,
  ExternalLink,
  ShieldCheck,
  History,
  TrendingUp,
  BarChart3,
  Trash2,
  Calendar,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export const AiResumeAnalyzerView = ({ onRequestMentorship }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // Navigation tab: 'analyzer' | 'history'
  const [activeTab, setActiveTab] = useState('analyzer');

  // Form inputs
  const [targetMode, setTargetMode] = useState('role'); // 'role' | 'jd'
  const [targetRole, setTargetRole] = useState('Software Development Engineer');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentBase64, setDocumentBase64] = useState('');
  const [documentMimeType, setDocumentMimeType] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // History state
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch past analysis history
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await apiClient('/recommendation/history');
      setHistoryList(res.data || []);
    } catch (err) {
      console.warn('Could not fetch analysis history:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  // File Upload & Base64 Reader
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileNameLower = file.name.toLowerCase();
    const isPdf = fileNameLower.endsWith('.pdf');
    const isWord = fileNameLower.endsWith('.doc') || fileNameLower.endsWith('.docx');
    const isTxt = fileNameLower.endsWith('.txt');

    if (!isPdf && !isWord && !isTxt) {
      showNotification('Please upload a PDF (.pdf), Word (.doc, .docx), or Text (.txt) file.', 'error');
      return;
    }

    setSelectedFile(file);

    // Read full file as Data URL to send clean base64 directly to server AI
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result || '';
      setDocumentBase64(dataUrl);
      setDocumentMimeType(file.type || (isPdf ? 'application/pdf' : 'application/octet-stream'));

      if (isTxt) {
        try {
          const textReader = new FileReader();
          textReader.onload = (txtEvent) => {
            const content = txtEvent.target?.result || '';
            setResumeText(content);
          };
          textReader.readAsText(file);
        } catch (err) {
          // Ignore
        }
      } else {
        if (!resumeText.trim()) {
          setResumeText(`[Attached Document: ${file.name}]\n(You can also paste or append specific project metrics, skills, or achievements below)`);
        }
      }

      showNotification(`Attached '${file.name}' (${(file.size / 1024).toFixed(1)} KB). Ready for analysis.`, 'success');
    };

    reader.readAsDataURL(file);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();

    const textToSubmit = resumeText.trim();
    if (!selectedFile && !textToSubmit) {
      showNotification('Please upload your Resume file or paste your resume content below.', 'error');
      return;
    }

    if (targetMode === 'role' && !targetRole.trim()) {
      showNotification('Please enter your Target Job Role / Title.', 'error');
      return;
    }

    if (targetMode === 'jd' && !jobDescription.trim()) {
      showNotification('Please paste the complete Job Description (JD) text.', 'error');
      return;
    }

    setLoading(true);

    try {
      const res = await apiClient('/recommendation/analyze-resume', {
        method: 'POST',
        body: JSON.stringify({
          resumeText: textToSubmit || `Resume File: ${selectedFile?.name}`,
          documentBase64,
          documentMimeType,
          fileName: selectedFile?.name || '',
          targetRole: targetMode === 'role' ? targetRole : '',
          jobDescription: targetMode === 'jd' ? jobDescription : '',
          portfolioUrl,
          aiProvider: 'auto'
        })
      });

      setAnalysisResult(res.data);
      showNotification('AI ATS Resume & Industry Fit Analysis completed and saved to history!', 'success');
      // Refresh history list so new analysis immediately appears in dashboard
      fetchHistory();
    } catch (err) {
      showNotification(err.message || 'Failed to analyze resume', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setSelectedFile(null);
    setDocumentBase64('');
    setDocumentMimeType('');
    setResumeText('');
    setJobDescription('');
    setPortfolioUrl('');
  };

  const handleLoadHistoryItem = (item) => {
    // Normalise structure so it fits analysisResult format
    setAnalysisResult({
      ...item,
      sde_fit_score: item.ats_score,
      recommended_skills_to_learn: item.missing_skills || [],
      resume_backup: item.backup_url ? {
        url: item.backup_url,
        provider: item.backup_provider || 'Cloud Storage'
      } : null
    });
    setActiveTab('analyzer');
    showNotification(`Loaded previous ATS evaluation for '${item.target_role}'`, 'info');
  };

  const handleDeleteHistoryItem = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this resume evaluation from history?')) return;

    try {
      await apiClient(`/recommendation/history/${id}`, { method: 'DELETE' });
      setHistoryList(prev => prev.filter(item => item.id !== id));
      showNotification('Evaluation record deleted from history.', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to delete record', 'error');
    }
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return { label: 'EXCELLENT ATS MATCH', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
    if (score >= 60) return { label: 'GOOD MATCH - NEEDS FEW KEYWORDS', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
    return { label: 'NEEDS ATS OPTIMIZATION', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
  };

  // KPI calculations for History
  const historyCount = historyList.length;
  const highestScore = historyCount > 0 ? Math.max(...historyList.map(h => Number(h.ats_score) || 0)) : 0;
  const avgScore = historyCount > 0 ? Math.round(historyList.reduce((acc, cur) => acc + (Number(cur.ats_score) || 0), 0) / historyCount) : 0;
  const latestScore = historyCount > 0 ? (Number(historyList[0]?.ats_score) || 0) : 0;
  const previousScore = historyCount > 1 ? (Number(historyList[1]?.ats_score) || 0) : null;
  const scoreDiff = previousScore !== null ? latestScore - previousScore : null;

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
          marginBottom: '1.5rem',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.25)', color: '#d8b4fe', borderColor: '#a855f7' }}>
              <Zap size={14} /> Cloud AI Engine
            </span>
            <span className="badge badge-emerald">Google Gemini & Groq Powered</span>
            <span className="badge badge-cyan">Cloudinary Backup Enabled</span>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.08)', padding: '0.25rem', borderRadius: '12px' }}>
            <button
              onClick={() => setActiveTab('analyzer')}
              className={`btn btn-sm ${activeTab === 'analyzer' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.825rem', padding: '0.35rem 0.85rem' }}
            >
              <Target size={14} /> Resume ATS Analyzer
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                fetchHistory();
              }}
              className={`btn btn-sm ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.825rem', padding: '0.35rem 0.85rem' }}
            >
              <History size={14} /> Evaluation History ({historyCount})
            </button>
          </div>
        </div>

        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', margin: '0.25rem 0 0.5rem' }}>
          🤖 AI Resume & Industry Fit Analyzer
        </h2>
        <p style={{ fontSize: '0.95rem', color: '#cbd5e1', maxWidth: '780px', lineHeight: 1.5, margin: 0 }}>
          Evaluate resume compatibility against target engineering roles or job descriptions, detect missing industry keywords, automatically back up files to Cloudinary, and match with verified alumni mentors ranked by Seniority Levels & Achievements.
        </p>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: EVALUATION HISTORY & PROGRESS TRACKER DASHBOARD    */}
      {/* ========================================================= */}
      {activeTab === 'history' ? (
        <div>
          {/* KPI Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
            
            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Total Evaluated</span>
                <BarChart3 size={18} color="var(--primary)" />
              </div>
              <p style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                {historyCount}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', margin: '0.25rem 0 0 0' }}>
                Stored in MySQL Database
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Highest ATS Score</span>
                <Award size={18} color="#10b981" />
              </div>
              <p style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981', margin: 0 }}>
                {highestScore}%
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', margin: '0.25rem 0 0 0' }}>
                Personal Best Evaluation
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Average ATS Score</span>
                <TrendingUp size={18} color="var(--accent-purple)" />
              </div>
              <p style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-purple)', margin: 0 }}>
                {avgScore}%
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', margin: '0.25rem 0 0 0' }}>
                Across all evaluated resumes
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Score Progress</span>
                <Zap size={18} color="var(--accent-amber)" />
              </div>
              <p style={{ fontSize: '1.5rem', fontWeight: 900, color: scoreDiff > 0 ? '#10b981' : scoreDiff < 0 ? '#ef4444' : 'var(--text-main)', margin: 0 }}>
                {scoreDiff !== null ? `${scoreDiff > 0 ? '+' : ''}${scoreDiff}% Trend` : 'Initial Baseline'}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', margin: '0.25rem 0 0 0' }}>
                {scoreDiff > 0 ? '🎉 Improving ATS Score' : scoreDiff === 0 ? 'Consistent Keyword Match' : 'Recent Optimization Run'}
              </p>
            </div>
          </div>

          {/* History Records List */}
          <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <History size={20} color="var(--primary)" /> Evaluation History & Progress Tracker
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                  Click any past analysis to reload the complete evaluation report, missing keywords, and matched mentors.
                </p>
              </div>

              <button
                onClick={fetchHistory}
                disabled={loadingHistory}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <RefreshCw size={13} className={loadingHistory ? 'spin-animation' : ''} /> Refresh
              </button>
            </div>

            {loadingHistory ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Loader2 size={28} className="spin-animation" style={{ margin: '0 auto 0.75rem', color: 'var(--primary)' }} />
                Loading your resume evaluation history...
              </div>
            ) : historyList.length === 0 ? (
              <div style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
                <FileText size={42} color="var(--text-subtle)" style={{ margin: '0 auto 1rem', opacity: 0.6 }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>No Evaluated Resumes Yet</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '0.5rem auto 1.25rem' }}>
                  Upload your resume in the analyzer to evaluate ATS keyword match and track your improvement history here.
                </p>
                <button
                  onClick={() => setActiveTab('analyzer')}
                  className="btn btn-primary btn-sm"
                  style={{ padding: '0.55rem 1.25rem' }}
                >
                  <Target size={14} /> Analyze Your First Resume Now
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {historyList.map((item, index) => {
                  const score = Number(item.ats_score) || 0;
                  const badge = getScoreBadge(score);
                  const formattedDate = item.created_at ? new Date(item.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  }) : 'Recent';

                  return (
                    <div
                      key={item.id || index}
                      style={{
                        padding: '1.25rem 1.5rem',
                        borderRadius: '16px',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-card)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                      }}
                    >
                      {/* Top Row: Role, Date, Engine & Score Badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                            <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
                              {item.target_role}
                            </span>
                            <span className={`badge ${item.is_online_model ? 'badge-emerald' : 'badge-purple'}`} style={{ fontSize: '0.72rem' }}>
                              {item.is_online_model ? '✨ Cloud AI' : '⚙️ Algorithmic'}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Calendar size={13} /> {formattedDate}
                            </span>
                          </div>

                          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.2rem 0' }}>
                            {item.file_name || 'Resume Document'}
                          </h4>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                            Evaluated using <strong>{item.ai_provider || 'CampusBridge AI'}</strong>
                          </p>
                        </div>

                        {/* ATS Score Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: badge.color, lineHeight: 1 }}>
                              {score}%
                            </span>
                            <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: badge.color, textTransform: 'uppercase' }}>
                              {badge.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle Row: Sub-Scores Bar */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem' }}>
                        <div style={{ background: 'var(--bg-card)', padding: '0.65rem', borderRadius: '10px', border: '1px solid var(--border-card)' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Keywords</span>
                          <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)', margin: '0.1rem 0 0 0' }}>{item.keyword_match_score || 0}%</p>
                        </div>

                        <div style={{ background: 'var(--bg-card)', padding: '0.65rem', borderRadius: '10px', border: '1px solid var(--border-card)' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Impact</span>
                          <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-purple)', margin: '0.1rem 0 0 0' }}>{item.impact_score || 0}%</p>
                        </div>

                        <div style={{ background: 'var(--bg-card)', padding: '0.65rem', borderRadius: '10px', border: '1px solid var(--border-card)' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Format</span>
                          <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-emerald)', margin: '0.1rem 0 0 0' }}>{item.format_score || 0}%</p>
                        </div>

                        <div style={{ background: 'var(--bg-card)', padding: '0.65rem', borderRadius: '10px', border: '1px solid var(--border-card)' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Tech Depth</span>
                          <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-amber)', margin: '0.1rem 0 0 0' }}>{item.technical_depth_score || 0}%</p>
                        </div>
                      </div>

                      {/* Bottom Row: Actions & Backup Link */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-card)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {item.backup_url && (
                            <a
                              href={item.backup_url.startsWith('http') ? item.backup_url : `http://localhost:5001${item.backup_url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <Cloud size={13} color="var(--primary)" /> View Backup in Cloudinary
                            </a>
                          )}
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {(item.detected_skills || []).length} skills found • {(item.missing_skills || []).length} missing keywords
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleLoadHistoryItem(item)}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <Zap size={13} /> View Full Report & Mentors
                          </button>
                          <button
                            onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', color: '#ef4444' }}
                            title="Delete this history record"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* ========================================================= */}
      {/* TAB 2: RESUME ATS ANALYZER INPUT FORM                     */}
      {/* ========================================================= */}
      {activeTab === 'analyzer' && !analysisResult && (
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '20px' }}>
          <form onSubmit={handleAnalyze}>
            
            {/* Step 1: Target Role or JD Input */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <Target size={16} color="var(--primary)" /> 1. Target Evaluation Mode:
              </label>

              {/* Mode Toggle Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setTargetMode('role')}
                  className={`btn ${targetMode === 'role' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
                >
                  <Target size={14} /> Type Target Job Role / Title
                </button>
                <button
                  type="button"
                  onClick={() => setTargetMode('jd')}
                  className={`btn ${targetMode === 'jd' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
                >
                  <FileText size={14} /> Paste Full Job Description (JD)
                </button>
              </div>

              {targetMode === 'role' ? (
                <div>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Type target job role (e.g. Full Stack Developer, Data Analyst, Cloud Architect, Mechanical Engineer)"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    required
                    style={{ height: '44px', fontSize: '0.9rem' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', margin: '0.35rem 0 0 0' }}>
                    Type any custom target job title or role you are aiming for.
                  </p>
                </div>
              ) : (
                <div>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    placeholder="Paste full Job Description (JD) text here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    required
                    style={{ fontSize: '0.85rem', lineHeight: '1.5' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', margin: '0.35rem 0 0 0' }}>
                    Paste the entire job posting or JD to match your resume directly against specific JD keywords.
                  </p>
                </div>
              )}
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
                      {(selectedFile.size / 1024).toFixed(1)} KB • Document captured • Auto-backing up to Cloudinary
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
                rows={5}
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
                  <Loader2 size={18} className="spin-animation" /> Evaluating Resume with Cloud AI Engine...
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Run AI ATS Evaluation & Auto-Backup
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2 (RESULTS VIEW): DETAILED EVALUATION REPORT          */}
      {/* ========================================================= */}
      {activeTab === 'analyzer' && analysisResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          {/* TOP SUMMARY COMPOSITE ATS SCORE CARD */}
          {(() => {
            const badge = getScoreBadge(analysisResult.ats_score);
            return (
              <div
                className="glass-panel"
                style={{
                  padding: '2rem',
                  borderRadius: '20px',
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: '2rem',
                  alignItems: 'center'
                }}
              >
                {/* Score Gauge Circle */}
                <div style={{ textAlign: 'center' }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-purple">
                      Target Role Evaluation
                    </span>
                    <span className={`badge ${analysisResult.is_online_model ? 'badge-emerald' : 'badge-purple'}`}>
                      {analysisResult.is_online_model ? '✨ Verified Live Cloud AI' : '⚙️ Algorithmic Engine'}
                    </span>
                    {analysisResult.ai_inference_time_ms && (
                      <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', borderColor: 'var(--primary)' }}>
                        <Clock size={12} /> {((analysisResult.ai_inference_time_ms) / 1000).toFixed(2)}s response
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    {analysisResult.target_role}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                    Evaluated by <strong>{analysisResult.ai_provider}</strong>. Keywords, formatting, technical depth, and impact verbiage were compared against standard engineering hiring benchmarks.
                  </p>

                  {/* Cloudinary Backup Notice */}
                  {analysisResult.resume_backup && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        padding: '0.65rem 0.85rem',
                        background: 'rgba(99, 102, 241, 0.08)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        borderRadius: '12px',
                        marginBottom: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Cloud size={15} color="var(--primary)" />
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-main)', fontWeight: 600 }}>
                          Cloud Backup: {analysisResult.resume_backup.provider}
                        </span>
                      </div>
                      {analysisResult.resume_backup.url && (
                        <a
                          href={analysisResult.resume_backup.url.startsWith('http') ? analysisResult.resume_backup.url : `http://localhost:5001${analysisResult.resume_backup.url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <ExternalLink size={12} /> View Backed-Up File in Cloudinary
                        </a>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button onClick={handleReset} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <RefreshCw size={14} /> Analyze Another Resume
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('history');
                        fetchHistory();
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <History size={14} /> Open History Dashboard
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
              <Sparkles size={20} color="var(--primary)" /> Actionable ATS Optimization Checklist
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

          {/* OPTION A: MATCHED ALUMNI MENTORS BY LEVELS & ACHIEVEMENTS */}
          {(analysisResult.matched_mentors || []).length > 0 && (
            <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span className="badge badge-purple">
                      Option A AI Matching
                    </span>
                    <span className="badge badge-emerald">
                      Seniority Levels 1-5 & Achievements Ranked
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <Award size={20} color="var(--primary)" /> Top Alumni Mentors Matched for Your Skill Gaps
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                    Ranked by Seniority Level (L1-L5), Company Prestige, and specific domain ability to coach you on missing skills.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
                {analysisResult.matched_mentors.map((mentor) => {
                  const levelInfo = mentor.level_info || { badge: '⭐ Verified Mentor', level: 3, level_name: 'Specialist' };
                  const companyTier = mentor.company_tier || { tier_badge: '🏢 Tech Enterprise' };

                  return (
                    <div
                      key={mentor.id}
                      style={{
                        padding: '1.4rem',
                        borderRadius: '16px',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-card)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem'
                      }}
                    >
                      <div>
                        {/* Mentor Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                              <span
                                className="badge"
                                style={{
                                  background: levelInfo.level >= 4 ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                  color: levelInfo.level >= 4 ? '#8b5cf6' : '#3b82f6',
                                  borderColor: levelInfo.level >= 4 ? '#8b5cf6' : '#3b82f6',
                                  fontWeight: 800
                                }}
                              >
                                {levelInfo.badge}
                              </span>
                              <span className="badge badge-cyan" style={{ fontWeight: 700 }}>
                                {companyTier.tier_badge}
                              </span>
                            </div>

                            <h5 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.2rem 0' }}>
                              {mentor.name}
                            </h5>
                            <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, margin: 0 }}>
                              {mentor.profile?.designation} at {mentor.profile?.company}
                            </p>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span className="badge badge-emerald" style={{ fontWeight: 800, fontSize: '0.8rem' }}>
                              {mentor.ai_match_score || mentor.match_score || 85}% AI Match
                            </span>
                          </div>
                        </div>

                        {/* Achievements Accolades Badges */}
                        {mentor.achievements && mentor.achievements.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.85rem' }}>
                            {mentor.achievements.slice(0, 3).map((ach) => (
                              <span
                                key={ach.id}
                                className={`badge badge-${ach.variant || 'purple'}`}
                                style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                              >
                                {ach.label}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* AI Match Reason Formulation */}
                        {mentor.ai_match_reason && (
                          <div
                            style={{
                              background: 'rgba(99, 102, 241, 0.07)',
                              border: '1px solid rgba(99, 102, 241, 0.2)',
                              padding: '0.75rem',
                              borderRadius: '10px',
                              marginBottom: '0.85rem'
                            }}
                          >
                            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Sparkles size={13} /> Why Matched for Your Resume:
                            </p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.45, margin: 0 }}>
                              {mentor.ai_match_reason}
                            </p>
                          </div>
                        )}

                        {/* Suggested 1-on-1 Session Topics */}
                        {mentor.suggested_session_topics && mentor.suggested_session_topics.length > 0 && (
                          <div style={{ marginBottom: '0.75rem' }}>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 0.35rem 0' }}>
                              Suggested 1-on-1 Session Topics:
                            </p>
                            <ul style={{ paddingLeft: '1.1rem', margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                              {mentor.suggested_session_topics.map((topic, tIdx) => (
                                <li key={tIdx} style={{ marginBottom: '0.2rem' }}>{topic}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Mentorship Request Action Button */}
                      {onRequestMentorship && (
                        <button
                          onClick={() => onRequestMentorship(mentor)}
                          className="btn btn-primary btn-sm"
                          style={{ width: '100%', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                        >
                          <UserCheck size={14} /> Request 1-on-1 Resume Mentorship
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ACTION FOOTER */}
          <div style={{ textAlign: 'center', marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            <button onClick={handleReset} className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}>
              <RefreshCw size={16} /> Analyze Another Resume Document
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                fetchHistory();
              }}
              className="btn btn-secondary"
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
            >
              <History size={16} /> View Evaluation History
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
