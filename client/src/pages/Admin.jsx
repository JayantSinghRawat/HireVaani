import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  const [activeTab, setActiveTab] = useState('candidates'); // 'candidates' | 'interviews'
  const [candidates, setCandidates] = useState([]);
  const [allInterviews, setAllInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState({ search: '', role: '', decision: '' });
  const [editNotes, setEditNotes] = useState('');
  const [toast, setToast] = useState('');

  // New Interview Form
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
      console.error(err);
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
      showToast('Candidate updated');
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
      setAllInterviews(allInterviews.filter(iv => iv.id !== id && iv._id !== id));
      showToast('Interview deleted');
    } catch (err) {
      showToast('Delete failed');
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const openCandidate = (c) => {
    setSelected(c);
    setEditNotes(c.adminNotes || '');
  };

  const filtered = candidates.filter(c => {
    const s = filter.search.toLowerCase();
    const matchSearch = c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s);
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
    <div style={{ minHeight: '100vh', background: '#F9FAFB', display: 'flex' }}>
      
      {/* Sidebar Navigation */}
      <div style={{ width: 260, background: '#111827', color: '#fff', padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ padding: '0 12px 32px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, background: '#fff', color: '#111827', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>H</div>
          <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>HireVaani</span>
        </div>
        
        <button onClick={() => setActiveTab('candidates')} className={`nav-btn ${activeTab === 'candidates' ? 'active' : ''}`}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          Candidates
        </button>
        <button onClick={() => setActiveTab('interviews')} className={`nav-btn ${activeTab === 'interviews' ? 'active' : ''}`}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          Interviews
        </button>
        
        <div style={{ marginTop: 'auto', padding: '16px 12px', borderTop: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>Organizer</div>
          <button onClick={() => { localStorage.clear(); navigate('/login'); }} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
        
        {activeTab === 'candidates' ? (
          <>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#111827', marginBottom: 8 }}>Candidate Dashboard</h1>
              <p style={{ color: '#6B7280' }}>Review and manage all AI interview submissions.</p>
            </div>

            {/* Stats */}
            <div className="stats-grid">
              {[
                { label: 'Total', value: stats.total, color: '#4338CA' },
                { label: 'Shortlisted', value: stats.shortlisted, color: '#10B981' },
                { label: 'Under Review', value: stats.review, color: '#F59E0B' },
                { label: 'Not Fit', value: stats.notFit, color: '#EF4444' },
                { label: 'Avg Score', value: `${stats.avgScore}/10`, color: '#8B5CF6' },
              ].map(s => (
                <div key={s.label} className="card stat-card">
                  <div className="stat-val" style={{ color: s.color }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="card filter-card">
              <input className="input filter-input" placeholder="Search name or email..." value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} />
              <select className="select filter-select" value={filter.role} onChange={e => setFilter(f => ({ ...f, role: e.target.value }))}>
                <option value="">All Roles</option>
                {Object.entries(ROLE_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <select className="select filter-select" value={filter.decision} onChange={e => setFilter(f => ({ ...f, decision: e.target.value }))}>
                <option value="">All Decisions</option>
                {['Shortlisted','Under Review','Not Fit','Pending'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>

            <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap: 24 }}>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="table">
                  <thead>
                    <tr>{['Candidate','Role','Score','Trust','Decision','Action'].map(h => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => (
                      <tr key={c.sessionId} onClick={() => openCandidate(c)} style={{ cursor: 'pointer', background: selected?.sessionId === c.sessionId ? '#F5F3FF' : '' }}>
                        <td><div style={{ fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{c.email}</div></td>
                        <td>{ROLE_LABELS[c.role] || c.role}</td>
                        <td style={{ fontWeight: 700 }}>{c.overallScore || '—'}/10</td>
                        <td>{c.trustScore ?? '—'}%</td>
                        <td><span className={`badge ${DECISION_BADGE[c.fitmentDecision] || 'badge-gray'}`}>{c.fitmentDecision || 'Pending'}</span></td>
                        <td onClick={e => e.stopPropagation()}>
                          <select className="select select-sm" value={c.fitmentDecision || 'Pending'} onChange={e => updateCandidate(c.sessionId, { fitmentDecision: e.target.value })}>
                            {['Shortlisted','Under Review','Not Fit','Pending'].map(d => <option key={d}>{d}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selected && (
                <div className="card detail-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h3 style={{ margin: 0 }}>{selected.name}</h3>
                    <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>✕</button>
                  </div>
                  <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: 8, marginBottom: 20 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', color: '#6B7280', marginBottom: 12 }}>AI Performance</div>
                    {SKILL_KEYS.map(k => (
                      <div key={k} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                          <span style={{ textTransform: 'capitalize' }}>{k}</span>
                          <b>{selected.skillScores[k]}/10</b>
                        </div>
                        <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: '#4338CA', width: `${(selected.skillScores[k]||0)*10}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#F0FDFA', border: '1px solid #5EEAD4', padding: '16px', borderRadius: 8, color: '#0F766E' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: 6 }}>AI Summary</div>
                    <div style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>{selected.fitmentReason || 'No summary generated.'}</div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#111827', marginBottom: 8 }}>Manage Interviews</h1>
                <p style={{ color: '#6B7280' }}>Create and manage interview links for different roles.</p>
              </div>
              <button onClick={() => setShowCreateModal(true)} className="btn btn-primary" style={{ padding: '12px 24px' }}>+ Create Interview</button>
            </div>

            <div className="interviews-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
              {allInterviews.map(iv => (
                <div key={iv.id || iv._id} className="card interview-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{ROLE_LABELS[iv.role] || iv.role}</h3>
                      <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>{iv.companyName}</div>
                    </div>
                    <button onClick={() => handleDeleteInterview(iv.id || iv._id)} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                  <div style={{ background: '#F9FAFB', padding: '12px', borderRadius: 8, fontSize: '0.85rem', color: '#4B5563', marginBottom: 20 }}>
                    {iv.description || 'No description provided.'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Date: {new Date(iv.date).toLocaleDateString()}</div>
                    <span className="badge badge-emerald">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create Interview Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, padding: 32 }}>
            <h2 style={{ margin: '0 0 24px' }}>Create New Interview</h2>
            <form onSubmit={handleCreateInterview}>
              <div style={{ marginBottom: 16 }}>
                <label className="label">Company Name</label>
                <input className="input" value={newIv.companyName} onChange={e => setNewIv({ ...newIv, companyName: e.target.value })} required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="label">Interview Role (e.g. Teacher, Nurse, Developer)</label>
                <input className="input" placeholder="Enter any role name..." value={newIv.role} onChange={e => setNewIv({ ...newIv, role: e.target.value })} required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="label">Interview Date</label>
                <input className="input" type="date" value={newIv.date} onChange={e => setNewIv({ ...newIv, date: e.target.value })} required />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label className="label">Description / Job Details</label>
                <textarea className="textarea" rows={3} value={newIv.description} onChange={e => setNewIv({ ...newIv, description: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-outline" style={{ padding: '10px 20px' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>Create Interview</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast" style={{ position: 'fixed', bottom: 24, right: 24, background: '#111827', color: '#fff', padding: '12px 24px', borderRadius: 8, boxShadow: '0 10px 15px rgba(0,0,0,0.1)', zIndex: 1100 }}>{toast}</div>}

      <style>{`
        .nav-btn { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; background: transparent; border: none; color: #9CA3AF; cursor: pointer; font-size: 0.95rem; text-align: left; transition: all 0.2s; }
        .nav-btn:hover { background: #1F2937; color: #fff; }
        .nav-btn.active { background: #4338CA; color: #fff; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { padding: 24px; text-align: center; }
        .stat-val { font-size: 2rem; fontWeight: 800; }
        .stat-label { font-size: 0.85rem; color: #6B7280; margin-top: 4px; }
        .filter-card { padding: 16px; margin-bottom: 24px; display: flex; gap: 12px; flex-wrap: wrap; }
        .filter-input { flex: 1; min-width: 200px; }
        .filter-select { width: 180px; }
        .interview-card { padding: 24px; }
        @media (max-width: 768px) {
          .admin-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
