import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

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
  } catch (e) {
    // ignore
  }

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
  }, []); // eslint-disable-line

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
    } catch { showToast('Save failed — please try again'); }
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
    } catch (err) {
      showToast('Failed to create interview');
    } finally {
      setCreatingInterview(false);
    }
  };

  const handleLogout = () => { 
    localStorage.removeItem('hv_token'); 
    localStorage.removeItem('hv_user'); 
    navigate('/login'); 
  };

  const filtered = candidates.filter(c => {
    if (filter.role     && c.role !== filter.role)               return false;
    if (filter.decision && c.fitmentDecision !== filter.decision) return false;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      if (!c.name?.toLowerCase().includes(q) && !c.email?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const stats = {
    total:       candidates.length,
    shortlisted: candidates.filter(c => c.fitmentDecision === 'Shortlisted').length,
    review:      candidates.filter(c => c.fitmentDecision === 'Under Review').length,
    notFit:      candidates.filter(c => c.fitmentDecision === 'Not Fit').length,
    avgScore:    candidates.length
      ? (candidates.reduce((s,c) => s + (c.overallScore||0), 0) / candidates.length).toFixed(1)
      : '—',
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: 64, background: 'var(--bg-secondary)' }}>
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link to="/" className="navbar-brand">HireVaani</Link>
          <div style={{ width: 1, height: 16, background: 'var(--border)' }}></div>
          <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '4px 10px', borderRadius: '6px' }}>Organizer Portal</span>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddInterview(true)}>+ Add Interview</button>
          <button className="btn btn-ghost btn-sm" onClick={fetchCandidates}>Refresh</button>
          <div style={{ width: 1, height: 16, background: 'var(--border)' }}></div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ 
              width: 32, height: 32, borderRadius: '50%', background: 'var(--brand-light)', color: 'var(--brand-primary)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 600, border: '1px solid var(--border)' 
            }}>
              {username.charAt(0).toUpperCase()}
            </div>
            <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }} title="Sign Out">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: 28, paddingBottom: 48 }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 4 }}>Candidate Dashboard</h2>
          <p style={{ fontSize: '0.9rem' }}>Review and manage all interview submissions.</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total',        value: stats.total,       color: 'var(--blue)' },
            { label: 'Shortlisted',  value: stats.shortlisted, color: 'var(--emerald)' },
            { label: 'Under Review', value: stats.review,      color: 'var(--amber)' },
            { label: 'Not Fit',      value: stats.notFit,      color: 'var(--rose)' },
            { label: 'Avg Score',    value: `${stats.avgScore}/10`, color: 'var(--purple)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="card" style={{ padding: '14px 18px', marginBottom: 18, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            id="admin-search" className="input"
            style={{ maxWidth: 220 }}
            placeholder="Search by name or email..."
            value={filter.search}
            onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
          />
          <select id="filter-role" className="select" style={{ maxWidth: 180 }} value={filter.role} onChange={e => setFilter(f => ({ ...f, role: e.target.value }))}>
            <option value="">All Roles</option>
            {Object.entries(ROLE_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select id="filter-decision" className="select" style={{ maxWidth: 180 }} value={filter.decision} onChange={e => setFilter(f => ({ ...f, decision: e.target.value }))}>
            <option value="">All Decisions</option>
            <option>Shortlisted</option>
            <option>Under Review</option>
            <option>Not Fit</option>
            <option>Pending</option>
          </select>
          <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {filtered.length} of {candidates.length} candidates
          </span>
        </div>

        <div className="admin-main-grid" style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20 }}>
          {/* Table */}
          <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
            {loading ? (
              <div style={{ padding: 60, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div className="spinner" /><p>Loading candidates...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center' }}>
                <h4 style={{ marginBottom: 8 }}>No candidates found</h4>
                <p style={{ marginBottom: 20 }}>Complete an interview to see results here.</p>
                <Link to="/" className="btn btn-primary btn-sm">Start Interview</Link>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    {['Candidate','Role','Language','Score','Trust','Decision','Action'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const isActive = selected?.sessionId === c.sessionId;
                    return (
                      <tr key={c.sessionId}
                        onClick={() => openCandidate(c)}
                        style={{ cursor: 'pointer', background: isActive ? 'var(--blue-light)' : undefined }}
                      >
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{c.name}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{c.email || '—'}</div>
                        </td>
                        <td>{ROLE_LABELS[c.role] || c.role}</td>
                        <td style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600 }}>{c.language}</td>
                        <td>
                          <span style={{ fontWeight: 700, fontFamily: 'var(--font-head)', color: (c.overallScore||0)>=7?'var(--emerald)':(c.overallScore||0)>=5?'var(--amber)':'var(--rose)' }}>
                            {c.overallScore || '—'}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>/10</span>
                        </td>
                        <td style={{ fontWeight: 600, color: (c.trustScore||0)>=70?'var(--emerald)':(c.trustScore||0)>=40?'var(--amber)':'var(--rose)' }}>
                          {c.trustScore ?? '—'}%
                        </td>
                        <td><span className={`badge ${DECISION_BADGE[c.fitmentDecision] || 'badge-gray'}`}>{c.fitmentDecision || 'Pending'}</span></td>
                        <td onClick={e => e.stopPropagation()}>
                          <select
                            className="select"
                            style={{ padding: '5px 8px', fontSize: '0.78rem', width: 'auto', minWidth: 130 }}
                            value={c.fitmentDecision || 'Pending'}
                            onChange={e => updateCandidate(c.sessionId, { fitmentDecision: e.target.value })}
                          >
                            <option>Shortlisted</option>
                            <option>Under Review</option>
                            <option>Not Fit</option>
                            <option>Pending</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card" style={{ padding: '22px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                  <div>
                    <h4 style={{ marginBottom: 2 }}>{selected.name}</h4>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{selected.email || 'No email'}</span>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>Close</button>
                </div>

                {/* Score grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 18 }}>
                  {[
                    ['Overall Score', `${selected.overallScore}/10`],
                    ['Trust Score',   `${selected.trustScore}%`],
                    ['Role',          ROLE_LABELS[selected.role] || selected.role],
                    ['Language',      selected.language?.toUpperCase()],
                  ].map(([l,v]) => (
                    <div key={l} style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{l}</div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* Skill bars */}
                {selected.skillScores && (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 10 }}>Skill Breakdown</div>
                    {SKILL_KEYS.map(k => (
                      <div key={k} style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{k}</span>
                          <span style={{ fontWeight: 600 }}>{selected.skillScores[k]}/10</span>
                        </div>
                        <div className="progress-bar" style={{ height: 4 }}>
                          <div className="progress-fill" style={{ width: `${(selected.skillScores[k]||0)*10}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selected.fitmentReason && (
                  <div className="alert alert-info" style={{ marginBottom: 16, fontSize: '0.82rem', lineHeight: 1.6 }}>
                    <strong>AI Reasoning:</strong> {selected.fitmentReason}
                  </div>
                )}

                <div style={{ marginBottom: 14 }}>
                  <label className="label">Admin Notes</label>
                  <textarea className="textarea" rows={3} style={{ fontSize: '0.85rem' }}
                    placeholder="Add notes about this candidate..."
                    value={editNotes} onChange={e => setEditNotes(e.target.value)} />
                </div>

                <button id="save-notes-btn" className="btn btn-primary" style={{ width: '100%' }} disabled={saving}
                  onClick={() => updateCandidate(selected.sessionId, { adminNotes: editNotes })}>
                  {saving ? <><span className="spinner" style={{ width:14,height:14,borderWidth:2,borderColor:'rgba(255,255,255,0.3)',borderTopColor:'#fff' }} /> Saving...</> : 'Save Notes'}
                </button>
              </div>

              {/* Answers */}
              {selected.answers?.length > 0 && (
                <div className="card" style={{ padding: '18px 20px' }}>
                  <h4 style={{ marginBottom: 14, fontSize: '0.9rem' }}>Interview Answers</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 380, overflowY: 'auto' }}>
                    {selected.answers.map((a, i) => (
                      <div key={i} style={{ padding: '11px 13px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: 5 }}>Q{i+1}: {a.questionText}</div>
                        <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: 8, borderLeft: '3px solid var(--blue)', paddingLeft: 10 }}>
                          {a.transcript || 'No transcript'}
                        </div>
                        {a.geminiScores && (
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                            {a.geminiScores.isCorrect !== undefined && (
                              <span className={`badge ${a.geminiScores.isCorrect ? 'badge-emerald' : 'badge-rose'}`} style={{ fontSize: '0.68rem', padding: '2px 7px', marginRight: '6px' }}>
                                {a.geminiScores.isCorrect ? '✓ CORRECT' : '✗ INCORRECT'}
                              </span>
                            )}
                            {Object.entries(a.geminiScores).filter(([k]) => k !== 'feedback' && k !== 'isCorrect').map(([k,v]) => (
                              <span key={k} className="badge badge-blue" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                                {k[0].toUpperCase()}: {v}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}

      {/* Add Interview Modal */}
      {showAddInterview && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999,
          background: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
        }} onClick={() => setShowAddInterview(false)}>
          <div style={{ 
            background: 'var(--bg-primary)', width: '100%', maxWidth: 600, borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>Create New Interview</h3>
              <button onClick={() => setShowAddInterview(false)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>✕</button>
            </div>
            
            <div style={{ padding: '24px 32px', overflowY: 'auto' }}>
              <form id="add-interview-form" onSubmit={handleCreateInterview}>
                <div style={{ marginBottom: 16 }}>
                  <label className="label">Company Name</label>
                  <input className="input" required value={newInterview.companyName} onChange={e => setNewInterview({...newInterview, companyName: e.target.value})} placeholder="e.g. TechCorp India" />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label className="label">Role Applying For</label>
                    <select className="select" required value={newInterview.role} onChange={e => setNewInterview({...newInterview, role: e.target.value})}>
                      {Object.entries(ROLE_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Date & Time</label>
                    <input type="datetime-local" className="input" required value={newInterview.date} onChange={e => setNewInterview({...newInterview, date: e.target.value})} />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className="label">Job Description</label>
                  <textarea className="textarea" rows={2} required value={newInterview.description} onChange={e => setNewInterview({...newInterview, description: e.target.value})} placeholder="Briefly describe the role..." />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className="label">Required Skills (comma separated)</label>
                  <input className="input" required value={newInterview.requiredSkills} onChange={e => setNewInterview({...newInterview, requiredSkills: e.target.value})} placeholder="e.g. React, Node.js, SQL" />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className="label">Instructions for Candidate</label>
                  <textarea className="textarea" rows={2} required value={newInterview.instructions} onChange={e => setNewInterview({...newInterview, instructions: e.target.value})} placeholder="e.g. Ensure you have a stable internet connection..." />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className="label">Custom Questions (One per line)</label>
                  <textarea className="textarea" rows={4} value={newInterview.customQuestions} onChange={e => setNewInterview({...newInterview, customQuestions: e.target.value})} placeholder="Enter custom questions you'd like the AI to ask, one per line..." />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>These questions will be prioritized by the AI interviewer.</div>
                </div>
              </form>
            </div>
            
            <div style={{ padding: '20px 32px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setShowAddInterview(false)} className="btn btn-ghost">Cancel</button>
              <button form="add-interview-form" type="submit" className="btn btn-primary" disabled={creatingInterview}>
                {creatingInterview ? 'Creating...' : 'Create Interview'}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @media (max-width: 768px) {
          .admin-main-grid { grid-template-columns: 1fr !important; }
          .admin-navbar-actions { gap: 8px !important; }
          .admin-navbar-actions .btn-sm { padding: 5px 10px; font-size: 0.78rem; }
        }
      `}</style>
    </div>
  );
}
