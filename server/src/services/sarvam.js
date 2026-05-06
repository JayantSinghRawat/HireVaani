const axios = require('axios');
const FormData = require('form-data');

/**
 * Transcribe audio using Sarvam AI Saaras V3 STT
 * @param {Buffer} audioBuffer  - Audio file buffer (wav / webm / mp3)
 * @param {string} language     - 'en-IN' | 'hi-IN' | 'kn-IN'
 * @param {string} mimeType     - e.g. 'audio/webm'
 */
async function transcribe(audioBuffer, language = 'hi-IN', mimeType = 'audio/webm', filename = 'audio.webm') {
  const API_KEY = process.env.SARVAM_API_KEY;
  if (!API_KEY) throw new Error('SARVAM_API_KEY not set');

  const form = new FormData();
  form.append('file', audioBuffer, {
    filename: filename,
    contentType: mimeType,
  });
  form.append('model', 'saaras:v3');
  form.append('language_code', language);
  form.append('with_timestamps', 'false');
  form.append('with_disfluencies', 'false');

  const response = await axios.post(
    'https://api.sarvam.ai/speech-to-text',
    form,
    {
      headers: {
        ...form.getHeaders(),
        'api-subscription-key': API_KEY,
      },
      timeout: 30000,
    }
  );

  // Sarvam response: { transcript: "...", ... }
  return response.data.transcript || '';
}

// Map our short lang codes to Sarvam language codes
const LANG_MAP = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN' };

module.exports = { transcribe, LANG_MAP };
