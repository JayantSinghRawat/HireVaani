const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const Candidate = require('../models/Candidate');
const mongoose = require('mongoose');
const memStore = require('../data/memStore');

const isMongoConnected = () => mongoose.connection.readyState === 1;

// POST /api/session  → create new session
router.post('/', async (req, res) => {
  try {
    const { name, role, language, email } = req.body;
    
    if (!name || !role || !language) {
      return res.status(400).json({ error: 'name, role, and language are required' });
    }

    // Prevent retakes if email is provided
    if (email && email.trim()) {
      try {
        let existing = null;
        if (isMongoConnected()) {
          existing = await Candidate.findOne({ email: email.trim(), role, status: 'completed' });
        } else {
          existing = [...memStore.values()].find(c => c.email === email.trim() && c.role === role && c.status === 'completed');
        }

        if (existing) {
          return res.status(400).json({ 
            error: 'Duplicate Interview', 
            message: 'You have already completed an interview for this role. Retakes are not permitted.' 
          });
        }
      } catch (err) {
        console.warn('[session] Duplicate check failed (ignoring):', err.message);
      }
    }

    const sessionId = uuidv4();
    const sessionData = { 
      sessionId, 
      name, 
      role, 
      language, 
      email: (email || '').trim(), 
      status: 'in_progress',
      createdAt: new Date() 
    };
    
    // Store in memStore
    memStore.set(sessionId, sessionData);

    res.status(201).json({ sessionId });
  } catch (err) {
    console.error('[session] Error:', err);
    res.status(500).json({ error: 'Failed to create session. Please try again.' });
  }
});

// GET /api/session/:id
router.get('/:id', (req, res) => {
  const session = memStore.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

module.exports = router;
