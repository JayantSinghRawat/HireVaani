const { transcribe } = require('./src/services/sarvam');
require('dotenv').config();
const fs = require('fs');

async function run() {
  try {
    const buffer = Buffer.from('RIFF$   WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xAC\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00', 'ascii');
    const t = await transcribe(buffer, 'hi-IN', 'audio/wav', 'test.wav');
    console.log(t);
  } catch (e) {
    console.error('ERROR:', e.response?.data || e.message);
  }
}
run();
