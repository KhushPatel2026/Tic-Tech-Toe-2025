require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('./utils/passportConfig');
const http = require('http');
const socketIo = require('socket.io');
const authRoutes = require('./routes/authRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const socialAuthRoutes = require('./Routes/socialAuthRoutes');
const Session = require('./model/Session');
const Message = require('./model/Message');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const checkAbusiveWords = require('./Utils/abusiveWords');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'], credentials: true } });

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({ secret: process.env.JWT_SECRET, resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGO_URL).then(() => console.log('MongoDB connection open'));

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/auth', socialAuthRoutes);

io.on('connection', (socket) => {
  socket.on('join-room', async ({ sessionId, userId, role }) => {
    const session = await Session.findById(sessionId);
    if (!session) return socket.emit('error', 'Session not found');
    const isAuthorized = session.moderatorId.toString() === userId || session.participants.includes(userId) || session.evaluators.includes(userId);
    if (!isAuthorized) return socket.emit('error', 'Not authorized');
    
    socket.join(sessionId);
    socket.to(sessionId).emit('user-joined', { userId, role });

    if (session.isAIPractice && role === 'Participant') {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent('Generate an interview question for a practice session.');
      socket.emit('ai-message', { username: 'AI Moderator', message: result.response.text(), timestamp: new Date() });
    }
  });

  socket.on('send-message', async ({ sessionId, userId, username, role, message }) => {
    const session = await Session.findById(sessionId);
    if (!session) return socket.emit('error', 'Session not found');

    if (checkAbusiveWords(message)) {
      session.participants = session.participants.filter(id => id.toString() !== userId);
      await session.save();
      socket.leave(sessionId);
      socket.emit('error', 'Removed from session due to abusive language');
      io.to(sessionId).emit('user-removed', { userId, reason: 'Abusive language' });
      return;
    }

    const chatMessage = new Message({ sessionId, userId, username, role, message });
    await chatMessage.save();
    session.chatHistory.push(chatMessage._id);
    await session.save();

    io.to(sessionId).emit('new-message', { userId, username, role, message, timestamp: chatMessage.timestamp });

    if (session.isAIPractice && role === 'Participant') {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(`Respond to this interview answer: "${message}" with a follow-up question or feedback.`);
      socket.emit('ai-message', { username: 'AI Moderator', message: result.response.text(), timestamp: new Date() });
    }
  });

  socket.on('join-voice-room', async ({ sessionId, userId }) => {
    const session = await Session.findById(sessionId);
    if (!session) return socket.emit('error', 'Session not found');
    const isAuthorized = session.moderatorId.toString() === userId || session.participants.includes(userId) || session.evaluators.includes(userId);
    if (!isAuthorized) return socket.emit('error', 'Not authorized');

    const token = RtcTokenBuilder.buildTokenWithUid(
      process.env.AGORA_APP_ID,
      process.env.AGORA_APP_CERTIFICATE,
      sessionId,
      userId,
      RtcRole.PUBLISHER,
      Math.floor(Date.now() / 1000) + 3600
    );

    socket.join(`${sessionId}-voice`);
    socket.emit('voice-token', { token, channel: sessionId });
    io.to(sessionId).emit('voice-user-joined', { userId });
  });

  socket.on('leave-voice-room', ({ sessionId, userId }) => {
    socket.leave(`${sessionId}-voice`);
    io.to(sessionId).emit('voice-user-left', { userId });
  });

  socket.on('leave-room', ({ sessionId }) => {
    socket.leave(sessionId);
    socket.leave(`${sessionId}-voice`);
    io.to(sessionId).emit('user-left', socket.id);
  });

  socket.on('end-session', async ({ sessionId }) => {
    const session = await Session.findById(sessionId);
    if (session && session.status === 'active') {
      session.status = 'ended';
      await session.save();
      io.to(sessionId).emit('end-session');
    }
  });

  socket.on('ai-response', async ({ sessionId, userId, response }) => {
    if (checkAbusiveWords(response)) {
      socket.emit('error', 'Inappropriate response detected');
      return;
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(`Respond to this interview answer: "${response}" with a follow-up question or feedback.`);
    socket.emit('ai-message', { username: 'AI Moderator', message: result.response.text(), timestamp: new Date() });
  });
});

server.listen(process.env.PORT || 3000, () => console.log('Server started'));