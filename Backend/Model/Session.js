const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  moderatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  evaluators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  startTime: { type: Date, required: true },
  duration: { type: Number, required: true },
  status: { type: String, enum: ['active', 'ended'], default: 'active' },
  chatHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  isAIPractice: { type: Boolean, default: false },
});

module.exports = mongoose.model('Session', sessionSchema);