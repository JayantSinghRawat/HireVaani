# HireVaani – SkillFit AI: PROJECT STATE FILE
<!-- This file is the single source of truth for AI model handoffs.
     Update this file at the end of every coding session or phase. -->

---

## 🔖 Project Identity
- **Project Name:** HireVaani / SkillFit AI
- **Hackathon:** AI for Bharat · Theme 5: AI SkillFit
- **Team:** Harshitha GG, Ishita Gautam, Jayant Singh Rawat
- **Workspace Root:** `/Users/jayant/Desktop/HireVaani/`
- **Conversation ID (latest):** `d8aa10fe-ede3-49ff-a336-c87a512bee90`

---

## 📋 High-Level Goal
Build a **production-level** multilingual AI video interview & workforce fitment platform.

Candidates record voice/video answers in Kannada/Hindi/English.
AI transcribes (Sarvam AI), evaluates (Gemini), face-monitors (MediaPipe), and produces
a Skill Confidence Radar + Trust Score + Explainable Fitment Decision.
Recruiters use an Admin Dashboard to shortlist/review/reject candidates.

---

## 🏗️ Architecture Summary
```
client/  (React 18 + Vite + Tailwind CSS)
  ├── Landing   → Language + Role selection
  ├── Interview → Video room + MediaPipe face detect + recording
  ├── Result    → Skill radar + Trust ring + Fitment badge
  └── Admin     → Candidate table + filters + actions

server/  (Node.js 20 + Express 4 + MongoDB/Mongoose)
  ├── /api/session       POST – create interview session
  ├── /api/transcribe    POST – proxy audio → Sarvam AI STT
  ├── /api/evaluate      POST – call Gemini, compute trust, save
  ├── /api/questions     GET  – fetch questions for role+lang
  └── /api/candidates    GET/PATCH – admin candidate management
```

---

## 🔑 API Keys & Config (FILL IN BEFORE CODING)
```
SARVAM_API_KEY=          # https://www.sarvam.ai/ → Saaras V3 STT
GEMINI_API_KEY=          # https://aistudio.google.com/
MONGODB_URI=             # MongoDB Atlas M0 free cluster
JWT_SECRET=hirevaani_secret_2024
PORT=5000
```
Store in `server/.env` (never commit — add to .gitignore).
Use `server/.env.example` as template.

---

## 📦 Tech Stack (Locked Decisions)
| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + Vite + Tailwind | Fast dev, great DX |
| Routing | React Router v6 | Standard SPA |
| Charts | Chart.js + react-chartjs-2 | Radar + doughnut |
| Face Detection | MediaPipe FaceDetector (browser WASM) | Active, no backend needed |
| Recording | Web MediaRecorder API | Mobile-compatible |
| STT | Sarvam AI Saaras V3 | Kannada+Hindi+code-mix |
| LLM | Google Gemini 1.5 Flash | Free, multilingual, fast |
| Backend | Express 4 + Mongoose | Lightweight |
| DB | MongoDB Atlas M0 | Free, flexible |
| Auth | JWT (simple demo auth) | Hackathon scope |
| Deploy | Vercel (client) + Render (server) | Free, HTTPS |

---

## 📁 File Structure (Current State)
```
HireVaani/
├── PROJECT_STATE.md
├── client/
│   ├── index.html                   ← SEO + Google Fonts
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx                  ← Router + orbs + AdminRoute guard
│   │   ├── index.css                ← Full design system (dark navy/blue/emerald)
│   │   └── pages/
│   │       ├── Landing.jsx          ← Role+lang selector, session creation
│   │       ├── Interview.jsx        ← Video, MediaPipe, recording, Sarvam STT
│   │       ├── Result.jsx           ← Radar chart, trust donut, fitment badge
│   │       ├── AdminLogin.jsx       ← JWT login
│   │       └── Admin.jsx            ← Candidate table + detail panel
│   └── package.json
└── server/
    ├── index.js                     ← Express entry + MongoDB optional connect
    ├── .env                         ← API keys (fill in!)
    ├── .env.example
    └── src/
        ├── data/questions.js        ← 90 questions (6×3×5)
        ├── models/Candidate.js      ← Mongoose schema
        ├── middleware/auth.js       ← JWT middleware
        ├── services/
        │   ├── sarvam.js            ← Sarvam AI STT
        │   └── gemini.js            ← Gemini 1.5 Flash eval + fitment
        └── routes/
            ├── questions.js
            ├── session.js
            ├── transcribe.js
            ├── evaluate.js
            ├── candidates.js
            └── auth.js
```

---

## ✅ Phase Completion Tracker
| Phase | Description | Status | Notes |
|---|---|---|---|
| 0 | Planning & architecture | ✅ DONE | Plan approved by user |
| 1 | Scaffold (Vite + Express + deps) | ✅ DONE | Both servers running |
| 2 | Design system + Landing page | ✅ DONE | Dark navy glassmorphism |
| 3 | Interview room (video + face detect) | ✅ DONE | MediaPipe + 90s timer |
| 4 | Backend APIs (session, transcribe) | ✅ DONE | Sarvam AI integrated |
| 5 | Gemini evaluation pipeline | ✅ DONE | Per-answer + fitment |
| 6 | Result page (charts + fitment) | ✅ DONE | Radar + donut charts |
| 7 | Admin dashboard | ✅ DONE | Table + detail panel |
| 8 | API keys + MongoDB + deploy | ⬜ TODO | Need keys from user |

---

## 🔍 Key Design Decisions Made
1. **MediaPipe** (not face-api.js) for face detection — face-api.js is unmaintained
2. **Sarvam AI Saaras V3** for STT — purpose-built for Indian languages + code-mixing
3. **Gemini 1.5 Flash** for evaluation — free tier, multilingual, returns structured JSON
4. **Dark theme** (deep navy + electric blue + emerald) with glassmorphism cards
5. Question bank is **pre-loaded JSON** (90 questions: 6 roles × 3 langs × 5 Qs)
6. **Fitment logic:** Trust Score (face+audio+consistency) + Skill Scores → decision
7. Admin auth is JWT with hardcoded demo credentials for hackathon
8. No video file storage for MVP — only audio blobs + transcripts in MongoDB

---

## ❓ Open Questions (Awaiting User Input)
- [ ] **ACTION REQUIRED**: Add Sarvam API key to `server/.env` → `SARVAM_API_KEY=...`
- [ ] **ACTION REQUIRED**: Add Gemini API key to `server/.env` → `GEMINI_API_KEY=...`
- [ ] MongoDB: Add URI when ready → `MONGODB_URI=...` (works in-memory without it)
- [ ] Enable TTS (AI reads questions aloud)? → Phase 8 candidate
- [ ] Re-record policy: currently allowed (re-record button exists)
- [ ] Admin login: JWT with demo `admin/admin123` ✅ implemented

---

## 🚨 Known Issues / Blockers
- None yet (planning phase)

---

## 📝 Last Action Taken
- **By:** Claude Sonnet 4.6 (Thinking)
- **At:** 2026-05-04T17:55 IST
- **Action:** Built full app — Phases 1–7 complete. Both dev servers running.
  - Server: http://localhost:5000 (Express + all routes)
  - Client: http://localhost:5173 (React + all 5 pages)
- **Next Step:** User adds API keys to `server/.env`, then we test the full interview flow

---

## 📌 For the Next Model: HOW TO CONTINUE
1. Read this entire file first
2. Check the Phase Completion Tracker — find first ⬜ TODO phase
3. Look at "Last Action Taken" for exact next step
4. Reference the implementation plan artifact at:
   `/Users/jayant/.gemini/antigravity/brain/d8aa10fe-ede3-49ff-a336-c87a512bee90/implementation_plan.md`
5. After completing work, update this file:
   - Mark phases ✅ DONE
   - Update "File Structure (Current State)"
   - Update "Last Action Taken"
   - Note any new design decisions or issues
