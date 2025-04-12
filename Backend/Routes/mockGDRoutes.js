const express = require('express');
const router = express.Router();
const mockGDController = require('../Controller/mockGDController');

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  require('jsonwebtoken').verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

router.post('/topic', auth, mockGDController.generateTopic);
router.post('/respond', auth, mockGDController.respondToDiscussion);
router.post('/save', auth, mockGDController.saveResults);
router.get('/history', auth, mockGDController.getHistory);

module.exports = router;