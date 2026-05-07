import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
  const [history, setHistory] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [now, setNow] = useState(new Date());

  const [form, setForm] = useState({ name: '', email: '', role: '', language: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showNotifications, setShowNotifications] = useState(false);
  const notifications = [
    { id: 1, title: 'Profile Status', message: 'Your AI assessment profile is 85% complete.', time: 'Just now', unread: true },
    { id: 2, title: 'Tips for Success', message: 'Remember to look directly at the camera during your interview.', time: '2 hours ago', unread: true },
  ];

  useEffect(() => {
    const token = localStorage.getItem('hv_token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const userStr = localStorage.getItem('hv_user');
      if (userStr) {
        const parsed = JSON.parse(userStr);
        setUser(parsed);
        setForm(f => ({ ...f, name: parsed.name || '', email: parsed.email || '' }));
      }
    } catch (e) { /* ignore */ }
    
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        // Fetch upcoming interviews
        const resIv = await axios.get(`${API}/interviews`, { headers });
        const parsedIv = resIv.data.map(i => ({
          ...i,
          date: new Date(i.date),
          id: i.id || i._id,
          progress: i.progress || '0%',
        }));

        // Fetch history
        const resHist = await axios.get(`${API}/candidates/history`, { headers });
        setHistory(resHist.data);

        // Filter out upcoming interviews for roles already submitted
        const submittedRoles = new Set(resHist.data.map(h => h.role));
        const filteredIv = parsedIv.filter(iv => !submittedRoles.has(iv.role));
        
        setInterviews(filteredIv);
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };
    fetchData();

    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [navigate]);

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
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to create session.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hv_token');
    localStorage.removeItem('hv_user');
    navigate('/login');
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

  const isJoinable = (targetDate) => (targetDate.getTime() - now.getTime()) <= 15 * 60000;

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', color: '#111827', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Top Nav */}
      <nav style={{ 
        position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid #E5E7EB',
        padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827' }}>HireVaani</span>
          <span style={{ fontSize: '0.8rem', color: '#6B7280', background: '#F3F4F6', padding: '4px 10px', borderRadius: '6px' }}>Candidate</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => setShowNotifications(!showNotifications)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          </button>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#111827', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 600 }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>Logout</button>
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>Welcome back, {user.name.split(' ')[0]}</h1>
          <p style={{ color: '#6B7280' }}>Manage your interviews and track your AI performance insights.</p>
        </div>

        {/* Section 1: Upcoming */}
        <section style={{ marginBottom: 60 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Upcoming Interviews</h2>
          </div>
          {interviews.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
              <p style={{ color: '#6B7280', margin: 0 }}>No new interviews available for your role at this time.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
              {interviews.map(iv => (
                <div key={iv.id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{ROLES.find(r => r.value === iv.role)?.label || iv.role}</h3>
                        <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>{iv.companyName}</div>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '4px 8px', background: '#F3F4F6', color: '#000', borderRadius: '4px' }}>{iv.status}</span>
                    </div>
                    <div style={{ background: '#F9FAFB', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Starts: <b style={{ color: '#111827' }}>{formatCountdown(iv.date)}</b></div>
                      <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{iv.date.toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', background: '#F9FAFB', display: 'flex', gap: 12 }}>
                    <button onClick={() => setSelectedInterview(iv)} style={{ flex: 1, padding: '8px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>View Details</button>
                    <button 
                      onClick={() => { setForm(f => ({ ...f, role: iv.role })); setShowQuickStart(true); }}
                      style={{ flex: 1, padding: '8px', background: '#111827', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Start Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Submitted */}
        <section>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>Submitted Interviews</h2>
          {history.length === 0 ? (
            <div style={{ background: '#fff', border: '1px dashed #D1D5DB', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
              <p style={{ color: '#9CA3AF', margin: 0 }}>Your completed interviews will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
              {history.map(h => (
                <div key={h.sessionId} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{ROLES.find(r => r.value === h.role)?.label || h.role}</h3>
                        <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Completed on {new Date(h.createdAt).toLocaleDateString()}</div>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '4px 8px', background: '#F3F4F6', color: '#4B5563', borderRadius: '4px' }}>Submitted</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1, textAlign: 'center', padding: '10px', background: '#F9FAFB', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase', marginBottom: 4 }}>Score</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{h.overallScore || '—'}/10</div>
                      </div>
                      <div style={{ flex: 1, textAlign: 'center', padding: '10px', background: '#F9FAFB', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase', marginBottom: 4 }}>Trust</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{h.trustScore || '—'}%</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '12px 24px', background: '#F9FAFB', borderTop: '1px solid #E5E7EB' }}>
                    <Link to="/result" state={{ result: h }} style={{ display: 'block', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, color: '#4338CA', textDecoration: 'none' }}>View Full Result →</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Quick Start Modal (Copied from previous) */}
      {showQuickStart && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, background: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setShowQuickStart(false)}>
          <div style={{ background: '#FFFFFF', width: '100%', maxWidth: 440, borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: 0 }}>Start Session</h3>
              <button onClick={() => setShowQuickStart(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 0 }}>✕</button>
            </div>
            <div style={{ padding: '32px' }}>
              <form id="start-form" onSubmit={handleStart}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: 6 }}>Full Name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: 6 }}>Role</label>
                  {interviews.some(iv => iv.role === form.role) ? (
                    <input value={ROLES.find(r => r.value === form.role)?.label || form.role} readOnly style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', background: '#F9FAFB', cursor: 'not-allowed' }} />
                  ) : (
                    <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.9rem', background: '#fff' }}>
                      <option value="">Select a role</option>
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  )}
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: 8 }}>Language</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {LANGUAGES.map(l => (
                      <button key={l.value} type="button" onClick={() => setForm(f => ({ ...f, language: l.value }))} style={{ padding: '10px', borderRadius: '6px', border: `1px solid ${form.language === l.value ? '#111827' : '#D1D5DB'}`, background: form.language === l.value ? '#F3F4F6' : '#FFFFFF', color: '#111827', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>{l.label}</button>
                    ))}
                  </div>
                </div>
                {error && <div style={{ color: '#DC2626', fontSize: '0.85rem', marginBottom: 20 }}>{error}</div>}
              </form>
            </div>
            <div style={{ padding: '20px 32px', background: '#F9FAFB', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setShowQuickStart(false)} style={{ background: '#fff', border: '1px solid #D1D5DB', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button form="start-form" type="submit" disabled={loading} style={{ background: '#111827', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? 'Starting...' : 'Start Session'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Interview Details Modal */}
      {selectedInterview && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, background: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setSelectedInterview(null)}>
           <div style={{ background: '#FFFFFF', width: '100%', maxWidth: 600, borderRadius: '16px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '24px 32px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0 }}>{ROLES.find(r => r.value === selectedInterview.role)?.label || selectedInterview.role} Details</h3>
                <button onClick={() => setSelectedInterview(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ padding: '32px' }}>
                <p><b>Company:</b> {selectedInterview.companyName}</p>
                <p><b>Role:</b> {ROLES.find(r => r.value === selectedInterview.role)?.label || selectedInterview.role}</p>
                <p><b>Description:</b> {selectedInterview.description}</p>
                <p><b>Instructions:</b> {selectedInterview.instructions}</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
