import React, { useState, useEffect } from 'react';
import { apiClient, getAssetUrl } from '../../shared/services/api';
import { useAuth } from '../../shared/context/AuthContext';
import { useNotification } from '../../shared/context/NotificationContext';
import {
  Bell,
  Megaphone,
  Plus,
  Calendar,
  Tag,
  ShieldCheck,
  Trash2,
  Upload,
  FileText,
  Download,
  ExternalLink,
  Paperclip,
  X,
  File
} from 'lucide-react';

export const AnnouncementFeed = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('PLACEMENT');
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    showNotification(`Attached '${file.name}' (${(file.size / 1024).toFixed(1)} KB)`, 'info');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('category', category);
      if (selectedFile) {
        formData.append('attachment', selectedFile);
      }

      await apiClient('/announcements', {
        method: 'POST',
        body: formData
      });

      showNotification('University announcement published successfully!', 'success');
      setTitle('');
      setContent('');
      setSelectedFile(null);
      setShowModal(false);
      fetchAnnouncements();
    } catch (err) {
      showNotification(err.message || 'Failed to publish announcement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
      return;
    }
    try {
      await apiClient(`/announcements/${id}`, { method: 'DELETE' });
      showNotification('Announcement deleted successfully!', 'success');
      fetchAnnouncements();
    } catch (err) {
      showNotification(err.message || 'Failed to delete announcement', 'error');
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="badge badge-amber" style={{ marginBottom: '0.5rem' }}>Official Updates</span>
          <h2 style={{ fontSize: '2rem', color: '#0f172a' }}>University Announcement Feed</h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', margin: 0 }}>
            Placement drives, job descriptions, internship opportunities, career guidance webinars, and workshop materials
          </p>
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'ALUMNI') && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={18} /> Post Announcement & Documents
          </button>
        )}
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading announcement feed...</p>
      ) : announcements.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Megaphone size={36} color="var(--text-subtle)" style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
          <p style={{ fontWeight: 600, margin: 0 }}>No announcements published yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {announcements.map(ann => {
            const fileUrl = ann.file_url ? getAssetUrl(ann.file_url) : null;
            const isImage = ann.file_url && /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(ann.file_url);

            return (
              <div key={ann.id} className="glass-panel" style={{ padding: '1.75rem', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <span className={`badge ${ann.category === 'PLACEMENT' ? 'badge-cyan' : ann.category === 'WORKSHOP' ? 'badge-purple' : 'badge-emerald'}`}>
                      <Megaphone size={12} /> {ann.category}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                      {new Date(ann.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                      <ShieldCheck size={14} color="var(--primary)" /> Posted by {ann.author_name} ({ann.author_role})
                    </div>

                    {user?.role === 'ADMIN' && (
                      <button
                        onClick={() => handleDelete(ann.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#ef4444',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                        title="Delete Announcement"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    )}
                  </div>
                </div>

                <h3 style={{ fontSize: '1.3rem', color: '#0f172a', fontWeight: 800, marginBottom: '0.5rem' }}>{ann.title}</h3>
                <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: fileUrl ? '1rem' : 0 }}>
                  {ann.content}
                </p>

                {/* Attached Document / Job Description */}
                {fileUrl && (
                  <div
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-card)',
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      marginTop: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: 'rgba(99, 102, 241, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--primary)',
                          flexShrink: 0
                        }}
                      >
                        <FileText size={20} />
                      </div>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                          {ann.file_name || 'Attached Job Description / Document'}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', margin: '0.1rem 0 0 0' }}>
                          Shared with university students and alumni
                        </p>
                      </div>
                    </div>

                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem' }}
                    >
                      <Download size={14} /> View / Download Document
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Post Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#0f172a', fontWeight: 800, margin: 0 }}>
                Publish University Announcement
              </h3>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '0.35rem' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">
                  Category <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span>
                </label>
                <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)} required>
                  <option value="PLACEMENT">Placement Opportunity / Job Description</option>
                  <option value="INTERNSHIP">Internship Opportunity</option>
                  <option value="WORKSHOP">Technical Workshop / Webinar</option>
                  <option value="GENERAL">General Announcement</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Announcement Title <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Google Cloud SDE Placement Drive 2026 / JD Attached"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Content Body <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span>
                </label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Provide detailed description, eligibility criteria, interview dates, or event guidelines..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>

              {/* File Attachment: Job Description, Study Material, PDF, Image */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Paperclip size={14} color="var(--primary)" /> Attach File / Job Description / Document (Optional)
                </label>

                <div
                  style={{
                    border: '2px dashed var(--border-card)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    textAlign: 'center',
                    background: selectedFile ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-subtle)',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.zip,.png,.jpg,.jpeg,.webp"
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <FileText size={20} color="var(--primary)" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload size={22} color="var(--text-subtle)" style={{ margin: '0 auto 0.25rem' }} />
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                        Click or drag to attach Job Description PDF, Document (.doc, .docx), or Image
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', margin: '0.2rem 0 0 0' }}>
                        Supports PDF, Word, Excel, PPT, Zip, and Images (up to 50MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
                  {submitting ? 'Publishing & Uploading...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
