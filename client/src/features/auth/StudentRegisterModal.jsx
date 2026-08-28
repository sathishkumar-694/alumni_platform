import React, { useState } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { useNotification } from '../../shared/context/NotificationContext';
import { X, Sparkles, Upload } from 'lucide-react';

export const StudentRegisterModal = ({ isOpen, onClose }) => {
  const { registerStudent } = useAuth();
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    regNumber: '',
    academicYear: '',
    department: '',
    careerGoals: ''
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

    if (!formData.academicYear) {
      showNotification('Please select your academic year.', 'error');
      return;
    }

    if (!formData.department.trim()) {
      showNotification('Please enter your department.', 'error');
      return;
    }

    if (file && !file.type.startsWith('image/')) {
      showNotification('Please select a valid photo/image file (PNG, JPG, WEBP, SVG).', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (file) {
        data.append('studentIdCard', file);
      }

      await registerStudent(data);
      showNotification('Student registration successful! Your verification is pending admin review.', 'success');
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
            <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Student Registration</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Join CampusBridge to find verified alumni mentors</p>
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
                placeholder="e.g. Alex Rivera"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">University Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="student@university.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Register Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="REG2024-XXXX"
                value={formData.regNumber}
                onChange={(e) => setFormData({ ...formData, regNumber: e.target.value })}
                required
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Academic Year</label>
              <select
                className="form-select"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                required
              >
                <option value="">-- Choose Academic Year --</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year / Final">4th Year / Final</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Computer Science & Engineering"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Career Goals & Aspirations</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Describe your career goals, targeted tech stacks, or guidance needed..."
              value={formData.careerGoals}
              onChange={(e) => setFormData({ ...formData, careerGoals: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Upload Student ID Card Photo (PNG, JPG, WEBP, SVG Only)</label>
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
              <Upload size={24} color="var(--primary)" style={{ marginBottom: '0.4rem' }} />
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                {file ? `Selected Photo: ${file.name}` : 'Click or drop Student ID photo here (Images only)'}
              </p>
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp, image/svg+xml, image/*"
                style={{ display: 'none' }}
                id="student-id-upload"
                onChange={handleFileChange}
              />
              <label htmlFor="student-id-upload" className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }}>
                Browse Photo File
              </label>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={submitting}>
            <Sparkles size={16} /> {submitting ? 'Registering...' : 'Register as Student'}
          </button>
        </form>
      </div>
    </div>
  );
};
