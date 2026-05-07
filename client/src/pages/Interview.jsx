import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const TOTAL_QUESTIONS = 5;
const ANSWER_TIME = 120; // seconds per answer
const LOOK_AWAY_THRESHOLD = 2000; // ms before penalizing gaze away

const LANG_LABELS = { en: 'English', hi: 'Hindi', kn: 'Kannada' };
const ROLE_LABELS  = {
  software_engineer: 'Software Engineer', data_analyst: 'Data Analyst',
  marketing_executive: 'Marketing Executive', hr_executive: 'HR Executive',
  sales_executive: 'Sales Executive', customer_support: 'Customer Support',
};

export default function Interview() {
  const navigate  = useNavigate();
  const { state } = useLocation();

  useEffect(() => { if (!state?.sessionId) navigate('/'); }, [state, navigate]);

  const { sessionId, name, role, language, email } = state || {};

  const [questions, setQuestions]   = useState([]);
  const [qIndex, setQIndex]         = useState(0);
  const [phase, setPhase]           = useState('loading');
  const [countdown, setCountdown]   = useState(3);
  const [timeLeft, setTimeLeft]     = useState(ANSWER_TIME);
  const [transcript, setTranscript] = useState('');
  const [answers, setAnswers]       = useState([]);
  const [faceAlerts, setFaceAlerts] = useState(0);
  const [trustScore, setTrustScore] = useState(100);
  const [faceStatus, setFaceStatus] = useState('Initialising camera...');
  const [error, setError]           = useState('');
  const [terminated, setTerminated] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');

  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef   = useRef([]);
  const timerRef    = useRef(null);
  const alertsRef   = useRef(0);
  const trustRef    = useRef(100);
  const lookAwayRef = useRef(null);
  const phaseRef    = useRef('loading');

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { trustRef.current = trustScore; }, [trustScore]);

  const showWarning = (msg) => {
    setWarningMsg(msg);
    setTimeout(() => setWarningMsg(''), 3000);
  };

  const terminateInterview = useCallback((reason) => {
    clearInterval(timerRef.current);
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setTerminated(true);
    setPhase('terminated');
    setError(reason);
  }, []);

  // Load questions
  useEffect(() => {
    if (!role || !language) return;
    axios.get(`${API}/questions?role=${role}&language=${language}&sessionId=${sessionId}`)
      .then(r => { setQuestions(r.data.questions); setPhase('ready'); })
      .catch(() => setError('Failed to load questions. Check server.'));
  }, [role, language, sessionId]);

  // Camera + MediaPipe setup
  useEffect(() => {
    let animId = null;
    let detector = null;

    const setup = async () => {
      try {
        // Use the simplest possible constraints for maximum compatibility
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        streamRef.current = stream;
        if (videoRef.current) { 
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (e) {
            console.warn("Autoplay failed, waiting for user interaction");
          }
        }

        try {
          const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
          );
          detector = await FaceDetector.createFromOptions(vision, {
            baseOptions: { 
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite', 
              delegate: 'GPU' 
            },
            runningMode: 'VIDEO', 
            minDetectionConfidence: 0.4,
          });

          let lastMs = -1;
          let lastPenaltyMs = -1;
          
          const loop = () => {
            if (videoRef.current && videoRef.current.readyState === 4) {
              const now = performance.now();
              if (now - lastMs >= 150) { 
                lastMs = now;
                try {
                  const r = detector.detectForVideo(videoRef.current, now);
                  const count = r.detections.length;
                  
                  if (count === 0) {
                    if (!lookAwayRef.current) lookAwayRef.current = now;
                    const awayDuration = now - lookAwayRef.current;
                    if (awayDuration > 500) setFaceStatus('Face not detected');
                    
                    if (awayDuration > LOOK_AWAY_THRESHOLD && now - lastPenaltyMs > 1500) {
                      lastPenaltyMs = now;
                      alertsRef.current++; setFaceAlerts(alertsRef.current);
                      const penalty = alertsRef.current <= 3 ? 5 : 10;
                      trustRef.current = Math.max(0, trustRef.current - penalty);
                      setTrustScore(trustRef.current);
                      showWarning('Look at the camera! Trust score reduced.');
                      if (trustRef.current <= 0 && phaseRef.current !== 'terminated') {
                        terminateInterview('Interview terminated: Trust score reached 0.');
                      }
                    }
                  } else if (count > 1) {
                    lookAwayRef.current = null;
                    setFaceStatus('Multiple faces detected');
                    if (now - lastPenaltyMs > 1500) { 
                      lastPenaltyMs = now;
                      alertsRef.current++; setFaceAlerts(alertsRef.current);
                      trustRef.current = Math.max(0, trustRef.current - 8);
                      setTrustScore(trustRef.current);
                      showWarning('Only you should be in the frame!');
                      if (trustRef.current <= 0 && phaseRef.current !== 'terminated') {
                        terminateInterview('Interview terminated: Integrity violation.');
                      }
                    }
                  } else {
                    lookAwayRef.current = null;
                    setFaceStatus('Face verified');
                  }
                } catch (err) { console.error("Detection error:", err); }
              }
            }
            animId = requestAnimationFrame(loop);
          };
          loop();
          setFaceStatus('Face verified');
        } catch (err) {
          console.warn("MediaPipe failed:", err);
          setFaceStatus('Camera active');
        }
      } catch (err) {
        console.error("Camera access failed:", err);
        setError('Camera or microphone access was denied. Please allow permissions and reload.');
      }
    };

    setup();
    return () => {
      cancelAnimationFrame(animId);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      detector?.close?.();
    };
  }, [terminateInterview]);

  // Persistent stream attachment
  useEffect(() => {
    if (streamRef.current && videoRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  });

  const processAudio = useCallback(async () => {
    const mimeType = chunksRef.current[0]?.type || 'audio/webm';
    const blob = new Blob(chunksRef.current, { type: mimeType });
    let txText = '';
    if (blob.size > 500) {
      try {
        const fd = new FormData();
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        fd.append('audio', blob, `answer.${ext}`);
        fd.append('language', language);
        const { data } = await axios.post(`${API}/transcribe`, fd);
        txText = data.transcript || '';
      } catch { txText = '[Transcription failed]'; }
    } else { txText = '[No audio recorded]'; }
    setTranscript(txText);
    setPhase('review');
  }, [language]);

  const stopRecording = useCallback(() => {
    clearInterval(timerRef.current);
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
    setPhase('processing');
    setTimeout(() => processAudio(), 600);
  }, [processAudio]);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const audioTracks = streamRef.current.getAudioTracks();
    if (audioTracks.length === 0) { setError('No microphone detected.'); return; }
    const audioStream = new MediaStream(audioTracks);
    
    let options = {};
    if (MediaRecorder.isTypeSupported('audio/webm')) options = { mimeType: 'audio/webm' };
    else if (MediaRecorder.isTypeSupported('audio/mp4')) options = { mimeType: 'audio/mp4' };
    
    try {
      const recorder = new MediaRecorder(audioStream, options);
      recorderRef.current = recorder;
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(500);
      setPhase('recording'); setTimeLeft(ANSWER_TIME);
      let t = ANSWER_TIME;
      timerRef.current = setInterval(() => { t--; setTimeLeft(t); if (t <= 0) stopRecording(); }, 1000);
    } catch (e) { setError('Recording failed: ' + e.message); }
  }, [stopRecording]);

  const startCountdown = useCallback(() => {
    setPhase('countdown'); setCountdown(3);
    let c = 3;
    const id = setInterval(() => {
      c--; setCountdown(c);
      if (c <= 0) { clearInterval(id); startRecording(); }
    }, 1000);
  }, [startRecording]);

  const saveAnswer = useCallback(() => {
    const updated = [...answers, { questionIndex: qIndex, questionText: questions[qIndex], transcript, language }];
    setAnswers(updated); setTranscript('');
    if (qIndex + 1 >= TOTAL_QUESTIONS) finishInterview(updated);
    else { setQIndex(i => i + 1); setPhase('ready'); }
  }, [qIndex, questions, transcript, language, answers]); // eslint-disable-line

  const finishInterview = useCallback(async (finalAnswers) => {
    setPhase('submitting');
    try {
      const { data } = await axios.post(`${API}/evaluate`, {
        sessionId, name, role, language, email,
        answers: finalAnswers,
        faceAlerts: alertsRef.current, trustScore: trustRef.current,
      });
      navigate('/result', { state: { ...data, name, role, language } });
    } catch (e) { setError('Submission failed: ' + e.message); setPhase('review'); }
  }, [sessionId, name, role, language, email, navigate]);

  const progress = (qIndex / TOTAL_QUESTIONS) * 100;

  if (terminated) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 420, textAlign: 'center' }}>
        <h2 style={{ color: '#EF4444', marginBottom: 12 }}>Interview Terminated</h2>
        <p style={{ color: '#6B7280', marginBottom: 24 }}>{error}</p>
        <button className="btn btn-outline" onClick={() => navigate('/')}>Back to Home</button>
      </div>
    </div>
  );

  if (phase === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, paddingTop: 60 }}>
      <div className="spinner" /> <p>Loading questions...</p>
    </div>
  );

  if (error && phase !== 'review' && phase !== 'terminated') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24, paddingTop: 60 }}>
      <div className="alert alert-error">{error}</div>
      <button className="btn btn-outline" onClick={() => navigate('/')}>Back to Home</button>
    </div>
  );

  const trustColor = trustScore >= 70 ? 'var(--emerald)' : trustScore >= 40 ? 'var(--amber)' : 'var(--rose)';

  return (
    <div style={{ minHeight: '100vh', paddingTop: 60, background: 'var(--bg-secondary)' }}>
      {warningMsg && <div className="warning-banner">{warningMsg}</div>}

      <nav className="navbar">
        <span className="navbar-brand">HireVaani</span>
        <div className="interview-nav-badges">
          <span className="badge badge-blue">{ROLE_LABELS[role]}</span>
          <span className="badge badge-gray">{LANG_LABELS[language]}</span>
          <span className="nav-user-name">{name}</span>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <span>Question {Math.min(qIndex + 1, TOTAL_QUESTIONS)} of {TOTAL_QUESTIONS}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
        </div>

        <div className="interview-layout">
          {/* CAMERA BLOCK */}
          <div className="layout-camera">
            <div className="card" style={{ overflow: 'hidden', background: '#f3f4f6' }}>
              <video
                ref={videoRef} autoPlay muted playsInline
                style={{ width: '100%', display: 'block', minHeight: 180, maxHeight: 240, objectFit: 'contain', transform: 'scaleX(-1)' }}
              />
              <div className="camera-status">
                <span className={`dot dot-${faceStatus === 'Face verified' ? 'green' : 'amber'}`} />
                <span>{faceStatus}</span>
              </div>
            </div>
          </div>

          {/* TRUST BLOCK */}
          <div className="layout-trust">
            <div className="card" style={{ padding: '18px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Trust Score</span>
                <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '1.2rem', color: trustColor }}>{trustScore}%</span>
              </div>
              <div className="progress-bar" style={{ height: 6 }}>
                <div style={{ height: '100%', borderRadius: 'var(--radius-full)', background: trustColor, width: `${trustScore}%`, transition: 'width 0.4s' }} />
              </div>
              <p style={{ marginTop: 8, fontSize: '0.75rem' }}>Face alerts: {faceAlerts}</p>
            </div>
          </div>

          {/* QUESTION BLOCK */}
          <div className="layout-main">
            {phase !== 'submitting' ? (
              <>
                <div className="card" style={{ padding: '28px 28px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <span className="badge badge-blue" style={{ marginBottom: 12 }}>Question {qIndex + 1}</span>
                      <h3 style={{ lineHeight: 1.6, fontWeight: 600 }}>{questions[qIndex]}</h3>
                    </div>
                    {phase === 'recording' && (
                      <div className="timer-box">
                        <div className="timer-val">{timeLeft}s</div>
                        <div className="timer-label">remaining</div>
                      </div>
                    )}
                  </div>
                  {phase === 'recording' && (
                    <div className="alert alert-error" style={{ marginTop: 16 }}>
                      <span className="dot dot-red" style={{ animation: 'pulse 1s infinite' }} />
                      Recording... Speak in {LANG_LABELS[language]}
                    </div>
                  )}
                  {phase === 'countdown' && (
                    <div className="countdown-overlay">
                      <div className="countdown-val">{countdown}</div>
                      <p>Get ready...</p>
                    </div>
                  )}
                </div>

                {phase === 'review' && (
                  <div className="card fade-in" style={{ padding: '24px 28px', marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4>Your Answer</h4>
                      <span className="badge badge-emerald">Transcribed</span>
                    </div>
                    <textarea className="textarea" value={transcript} onChange={e => setTranscript(e.target.value)} rows={5} />
                    <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                      <button className="btn btn-primary" onClick={saveAnswer}>{qIndex + 1 >= TOTAL_QUESTIONS ? 'Submit Interview' : 'Next Question'}</button>
                      <button className="btn btn-outline btn-sm" onClick={() => { setTranscript(''); startCountdown(); }}>Re-record</button>
                    </div>
                  </div>
                )}

                <div className="action-area">
                  {phase === 'ready' && <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={startCountdown}>Start Recording</button>}
                  {phase === 'recording' && <button className="btn btn-danger btn-lg" style={{ width: '100%' }} onClick={stopRecording}>Stop Recording</button>}
                  {phase === 'processing' && <div className="spinner-msg"><div className="spinner" /> Transcribing...</div>}
                </div>
              </>
            ) : (
              <div className="card submitting-card">
                <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 20px' }} />
                <h3>Evaluating your interview...</h3>
                <p>Gemini AI is analyzing your performance (20-30s).</p>
              </div>
            )}
          </div>

          {/* GUIDELINES BLOCK */}
          <div className="layout-guidelines">
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: 10 }}>Guidelines</div>
              {['Stay in frame', 'Speak clearly', '120s max', 'Selected language only'].map(t => (
                <div key={t} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--blue)', marginTop: 7 }} /> {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .warning-banner { position: fixed; top: 0; left: 0; right: 0; z-index: 9999; background: #EF4444; color: #fff; text-align: center; padding: 12px; font-weight: 600; }
        .nav-user-name { color: var(--text-muted); font-size: 0.85rem; margin-left: 4; }
        .camera-status { padding: 10px 14px; display: flex; alignItems: center; gap: 8; fontSize: 0.8rem; background: #fff; borderTop: 1px solid var(--border); }
        .timer-box { text-align: center; padding: 8px 16px; border-radius: 8px; background: #EEF2FF; border: 1px solid #E0E7FF; }
        .timer-val { font-size: 1.5rem; font-weight: 800; color: var(--brand-primary); }
        .timer-label { font-size: 0.72rem; color: var(--text-muted); }
        .countdown-overlay { margin-top: 24; text-align: center; }
        .countdown-val { font-size: 3.5rem; font-weight: 800; color: var(--brand-primary); }
        .spinner-msg { text-align: center; padding: 24px; display: flex; align-items: center; justify-content: center; gap: 12; }
        .submitting-card { padding: 60px 40px; text-align: center; }
        
        /* GRID LAYOUT */
        .interview-layout {
          display: grid;
          grid-template-columns: 1fr 320px;
          grid-template-areas: 
            "main camera"
            "main trust"
            "main guidelines";
          gap: 20px;
        }
        .layout-main { grid-area: main; }
        .layout-camera { grid-area: camera; }
        .layout-trust { grid-area: trust; }
        .layout-guidelines { grid-area: guidelines; }

        @media (max-width: 768px) {
          .interview-nav-badges { display: none !important; }
          .interview-layout {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          /* Custom Order on Mobile */
          .layout-camera { order: 1; }
          .layout-trust { order: 2; }
          .layout-main { order: 3; }
          .layout-guidelines { order: 4; }
          
          .timer-box { padding: 4px 10px; }
          .timer-val { font-size: 1.1rem; }
        }
      `}</style>
    </div>
  );
}
