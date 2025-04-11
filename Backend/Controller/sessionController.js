const Session = require('../model/Session');
const User = require('../model/User');
const Message = require('../model/Message');

const createSession = async (req, res) => {
  const { topic, duration, participantEmails, evaluatorEmails, isAIPractice } = req.body;
  try {
    const participantIds = isAIPractice ? [req.user.id] : await User.find({ email: { $in: participantEmails || [] } }).distinct('_id');
    const evaluatorIds = isAIPractice ? [] : await User.find({ email: { $in: evaluatorEmails || [] } }).distinct('_id');
    if (participantEmails && participantEmails.length > participantIds.length) return res.status(400).json({ error: 'One or more participant emails not found' });
    if (evaluatorEmails && evaluatorEmails.length > evaluatorIds.length) return res.status(400).json({ error: 'One or more evaluator emails not found' });
    const session = new Session({ topic, moderatorId: req.user.id, participants: participantIds, evaluators: evaluatorIds, startTime: new Date(), duration, isAIPractice: !!isAIPractice });
    await session.save();
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create session' });
  }
};

const getSessions = async (req, res) => {
  const sessions = await Session.find().populate('moderatorId', 'name email').populate('participants', 'name email').populate('evaluators', 'name email');
  res.json(sessions);
};

const getSessionById = async (req, res) => {
  const session = await Session.findById(req.params.id).populate('moderatorId', 'name email').populate('participants', 'name email').populate('evaluators', 'name email');
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
};

const getSessionChat = async (req, res) => {
  const session = await Session.findById(req.params.id).populate('chatHistory');
  if (!session) return res.status(404).json({ error: 'Session not found' });
  const chatMessages = session.chatHistory.map(msg => ({
    userId: msg.userId,
    username: msg.username,
    role: msg.role,
    message: msg.message,
    timestamp: msg.timestamp,
  }));
  res.json(chatMessages);
};

const endSession = async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session || session.moderatorId.toString() !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
  session.status = 'ended';
  await session.save();
  res.json(session);
};

module.exports = { createSession, getSessions, getSessionById, getSessionChat, endSession };