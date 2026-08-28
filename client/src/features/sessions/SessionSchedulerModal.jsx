import React, { useState } from 'react';
import { apiClient } from '../../shared/services/api';
import { useNotification } from '../../shared/context/NotificationContext';
import { X, Calendar, Clock, Video, CheckCircle2 } from 'lucide-react';

export const SessionSchedulerModal = ({ mentorshipId, isOpen, onClose, onSuccess }) => {
  const { showNotification } = useNotification();
  const [topic, setTopic] = useState('');
  const [slot1, setSlot1] = useState('');
  const [slot2, setSlot2] = useState('');
  const [slot3, setSlot3] = useState('');
  const [durationMins, setDurationMins] = useState(45);
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/campusbridge-live');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const proposedSlots = [slot1, slot2, slot3].filter(Boolean);
    if (proposedSlots.length === 0) {
      showNotification('Please provide at least 1 convenient time slot for your mentor.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient('/sessions/sessions', {
        method: 'POST',
        body: JSON.stringify({
          mentorshipId,
          topic,
          proposedSlots,
          durationMins,
          meetingLink
        })
      });
      showNotification('Session request with proposed convenient slots sent to your mentor!', 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <span className="badge badge-purple" style={{ marginBottom: '0.25rem' }}>1-on-1 Guidance</span>
            <h2 style={{ fontSize: '1.5rem', color: '#0f172a' }}>Request 1-on-1 Session</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Propose 2-3 convenient time slots for your alumni mentor to choose from</p>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Session Topic / Agenda</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. System Design Mock Interview & Resume Feedback"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
          </div>

          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={16} color="var(--primary)" /> Propose Convenient Date & Time Slots (Your Mentor Will Pick 1):
            </p>

            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Convenient Slot Option 1 (Primary)</label>
              <input
                type="datetime-local"
                className="form-input"
                value={slot1}
                onChange={(e) => setSlot1(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Convenient Slot Option 2 (Alternative)</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={slot2}
                  onChange={(e) => setSlot2(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Convenient Slot Option 3 (Alternative)</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={slot3}
                  onChange={(e) => setSlot3(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Duration (Minutes)</label>
              <select
                className="form-select"
                value={durationMins}
                onChange={(e) => setDurationMins(e.target.value)}
              >
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Virtual Meeting URL</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://meet.google.com/..."
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={submitting}>
            <Calendar size={16} /> {submitting ? 'Submitting Request...' : 'Send Session Request to Mentor'}
          </button>
        </form>
      </div>
    </div>
  );
};
