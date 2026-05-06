const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  role: { type: String, required: true },
  date: { type: Date, required: true },
  mode: { type: String, default: 'AI Video' },
  status: { type: String, default: 'Scheduled' },
  description: { type: String, default: '' },
  requiredSkills: [{ type: String }],
  instructions: { type: String, default: '' },
  customQuestions: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
