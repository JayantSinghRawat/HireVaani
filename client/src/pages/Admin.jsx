import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const DECISION_BADGE = {
  Shortlisted:    'badge-emerald',
  'Under Review': 'badge-amber',
  'Not Fit':      'badge-rose',
  Pending:        'badge-gray',
};

const ROLE_LABELS = {
  software_engineer: 'Software Eng.', data_analyst: 'Data Analyst',
  marketing_executive: 'Marketing', hr_executive: 'HR Executive',
  sales_executive: 'Sales', customer_support: 'Support',
};

const SKILL_KEYS = ['relevance','clarity','confidence','technical','communication'];

export default function Admin() {
  const navigate = useNavigate();
  const token    = localStorage.getItem('hv_token');
  const userStr  = localStorage.getItem('hv_user');
  
  let username = 'Admin';
  try {
    if (userStr) username = JSON.parse(userStr).name;
  } catch (e) { /* ignore */ }

  const [candidates, setCandidates] = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [loading,    setLoading]     = useState(true);
  const [filter,     setFilter]      = useState({ role: '', decision: '', search: '' });
  const [editNotes,  setEditNotes]   = useState('');
  const [saving,     setSaving]      = useState(false);
  const [toast,      setToast]       = useState('');

  const [showAddInterview, setShowAddInterview] = useState(false);
  const [newInterview, setNewInterview] = useState({
    companyName: 'TechCorp India',
    role: 'software_engineer',
    date: new Date(Date.now() + 86400000).toISOString().slice(0,16),
    description: '',
    requiredSkills: '',
    instructions: '',
    customQuestions: ''
  });
  const [creatingInterview, setCreatingInterview] = useState(false);

  const authH = { headers: { Authorization: `Bearer ${token}` } };
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/candidates`, authH);
      setCandidates(data.candidates || []);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) { 
        localStorage.removeItem('hv_token');
        localStorage.removeItem('hv_user');
        navigate('/login'); 
      }
    } finally { setLoading(false); }
  }, [navigate]); // eslint-disable-line

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  const openCandidate = async (c) => {
    try {
      const { data } = await axios.get(`${API}/candidates/${c.sessionId}`, authH);
      setSelected(data); setEditNotes(data.adminNotes || '');
    } catch { setSelected(c); setEditNotes(c.adminNotes || ''); }
  };

  const updateCandidate = async (sessionId, payload) => {
    setSaving(true);
    try {
      const { data } = await axios.patch(`${API}/candidates/${sessionId}`, payload, authH);
      setCandidates(cs => cs.map(c => c.sessionId === sessionId ? { ...c, ...data } : c));
      if (selected?.sessionId === sessionId) setSelected(s => ({ ...s, ...data }));
      showToast('Saved successfully');
    } catch { showToast('Save failed'); }
    finally { setSaving(false); }
  };

  const handleCreateInterview = async (e) => {
    e.preventDefault();
    setCreatingInterview(true);
    try {
      const payload = {
        ...newInterview,
        requiredSkills: newInterview.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
        customQuestions: newInterview.customQuestions.split('\n').map(q => q.trim()).filter(Boolean),
        date: new Date(newInterview.date).toISOString()
      };
      await axios.post(`${API}/interviews`, payload, authH);
      showToast('Interview created successfully!');
      setShowAddInterview(false);
    } catch { showToast('Failed to create interview'); }
    finally { setCreatingInterview(false); }
  };

  const handleLogout = () => { 
    localStorage.removeItem('hv_token'); localStorage.removeItem('hv_user'); navigate('/login'); 
  };

  const filtered = candidates.filter(c => {
    if (filter.role && c.role !== filter.role) return false;
    if (filter.decision && c.fitmentDecision !== filter.decision) return false;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      if (!c.name?.toLowerCase().includes(q) && !c.email?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const stats = {
    total: candidates.length,
    shortlisted: candidates.filter(c => c.fitmentDecision === 'Shortlisted').length,
    review: candidates.filter(c => c.fitmentDecision === 'Under Review').length,
    notFit: candidates.filter(c => c.fitmentDecision === 'Not Fit').length,
    avgScore: candidates.length ? (candidates.reduce((s,c) => s + (c.overallScore||0), 0) / candidates.length).toFixed(1) : '—',
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: 64, background: 'var(--bg-secondary)' }}>
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/" className="navbar-brand">HireVaani</Link>
          <div className="nav-sep"></div>
          <span className="nav-tag">Organizer Portal</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand-light)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 600, border: '1px solid var(--border)' }}>
            {username.charAt(0).toUpperCase()}
          </div>
          <button onClick={handleLogout} className="btn-logout" title="Sign Out">✕</button>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: 28, paddingBottom: 48 }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 4 }}>Candidate Dashboard</h2>
          <p style={{ fontSize: '0.9rem' }}>Review and manage all interview submissions.</p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {[
            { label: 'Total', value: stats.total, color: 'var(--blue)' },
            { label: 'Shortlisted', value: stats.shortlisted, color: 'var(--emerald)' },
            { label: 'Under Review', value: stats.review, color: 'var(--amber)' },
            { label: 'Not Fit', value: stats.notFit, color: 'var(--rose)' },
            { label: 'Avg Score', value: `${stats.avgScore}/10`, color: 'var(--purple)' },
          ].map(s => (
            <div key={s.label} className="card stat-card">
              <div className="stat-val" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="card filter-card">
          <input className="input filter-input" placeholder="Search..." value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} />
          <select className="select filter-select" value={filter.role} onChange={e => setFilter(f => ({ ...f, role: e.target.value }))}>
            <option value="">All Roles</option>
            {Object.entries(ROLE_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select className="select filter-select" value={filter.decision} onChange={e => setFilter(f => ({ ...f, decision: e.target.value }))}>
            <option value="">All Decisions</option>
            {['Shortlisted','Under Review','Not Fit','Pending'].map(d => <option key={d}>{d}</option>)}
          </select>
        </div>

        <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20 }}>
          {/* Main List */}
          <div className="card list-card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div className="loading-state"><div className="spinner" /><p>Loading...</p></div>
            ) : filtered.length === 0 ? (
              <div className="empty-state"><h4>No candidates</h4><p>Waiting for submissions.</p></div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead><tr>{['Candidate','Role','Score','Trust','Decision','Action'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr key={c.sessionId} onClick={() => openCandidate(c)} className={selected?.sessionId === c.sessionId ? 'active-row' : ''}>
                        <td><div className="cand-name">{c.name}</div><div className="cand-email">{c.email}</div></td>
                        <td>{ROLE_LABELS[c.role] || c.role}</td>
                        <td><span className="cand-score" style={{ color: (c.overallScore||0)>=7?'var(--emerald)':(c.overallScore||0)>=5?'var(--amber)':'var(--rose)' }}>{c.overallScore||'—'}</span>/10</td>
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
                {/* Mobile Card List */}
                <div className="mobile-list">
                  {filtered.map(c => (
                    <div key={c.sessionId} className="mobile-cand-card" onClick={() => openCandidate(c)}>
                      <div className="m-header">
                        <div className="m-name">{c.name}</div>
                        <span className={`badge ${DECISION_BADGE[c.fitmentDecision] || 'badge-gray'}`}>{c.fitmentDecision}</span>
                      </div>
                      <div className="m-meta">{ROLE_LABELS[c.role] || c.role} · {c.language?.toUpperCase()}</div>
                      <div className="m-stats">
                        <span>Score: <b>{c.overallScore}/10</b></span>
                        <span>Trust: <b>{c.trustScore}%</b></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          {selected && (
            <div className="detail-sidebar card">
              <div className="s-header">
                <div>
                  <h4 style={{ marginBottom: 2 }}>{selected.name}</h4>
                  <span className="s-email" style={{ display: 'block', marginBottom: 4 }}>{selected.email || 'No email provided'}</span>
                  <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>ID: {selected.sessionId.slice(0,8)}</span>
                </div>
                <button className="btn-close" onClick={() => setSelected(null)}>✕</button>
              </div>
              <div className="s-stats">
                {[ ['Score', `${selected.overallScore}/10`], ['Trust', `${selected.trustScore}%`], ['Role', ROLE_LABELS[selected.role] || selected.role], ['Lang', selected.language?.toUpperCase()] ].map(([l,v]) => (
                  <div key={l} className="s-stat-box"><span>{l}</span><b>{v}</b></div>
                ))}
              </div>
              {selected.skillScores && (
                <div className="s-skills">
                  {SKILL_KEYS.map(k => (
                    <div key={k} className="s-skill-row">
                      <div className="s-skill-label"><span>{k}</span><b>{selected.skillScores[k]}/10</b></div>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${(selected.skillScores[k]||0)*10}%` }} /></div>
                    </div>
                  ))}
                </div>
              )}
              {selected.fitmentReason && (
                <div className="s-reason" style={{ background: '#F0FDFA', border: '1px solid #5EEAD4', color: '#0F766E' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>AI Interview Summary</div>
                  <div style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>{selected.fitmentReason}</div>
                </div>
              )}
              <div className="s-notes">
                <label>Admin Notes</label>
                <textarea className="textarea" rows={3} value={editNotes} onChange={e => setEditNotes(e.target.value)} />
                <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} disabled={saving} onClick={() => updateCandidate(selected.sessionId, { adminNotes: editNotes })}>
                  {saving ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
              <div className="s-answers">
                {selected.answers?.map((a, i) => (
                  <div key={i} className="s-ans-box">
                    <div className="s-q">Q{i+1}: {a.questionText}</div>
                    <div className="s-tx">{a.transcript}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}

      <style>{`
        .nav-sep { width: 1; height: 16px; background: var(--border); margin: 0 8px; }
        .nav-tag { font-size: 0.85rem; color: var(--text-muted); background: var(--bg-hover); padding: 4px 10px; border-radius: 6px; }
        .btn-logout { background: transparent; border: none; cursor: pointer; color: var(--text-muted); font-size: 1.2rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { padding: 20px; text-align: center; }
        .stat-val { font-size: 1.8rem; font-weight: 800; font-family: var(--font-head); }
        .stat-label { font-size: 0.8rem; color: var(--text-muted); margin-top: 4px; }
        .filter-card { padding: 16px; margin-bottom: 24px; display: flex; gap: 12px; flex-wrap: wrap; }
        .filter-input { max-width: 240px; }
        .filter-select { max-width: 180px; }
        .loading-state, .empty-state { padding: 80px 20px; text-align: center; }
        .table-responsive { width: 100%; }
        .active-row { background: var(--brand-light) !important; }
        .cand-name { fontWeight: 600; color: var(--text-primary); font-size: 0.9rem; }
        .cand-email { color: var(--text-muted); font-size: 0.75rem; }
        .cand-score { fontWeight: 700; font-family: var(--font-head); }
        .mobile-list { display: none; }
        
        /* SIDEBAR */
        .detail-sidebar { padding: 24px; display: flex; flexDirection: column; gap: 20px; }
        .s-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .s-email { font-size: 0.8rem; color: var(--text-muted); }
        .btn-close { background: transparent; border: none; font-size: 1.1rem; cursor: pointer; color: var(--text-muted); }
        .s-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .s-stat-box { background: var(--bg-secondary); padding: 10px; border-radius: 8px; border: 1px solid var(--border); display: flex; flex-direction: column; }
        .s-stat-box span { font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 2px; }
        .s-stat-box b { font-size: 0.9rem; }
        .s-skill-row { margin-bottom: 12px; }
        .s-skill-label { display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px; }
        .s-reason { font-size: 0.85rem; padding: 12px; background: #EEF2FF; border-radius: 8px; color: #312E81; border: 1px solid #C7D2FE; }
        .s-ans-box { padding: 12px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border); margin-bottom: 10px; }
        .s-q { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px; }
        .s-tx { font-size: 0.85rem; color: var(--text-primary); border-left: 2px solid var(--blue); padding-left: 8px; }

        @media (max-width: 768px) {
          .nav-sep, .nav-tag { display: none; }
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .filter-card { flex-direction: column; }
          .filter-input, .filter-select { max-width: none; width: 100%; }
          .admin-grid { grid-template-columns: 1fr !important; }
          .table { display: none; }
          .mobile-list { display: flex; flex-direction: column; }
          .mobile-cand-card { padding: 16px; border-bottom: 1px solid var(--border); cursor: pointer; }
          .m-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
          .m-name { font-weight: 600; font-size: 1rem; }
          .m-meta { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 10px; }
          .m-stats { display: flex; gap: 16px; font-size: 0.85rem; color: var(--text-secondary); }
          .detail-sidebar { position: fixed; inset: 0; z-index: 1000; border-radius: 0; overflow-y: auto; }
        }
      `}</style>
    </div>
  );
}
