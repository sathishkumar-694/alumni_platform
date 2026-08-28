import React, { useState, useEffect } from 'react';
import { apiClient } from '../../shared/services/api';
import { useNotification } from '../../shared/context/NotificationContext';
import { VirtualMeetingModal } from './VirtualMeetingModal';
import { Calendar, Video, Clock, CheckCircle2, ExternalLink } from 'lucide-react';

export const SessionTracker = ({ mentorshipId, isMentor }) => {
  const { showNotification } = useNotification();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVirtualSession, setActiveVirtualSession] = useState(null);

  const fetchSessions = async () => {
    try {
      const res = await apiClient(`/sessions/sessions/mentorship/${mentorshipId}`);
      setSessions(res.data || []);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mentorshipId) fetchSessions();
  }, [mentorshipId]);

  const handleConfirmSlot = async (sessionId, selectedSlot) => {
    try {
      await apiClient(`/sessions/sessions/${sessionId}/notes`, {
        method: 'PATCH',
        body: JSON.stringify({
          selectedSlot,
          status: 'CONFIRMED'
        })
      });
      showNotification('Session time confirmed and finalized!', 'success');
      fetchSessions();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  if (loading) return <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading 1-on-1 sessions...</p>;
  if (sessions.length === 0) return null;

  return (
    <div style={{ marginTop: '1rem', background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-card)' }}>
      <h5 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Calendar size={16} color="var(--primary)" /> Scheduled 1-on-1 Sessions ({sessions.length})
      </h5>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {sessions.map(s => {
          const isPendingSelection = s.status === 'PENDING_SLOT_SELECTION';
          const proposedSlots = s.proposed_slots || [s.scheduled_at];

          return (
            <div key={s.id} style={{ background: 'var(--bg-card)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{s.topic}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Duration: {s.duration_mins} Minutes</p>
                </div>
                <span className={`badge ${isPendingSelection ? 'badge-amber' : 'badge-emerald'}`}>
                  {isPendingSelection ? 'Slot Selection Pending' : 'Confirmed'}
                </span>
              </div>

              {/* Proposed Slots Selection View */}
              {isPendingSelection ? (
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-card)', padding: '0.75rem', borderRadius: '6px', marginTop: '0.5rem' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '0.4rem' }}>
                    {isMentor ? '👉 Student Proposed 3 Convenient Time Slots. Select 1 to Finalize:' : '⏳ Waiting for Mentor to pick 1 of your proposed slots:'}
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {proposedSlots.map((slotTime, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-card)' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600 }}>
                          Option {idx + 1}: {new Date(slotTime).toLocaleString()}
                        </span>

                        {isMentor && (
                          <button
                            onClick={() => handleConfirmSlot(s.id, slotTime)}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}
                          >
                            <CheckCircle2 size={12} /> Finalize Slot {idx + 1}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Confirmed Session Final Time & Native Embedded Video Meeting Button */
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-card)' }}>
                  <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={14} /> Finalized Time: {new Date(s.scheduled_at).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveVirtualSession(s)}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.75rem' }}
                  >
                    <Video size={14} /> Launch In-App Video Call
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Embedded 1-on-1 Virtual Video Conference Modal */}
      {activeVirtualSession && (
        <VirtualMeetingModal
          session={activeVirtualSession}
          isOpen={Boolean(activeVirtualSession)}
          onClose={() => setActiveVirtualSession(null)}
        />
      )}
    </div>
  );
};
