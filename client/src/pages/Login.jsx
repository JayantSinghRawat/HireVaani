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
      if (data.user.role === 'organizer') navigate('/admin');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        
        {/* Left panel */}
        <div className="auth-sidebar">
          <div className="fade-in-1">
            <div className="auth-brand">
              <div className="brand-icon">H</div>
              <span className="brand-text">HireVaani</span>
            </div>
            <h2 className="sidebar-title">Welcome Back</h2>
            <p className="sidebar-desc">
              Login to your account to continue. Whether you are an organizer managing candidates or a user taking an interview, HireVaani has you covered with AI-powered insights.
            </p>
          </div>
        </div>

        {/* Right panel */}
        <div className="auth-form-container">
          <div className="auth-form-box">
            <div className="fade-in-2" style={{ marginBottom: 32 }}>
              <h2 style={{ marginBottom: 8, fontSize: '1.5rem', color: 'var(--brand-primary)' }}>Sign In</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Access your dashboard with your credentials.</p>
            </div>

            <div className="fade-in-3">
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 20 }}>
                  <label className="label">Email</label>
                  <input
                    className="input" type="email" placeholder="name@example.com"
                    value={creds.email} onChange={e => setCreds(c => ({ ...c, email: e.target.value }))}
                    required autoFocus
                  />
                </div>
                <div style={{ marginBottom: 28 }}>
                  <label className="label">Password</label>
                  <input
                    className="input" type="password" placeholder="Enter password"
                    value={creds.password} onChange={e => setCreds(c => ({ ...c, password: e.target.value }))}
                    required
                  />
                </div>

                {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

                <button className="btn btn-primary btn-lg" type="submit" style={{ width: '100%' }} disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Don't have an account? </span>
                <Link to="/signup" style={{ fontSize: '0.85rem', color: 'var(--brand-primary)', fontWeight: 600 }}>Create an account</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary);
          padding: 24px;
        }
        .auth-card {
          width: 100%;
          max-width: 900px;
          display: flex;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          overflow: hidden;
        }
        .auth-sidebar {
          flex: 1;
          background: #fff;
          padding: 60px 48px;
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .auth-form-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          background: var(--bg-secondary);
        }
        .auth-form-box {
          width: 100%;
          max-width: 340px;
        }
        .auth-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 40px;
        }
        .brand-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: var(--brand-primary);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }
        .brand-text {
          color: var(--brand-primary);
          font-size: 1.4rem;
          font-weight: 700;
        }
        .sidebar-title {
          font-size: 1.8rem;
          margin-bottom: 16px;
          color: var(--brand-primary);
        }
        .sidebar-desc {
          color: var(--text-secondary);
          line-height: 1.8;
          font-size: 0.95rem;
        }

        @media (max-width: 850px) {
          .auth-sidebar {
            display: none !important;
          }
          .auth-card {
            max-width: 440px;
          }
          .auth-form-container {
            padding: 40px 24px;
          }
        }
      `}</style>
    </div>
  );
}
