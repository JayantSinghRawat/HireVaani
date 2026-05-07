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
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-logo">H</div>
            <span>HireVaani</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="close-sidebar mobile-only">✕</button>
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
          <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="logout-btn">Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content" onClick={() => isSidebarOpen && setIsSidebarOpen(false)}>
        
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
              <select className="select" value={filter.role} onChange={e => setFilter(f => ({ ...f, role: e.target.value }))}>
                <option value="">All Roles</option>
                {Object.entries(ROLE_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <select className="select" value={filter.decision} onChange={e => setFilter(f => ({ ...f, decision: e.target.value }))}>
                <option value="">All Decisions</option>
                {['Shortlisted','Under Review','Not Fit','Pending'].map(d => <option key={d}>{d}</option>)}
              </select>
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
                        <tr key={c.sessionId} onClick={() => setSelected(c)} className={selected?.sessionId === c.sessionId ? 'active' : ''}>
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
              <button onClick={() => setShowCreateModal(true)} className="btn-primary">+ Create</button>
            </div>

            <div className="interviews-grid">
              {allInterviews.map(iv => (
                <div key={iv.id || iv._id} className="interview-card card">
                  <div className="iv-header">
                    <h3>{ROLE_LABELS[iv.role] || iv.role}</h3>
                    <button onClick={() => handleDeleteInterview(iv.id || iv._id)} className="delete-btn">✕</button>
                  </div>
                  <div className="iv-desc">{iv.description || 'No description.'}</div>
                  <div className="iv-footer">
                    <span>{new Date(iv.date).toLocaleDateString()}</span>
                    <span className="badge badge-emerald">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Detailed View Modal (Responsive) */}
      {selected && (
        <div className="detail-modal-overlay" onClick={() => setSelected(null)}>
          <div className="detail-modal" onClick={e => e.stopPropagation()}>
            <div className="detail-header">
              <div>
                <h2>{selected.name}</h2>
                <p className="sub-text">{selected.email} · ID: {selected.sessionId.slice(0,8)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="close-btn">✕</button>
            </div>
            
            <div className="detail-body">
              <div className="detail-grid">
                <div className="detail-stat-box">
                  <label>Overall Score</label>
                  <div className="val-big">{selected.overallScore}/10</div>
                </div>
                <div className="detail-stat-box">
                  <label>Trust Score</label>
                  <div className="val-big">{selected.trustScore}%</div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Skill Analysis</h3>
                {SKILL_KEYS.map(k => (
                  <div key={k} className="skill-row">
                    <div className="skill-info">
                      <span>{k}</span>
                      <b>{selected.skillScores[k]}/10</b>
                    </div>
                    <div className="progress-bg"><div className="progress-bar" style={{ width: `${(selected.skillScores[k]||0)*10}%` }} /></div>
                  </div>
                ))}
              </div>

              <div className="detail-section summary-box">
                <h3>AI Interview Summary</h3>
                <p>{selected.fitmentReason || 'No summary available.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-box card" onClick={e => e.stopPropagation()}>
            <h2>New Interview</h2>
            <form onSubmit={handleCreateInterview}>
              <div className="form-group">
                <label>Role Name (e.g. Teacher)</label>
                <input className="input" value={newIv.role} onChange={e => setNewIv({ ...newIv, role: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input className="input" type="date" value={newIv.date} onChange={e => setNewIv({ ...newIv, date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="textarea" rows={3} value={newIv.description} onChange={e => setNewIv({ ...newIv, description: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}

      <style>{`
        .admin-layout { display: flex; height: 100vh; background: #F9FAFB; }
        .sidebar { width: 260px; background: #111827; color: #fff; display: flex; flexDirection: column; transition: all 0.3s; }
        .sidebar-header { padding: 32px 24px; display: flex; align-items: center; justify-content: space-between; }
        .brand { display: flex; align-items: center; gap: 12px; font-weight: 800; font-size: 1.2rem; }
        .brand-logo { width: 32px; height: 32px; background: #fff; color: #111827; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .nav-list { flex: 1; padding: 0 16px; display: flex; flex-direction: column; gap: 4px; }
        .nav-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; background: transparent; border: none; color: #9CA3AF; cursor: pointer; text-align: left; }
        .nav-item.active { background: #4338CA; color: #fff; }
        .sidebar-footer { padding: 24px; border-top: 1px solid #1F2937; }
        .logout-btn { background: transparent; border: none; color: #EF4444; cursor: pointer; }

        .main-content { flex: 1; padding: 40px; overflow-y: auto; }
        .page-header { margin-bottom: 32px; }
        .page-header h1 { font-size: 1.8rem; fontWeight: 800; margin-bottom: 8px; }
        .flex-between { display: flex; justify-content: space-between; align-items: center; }

        .stats-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 32px; }
        .stat-card { background: #fff; padding: 24px; border-radius: 12px; border: 1px solid #E5E7EB; text-align: center; }
        .stat-val { font-size: 1.8rem; fontWeight: 800; }
        .stat-label { font-size: 0.85rem; color: #6B7280; margin-top: 4px; }

        .filter-bar { padding: 16px; margin-bottom: 24px; display: flex; gap: 12px; }
        .filter-bar .input { flex: 1; min-width: 200px; }
        .filter-bar .select { width: 180px; }

        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th { text-align: left; padding: 16px; background: #F9FAFB; border-bottom: 1px solid #E5E7EB; font-size: 0.8rem; color: #6B7280; text-transform: uppercase; }
        .admin-table td { padding: 16px; border-bottom: 1px solid #E5E7EB; font-size: 0.9rem; }
        .admin-table tr:hover { background: #F5F3FF; cursor: pointer; }
        .admin-table tr.active { background: #EEF2FF; }
        .name-bold { font-weight: 600; color: #111827; }
        .sub-text { font-size: 0.75rem; color: #6B7280; }
        .score-cell { font-weight: 700; color: #4338CA; }

        .interviews-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
        .interview-card { padding: 24px; }
        .iv-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .iv-desc { font-size: 0.85rem; color: #4B5563; margin-bottom: 16px; line-height: 1.5; }
        .iv-footer { display: flex; justify-content: space-between; font-size: 0.8rem; color: #9CA3AF; }

        /* Detail Modal */
        .detail-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 1000; display: flex; justify-content: flex-end; }
        .detail-modal { width: 100%; max-width: 500px; background: #fff; height: 100%; box-shadow: -10px 0 25px rgba(0,0,0,0.1); display: flex; flex-direction: column; animation: slideIn 0.3s ease-out; }
        .detail-header { padding: 32px; border-bottom: 1px solid #E5E7EB; display: flex; justify-content: space-between; align-items: flex-start; }
        .detail-body { padding: 32px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 32px; }
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .detail-stat-box { background: #F9FAFB; padding: 20px; border-radius: 12px; text-align: center; }
        .detail-stat-box label { font-size: 0.7rem; text-transform: uppercase; color: #6B7280; margin-bottom: 4px; display: block; }
        .val-big { font-size: 1.5rem; fontWeight: 800; color: #111827; }
        .detail-section h3 { font-size: 0.9rem; fontWeight: 700; margin-bottom: 16px; }
        .skill-row { margin-bottom: 16px; }
        .skill-info { display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px; }
        .progress-bg { height: 8px; background: #E5E7EB; border-radius: 4px; overflow: hidden; }
        .progress-bar { height: 100%; background: #4338CA; border-radius: 4px; }
        .summary-box { background: #F0FDFA; padding: 24px; border-radius: 12px; border: 1px solid #5EEAD4; color: #0F766E; }
        .summary-box p { font-size: 0.9rem; line-height: 1.7; margin: 0; }

        .mobile-header { display: none; }
        .mobile-only { display: none; }

        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }

        @media (max-width: 850px) {
          .sidebar { position: fixed; inset: 0; right: auto; z-index: 1100; transform: translateX(-100%); width: 280px; }
          .sidebar.open { transform: translateX(0); }
          .mobile-header { display: flex; align-items: center; justify-content: space-between; padding: 0 16px; height: 60px; background: #fff; border-bottom: 1px solid #E5E7EB; position: sticky; top: 0; z-index: 900; }
          .main-content { padding: 20px; }
          .mobile-only { display: block; }
          .filter-bar { flex-direction: column; }
          .filter-bar .select { width: 100%; }
          .detail-modal { max-width: 100%; }
        }
      `}</style>
    </div>
  );
}
