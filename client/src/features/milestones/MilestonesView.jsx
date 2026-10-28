import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { apiClient, getAssetUrl } from '../../shared/services/api';
import {
  CheckCircle2, Upload, BookOpen, AlertCircle, Clock, Trophy,
  ChevronDown, ChevronUp, RefreshCw, FileText, X, Loader2
} from 'lucide-react';

/* ─── Status badge helper ─── */
const StatusBadge = ({ status }) => {
  const map = {
    PENDING: { label: 'Pending', color: 'var(--accent-amber)', bg: 'rgba(251,191,36,0.12)' },
    IN_PROGRESS: { label: 'In Progress', color: 'var(--primary)', bg: 'rgba(99,102,241,0.12)' },
    COMPLETED: { label: 'Completed ✓', color: 'var(--accent-emerald)', bg: 'rgba(52,211,153,0.12)' },
    VERIFIED: { label: 'Verified ✅', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  };
  const s = map[status] || map.PENDING;
  return (
    <span style={{
      fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.65rem',
      borderRadius: '20px', color: s.color, background: s.bg,
      border: `1px solid ${s.color}33`
    }}>
      {s.label}
    </span>
  );
};

/* ─── Single milestone card (student view) ─── */
const StudentMilestoneCard = ({ milestone, onMarkComplete }) => {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isDone = milestone.status === 'COMPLETED' || milestone.status === 'VERIFIED';
  const isPending = milestone.status === 'PENDING';

  const handleMark = async () => {
    setLoading(true);
    await onMarkComplete(milestone.id);
    setLoading(false);
  };

  return (
    <div style={{
      background: isDone ? 'rgba(52,211,153,0.05)' : 'var(--bg-card)',
      border: `1px solid ${isDone ? 'rgba(52,211,153,0.3)' : 'var(--border-card)'}`,
      borderRadius: '14px', padding: '1.25rem', transition: 'all 0.2s',
      boxShadow: isDone ? 'none' : '0 2px 8px rgba(0,0,0,0.06)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            {isDone
              ? <CheckCircle2 size={18} color="var(--accent-emerald)" />
              : <Clock size={18} color="var(--accent-amber)" />
            }
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              {milestone.title}
            </h4>
          </div>
          <StatusBadge status={milestone.status} />
          {milestone.due_date && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.35rem' }}>
              Due {new Date(milestone.due_date).toLocaleDateString()}
            </p>
          )}
          {milestone.description && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.5 }}>
              {expanded ? milestone.description : milestone.description.slice(0, 100) + (milestone.description.length > 100 ? '…' : '')}
              {milestone.description.length > 100 && (
                <button onClick={() => setExpanded(!expanded)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.78rem', padding: '0 4px' }}>
                  {expanded ? 'Less' : 'More'}
                </button>
              )}
            </p>
          )}
          {milestone.resource_url && (
            <a href={getAssetUrl(milestone.resource_url)} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.5rem', textDecoration: 'none' }}>
              <FileText size={13} /> View Study Material
            </a>
          )}
        </div>
        {isPending && (
          <button
            onClick={handleMark}
            disabled={loading}
            className="btn btn-primary btn-sm"
            style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: '150px', justifyContent: 'center' }}
          >
            {loading ? <Loader2 size={14} className="spin" /> : <CheckCircle2 size={14} />}
            {loading ? 'Saving…' : 'Mark completed'}
          </button>
        )}
      </div>
    </div>
  );
};

/* ─── Single milestone card (mentor view) ─── */
const MentorMilestoneCard = ({ milestone, onUploadMaterial, onMarkVerified }) => {
  const isCompleted = milestone.status === 'COMPLETED';
  const isVerified = milestone.status === 'VERIFIED';
  const hasNoMaterial = !milestone.resource_url;

  return (
    <div style={{
      background: isVerified ? 'rgba(52,211,153,0.05)' : 'var(--bg-card)',
      border: `1px solid ${isVerified ? 'rgba(52,211,153,0.3)' : isCompleted ? 'rgba(99,102,241,0.35)' : 'var(--border-card)'}`,
      borderRadius: '14px', padding: '1.25rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            {isVerified ? <Trophy size={18} color="var(--accent-emerald)" />
              : isCompleted ? <CheckCircle2 size={18} color="var(--primary)" />
              : <Clock size={18} color="var(--text-muted)" />}
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              {milestone.title}
            </h4>
          </div>
          <StatusBadge status={milestone.status} />
          {milestone.description && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.5 }}>
              {milestone.description}
            </p>
          )}
          {milestone.student_name && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: '0.4rem' }}>
              Student: <strong style={{ color: 'var(--text-main)' }}>{milestone.student_name}</strong>
            </p>
          )}
          {milestone.resource_url && (
            <a href={getAssetUrl(milestone.resource_url)} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.5rem', textDecoration: 'none' }}>
              <FileText size={13} /> Current Material
            </a>
          )}
        </div>

        {/* Right side actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '160px' }}>
          {/* Upload next material — show when student has completed */}
          {isCompleted && !isVerified && (
            <button
              onClick={() => onMarkVerified(milestone.id)}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
            >
              <CheckCircle2 size={14} /> Mark Verified
            </button>
          )}
          {isVerified && (
            <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
              ✅ Verified &amp; Complete
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Mentor: Add new milestone form ─── */
const AddMilestoneForm = ({ mentorshipId, onAdded }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError('Title is required');
    setLoading(true); setError('');
    try {
      const form = new FormData();
      form.append('mentorshipId', mentorshipId);
      form.append('title', title.trim());
      form.append('description', desc.trim());
      if (dueDate) form.append('dueDate', dueDate);
      if (file) form.append('resourceFile', file);
      await apiClient('/sessions/milestones', { method: 'POST', body: form });
      setTitle(''); setDesc(''); setDueDate(''); setFile(null);
      setOpen(false);
      onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <button onClick={() => setOpen(!open)} className="btn btn-primary"
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {open ? <ChevronUp size={16} /> : <BookOpen size={16} />}
        {open ? 'Cancel' : 'Assign New Milestone'}
      </button>

      {open && (
        <form onSubmit={submit} style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-card)',
          borderRadius: '14px', padding: '1.5rem', marginTop: '1rem',
          display: 'flex', flexDirection: 'column', gap: '1rem'
        }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            📌 New Milestone
          </h4>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '0.6rem 1rem', fontSize: '0.83rem', color: '#ef4444', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <div>
            <label className="form-label">Title *</label>
            <input className="form-input" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Learn React Hooks" />
          </div>
          <div>
            <label className="form-label">Description / Instructions</label>
            <textarea className="form-input" rows={3} value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="What should the student study or do?" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Due Date (optional)</label>
              <input type="date" className="form-input" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Study Material (optional)</label>
              <input type="file" className="form-input" style={{ padding: '0.4rem' }}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.zip"
                onChange={e => setFile(e.target.files[0])} />
              {file && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{file.name}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {loading ? <Loader2 size={14} /> : <BookOpen size={14} />}
              {loading ? 'Assigning…' : 'Assign Milestone'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export function MilestonesView() {
  const { user } = useAuth();
  const [mentorships, setMentorships] = useState([]);
  const [selectedMentorship, setSelectedMentorship] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loadingMentorships, setLoadingMentorships] = useState(true);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [toast, setToast] = useState(null);

  const isStudent = user?.role === 'STUDENT';
  const isMentor = user?.role === 'ALUMNI';

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* Load active mentorships for the current user */
  const loadMentorships = async () => {
    setLoadingMentorships(true);
    try {
      const res = await apiClient('/mentorship/my-mentorships');
      const list = (res.data || []).filter(m => m.status === 'ACTIVE' || m.status === 'COMPLETED');
      setMentorships(list);
      if (list.length > 0 && !selectedMentorship) {
        setSelectedMentorship(list[0]);
      }
    } catch (e) {
      console.error('Failed to load mentorships', e.message);
    } finally {
      setLoadingMentorships(false);
    }
  };

  /* Load milestones for the selected mentorship */
  const loadMilestones = async (mentorshipId) => {
    if (!mentorshipId) return;
    setLoadingMilestones(true);
    try {
      const res = await apiClient(`/sessions/milestones/mentorship/${mentorshipId}`);
      setMilestones(res.data || []);
    } catch (e) {
      console.error('Failed to load milestones', e.message);
      setMilestones([]);
    } finally {
      setLoadingMilestones(false);
    }
  };

  useEffect(() => { loadMentorships(); }, [user]);
  useEffect(() => { if (selectedMentorship) loadMilestones(selectedMentorship.id); }, [selectedMentorship]);

  /* Student: mark a milestone as completed */
  const handleMarkComplete = async (milestoneId) => {
    try {
      await apiClient(`/sessions/milestones/${milestoneId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'COMPLETED' })
      });
      showToast('✅ Milestone marked as studied! Your mentor will be notified.');
      loadMilestones(selectedMentorship.id);
    } catch (e) {
      showToast('Failed to update milestone: ' + e.message, 'error');
    }
  };

  /* Mentor: upload next material for a completed milestone */
  const handleUploadMaterial = async (milestoneId, file, mentorshipId, milestoneTitle) => {
    try {
      const form = new FormData();
      form.append('mentorshipId', mentorshipId);
      form.append('title', milestoneTitle + ' – Additional Material');
      form.append('description', 'Next study material uploaded by mentor.');
      form.append('resourceFile', file);
      await apiClient('/sessions/milestones', { method: 'POST', body: form });
      showToast('📤 Material uploaded! Student has been notified.');
      loadMilestones(selectedMentorship.id);
    } catch (e) {
      showToast('Upload failed: ' + e.message, 'error');
    }
  };

  /* Mentor: mark a completed milestone as verified */
  const handleMarkVerified = async (milestoneId) => {
    try {
      await apiClient(`/sessions/milestones/${milestoneId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'VERIFIED' })
      });
      showToast('🏆 Milestone verified! Great progress.');
      loadMilestones(selectedMentorship.id);
    } catch (e) {
      showToast('Failed: ' + e.message, 'error');
    }
  };

  const pendingCount = milestones.filter(m => m.status === 'PENDING' || m.status === 'IN_PROGRESS').length;
  const completedCount = milestones.filter(m => m.status === 'COMPLETED' || m.status === 'VERIFIED').length;

  return (
    <div style={{ maxWidth: '1100px', margin: '1.5rem auto', padding: '0 1.5rem', position: 'relative' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          background: toast.type === 'error' ? '#ef4444' : 'var(--accent-emerald)',
          color: '#fff', padding: '0.85rem 1.25rem', borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)', fontSize: '0.88rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: '360px',
          animation: 'slideIn 0.3s ease'
        }}>
          {toast.msg}
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 0, marginLeft: '0.5rem' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
        Main Workspace <span style={{ margin: '0 0.35rem' }}>›</span>
        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Milestones</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            🎯 Milestones
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}>
            {isStudent ? 'Track your learning progress. Mark milestones as studied when done.'
              : 'Monitor student progress and upload materials for completed milestones.'}
          </p>
        </div>
        <button onClick={() => loadMilestones(selectedMentorship?.id)}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loadingMentorships ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '1rem' }}>Loading mentorships…</p>
        </div>
      ) : mentorships.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', borderRadius: '16px' }}>
          <BookOpen size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>No Active Mentorships</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {isStudent ? 'You need an accepted mentorship to see milestones.' : 'No students are assigned to you yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: mentorships.length > 1 ? '240px 1fr' : '1fr', gap: '1.5rem' }}>

          {/* Mentorship selector — only shown if multiple */}
          {mentorships.length > 1 && (
            <div className="glass-panel" style={{ padding: '1rem', borderRadius: '14px', height: 'fit-content' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                {isStudent ? 'My Mentors' : 'My Mentees'}
              </h4>
              {mentorships.map(m => {
                const label = isStudent
                  ? (m.mentor?.name || m.mentor_name || 'Mentor')
                  : (m.student?.name || m.student_name || 'Student');
                const active = selectedMentorship?.id === m.id;
                return (
                  <button key={m.id} onClick={() => setSelectedMentorship(m)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      background: active ? 'var(--primary)' : 'transparent',
                      color: active ? '#fff' : 'var(--text-main)',
                      border: 'none', borderRadius: '8px', padding: '0.6rem 0.75rem',
                      cursor: 'pointer', fontSize: '0.85rem', fontWeight: active ? 700 : 500,
                      marginBottom: '0.25rem', transition: 'all 0.15s'
                    }}>
                    {label}
                    <span style={{ display: 'block', fontSize: '0.72rem', opacity: 0.75 }}>
                      {m.domain?.name || m.domain_name || 'General'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Main milestone panel */}
          <div>
            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Total Milestones', value: milestones.length, color: 'var(--primary)' },
                { label: 'Pending', value: pendingCount, color: 'var(--accent-amber)' },
                { label: 'Completed', value: completedCount, color: 'var(--accent-emerald)' }
              ].map(s => (
                <div key={s.label} className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-subtle)', margin: '0 0 0.25rem' }}>{s.label}</p>
                  <p style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Mentor: assign new milestone */}
            {isMentor && selectedMentorship && (
              <AddMilestoneForm
                mentorshipId={selectedMentorship.id}
                onAdded={() => loadMilestones(selectedMentorship.id)}
              />
            )}

            {/* Milestone list */}
            {loadingMilestones ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ marginTop: '0.75rem' }}>Loading milestones…</p>
              </div>
            ) : milestones.length === 0 ? (
              <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', borderRadius: '14px' }}>
                <BookOpen size={36} color="var(--text-muted)" style={{ marginBottom: '0.75rem' }} />
                <h4 style={{ color: 'var(--text-main)', marginBottom: '0.35rem' }}>No Milestones Yet</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {isMentor ? 'Use the button above to assign your first milestone.' : 'Your mentor hasn\'t assigned any milestones yet.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {milestones.map(m =>
                  isStudent ? (
                    <StudentMilestoneCard key={m.id} milestone={m} onMarkComplete={handleMarkComplete} />
                  ) : (
                    <MentorMilestoneCard key={m.id} milestone={m}
                      onUploadMaterial={handleUploadMaterial}
                      onMarkVerified={handleMarkVerified} />
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MilestonesView;
