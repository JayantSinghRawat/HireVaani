import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const DECISION_BADGE = {
  Shortlisted:    'badge-emerald',
  'Under Review': 'badge-amber',
  'Not Fit':      'badge-rose',
  Pending:        'badge-gray'
};

const ROLE_LABELS = {
  software_engineer:   'Software Engineer',
  data_analyst:        'Data Analyst',
  marketing_executive: 'Marketing Executive',
  hr_executive:        'HR Executive',
  sales_executive:     'Sales Executive',
  customer_support:    'Customer Support',
};

const SKILL_KEYS = ['relevance', 'clarity', 'confidence', 'technical', 'communication'];

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('candidates');
  const [candidates, setCandidates] = useState([]);
  const [allInterviews, setAllInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState({ search: '', role: '', decision: '' });
  const [toast, setToast] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newIv, setNewIv] = useState({
    companyName: 'HireVaani',
    role: '',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    description: '',
    instructions: 'Please ensure you are in a quiet room with good lighting.'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('hv_token');
    if (!token) return navigate('/login');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [resCands, resIvs] = await Promise.all([
        axios.get(`${API}/candidates`, { headers }),
        axios.get(`${API}/interviews`, { headers })
      ]);
      setCandidates(resCands.data.candidates || []);
      setAllInterviews(resIvs.data || []);
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const openCandidate = async (candidate) => {
    setSelected(candidate);
    const token = localStorage.getItem('hv_token');
    try {
      const { data } = await axios.get(`${API}/candidates/${candidate.sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelected(data);
    } catch (err) {
      console.error('Failed to fetch detail:', err);
    }
  };

  const updateCandidate = async (sessionId, updates) => {
    try {
      const token = localStorage.getItem('hv_token');
      await axios.patch(`${API}/candidates/${sessionId}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCandidates(prev => prev.map(c => c.sessionId === sessionId ? { ...c, ...updates } : c));
      if (selected?.sessionId === sessionId) setSelected({ ...selected, ...updates });
      showToast('Status updated');
    } catch (err) {
      showToast('Update failed');
    }
  };

  const handleCreateInterview = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('hv_token');
      const { data } = await axios.post(`${API}/interviews`, newIv, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllInterviews([data, ...allInterviews]);
      setShowCreateModal(false);
      showToast('Interview created');
      setNewIv({ companyName: 'HireVaani', role: '', date: new Date().toISOString().split('T')[0], description: '', instructions: '' });
    } catch (err) {
      showToast('Failed to create');
    }
  };

  const handleDeleteInterview = async (id) => {
    if (!window.confirm('Delete this interview?')) return;
    try {
      const token = localStorage.getItem('hv_token');
      await axios.delete(`${API}/interviews/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllInterviews(allInterviews.filter(iv => (iv.id || iv._id) !== id));
      showToast('Interview deleted');
    } catch (err) {
      showToast('Delete failed');
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const filtered = candidates.filter(c => {
    const s = filter.search.toLowerCase();
    const matchSearch = c.name.toLowerCase().includes(s) || (c.email && c.email.toLowerCase().includes(s));
    const matchRole = !filter.role || c.role === filter.role;
    const matchDecision = !filter.decision || c.fitmentDecision === filter.decision;
    return matchSearch && matchRole && matchDecision;
  });

  const stats = {
    total: candidates.length,
    shortlisted: candidates.filter(c => c.fitmentDecision === 'Shortlisted').length,
    review: candidates.filter(c => c.fitmentDecision === 'Under Review').length,
    notFit: candidates.filter(c => c.fitmentDecision === 'Not Fit').length,
    avgScore: candidates.length ? (candidates.reduce((acc, c) => acc + (c.overallScore || 0), 0) / candidates.length).toFixed(1) : '0.0'
  };

  return (
    <div className="admin-layout">
      
      {/* Mobile Top Bar */}
      <div className="mobile-header">
        <button onClick={() => setIsSidebarOpen(true)} className="icon-btn">☰</button>
        <span style={{ fontWeight: 800 }}>HireVaani Admin</span>
        <div style={{ width: 32 }} />
      </div>

      {/* Sidebar */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'show' : ''}`} onClick={() => setIsSidebarOpen(false)} />
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-logo">H</div>
            <span>HireVaani</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="close-sidebar-btn">✕</button>
        </div>
        
        <nav className="nav-list">
          <button onClick={() => { setActiveTab('candidates'); setIsSidebarOpen(false); }} className={`nav-item ${activeTab === 'candidates' ? 'active' : ''}`}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
            Candidates
          </button>
          <button onClick={() => { setActiveTab('interviews'); setIsSidebarOpen(false); }} className={`nav-item ${activeTab === 'interviews' ? 'active' : ''}`}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            Interviews
          </button>
        </nav>
        
        <div className="sidebar-footer">
          <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="logout-btn">
             <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
             Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        
        {activeTab === 'candidates' ? (
          <>
            <div className="page-header">
              <h1>Candidate Dashboard</h1>
              <p>Review and manage AI interview submissions.</p>
            </div>

            <div className="stats-container">
              {[
                { label: 'Total', value: stats.total, color: '#4338CA' },
                { label: 'Shortlisted', value: stats.shortlisted, color: '#10B981' },
                { label: 'Under Review', value: stats.review, color: '#F59E0B' },
                { label: 'Not Fit', value: stats.notFit, color: '#EF4444' },
                { label: 'Avg Score', value: `${stats.avgScore}/10`, color: '#8B5CF6' },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div className="stat-val" style={{ color: s.color }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="filter-bar card">
              <input className="input" placeholder="Search..." value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} />
              <div className="filter-group">
                <select className="select" value={filter.role} onChange={e => setFilter(f => ({ ...f, role: e.target.value }))}>
                  <option value="">All Roles</option>
                  {Object.entries(ROLE_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <select className="select" value={filter.decision} onChange={e => setFilter(f => ({ ...f, decision: e.target.value }))}>
                  <option value="">All Decisions</option>
                  {['Shortlisted','Under Review','Not Fit','Pending'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="data-section card">
              {loading ? (
                <div className="loading-state">Loading candidates...</div>
              ) : (
                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: '25%' }}>Candidate</th>
                        <th style={{ width: '20%' }}>Role</th>
                        <th style={{ width: '10%' }}>Score</th>
                        <th style={{ width: '10%' }}>Trust</th>
                        <th style={{ width: '15%' }}>Decision</th>
                        <th style={{ width: '20%' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(c => (
                        <tr key={c.sessionId} onClick={() => openCandidate(c)} className={selected?.sessionId === c.sessionId ? 'active' : ''}>
                          <td>
                            <div style={{ fontWeight: 600, color: '#111827' }}>{c.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{c.email}</div>
                          </td>
                          <td>{ROLE_LABELS[c.role] || c.role}</td>
                          <td style={{ fontWeight: 700, color: '#4338CA' }}>{c.overallScore || '—'}/10</td>
                          <td>{c.trustScore ?? '—'}%</td>
                          <td><span className={`badge ${DECISION_BADGE[c.fitmentDecision] || 'badge-gray'}`}>{c.fitmentDecision || 'Pending'}</span></td>
                          <td onClick={e => e.stopPropagation()}>
                            <select className="select-sm" value={c.fitmentDecision || 'Pending'} onChange={e => updateCandidate(c.sessionId, { fitmentDecision: e.target.value })}>
                              {['Shortlisted','Under Review','Not Fit','Pending'].map(d => <option key={d}>{d}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="page-header flex-between">
              <div>
                <h1>Manage Interviews</h1>
                <p>Create and manage AI interview links.</p>
              </div>
              <button onClick={() => setShowCreateModal(true)} className="create-btn-enhanced">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Create Interview
              </button>
            </div>

            <div className="interviews-grid">
              {allInterviews.map(iv => (
                <div key={iv.id || iv._id} className="interview-card card">
                  <div className="iv-header">
                    <h3>{ROLE_LABELS[iv.role] || iv.role}</h3>
                    <button onClick={() => handleDeleteInterview(iv.id || iv._id)} className="delete-btn-enhanced">
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                  <div className="iv-company">{iv.companyName}</div>
                  <div className="iv-desc">{iv.description || 'No description provided.'}</div>
                  <div className="iv-footer">
                    <span className="iv-date">{new Date(iv.date).toLocaleDateString()}</span>
                    <span className="badge badge-emerald">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Detailed View Drawer */}
      {selected && (
        <>
          <div className="detail-drawer-overlay" onClick={() => setSelected(null)} />
          <div className="detail-drawer">
            <div className="detail-header">
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 4px', color: '#111827' }}>{selected.name}</h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#6B7280' }}>{selected.email} · {ROLE_LABELS[selected.role] || selected.role}</p>
              </div>
              <button onClick={() => setSelected(null)} className="close-btn" style={{ fontSize: '1.5rem', padding: '4px 12px' }}>✕</button>
            </div>
            
            <div className="detail-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: '#F9FAFB', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #E5E7EB' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: 4 }}>Overall Score</label>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#111827' }}>{selected.overallScore || '—'}/10</div>
                </div>
                <div style={{ background: '#F9FAFB', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #E5E7EB' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: 4 }}>Trust Score</label>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#111827' }}>{selected.trustScore || '—'}%</div>
                </div>
              </div>

              <div style={{ background: '#F0FDFA', padding: '24px', borderRadius: '12px', border: '1px solid #5EEAD4', color: '#0F766E' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 800 }}>AI Recommendation</h3>
                <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6 }}>{selected.fitmentReason || 'No summary available.'}</p>
              </div>

              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>Skill Breakdown</h3>
                {SKILL_KEYS.map(k => (
                  <div key={k} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: 6 }}>
                      <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{k}</span>
                      <b style={{ color: '#111827' }}>{selected.skillScores?.[k] || 0}/10</b>
                    </div>
                    <div style={{ height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: '#4338CA', width: `${(selected.skillScores?.[k]||0)*10}%`, borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>Interview Transcript</h3>
                {!selected.answers ? (
                   <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>Loading answers...</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {selected.answers.map((a, i) => (
                      <div key={i} style={{ padding: '20px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#111827', color: '#fff', padding: '2px 8px', borderRadius: '4px', height: 'fit-content' }}>Q{i+1}</span>
                          <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827', margin: 0 }}>{a.questionText}</p>
                        </div>
                        <div style={{ padding: '12px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: 12 }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.05em', marginBottom: 6 }}>CANDIDATE RESPONSE</div>
                          <p style={{ fontSize: '0.9rem', color: '#374151', margin: 0, lineHeight: 1.5 }}>{a.transcript || 'No response recorded.'}</p>
                        </div>
                        {a.geminiScores?.feedback && (
                          <div style={{ padding: '12px', background: '#EEF2FF', borderRadius: '8px', border: '1px solid #C7D2FE' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#4338CA', letterSpacing: '0.05em', marginBottom: 6 }}>AI FEEDBACK</div>
                            <p style={{ fontSize: '0.85rem', color: '#4338CA', margin: 0, lineHeight: 1.5, fontStyle: italic }}>{a.geminiScores.feedback}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Styles */}
      <style>{`
        .admin-layout { display: flex; height: 100vh; width: 100vw; background: #F9FAFB; overflow: hidden; position: relative; }
        .sidebar { width: 260px; height: 100%; background: #111827; color: #fff; display: flex; flex-direction: column; z-index: 1001; transition: transform 0.3s ease; }
        .sidebar-header { padding: 32px 24px; display: flex; align-items: center; justify-content: space-between; }
        .brand { display: flex; align-items: center; gap: 12px; font-weight: 800; font-size: 1.25rem; }
        .brand-logo { width: 32px; height: 32px; background: #fff; color: #111827; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .close-sidebar-btn { display: none; background: transparent; border: none; color: #fff; font-size: 1.2rem; cursor: pointer; }
        .nav-list { flex: 1; padding: 0 16px; display: flex; flex-direction: column; gap: 6px; }
        .nav-item { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 10px; background: transparent; border: none; color: #9CA3AF; cursor: pointer; text-align: left; font-size: 0.95rem; font-weight: 500; transition: all 0.2s; }
        .nav-item:hover { background: #1F2937; color: #fff; }
        .nav-item.active { background: #4338CA; color: #fff; }
        .sidebar-footer { padding: 24px; border-top: 1px solid #1F2937; }
        .logout-btn { display: flex; align-items: center; gap: 10px; width: 100%; background: transparent; border: none; color: #EF4444; cursor: pointer; font-size: 0.95rem; font-weight: 600; }
        
        .main-content { flex: 1; height: 100%; overflow-y: auto; padding: 40px; }
        .mobile-header { display: none; width: 100%; height: 60px; background: #fff; border-bottom: 1px solid #E5E7EB; align-items: center; justify-content: space-between; padding: 0 16px; position: sticky; top: 0; z-index: 900; }
        .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; }
        
        .page-header { margin-bottom: 32px; }
        .page-header h1 { font-size: 1.8rem; font-weight: 800; margin-bottom: 8px; color: #111827; }
        
        .stats-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 32px; }
        .stat-card { background: #fff; padding: 24px; border-radius: 12px; border: 1px solid #E5E7EB; text-align: center; }
        .stat-val { font-size: 1.8rem; font-weight: 800; }
        .stat-label { font-size: 0.85rem; color: #6B7280; margin-top: 4px; font-weight: 600; text-transform: uppercase; }

        .card { background: #fff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .filter-bar { padding: 16px; margin-bottom: 24px; display: flex; gap: 12px; align-items: center; }
        .filter-group { display: flex; gap: 12px; }
        .input { flex: 1; min-width: 200px; padding: 10px 14px; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 0.9rem; }
        .select { padding: 10px 14px; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 0.9rem; background: #fff; }

        .data-section { overflow: hidden; border: 1px solid #E5E7EB; }
        .table-wrapper { width: 100%; overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; min-width: 800px; table-layout: fixed; }
        .admin-table th { text-align: left; padding: 16px; background: #F9FAFB; border-bottom: 1px solid #E5E7EB; font-size: 0.75rem; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .admin-table td { padding: 16px; border-bottom: 1px solid #E5E7EB; font-size: 0.9rem; vertical-align: middle; overflow: hidden; text-overflow: ellipsis; }
        .admin-table tr:hover { background: #F9FAFB; cursor: pointer; }

        .detail-drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); backdrop-filter: blur(2px); z-index: 1050; }
        .detail-drawer { position: fixed; top: 0; right: 0; width: 550px; height: 100%; background: #fff; z-index: 1060; display: flex; flex-direction: column; box-shadow: -10px 0 30px rgba(0,0,0,0.1); animation: drawerSlide 0.3s ease-out; }
        @keyframes drawerSlide { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .detail-header { padding: 32px; border-bottom: 1px solid #E5E7EB; display: flex; justify-content: space-between; align-items: flex-start; }
        .detail-body { padding: 32px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 32px; }
        .close-btn { background: transparent; border: none; cursor: pointer; color: #9CA3AF; }

        .create-btn-enhanced { display: flex; align-items: center; gap: 8px; background: #111827; color: #fff; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; }
        .interviews-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
        .interview-card { padding: 24px; }
        .iv-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .iv-company { font-size: 0.9rem; color: #4338CA; font-weight: 600; margin-bottom: 8px; }
        .iv-desc { font-size: 0.85rem; color: #6B7280; margin-bottom: 16px; line-height: 1.5; }
        .iv-footer { display: flex; justify-content: space-between; align-items: center; }

        .badge { padding: 4px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
        .badge-emerald { background: #ECFDF5; color: #059669; }
        .badge-amber { background: #FFFBEB; color: #D97706; }
        .badge-rose { background: #FEF2F2; color: #E11D48; }
        .badge-gray { background: #F3F4F6; color: #6B7280; }

        @media (max-width: 850px) {
          .sidebar { position: fixed; transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0); }
          .sidebar-overlay.show { display: block; }
          .mobile-header { display: flex; }
          .close-sidebar-btn { display: block; }
          .main-content { padding: 20px; }
          .detail-drawer { width: 100%; }
        }
      `}</style>
    </div>
  );
}
