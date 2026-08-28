import React, { useState, useEffect } from 'react';
import { apiClient } from '../../shared/services/api';
import { useNotification } from '../../shared/context/NotificationContext';
import { CheckCircle2, Clock, Plus, Target } from 'lucide-react';

export const MilestoneTracker = ({ mentorshipId, isMentor }) => {
  const { showNotification } = useNotification();
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const fetchMilestones = async () => {
    try {
      const res = await apiClient(`/sessions/milestones/mentorship/${mentorshipId}`);
      setMilestones(res.data || []);
    } catch (err) {
      console.error('Failed to load milestones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mentorshipId) fetchMilestones();
  }, [mentorshipId]);

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    try {
      await apiClient('/sessions/milestones', {
        method: 'POST',
        body: JSON.stringify({
          mentorshipId,
          title,
          description,
          dueDate
        })
      });
      showNotification('Milestone added to learning roadmap', 'success');
      setTitle('');
      setDescription('');
      setShowAddForm(false);
      fetchMilestones();
    } catch (err) {
      showNotification(err.message, 'error');
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
        <form onSubmit={handleAddMilestone} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid #cbd5e1' }}>
          <div className="form-group">
            <label className="form-label">Milestone Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Build a Microservice with Rate Limiting"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description / Instructions</label>
            <input
              type="text"
              className="form-input"
              placeholder="Key deliverables & guidelines..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary btn-sm">Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm">Save Milestone</button>
          </div>
        </form>
      )}

      {loading ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading milestones...</p>
      ) : milestones.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No milestones set yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {milestones.map(m => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 2px rgba(15,23,42,0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => handleToggleStatus(m.id, m.status)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  {m.status === 'COMPLETED' ? (
                    <CheckCircle2 size={20} color="var(--accent-emerald)" />
                  ) : (
                    <Clock size={20} color="var(--text-subtle)" />
                  )}
                </button>
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: m.status === 'COMPLETED' ? 'var(--text-subtle)' : '#0f172a', textDecoration: m.status === 'COMPLETED' ? 'line-through' : 'none' }}>
                    {m.title}
                  </p>
                  {m.description && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{m.description}</p>}
                </div>
              </div>

              <span className={`badge ${m.status === 'COMPLETED' ? 'badge-emerald' : m.status === 'IN_PROGRESS' ? 'badge-cyan' : 'badge-amber'}`}>
                {m.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
