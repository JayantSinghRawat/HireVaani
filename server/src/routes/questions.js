const router = require('express').Router();
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

const ROLE_CONTEXT = {
  software_engineer:   'Software Engineering / Full-Stack Development',
  data_analyst:        'Data Analysis / Business Intelligence',
  marketing_executive: 'Marketing / Growth / Brand Strategy',
  hr_executive:        'Human Resources / Talent Acquisition',
  sales_executive:     'B2B/B2C Sales / Business Development',
  customer_support:    'Customer Success / Support Operations',
};

const LANG_INSTRUCTION = {
  en: 'in English',
  hi: 'in Hindi (Devanagari script)',
  kn: 'in Kannada (Kannada script)',
};

// Cache to avoid re-generating the same role+language combo within a short window
const questionCache = new Map();

// GET /api/questions?role=software_engineer&language=hi&sessionId=abc123
router.get('/', async (req, res) => {
  const { role, language, sessionId } = req.query;
  const roleContext = ROLE_CONTEXT[role];
  if (!roleContext) return res.status(404).json({ error: `Role "${role}" not found` });
  if (!LANG_INSTRUCTION[language]) return res.status(404).json({ error: `Language "${language}" not supported` });

  // Use sessionId to ensure uniqueness per candidate
  const cacheKey = `${role}_${language}_${sessionId || Date.now()}`;
  if (sessionId && questionCache.has(cacheKey)) {
    return res.json({ role, language, questions: questionCache.get(cacheKey) });
  }

  try {
    const model = getClient().getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `You are a senior hiring manager conducting a real interview for the position of ${roleContext}.

Generate exactly 6 UNIQUE, CHALLENGING interview questions for this candidate.

STRICT REQUIREMENTS:
1. Each question must be different in type — mix of: behavioural, technical depth, real-world scenario, situational judgment, and problem-solving.
2. NO generic or basic questions (e.g., "Tell me about yourself", "What are your strengths?"). These are banned.
3. At least 2 questions must describe a realistic, specific workplace scenario the candidate must solve (e.g., "Your production server goes down at 2 AM...").
4. Questions must test DEEP expertise — not surface-level knowledge.
5. Write all questions ${LANG_INSTRUCTION[language]}.
6. Questions must be for the role: ${roleContext}.
7. Make the questions hard enough that a weak candidate would clearly struggle.

Respond ONLY with a valid JSON array of 6 strings (the questions). No explanation, no markdown, no numbering.
Example: ["Question 1 text", "Question 2 text", ...]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonStr = text.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
    const questions = JSON.parse(jsonStr);

    if (!Array.isArray(questions) || questions.length < 5) {
      throw new Error('Gemini returned invalid question array');
    }

    // Shuffle and pick 5 to add further uniqueness
    const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, 5);
    if (sessionId) questionCache.set(cacheKey, shuffled);

    return res.json({ role, language, questions: shuffled });
  } catch (err) {
    console.error('[questions] Gemini failed, using fallback:', err.message);
    // Fallback to static questions if Gemini fails
    const staticQuestions = require('../data/questions');
    const qs = staticQuestions[role]?.[language];
    if (qs) return res.json({ role, language, questions: qs });
    return res.status(500).json({ error: 'Failed to generate questions' });
  }
});

router.get('/roles', (_req, res) => {
  res.json({ roles: Object.keys(ROLE_CONTEXT) });
});

module.exports = router;
