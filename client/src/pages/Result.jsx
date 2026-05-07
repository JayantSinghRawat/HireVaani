import { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Radar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, RadialLinearScale, PointElement, LineElement,
  Filler, Tooltip, Legend, ArcElement,
} from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, ArcElement);

const ROLE_LABELS = {
  software_engineer: 'Software Engineer', data_analyst: 'Data Analyst',
  marketing_executive: 'Marketing Executive', hr_executive: 'HR Executive',
  sales_executive: 'Sales Executive', customer_support: 'Customer Support',
};
const LANG_LABELS = { en: 'English', hi: 'Hindi', kn: 'Kannada' };

const DECISION_CONFIG = {
  Shortlisted:    { badgeClass: 'badge-emerald', bg: 'var(--emerald-light)', border: '#a7f3d0', color: 'var(--emerald-dark)', label: 'Shortlisted' },
  'Under Review': { badgeClass: 'badge-amber',   bg: 'var(--amber-light)',   border: '#fde68a', color: 'var(--amber)',       label: 'Under Review' },
  'Not Fit':      { badgeClass: 'badge-rose',    bg: 'var(--rose-light)',    border: '#fecdd3', color: 'var(--rose)',        label: 'Not Fit' },
  Pending:        { badgeClass: 'badge-blue',    bg: 'var(--blue-light)',    border: '#bfdbfe', color: 'var(--blue-dark)',   label: 'Pending' },
};

const SKILL_LABELS = ['Relevance', 'Clarity', 'Confidence', 'Technical', 'Communication'];
const TOTAL_QUESTIONS = 5;

export default function Result() {
  const { state: locationState } = useLocation();
  const navigate  = useNavigate();

  // Normalize state (handle both direct state and nested { result: ... } from dashboard)
  const state = locationState?.result || locationState;

  useEffect(() => { 
    if (!state?.sessionId) {
      console.warn('No session ID found in state, redirecting...');
      navigate('/dashboard'); 
    }
  }, [state, navigate]);

  if (!state) return null;

  const {
    name = 'User', role = 'software_engineer', language = 'en',
    overallScore = 0, skillScores = {}, trustScore = 0,
    fitmentDecision = 'Pending', fitmentReason = '',
    answers = [],
  } = state;

  const skillData = [
    skillScores.relevance || 0, skillScores.clarity || 0, skillScores.confidence || 0,
    skillScores.technical || 0, skillScores.communication || 0,
  ];

  const dc = DECISION_CONFIG[fitmentDecision] || DECISION_CONFIG.Pending;
  const scoreColor = overallScore >= 7.5 ? 'var(--emerald-dark)' : overallScore >= 5 ? 'var(--amber)' : 'var(--rose)';
  const trustColor = trustScore >= 70 ? 'var(--emerald)' : trustScore >= 40 ? 'var(--amber)' : 'var(--rose)';

  const radarData = {
    labels: SKILL_LABELS,
    datasets: [{
      label: 'Score',
      data: skillData,
      backgroundColor: 'rgba(37,99,235,0.08)',
      borderColor: '#2563eb',
      pointBackgroundColor: '#2563eb',
      pointBorderColor: '#fff',
      pointRadius: 5,
      borderWidth: 2,
      fill: true,
    }],
  };

  const radarOptions = {
    responsive: true, maintainAspectRatio: true,
    scales: { r: {
      min: 0, max: 10, ticks: { stepSize: 2, color: '#94a3b8', backdropColor: 'transparent', font: { size: 10 } },
      grid: { color: '#e2e8f0' },
      pointLabels: { color: '#475569', font: { size: 11, family: 'Inter' } },
      angleLines: { color: '#e2e8f0' },
    }},
    plugins: { legend: { display: false } },
  };

  const donutData = {
    datasets: [{
      data: [trustScore, 100 - trustScore],
      backgroundColor: [
        trustScore >= 70 ? '#059669' : trustScore >= 40 ? '#d97706' : '#e11d48',
        '#f1f5f9',
      ],
      borderWidth: 0, cutout: '78%',
    }],
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: 60, background: 'var(--bg-secondary)', paddingBottom: 60 }}>
      <nav className="navbar">
        <span className="navbar-brand">HireVaani</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <Link to="/" className="btn btn-outline btn-sm">New Interview</Link>
          <Link to="/admin" className="btn btn-ghost btn-sm">Admin</Link>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: 32 }}>
        {/* Header */}
        <div className="fade-in" style={{ marginBottom: 28 }}>
          <h2 style={{ marginBottom: 4 }}>Interview Complete</h2>
          <p>{name} &middot; {ROLE_LABELS[role]} &middot; {LANG_LABELS[language]}</p>
        </div>

        {/* Fitment banner */}
        <div className="card fade-in fade-in-1 fitment-banner" style={{ padding: '24px 28px', marginBottom: 24, background: dc.bg, border: `1.5px solid ${dc.border}`, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: dc.color, marginBottom: 6 }}>
              AI Fitment Decision
            </div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.75rem', fontWeight: 800, color: dc.color, marginBottom: 8 }}>
              {fitmentDecision}
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>{fitmentReason}</p>
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '2.5rem', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
              {overallScore}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>out of 10</div>
          </div>
        </div>

        {/* Charts grid */}
        <div className="result-grid">
          {/* Radar */}
          <div className="card fade-in fade-in-2" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h4>Skill Assessment</h4>
              <span className="badge badge-blue">Gemini AI</span>
            </div>
            <Radar data={radarData} options={radarOptions} />
            <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 7 }}>
              {SKILL_LABELS.map((l, i) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{l}</span>
                  <span style={{ fontWeight: 700, color: skillData[i] >= 7 ? 'var(--emerald)' : skillData[i] >= 5 ? 'var(--amber)' : 'var(--rose)' }}>{skillData[i]}/10</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust + summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card fade-in fade-in-2" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 100, position: 'relative', flexShrink: 0 }}>
                <Doughnut data={donutData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '1.1rem', color: trustColor }}>{trustScore}%</span>
                </div>
              </div>
              <div>
                <h4 style={{ marginBottom: 6 }}>Trust Score</h4>
                <p style={{ fontSize: '0.85rem', marginBottom: 10 }}>Based on face monitoring throughout the interview.</p>
                <span className={`badge ${trustScore >= 70 ? 'badge-emerald' : trustScore >= 40 ? 'badge-amber' : 'badge-rose'}`}>
                  {trustScore >= 70 ? 'High' : trustScore >= 40 ? 'Moderate' : 'Low'} Trust
                </span>
              </div>
            </div>

            <div className="card fade-in fade-in-3" style={{ padding: '20px 22px', flex: 1 }}>
              <h4 style={{ marginBottom: 14 }}>Summary</h4>
              {[
                ['Questions Answered', `${answers.length} / ${TOTAL_QUESTIONS}`],
                ['Strongest Skill',    SKILL_LABELS[skillData.indexOf(Math.max(...skillData))]],
                ['Needs Improvement',  SKILL_LABELS[skillData.indexOf(Math.min(...skillData))]],
                ['Language',           LANG_LABELS[language]],
                ['Role',               ROLE_LABELS[role]],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 9, marginBottom: 9, borderBottom: '1px solid var(--border)', fontSize: '0.84rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{l}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Answer review */}
        <div className="card fade-in fade-in-4" style={{ padding: '24px 28px', marginBottom: 24 }}>
          <h4 style={{ marginBottom: 20 }}>Answer Review</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {answers.map((a, i) => (
              <div key={i} style={{ padding: '16px 18px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <span className="badge badge-gray" style={{ marginBottom: 8, display: 'inline-block', fontSize: '0.7rem' }}>Q{i + 1}</span>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.9rem', margin: 0 }}>{a.questionText}</p>
                  </div>
                  {a.geminiScores && (
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                      <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '1.15rem', color: 'var(--blue)' }}>
                        {((Object.values(a.geminiScores).slice(0,5).reduce((a,b)=>a+b,0))/5).toFixed(1)}
                      </span>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>avg</div>
                    </div>
                  )}
                </div>
                <div style={{ padding: '9px 12px', background: '#fff', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: 8, fontSize: '0.85rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--blue)' }}>
                  {a.transcript || 'No transcript available'}
                </div>
                {a.geminiScores?.feedback && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--emerald-dark)', margin: 0 }}>
                    Feedback: {a.geminiScores.feedback}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="result-actions" style={{ display: 'flex', gap: 12 }}>
          <Link to="/dashboard" className="btn btn-primary btn-lg">Back to Dashboard</Link>
          <Link to="/admin" className="btn btn-outline btn-lg">Organizer View</Link>
        </div>
      </div>

      <style>{`
        .result-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }
        @media (max-width: 768px) {
          .result-grid {
            grid-template-columns: 1fr;
          }
          .fitment-banner {
            flex-direction: column !important;
            text-align: center;
            padding: 24px 20px !important;
          }
          .result-actions {
            flex-direction: column;
          }
          .result-actions .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
