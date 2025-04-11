const express = require('express');
const router = express.Router();
const feedbackController = require('../controller/feedbackController');

const auth = (roles = []) => (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  require('jsonwebtoken').verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    if (roles.length && !roles.includes(decoded.role)) return res.status(403).json({ error: 'Unauthorized role' });
    req.user = decoded;
    next();
  });
};

router.post('/', auth(['Evaluator']), feedbackController.submitFeedback);
router.post('/bulk', auth(['Evaluator']), feedbackController.submitBulkFeedback);
router.get('/history/:userId', auth(), feedbackController.getFeedbackHistory);
router.get('/analytics/:userId', auth(), feedbackController.getAnalytics);

module.exports = router;