import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export default function Login() {
  const navigate = useNavigate();
  const [creds, setCreds]     = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await axios.post(`${API}/auth/login`, creds);
      localStorage.setItem('hv_token', data.token);
      localStorage.setItem('hv_user', JSON.stringify(data.user));
      
      if (data.user.role === 'organizer') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials.');
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
            <h2 style={{ color: 'var(--brand-primary)', marginBottom: 16, fontSize: '1.8rem', letterSpacing: '-0.02em' }}>Welcome Back</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 40, fontSize: '0.95rem' }}>
              Login to your account to continue. Whether you are an organizer managing candidates or a user taking an interview, HireVaani has you covered with AI-powered insights.
            </p>
          </div>
        </div>

        {/* Right panel — login form */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', background: 'var(--bg-secondary)' }}>
          <div style={{ width: '100%', maxWidth: 340 }}>
            <div className="fade-in-2" style={{ marginBottom: 32 }}>
              <h2 style={{ marginBottom: 8, fontSize: '1.5rem', color: 'var(--brand-primary)' }}>Sign In</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Access your dashboard with your credentials.</p>
            </div>

            <div className="fade-in-3">
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 20 }}>
                  <label className="label" htmlFor="login-email">Email</label>
                  <input
                    id="login-email"
                    className="input"
                    type="email"
                    placeholder="name@example.com"
                    value={creds.email}
                    onChange={e => setCreds(c => ({ ...c, email: e.target.value }))}
                    required autoFocus
                  />
                </div>
                <div style={{ marginBottom: 28 }}>
                  <label className="label" htmlFor="login-password">Password</label>
                  <input
                    id="login-password"
                    className="input"
                    type="password"
                    placeholder="Enter password"
                    value={creds.password}
                    onChange={e => setCreds(c => ({ ...c, password: e.target.value }))}
                    required
                  />
                </div>

                {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

                <button id="login-btn" className="btn btn-primary btn-lg" type="submit" style={{ width: '100%' }} disabled={loading}>
                  {loading
                    ? <><span className="spinner" style={{ width:16, height:16, borderWidth:2, borderColor:'rgba(255,255,255,0.3)', borderTopColor:'#fff' }} /> Signing in...</>
                    : 'Sign In'
                  }
                </button>
              </form>

              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Don't have an account? </span>
                <Link to="/signup" style={{ fontSize: '0.85rem', color: 'var(--brand-primary)', fontWeight: 600, transition: 'color 0.2s' }}>Create an account</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .auth-card {
          width: 100%;
          max-width: 900px;
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
