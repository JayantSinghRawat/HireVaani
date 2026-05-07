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
  const [candidates, setCandidates] = useState([]);
  const [allInterviews, setAllInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedInterview, setSelectedInterview] = useState(null); // Drill-down state
  
  const [filter, setFilter] = useState({ search: '', decision: '' });
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
    setSelectedCandidate(candidate);
    const token = localStorage.getItem('hv_token');
    try {
      const { data } = await axios.get(`${API}/candidates/${candidate.sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedCandidate(data);
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
      if (selectedCandidate?.sessionId === sessionId) setSelectedCandidate({ ...selectedCandidate, ...updates });
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

  // Filter candidates based on selected interview role
  const filteredCandidates = candidates.filter(c => {
    const matchInterview = !selectedInterview || c.role === selectedInterview.role;
    const s = filter.search.toLowerCase();
    const matchSearch = c.name.toLowerCase().includes(s) || (c.email && c.email.toLowerCase().includes(s));
    const matchDecision = !filter.decision || c.fitmentDecision === filter.decision;
    return matchInterview && matchSearch && matchDecision;
  });

  const getInterviewStats = (role) => {
    const roleCandidates = candidates.filter(c => c.role === role);
    return {
      total: roleCandidates.length,
      shortlisted: roleCandidates.filter(c => c.fitmentDecision === 'Shortlisted').length,
      review: roleCandidates.filter(c => c.fitmentDecision === 'Under Review').length,
      notFit: roleCandidates.filter(c => c.fitmentDecision === 'Not Fit').length,
    };
  };

  return (
    <div className="admin-layout">
      
      <div className="mobile-header">
        <button onClick={() => setIsSidebarOpen(true)} className="icon-btn">☰</button>
        <span style={{ fontWeight: 800 }}>HireVaani Admin</span>
        <div style={{ width: 32 }} />
      </div>

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
          <button onClick={() => { setSelectedInterview(null); setIsSidebarOpen(false); }} className={`nav-item ${!selectedInterview ? 'active' : ''}`}>
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

      <div className="main-content">
        
        {!selectedInterview ? (
          /* ================= INTERVIEW LIST VIEW ================= */
          <>
            <div className="page-header flex-between">
              <div>
                <h1>Interviews</h1>
                <p>Select an interview to view candidates and results.</p>
              </div>
              <button onClick={() => setShowCreateModal(true)} className="create-btn-enhanced">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Create New
              </button>
            </div>

            <div className="interviews-grid">
              {loading ? <div className="loading-state">Loading interviews...</div> : 
               allInterviews.length === 0 ? <div className="empty-state card">No interviews yet. Create your first one above.</div> :
               allInterviews.map(iv => {
                const s = getInterviewStats(iv.role);
                return (
                  <div key={iv.id || iv._id} className="interview-card card" onClick={() => setSelectedInterview(iv)} style={{ cursor: 'pointer' }}>
                    <div className="iv-header">
                      <h3>{ROLE_LABELS[iv.role] || iv.role}</h3>
                      <button onClick={e => { e.stopPropagation(); handleDeleteInterview(iv.id || iv._id); }} className="delete-btn-enhanced" style={{ padding: '4px' }}>
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                    <div className="iv-company" style={{ color: '#6B7280', fontSize: '0.85rem' }}>{iv.companyName}</div>
                    
                    <div className="mini-stats" style={{ display: 'flex', gap: 12, margin: '20px 0' }}>
                       <div style={{ flex: 1, textAlign: 'center' }}>
                         <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{s.total}</div>
                         <div style={{ fontSize: '0.65rem', color: '#6B7280', textTransform: 'uppercase' }}>Applied</div>
                       </div>
                       <div style={{ flex: 1, textAlign: 'center' }}>
                         <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{s.shortlisted}</div>
                         <div style={{ fontSize: '0.65rem', color: '#6B7280', textTransform: 'uppercase' }}>Shortlisted</div>
                       </div>
                    </div>

                    <div className="iv-footer">
                      <span className="iv-date">{new Date(iv.date).toLocaleDateString()}</span>
                      <span className="badge badge-gray">View Candidates →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* ================= CANDIDATE LIST VIEW (DRILL DOWN) ================= */
          <>
            <div className="page-header">
              <button onClick={() => setSelectedInterview(null)} className="btn-secondary btn-sm" style={{ marginBottom: 16 }}>← Back to Interviews</button>
              <h1>{ROLE_LABELS[selectedInterview.role] || selectedInterview.role} Candidates</h1>
              <p>{selectedInterview.companyName} &middot; {new Date(selectedInterview.date).toLocaleDateString()}</p>
            </div>

            <div className="stats-container">
              {[
                { label: 'Applied', value: getInterviewStats(selectedInterview.role).total, color: '#000' },
                { label: 'Shortlisted', value: getInterviewStats(selectedInterview.role).shortlisted, color: '#000' },
                { label: 'Under Review', value: getInterviewStats(selectedInterview.role).review, color: '#000' },
                { label: 'Not Fit', value: getInterviewStats(selectedInterview.role).notFit, color: '#000' },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div className="stat-val">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="filter-bar card">
              <input className="input" placeholder="Search by name or email..." value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} />
              <select className="select" value={filter.decision} onChange={e => setFilter(f => ({ ...f, decision: e.target.value }))}>
                <option value="">All Decisions</option>
                {['Shortlisted','Under Review','Not Fit','Pending'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>

            <div className="data-section card">
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '30%' }}>Candidate</th>
                      <th style={{ width: '15%' }}>Score</th>
                      <th style={{ width: '15%' }}>Trust</th>
                      <th style={{ width: '20%' }}>Decision</th>
                      <th style={{ width: '20%' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCandidates.length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>No candidates found for this interview.</td></tr>
                    ) : filteredCandidates.map(c => (
                      <tr key={c.sessionId} onClick={() => openCandidate(c)} className={selectedCandidate?.sessionId === c.sessionId ? 'active' : ''}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#000' }}>{c.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{c.email}</div>
                        </td>
                        <td style={{ fontWeight: 800 }}>{c.overallScore || '—'}/10</td>
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
            </div>
          </>
        )}
      </div>

      {/* Detailed View Drawer */}
      {selectedCandidate && (
        <>
          <div className="detail-drawer-overlay" onClick={() => setSelectedCandidate(null)} />
          <div className="detail-drawer">
            <div className="detail-header">
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 4px', color: '#000' }}>{selectedCandidate.name}</h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#6B7280' }}>{selectedCandidate.email} &middot; {ROLE_LABELS[selectedCandidate.role] || selectedCandidate.role}</p>
              </div>
              <button onClick={() => setSelectedCandidate(null)} className="close-btn" style={{ fontSize: '1.5rem' }}>✕</button>
            </div>
            
            <div className="detail-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: '#F9FAFB', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #E5E7EB' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: 4 }}>Score</label>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{selectedCandidate.overallScore || '—'}/10</div>
                </div>
                <div style={{ background: '#F9FAFB', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #E5E7EB' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: 4 }}>Trust</label>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{selectedCandidate.trustScore || '—'}%</div>
                </div>
              </div>

              <div style={{ background: '#F9FAFB', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Summary</h3>
                <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6 }}>{selectedCandidate.fitmentReason || 'No summary available.'}</p>
              </div>

              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Skills</h3>
                {SKILL_KEYS.map(k => (
                  <div key={k} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
                      <span style={{ textTransform: 'capitalize' }}>{k}</span>
                      <b>{selectedCandidate.skillScores?.[k] || 0}/10</b>
                    </div>
                    <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: '#000', width: `${(selectedCandidate.skillScores?.[k]||0)*10}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Transcript</h3>
                {!selectedCandidate.answers ? (
                   <div style={{ textAlign: 'center', color: '#6B7280', fontSize: '0.9rem' }}>Loading details...</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {selectedCandidate.answers.map((a, i) => (
                      <div key={i} style={{ padding: '20px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#000', color: '#fff', padding: '2px 8px', borderRadius: '4px', height: 'fit-content' }}>Q{i+1}</span>
                          <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, lineHeight: 1.4 }}>{a.questionText}</p>
                        </div>
                        <div style={{ padding: '12px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: 12 }}>
                          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#9CA3AF', marginBottom: 4 }}>RESPONSE</div>
                          <p style={{ fontSize: '0.85rem', color: '#374151', margin: 0, lineHeight: 1.5 }}>{a.transcript || 'No response recorded.'}</p>
                        </div>
                        {a.geminiScores?.feedback && (
                          <div style={{ padding: '10px 12px', background: '#F3F4F6', borderRadius: '8px' }}>
                             <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#000', marginBottom: 4 }}>AI FEEDBACK</div>
                             <p style={{ fontSize: '0.8rem', color: '#4B5563', margin: 0, fontStyle: 'italic' }}>{a.geminiScores.feedback}</p>
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
          <div className="modal-box card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h2 style={{ marginBottom: 24 }}>Create Interview</h2>
            <form onSubmit={handleCreateInterview}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Interview Role</label>
                <input className="input" placeholder="e.g. Senior Teacher" value={newIv.role} onChange={e => setNewIv({ ...newIv, role: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Deadline Date</label>
                <input className="input" type="date" value={newIv.date} onChange={e => setNewIv({ ...newIv, date: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Role Description</label>
                <textarea className="textarea" rows={3} placeholder="Key requirements..." value={newIv.description} onChange={e => setNewIv({ ...newIv, description: e.target.value })} />
              </div>
              <div className="modal-footer" style={{ border: 'none', padding: 0, background: 'none' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary" style={{ marginRight: 12 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: '#000' }}>Create Interview</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}

      <style>{`
        .admin-layout { display: flex; height: 100vh; width: 100vw; background: #FFFFFF; overflow: hidden; position: relative; }
        .sidebar { width: 260px; height: 100%; background: #000000; color: #fff; display: flex; flex-direction: column; z-index: 1001; transition: transform 0.3s ease; }
        .sidebar-header { padding: 32px 24px; display: flex; align-items: center; justify-content: space-between; }
        .brand { display: flex; align-items: center; gap: 12px; font-weight: 800; font-size: 1.25rem; }
        .brand-logo { width: 32px; height: 32px; background: #fff; color: #000; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .close-sidebar-btn { display: none; background: transparent; border: none; color: #fff; font-size: 1.2rem; cursor: pointer; }
        .nav-list { flex: 1; padding: 0 16px; display: flex; flex-direction: column; gap: 6px; }
        .nav-item { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 10px; background: transparent; border: none; color: #9CA3AF; cursor: pointer; text-align: left; font-size: 0.95rem; font-weight: 500; transition: all 0.2s; }
        .nav-item:hover { background: #1F2937; color: #fff; }
        .nav-item.active { background: #FFFFFF; color: #000000; }
        .sidebar-footer { padding: 24px; border-top: 1px solid #1F2937; }
        .logout-btn { display: flex; align-items: center; gap: 10px; width: 100%; background: transparent; border: none; color: #EF4444; cursor: pointer; font-size: 0.95rem; font-weight: 600; }
        
        .main-content { flex: 1; height: 100%; overflow-y: auto; padding: 40px; }
        .mobile-header { display: none; width: 100%; height: 60px; background: #fff; border-bottom: 1px solid #E5E7EB; align-items: center; justify-content: space-between; padding: 0 16px; position: sticky; top: 0; z-index: 900; }
        .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; }
        
        .page-header { margin-bottom: 32px; }
        .page-header h1 { font-size: 1.8rem; font-weight: 800; margin-bottom: 8px; color: #000; }
        
        .stats-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; margin-bottom: 32px; }
        .stat-card { background: #fff; padding: 24px; border-radius: 12px; border: 1px solid #E5E7EB; text-align: center; }
        .stat-val { font-size: 1.8rem; font-weight: 800; }
        .stat-label { font-size: 0.75rem; color: #6B7280; margin-top: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

        .card { background: #fff; border-radius: 16px; border: 1px solid #E5E7EB; }
        .filter-bar { padding: 16px; margin-bottom: 24px; display: flex; gap: 12px; align-items: center; }
        .input { flex: 1; padding: 10px 14px; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 0.9rem; outline: none; }
        .select { padding: 10px 14px; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 0.9rem; background: #fff; outline: none; }

        .data-section { overflow: hidden; border: 1px solid #E5E7EB; }
        .table-wrapper { width: 100%; overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; min-width: 800px; table-layout: fixed; }
        .admin-table th { text-align: left; padding: 16px; background: #F9FAFB; border-bottom: 1px solid #E5E7EB; font-size: 0.75rem; color: #6B7280; text-transform: uppercase; }
        .admin-table td { padding: 16px; border-bottom: 1px solid #E5E7EB; font-size: 0.9rem; vertical-align: middle; }
        .admin-table tr:hover { background: #F9FAFB; cursor: pointer; }
        .admin-table tr.active { background: #F3F4F6; }

        .detail-drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); backdrop-filter: blur(2px); z-index: 1050; }
        .detail-drawer { position: fixed; top: 0; right: 0; width: 550px; height: 100%; background: #fff; z-index: 1060; display: flex; flex-direction: column; box-shadow: -10px 0 30px rgba(0,0,0,0.1); }
        .detail-header { padding: 32px; border-bottom: 1px solid #E5E7EB; display: flex; justify-content: space-between; }
        .detail-body { padding: 32px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 32px; }
        .close-btn { background: transparent; border: none; cursor: pointer; color: #9CA3AF; }

        .create-btn-enhanced { display: flex; align-items: center; gap: 8px; background: #000; color: #fff; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; }
        .interviews-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
        .interview-card { padding: 24px; transition: all 0.2s; }
        .interview-card:hover { border-color: #000; transform: translateY(-2px); }
        .iv-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .iv-header h3 { margin: 0; font-size: 1.1rem; font-weight: 800; color: #000; }
        
        .delete-btn-enhanced { background: #F3F4F6; color: #000; border: none; padding: 6px; border-radius: 6px; cursor: pointer; }
        .delete-btn-enhanced:hover { background: #000; color: #fff; }

        .badge { padding: 4px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; border: 1px solid #E5E7EB; }
        .badge-emerald { background: #000; color: #fff; }
        .badge-amber { background: #F3F4F6; color: #000; }
        .badge-rose { background: #FFFFFF; color: #000; }
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
