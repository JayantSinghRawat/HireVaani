# ⚡ HireVaani — AI-Powered Multilingual Interview Platform

> **AI for Bharat · Theme 5: AI SkillFit**  
> A premium, multilingual video assessment platform. Record interviews in **Kannada**, **Hindi**, or **English**. AI evaluates skills, monitors proctoring trust, and delivers instant, explainable fitment decisions.

---

## 🎯 Overview

HireVaani is a state-of-the-art AI video interview platform designed for the diverse Indian workforce. It bridges the gap between language barriers and technical assessment by allowing candidates to express themselves in their native tongue.

### ✨ Key Features

*   **🌑 Premium Monochrome UI**: A sleek, high-contrast Black & White design system for a professional, focused experience.
*   **🌍 Multilingual STT**: Seamless transcription using **Sarvam AI Saaras v2** for Hindi, Kannada, and English.
*   **🧠 Deep AI Evaluation**: Instant analysis using **Google Gemini 1.5 Flash**, providing detailed skill breakdowns and fitment rationales.
*   **🛡️ Proctored Environment**: Real-time face monitoring via **MediaPipe** to calculate a dynamic **Trust Score**.
*   **🗓️ Advanced Scheduling**: Organizers can set **Start Dates** and **Deadline Dates** to automate hiring drives.
*   **🎯 Custom Roles**: Create interviews for any position (e.g., "Senior Teacher", "DevOps Lead") with tailor-made descriptions.
*   **📱 Fully Responsive**: Optimized for both Desktop and Mobile — recruiters can manage candidates on the go.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Vanilla CSS (Premium Monochrome) |
| **Charts** | Chart.js (Radar & Doughnut Analytics) |
| **Proctoring** | MediaPipe FaceDetector (WASM-based browser tracking) |
| **Speech-to-Text** | **Sarvam AI** (Regional Language Transcription) |
| **LLM Engine** | **Google Gemini 1.5 Flash** (Evaluation & Reasoning) |
| **Backend** | Node.js 20, Express 5 |
| **Database** | MongoDB Atlas (Persistent Mode) / In-Memory (Dev Mode) |

---

## 📁 Project Structure

```
HireVaani/
├── client/                     # React Frontend
│   └── src/
│       ├── App.jsx             # Router & Role-based access
│       ├── index.css           # Global Design System (B&W Theme)
│       └── pages/
│           ├── UserDashboard.jsx # Candidate portal (History + Upcoming)
│           ├── Admin.jsx       # Organizer portal (Interview-First Navigation)
│           ├── Interview.jsx   # Live Recording & Proctored UI
│           └── Result.jsx      # Performance & Fitment Analytics
└── server/                     # Node.js Backend
    ├── index.js                # Express entry point
    └── src/
        ├── services/           # Sarvam & Gemini Integrations
        ├── models/             # Mongoose Schemas (Interview & Candidate)
        └── routes/             # RESTful API Endpoints
```

---

## ⚙️ Local Setup

### 1 — Install Dependencies

```bash
# Install server & client dependencies
cd server && npm install
cd ../client && npm install
```

### 2 — Environment Configuration

Create a `.env` file in the `server` directory:

```env
SARVAM_API_KEY=your_sarvam_key
GEMINI_API_KEY=your_gemini_key
MONGODB_URI=your_mongo_uri (optional)
JWT_SECRET=your_jwt_secret
ADMIN_USER=admin
ADMIN_PASS=admin123
```

### 3 — Run Development Servers

**Backend:** `cd server && npm run dev` (Port 8000)  
**Frontend:** `cd client && npm run dev` (Port 5173)

---

## 📊 Evaluation & Proctoring

### AI Skill Radar
Gemini evaluates every response across 5 critical dimensions:
*   **Technical Proficiency**: Depth of domain knowledge.
*   **Clarity & Structure**: Coherence and logical flow.
*   **Communication**: Fluency and expressiveness.
*   **Confidence**: Assertiveness in delivery.
*   **Relevance**: Accuracy in addressing the role-specific problem.

### Trust Score (Proctoring)
The system tracks the candidate's presence in real-time:
*   **Perfect Score (100%)**: Face detected throughout the session.
*   **Deductions**: Automatically penalizes the score if the candidate looks away, leaves the frame, or if multiple faces are detected.

---

## 👥 Team — The Visionaries

*   **Harshitha GG**
*   **Ishita Gautam**
*   **Jayant Singh Rawat**

**Hackathon:** AI for Bharat · Theme 5: AI SkillFit

---

## 📄 License

MIT — Built with ❤️ for the AI for Bharat Hackathon.
