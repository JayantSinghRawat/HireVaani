import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const ROLES = [
  { value: 'software_engineer',   label: 'Software Engineer' },
  { value: 'data_analyst',        label: 'Data Analyst' },
  { value: 'marketing_executive', label: 'Marketing Executive' },
  { value: 'hr_executive',        label: 'HR Executive' },
  { value: 'sales_executive',     label: 'Sales Executive' },
  { value: 'customer_support',    label: 'Customer Support' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'kn', label: 'Kannada' },
];



export default function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: 'User', email: '' });
  const [interviews, setInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [now, setNow] = useState(new Date());

  const [form, setForm] = useState({ name: '', email: '', role: '', language: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showNotifications, setShowNotifications] = useState(false);
  const notifications = [
    { id: 1, title: 'Interview Reminder', message: 'Your TechCorp India interview starts in 10 minutes.', time: 'Just now', unread: true },
    { id: 2, title: 'Upcoming Interview', message: 'DataWiz Analytics interview scheduled for tomorrow.', time: '2 hours ago', unread: true },
    { id: 3, title: 'Profile Update', message: 'Your resume was parsed successfully.', time: '1 day ago', unread: false },
  ];

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('hv_user');
      if (userStr) {
        const parsed = JSON.parse(userStr);
        setUser(parsed);
        setForm(f => ({ ...f, name: parsed.name || '', email: parsed.email || '' }));
      }
    } catch (e) {
      // ignore
    }
    
    const fetchInterviews = async () => {
      try {
        const { data } = await axios.get(`${API}/interviews`);
        const parsed = data.map(i => ({
          ...i,
          date: new Date(i.date),
          id: i.id || i._id,
          progress: i.progress || '0%',
          resumeUploaded: i.resumeUploaded ?? true,
        }));
        setInterviews(parsed);
      } catch (err) {
        console.error(err);
      }
    };
    fetchInterviews();

    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleStart = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.role || !form.language) {
      setError('Please fill all required fields.');
      return;
    }
    setLoading(true); setError('');
    try {
      const { data } = await axios.post(`${API}/session`, form);
      navigate('/interview', { state: { sessionId: data.sessionId, ...form } });
    } catch {
      setError('Failed to create session. Please check your connection or server status.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hv_token');
    localStorage.removeItem('hv_user');
    navigate('/login');
  };

  const getGreeting = () => {
    const hour = now.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatCountdown = (targetDate) => {
    const diff = targetDate.getTime() - now.getTime();
    if (diff <= 0) return 'Starts now';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `In ${days}d ${hours}h`;
    if (hours > 0) return `In ${hours}h ${mins}m`;
    return `In ${mins}m`;
  };

  const isJoinable = (targetDate) => {
    const diff = targetDate.getTime() - now.getTime();
    return diff <= 15 * 60000; // Allow joining up to 15 mins before, and anytime after
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', color: '#111827', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Top Navigation - Linear/Stripe Inspired */}
      <nav className="ud-nav" style={{ 
        position: 'sticky', top: 0, zIndex: 100, 
        background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#111827' }}>HireVaani</span>
          <div style={{ width: 1, height: 16, background: '#E5E7EB' }}></div>
          <span className="ud-nav-badge" style={{ fontSize: '0.85rem', fontWeight: 500, color: '#6B7280', background: '#F3F4F6', padding: '4px 10px', borderRadius: '6px' }}>Candidate</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ position: 'relative', background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex' }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {notifications.some(n => n.unread) && (
                <span style={{ position: 'absolute', top: 0, right: 2, width: 6, height: 6, background: '#EF4444', borderRadius: '50%' }}></span>
              )}
            </button>

            {showNotifications && (
              <div className="ud-notif-dropdown" style={{ 
                position: 'absolute', top: 'calc(100% + 12px)', right: -10, width: 320, 
                background: '#FFFFFF',
                border: '1px solid #E5E7EB', borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                overflow: 'hidden', zIndex: 101
              }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>Notifications</h3>
                  <span style={{ fontSize: '0.75rem', color: '#4338CA', cursor: 'pointer' }}>Mark all as read</span>
                </div>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {notifications.map(n => (
                    <div key={n.id} style={{ 
                      padding: '16px', borderBottom: '1px solid #F3F4F6', 
                      background: n.unread ? '#EEF2FF' : 'transparent',
                      display: 'flex', gap: 12, alignItems: 'flex-start'
                    }}>
                      <div style={{ 
                        width: 8, height: 8, borderRadius: '50%', marginTop: 6,
                        background: n.unread ? '#4338CA' : 'transparent' 
                      }} />
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827', marginBottom: 4 }}>{n.title}</div>
                        <div style={{ fontSize: '0.8rem', color: '#4B5563', lineHeight: 1.4 }}>{n.message}</div>
                        <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: 8 }}>{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid #E5E7EB', background: '#F9FAFB' }}>
                  <button style={{ background: 'transparent', border: 'none', color: '#6B7280', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500 }}>View all notifications</button>
                </div>
              </div>
            )}
          </div>

          <div style={{ width: 1, height: 16, background: '#E5E7EB' }}></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ 
              width: 32, height: 32, borderRadius: '50%', background: '#E0E7FF', color: '#4338CA', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 600 
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }} title="Sign Out">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <main className="ud-main" style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 24px 80px' }}>
        
        {/* Hero Section */}
        <div className="ud-hero" style={{ marginBottom: 48 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#111827', marginBottom: 8 }}>
            {getGreeting()}, {user.name.split(' ')[0]}
          </h1>
          <p style={{ fontSize: '1rem', color: '#6B7280' }}>
            You have {interviews.length} upcoming interview{interviews.length !== 1 ? 's' : ''} scheduled.
          </p>
        </div>

        {/* Upcoming Interviews Grid */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151' }}>Upcoming Interviews</h2>
            <button style={{ background: 'transparent', border: 'none', color: '#6B7280', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>View all →</button>
          </div>

          <div className="ud-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: 24 
          }}>
            {interviews.map((iv) => {
              const roleLabel = ROLES.find(r => r.value === iv.role)?.label || iv.role;
              const joinable = isJoinable(iv.date);
              
              return (
                <div key={iv.id} style={{ 
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04)',
                  display: 'flex', flexDirection: 'column',
                  transition: 'all 0.2s',
                  overflow: 'hidden'
                }}>
                  
                  {/* Card Body */}
                  <div style={{ padding: '24px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '8px', background: '#F3F4F6', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 600 }}>
                          {iv.companyName.charAt(0)}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#111827', margin: 0 }}>{iv.companyName}</h3>
                          <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: 2 }}>{roleLabel}</div>
                        </div>
                      </div>
                      <span style={{ 
                        fontSize: '0.75rem', fontWeight: 500, padding: '4px 8px', borderRadius: '4px',
                        background: iv.status === 'Scheduled' ? '#ECFDF5' : '#FEF3C7',
                        color: iv.status === 'Scheduled' ? '#059669' : '#D97706',
                        border: `1px solid ${iv.status === 'Scheduled' ? '#D1FAE5' : '#FDE68A'}`
                      }}>
                        {iv.status}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, background: '#F9FAFB', padding: '16px', borderRadius: '8px' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 500, marginBottom: 4 }}>Date & Time</div>
                        <div style={{ fontSize: '0.85rem', color: '#111827', fontWeight: 500 }}>
                          {iv.date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 500, marginBottom: 4 }}>Countdown</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: joinable ? '#059669' : '#DC2626' }}>
                          {formatCountdown(iv.date)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div style={{ 
                    borderTop: '1px solid #E5E7EB', padding: '16px 24px', background: '#FFFFFF',
                    display: 'flex', gap: 12
                  }}>
                    <button 
                      onClick={() => setSelectedInterview(iv)}
                      style={{ 
                        flex: 1, background: '#FFFFFF', color: '#374151', border: '1px solid #D1D5DB',
                        padding: '8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 500,
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      View Details
                    </button>
                    <button 
                      disabled={!joinable}
                      onClick={() => {
                        setForm(f => ({ ...f, role: iv.role }));
                        setShowQuickStart(true);
                      }}
                      style={{ 
                        flex: 1, background: joinable ? '#111827' : '#F3F4F6', 
                        color: joinable ? '#FFFFFF' : '#9CA3AF', 
                        border: 'none', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 500,
                        cursor: joinable ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
                        boxShadow: joinable ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      {joinable ? 'Join Interview' : 'Not Ready'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* View Details Modal */}
      {selectedInterview && (
        <div className="ud-modal-overlay" style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999,
          background: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          animation: 'fadeIn 0.2s ease-out'
        }} onClick={() => setSelectedInterview(null)}>
          <div className="ud-modal-box" style={{ 
            background: '#FFFFFF', width: '100%', maxWidth: 640, borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="ud-modal-header" style={{ padding: '24px 32px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '10px', background: '#F3F4F6', color: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 600 }}>
                  {selectedInterview.companyName.charAt(0)}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0, marginBottom: 4 }}>{selectedInterview.companyName}</h2>
                  <div style={{ fontSize: '0.9rem', color: '#6B7280' }}>
                    {ROLES.find(r => r.value === selectedInterview.role)?.label} · {selectedInterview.mode}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedInterview(null)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 4 }}>✕</button>
            </div>
            
            {/* Modal Body */}
            <div className="ud-modal-body" style={{ padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ background: '#F3F4F6', color: '#374151', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 500 }}>
                  📅 {selectedInterview.date.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </span>
                <span style={{ background: selectedInterview.status === 'Scheduled' ? '#ECFDF5' : '#FEF3C7', color: selectedInterview.status === 'Scheduled' ? '#059669' : '#D97706', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 500 }}>
                  ✓ {selectedInterview.status}
                </span>
              </div>

              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827', marginBottom: 8 }}>Job Description</h4>
                <p style={{ fontSize: '0.9rem', color: '#4B5563', lineHeight: 1.6, margin: 0 }}>{selectedInterview.description}</p>
              </div>

              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827', marginBottom: 12 }}>Required Skills</h4>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {selectedInterview.requiredSkills.map(s => (
                    <span key={s} style={{ background: '#FFFFFF', border: '1px solid #D1D5DB', color: '#374151', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 500 }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '16px', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E40AF', marginBottom: 6 }}>Instructions</h4>
                <p style={{ fontSize: '0.85rem', color: '#1E3A8A', margin: 0, lineHeight: 1.5 }}>{selectedInterview.instructions}</p>
              </div>

              <div className="ud-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Resume Status</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500, color: selectedInterview.resumeUploaded ? '#059669' : '#D97706' }}>
                    {selectedInterview.resumeUploaded ? '✓ Uploaded & Parsed' : '⚠ Action Required'}
                  </div>
                </div>
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Progress</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#111827' }}>
                    {selectedInterview.progress} Complete
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="ud-modal-footer" style={{ padding: '20px 32px', background: '#F9FAFB', borderTop: '1px solid #E5E7EB', display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
              <button style={{ background: 'transparent', border: 'none', color: '#6B7280', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', marginRight: 'auto' }}>
                Need help?
              </button>
              <button style={{ background: '#FFFFFF', border: '1px solid #D1D5DB', color: '#374151', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
                Reschedule
              </button>
              <button 
                disabled={!isJoinable(selectedInterview.date)}
                onClick={() => {
                  setSelectedInterview(null);
                  setForm(f => ({ ...f, role: selectedInterview.role }));
                  setShowQuickStart(true);
                }}
                style={{ 
                  background: isJoinable(selectedInterview.date) ? '#111827' : '#F3F4F6', 
                  color: isJoinable(selectedInterview.date) ? '#FFFFFF' : '#9CA3AF', 
                  border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 500,
                  cursor: isJoinable(selectedInterview.date) ? 'pointer' : 'not-allowed'
                }}
              >
                Join Interview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Start Modal */}
      {showQuickStart && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999,
          background: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
        }} onClick={() => setShowQuickStart(false)}>
          <div style={{ 
            background: '#FFFFFF', width: '100%', maxWidth: 440, borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: 0 }}>Start Session</h3>
              <button onClick={() => setShowQuickStart(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 0 }}>✕</button>
            </div>
            
            <div style={{ padding: '32px' }}>
              <form id="start-form" onSubmit={handleStart}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: 6 }}>Full Name</label>
                  <input 
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required 
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
                    placeholder="Enter your full name" 
                  />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: 6 }}>Role Applying For</label>
                  <select 
                    value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} required
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', background: '#fff' }}
                  >
                    <option value="" disabled>Select a role...</option>
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: 8 }}>Interview Language</label>
                  <div className="lang-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {LANGUAGES.map(l => (
                      <button
                        key={l.value} type="button"
                        onClick={() => setForm(f => ({ ...f, language: l.value }))}
                        style={{
                          padding: '10px', borderRadius: '6px',
                          border: `1px solid ${form.language === l.value ? '#111827' : '#D1D5DB'}`,
                          background: form.language === l.value ? '#F3F4F6' : '#FFFFFF',
                          color: '#111827', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s'
                        }}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
                {error && <div style={{ padding: '10px 12px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: '6px', fontSize: '0.85rem', marginBottom: 20 }}>{error}</div>}
              </form>
            </div>
            
            <div style={{ padding: '20px 32px', background: '#F9FAFB', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setShowQuickStart(false)} style={{ background: '#FFFFFF', border: '1px solid #D1D5DB', color: '#374151', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
              <button form="start-form" type="submit" disabled={loading} style={{ background: '#111827', color: '#FFFFFF', border: 'none', padding: '8px 20px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Starting...' : 'Start Session'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 640px) {
          /* Navbar */
          .ud-nav { padding: 0 16px !important; height: 56px !important; }
          .ud-nav-badge { display: none !important; }
          .ud-start-btn { padding: 6px 10px !important; font-size: 0.8rem !important; }

          /* Main content */
          .ud-main { padding: 24px 16px 60px !important; }
          .ud-hero h1 { font-size: 1.5rem !important; }

          /* Modals — slide up from bottom on mobile */
          .ud-modal-box { border-radius: 16px 16px 0 0 !important; max-height: 95vh !important; }
          .ud-modal-overlay { align-items: flex-end !important; padding: 0 !important; }
          .ud-modal-header { padding: 16px 20px !important; }
          .ud-modal-body { padding: 20px !important; gap: 16px !important; }
          .ud-modal-footer { padding: 14px 20px !important; }
          .ud-modal-grid { grid-template-columns: 1fr !important; }

          /* Notification dropdown — full width on mobile */
          .ud-notif-dropdown { width: calc(100vw - 32px) !important; right: -60px !important; }
          .lang-grid { grid-template-columns: 1fr !important; }
          .ud-hero { margin-bottom: 32px !important; }
        }
      `}</style>
    </div>
  );
}
