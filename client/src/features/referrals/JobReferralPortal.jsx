import { useState, useEffect, useCallback } from 'react';
import { apiClient, getAssetUrl } from '../../shared/services/api';
import { useAuth } from '../../shared/context/AuthContext';
import { useNotification } from '../../shared/context/NotificationContext';
import {
  Building,
  Send,
  Plus,
  CheckCircle2,
  X,
  FileText,
  Download,
  Paperclip,
  Upload,
  Search,
  Users
} from 'lucide-react';

export const JobReferralPortal = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [jobList, setJobList] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const [resumeFiles, setResumeFiles] = useState({});
  const [applicationMessages, setApplicationMessages] = useState({});
  const [applicationJob, setApplicationJob] = useState(null);
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [loading, setLoading] = useState(true);
  const [incomingApplications, setIncomingApplications] = useState([]);
  const [applicantsJob, setApplicantsJob] = useState(null);
  const [updatingApplicationId, setUpdatingApplicationId] = useState(null);

  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newJobForm, setNewJobForm] = useState({
    title: '',
    company: '',
    location: '',
    experienceReq: '0 - 1 Yr',
    skills: '',
    description: ''
  });

  // Fetch real-time job referral drives from MySQL backend API
  const fetchJobData = useCallback(async () => {
    try {
      const res = await apiClient('/referrals');
      setJobList(res.data || []);

      if (user?.role === 'STUDENT') {
        const appRes = await apiClient('/referrals/my-applications');
        setAppliedJobIds(appRes.data || []);
      } else if (user?.role === 'ALUMNI') {
        const applicationsRes = await apiClient('/referrals/mentor/incoming');
        setIncomingApplications(applicationsRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load real-time job referrals:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchJobData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchJobData]);

  const handleApplyReferral = async (job) => {
    if (appliedJobIds.includes(job.id)) return;
    const resume = resumeFiles[job.id];
    if (!resume) {
      showNotification('Upload your resume before applying.', 'error');
      return;
    }
    try {
      setSubmittingApplication(true);
      const formData = new FormData();
      formData.append('resume', resume);
      formData.append('message', applicationMessages[job.id] || '');
      await apiClient(`/referrals/${job.id}/apply`, { method: 'POST', body: formData });
      setAppliedJobIds(prev => [...prev, job.id]);
      setApplicationJob(null);
      setResumeFiles(current => ({ ...current, [job.id]: null }));
      setApplicationMessages(current => ({ ...current, [job.id]: '' }));
      showNotification(`Internal Referral Application submitted to ${job.postedBy} at ${job.company}!`, 'success');
      fetchJobData();
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setSubmittingApplication(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', newJobForm.title);
      formData.append('company', newJobForm.company);
      formData.append('location', newJobForm.location);
      formData.append('experienceReq', newJobForm.experienceReq);
      formData.append('skills', newJobForm.skills);
      formData.append('description', newJobForm.description);

      if (selectedFile) {
        formData.append('jdFile', selectedFile);
      }

      await apiClient('/referrals', {
        method: 'POST',
        body: formData
      });

      setShowPostJobModal(false);
      setSelectedFile(null);
      setNewJobForm({ title: '', company: '', location: '', experienceReq: '0 - 1 Yr', skills: '', description: '' });
      showNotification('Internal Job Referral Drive posted successfully! Visible to all users in real-time.', 'success');
      fetchJobData();
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewApplicant = async (application, status) => {
    setUpdatingApplicationId(application.id);
    try {
      await apiClient(`/referrals/mentor/applications/${application.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      setIncomingApplications(current => current.map(item => item.id === application.id ? { ...item, status } : item));
      showNotification(`Application ${status.toLowerCase()}.`, 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setUpdatingApplicationId(null);
    }
  };

  const filteredJobs = searchQuery ? jobList.filter(job => {
    const q = searchQuery.toLowerCase().trim();
    return (
      (job.title && job.title.toLowerCase().includes(q)) ||
      (job.company && job.company.toLowerCase().includes(q)) ||
      (job.location && job.location.toLowerCase().includes(q)) ||
      (job.skills && job.skills.toLowerCase().includes(q)) ||
      (job.description && job.description.toLowerCase().includes(q)) ||
      (job.postedBy && job.postedBy.toLowerCase().includes(q))
    );
  }) : jobList;

  return (
    <div style={{ maxWidth: '1280px', margin: '1.5rem auto', padding: '0 1.5rem' }}>
      
      {/* Breadcrumb */}
      <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginBottom: '0.75rem' }}>
        Opportunities <span style={{ margin: '0 0.35rem' }}>›</span> <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Alumni Job Referral Portal</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <span className="badge badge-cyan" style={{ marginBottom: '0.35rem' }}>Verified Alumni Hiring Drive</span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Alumni Job Referral Portal ({jobList.length} Active Drives)
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Get direct internal job referrals from verified alumni working at top tech companies.
          </p>
        </div>

        {(user?.role === 'ALUMNI' || user?.role === 'ADMIN') && (
          <button
            onClick={() => setShowPostJobModal(true)}
            className="btn btn-primary"
            style={{ background: '#0284c7', borderColor: '#0284c7' }}
          >
            <Plus size={16} /> Post Internal Job Referral
          </button>
        )}
      </div>

      {/* In-Page Job Referral Search Bar */}
      <div style={{ marginBottom: '1.75rem', maxWidth: '640px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} color="var(--text-subtle)" style={{ position: 'absolute', left: '1rem' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search job drives by title, company, skills, or location (e.g. SDE, Google, React)..."
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

      {/* Job Referral Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading real-time job referral drives...
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          {searchQuery ? `No active job referral drives found matching "${searchQuery}".` : 'No active job referral drives posted yet. Alumni mentors can post hiring drives above!'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(370px, 1fr))', gap: '1.5rem' }}>
          {filteredJobs.map(job => {
            const hasApplied = appliedJobIds.includes(job.id);
            const resolvedFileUrl = job.file_url ? getAssetUrl(job.file_url) : null;

            return (
              <div
                key={job.id}
                className="glass-panel glass-panel-glow"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
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

                  {/* Attached Job Description Document Link */}
                  {resolvedFileUrl && (
                    <div
                      style={{
                        margin: '0.75rem 0 1rem',
                        padding: '0.65rem 0.85rem',
                        background: 'rgba(99, 102, 241, 0.08)',
                        borderRadius: '8px',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                        <FileText size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                        <span
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: 'var(--text-main)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {job.file_name || 'Job Description (JD)'}
                        </span>
                      </div>
                      <a
                        href={resolvedFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm"
                        style={{
                          fontSize: '0.725rem',
                          padding: '0.3rem 0.65rem',
                          background: 'var(--primary)',
                          color: '#ffffff',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          borderRadius: '6px',
                          flexShrink: 0
                        }}
                      >
                        <Download size={13} /> View JD
                      </a>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.25rem' }}>
                    {(job.skills || []).map(s => (
                      <span key={s} className="badge badge-purple" style={{ fontSize: '0.7rem' }}>{s}</span>
                    ))}
                  </div>
                </div>

                <div style={{ paddingTop: '0.85rem', borderTop: '1px solid var(--border-card)' }}>
                  {user?.role === 'STUDENT' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button onClick={() => setApplicationJob(job)} disabled={hasApplied} className={`btn btn-sm ${hasApplied ? 'btn-secondary' : 'btn-primary'}`} style={{ width: '100%' }}>
                        {hasApplied ? <><CheckCircle2 size={14} color="#059669" /> Referral Requested</> : <><Send size={14} /> Request Internal Referral</>}
                      </button>
                    </div>
                  ) : user?.role === 'ALUMNI' && job.is_owner ? (
                    <button onClick={() => setApplicantsJob(job)} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                      <Users size={14} /> View applicants ({incomingApplications.filter(a => String(a.job_id) === String(job.id)).length})
                    </button>
                  ) : (
                    <div className="btn btn-secondary btn-sm" style={{ width: '100%', textAlign: 'center' }}>Active Alumni Referral Drive</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Referral Modal */}
      {applicationJob && (
        <div className="modal-overlay" onClick={() => !submittingApplication && setApplicationJob(null)}>
          <form className="modal-content" onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); handleApplyReferral(applicationJob); }} style={{ maxWidth: '520px', width: '92%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
              <div><h3 style={{ color: 'var(--text-main)', margin: 0 }}>Request Internal Referral</h3><p style={{ color: 'var(--text-muted)', margin: '0.35rem 0 0' }}>{applicationJob.title} • {applicationJob.company}</p></div>
              <button type="button" className="btn btn-secondary btn-sm" disabled={submittingApplication} onClick={() => setApplicationJob(null)}><X size={16} /></button>
            </div>
            <label className="form-label" htmlFor="referral-resume">Resume <span style={{ color: 'var(--accent-rose)' }}>*</span></label>
            <input id="referral-resume" type="file" accept=".pdf,.doc,.docx" required onChange={e => setResumeFiles(current => ({ ...current, [applicationJob.id]: e.target.files?.[0] || null }))} />
            {resumeFiles[applicationJob.id] && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.4rem 0' }}>{resumeFiles[applicationJob.id].name}</p>}
            <label className="form-label" htmlFor="referral-message" style={{ display: 'block', marginTop: '1rem' }}>Message to mentor</label>
            <textarea id="referral-message" value={applicationMessages[applicationJob.id] || ''} onChange={e => setApplicationMessages(current => ({ ...current, [applicationJob.id]: e.target.value }))} placeholder="Introduce yourself and explain why you are interested." rows={4} maxLength={3000} className="form-input" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" disabled={submittingApplication} onClick={() => setApplicationJob(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={submittingApplication || !resumeFiles[applicationJob.id]}>{submittingApplication ? 'Sending…' : 'Send request'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Post Referral Modal */}
      {applicantsJob && (
        <div className="modal-overlay" onClick={() => setApplicantsJob(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px', width: '92%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div><h3 style={{ color: 'var(--text-main)' }}>Applicants</h3><p style={{ color: 'var(--text-muted)' }}>{applicantsJob.title} • {applicantsJob.company}</p></div>
              <button type="button" onClick={() => setApplicantsJob(null)} className="btn btn-secondary btn-sm"><X size={16} /></button>
            </div>
            {incomingApplications.filter(a => String(a.job_id) === String(applicantsJob.id)).length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No students have applied yet.</p>
            ) : incomingApplications.filter(a => String(a.job_id) === String(applicantsJob.id)).map(applicant => (
              <div key={applicant.id} style={{ padding: '0.85rem', border: '1px solid var(--border-card)', borderRadius: '10px', marginTop: '0.5rem' }}>
                <strong style={{ color: 'var(--text-main)' }}>{applicant.student_name}</strong>
                <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0' }}>{applicant.student_email}</p>
                {applicant.message && <p style={{ color: 'var(--text-main)', margin: '0.5rem 0', whiteSpace: 'pre-wrap' }}>{applicant.message}</p>}
                {applicant.resume_url && <a href={getAssetUrl(applicant.resume_url)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', margin: '0.25rem 0' }}><Download size={14} /> View {applicant.resume_name || 'Resume'}</a>}
                <span className={`badge ${applicant.status === 'APPROVED' ? 'badge-emerald' : applicant.status === 'REJECTED' ? 'badge-rose' : 'badge-cyan'}`}>
                  {applicant.status || 'PENDING'}
                </span>
                {applicant.status === 'PENDING' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.65rem', width: '100%' }}>
                    <button type="button" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} disabled={updatingApplicationId === applicant.id} onClick={() => handleReviewApplicant(applicant, 'APPROVED')}>
                      {updatingApplicationId === applicant.id ? 'Saving…' : 'Accept referral'}
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }} disabled={updatingApplicationId === applicant.id} onClick={() => handleReviewApplicant(applicant, 'REJECTED')}>
                      {updatingApplicationId === applicant.id ? 'Saving…' : 'Reject referral'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Post Referral Modal */}
      {showPostJobModal && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setShowPostJobModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 800 }}>Post Internal Referral Opening</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Share job openings with students, attach full job descriptions (JD), and refer top candidates.</p>
              </div>
              <button onClick={() => setShowPostJobModal(false)} disabled={isSubmitting} className="btn btn-secondary btn-sm"><X size={16} /></button>
            </div>

            <form onSubmit={handleCreateJob}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Job Title <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Software Development Engineer (SDE-1)"
                  value={newJobForm.title}
                  onChange={(e) => setNewJobForm({ ...newJobForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      Company Name <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Google / Microsoft / Zoho"
                      value={newJobForm.company}
                      onChange={(e) => setNewJobForm({ ...newJobForm, company: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      Location <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Bengaluru / Chennai / Remote"
                      value={newJobForm.location}
                      onChange={(e) => setNewJobForm({ ...newJobForm, location: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      Experience Required
                    </label>
                    <select
                      className="form-input"
                      value={newJobForm.experienceReq}
                      onChange={(e) => setNewJobForm({ ...newJobForm, experienceReq: e.target.value })}
                    >
                      <option value="0 - 1 Yr">0 - 1 Yr (Fresher / Entry)</option>
                      <option value="1 - 3 Yrs">1 - 3 Yrs (Junior / Associate)</option>
                      <option value="3 - 5 Yrs">3 - 5 Yrs (Mid-Level)</option>
                      <option value="5+ Yrs">5+ Yrs (Senior / Lead)</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      Key Skills <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. React, Node.js, Python, AWS"
                      value={newJobForm.skills}
                      onChange={(e) => setNewJobForm({ ...newJobForm, skills: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Description & Referral Guidelines <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span>
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Details about team, expectations, interview rounds, and referral process..."
                  value={newJobForm.description}
                  onChange={(e) => setNewJobForm({ ...newJobForm, description: e.target.value })}
                  required
                />
              </div>

              {/* Job Description File Attachment Field */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Paperclip size={15} color="var(--primary)" />
                  Job Description Document (JD Attachment)
                </label>
                
                <div
                  style={{
                    border: '2px dashed var(--border-card)',
                    borderRadius: '10px',
                    padding: '1rem',
                    textAlign: 'center',
                    background: 'var(--bg-subtle)',
                    transition: 'border-color 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <input
                    type="file"
                    id="jdFileInput"
                    accept=".pdf,.doc,.docx,.txt,.rtf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.25rem 0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textAlign: 'left', overflow: 'hidden' }}>
                        <FileText size={22} color="var(--primary)" style={{ flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '340px' }}>
                            {selectedFile.name}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', margin: 0 }}>
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload to Cloudinary
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.25rem 0.5rem', zIndex: 2 }}
                      >
                        <X size={14} /> Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload size={24} color="var(--text-subtle)" style={{ marginBottom: '0.35rem' }} />
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 0.2rem' }}>
                        Click or drag to attach Job Description (.pdf, .docx, images)
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', margin: 0 }}>
                        Maximum file size: 50MB • Automatically backed up to Cloudinary
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setShowPostJobModal(false)}
                  disabled={isSubmitting}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {isSubmitting ? 'Uploading & Publishing...' : 'Publish Job Referral'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
