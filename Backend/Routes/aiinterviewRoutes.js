const express = require('express');
const router = express.Router();
const aiInterviewController = require('../Controller/aiInterviewController');

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  require('jsonwebtoken').verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

router.post('/questions', auth, aiInterviewController.generateQuestions);
router.post('/analyze', auth, aiInterviewController.analyzeAnswer);
router.post('/save', auth, aiInterviewController.saveResults);
router.get('/history', auth, aiInterviewController.getHistory);

module.exports = router;