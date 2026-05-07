# ⚡ HireVaani — AI-Led Multilingual Assessment Platform

> **AI for Bharat · Theme 5: AI SkillFit**  
> A scalable, AI-driven candidate screening prototype designed for the Indian workforce. Supporting **Kannada-first** multilingual interactions, reliable skill classification, and fraud detection.

---

## 🎯 Solution Overview

HireVaani addresses the challenge of large-scale candidate screening for the blue-collar and semi-skilled workforce. It provides an end-to-end AI agent that handles the entire interview process, assessment, and classification for government and enterprise stakeholders.

---

## 🚀 Core Features (Mapping to Requirements)

### 1. AI-Led Video Interview
*   **Mobile-First Experience**: A fully responsive interface designed for candidates on any device.
*   **Structured AI Interaction**: An AI agent asks role-specific questions via a voice + video interface.
*   **Kannada-First Multilingual Support**: Deep integration with **Sarvam AI Saaras v2** to handle Kannada (including dialects), Hindi, and English.
*   **Real-World Robustness**: Designed to process natural speech, including pauses, regional accents, and informal responses.

### 2. Response Assessment Engine
Leveraging **Google Gemini 1.5 Flash**, the platform evaluates:
*   **Relevance & Completeness**: How accurately the candidate addresses the core requirements.
*   **Communication Clarity**: Coherence and language expressiveness.
*   **Skill Confidence**: Identifies subtle indicators of domain mastery and certainty.

### 3. Face & Voice Validation (Proctoring)
*   **Interview Quality**: Uses **MediaPipe FaceDetector** to ensure face visibility and presence throughout the session.
*   **Audio Integrity**: Monitors audio continuity to detect poor-quality inputs or technical interruptions.

### 4. Integrity & Duplicate Detection
*   **Trust Score**: A dynamic score that flags suspicious patterns, impersonation attempts, or cases where the candidate leaves the frame.
*   **Fraud Prevention**: Flags low-confidence or inconsistent submissions for manual audit.

### 5. Candidate Fitment (Classification Layer)
The platform automatically maps candidates into action-oriented categories:
*   ✅ **Job-ready**: Strong performance across technical and communication dimensions.
*   🛠️ **Requires Training / Upskilling**: Shows potential but lacks specific domain depth.
*   🔍 **Requires Manual Verification**: Flagged by proctoring or inconsistent results.
*   ⚠️ **Low-Confidence / Poor-Quality**: Submissions that don't meet basic assessment thresholds.
*   🚫 **Suspected Duplicate / Fraud**: Flagged for integrity violations.

### 6. Stakeholder Admin Dashboard
A dedicated decision layer for government and organizational stakeholders:
*   **Drill-Down Analytics**: Filter candidates by **Interview Role**, **Skill Score**, and **Language**.
*   **Decision Layer**: View detailed interview summaries and AI-generated confidence scores.
*   **Flagged Review**: A dedicated view to investigate cases flagged for integrity issues.
*   **Direct Shortlisting**: Efficiently move candidates toward jobs, training programs, or further verification.

---

## 🏗️ Tech Stack

| Component | Technology |
|---|---|
| **Frontend** | React 18, Vite, Vanilla CSS (Mobile-Responsive) |
| **STT Engine** | **Sarvam AI** (Kannada, Hindi, English) |
| **Reasoning Engine** | **Google Gemini 1.5 Flash** |
| **Proctoring** | MediaPipe (Real-time Face Tracking) |
| **Backend** | Node.js 20, Express 5 |
| **Database** | MongoDB Atlas / In-Memory Store |

---

## ⚙️ Local Setup

```bash
# 1. Install Dependencies
cd server && npm install
cd ../client && npm install

# 2. Start Servers
# Backend (Port 8000): cd server && npm run dev
# Frontend (Port 5173): cd client && npm run dev
```

---

## 👥 Team

*   **Harshitha GG**
*   **Ishita Gautam**
*   **Jayant Singh Rawat**

**Hackathon:** AI for Bharat · Theme 5: AI SkillFit

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
