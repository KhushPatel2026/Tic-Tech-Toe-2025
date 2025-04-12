const mongoose = require('mongoose');

const mockGDResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true },
  hardnessLevel: { type: String, enum: ['Easy', 'Medium', 'Hard', 'Expert'], required: true },
  discussion: [{
    speaker: { type: String, required: true },
    text: { type: String, required: true },
  }],
  analysis: [{
    response: { type: String, required: true },
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

module.exports = mongoose.model('MockGDResult', mockGDResultSchema);