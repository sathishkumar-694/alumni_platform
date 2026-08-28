import React, { useState, useEffect } from 'react';
import { apiClient } from '../../shared/services/api';
import { useAuth } from '../../shared/context/AuthContext';
import { useNotification } from '../../shared/context/NotificationContext';
import { Bell, Megaphone, Plus, Calendar, Tag, ShieldCheck } from 'lucide-react';

export const AnnouncementFeed = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('PLACEMENT');

  const fetchAnnouncements = async () => {
    try {
      const res = await apiClient('/announcements');
      setAnnouncements(res.data || []);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await apiClient('/announcements', {
        method: 'POST',
        body: JSON.stringify({
          title,
          content,
          category
        })
      });
      showNotification('University announcement published!', 'success');
      setTitle('');
      setContent('');
      setShowModal(false);
      fetchAnnouncements();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <span className="badge badge-amber" style={{ marginBottom: '0.5rem' }}>Official Updates</span>
          <h2 style={{ fontSize: '2rem', color: '#0f172a' }}>University Announcement Feed</h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            Placement drives, internship opportunities, career guidance webinars, and workshop events
          </p>
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'ALUMNI') && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={18} /> Post Announcement
          </button>
        )}
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading announcement feed...</p>
      ) : announcements.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No announcements published yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {announcements.map(ann => (
            <div key={ann.id} className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span className={`badge ${ann.category === 'PLACEMENT' ? 'badge-cyan' : ann.category === 'WORKSHOP' ? 'badge-purple' : 'badge-emerald'}`}>
                    <Megaphone size={12} /> {ann.category}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                    {new Date(ann.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                  <ShieldCheck size={14} color="var(--primary)" /> Posted by {ann.author_name} ({ann.author_role})
                </div>
              </div>

              <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.5rem' }}>{ann.title}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>{ann.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Post Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '1rem' }}>Publish University Announcement</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="PLACEMENT">Placement Opportunity</option>
                  <option value="INTERNSHIP">Internship Opportunity</option>
                  <option value="WORKSHOP">Technical Workshop / Webinar</option>
                  <option value="GENERAL">General Announcement</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Announcement Title</label>
                <input type="text" className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Content Body</label>
                <textarea className="form-textarea" rows={5} value={content} onChange={(e) => setContent(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Publish Now</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
