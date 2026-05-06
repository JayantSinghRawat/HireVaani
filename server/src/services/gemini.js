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
 * Evaluate a single answer using Gemini
 * Returns structured JSON scores + feedback
 */
async function evaluateAnswer({ question, transcript, role, language }) {
  const model = getClient().getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are a strict, top-tier technical and HR interviewer evaluating a candidate for the role of "${role}".
The interview language is "${language}".

QUESTION: ${question}
CANDIDATE'S ANSWER (Transcribed from audio): "${transcript}"

CRITICAL INSTRUCTIONS FOR GRADING:
1. You must determine if the answer is FACTUALLY AND TECHNICALLY CORRECT.
2. If the answer is incorrect, vague, or dodges the question, "isCorrect" MUST be false, and all scores MUST be 0.
3. Only score above 0 if the answer is actually correct and relevant.
4. Be EXTREMELY STRICT. Generic buzzwords mean the answer is incorrect.

Evaluate the answer on these 5 criteria (score 0-10 each):
1. relevance: Does it directly answer the core of the question?
2. clarity: Is it logically structured?
3. confidence: Does the transcript show conviction?
4. technical: Depth of domain expertise and correct terminology.
5. communication: Professionalism and exactness.

Respond ONLY with valid JSON in this exact format:
{
  "isCorrect": <boolean>,
  "relevance": <number>,
  "clarity": <number>,
  "confidence": <number>,
  "technical": <number>,
  "communication": <number>,
  "feedback": "<One sentence of STRICT, constructive feedback in ${language === 'hi' ? 'Hindi' : language === 'kn' ? 'Kannada' : 'English'}. Be direct about what was lacking or if it was incorrect.>"
}`;

  const result = await model.generateContent(prompt);
  const text   = result.response.text().trim();

  // Parse JSON — strip markdown code fences if present
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
 * Generate overall fitment decision using Gemini
 */
async function generateFitment({ role, overallScore, skillScores, trustScore, answers }) {
  const model = getClient().getGenerativeModel({ model: 'gemini-2.5-flash' });

  const summaries = answers.map((a, i) =>
    `Q${i+1}: ${a.questionText}\nAnswer: ${a.transcript}\nScores: ${JSON.stringify(a.geminiScores)}`
  ).join('\n\n');

  const prompt = `You are a strict, top-tier talent acquisition director evaluating a candidate for "${role}".

Overall Score: ${overallScore}/10
Trust Score (face/audio consistency): ${trustScore}/100
Skill Scores: ${JSON.stringify(skillScores)}

Interview Summary:
${summaries}

CRITICAL INSTRUCTIONS FOR FITMENT:
Be extremely rigorous. Only the absolute best candidates should be "Shortlisted".
- If the Overall Score is below 5.5, or Trust Score is below 70, the decision MUST be "Not Fit".
- If the Overall Score is between 5.5 and 7.5, the decision should likely be "Under Review".
- Only "Shortlist" candidates who show exceptional technical depth and clear communication.

Based on this assessment, provide a fitment decision.
Respond ONLY with valid JSON:
{
  "decision": "<Shortlisted | Under Review | Not Fit>",
  "reason": "<2–3 sentences of highly critical, direct explanation of why this decision was made. No fluff.>"
}`;

  const result = await model.generateContent(prompt);
  const text   = result.response.text().trim();
  const jsonStr = text.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
  const parsed  = JSON.parse(jsonStr);

  return {
    decision: ['Shortlisted','Under Review','Not Fit'].includes(parsed.decision)
      ? parsed.decision
      : 'Under Review',
    reason: parsed.reason || '',
  };
}

const clamp = (n) => Math.min(10, Math.max(0, Number(n) || 0));

module.exports = { evaluateAnswer, generateFitment };
