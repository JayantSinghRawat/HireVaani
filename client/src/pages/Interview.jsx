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
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
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
            baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite', delegate: 'GPU' },
            runningMode: 'VIDEO', minDetectionConfidence: 0.4,
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
                  if (!lookAwayRef.current) lookAwayRef.current = now;
                  const awayDuration = now - lookAwayRef.current;
                  
                  if (awayDuration > 500) {
                    setFaceStatus('Face not detected');
                  }
                  
                  if (awayDuration > LOOK_AWAY_THRESHOLD && now - lastPenaltyMs > 1500) {
                    lastPenaltyMs = now;
                    alertsRef.current++; 
                    setFaceAlerts(alertsRef.current);
                    const penalty = alertsRef.current <= 3 ? 5 : 10;
                    trustRef.current = Math.max(0, trustRef.current - penalty);
                    setTrustScore(trustRef.current);
                    showWarning('Look at the camera! Trust score reduced.');

                    if (trustRef.current <= 0 && phaseRef.current !== 'terminated') {
                      terminateInterview('Interview terminated: Trust score reached 0 due to repeated face detection failures. You must stay in frame during the interview.');
                    }
                  }
                } else if (count > 1) {
                  lookAwayRef.current = null;
                  setFaceStatus('Multiple faces detected');
                  if (now - lastPenaltyMs > 1500) { 
                    lastPenaltyMs = now;
                    alertsRef.current++; 
                    setFaceAlerts(alertsRef.current);
                    trustRef.current = Math.max(0, trustRef.current - 8);
                    setTrustScore(trustRef.current);
                    showWarning('Only you should be in the frame!');
                    
                    if (trustRef.current <= 0 && phaseRef.current !== 'terminated') {
                      terminateInterview('Interview terminated: Multiple faces detected repeatedly. Integrity violation.');
                    }
                  }
                } else {
                  lookAwayRef.current = null;
                  setFaceStatus('Face verified');
                }
              }
            }
            animId = requestAnimationFrame(loop);
          };
          loop();
          setFaceStatus('Face verified');
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
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
    setPhase('processing');
    setTimeout(() => processAudio(), 600);
  }, [processAudio]);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    
    // Extract only audio tracks so MediaRecorder doesn't crash from mixed video/audio streams
    const audioTracks = streamRef.current.getAudioTracks();
    if (audioTracks.length === 0) {
      setError('Recording failed: No microphone detected.');
      return;
    }
    const audioStream = new MediaStream(audioTracks);
    
    let options = {};
    if (MediaRecorder.isTypeSupported('audio/webm')) {
      options = { mimeType: 'audio/webm' };
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      options = { mimeType: 'audio/mp4' };
    }
    
    try {
      const recorder = new MediaRecorder(audioStream, options);
      recorderRef.current = recorder;
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(500);
      setPhase('recording'); setTimeLeft(ANSWER_TIME);
      let t = ANSWER_TIME;
      timerRef.current = setInterval(() => { t--; setTimeLeft(t); if (t <= 0) stopRecording(); }, 1000);
    } catch (e) {
      setError('Recording failed: ' + e.message);
    }
  }, [stopRecording]);

  const startCountdown = useCallback(() => {
    setPhase('countdown'); setCountdown(3);
    let c = 3;
    const id = setInterval(() => {
      c--; setCountdown(c);
      if (c <= 0) { 
        clearInterval(id); 
        startRecording(); 
      }
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

  // ── Terminated screen ──
  if (terminated) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
      <div style={{ maxWidth: 420, textAlign: 'center' }}>
        <h2 style={{ color: '#EF4444', marginBottom: 12 }}>Interview Terminated</h2>
        <p style={{ color: '#6B7280', lineHeight: 1.6, marginBottom: 24 }}>{error}</p>
        <button className="btn btn-outline" onClick={() => navigate('/')}>Back to Home</button>
      </div>
    </div>
  );

  // ── Loading / Error states ──
  if (phase === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, paddingTop: 60 }}>
      <div className="spinner" />
      <p>Loading questions...</p>
    </div>
  );
  if (error && phase !== 'review' && phase !== 'terminated') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24, paddingTop: 60 }}>
      <div className="alert alert-error" style={{ maxWidth: 480 }}>{error}</div>
      <button className="btn btn-outline" onClick={() => navigate('/')}>Back to Home</button>
    </div>
  );

  const trustColor = trustScore >= 70 ? 'var(--emerald)' : trustScore >= 40 ? 'var(--amber)' : 'var(--rose)';

  return (
    <div style={{ minHeight: '100vh', paddingTop: 60, background: 'var(--bg-secondary)' }}>
      {warningMsg && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, background: '#EF4444', color: '#fff', textAlign: 'center', padding: '12px 16px', fontWeight: 600, fontSize: '0.9rem' }}>
          {warningMsg}
        </div>
      )}

      <nav className="navbar">
        <span className="navbar-brand">HireVaani</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="badge badge-blue">{ROLE_LABELS[role]}</span>
          <span className="badge badge-gray">{LANG_LABELS[language]}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: 4 }}>{name}</span>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
        {/* Progress bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <span>Question {Math.min(qIndex + 1, TOTAL_QUESTIONS)} of {TOTAL_QUESTIONS}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
          {/* Main panel */}
          <div>
            {phase !== 'submitting' && (
              <div className="card" style={{ padding: '28px 28px', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <span className="badge badge-purple" style={{ marginBottom: 12, display: 'inline-block' }}>
                      Question {qIndex + 1}
                    </span>
                    <h3 style={{ lineHeight: 1.6, fontWeight: 600 }}>{questions[qIndex]}</h3>
                  </div>
                  {phase === 'recording' && (
                    <div style={{ textAlign: 'center', flexShrink: 0, padding: '8px 16px', borderRadius: 'var(--radius-md)', background: timeLeft <= 10 ? 'var(--rose-light)' : 'var(--blue-light)', border: `1px solid ${timeLeft <= 10 ? '#fecdd3' : 'var(--blue-mid)'}` }}>
                      <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', fontWeight: 800, color: timeLeft <= 10 ? 'var(--rose)' : 'var(--blue)' }}>{timeLeft}s</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>remaining</div>
                    </div>
                  )}
                </div>

                {phase === 'recording' && (
                  <div className="alert alert-error" style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="dot dot-red" style={{ animation: 'pulse 1s infinite' }} />
                    Recording — speak clearly in {LANG_LABELS[language]}
                  </div>
                )}

                {phase === 'countdown' && (
                  <div style={{ marginTop: 24, textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: '3.5rem', fontWeight: 800, color: 'var(--blue)' }}>{countdown}</div>
                    <p style={{ marginTop: 8 }}>Get ready to speak...</p>
                  </div>
                )}
              </div>
            )}

            {/* Transcript review */}
            {phase === 'review' && (
              <div className="card fade-in" style={{ padding: '24px 28px', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4>Your Answer</h4>
                  <span className="badge badge-emerald">Transcribed by Sarvam AI</span>
                </div>
                <textarea
                  className="textarea"
                  value={transcript}
                  onChange={e => setTranscript(e.target.value)}
                  rows={5}
                  placeholder="Transcript will appear here. You may edit it if needed."
                  style={{ marginBottom: 16 }}
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button id="save-answer-btn" className="btn btn-primary" onClick={saveAnswer}>
                    {qIndex + 1 >= TOTAL_QUESTIONS ? 'Submit Interview' : 'Next Question'}
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => { setTranscript(''); startCountdown(); }}>
                    Re-record Answer
                  </button>
                </div>
              </div>
            )}

            {/* Action buttons */}
            {phase === 'ready' && (
              <button id="start-recording-btn" className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={startCountdown}>
                Start Recording
              </button>
            )}
            {phase === 'recording' && (
              <button id="stop-recording-btn" className="btn btn-danger btn-lg" style={{ width: '100%' }} onClick={stopRecording}>
                Stop Recording
              </button>
            )}
            {phase === 'processing' && (
              <div style={{ textAlign: 'center', padding: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div className="spinner" /> <p>Transcribing with Sarvam AI...</p>
              </div>
            )}
            {phase === 'submitting' && (
              <div className="card" style={{ padding: '60px 40px', textAlign: 'center' }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, margin: '0 auto 20px' }} />
                <h3 style={{ marginBottom: 10 }}>Evaluating your interview</h3>
                <p>Gemini AI is analysing your answers. This takes 20–30 seconds.</p>
                <p style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--text-muted)' }}>Please do not close this tab.</p>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Camera */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <video
                ref={videoRef} autoPlay muted playsInline
                style={{ width: '100%', display: 'block', maxHeight: 220, objectFit: 'cover', transform: 'scaleX(-1)', background: '#000' }}
              />
              <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
                <span className={`dot dot-${faceStatus === 'Face verified' ? 'green' : 'amber'}`} />
                <span style={{ color: 'var(--text-secondary)' }}>{faceStatus}</span>
              </div>
            </div>

            {/* Trust score */}
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

            {/* Guidelines */}
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: 10, color: 'var(--text-primary)' }}>Interview Guidelines</div>
              {['Stay in frame throughout the interview', 'Speak clearly — only one person', '120 seconds maximum per answer', 'Answer in your selected language'].map(t => (
                <div key={t} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: '0.78rem', color: 'var(--text-secondary)', alignItems: 'flex-start' }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--blue)', marginTop: 7, flexShrink: 0 }} />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
