const router   = require('express').Router();
const Candidate = require('../models/Candidate');
const { auth }  = require('../middleware/auth');
const mongoose  = require('mongoose');
const memStore = require('../data/memStore');

const isMongoConnected = () => mongoose.connection.readyState === 1;

// ALL routes require auth
router.use(auth);

// GET /api/candidates/history – Get own interview history (Candidate/User)
router.get('/history', async (req, res) => {
  try {
    const email = req.user.email;
    if (!email) return res.status(400).json({ error: 'User email missing from token' });

    let data;
    if (isMongoConnected()) {
      data = await Candidate.find({ email: email.trim().toLowerCase() }).sort({ createdAt: -1 });
    } else {
      data = [...memStore.values()]
        .filter(c => c.email && c.email.trim().toLowerCase() === email.trim().toLowerCase())
        .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN ONLY ROUTES ───────────────────────────────────

const checkOrganizer = (req, res, next) => {
  if (req.user?.role !== 'organizer') {
    return res.status(403).json({ error: 'Forbidden: Organizer access required' });
  }
  next();
};

// GET /api/candidates  – list all
router.get('/', checkOrganizer, async (req, res) => {
  try {
    let data;
    if (isMongoConnected()) {
      data = await Candidate.find({}).sort({ createdAt: -1 }).select('-answers');
    } else {
      data = [...memStore.values()].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(({ answers: _a, ...rest }) => rest);
    }
    res.json({ candidates: data, total: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/candidates/:sessionId  – full detail with answers
router.get('/:sessionId', checkOrganizer, async (req, res) => {
  try {
    let data;
    if (isMongoConnected()) {
      data = await Candidate.findOne({ sessionId: req.params.sessionId });
    } else {
      data = memStore.get(req.params.sessionId);
    }
    if (!data) return res.status(404).json({ error: 'Candidate not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/candidates/:sessionId  – update status / notes / decision
router.patch('/:sessionId', checkOrganizer, async (req, res) => {
  try {
    const { fitmentDecision, status, adminNotes } = req.body;
    const update = {};
    if (fitmentDecision) update.fitmentDecision = fitmentDecision;
    if (status)          update.status = status;
    if (adminNotes !== undefined) update.adminNotes = adminNotes;

    let updated;
    if (isMongoConnected()) {
      updated = await Candidate.findOneAndUpdate(
        { sessionId: req.params.sessionId },
        { $set: update },
        { new: true }
      );
    } else {
      const existing = memStore.get(req.params.sessionId);
      if (!existing) return res.status(404).json({ error: 'Candidate not found' });
      updated = { ...existing, ...update, updatedAt: new Date() };
      memStore.set(req.params.sessionId, updated);
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
