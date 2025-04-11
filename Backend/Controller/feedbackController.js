const Feedback = require('../model/Feedback');
const Session = require('../model/Session');

const submitFeedback = async (req, res) => {
  const { sessionId, participantId, communication, clarity, comments } = req.body;
  const feedback = new Feedback({ sessionId, participantId, evaluatorId: req.user.id, communication, clarity, comments });
  await feedback.save();
  res.json({ status: 'ok' });
};

const submitBulkFeedback = async (req, res) => {
  const feedbackArray = req.body;
  try {
    const session = await Session.findById(feedbackArray[0].sessionId);
    if (!session || !session.evaluators.includes(req.user.id)) return res.status(403).json({ error: 'Unauthorized' });
    const feedbacks = feedbackArray.map(f => ({ ...f, evaluatorId: req.user.id }));
    await Feedback.insertMany(feedbacks);
    session.status = 'ended';
    await session.save();
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
};

const getFeedbackHistory = async (req, res) => {
  const feedbacks = await Feedback.find({ participantId: req.params.userId }).populate('sessionId', 'topic').populate('evaluatorId', 'name');
  res.json(feedbacks);
};

const getAnalytics = async (req, res) => {
  const feedbacks = await Feedback.find({ participantId: req.params.userId });
  const totalSessions = feedbacks.length;
  const averageCommunication = feedbacks.reduce((sum, f) => sum + f.communication, 0) / totalSessions || 0;
  const averageClarity = feedbacks.reduce((sum, f) => sum + f.clarity, 0) / totalSessions || 0;
  res.json({ totalSessions, averageCommunication, averageClarity, trend: feedbacks });
};

module.exports = { submitFeedback, submitBulkFeedback, getFeedbackHistory, getAnalytics };