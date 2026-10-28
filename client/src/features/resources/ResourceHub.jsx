import { useState, useEffect } from 'react';
import { apiClient, getAssetUrl } from '../../shared/services/api';
import { useAuth } from '../../shared/context/AuthContext';
import { useNotification } from '../../shared/context/NotificationContext';
import {
  BookOpen,
  ExternalLink,
  Download,
  Plus,
  FileText,
  Upload,
  X,
  Paperclip,
  Search
} from 'lucide-react';

export const ResourceHub = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [resources, setResources] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [domainId, setDomainId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const fetchDomains = async () => {
    try {
      const res = await apiClient('/domains');
      setDomains(res.data || []);
      if (res.data?.length > 0) {
        setDomainId(res.data[0].id);
      }
    } catch (err) {
      console.warn('Failed to load domains:', err.message);
    }
  };

  useEffect(() => {
    fetchResources();
    fetchDomains();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    showNotification(`Selected study file '${file.name}' (${(file.size / 1024).toFixed(1)} KB)`, 'info');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('externalLink', externalLink);
      if (domainId) {
        formData.append('domainId', domainId);
      }
      if (selectedFile) {
        formData.append('resourceFile', selectedFile);
      }

      await apiClient('/resources', {
        method: 'POST',
        body: formData
      });

      showNotification('Study material published and shared with students!', 'success');
      setTitle('');
      setDescription('');
      setExternalLink('');
      setSelectedFile(null);
      setShowModal(false);
      fetchResources();
    } catch (err) {
      showNotification(err.message || 'Failed to share resource material', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredResources = searchQuery ? resources.filter(r => {
    const q = searchQuery.toLowerCase().trim();
    return (
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.description && r.description.toLowerCase().includes(q)) ||
      (r.mentor_name && r.mentor_name.toLowerCase().includes(q)) ||
      (r.domain_name && r.domain_name.toLowerCase().includes(q))
    );
  }) : resources;

  return (
    <div style={{ maxWidth: '1280px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="badge badge-purple" style={{ marginBottom: '0.5rem' }}>Knowledge Sharing</span>
          <h2 style={{ fontSize: '2rem', color: '#0f172a' }}>Mentorship Resource Hub</h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', margin: 0 }}>
            Study guides, interview prep cheat sheets, system design roadmaps, reference files, and code repos shared by alumni mentors
          </p>
        </div>

        {(user?.role === 'ALUMNI' || user?.role === 'ADMIN') && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={18} /> Share Study Material & Files
          </button>
        )}
      </div>

      {/* In-Page Resource Search Bar */}
      <div style={{ marginBottom: '1.75rem', maxWidth: '640px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} color="var(--text-subtle)" style={{ position: 'absolute', left: '1rem' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search study materials by title, topic, mentor name, or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '2.75rem',
              paddingRight: '2.5rem',
              height: '42px',
              borderRadius: '12px',
              fontSize: '0.875rem',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-card)'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '0.75rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-subtle)',
                padding: '0.25rem'
              }}
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading shared resources...</p>
      ) : filteredResources.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <BookOpen size={36} color="var(--text-subtle)" style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
          <p style={{ fontWeight: 600, margin: 0 }}>
            {searchQuery ? `No study resources found matching "${searchQuery}".` : 'No study resources shared yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {filteredResources.map(r => {
            const fileUrl = r.file_url ? getAssetUrl(r.file_url) : null;

            return (
              <div
                key={r.id}
                className="glass-panel"
                style={{
                  padding: '1.6rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '16px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div
                      style={{
                        background: 'rgba(99, 102, 241, 0.12)',
                        padding: '0.6rem',
                        borderRadius: '10px',
                        color: 'var(--primary)',
                        border: '1px solid rgba(99, 102, 241, 0.25)'
                      }}
                    >
                      <FileText size={22} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 800, margin: 0 }}>{r.title}</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, margin: '0.15rem 0 0 0' }}>
                        Shared by {r.mentor_name} • {r.domain_name}
                      </p>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.55', marginBottom: '1.25rem' }}>
                    {r.description || 'Study guide and technical preparation resource.'}
                  </p>
                </div>

                <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-card)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {fileUrl && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                    >
                      <Download size={14} /> Download File
                    </a>
                  )}

                  {r.external_link && (
                    <a
                      href={r.external_link}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                    >
                      <ExternalLink size={14} /> Open Link
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#0f172a', fontWeight: 800, margin: 0 }}>
                Share Study Material & Notes
              </h3>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '0.35rem' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label className="form-label">
                  Resource Title <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Distributed Systems & System Design Handbook"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {domains.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Associated Engineering Domain</label>
                  <select className="form-select" value={domainId} onChange={(e) => setDomainId(e.target.value)}>
                    {domains.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Description & Key Topics</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Explain what topics are covered, interview tips, and how students can use this..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Upload Document / Study File */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Paperclip size={14} color="var(--primary)" /> Upload Document / Notes / Cheat Sheet (.pdf, .docx, .zip, .ppt)
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
                    accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.zip,.csv,.png,.jpg"
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
                        Click or drag to attach Study Guide, PDF, Word Document, or Zip
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', margin: '0.2rem 0 0 0' }}>
                        Supports PDF, DOCX, PPTX, Zip, Code files up to 50MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">External Link / GitHub Repo / Google Drive URL (Optional)</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://github.com/... or https://drive.google.com/..."
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
                  {submitting ? 'Uploading & Sharing...' : 'Share Study Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
