import React, { useState, useEffect } from 'react';
import { apiClient } from '../../shared/services/api';
import { useAuth } from '../../shared/context/AuthContext';
import { useNotification } from '../../shared/context/NotificationContext';
import { BookOpen, ExternalLink, Download, Plus, FileText } from 'lucide-react';

export const ResourceHub = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [externalLink, setExternalLink] = useState('');

  const fetchResources = async () => {
    try {
      const res = await apiClient('/resources');
      setResources(res.data || []);
    } catch (err) {
      console.error('Failed to fetch resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    try {
      await apiClient('/resources', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          externalLink
        })
      });
      showNotification('Resource shared successfully!', 'success');
      setTitle('');
      setDescription('');
      setExternalLink('');
      setShowModal(false);
      fetchResources();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <span className="badge badge-purple" style={{ marginBottom: '0.5rem' }}>Knowledge Sharing</span>
          <h2 style={{ fontSize: '2rem', color: '#0f172a' }}>Mentorship Resource Hub</h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            Study guides, interview prep cheat sheets, system design roadmaps, and reference code repos shared by alumni mentors
          </p>
        </div>

        {(user?.role === 'ALUMNI' || user?.role === 'ADMIN') && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={18} /> Share Study Material
          </button>
        )}
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading shared resources...</p>
      ) : resources.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No resources available yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {resources.map(r => (
            <div key={r.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ background: '#f5f3ff', padding: '0.5rem', borderRadius: '8px', color: '#7c3aed', border: '1px solid #ddd6fe' }}>
                    <FileText size={22} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', color: '#0f172a' }}>{r.title}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>By {r.mentor_name}</p>
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>{r.description}</p>
              </div>

              <div style={{ paddingTop: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem' }}>
                {r.file_url && (
                  <a href={r.file_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                    <Download size={14} /> Download Attachment
                  </a>
                )}

                {r.external_link && (
                  <a href={r.external_link} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                    <ExternalLink size={14} /> Open Guide
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '1rem' }}>Share Resource Material</h3>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label className="form-label">Resource Title</label>
                <input type="text" className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">External Link / GitHub URL</label>
                <input type="url" className="form-input" placeholder="https://..." value={externalLink} onChange={(e) => setExternalLink(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Publish Resource</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
