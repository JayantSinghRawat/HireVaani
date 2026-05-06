const router = require('express').Router();
const Interview = require('../models/Interview');
const mongoose = require('mongoose');
const { auth } = require('../middleware/auth');

const isMongoConnected = () => mongoose.connection.readyState === 1;

// Seed a demo interview for testing in memory mode
const demoInterview = {
  _id: new mongoose.Types.ObjectId().toString(),
  companyName: 'TechCorp India',
  role: 'software_engineer',
  date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  mode: 'AI Video',
  status: 'Scheduled',
  description: 'Technical round focusing on React and Node.js fundamentals, system design, and algorithmic problem solving.',
  requiredSkills: ['React', 'Node.js', 'System Design'],
  instructions: 'Ensure you have a stable internet connection. The AI will ask 5 questions based on your resume and role.',
  customQuestions: ['Can you explain the virtual DOM in React?', 'How does the event loop work in Node.js?'],
  createdAt: new Date(),
};
demoInterview.id = demoInterview._id;

const memInterviews = new Map([[demoInterview._id, demoInterview]]);

// POST /api/interviews - Create an interview (Organizer only)
router.post('/', auth, async (req, res) => {
  if (req.user?.role !== 'organizer') return res.status(403).json({ error: 'Forbidden' });
  try {
    const data = { ...req.body, _id: new mongoose.Types.ObjectId().toString(), createdAt: new Date() };
    // map id field for frontend
    data.id = data._id;
    if (isMongoConnected()) {
      const created = await Interview.create(data);
      return res.json({ id: created._id, ...created.toObject() });
    } else {
      memInterviews.set(data._id, data);
      return res.json(data);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/interviews - Get all interviews
router.get('/', async (req, res) => {
  try {
    let data;
    if (isMongoConnected()) {
      const dbInterviews = await Interview.find({}).sort({ date: 1 });
      data = dbInterviews.map(i => ({ id: i._id, ...i.toObject() }));
    } else {
      data = [...memInterviews.values()].sort((a,b) => new Date(a.date) - new Date(b.date));
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
