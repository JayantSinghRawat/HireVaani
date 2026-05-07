const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
const getClient = () => {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY not set');
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
};

/**
 * Evaluate a single answer using Gemini — extremely strict scoring
 */
async function evaluateAnswer({ question, transcript, role, language }) {
  const model = getClient().getGenerativeModel({ model: 'gemini-2.5-flash' });

  // Detect blank/no-answer responses immediately — don't even call Gemini
  const cleaned = (transcript || '').trim();
  const isBlankAnswer =
    cleaned.length < 10 ||
    ['[No audio recorded]', '[Transcription failed]', 'No audio', ''].includes(cleaned) ||
    cleaned.split(' ').length < 4;

  if (isBlankAnswer) {
    return {
      isCorrect: false,
      relevance: 0, clarity: 0, confidence: 0, technical: 0, communication: 0,
      feedback: 'No meaningful answer was provided. This will significantly impact your evaluation.',
    };
  }

  const prompt = `You are a ruthless, world-class interviewer evaluating a candidate for the role of "${role}". You have extremely high standards. Language: "${language}".

QUESTION ASKED: ${question}
CANDIDATE'S TRANSCRIBED ANSWER: "${transcript}"

STRICT GRADING RULES — READ CAREFULLY:
1. If the answer does not DIRECTLY address the question asked, ALL scores must be 0-2. 
2. If the answer is vague, generic, or uses buzzwords without substance (e.g., "I use best practices", "I always communicate well"), scores must NOT exceed 3.
3. Only award scores above 7 if the answer demonstrates clear, specific, technically accurate depth with real examples.
4. If the candidate is clearly making things up or contradicting themselves, all scores must be 0-2.
5. A score of 5 means mediocre — barely passing. A score of 8+ means exceptional.
6. "confidence" should be 0 if the answer is rambling, incoherent, or off-topic.
7. BE BRUTAL. The market is competitive. Most candidates do not deserve above 5.

Score each dimension from 0 to 10:
- relevance: Does it DIRECTLY and SPECIFICALLY answer what was asked?
- clarity: Is the answer logically structured and easy to follow?
- confidence: Does the candidate sound convincing and certain (NOT rambling)?
- technical: Is there genuine domain expertise, correct terminology, and real depth?
- communication: Is it professional, precise, and concise?

Respond ONLY with this exact valid JSON (no markdown fences):
{
  "isCorrect": <true if the answer actually addresses the question meaningfully, else false>,
  "relevance": <0-10>,
  "clarity": <0-10>,
  "confidence": <0-10>,
  "technical": <0-10>,
  "communication": <0-10>,
  "feedback": "<1-2 sentences of HARSH, direct feedback. State exactly what was wrong or missing. Be specific. Language: ${language === 'hi' ? 'Hindi' : language === 'kn' ? 'Kannada' : 'English'}>"
}`;

  const result = await model.generateContent(prompt);
  const text   = result.response.text().trim();
  const jsonStr = text.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
  const parsed  = JSON.parse(jsonStr);

  return {
    isCorrect:     !!parsed.isCorrect,
    relevance:     clamp(parsed.relevance),
    clarity:       clamp(parsed.clarity),
    confidence:    clamp(parsed.confidence),
    technical:     clamp(parsed.technical),
    communication: clamp(parsed.communication),
    feedback:      parsed.feedback || '',
  };
}

/**
 * Generate overall fitment decision — AI acts as a hard-nosed hiring director
 */
async function generateFitment({ role, overallScore, skillScores, trustScore, answers }) {
  const model = getClient().getGenerativeModel({ model: 'gemini-2.5-flash' });

  const summaries = answers.map((a, i) =>
    `Q${i+1}: ${a.questionText}\nAnswer: "${a.transcript}"\nScores: ${JSON.stringify(a.geminiScores)}\nFeedback: ${a.geminiScores?.feedback || ''}`
  ).join('\n\n---\n\n');

  const prompt = `You are a hard-nosed talent acquisition director at a top-tier company. You are evaluating a candidate who just completed an AI interview for the role of "${role}".

CANDIDATE DATA:
- Overall Score: ${overallScore}/10
- Trust Score (integrity during interview): ${trustScore}/100
- Skill Breakdown: ${JSON.stringify(skillScores)}

INTERVIEW TRANSCRIPT SUMMARY:
${summaries}

YOUR TASK — Make a BINARY hiring recommendation. Follow these rules STRICTLY:
- "Not Fit": Overall Score < 5.5 OR Trust Score < 60 OR any critical skill (technical, relevance) scored < 3 on average OR candidate gave blank/incoherent answers.
- "Under Review": Score 5.5–7.0 AND trust >= 60. Some good answers but inconsistent depth.
- "Shortlisted": Score > 7.0 AND trust >= 75 AND demonstrated genuine expertise across most answers. Only the top 10% of candidates deserve this.
- If trust score is below 50, ALWAYS "Not Fit" regardless of score — interview integrity is non-negotiable.
- Be extremely critical. Most candidates should get "Under Review" or "Not Fit".

Respond ONLY with this valid JSON (no markdown):
{
  "decision": "<Shortlisted | Under Review | Not Fit>",
  "reason": "<3-4 sentences. Be direct, critical, and specific. Reference actual answers or gaps. State what disqualified them or what impressed you. No corporate fluff.>",
  "hiringRecommendation": "<one word: HIRE | HOLD | REJECT>",
  "keyStrengths": ["<strength 1>", "<strength 2>"],
  "criticalWeaknesses": ["<weakness 1>", "<weakness 2>"]
}`;

  const result = await model.generateContent(prompt);
  const text   = result.response.text().trim();
  const jsonStr = text.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
  const parsed  = JSON.parse(jsonStr);

  return {
    decision: ['Shortlisted','Under Review','Not Fit'].includes(parsed.decision)
      ? parsed.decision
      : 'Under Review',
    reason:   parsed.reason || '',
    hiringRecommendation: parsed.hiringRecommendation || 'HOLD',
    keyStrengths:         parsed.keyStrengths || [],
    criticalWeaknesses:   parsed.criticalWeaknesses || [],
  };
}

const clamp = (n) => Math.min(10, Math.max(0, Number(n) || 0));

module.exports = { evaluateAnswer, generateFitment };
