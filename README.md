# ⚡ HireVaani — AI-Powered Multilingual Interview Platform

> **AI for Bharat · Theme 5: AI SkillFit**  
> Record your interview in Kannada, Hindi, or English. AI evaluates skills, monitors trust, and delivers instant fitment decisions.

---

## 🎯 What is HireVaani?

HireVaani is a full-stack AI video interview platform built for the Indian workforce. Candidates answer role-specific questions in their native language — the system transcribes using **Sarvam AI**, evaluates answers using **Gemini 1.5 Flash**, monitors face presence with **MediaPipe**, and produces a **Skill Confidence Radar + Trust Score + Explainable Fitment Decision**.

Recruiters manage all candidates from a secure **Admin Dashboard**.

---

## 🖼️ Pages

| Route | Description |
|---|---|
| `/` | Landing — choose role, language, start interview |
| `/interview` | Live interview room — camera + recording + STT |
| `/result` | Skill radar chart, trust score, AI fitment decision |
| `/admin/login` | Admin sign-in (JWT) |
| `/admin` | Candidate dashboard — review, filter, update decisions |

---

## 🏗️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + Vanilla CSS |
| Routing | React Router v6 |
| Charts | Chart.js + react-chartjs-2 (Radar + Doughnut) |
| Face Detection | MediaPipe FaceDetector (browser WASM) |
| Audio Recording | Web MediaRecorder API |
| Speech-to-Text | **Sarvam AI Saaras v2** (Kannada, Hindi, English) |
| AI Evaluation | **Google Gemini 1.5 Flash** |
| Backend | Node.js 20 + Express 5 |
| Database | MongoDB Atlas (optional — runs in-memory without it) |
| Auth | JWT (8h expiry) |

---

## 📁 Project Structure

```
HireVaani/
├── client/                     # React + Vite frontend
│   ├── index.html
│   └── src/
│       ├── App.jsx             # Router + background orbs
│       ├── index.css           # Design system (dark navy theme)
│       └── pages/
│           ├── Landing.jsx
│           ├── Interview.jsx
│           ├── Result.jsx
│           ├── AdminLogin.jsx
│           └── Admin.jsx
│
└── server/                     # Express API
    ├── index.js                # Entry point
    ├── .env                    # ← YOUR API KEYS GO HERE
    └── src/
        ├── data/questions.js   # 90 questions (6 roles × 3 langs × 5 Qs)
        ├── models/Candidate.js # Mongoose schema
        ├── middleware/auth.js  # JWT middleware
        ├── services/
        │   ├── sarvam.js       # Sarvam AI STT
        │   └── gemini.js       # Gemini eval + fitment
        └── routes/
            ├── questions.js
            ├── session.js
            ├── transcribe.js
            ├── evaluate.js
            ├── candidates.js
            └── auth.js
```

---

## ⚙️ Local Setup

### Prerequisites

- Node.js 18+ → https://nodejs.org
- npm 9+
- A modern browser (Chrome recommended for MediaPipe)

### 1 — Clone & Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2 — Configure API Keys

Copy the template and fill in your keys:

```bash
cd server
cp .env.example .env
```

Open `server/.env` and add:

```env
SARVAM_API_KEY=your_sarvam_key_here
GEMINI_API_KEY=your_gemini_key_here
MONGODB_URI=                          # leave blank to use in-memory mode
JWT_SECRET=hirevaani_secret_2024
PORT=5000
ADMIN_USER=admin
ADMIN_PASS=admin123
```

**Where to get keys:**
- 🟣 **Sarvam AI** → https://www.sarvam.ai/ → Sign up → Dashboard → API Keys
- 🔵 **Gemini** → https://aistudio.google.com/ → Get API Key

### 3 — Start Both Servers

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
# → Server running on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# → App running on http://localhost:5173
```

Open → **http://localhost:5173**

---

## 🍃 MongoDB Setup (Step-by-Step)

> The app works **without MongoDB** (in-memory mode). Data is lost on server restart.  
> Add MongoDB when you want **persistent candidate records**.

### Step 1 — Create a Free MongoDB Atlas Account

1. Go to → **https://cloud.mongodb.com**
2. Click **"Try Free"** → Sign up with Google or email
3. After login, click **"Create a deployment"**

### Step 2 — Create a Free Cluster (M0)

1. Select **"M0 Free"** tier
2. Choose a cloud provider (any — AWS recommended)
3. Select region: **Mumbai (ap-south-1)** for best India latency
4. Name your cluster: `HireVaani`
5. Click **"Create Deployment"**

### Step 3 — Create a Database User

1. In the setup wizard → **"Username and Password"** tab
2. Enter:
   - **Username:** `hirevaani_user`
   - **Password:** click "Autogenerate" and **copy the password**
3. Click **"Create Database User"**

### Step 4 — Whitelist Your IP Address

1. Click **"Add My Current IP Address"**
2. Click **"Finish and Close"**
3. Click **"Go to Overview"**

> ⚠️ If deploying to a server later, add `0.0.0.0/0` to allow all IPs.

### Step 5 — Get the Connection String

1. On the cluster overview, click **"Connect"**
2. Choose **"Drivers"**
3. Select **Driver: Node.js**, **Version: 5.5 or later**
4. Copy the connection string — it looks like:

```
mongodb+srv://hirevaani_user:<password>@hirevaani.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

5. **Replace `<password>`** with your actual password from Step 3

### Step 6 — Add the URI to .env

Open `server/.env` and paste:

```env
MONGODB_URI=mongodb+srv://hirevaani_user:YOUR_PASSWORD@hirevaani.xxxxx.mongodb.net/hirevaani?retryWrites=true&w=majority
```

> Notice we added `/hirevaani` before the `?` — this sets the database name.

### Step 7 — Restart the Server

```bash
# Stop the server (Ctrl+C) and restart:
npm run dev
```

You should see:
```
✅ MongoDB connected
🚀 HireVaani API running on http://localhost:5000
```

That's it! All candidate data is now persisted in MongoDB.

---

## 🔐 Admin Dashboard

| Field | Value |
|---|---|
| URL | http://localhost:5173/admin/login |
| Username | `admin` |
| Password | `admin123` |

Change these in `server/.env`:
```env
ADMIN_USER=your_username
ADMIN_PASS=your_secure_password
```

---

## 🌐 API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | — | Server health check |
| `GET` | `/api/questions?role=&language=` | — | Get questions |
| `GET` | `/api/questions/roles` | — | List all roles |
| `POST` | `/api/session` | — | Create interview session |
| `POST` | `/api/transcribe` | — | Transcribe audio (Sarvam AI) |
| `POST` | `/api/evaluate` | — | Evaluate answers (Gemini) |
| `POST` | `/api/auth/login` | — | Admin login → JWT |
| `GET` | `/api/auth/verify` | — | Verify JWT |
| `GET` | `/api/candidates` | 🔒 JWT | List all candidates |
| `GET` | `/api/candidates/:id` | 🔒 JWT | Get candidate detail |
| `PATCH` | `/api/candidates/:id` | 🔒 JWT | Update decision/notes |

---

## 🌍 Supported Roles & Languages

**Roles (6):** Software Engineer · Data Analyst · Marketing Executive · HR Executive · Sales Executive · Customer Support

**Languages (3):** English (`en`) · Hindi (`hi`) · Kannada (`kn`)

**Questions:** 90 total (6 × 3 × 5)

---

## 📊 Evaluation System

Each answer is scored by Gemini on 5 dimensions (0–10):

| Dimension | What it measures |
|---|---|
| **Relevance** | How well the answer addresses the question |
| **Clarity** | Structure, coherence, logical flow |
| **Confidence** | Assertiveness and certainty of expression |
| **Technical** | Domain knowledge depth |
| **Communication** | Language fluency and expressiveness |

**Trust Score** starts at 100 and decreases with face alerts:
- No face detected → −1 per second
- Multiple faces → −2 per second

**Fitment Decision** (Gemini-powered):
- 🎉 **Shortlisted** — Strong across all dimensions
- ⏳ **Under Review** — Mixed performance, needs human review
- ❌ **Not Fit** — Significantly below threshold

---

## 👥 Team

- Harshitha GG
- Ishita Gautam
- Jayant Singh Rawat

**Hackathon:** AI for Bharat · Theme 5: AI SkillFit

---

## 📄 License

MIT — Free to use for hackathon and educational purposes.
