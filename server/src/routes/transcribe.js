const router  = require('express').Router();
const multer  = require('multer');
const { transcribe, LANG_MAP } = require('../services/sarvam');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// POST /api/transcribe  (multipart: file + language)
router.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });

    const lang      = req.body.language || 'hi';
    const sarvamLang = LANG_MAP[lang] || 'hi-IN';

    const transcript = await transcribe(req.file.buffer, sarvamLang, req.file.mimetype, req.file.originalname);
    res.json({ transcript, language: lang });
  } catch (err) {
    console.error('[transcribe]', err.response?.data || err.message);
    // Return fallback so interview can continue without blocking
    res.status(500).json({ error: err.message, transcript: '' });
  }
});

module.exports = router;
