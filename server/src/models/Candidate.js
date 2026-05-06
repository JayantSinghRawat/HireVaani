const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionIndex: Number,
  questionText:  String,
  transcript:    String,
  language:      String,
  geminiScores: {
    relevance:     { type: Number, default: 0 },
    clarity:       { type: Number, default: 0 },
    confidence:    { type: Number, default: 0 },
    technical:     { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
  },
  feedback: String,
});

const candidateSchema = new mongoose.Schema({
  sessionId:   { type: String, required: true, unique: true },
  name:        { type: String, required: true },
  role:        { type: String, required: true },
  language:    { type: String, enum: ['en','hi','kn'], required: true },
  email:       { type: String, default: '' },
  answers:     [answerSchema],
  trustScore:  { type: Number, default: 0 },
  skillScores: {
    relevance:     { type: Number, default: 0 },
    clarity:       { type: Number, default: 0 },
    confidence:    { type: Number, default: 0 },
    technical:     { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
  },
  overallScore:   { type: Number, default: 0 },
  fitmentDecision:{ type: String, enum: ['Shortlisted','Under Review','Not Fit','Pending'], default: 'Pending' },
  fitmentReason:  { type: String, default: '' },
  faceAlerts:     { type: Number, default: 0 },
  status:         { type: String, enum: ['in_progress','completed','reviewed'], default: 'in_progress' },
  adminNotes:     { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Candidate', candidateSchema);
