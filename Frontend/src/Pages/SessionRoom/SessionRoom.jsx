// src/pages/SessionRoom.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, ChevronRight, Send, Bot, LogOut, X } from 'lucide-react';
import io from 'socket.io-client';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'react-toastify/dist/ReactToastify.css';

const socket = io('http://localhost:3000', {
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  transports: ['websocket', 'polling'],
});
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

function SessionRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isVoiceOn, setIsVoiceOn] = useState(false);
  const [session, setSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatbotQuery, setChatbotQuery] = useState('');
  const [chatbotResponse, setChatbotResponse] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [stars, setStars] = useState([]);
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const clientRef = useRef(null);
  const audioTrackRef = useRef(null);
  const joinedRoomRef = useRef(false);
  const socketConnectedRef = useRef(false);
  const attemptedJoinRef = useRef(false);
  const voiceTokenRef = useRef(null);
  const chatContainerRef = useRef(null);
  const modelRef = useRef(null);

  // Generate stars for background (from Dashboard)
  useEffect(() => {
    const generateStars = () => {
      const newStars = [];
      for (let i = 0; i < 100; i++) {
        newStars.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.8 + 0.2,
          blinking: Math.random() > 0.7,
        });
      }
      setStars(newStars);
    };
    generateStars();
  }, []);

  // Initialize Gemini
  const initGemini = useCallback(() => {
    if (!modelRef.current && chatbotOpen) {
      try {
        modelRef.current = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        console.log('Gemini model initialized');
      } catch (error) {
        console.error('Gemini init error:', error);
        toast.error('Failed to initialize Gemini AI');
      }
    }
  }, [chatbotOpen]);

  // Ask Gemini Chatbot
  const askGeminiChatbot = useCallback(
    async (query) => {
      if (!query.trim()) return;
      if (!modelRef.current) {
        try {
          modelRef.current = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        } catch (error) {
          console.error('Gemini init error:', error);
          toast.error('Failed to initialize Gemini AI');
          return;
        }
      }
      setIsLoadingResponse(true);
      try {
        const sessionInfo = session
          ? `Current group discussion topic: ${session.topic || 'Unknown'}\nParticipants: ${
              session.participants?.map((p) => p.name).join(', ') || 'Unknown'
            }`
          : 'No session information available';
        const chatHistory = messages
          .slice(-10)
          .map((m) => `${m.username}: ${m.message}`)
          .join('\n');
        const prompt = `You are an AI assistant helping with a group discussion. Here's information about the current discussion: ${sessionInfo}\n\nRecent chat history:\n${chatHistory}\n\nThe user is asking: ${query}\n\nProvide a helpful, concise response relevant to the group discussion context. Be friendly and encouraging. Keep your response under 150 words.`;
        const result = await modelRef.current.generateContent(prompt);
        const response = await result.response;
        setChatbotResponse(response.text());
      } catch (error) {
        console.error('Gemini chatbot error:', error);
        setChatbotResponse('Sorry, I encountered an error processing your request. Please try again.');
      } finally {
        setIsLoadingResponse(false);
      }
    },
    [messages, session]
  );

  // Initialize Agora
  const initAgora = useCallback(async () => {
    try {
      if (!clientRef.current) {
        clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current.enableAudioVolumeIndicator();
        clientRef.current.on('user-published', async (user, mediaType) => {
          if (mediaType === 'audio') {
            try {
              await clientRef.current.subscribe(user, mediaType);
              console.log('Subscribed to user:', user.uid);
              if (user.audioTrack) {
                user.audioTrack.setVolume(100);
                user.audioTrack.play();
                console.log('Playing audio for user:', user.uid);
              } else {
                console.warn('No audio track available for user:', user.uid);
              }
            } catch (err) {
              console.error('Subscribe/play error:', err);
              toast.error('Failed to play audio: ' + err.message);
            }
          }
        });
        clientRef.current.on('user-unpublished', (user) => {
          console.log('User unpublished:', user.uid);
        });
        clientRef.current.on('volume-indicator', (volumes) => {
          const speaker = volumes.find((v) => v.level > 10);
          if (speaker && session) {
            let speakerName = null;
            const stringUid = String(speaker.uid);
            const participant = session.participants?.find((p) => String(p._id) === stringUid);
            if (participant) {
              speakerName = participant.name || `Participant ${stringUid}`;
            } else {
              const evaluator = session.evaluators?.find((e) => String(e._id) === stringUid);
              if (evaluator) {
                speakerName = evaluator.name || `Evaluator ${stringUid}`;
              } else if (String(session.moderatorId) === stringUid) {
                speakerName = session.moderatorName || 'Moderator';
              } else {
                speakerName = `User ${stringUid}`;
              }
            }
            setActiveSpeaker(speakerName);
          } else {
            setActiveSpeaker(null);
          }
        });
        clientRef.current.on('connection-state-change', (state) => {
          console.log('Agora connection state:', state);
        });
        clientRef.current.on('exception', (event) => {
          console.error('Agora exception:', event);
        });
      }
    } catch (err) {
      console.error('Agora init error:', err);
      toast.error('Failed to initialize audio: ' + err.message);
    }
  }, [session]);

  // Fetch Session and Chat
  const fetchSessionAndChat = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        navigate('/login');
        return;
      }
      const response = await fetch(`http://localhost:3000/api/sessions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setSession(data);
        const startTime = new Date(data.startTime).getTime();
        const durationMs = data.duration * 60 * 1000;
        const endTime = startTime + durationMs;
        const now = Date.now();
        setTimeLeft(endTime > now ? Math.floor((endTime - now) / 1000) : 0);
        const chatResponse = await fetch(`http://localhost:3000/api/sessions/${id}/chat`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const chatData = await chatResponse.json();
        if (chatResponse.ok) {
          const messagesArray = Array.isArray(chatData) ? chatData : [];
          setMessages(messagesArray);
        } else {
          console.error('Chat fetch error:', chatData);
          toast.error('Failed to load chat history');
        }
        if (socketConnectedRef.current && !joinedRoomRef.current) {
          joinRoom();
        }
      } else {
        console.error('Session fetch error:', data);
        toast.error(data.error || 'Session not found');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load session');
      navigate('/dashboard');
    }
  }, [id, navigate]);

  // Join Room
  const joinRoom = useCallback(() => {
    if (!joinedRoomRef.current && !attemptedJoinRef.current) {
      console.log('Joining room', id);
      attemptedJoinRef.current = true;
      socket.emit('join-room', { sessionId: id, userId: user.id, role: user.role || 'Guest' });
      joinedRoomRef.current = true;
    }
  }, [id, user.id, user.role]);

  // Join Voice Channel
  const joinVoiceChannel = useCallback(
    async (token, channel, uid) => {
      try {
        if (!clientRef.current) throw new Error('Agora client not initialized');
        console.log('Joining Agora with params:', {
          appId: import.meta.env.VITE_AGORA_APP_ID,
          channel,
          token,
          uid,
        });
        const numericUid = typeof uid === 'number' ? uid : parseInt(uid, 10) || Math.floor(Math.random() * 999000) + 1000;
        await clientRef.current.join(import.meta.env.VITE_AGORA_APP_ID, channel, token, numericUid);
        console.log('Joined Agora channel:', channel, 'as uid:', numericUid);
        if (!audioTrackRef.current) {
          audioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack({
            encoderConfig: 'speech_standard',
            AEC: true,
            ANS: true,
          });
          console.log('Audio track created');
        }
        await clientRef.current.publish(audioTrackRef.current);
        console.log('Audio track published');
        setIsVoiceOn(true);
      } catch (error) {
        console.error('Voice join error:', error);
        toast.error('Failed to join voice: ' + error.message);
        setIsVoiceOn(false);
      }
    },
    []
  );

  // Leave Voice Room
  const leaveVoiceRoom = useCallback(async () => {
    if (!isVoiceOn) return;
    console.log('Leaving voice room');
    try {
      socket.emit('leave-voice-room', { sessionId: id, userId: user.id });
      if (audioTrackRef.current) {
        try {
          if (clientRef.current) await clientRef.current.unpublish(audioTrackRef.current);
          audioTrackRef.current.close();
          audioTrackRef.current = null;
        } catch (err) {
          console.error('Error unpublishing audio track:', err);
        }
      }
      if (clientRef.current) {
        try {
          await clientRef.current.leave();
        } catch (err) {
          console.error('Error leaving Agora channel:', err);
        }
      }
      setIsVoiceOn(false);
      setActiveSpeaker(null);
    } catch (error) {
      console.error('Error leaving voice room:', error);
    }
  }, [id, isVoiceOn, user.id]);

  // Send Message
  const handleSendMessage = useCallback(() => {
    if (!message.trim()) return;
    console.log('Sending message:', message);
    const messageObj = {
      sessionId: id,
      userId: user.id,
      username: user.name || 'Guest',
      role: user.role || 'Guest',
      message,
      timestamp: new Date().toISOString(),
    };
    socket.emit('send-message', messageObj);
    setMessage('');
  }, [id, message, user.id, user.name, user.role]);

  // Toggle Voice
  const handleVoiceToggle = useCallback(async () => {
    try {
      if (isVoiceOn) {
        await leaveVoiceRoom();
      } else {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
          socket.emit('join-voice-room', { sessionId: id, userId: user.id });
        } catch (permError) {
          console.error('Microphone permission error:', permError);
          toast.error('Microphone access denied. Please allow microphone access in your browser settings.');
        }
      }
    } catch (error) {
      console.error('Voice toggle error:', error);
      toast.error('Failed to toggle voice: ' + error.message);
    }
  }, [id, isVoiceOn, leaveVoiceRoom, user.id]);

  // End Session
  const handleEndSession = useCallback(async () => {
    try {
      console.log('Ending session');
      const response = await fetch(`http://localhost:3000/api/sessions/${id}/end`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to end session');
      }
      socket.emit('end-session', { sessionId: id });
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      console.error('End session error:', error);
      toast.error(error.message || 'Failed to end session');
    }
  }, [id, navigate]);

  // Leave Room
  const handleLeaveRoom = useCallback(async () => {
    if (isVoiceOn) await leaveVoiceRoom();
    socket.emit('leave-room', { sessionId: id });
    navigate('/dashboard');
  }, [id, isVoiceOn, leaveVoiceRoom, navigate]);

  // Chatbot Submit
  const handleChatbotSubmit = useCallback(() => {
    if (!chatbotQuery.trim()) return;
    askGeminiChatbot(chatbotQuery);
    setChatbotQuery('');
  }, [chatbotQuery, askGeminiChatbot]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize Agora and Gemini
  useEffect(() => {
    initAgora();
    if (chatbotOpen) {
      initGemini();
    }
    return () => {
      leaveVoiceRoom();
    };
  }, [initAgora, leaveVoiceRoom, initGemini, chatbotOpen]);

  // Fetch session
  useEffect(() => {
    fetchSessionAndChat();
  }, [fetchSessionAndChat]);

  // Timer
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0 && session?.status === 'active') handleEndSession();
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, session, handleEndSession]);

  // Socket Events
  useEffect(() => {
    function handleConnect() {
      console.log('Socket connected:', socket.id);
      socketConnectedRef.current = true;
      if (session && !joinedRoomRef.current) joinRoom();
    }
    function handleDisconnect() {
      console.log('Socket disconnected');
      socketConnectedRef.current = false;
      joinedRoomRef.current = false;
    }
    function handleConnectError(error) {
      console.error('Socket connect error:', error);
      toast.error('Server connection lost. Retrying...');
    }
    function handleNewMessage(msg) {
      console.log('New message:', msg);
      setMessages((prev) => {
        const exists = prev.some(
          (m) =>
            m.userId === msg.userId &&
            m.message === msg.message &&
            new Date(m.timestamp).getTime() === new Date(msg.timestamp).getTime()
        );
        if (!exists) {
          return [...prev, { ...msg }];
        }
        return prev;
      });
    }
    function handleAiMessage(msg) {
      console.log('AI message:', msg);
      setMessages((prev) => [...prev, { ...msg }]);
    }
    function handleUserJoined({ userId }) {
      toast.info(`User ${userId} joined`);
    }
    function handleUserRemoved({ userId }) {
      toast.warn(`User ${userId} removed`);
    }
    function handleError(err) {
      console.error('Socket error:', err);
      toast.error(err);
    }
    function handleEndSession() {
      toast.info('Session ended');
      setTimeout(() => navigate('/dashboard'), 1500);
    }
    function handleVoiceToken(tokenData) {
      console.log('Received voice token:', tokenData);
      voiceTokenRef.current = tokenData;
      joinVoiceChannel(tokenData.token, tokenData.channel, tokenData.uid);
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('new-message', handleNewMessage);
    socket.on('ai-message', handleAiMessage);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-removed', handleUserRemoved);
    socket.on('error', handleError);
    socket.on('session-ended', handleEndSession);
    socket.on('voice-token', handleVoiceToken);

    if (socket.connected && !joinedRoomRef.current) {
      socketConnectedRef.current = true;
      joinRoom();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('new-message', handleNewMessage);
      socket.off('ai-message', handleAiMessage);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-removed', handleUserRemoved);
      socket.off('error', handleError);
      socket.off('session-ended', handleEndSession);
      socket.off('voice-token', handleVoiceToken);
    };
  }, [navigate, session, joinRoom, joinVoiceChannel]);

  const formatTime = (seconds) => {
    if (seconds === null) return '';
    return `${Math.floor(seconds / 60)}:${seconds % 60 < 10 ? '0' : ''}${seconds % 60}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a18] via-[#150a20] to-[#1a0628] text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {/* Stars */}
        {stars.map((star) => (
          <div
            key={star.id}
            className={`absolute rounded-full bg-white ${star.blinking ? 'animate-pulse' : ''}`}
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
            }}
          />
        ))}
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-3xl"
          animate={{ x: [0, 20, 0], y: [0, -20, 0], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, repeatType: 'reverse' }}
        />
        <motion.div
          className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, 20, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse' }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#0f0f1a]/70 border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Mic className="h-6 w-6 text-pink-500" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
              SpeakSpace
            </span>
          </div>
          <motion.button
            onClick={handleLeaveRoom}
            className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut className="h-4 w-4" />
            <span>Leave Session</span>
          </motion.button>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-20 pb-24">
        <div className="container mx-auto px-4">
          {/* Session Header */}
          <motion.div
            className="mb-8 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-md border border-white/10 p-6">
              <div className="absolute -right-12 -top-12 w-40 h-40 bg-pink-500/20 rounded-full blur-2xl"></div>
              <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                  {session?.topic || 'Loading Session...'}
                </h1>
                <div className="flex flex-wrap items-center gap-4">
                  {activeSpeaker ? (
                    <div className="flex items-center space-x-2 bg-green-500/10 py-2 px-4 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-400 font-medium">Speaking: {activeSpeaker}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 bg-gray-500/10 py-2 px-4 rounded-lg">
                      <span className="text-gray-400 font-medium">No one speaking</span>
                    </div>
                  )}
                  <span className="text-gray-300">{timeLeft !== null && `Time: ${formatTime(timeLeft)}`}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Chat Section */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-[#13101c] backdrop-blur-sm rounded-xl border border-white/5 p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <span className="bg-gradient-to-r from-pink-500 to-purple-500 h-5 w-1 rounded mr-2"></span>
                Chat
              </h2>
              <div
                ref={chatContainerRef}
                className="h-96 overflow-y-auto pr-2 custom-scrollbar"
              >
                <AnimatePresence>
                  {messages.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center h-full"
                    >
                      <p className="text-gray-400">No messages yet. Start the conversation!</p>
                    </motion.div>
                  ) : (
                    messages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className={`p-4 mb-4 rounded-lg border border-white/5 ${
                          msg.userId === user.id
                            ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 ml-8'
                            : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 mr-8'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-white">
                            {msg.username}{' '}
                            <span className="text-xs text-gray-400">({msg.role})</span>
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-white break-words">{msg.message}</p>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
              <div className="flex gap-2 mt-4">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  type="text"
                  placeholder="Type a message"
                  className="flex-1 px-4 py-3 bg-[#1e1129]/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                />
                <motion.button
                  onClick={handleSendMessage}
                  className="px-4 py-3 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send className="h-5 w-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Controls */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="bg-[#13101c] backdrop-blur-sm rounded-xl border border-white/5 p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <span className="bg-gradient-to-r from-pink-500 to-purple-500 h-5 w-1 rounded mr-2"></span>
                Controls
              </h2>
              <div className="flex flex-wrap gap-3">
                <motion.button
                  onClick={handleVoiceToggle}
                  className={`px-4 py-2 rounded-lg bg-gradient-to-r ${
                    isVoiceOn ? 'from-green-600 to-green-800' : 'from-gray-600 to-gray-800'
                  } text-white hover:shadow-lg hover:shadow-green-500/20 transition-all flex items-center`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span
                    className={`w-2 h-2 rounded-full mr-2 ${
                      isVoiceOn ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                    }`}
                  ></span>
                  {isVoiceOn ? 'Leave Voice' : 'Join Voice'}
                </motion.button>
                <motion.button
                  onClick={() => setChatbotOpen(!chatbotOpen)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Bot className="h-5 w-5 mr-2" />
                  AI Assistant
                </motion.button>
                {user.role === 'Moderator' && (
                  <motion.button
                    onClick={handleEndSession}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-800 text-white hover:shadow-lg hover:shadow-red-500/20 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    End Session
                  </motion.button>
                )}
                {user.role === 'Evaluator' && (
                  <motion.button
                    onClick={() => navigate(`/feedback/${id}`)}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Submit Feedback
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Chatbot Panel */}
          <AnimatePresence>
            {chatbotOpen && (
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="bg-[#13101c] backdrop-blur-sm rounded-xl border border-white/5 p-6 shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center">
                      <span className="bg-gradient-to-r from-pink-500 to-purple-500 h-5 w-1 rounded mr-2"></span>
                      Gemini AI Assistant
                    </h3>
                    <motion.button
                      onClick={() => setChatbotOpen(false)}
                      className="p-1 rounded-full bg-gray-500/20 hover:bg-gray-500/40 transition-all"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X className="h-5 w-5 text-gray-300" />
                    </motion.button>
                  </div>
                  <div className="bg-[#1e1129]/50 p-4 rounded-lg max-h-40 overflow-y-auto mb-4 custom-scrollbar">
                    {chatbotResponse ? (
                      <p className="text-white">{chatbotResponse}</p>
                    ) : (
                      <p className="text-gray-400">
                        Ask me anything about group discussions or for help with your session!
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={chatbotQuery}
                      onChange={(e) => setChatbotQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleChatbotSubmit()}
                      placeholder="Ask Gemini..."
                      className="flex-1 px-4 py-2 bg-[#1e1129]/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                      disabled={isLoadingResponse}
                    />
                    <motion.button
                      onClick={handleChatbotSubmit}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={isLoadingResponse || !chatbotQuery.trim()}
                    >
                      {isLoadingResponse ? 'Loading...' : 'Ask'}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Custom styles for scrollbar */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}

export default SessionRoom;