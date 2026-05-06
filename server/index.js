require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// ── Middleware ──────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4173', 'http://localhost:8000'], credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── Routes ──────────────────────────────────────────────
app.use('/api/questions',  require('./src/routes/questions'));
app.use('/api/session',    require('./src/routes/session'));
app.use('/api/transcribe', require('./src/routes/transcribe'));
app.use('/api/evaluate',   require('./src/routes/evaluate'));
app.use('/api/candidates', require('./src/routes/candidates'));
app.use('/api/interviews', require('./src/routes/interviews'));
app.use('/api/auth',       require('./src/routes/auth'));

// ── Health check ────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'HireVaani API' }));

// ── 404 handler ─────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global error handler ────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Start ───────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

// MongoDB is optional for now — connect if URI provided
const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGODB_URI;

const startServer = async () => {
  if (MONGO_URI) {
    try {
      await mongoose.connect(MONGO_URI);
      console.log('✅ MongoDB connected');
    } catch (e) {
      console.warn('⚠️  MongoDB connection failed — running in memory mode:', e.message);
    }
  } else {
    console.log('ℹ️  No MONGODB_URI — running in memory mode (data not persisted)');
  }

  app.listen(PORT, () => {
    console.log(`🚀 HireVaani API running on http://localhost:${PORT}`);
  });
};

startServer();
