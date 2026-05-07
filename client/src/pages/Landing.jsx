import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Navbar */}
      <nav className="navbar" style={{ position: 'fixed', top: 0, width: '100%', zIndex: 1000, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>H</div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>HireVaani</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/login" className="btn btn-ghost btn-sm">Log In</Link>
            <Link to="/signup" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ paddingTop: 140, paddingBottom: 100, textAlign: 'center' }}>
        <div className="container">
          <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
            <span className="badge badge-blue" style={{ marginBottom: 20 }}>AI-Powered Interview Platform</span>
            <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: 850, lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: 24 }}>
              Hire Smarter with <span style={{ color: 'var(--brand-primary)' }}>AI Interviews</span>
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>
              The ultimate multilingual video assessment platform. Automated proctoring, real-time transcription, and deep performance insights.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/signup" className="btn btn-primary btn-lg" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>Start Free Trial</Link>
              <Link to="/login" className="btn btn-outline btn-lg" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>View Demo</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '80px 0', background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 16 }}>Everything you need to hire</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Advanced tools for modern recruitment teams.</p>
          </div>
          <div className="features-grid">
            {[
              { title: 'Multilingual Support', desc: 'Conduct interviews in English, Hindi, and Kannada seamlessly.', icon: '🌐' },
              { title: 'AI Proctoring', desc: 'Track gaze, multiple faces, and tab switching to ensure integrity.', icon: '🛡️' },
              { title: 'Smart Evaluation', desc: 'Gemini AI analyzes answers for relevance, clarity, and confidence.', icon: '🧠' },
              { title: 'Instant Transcripts', desc: 'Sarvam AI provides high-accuracy transcripts for every answer.', icon: '✍️' }
            ].map(f => (
              <div key={f.title} className="card" style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 20 }}>{f.icon}</div>
                <h3 style={{ marginBottom: 12, fontWeight: 700 }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '60px 0', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <div className="container">
          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.8rem' }}>H</div>
            <span style={{ fontWeight: 800 }}>HireVaani</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>© 2026 HireVaani AI. All rights reserved.</p>
        </div>
      </footer>

      <style>{`
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
        }
      `}</style>
    </div>
  );
}
