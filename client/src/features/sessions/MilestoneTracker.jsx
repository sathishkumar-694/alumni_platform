import { useState, useEffect, useCallback } from 'react';
import { apiClient, getAssetUrl } from '../../shared/services/api';
import { useNotification } from '../../shared/context/useNotification';
import { CheckCircle2, Clock, Plus, Target, FileText } from 'lucide-react';

export const MilestoneTracker = ({ mentorshipId, isMentor }) => {
  const { showNotification } = useNotification();
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMilestones = useCallback(async () => {
    try {
      const res = await apiClient(`/sessions/milestones/mentorship/${mentorshipId}`);
      setMilestones(res.data || []);
    } catch (err) {
      console.error('Failed to load milestones:', err);
    } finally {
      setLoading(false);
    }
  }, [mentorshipId]);

  useEffect(() => {
    if (!mentorshipId) return undefined;
    const timer = window.setTimeout(() => { void fetchMilestones(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchMilestones, mentorshipId]);

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await apiClient('/sessions/milestones', {
        method: 'POST',
        body: JSON.stringify({
          mentorshipId,
          title: title.trim(),
          description: description.trim(),
          dueDate
        })
      });

      showNotification('Milestone added to roadmap!', 'success');
      setTitle('');
      setDescription('');
      setDueDate('');
      setShowAddForm(false);
      fetchMilestones();
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (milestoneId, currentStatus) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED';
    try {
      await apiClient(`/sessions/milestones/${milestoneId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      });
      showNotification(`Milestone status updated to ${nextStatus}`, 'success');
      fetchMilestones();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem', background: '#ffffff', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Target size={20} color="var(--primary)" />
          <h4 style={{ fontSize: '1.1rem', color: '#0f172a' }}>Learning Roadmap & Milestones</h4>
        </div>

        {isMentor && !showAddForm && (
          <button onClick={() => setShowAddForm(true)} className="btn btn-secondary btn-sm">
            <Plus size={14} /> Add Milestone
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleAddMilestone} style={{ background: '#f8fafc', padding: '1.2rem', borderRadius: '12px', marginBottom: '1.25rem', border: '1px solid #cbd5e1' }}>
          <div className="form-group" style={{ marginBottom: '0.85rem' }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Milestone Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. System Architecture Design & Rate Limiter Implementation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '0.85rem' }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Description / Guidelines</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Deliverables, reference criteria, and implementation guidelines..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary btn-sm" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? 'Saving Milestone...' : 'Save Milestone'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading milestones...</p>
      ) : milestones.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No milestones set yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {milestones.map(m => {
            const hasResource = Boolean(m.resource_url || m.resourceUrl || m.file_url);
            const resourcePath = m.resource_url || m.resourceUrl || m.file_url;
            const fullResourceUrl = hasResource ? getAssetUrl(resourcePath) : null;

            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.9rem 1.1rem',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
                  {m.status === 'COMPLETED' || m.status === 'VERIFIED' ? (
                    <CheckCircle2 size={20} color="var(--accent-emerald)" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                  ) : (
                    <Clock size={20} color="var(--text-subtle)" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.925rem', fontWeight: 600, color: m.status === 'COMPLETED' ? 'var(--text-subtle)' : '#0f172a', textDecoration: m.status === 'COMPLETED' ? 'line-through' : 'none', margin: 0 }}>
                      {m.title}
                    </p>
                    {m.description && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                        {m.description}
                      </p>
                    )}

                    {!isMentor && m.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(m.id, m.status)}
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: '0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <CheckCircle2 size={14} /> Mark completed
                      </button>
                    )}

                    {/* Attached Resource Material Link */}
                    {fullResourceUrl && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <a
                          href={fullResourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.65rem',
                            textDecoration: 'none',
                            color: 'var(--primary)',
                            borderColor: 'var(--primary)',
                            borderRadius: '6px'
                          }}
                        >
                          <FileText size={12} /> View / Download Resource Material
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <span className={`badge ${m.status === 'COMPLETED' ? 'badge-emerald' : m.status === 'IN_PROGRESS' ? 'badge-cyan' : 'badge-amber'}`} style={{ whiteSpace: 'nowrap' }}>
                  {m.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
