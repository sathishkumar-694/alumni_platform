import React, { useState } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { useNotification } from '../../shared/context/NotificationContext';
import { X, ShieldCheck, Upload } from 'lucide-react';

export const AlumniRegisterModal = ({ isOpen, onClose }) => {
  const { registerAlumni } = useAuth();
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
    designation: '',
    experienceYears: '5',
    graduationYear: '2020',
    linkedinUrl: '',
    maxCapacity: '5',
    bio: ''
  });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      showNotification('Only photo/image files (PNG, JPG, WEBP, SVG) are accepted. PDF and document files are not allowed.', 'error');
      setFile(null);
      e.target.value = '';
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (file && !file.type.startsWith('image/')) {
      showNotification('Please select a valid photo/image file (PNG, JPG, WEBP, SVG).', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (file) {
        data.append('alumniIdCard', file);
      }

      await registerAlumni(data);
      showNotification('Alumni mentor registered successfully! Verification pending administrative review.', 'success');
      onClose();
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justify: 'center',
        zIndex: 9999
      }}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ margin: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Volunteer as Alumni Mentor</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Guide current students and empower the next tech generation</p>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. David Vance"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Work / Professional Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="david@techcorp.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Current Company / Org</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Google / Microsoft"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Designation / Role</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Senior Software Engineer"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Experience (Yrs)</label>
              <input
                type="number"
                className="form-input"
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Grad Year</label>
              <input
                type="number"
                className="form-input"
                value={formData.graduationYear}
                onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mentee Capacity</label>
              <input
                type="number"
                className="form-input"
                value={formData.maxCapacity}
                onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">LinkedIn Profile URL</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://linkedin.com/in/yourprofile"
              value={formData.linkedinUrl}
              onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Upload Alumni ID / Credential Photo (PNG, JPG, WEBP, SVG Only)</label>
            <div
              style={{
                border: '2px dashed var(--border-strong)',
                borderRadius: '8px',
                padding: '1.25rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'var(--bg-subtle)'
              }}
            >
              <Upload size={24} color="#7c3aed" style={{ marginBottom: '0.4rem' }} />
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                {file ? `Selected Photo: ${file.name}` : 'Click or drop Alumni ID photo here (Images only)'}
              </p>
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp, image/svg+xml, image/*"
                style={{ display: 'none' }}
                id="alumni-id-upload"
                onChange={handleFileChange}
              />
              <label htmlFor="alumni-id-upload" className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }}>
                Browse Photo File
              </label>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={submitting}>
            <ShieldCheck size={16} /> {submitting ? 'Submitting...' : 'Register as Alumni Mentor'}
          </button>
        </form>
      </div>
    </div>
  );
};
