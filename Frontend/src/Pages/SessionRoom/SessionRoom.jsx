import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import io from 'socket.io-client';
import AgoraRTC from 'agora-rtc-sdk-ng';

const socket = io('http://localhost:3000', { withCredentials: true });

function SessionRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isVoiceOn, setIsVoiceOn] = useState(false);
  const [session, setSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));
  const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

  useEffect(() => {
    async function fetchSessionAndChat() {
      try {
        const response = await fetch(`http://localhost:3000/api/sessions/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        const data = await response.json();
        if (response.ok) {
          setSession(data);
          const startTime = new Date(data.startTime).getTime();
          const durationMs = data.duration * 60 * 1000;
          const endTime = startTime + durationMs;
          const now = Date.now();
          setTimeLeft(endTime > now ? Math.floor((endTime - now) / 1000) : 0);

          // Fetch chat history
          const chatResponse = await fetch(`http://localhost:3000/api/sessions/${id}/chat`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
          const chatData = await chatResponse.json();
          if (chatResponse.ok) {
            setMessages(chatData);
          } else {
            toast.error(chatData.error || 'Failed to load chat history');
          }
        } else {
          toast.error(data.error || 'Session not found');
          navigate('/dashboard');
        }
      } catch (error) {
        toast.error('Failed to load session or chat');
        navigate('/dashboard');
      }
    }
    fetchSessionAndChat();
  }, [id, navigate]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0 && session?.status === 'active') handleEndSession();
    const timer = setInterval(() => setTimeLeft(prev => prev > 0 ? prev - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, session]);

  useEffect(() => {
    socket.emit('join-room', { sessionId: id, userId: user.id, role: user.role });
    socket.on('new-message', (msg) => setMessages(prev => [...prev, msg]));
    socket.on('ai-message', (msg) => setMessages(prev => [...prev, msg]));
    socket.on('user-joined', ({ userId }) => toast.info(`User ${userId} joined`));
    socket.on('user-removed', ({ userId }) => toast.warn(`User ${userId} removed`));
    socket.on('error', (err) => toast.error(err) & navigate('/dashboard'));
    socket.on('end-session', () => toast.info('Session ended by evaluator') & handleEndSession());
    socket.on('voice-token', async ({ token, channel }) => {
      await client.join(import.meta.env.VITE_AGORA_APP_ID, channel, token, user.id);
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({ encoderConfig: 'speech_standard' });
      await client.publish(audioTrack);
      setIsVoiceOn(true);
      client.on('user-published', async (remoteUser, mediaType) => {
        if (mediaType === 'audio') await client.subscribe(remoteUser, mediaType);
      });
      client.on('volume-indicator', (volumes) => {
        const speaker = volumes.find(v => v.level > 10);
        setActiveSpeaker(speaker ? session?.participants.find(p => p._id === speaker.uid)?.name || session?.evaluators.find(e => e._id === speaker.uid)?.name || 'Unknown' : null);
      });
    });
    return () => { socket.off(); client.off('user-published'); client.off('volume-indicator'); };
  }, [id, navigate, session]);

  async function handleSendMessage() {
    if (!message) return;
    socket.emit('send-message', { sessionId: id, userId: user.id, username: user.name, role: user.role, message });
    setMessage('');
  }

  async function handleVoiceToggle() {
    if (isVoiceOn) {
      socket.emit('leave-voice-room', { sessionId: id, userId: user.id });
      await client.leave();
      setIsVoiceOn(false);
      setActiveSpeaker(null);
    } else {
      socket.emit('join-voice-room', { sessionId: id, userId: user.id });
    }
  }

  async function handleEndSession() {
    try {
      await fetch(`http://localhost:3000/api/sessions/${id}/end`, { method: 'PATCH', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      socket.emit('end-session', { sessionId: id });
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      toast.error('Failed to end session');
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8">
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6">
        <h1 className="text-3xl font-bold text-white mb-6 bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent">Session Room - {session?.topic}</h1>
        {timeLeft !== null && <p className="text-white mb-4">Time Left: {formatTime(timeLeft)}</p>}
        {activeSpeaker && <p className="text-green-400 mb-4">Speaking: {activeSpeaker}</p>}
        <div className="h-64 overflow-y-auto bg-gray-800/50 p-4 rounded-lg mb-4">
          {messages.map((msg, idx) => (
            <div key={idx} className="text-white mb-2">{`${msg.username} (${msg.role}): ${msg.message} - ${new Date(msg.timestamp).toLocaleTimeString()}`}</div>
          ))}
        </div>
        <div className="flex gap-2 mb-4">
          <input value={message} onChange={(e) => setMessage(e.target.value)} type="text" placeholder="Type a message" className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300" />
          <button onClick={handleSendMessage} className="py-2 px-4 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-semibold hover:from-gray-600 hover:to-gray-800 transition-all duration-300">Send</button>
        </div>
        <div className="flex gap-4">
          <button onClick={handleVoiceToggle} className="py-2 px-4 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-semibold hover:from-gray-600 hover:to-gray-800 transition-all duration-300">{isVoiceOn ? 'Leave Voice' : 'Join Voice'}</button>
          {user.role === 'Moderator' && <button onClick={handleEndSession} className="py-2 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all duration-300">End Session</button>}
          {user.role === 'Evaluator' && <button onClick={() => navigate(`/feedback/${id}`)} className="py-2 px-4 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-semibold hover:from-gray-600 hover:to-gray-800 transition-all duration-300">Submit Feedback</button>}
          <button onClick={() => socket.emit('leave-room', { sessionId: id }) & navigate('/dashboard')} className="py-2 px-4 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all duration-300">Leave</button>
        </div>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark" />
      </div>
    </div>
  );
}

export default SessionRoom;