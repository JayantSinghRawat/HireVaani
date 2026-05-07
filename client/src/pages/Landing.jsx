import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: '#111827', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Navbar */}
      <nav className="navbar" style={{ position: 'fixed', top: 0, width: '100%', zIndex: 1000, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #f3f4f6' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>H</div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>HireVaani</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ paddingTop: 160, paddingBottom: 100, textAlign: 'center' }}>
        <div className="container">
          <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
            <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: 850, lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: 24, color: '#111827' }}>
              Hire Smarter with AI Interviews
            </h1>
            <p style={{ fontSize: '1.2rem', color: '#4b5563', lineHeight: 1.6, marginBottom: 48, maxWidth: 600, margin: '0 auto 48px' }}>
              The ultimate multilingual video assessment platform. Automated proctoring, real-time transcription, and deep performance insights.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/login" className="btn btn-primary btn-lg" style={{ padding: '16px 40px', fontSize: '1.05rem', background: '#111827', border: 'none' }}>Login</Link>
              <Link to="/signup" className="btn btn-outline btn-lg" style={{ padding: '16px 40px', fontSize: '1.05rem', border: '1px solid #e5e7eb' }}>Sign Up</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '100px 0', background: '#f9fafb' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: 16, letterSpacing: '-0.02em' }}>Everything you need to hire</h2>
            <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Advanced tools for modern recruitment teams.</p>
          </div>
          <div className="features-grid">
            {[
              { title: 'Multilingual Support', desc: 'Conduct interviews in English, Hindi, and Kannada seamlessly.' },
              { title: 'AI Proctoring', desc: 'Track gaze, multiple faces, and tab switching to ensure integrity.' },
              { title: 'Smart Evaluation', desc: 'Gemini AI analyzes answers for relevance, clarity, and confidence.' },
              { title: 'Instant Transcripts', desc: 'Sarvam AI provides high-accuracy transcripts for every answer.' }
            ].map(f => (
              <div key={f.title} className="card" style={{ padding: '40px 32px', textAlign: 'center', background: '#fff', border: '1px solid #f3f4f6' }}>
                <h3 style={{ marginBottom: 16, fontWeight: 700, fontSize: '1.25rem' }}>{f.title}</h3>
                <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '80px 0', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.9rem' }}>H</div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>HireVaani</span>
          </div>
        </div>
      </footer>

      <style>{`
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 32px;
        }
        @media (max-width: 640px) {
          .features-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
