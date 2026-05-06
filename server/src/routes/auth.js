const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const { SECRET, ADMIN_USER, ADMIN_PASS } = require('../middleware/auth');

const isMongoConnected = () => mongoose.connection.readyState === 1;

// In-memory fallback if Mongo is disconnected
const usersStore = new Map();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!['user', 'organizer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (isMongoConnected()) {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ error: 'Email already in use' });
      
      const user = new User({ name, email, password: hashedPassword, role });
      await user.save();
    } else {
      if (usersStore.has(email)) return res.status(400).json({ error: 'Email already in use' });
      usersStore.set(email, { name, email, password: hashedPassword, role });
    }

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Support legacy hardcoded admin for backward compatibility
    if (email === ADMIN_USER && password === ADMIN_PASS) {
      const token = jwt.sign({ email, name: 'Admin', role: 'organizer' }, SECRET, { expiresIn: '8h' });
      return res.json({ token, user: { email, name: 'Admin', role: 'organizer' } });
    }

    let user;
    if (isMongoConnected()) {
      user = await User.findOne({ email });
    } else {
      user = usersStore.get(email);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { email: user.email, name: user.name, role: user.role },
      SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/verify  (used by frontend to check token validity)
router.get('/verify', (req, res) => {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ valid: false });
  try {
    const payload = jwt.verify(token, SECRET);
    res.json({ valid: true, user: { name: payload.name, email: payload.email, role: payload.role } });
  } catch {
    res.status(401).json({ valid: false });
  }
});

module.exports = router;
