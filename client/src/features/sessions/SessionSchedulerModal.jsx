import { useState } from 'react';
import { apiClient } from '../../shared/services/api';
import { useNotification } from '../../shared/context/useNotification';
import { X, Calendar, Clock, Sparkles, RefreshCw } from 'lucide-react';

export const SessionSchedulerModal = ({ mentorshipId, isOpen, onClose, onSuccess }) => {
  const { showNotification } = useNotification();
  const [topic, setTopic] = useState('');
  const [slot1, setSlot1] = useState('');
  const [slot2, setSlot2] = useState('');
  const [slot3, setSlot3] = useState('');
  const [durationMins, setDurationMins] = useState(45);
  
  // Platform selection: 'jitsi' | 'gmeet' | 'zoom'
  const [platformType, setPlatformType] = useState('jitsi');
  const [meetingLink, setMeetingLink] = useState(() => createJitsiRoomUrl('', mentorshipId));
  const [submitting, setSubmitting] = useState(false);

  // Generate unique built-in Jitsi room link
  function createJitsiRoomUrl(customTopic = topic, targetMentorshipId = mentorshipId) {
    const slug = Math.random().toString(36).substring(2, 7);
    const safeTopic = (customTopic || 'Mentorship').replace(/[^a-zA-Z0-9]/g, '-');
    return `https://meet.jit.si/CampusBridge-${safeTopic}-${targetMentorshipId || 'session'}-${slug}`;
  }

  const handleGenerateJitsiLink = () => {
    const freshUrl = createJitsiRoomUrl();
    setMeetingLink(freshUrl);
    setPlatformType('jitsi');
    showNotification('Fresh built-in Jitsi Meet room generated!', 'success');
  };

  const handleSelectPlatform = (platform) => {
    setPlatformType(platform);
    if (platform === 'jitsi') {
      setMeetingLink(createJitsiRoomUrl());
    } else if (platform === 'gmeet') {
      setMeetingLink('https://meet.google.com/new');
    } else if (platform === 'zoom') {
      setMeetingLink('https://zoom.us/join');
    }
  };

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
          meetingLink: meetingLink || createJitsiRoomUrl()
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <span className="badge badge-purple" style={{ marginBottom: '0.25rem' }}>1-on-1 Guidance</span>
            <h2 style={{ fontSize: '1.5rem', color: '#0f172a' }}>Request 1-on-1 Session</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Propose convenient slots & select video conference platform</p>
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

          {/* Meeting Platform Picker & Jitsi Link Generator */}
          <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-card)', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <label className="form-label" style={{ margin: 0, fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                Meeting Platform Selection:
              </label>
              <button
                type="button"
                onClick={handleGenerateJitsiLink}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.725rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary)', borderColor: 'var(--primary)' }}
              >
                <RefreshCw size={12} /> Regenerate Jitsi Room
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <button
                type="button"
                onClick={() => handleSelectPlatform('jitsi')}
                className={`btn btn-sm ${platformType === 'jitsi' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
              >
                <Sparkles size={13} /> Built-in Jitsi Meet
              </button>
              <button
                type="button"
                onClick={() => handleSelectPlatform('gmeet')}
                className={`btn btn-sm ${platformType === 'gmeet' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
              >
                Google Meet
              </button>
              <button
                type="button"
                onClick={() => handleSelectPlatform('zoom')}
                className={`btn btn-sm ${platformType === 'zoom' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
              >
                Zoom
              </button>
            </div>

            <div className="form-group" style={{ marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Meeting Room URL</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://meet.jit.si/... or https://meet.google.com/..."
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                required
                style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}
              />
            </div>

            <p style={{ fontSize: '0.725rem', color: 'var(--text-subtle)', margin: 0, lineHeight: 1.4 }}>
              {platformType === 'jitsi'
                ? '✨ Built-in Jitsi: Free, 100% in-browser WebRTC call with live code sandbox, architecture whiteboard, and chat. No external login needed!'
                : 'Enter your custom meeting URL. Both you and your mentor will receive this link upon slot confirmation.'}
            </p>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
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

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
            <Calendar size={16} /> {submitting ? 'Submitting Request...' : 'Send Session Request to Mentor'}
          </button>
        </form>
      </div>
    </div>
  );
};
