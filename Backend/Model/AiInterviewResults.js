const mongoose = require('mongoose');

const aiInterviewResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobPosition: { type: String, required: true },
  jobDescription: { type: String, required: true },
  experience: { type: String, required: true },
  results: [{
    question: { type: String, required: true },
    answer: { type: String, required: true },
    analysis: { type: String, required: true },
  }],
  overallScores: {
    communication: { type: Number, min: 1, max: 5, required: true },
    clarity: { type: Number, min: 1, max: 5, required: true },
    confidence: { type: Number, min: 1, max: 5, required: true },
    engagement: { type: Number, min: 1, max: 5, required: true },
    reasoning: { type: Number, min: 1, max: 5, required: true },
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AIInterviewResult', aiInterviewResultSchema);