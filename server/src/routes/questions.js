const router = require('express').Router();
const questions = require('../data/questions');

// GET /api/questions?role=software_engineer&language=hi
router.get('/', (req, res) => {
  const { role, language } = req.query;
  const roleData = questions[role];
  if (!roleData) return res.status(404).json({ error: `Role "${role}" not found` });
  const qs = roleData[language];
  if (!qs) return res.status(404).json({ error: `Language "${language}" not found for role "${role}"` });
  res.json({ role, language, questions: qs });
});

// GET /api/questions/roles  → list available roles
router.get('/roles', (_req, res) => {
  res.json({ roles: Object.keys(questions) });
});

module.exports = router;
