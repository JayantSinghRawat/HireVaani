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

      {/* Sidebar - Fix PC Cross button and Mobile view */}
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
                      <tr>{['Candidate','Role','Score','Trust','Decision','Action'].map(h => <th key={h}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {filtered.map(c => (
                        <tr key={c.sessionId} onClick={() => openCandidate(c)} className={selected?.sessionId === c.sessionId ? 'active' : ''}>
                          <td><div className="name-bold">{c.name}</div><div className="sub-text">{c.email}</div></td>
                          <td>{ROLE_LABELS[c.role] || c.role}</td>
                          <td className="score-cell">{c.overallScore || '—'}/10</td>
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
              {allInterviews.length === 0 ? (
                <div className="empty-state card">No interviews created yet. Click "+ Create" to start.</div>
              ) : allInterviews.map(iv => (
                <div key={iv.id || iv._id} className="interview-card card">
                  <div className="iv-header">
                    <h3>{ROLE_LABELS[iv.role] || iv.role}</h3>
                    <button onClick={() => handleDeleteInterview(iv.id || iv._id)} className="delete-btn-enhanced" title="Delete Interview">
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                  <div className="iv-company">{iv.companyName}</div>
                  <div className="iv-desc">{iv.description || 'No description provided for this role.'}</div>
                  <div className="iv-footer">
                    <span className="iv-date">
                       <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                       {new Date(iv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
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
              <div>
                <h2>{selected.name}</h2>
                <p className="sub-text">{selected.email} · {ROLE_LABELS[selected.role] || selected.role}</p>
              </div>
              <button onClick={() => setSelected(null)} className="close-btn">✕</button>
            </div>
            
            <div className="detail-body">
              <div className="detail-grid">
                <div className="detail-stat-box">
                  <label>Overall Score</label>
                  <div className="val-big">{selected.overallScore || '—'}/10</div>
                </div>
                <div className="detail-stat-box">
                  <label>Trust Score</label>
                  <div className="val-big">{selected.trustScore || '—'}%</div>
                </div>
              </div>

              <div className="detail-section summary-box">
                <h3>AI Recommendation</h3>
                <p>{selected.fitmentReason || 'No summary available.'}</p>
              </div>

              <div className="detail-section">
                <h3>Skill Breakdown</h3>
                {SKILL_KEYS.map(k => (
                  <div key={k} className="skill-row">
                    <div className="skill-info">
                      <span>{k}</span>
                      <b>{selected.skillScores?.[k] || 0}/10</b>
                    </div>
                    <div className="progress-bg"><div className="progress-bar" style={{ width: `${(selected.skillScores?.[k]||0)*10}%` }} /></div>
                  </div>
                ))}
              </div>

              <div className="detail-section">
                <h3>Interview Transcript</h3>
                {!selected.answers ? (
                   <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>Loading answers...</div>
                ) : (
                  <div className="answers-list">
                    {selected.answers.map((a, i) => (
                      <div key={i} className="answer-item">
                        <div className="q-head">
                          <span className="q-num">Q{i+1}</span>
                          <p className="q-text">{a.questionText}</p>
                        </div>
                        <div className="a-content">
                          <div className="a-label">CANDIDATE RESPONSE</div>
                          <p className="a-text">{a.transcript || 'No response recorded.'}</p>
                        </div>
                        {a.geminiScores?.feedback && (
                          <div className="a-feedback">
                            <div className="a-label">AI FEEDBACK</div>
                            <p className="f-text">{a.geminiScores.feedback}</p>
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-box card" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: 24 }}>New Interview</h2>
            <form onSubmit={handleCreateInterview}>
              <div className="form-group">
                <label>Role Name (e.g. Teacher)</label>
                <input className="input" placeholder="Enter role..." value={newIv.role} onChange={e => setNewIv({ ...newIv, role: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input className="input" type="date" value={newIv.date} onChange={e => setNewIv({ ...newIv, date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="textarea" rows={3} placeholder="Job description..." value={newIv.description} onChange={e => setNewIv({ ...newIv, description: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create Interview</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}

      <style>{`
        .admin-layout { display: flex; height: 100vh; width: 100vw; background: #F9FAFB; overflow: hidden; position: relative; }
        
        /* Sidebar Fixes */
        .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; transition: opacity 0.3s; }
        .sidebar-overlay.show { display: block; }

        .sidebar { width: 280px; height: 100%; background: #111827; color: #fff; display: flex; flex-direction: column; z-index: 1001; transition: transform 0.3s ease; }
        .sidebar-header { padding: 32px 24px; display: flex; align-items: center; justify-content: space-between; }
        .brand { display: flex; align-items: center; gap: 12px; font-weight: 800; font-size: 1.25rem; }
        .brand-logo { width: 32px; height: 32px; background: #fff; color: #111827; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        
        .close-sidebar-btn { display: none; background: transparent; border: none; color: #fff; font-size: 1.2rem; cursor: pointer; }

        .nav-list { flex: 1; padding: 0 16px; display: flex; flex-direction: column; gap: 6px; }
        .nav-item { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 10px; background: transparent; border: none; color: #9CA3AF; cursor: pointer; text-align: left; font-size: 0.95rem; font-weight: 500; transition: all 0.2s; }
        .nav-item:hover { background: #1F2937; color: #fff; }
        .nav-item.active { background: #4338CA; color: #fff; box-shadow: 0 4px 12px rgba(67, 56, 202, 0.2); }
        
        .sidebar-footer { padding: 24px; border-top: 1px solid #1F2937; }
        .logout-btn { display: flex; align-items: center; gap: 10px; width: 100%; background: transparent; border: none; color: #EF4444; cursor: pointer; font-size: 0.95rem; font-weight: 600; padding: 10px; border-radius: 8px; }
        .logout-btn:hover { background: rgba(239, 68, 68, 0.1); }

        .main-content { flex: 1; height: 100%; overflow-y: auto; padding: 40px; position: relative; }
        .mobile-header { display: none; width: 100%; height: 60px; background: #fff; border-bottom: 1px solid #E5E7EB; align-items: center; justify-content: space-between; padding: 0 16px; position: sticky; top: 0; z-index: 900; }
        
        .page-header { margin-bottom: 32px; }
        .page-header h1 { font-size: 1.8rem; font-weight: 800; margin-bottom: 8px; color: #111827; }
        .page-header p { color: #6B7280; }

        .stats-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .stat-card { background: #fff; padding: 24px; border-radius: 16px; border: 1px solid #E5E7EB; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .stat-val { font-size: 2rem; font-weight: 800; }
        .stat-label { font-size: 0.85rem; color: #6B7280; margin-top: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

        /* Interviews UI Enhancement */
        .create-btn-enhanced { display: flex; align-items: center; gap: 8px; background: #111827; color: #fff; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .create-btn-enhanced:hover { background: #1F2937; transform: translateY(-1px); }

        .interviews-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; }
        .interview-card { padding: 28px; transition: transform 0.2s; border: 1px solid #E5E7EB; }
        .interview-card:hover { transform: translateY(-4px); border-color: #4338CA; }
        .iv-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
        .iv-header h3 { margin: 0; font-size: 1.2rem; font-weight: 800; color: #111827; }
        .iv-company { font-size: 0.9rem; color: #4338CA; font-weight: 600; margin-bottom: 16px; }
        .iv-desc { font-size: 0.9rem; color: #6B7280; line-height: 1.6; margin-bottom: 24px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .iv-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #F3F4F6; pt: 16px; }
        .iv-date { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #9CA3AF; font-weight: 500; }
        
        .delete-btn-enhanced { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: #FEF2F2; color: #EF4444; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .delete-btn-enhanced:hover { background: #EF4444; color: #fff; }

        /* Detail Drawer Styles */
        .detail-drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); backdrop-filter: blur(2px); z-index: 1050; }
        .detail-drawer { position: fixed; top: 0; right: 0; width: 550px; height: 100%; background: #fff; z-index: 1060; display: flex; flex-direction: column; box-shadow: -10px 0 30px rgba(0,0,0,0.1); animation: drawerSlide 0.3s ease-out; }
        @keyframes drawerSlide { from { transform: translateX(100%); } to { transform: translateX(0); } }
        
        .filter-bar { padding: 20px; margin-bottom: 24px; display: flex; gap: 16px; align-items: center; }
        .filter-group { display: flex; gap: 12px; }

        /* General UI Components */
        .card { background: #fff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .input, .select, .textarea { padding: 12px 16px; border: 1px solid #E5E7EB; border-radius: 10px; font-size: 0.9rem; outline: none; transition: border-color 0.2s; }
        .input:focus, .select:focus, .textarea:focus { border-color: #4338CA; }
        
        .btn-primary { background: #111827; color: #fff; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; }
        .btn-secondary { background: #fff; border: 1px solid #D1D5DB; color: #374151; padding: 12px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; }

        @media (max-width: 850px) {
          .sidebar { position: fixed; transform: translateX(-100%); z-index: 1100; }
          .sidebar.open { transform: translateX(0); }
          .sidebar-overlay.show { display: block; }
          .close-sidebar-btn { display: block; }
          .mobile-header { display: flex; }
          .main-content { padding: 20px; flex: none; width: 100%; height: calc(100vh - 60px); }
          .detail-drawer { width: 100%; }
          .filter-bar { flex-direction: column; align-items: stretch; }
          .filter-group { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
