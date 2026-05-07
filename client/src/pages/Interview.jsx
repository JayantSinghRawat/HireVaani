import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const TOTAL_QUESTIONS = 5;
const ANSWER_TIME = 120; // seconds per answer
const LOOK_AWAY_THRESHOLD = 2000; // ms before penalizing gaze away

const LANG_LABELS = { en: 'English', hi: 'Hindi', kn: 'Kannada' };
const ROLE_LABELS = {
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
  const lookAwayRef = useRef(null); // timestamp when face disappeared
  const phaseRef    = useRef('loading');

  // Keep phaseRef in sync
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  // Keep trustRef in sync
  useEffect(() => { trustRef.current = trustScore; }, [trustScore]);

  const showWarning = (msg) => {
    setWarningMsg(msg);
    setTimeout(() => setWarningMsg(''), 3000);
  };

  const terminateInterview = useCallback((reason) => {
    clearInterval(timerRef.current);
    recorderRef.current?.stop?.();
    streamRef.current?.getTracks().forEach(t => t.stop());
    setTerminated(true);
    setPhase('terminated');
    setError(reason);
  }, []);

  // Load questions
  useEffect(() => {
    if (!role || !language) return;
    axios.get(`${API}/questions?role=${role}&language=${language}&sessionId=${sessionId}`)
      .then(r => { setQuestions(r.data.questions); setPhase('ready'); })
      .catch(() => setError('Failed to load questions. Check server connection.'));
  }, [role, language, sessionId]);

  // Camera + face detection
  useEffect(() => {
    let animId = null;
    let detector = null;

    const setup = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: true
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
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
            if (videoRef.current?.readyState === 4) {
              const now = performance.now();
              if (now - lastMs >= 150) {
                lastMs = now;
                const r = detector.detectForVideo(videoRef.current, now);
                const count = r.detections.length;

                if (count === 0) {
                  // Face not in frame
                  if (!lookAwayRef.current) lookAwayRef.current = now;
                  const awayDuration = now - lookAwayRef.current;

                  if (awayDuration > 500) setFaceStatus('⚠ Face not detected');

                  if (awayDuration > LOOK_AWAY_THRESHOLD && now - lastPenaltyMs > 1500) {
                    lastPenaltyMs = now;
                    alertsRef.current++;
                    setFaceAlerts(alertsRef.current);
                    const penalty = alertsRef.current <= 3 ? 5 : 10;
                    trustRef.current = Math.max(0, trustRef.current - penalty);
                    setTrustScore(trustRef.current);
                    showWarning('⚠ Look at the camera! Trust score reduced.');

                    // Terminate if trust hits 0
                    if (trustRef.current <= 0 && phaseRef.current !== 'terminated') {
                      terminateInterview('Interview terminated: Trust score reached 0 due to repeated face detection failures. You must stay in frame during the interview.');
                    }
                  }
                } else if (count > 1) {
                  lookAwayRef.current = null;
                  setFaceStatus('⚠ Multiple faces detected');
                  if (now - lastPenaltyMs > 1500) {
                    lastPenaltyMs = now;
                    alertsRef.current++;
                    setFaceAlerts(alertsRef.current);
                    trustRef.current = Math.max(0, trustRef.current - 8);
                    setTrustScore(trustRef.current);
                    showWarning('⚠ Only you should be in the frame!');
                    if (trustRef.current <= 0 && phaseRef.current !== 'terminated') {
                      terminateInterview('Interview terminated: Multiple faces detected repeatedly. Integrity violation.');
                    }
                  }
                } else {
                  lookAwayRef.current = null;
                  setFaceStatus('✓ Face verified');
                }
              }
            }
            animId = requestAnimationFrame(loop);
          };
          loop();
          setFaceStatus('✓ Face verified');
        } catch {
          setFaceStatus('Camera active');
        }
      } catch {
        setError('Camera or microphone access was denied. Please allow permissions and reload.');
      }
    };

    setup();
    return () => {
      cancelAnimationFrame(animId);
      streamRef.current?.getTracks().forEach(t => t.stop());
      detector?.close?.();
    };
  }, [terminateInterview]);

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
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
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
    if (qIndex + 1 >= TOTAL_QUESTIONS) {
      finishInterview(updated);
    } else {
      setQIndex(i => i + 1); setPhase('ready');
    }
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
    } catch (e) {
      setError('Submission failed: ' + e.message); setPhase('review');
    }
  }, [sessionId, name, role, language, email, navigate]);

  const progress = (qIndex / TOTAL_QUESTIONS) * 100;
  const trustColor = trustScore >= 70 ? '#10B981' : trustScore >= 40 ? '#F59E0B' : '#EF4444';

  // ── Terminated screen ──
  if (terminated) return (
    <div style={styles.fullCenter}>
      <div style={{ maxWidth: 420, textAlign: 'center', padding: '32px 24px' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🚫</div>
        <h2 style={{ color: '#EF4444', marginBottom: 12 }}>Interview Terminated</h2>
        <p style={{ color: '#6B7280', lineHeight: 1.6, marginBottom: 24 }}>{error}</p>
        <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    </div>
  );

  if (phase === 'loading') return (
    <div style={styles.fullCenter}>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      <p style={{ marginTop: 16, color: '#6B7280' }}>AI is generating your interview questions...</p>
    </div>
  );

  if (error && phase !== 'review') return (
    <div style={styles.fullCenter}>
      <div className="alert alert-error" style={{ maxWidth: 480, margin: '0 24px' }}>{error}</div>
      <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => navigate('/')}>Back to Home</button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', color: '#F1F5F9', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Warning banner */}
      {warningMsg && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, background: '#EF4444', color: '#fff', textAlign: 'center', padding: '12px 16px', fontWeight: 600, fontSize: '0.9rem', animation: 'slideDown 0.3s ease' }}>
          {warningMsg}
        </div>
      )}

      {/* Top bar */}
      <header style={{ background: '#1E293B', borderBottom: '1px solid #334155', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em', color: '#F1F5F9' }}>HireVaani</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', background: '#334155', color: '#94A3B8' }}>
            {ROLE_LABELS[role]}
          </span>
          <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', background: '#334155', color: '#94A3B8' }}>
            {LANG_LABELS[language]}
          </span>
        </div>
      </header>

      {/* Progress */}
      <div style={{ background: '#1E293B', padding: '10px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748B', marginBottom: 6 }}>
          <span>Q{Math.min(qIndex + 1, TOTAL_QUESTIONS)} / {TOTAL_QUESTIONS}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div style={{ height: 3, background: '#334155', borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #6366F1, #8B5CF6)', borderRadius: 2, transition: 'width 0.5s ease' }} />
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>

        {/* Camera strip at top (mobile-optimized) */}
        <div style={{ background: '#1E293B', padding: '12px 20px 12px', display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid #334155' }}>
          <div style={{ position: 'relative', width: 80, height: 60, borderRadius: 8, overflow: 'hidden', border: `2px solid ${faceStatus.includes('✓') ? '#10B981' : '#EF4444'}`, flexShrink: 0 }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
            {faceStatus.includes('✓') && (
              <div style={{ position: 'absolute', bottom: 3, right: 3, width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', color: faceStatus.includes('✓') ? '#10B981' : '#EF4444', marginBottom: 4, fontWeight: 600 }}>
              {faceStatus}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.7rem', color: '#64748B' }}>Trust</span>
              <div style={{ flex: 1, height: 4, background: '#334155', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${trustScore}%`, background: trustColor, borderRadius: 2, transition: 'width 0.4s, background 0.3s' }} />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: trustColor, minWidth: 30 }}>{trustScore}%</span>
            </div>
          </div>
          {phase === 'recording' && (
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: timeLeft <= 15 ? '#EF4444' : '#F1F5F9', fontFamily: 'monospace', lineHeight: 1 }}>
                {String(Math.floor(timeLeft / 60)).padStart(2,'0')}:{String(timeLeft % 60).padStart(2,'0')}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748B' }}>left</div>
            </div>
          )}
        </div>

        {/* Question area */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 20px 0' }}>
          {phase !== 'submitting' && questions[qIndex] && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#312E81', padding: '4px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600, color: '#A5B4FC', marginBottom: 12 }}>
                <span>📝</span> Question {qIndex + 1}
              </div>
              <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, padding: '18px 18px' }}>
                <p style={{ fontSize: '1rem', lineHeight: 1.7, color: '#F1F5F9', margin: 0, fontWeight: 500 }}>
                  {questions[qIndex]}
                </p>
              </div>
              {phase === 'recording' && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                  <span style={{ fontSize: '0.82rem', color: '#FCA5A5', fontWeight: 500 }}>Recording — Speak in {LANG_LABELS[language]}</span>
                </div>
              )}
              {phase === 'countdown' && (
                <div style={{ marginTop: 16, textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: '5rem', fontWeight: 900, color: '#6366F1', lineHeight: 1 }}>{countdown}</div>
                  <p style={{ color: '#64748B', marginTop: 8, fontSize: '0.9rem' }}>Get ready to answer...</p>
                </div>
              )}
            </div>
          )}

          {/* Transcript review */}
          {phase === 'review' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h4 style={{ color: '#F1F5F9', fontSize: '0.9rem', margin: 0 }}>Your Answer</h4>
                <span style={{ fontSize: '0.7rem', padding: '3px 8px', background: '#065F46', color: '#34D399', borderRadius: 4 }}>Transcribed</span>
              </div>
              <textarea
                style={{ width: '100%', background: '#1E293B', border: '1px solid #334155', borderRadius: 8, color: '#F1F5F9', padding: '14px', fontSize: '0.9rem', lineHeight: 1.6, resize: 'vertical', outline: 'none', fontFamily: 'inherit', minHeight: 120, boxSizing: 'border-box' }}
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                placeholder="Your transcribed answer will appear here. You can edit it if needed."
              />
              {error && <div style={{ marginTop: 8, padding: '10px 12px', background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', borderRadius: 6, fontSize: '0.82rem' }}>{error}</div>}
            </div>
          )}

          {phase === 'processing' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3, borderColor: 'rgba(99,102,241,0.2)', borderTopColor: '#6366F1', margin: '0 auto 16px' }} />
              <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Transcribing your answer...</p>
            </div>
          )}

          {phase === 'submitting' && (
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4, borderColor: 'rgba(99,102,241,0.2)', borderTopColor: '#6366F1', margin: '0 auto 20px' }} />
              <h3 style={{ color: '#F1F5F9', marginBottom: 10 }}>Evaluating your interview</h3>
              <p style={{ color: '#64748B', fontSize: '0.88rem', lineHeight: 1.6 }}>Gemini AI is analysing all your answers.<br />This takes 20–40 seconds. Do not close the app.</p>
            </div>
          )}
        </div>

        {/* Bottom action bar */}
        <div style={{ padding: '16px 20px 32px', background: '#0F172A', borderTop: '1px solid #1E293B', flexShrink: 0 }}>
          {phase === 'ready' && (
            <button onClick={startCountdown} style={styles.primaryBtn}>
              🎙 Start Recording
            </button>
          )}
          {phase === 'recording' && (
            <button onClick={stopRecording} style={{ ...styles.primaryBtn, background: '#DC2626' }}>
              ⏹ Stop & Submit Answer
            </button>
          )}
          {phase === 'review' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={saveAnswer} style={styles.primaryBtn}>
                {qIndex + 1 >= TOTAL_QUESTIONS ? '✅ Submit Interview' : '→ Next Question'}
              </button>
              <button onClick={() => { setTranscript(''); startCountdown(); }} style={styles.ghostBtn}>
                🔄 Re-record Answer
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes slideDown { from{transform:translateY(-100%)} to{transform:translateY(0)} }
      `}</style>
    </div>
  );
}

const styles = {
  fullCenter: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', background: '#0F172A', padding: 24
  },
  primaryBtn: {
    width: '100%', padding: '16px', borderRadius: 12,
    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff',
    border: 'none', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
    fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.01em'
  },
  ghostBtn: {
    width: '100%', padding: '13px', borderRadius: 12,
    background: 'transparent', color: '#94A3B8',
    border: '1px solid #334155', fontSize: '0.9rem', fontWeight: 500,
    cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif'
  },
};
