const router  = require('express').Router();
const { v4: uuidv4 } = require('uuid');

// In-memory session store (replaced by MongoDB when connected)
const sessions = new Map();

// POST /api/session  → create new session
router.post('/', (req, res) => {
  const { name, role, language, email } = req.body;
  if (!name || !role || !language) {
    return res.status(400).json({ error: 'name, role, and language are required' });
  }
  const sessionId = uuidv4();
  sessions.set(sessionId, { sessionId, name, role, language, email: email || '', createdAt: new Date() });
  res.status(201).json({ sessionId });
});

// GET /api/session/:id
router.get('/:id', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

module.exports = router;
