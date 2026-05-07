const router   = require('express').Router();
const Candidate = require('../models/Candidate');
const { evaluateAnswer, generateFitment } = require('../services/gemini');
const mongoose  = require('mongoose');

// In-memory fallback store
const memStore = require('../data/memStore');

const isMongoConnected = () => mongoose.connection.readyState === 1;

// POST /api/evaluate
// Body: { sessionId, name, role, language, email, answers: [{questionText, transcript}], faceAlerts, trustScore }
router.post('/', async (req, res) => {
  try {
    const { sessionId, name, role, language, email, answers, faceAlerts = 0, trustScore: rawTrust } = req.body;

    if (!sessionId || !role || !language || !answers?.length) {
      return res.status(400).json({ error: 'sessionId, role, language, and answers are required' });
    }

    // ── Evaluate each answer with Gemini ──────────────────
    const evaluatedAnswers = [];
    const totals = { relevance: 0, clarity: 0, confidence: 0, technical: 0, communication: 0 };

    for (let i = 0; i < answers.length; i++) {
      const { questionText, transcript } = answers[i];
      // Default to 0 — no answer = no score
      let scores = { relevance: 0, clarity: 0, confidence: 0, technical: 0, communication: 0, feedback: 'Answer was not provided or could not be evaluated.' };

      if (transcript && transcript.trim().length > 5) {
        try {
          scores = await evaluateAnswer({ question: questionText, transcript, role, language });
        } catch (e) {
          console.warn(`[gemini] Answer ${i} eval failed:`, e.message);
        }
      }

      evaluatedAnswers.push({ questionIndex: i, questionText, transcript, language, geminiScores: scores, feedback: scores.feedback });
      totals.relevance     += scores.relevance;
      totals.clarity       += scores.clarity;
      totals.confidence    += scores.confidence;
      totals.technical     += scores.technical;
      totals.communication += scores.communication;
    }

    const n = answers.length;
    const skillScores = {
      relevance:     +(totals.relevance / n).toFixed(1),
      clarity:       +(totals.clarity / n).toFixed(1),
      confidence:    +(totals.confidence / n).toFixed(1),
      technical:     +(totals.technical / n).toFixed(1),
      communication: +(totals.communication / n).toFixed(1),
    };

    const overallScore = +(Object.values(skillScores).reduce((a,b) => a+b, 0) / 5).toFixed(1);

    // ── Trust score (face alerts penalize) ────────────────
    const trustScore = rawTrust !== undefined ? rawTrust : Math.max(0, 100 - faceAlerts * 10);

    // ── Fitment decision ──────────────────────────────────
    let fitmentDecision = 'Under Review';
    let fitmentReason   = '';
    let hiringRecommendation = 'HOLD';
    let keyStrengths = [];
    let criticalWeaknesses = [];
    try {
      const fit = await generateFitment({ role, overallScore, skillScores, trustScore, answers: evaluatedAnswers });
      fitmentDecision = fit.decision;
      fitmentReason   = fit.reason;
      hiringRecommendation = fit.hiringRecommendation || 'HOLD';
      keyStrengths = fit.keyStrengths || [];
      criticalWeaknesses = fit.criticalWeaknesses || [];
    } catch (e) {
      console.warn('[gemini] Fitment failed:', e.message);
      fitmentDecision = overallScore >= 7 ? 'Shortlisted' : overallScore >= 5 ? 'Under Review' : 'Not Fit';
      fitmentReason   = 'Evaluated based on score thresholds due to AI service error.';
    }

    const record = { sessionId, name: name || 'Anonymous', role, language, email: email || '',
      answers: evaluatedAnswers, trustScore, skillScores, overallScore,
      fitmentDecision, fitmentReason, hiringRecommendation, keyStrengths, criticalWeaknesses,
      faceAlerts, status: 'completed' };

    // ── Persist ───────────────────────────────────────────
    if (isMongoConnected()) {
      await Candidate.findOneAndUpdate({ sessionId }, record, { upsert: true, new: true });
    } else {
      memStore.set(sessionId, { ...record, createdAt: new Date(), updatedAt: new Date() });
    }

    res.json({ sessionId, overallScore, skillScores, trustScore, fitmentDecision, fitmentReason,
      hiringRecommendation, keyStrengths, criticalWeaknesses, answers: evaluatedAnswers });
  } catch (err) {
    console.error('[evaluate]', err);
    res.status(500).json({ error: err.message });
  }
});

// Export memStore so candidates route can use it
module.exports = router;
