const express = require('express');
const router = express.Router();
const sessionController = require('../controller/sessionController');

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

router.post('/', auth(['Moderator', 'Participant']), sessionController.createSession);
router.get('/', auth(), sessionController.getSessions);
router.get('/:id', auth(), sessionController.getSessionById);
router.get('/:id/chat', auth(), sessionController.getSessionChat);
router.patch('/:id/end', auth(['Moderator']), sessionController.endSession);

module.exports = router;