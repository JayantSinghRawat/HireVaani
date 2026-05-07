import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ name: '', email: '', password: '', role: 'user' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await axios.post(`${API}/auth/register`, form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyItems: 'center', background: 'var(--bg-secondary)', padding: '24px' }}>

      <div className="auth-card fade-in">
        
        {/* Left panel */}
        <div className="auth-sidebar" style={{ background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 48px', borderRight: '1px solid var(--border)' }}>
          <div className="fade-in-1">
            <div style={{ marginBottom: 40, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>H</span>
              </div>
              <span style={{ color: 'var(--brand-primary)', fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em' }}>HireVaani</span>
            </div>
            <h2 style={{ color: 'var(--brand-primary)', marginBottom: 16, fontSize: '1.8rem', letterSpacing: '-0.02em' }}>Join HireVaani</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 40, fontSize: '0.95rem' }}>
              Create an account to get started. Choose whether you want to take AI-powered interviews or organize them for your company.
            </p>
          </div>
        </div>

        {/* Right panel — signup form */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', background: 'var(--bg-secondary)' }}>
          <div style={{ width: '100%', maxWidth: 360 }}>
            <div className="fade-in-2" style={{ marginBottom: 32 }}>
              <h2 style={{ marginBottom: 8, fontSize: '1.5rem', color: 'var(--brand-primary)' }}>Create an Account</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Fill in your details to register.</p>
            </div>

            <div className="fade-in-3">
              <form onSubmit={handleSignup}>
                <div style={{ marginBottom: 20 }}>
                  <label className="label" htmlFor="signup-name">Full Name</label>
                  <input
                    id="signup-name"
                    className="input"
                    placeholder="e.g. Priya Sharma"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required autoFocus
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label className="label" htmlFor="signup-email">Email</label>
                  <input
                    id="signup-email"
                    className="input"
                    type="email"
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label className="label" htmlFor="signup-password">Password</label>
                  <input
                    id="signup-password"
                    className="input"
                    type="password"
                    placeholder="Create a password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                  />
                </div>

                <div style={{ marginBottom: 28 }}>
                  <label className="label">Account Type</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    {[{ value: 'user', label: 'Candidate' }, { value: 'organizer', label: 'Organizer' }].map(r => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, role: r.value }))}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${form.role === r.value ? 'var(--brand-primary)' : 'var(--border-strong)'}`,
                          background: form.role === r.value ? 'var(--brand-light)' : 'var(--bg-card)',
                          color: form.role === r.value ? 'var(--brand-primary)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          textAlign: 'center',
                          transition: 'all 0.2s',
                        }}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

                <button id="signup-btn" className="btn btn-primary btn-lg" type="submit" style={{ width: '100%' }} disabled={loading}>
                  {loading
                    ? <><span className="spinner" style={{ width:16, height:16, borderWidth:2, borderColor:'rgba(255,255,255,0.3)', borderTopColor:'#fff' }} /> Creating account...</>
                    : 'Create Account'
                  }
                </button>
              </form>

              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Already have an account? </span>
                <Link to="/login" style={{ fontSize: '0.85rem', color: 'var(--brand-primary)', fontWeight: 600, transition: 'color 0.2s' }}>Sign In</Link>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
      <style>{`
        .auth-card {
          width: 100%;
          max-width: 960px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          overflow: hidden;
          padding: 0;
          margin: auto;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
        }
        @media (max-width: 768px) {
          .auth-card {
            grid-template-columns: 1fr;
            max-width: 440px;
          }
          .auth-sidebar {
            display: none !important;
          }
          .auth-card > div:last-child {
            padding: 32px 24px !important;
          }
        }
      `}</style>
    </div>
  );
}
