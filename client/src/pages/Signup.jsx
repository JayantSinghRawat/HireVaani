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
    <div className="auth-page">
      <div className="auth-card fade-in">
        
        {/* Left panel - Informational */}
        <div className="auth-sidebar">
          <div className="fade-in-1">
            <div className="auth-brand">
              <div className="brand-icon">H</div>
              <span className="brand-text">HireVaani</span>
            </div>
            <h2 className="sidebar-title">Join HireVaani</h2>
            <p className="sidebar-desc">
              Create an account to get started. Choose whether you want to take AI-powered interviews or organize them for your company.
            </p>
          </div>
        </div>

        {/* Right panel — signup form */}
        <div className="auth-form-container">
          <div className="auth-form-box">
            <div className="fade-in-2" style={{ marginBottom: 32 }}>
              <h2 style={{ marginBottom: 8, fontSize: '1.5rem', color: 'var(--brand-primary)' }}>Create an Account</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Fill in your details to register.</p>
            </div>

            <div className="fade-in-3">
              <form onSubmit={handleSignup}>
                <div style={{ marginBottom: 20 }}>
                  <label className="label">Full Name</label>
                  <input
                    className="input" placeholder="e.g. Priya Sharma"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required autoFocus
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label className="label">Email</label>
                  <input
                    className="input" type="email" placeholder="name@example.com"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label className="label">Password</label>
                  <input
                    className="input" type="password" placeholder="Create a password"
                    value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                  />
                </div>

                <div style={{ marginBottom: 28 }}>
                  <label className="label">Account Type</label>
                  <div className="role-grid">
                    {[{ value: 'user', label: 'Candidate' }, { value: 'organizer', label: 'Organizer' }].map(r => (
                      <button
                        key={r.value} type="button"
                        onClick={() => setForm(f => ({ ...f, role: r.value }))}
                        className={`role-btn ${form.role === r.value ? 'active' : ''}`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

                <button className="btn btn-primary btn-lg" type="submit" style={{ width: '100%' }} disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Already have an account? </span>
                <Link to="/login" style={{ fontSize: '0.85rem', color: 'var(--brand-primary)', fontWeight: 600 }}>Sign In</Link>
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
          max-width: 960px;
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
          max-width: 360px;
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
        .role-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .role-btn {
          padding: 10px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-strong);
          background: #fff;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s;
        }
        .role-btn.active {
          border-color: var(--brand-primary);
          background: var(--brand-light);
          color: var(--brand-primary);
        }

        @media (max-width: 850px) {
          .auth-sidebar {
            display: none !important;
          }
          .auth-card {
            max-width: 480px;
          }
          .auth-form-container {
            padding: 40px 24px;
          }
        }
      `}</style>
    </div>
  );
}
