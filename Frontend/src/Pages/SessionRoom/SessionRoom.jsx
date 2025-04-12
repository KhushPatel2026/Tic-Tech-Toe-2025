// src/pages/SessionRoom.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import io from 'socket.io-client';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, ChevronRight } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';

const socket = io('http://localhost:3000', {
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  transports: ['websocket', 'polling'],
});

function SessionRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isVoiceOn, setIsVoiceOn] = useState(false);
  const [session, setSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [stars, setStars] = useState([]);
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const clientRef = useRef(null);
  const audioTrackRef = useRef(null);
  const joinedRoomRef = useRef(false);
  const socketConnectedRef = useRef(false);
  const attemptedJoinRef = useRef(false);
  const voiceTokenRef = useRef(null);
  const chatContainerRef = useRef(null);
  const lastMessageRef = useRef(null);

  // Generate stars for background
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
            const participant = session.participants?.find(
              (p) => p._id === speaker.uid || p._id == speaker.uid
            );
            if (participant) {
              speakerName = participant.name || `Participant ${speaker.uid}`;
            } else {
              const evaluator = session.evaluators?.find(
                (e) => e._id === speaker.uid || e._id == speaker.uid
              );
              if (evaluator) {
                speakerName = evaluator.name || `Evaluator ${speaker.uid}`;
              } else if (
                session.moderatorId === speaker.uid ||
                session.moderatorId == speaker.uid
              ) {
                speakerName = session.moderatorName || 'Moderator';
              } else {
                speakerName = `User ${speaker.uid}`;
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
          setMessages(Array.isArray(chatData) ? chatData : []);
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

  const joinRoom = useCallback(() => {
    if (!joinedRoomRef.current && !attemptedJoinRef.current) {
      console.log('Joining room', id);
      attemptedJoinRef.current = true;
      socket.emit('join-room', {
        sessionId: id,
        userId: user.id,
        role: user.role || 'Guest',
      });
      joinedRoomRef.current = true;
    }
  }, [id, user.id, user.role]);

  const joinVoiceChannel = useCallback(async (token, channel, uid) => {
    try {
      if (!clientRef.current) throw new Error('Agora client not initialized');

      console.log('Joining Agora with params:', {
        appId: import.meta.env.VITE_AGORA_APP_ID,
        channel,
        token,
        uid,
      });

      const numericUid =
        typeof uid === 'number' ? uid : parseInt(uid, 10) || Math.floor(Math.random() * 999000) + 1000;

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
  }, []);

  const leaveVoiceRoom = useCallback(async () => {
    if (!isVoiceOn) return;

    console.log('Leaving voice room');
    try {
      socket.emit('leave-voice-room', {
        sessionId: id,
        userId: user.id,
      });

      if (audioTrackRef.current) {
        try {
          if (clientRef.current) {
            await clientRef.current.unpublish(audioTrackRef.current);
          }
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

  const handleSendMessage = useCallback(() => {
    if (!message.trim()) return;

    console.log('Sending message:', message);
    socket.emit('send-message', {
      sessionId: id,
      userId: user.id,
      username: user.name || 'Guest',
      role: user.role || 'Guest',
      message,
    });

    setMessage('');
  }, [id, message, user.id, user.name, user.role]);

  const handleVoiceToggle = useCallback(async () => {
    try {
      if (isVoiceOn) {
        await leaveVoiceRoom();
      } else {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());

          socket.emit('join-voice-room', {
            sessionId: id,
            userId: user.id,
          });
        } catch (permError) {
          console.error('Microphone permission error:', permError);
          toast.error('Microphone access denied. Please allow microphone access in your browser settings.');
        }
      }
    } catch (error) {
      console.error('Today is April 12, 2025. The error is: ', error);
      toast.error('Failed to toggle voice: ' + error.message);
    }
  }, [id, isVoiceOn, leaveVoiceRoom, user.id]);

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

  const handleLeaveRoom = useCallback(async () => {
    if (isVoiceOn) {
      await leaveVoiceRoom();
    }

    socket.emit('leave-room', { sessionId: id });
    navigate('/dashboard');
  }, [id, isVoiceOn, leaveVoiceRoom, navigate]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    initAgora();
    return () => {
      leaveVoiceRoom();
    };
  }, [initAgora, leaveVoiceRoom]);

  useEffect(() => {
    fetchSessionAndChat();
  }, [fetchSessionAndChat]);

  useEffect(() => {
    if (timeLeft === null) return;

    if (timeLeft <= 0 && session?.status === 'active') {
      handleEndSession();
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, session, handleEndSession]);

  useEffect(() => {
    function handleConnect() {
      console.log('Socket connected:', socket.id);
      socketConnectedRef.current = true;

      if (session && !joinedRoomRef.current) {
        joinRoom();
      }
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
        return exists ? prev : [...prev, { ...msg }];
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

  const formatTime = (seconds) =>
    `${Math.floor(seconds / 60)}:${seconds % 60 < 10 ? '0' : ''}${seconds % 60}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] via-[#1a1025] to-[#1e0a2e] text-white overflow-hidden">
      {/* Stars background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
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
      </div>

      {/* Mesh gradient overlays */}
      <div className="fixed inset-0 z-0 bg-gradient-radial from-[#5f0f9980] via-transparent to-transparent opacity-50" />
      <div className="fixed inset-0 z-0 bg-gradient-radial from-[#e91e6380] via-transparent to-transparent opacity-50 translate-x-1/2" />
      <div className="fixed inset-0 z-0 bg-gradient-radial from-[#4a00e080] via-transparent to-transparent opacity-40 translate-y-1/4" />
      <div className="fixed inset-0 z-0 bg-gradient-radial from-[#8e2de280] via-transparent to-transparent opacity-60 -translate-x-1/3 translate-y-1/2" />
      <div className="fixed inset-0 z-0 bg-gradient-radial from-[#ff008080] via-transparent to-transparent opacity-60 translate-x-3/4 -translate-y-1/4" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-[#0f0f1a] to-transparent">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Mic className="h-8 w-8 text-pink-500" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
              SpeakSpace
            </span>
          </div>
          <nav className="flex items-center space-x-8">
            {/* <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
              <button
                onClick={handleLeaveRoom}
                className="relative inline-flex items-center justify-center px-8 py-3 overflow-hidden rounded-full bg-white/10 backdrop-blur-sm text-white font-medium border border-white/20 w-full sm:w-auto text-center group"
              >
                <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-purple-500 rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
                <span className="relative flex items-center">
                  Leave Session
                  <ChevronRight className="ml-2 h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-125" />
                </span>
              </button>
            </motion.div> */}
          </nav>
        </div>
      </header>

      {/* Main Section */}
      <motion.section
        className="relative min-h-screen flex items-center justify-center pt-20 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="container mx-auto z-10">
          <motion.div
            className="max-w-4xl mx-auto bg-gradient-to-tr from-[#1a0b25] to-[#2a1040] p-1 rounded-3xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-[#0f0f1a]/80 backdrop-blur-sm p-4 md:p-6 rounded-3xl border border-purple-500/20 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-pink-600/5 to-purple-600/5" />
              <div className="relative z-10">
                <motion.h1
                  className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  {session?.topic || 'Loading Session...'}
                </motion.h1>

                {/* Active Speaker */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  {activeSpeaker ? (
                    <div className="w-full mb-4 flex items-center justify-center bg-green-800/40 py-3 px-5 rounded-lg border border-green-600/30">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                      <span className="text-green-400 font-medium text-lg">
                        Currently Speaking: {activeSpeaker}
                      </span>
                    </div>
                  ) : (
                    <div className="w-full mb-4 flex items-center justify-center bg-gray-800/40 py-3 px-5 rounded-lg border border-gray-600/30">
                      <span className="text-gray-400 font-medium">No one speaking</span>
                    </div>
                  )}
                </motion.div>

                {/* Time Left */}
                <motion.div
                  className="flex justify-between items-center mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <div className="text-white">
                    {timeLeft !== null && `Time Left: ${formatTime(timeLeft)}`}
                  </div>
                </motion.div>

                {/* Chat Area */}
                <motion.div
                  ref={chatContainerRef}
                  className="h-80 overflow-y-auto bg-white/10 backdrop-blur-sm p-4 rounded-lg mb-4 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-transparent"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  {messages.length === 0 ? (
                    <p className="text-gray-400">No messages yet. Start the conversation!</p>
                  ) : (
                    messages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        className={`p-2 mb-2 rounded-lg ${
                          msg.userId === user.id ? 'bg-blue-900/30 ml-8' : 'bg-gray-700/30 mr-8'
                        }`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-gray-300">
                            {msg.username}{' '}
                            <span className="text-xs text-gray-400">({msg.role})</span>
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-white break-words">{msg.message}</p>
                        {idx === messages.length - 1 && <div ref={lastMessageRef}></div>}
                      </motion.div>
                    ))
                  )}
                </motion.div>

                {/* Message Input */}
                <motion.div
                  className="flex gap-2 mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    type="text"
                    placeholder="Type a message"
                    className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 transition-all duration-300"
                  />
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <button
                      onClick={handleSendMessage}
                      className="relative inline-flex items-center justify-center px-8 py-3 overflow-hidden rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium text-center group"
                    >
                      <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
                      <span className="relative">Send</span>
                      <span className="absolute right-0 w-12 h-32 -mt-12 transition-all duration-1000 transform translate-x-12 bg-white opacity-10 rotate-12 group-hover:-translate-x-40 ease"></span>
                    </button>
                  </motion.div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  className="flex flex-wrap gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                >
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <button
                      onClick={handleVoiceToggle}
                      className={`relative inline-flex items-center justify-center px-8 py-3 overflow-hidden rounded-full ${
                        isVoiceOn
                          ? 'bg-gradient-to-r from-green-600 to-green-800'
                          : 'bg-gradient-to-r from-pink-600 to-purple-600'
                      } text-white font-medium text-center group`}
                    >
                      <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
                      <span className="relative flex items-center">
                        <span
                          className={`w-2 h-2 rounded-full mr-2 ${
                            isVoiceOn ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                          }`}
                        ></span>
                        {isVoiceOn ? 'Leave Voice' : 'Join Voice'}
                      </span>
                      <span className="absolute right-0 w-12 h-32 -mt-12 transition-all duration-1000 transform translate-x-12 bg-white opacity-10 rotate-12 group-hover:-translate-x-40 ease"></span>
                    </button>
                  </motion.div>

                  {user.role === 'Moderator' && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <button
                        onClick={handleEndSession}
                        className="relative inline-flex items-center justify-center px-8 py-3 overflow-hidden rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium text-center group"
                      >
                        <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
                        <span className="relative">End Session</span>
                        <span className="absolute right-0 w-12 h-32 -mt-12 transition-all duration-1000 transform translate-x-12 bg-white opacity-10 rotate-12 group-hover:-translate-x-40 ease"></span>
                      </button>
                    </motion.div>
                  )}

                  {user.role === 'Evaluator' && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <button
                        onClick={() => navigate(`/feedback/${id}`)}
                        className="relative inline-flex items-center justify-center px-8 py-3 overflow-hidden rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium text-center group"
                      >
                        <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
                        <span className="relative">Submit Feedback</span>
                        <span className="absolute right-0 w-12 h-32 -mt-12 transition-all duration-1000 transform translate-x-12 bg-white opacity-10 rotate-12 group-hover:-translate-x-40 ease"></span>
                      </button>
                    </motion.div>
                  )}

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <button
                      onClick={handleLeaveRoom}
                      className="relative inline-flex items-center justify-center px-8 py-3 overflow-hidden rounded-full bg-white/10 backdrop-blur-sm text-white font-medium border border-white/20 text-center group"
                    >
                      <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-purple-500 rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
                      <span className="relative flex items-center">
                        Leave
                        <ChevronRight className="ml-2 h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-125" />
                      </span>
                    </button>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Floating elements */}
        <motion.div
          className="absolute -right-20 top-1/4 w-64 h-64 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-3xl z-10"
          animate={{
            x: [0, 20, 0],
            y: [0, -20, 0],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: 'reverse',
          }}
        />
        <motion.div
          className="absolute -left-20 bottom-1/4 w-80 h-80 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl z-10"
          animate={{
            x: [0, -20, 0],
            y: [0, 20, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: 'reverse',
          }}
        />
      </motion.section>

      {/* Footer */}
      <footer className="relative py-12 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center">
            <div className="flex items-center space-x-2 mb-4">
              <Mic className="h-8 w-8 text-pink-500" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
                SpeakSpace
              </span>
            </div>
            <p className="text-gray-400 text-sm text-center">
              © {new Date().getFullYear()} SpeakSpace. Made with ❤️ by team Pixel.
            </p>
          </div>
        </div>
      </footer>

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