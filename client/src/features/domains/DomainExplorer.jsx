import { useState, useEffect } from 'react';
import { apiClient, getAssetUrl } from '../../shared/services/api';
import { useAuth } from '../../shared/context/useAuth';
import { useNotification } from '../../shared/context/useNotification';
import { RequestDomainModal } from './RequestDomainModal';
import {
  Code,
  Layers,
  Database,
  Cloud,
  Cpu,
  Shield,
  Smartphone,
  Globe,
  Terminal,
  Server,
  Plus,
  Users,
  User,
  Award,
  CheckCircle2,
  Send,
  X,
  ChevronRight,
  AlertTriangle,
  Compass,
  Trash2,
  ArrowLeft,
  Download,
  BookOpen,
  Building,
  ExternalLink,
  RefreshCw,
  Search
} from 'lucide-react';

const ICON_MAP = {
  Code: Code,
  Layers: Layers,
  Database: Database,
  Cloud: Cloud,
  Cpu: Cpu,
  Shield: Shield,
  Smartphone: Smartphone,
  Globe: Globe,
  Terminal: Terminal,
  Server: Server
};

export const DomainExplorer = ({ onOpenCreateDomain, onRequestMentorship, searchQuery = '' }) => {
  const { user, refreshUser } = useAuth();
  const { showNotification } = useNotification();
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [internalSearch, setInternalSearch] = useState(searchQuery || '');

  const [isRequestDomainOpen, setIsRequestDomainOpen] = useState(false);

  // Drill-down selected domain view state
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [domainDetails, setDomainDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailTab, setDetailTab] = useState('materials'); // 'materials' | 'mentors'

  // Student domain interests & Alumni expertise tracks
  const [studentInterests, setStudentInterests] = useState(() => {
    return user?.profile?.interests || user?.interests || [];
  });

  const [alumniExpertise, setAlumniExpertise] = useState(() => {
    return user?.profile?.expertise || user?.expertise || [];
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const ints = user?.profile?.interests || user?.interests;
      if (Array.isArray(ints)) {
        setStudentInterests(ints);
      }
      const exps = user?.profile?.expertise || user?.expertise;
      if (Array.isArray(exps)) {
        setAlumniExpertise(exps);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [user]);

  // Confirmation modal state for removing domain ({ domain, roleType: 'STUDENT' | 'ALUMNI' })
  const [confirmRemoveModal, setConfirmRemoveModal] = useState(null);

  const fetchDomains = async () => {
    try {
      const res = await apiClient('/domains');
      setDomains(res.data || []);
    } catch (err) {
      console.error('Failed to load domains:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchDomains(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // 1. Student Track Interest Handlers
  const executeToggleStudentInterest = async (domainId) => {
    const isCurrentlyInterested = studentInterests.includes(domainId);
    const updated = isCurrentlyInterested
      ? studentInterests.filter(id => id !== domainId)
      : [...studentInterests, domainId];

    setStudentInterests(updated);

    try {
      const res = await apiClient(`/domains/${domainId}/interests`, { method: 'POST' });
      if (res.data?.interests) {
        setStudentInterests(res.data.interests);
      }
      showNotification(res.message || (isCurrentlyInterested ? 'Removed domain interest' : 'Added to your domain interests!'), 'success');
      fetchDomains();
      refreshUser?.();
    } catch (err) {
      setStudentInterests(studentInterests);
      showNotification(err.message, 'error');
    }
  };

  const handleStudentInterestClick = (domain, e) => {
    e.stopPropagation();
    const isCurrentlyInterested = studentInterests.includes(domain.id);
    if (isCurrentlyInterested) {
      // Open confirmation popup modal before removing
      setConfirmRemoveModal({ domain, roleType: 'STUDENT' });
    } else {
      executeToggleStudentInterest(domain.id);
    }
  };

  // 2. Mentor Offer Mentorship Handlers
  const executeToggleAlumniExpertise = async (domainId) => {
    const isCurrentlyExpert = alumniExpertise.includes(domainId);
    const updated = isCurrentlyExpert
      ? alumniExpertise.filter(id => id !== domainId)
      : [...alumniExpertise, domainId];

    setAlumniExpertise(updated);

    try {
      const res = await apiClient(`/domains/${domainId}/expertise`, { method: 'POST' });
      if (res.data?.expertise) {
        setAlumniExpertise(res.data.expertise);
      }
      showNotification(res.message || (isCurrentlyExpert ? 'Removed mentorship track' : 'Mentorship track activated! Students can now connect with you in this domain.'), 'success');
      fetchDomains();
      refreshUser?.();
    } catch (err) {
      setAlumniExpertise(alumniExpertise);
      showNotification(err.message, 'error');
    }
  };

  const handleAlumniExpertiseClick = (domain, e) => {
    e.stopPropagation();
    const isCurrentlyExpert = alumniExpertise.includes(domain.id);
    if (isCurrentlyExpert) {
      // Open confirmation popup modal before removing
      setConfirmRemoveModal({ domain, roleType: 'ALUMNI' });
    } else {
      executeToggleAlumniExpertise(domain.id);
    }
  };

  const handleConfirmRemove = () => {
    if (!confirmRemoveModal) return;
    const { domain, roleType } = confirmRemoveModal;
    if (roleType === 'STUDENT') {
      executeToggleStudentInterest(domain.id);
    } else if (roleType === 'ALUMNI') {
      executeToggleAlumniExpertise(domain.id);
    }
    setConfirmRemoveModal(null);
  };

  const handleOpenDomain = async (domain) => {
    setSelectedDomain(domain);
    setLoadingDetails(true);
    setDetailTab('materials');
    try {
      const res = await apiClient(`/domains/${domain.id}/details`);
      setDomainDetails(res.data);
    } catch (err) {
      console.warn('Failed to load domain details:', err);
      setDomainDetails({ domain, resources: [], mentors: [] });
    } finally {
      setLoadingDetails(false);
    }
  };

  const categories = ['ALL', ...new Set(domains.map(d => d.category || 'General'))];

  const effectiveQuery = (internalSearch || searchQuery || '').toLowerCase().trim();

  const filteredDomains = domains.filter(d => {
    const matchesCategory = selectedCategory === 'ALL' || d.category === selectedCategory;
    if (!effectiveQuery) return matchesCategory;

    const matchesDomainName = d.name && d.name.toLowerCase().includes(effectiveQuery);
    const matchesCategoryName = d.category && d.category.toLowerCase().includes(effectiveQuery);
    const matchesDesc = d.description && d.description.toLowerCase().includes(effectiveQuery);
    
    // Match offering mentors by name, company, or designation
    const matchesMentor = Array.isArray(d.mentors) && d.mentors.some(m => 
      (m.name && m.name.toLowerCase().includes(effectiveQuery)) ||
      (m.company && m.company.toLowerCase().includes(effectiveQuery)) ||
      (m.designation && m.designation.toLowerCase().includes(effectiveQuery))
    );

    return matchesCategory && (matchesDomainName || matchesCategoryName || matchesDesc || matchesMentor);
  });

  // =========================================================================
  // VIEW 1: DOMAIN DRILL-DOWN DETAIL HUB (STUDY MATERIALS & MENTORS)
  // =========================================================================
  if (selectedDomain) {
    const IconComp = ICON_MAP[selectedDomain.icon] || Code;
    const isStudentInterested = studentInterests.includes(selectedDomain.id);
    const isAlumniExpert = alumniExpertise.includes(selectedDomain.id);
    const domainResources = domainDetails?.resources || [];
    const domainMentors = domainDetails?.mentors || [];

    return (
      <div style={{ maxWidth: '1280px', margin: '1.5rem auto', padding: '0 1.5rem' }}>
        
        {/* Navigation Breadcrumb & Back Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>Master Entries</span>
            <span>›</span>
            <button
              onClick={() => { setSelectedDomain(null); setDomainDetails(null); }}
              style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
            >
              Technical Domain Directory
            </button>
            <span>›</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{selectedDomain.name}</span>
          </div>

          <button
            onClick={() => { setSelectedDomain(null); setDomainDetails(null); }}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeft size={14} /> Back to Directory
          </button>
        </div>

        {/* Domain Detail Header Hero */}
        <div
          className="glass-panel"
          style={{
            padding: '2rem',
            borderRadius: '18px',
            marginBottom: '2rem',
            border: '1px solid var(--border-card)',
            background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(99, 102, 241, 0.05) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <IconComp size={34} color="var(--primary)" />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
                    {selectedDomain.name}
                  </h1>
                  <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                    {selectedDomain.category || 'Core Engineering'}
                  </span>
                  <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                    High Placement Demand
                  </span>
                </div>
                <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', lineHeight: '1.6', maxWidth: '750px', margin: 0 }}>
                  {selectedDomain.description}
                </p>
              </div>
            </div>

            {/* Quick Action Toggle in Header */}
            <div>
              {user?.role === 'STUDENT' && (
                <button
                  onClick={(e) => handleStudentInterestClick(selectedDomain, e)}
                  className={`btn ${isStudentInterested ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
                >
                  {isStudentInterested ? <><CheckCircle2 size={16} color="var(--accent-emerald)" /> Interested Domain</> : <><Plus size={16} /> Track My Interest</>}
                </button>
              )}

              {user?.role === 'ALUMNI' && (
                <button
                  onClick={(e) => handleAlumniExpertiseClick(selectedDomain, e)}
                  className={`btn ${isAlumniExpert ? 'btn-secondary' : 'btn-primary'}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.85rem',
                    background: isAlumniExpert ? 'var(--bg-subtle)' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    borderColor: isAlumniExpert ? 'var(--border-card)' : '#059669',
                    color: isAlumniExpert ? 'var(--accent-emerald)' : '#ffffff'
                  }}
                >
                  {isAlumniExpert ? <><CheckCircle2 size={16} color="var(--accent-emerald)" /> Mentoring Track Active</> : <><Plus size={16} /> Offer Mentorship</>}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Drill-Down Section Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border-card)', paddingBottom: '0.75rem', marginBottom: '1.75rem' }}>
          <button
            onClick={() => setDetailTab('materials')}
            className={`btn ${detailTab === 'materials' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <BookOpen size={16} />
            Uploaded Study Materials & Resources
            <span
              style={{
                background: detailTab === 'materials' ? 'rgba(255,255,255,0.2)' : 'var(--bg-card)',
                padding: '0.1rem 0.45rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              {domainResources.length}
            </span>
          </button>

          <button
            onClick={() => setDetailTab('mentors')}
            className={`btn ${detailTab === 'mentors' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <Users size={16} />
            Alumni Mentors Offering Guidance
            <span
              style={{
                background: detailTab === 'mentors' ? 'rgba(255,255,255,0.2)' : 'var(--bg-card)',
                padding: '0.1rem 0.45rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              {domainMentors.length}
            </span>
          </button>
        </div>

        {/* Content Area */}
        {loadingDetails ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <RefreshCw size={26} className="spin" style={{ marginBottom: '1rem' }} />
            <p>Loading domain study materials & verified alumni mentors...</p>
          </div>
        ) : (
          <div>
            
            {/* SUB-TAB 1: UPLOADED STUDY MATERIALS & RESOURCES */}
            {detailTab === 'materials' && (
              <div>
                {domainResources.length === 0 ? (
                  <div className="glass-panel" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '16px' }}>
                    <BookOpen size={44} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                      No Study Materials Uploaded Yet
                    </h3>
                    <p style={{ fontSize: '0.875rem', maxWidth: '520px', margin: '0 auto 1.25rem' }}>
                      Verified alumni mentors can upload study materials, interview guides, and system designs for <strong>{selectedDomain.name}</strong> under Study Resources.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                    {domainResources.map((res) => {
                      const fileUrl = res.file_url ? getAssetUrl(res.file_url) : null;
                      const isPdf = res.file_url && res.file_url.toLowerCase().includes('.pdf');
                      const dateStr = res.created_at ? new Date(res.created_at).toLocaleDateString() : 'Recent';

                      return (
                        <div
                          key={res.id}
                          className="glass-panel"
                          style={{
                            padding: '1.4rem',
                            borderRadius: '14px',
                            border: '1px solid var(--border-card)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            background: 'var(--bg-card)'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                              <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                                {isPdf ? 'PDF Guide' : 'Learning Material'}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                                {dateStr}
                              </span>
                            </div>

                            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                              {res.title}
                            </h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '1rem' }}>
                              {res.description || 'Curated technical preparation material shared for student career guidance.'}
                            </p>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                              <User size={14} color="var(--primary)" />
                              <span>Shared by: <strong>{res.mentor_name}</strong></span>
                            </div>
                          </div>

                          <div style={{ paddingTop: '0.85rem', borderTop: '1px solid var(--border-card)', display: 'flex', gap: '0.5rem' }}>
                            {fileUrl && (
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary btn-sm"
                                style={{
                                  flex: 1,
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.4rem',
                                  fontSize: '0.8rem'
                                }}
                              >
                                <Download size={14} /> Download / View Resource
                              </a>
                            )}

                            {res.external_link && (
                              <a
                                href={res.external_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary btn-sm"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  fontSize: '0.8rem'
                                }}
                              >
                                <ExternalLink size={14} /> External Link
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 2: VERIFIED ALUMNI MENTORS OFFERING GUIDANCE */}
            {detailTab === 'mentors' && (
              <div>
                {domainMentors.length === 0 ? (
                  <div className="glass-panel" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '16px' }}>
                    <Users size={44} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                      No Alumni Mentors Registered in this Domain Yet
                    </h3>
                    <p style={{ fontSize: '0.875rem', maxWidth: '520px', margin: '0 auto 1.25rem' }}>
                      Alumni working in <strong>{selectedDomain.name}</strong> can activate their mentorship track to appear here and guide students.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                    {domainMentors.map((mentor) => {
                      const profile = mentor.profile || {};
                      const levelInfo = mentor.level_info || {};
                      const companyTier = mentor.company_tier || {};
                      const availableSlots = profile.available_slots !== undefined ? profile.available_slots : 3;

                      return (
                        <div
                          key={mentor.id}
                          className="glass-panel"
                          style={{
                            padding: '1.4rem',
                            borderRadius: '16px',
                            border: '1px solid var(--border-card)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            background: 'var(--bg-card)'
                          }}
                        >
                          <div>
                            {/* Avatar & Badges Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div
                                  style={{
                                    width: '46px',
                                    height: '46px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)',
                                    color: '#ffffff',
                                    fontWeight: 800,
                                    fontSize: '1.1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  {mentor.name ? mentor.name.charAt(0).toUpperCase() : 'M'}
                                </div>
                                <div>
                                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                                    {mentor.name}
                                  </h4>
                                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                                    {profile.designation || 'Software Engineer'} • <strong style={{ color: 'var(--text-main)' }}>{profile.company || 'Tech Leader'}</strong>
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Evaluation Badges (Seniority Level & Company Tier) */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.85rem' }}>
                              {levelInfo.badge && (
                                <span className="badge badge-purple" style={{ fontSize: '0.725rem', fontWeight: 700 }}>
                                  <Award size={12} /> {levelInfo.badge}
                                </span>
                              )}
                              {companyTier.tier_badge && (
                                <span className="badge badge-cyan" style={{ fontSize: '0.725rem', fontWeight: 700 }}>
                                  <Building size={12} /> {companyTier.tier_badge}
                                </span>
                              )}
                              <span className="badge badge-emerald" style={{ fontSize: '0.725rem' }}>
                                <CheckCircle2 size={12} /> Verified Alumni
                              </span>
                            </div>

                            {/* Experience and Capacity info */}
                            <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-card)', marginBottom: '1.1rem', fontSize: '0.8rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                                <span style={{ color: 'var(--text-subtle)' }}>Industry Experience:</span>
                                <strong style={{ color: 'var(--text-main)' }}>{profile.experience_years || 2}+ Years</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-subtle)' }}>Mentorship Capacity:</span>
                                <strong style={{ color: availableSlots > 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                                  {availableSlots > 0 ? `${availableSlots} Slots Available` : 'Capacity Full'}
                                </strong>
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div style={{ paddingTop: '0.85rem', borderTop: '1px solid var(--border-card)' }}>
                            {user?.id === mentor.id ? (
                              <button className="btn btn-secondary btn-sm" disabled style={{ width: '100%', fontSize: '0.825rem' }}>
                                Your Mentor Profile
                              </button>
                            ) : (
                              <button
                                onClick={() => onRequestMentorship && onRequestMentorship(mentor)}
                                disabled={availableSlots <= 0}
                                className="btn btn-primary btn-sm"
                                style={{
                                  width: '100%',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.45rem',
                                  fontSize: '0.825rem',
                                  fontWeight: 600,
                                  cursor: availableSlots <= 0 ? 'not-allowed' : 'pointer'
                                }}
                              >
                                <Send size={14} /> Request Mentorship Guidance
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    );
  }

  // =========================================================================
  // VIEW 2: MASTER TECHNICAL DOMAIN DIRECTORY GRID
  // =========================================================================
  return (
    <div style={{ maxWidth: '1280px', margin: '1.5rem auto', padding: '0 1.5rem' }}>
      
      {/* Breadcrumb Trail */}
      <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginBottom: '0.75rem' }}>
        Master Entries <span style={{ margin: '0 0.35rem' }}>›</span> <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Technical Domain Directory</span>
      </div>

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>Technical Domain Directory</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Click any domain to explore uploaded study materials and verified alumni mentors offering guidance.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {user && (user.role === 'ALUMNI' || user.role === 'STUDENT') && (
            <button onClick={() => setIsRequestDomainOpen(true)} className="btn btn-secondary" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
              <Plus size={16} /> Request New Technical Domain
            </button>
          )}

          {user?.role === 'ADMIN' && (
            <button onClick={onOpenCreateDomain} className="btn btn-primary" style={{ background: '#0284c7', borderColor: '#0284c7' }}>
              <Plus size={16} /> Add Technical Domain
            </button>
          )}
        </div>
      </div>

      {/* In-Page Technical Domain Search Bar */}
      <div style={{ marginBottom: '1.25rem', maxWidth: '640px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} color="var(--text-subtle)" style={{ position: 'absolute', left: '1rem' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search domain, skill, technology, or mentor name (e.g. Cloud, Python, Sarah)..."
            value={internalSearch}
            onChange={(e) => setInternalSearch(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '2.75rem',
              paddingRight: '2.5rem',
              height: '44px',
              borderRadius: '12px',
              fontSize: '0.875rem',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-card)'
            }}
          />
          {internalSearch && (
            <button
              onClick={() => setInternalSearch('')}
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

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '2rem' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              borderRadius: '9999px',
              padding: '0.35rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Domain Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <p>Loading technical domain directory...</p>
        </div>
      ) : filteredDomains.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-card)' }}>
          <Compass size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
          <h3>No domains found</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Click "+ Request New Technical Domain" to propose a domain.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {filteredDomains.map(domain => {
            const IconComp = ICON_MAP[domain.icon] || Code;
            const isStudentInterested = studentInterests.includes(domain.id);
            const isAlumniExpert = alumniExpertise.includes(domain.id);

            return (
              <div
                key={domain.id}
                onClick={() => handleOpenDomain(domain)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-card)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconComp size={22} color="var(--primary)" />
                    </div>
                    <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                      {domain.category || 'Core Engineering'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{domain.name}</span>
                    <ChevronRight size={16} color="var(--text-subtle)" />
                  </h3>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                    {domain.description}
                  </p>

                  {/* Matched Mentor Badge if search matched a mentor */}
                  {Array.isArray(domain.mentors) && domain.mentors.length > 0 && effectiveQuery && domain.mentors.some(m => (m.name && m.name.toLowerCase().includes(effectiveQuery)) || (m.company && m.company.toLowerCase().includes(effectiveQuery))) && (
                    <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '0.4rem 0.6rem', borderRadius: '6px', marginBottom: '0.75rem', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                      ⭐ Matched Mentor: {domain.mentors.filter(m => (m.name && m.name.toLowerCase().includes(effectiveQuery)) || (m.company && m.company.toLowerCase().includes(effectiveQuery))).map(m => `${m.name} (${m.company || 'Alumni'})`).join(', ')}
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--border-card)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                      <strong>{domain.stats?.available_mentors || 1}</strong> Mentors Offering Guidance
                    </div>

                    {/* STUDENT ACTION BUTTON */}
                    {user?.role === 'STUDENT' && (
                      <button
                        onClick={(e) => handleStudentInterestClick(domain, e)}
                        className={`btn btn-sm ${isStudentInterested ? 'btn-secondary' : 'btn-primary'}`}
                        style={{
                          fontSize: '0.75rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        {isStudentInterested ? <CheckCircle2 size={14} color="var(--accent-emerald)" /> : <Plus size={14} />}
                        {isStudentInterested ? 'Interested' : 'Track Interest'}
                      </button>
                    )}

                    {/* ALUMNI MENTOR ACTION BUTTON */}
                    {user?.role === 'ALUMNI' && (
                      <button
                        onClick={(e) => handleAlumniExpertiseClick(domain, e)}
                        className={`btn btn-sm ${isAlumniExpert ? 'btn-secondary' : 'btn-primary'}`}
                        style={{
                          fontSize: '0.75rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          background: isAlumniExpert ? 'var(--bg-subtle)' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                          borderColor: isAlumniExpert ? 'var(--border-card)' : '#059669',
                          color: isAlumniExpert ? 'var(--accent-emerald)' : '#ffffff'
                        }}
                      >
                        {isAlumniExpert ? <CheckCircle2 size={14} color="var(--accent-emerald)" /> : <Plus size={14} />}
                        {isAlumniExpert ? 'Mentoring Track Active' : 'Offer Mentorship'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Popup Modal for Domain Removal */}
      {confirmRemoveModal && (
        <div
          className="modal-overlay"
          onClick={() => setConfirmRemoveModal(null)}
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
            justifyContent: 'center',
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(6px)',
            padding: '1.5rem'
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '460px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              borderRadius: '20px',
              boxShadow: 'var(--shadow-lg)',
              padding: '1.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={22} color="#dc2626" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Remove Domain Track?
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Confirm removal of domain track
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5, marginBottom: '1.5rem', background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
              Are you sure you want to remove <strong>"{confirmRemoveModal.domain.name}"</strong> from your {confirmRemoveModal.roleType === 'STUDENT' ? 'career interest tracks' : 'active mentorship offerings'}?
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmRemoveModal(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleConfirmRemove} className="btn btn-danger">
                <Trash2 size={15} /> Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mentor Domain Request Modal */}
      <RequestDomainModal
        isOpen={isRequestDomainOpen}
        onClose={() => setIsRequestDomainOpen(false)}
        onSuccess={fetchDomains}
      />
    </div>
  );
};
