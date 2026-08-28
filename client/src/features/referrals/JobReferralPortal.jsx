import React, { useState, useEffect } from 'react';
import { apiClient } from '../../shared/services/api';
import { useAuth } from '../../shared/context/AuthContext';
import { useNotification } from '../../shared/context/NotificationContext';
import { Briefcase, Building, Send, Plus, CheckCircle2, Award, ExternalLink, Sparkles, UserCheck, X } from 'lucide-react';

export const JobReferralPortal = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [jobList, setJobList] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [newJobForm, setNewJobForm] = useState({
    title: '',
    company: '',
    location: '',
    experienceReq: '0 - 1 Yr',
    skills: '',
    description: ''
  });

  // Fetch real-time job referral drives from MySQL backend API
  const fetchJobData = async () => {
    try {
      const res = await apiClient('/referrals');
      setJobList(res.data || []);

      if (user?.role === 'STUDENT') {
        const appRes = await apiClient('/referrals/my-applications');
        setAppliedJobIds(appRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load real-time job referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobData();
  }, [user]);

  const handleApplyReferral = async (job) => {
    if (appliedJobIds.includes(job.id)) return;
    try {
      await apiClient(`/referrals/${job.id}/apply`, { method: 'POST' });
      setAppliedJobIds(prev => [...prev, job.id]);
      showNotification(`Internal Referral Application submitted to ${job.postedBy} at ${job.company}!`, 'success');
      fetchJobData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      await apiClient('/referrals', {
        method: 'POST',
        body: JSON.stringify({
          title: newJobForm.title,
          company: newJobForm.company,
          location: newJobForm.location,
          experienceReq: newJobForm.experienceReq,
          skills: newJobForm.skills,
          description: newJobForm.description
        })
      });

      setShowPostJobModal(false);
      setNewJobForm({ title: '', company: '', location: '', experienceReq: '0 - 1 Yr', skills: '', description: '' });
      showNotification('Internal Job Referral Drive posted directly to MySQL database! Visible to all users in real-time.', 'success');
      fetchJobData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '1.5rem auto', padding: '0 1.5rem' }}>
      
      {/* Breadcrumb */}
      <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginBottom: '0.75rem' }}>
        Opportunities <span style={{ margin: '0 0.35rem' }}>›</span> <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Alumni Job Referral Portal</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <span className="badge badge-cyan" style={{ marginBottom: '0.35rem' }}>Verified Alumni Hiring Drive (MySQL Real-Time)</span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Alumni Job Referral Portal ({jobList.length} Active Drives)
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Get direct internal job referrals from verified alumni working at top tech companies.
          </p>
        </div>

        {user?.role === 'ALUMNI' && (
          <button
            onClick={() => setShowPostJobModal(true)}
            className="btn btn-primary"
            style={{ background: '#0284c7', borderColor: '#0284c7' }}
          >
            <Plus size={16} /> Post Internal Job Referral
          </button>
        )}
      </div>

      {/* Job Referral Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading real-time job referral drives from MySQL database...
        </div>
      ) : jobList.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No active job referral drives posted in the database yet. Alumni mentors can post hiring drives above!
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(370px, 1fr))', gap: '1.5rem' }}>
          {jobList.map(job => {
            const hasApplied = appliedJobIds.includes(job.id);

            return (
              <div
                key={job.id}
                className="glass-panel glass-panel-glow"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 700 }}>{job.title}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                        <Building size={14} /> {job.company} • {job.location}
                      </p>
                    </div>
                    <span className="badge badge-emerald">Referral Open</span>
                  </div>

                  <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-card)', marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginBottom: '0.25rem' }}>Posted by Verified Alumni:</p>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{job.postedBy}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{job.alumniRole}</p>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '1rem' }}>
                    {job.description}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.25rem' }}>
                    {(job.skills || []).map(s => (
                      <span key={s} className="badge badge-purple" style={{ fontSize: '0.7rem' }}>{s}</span>
                    ))}
                  </div>
                </div>

                <div style={{ paddingTop: '0.85rem', borderTop: '1px solid var(--border-card)' }}>
                  {user?.role === 'STUDENT' ? (
                    <button
                      onClick={() => handleApplyReferral(job)}
                      disabled={hasApplied}
                      className={`btn btn-sm ${hasApplied ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ width: '100%' }}
                    >
                      {hasApplied ? <><CheckCircle2 size={14} color="#059669" /> Referral Requested</> : <><Send size={14} /> Request Internal Referral</>}
                    </button>
                  ) : (
                    <button className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                      Active Alumni Referral Drive
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Referral Modal */}
      {showPostJobModal && (
        <div className="modal-overlay" onClick={() => setShowPostJobModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>Post Internal Referral Opening</h3>
              <button onClick={() => setShowPostJobModal(false)} className="btn btn-secondary btn-sm"><X size={16} /></button>
            </div>

            <form onSubmit={handleCreateJob}>
              <div className="form-group">
                <label className="form-label">Job Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Software Development Engineer (SDE-1)"
                  value={newJobForm.title}
                  onChange={(e) => setNewJobForm({ ...newJobForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Company Name & Location</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Google / Microsoft"
                    value={newJobForm.company}
                    onChange={(e) => setNewJobForm({ ...newJobForm, company: e.target.value })}
                    required
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Bengaluru / Remote"
                    value={newJobForm.location}
                    onChange={(e) => setNewJobForm({ ...newJobForm, location: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Key Required Skills (Comma Separated)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. React, Node.js, Python, System Design"
                  value={newJobForm.skills}
                  onChange={(e) => setNewJobForm({ ...newJobForm, skills: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description & Referral Guidelines</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Details about team, expectations, and referral process..."
                  value={newJobForm.description}
                  onChange={(e) => setNewJobForm({ ...newJobForm, description: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowPostJobModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Publish Job Referral</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
