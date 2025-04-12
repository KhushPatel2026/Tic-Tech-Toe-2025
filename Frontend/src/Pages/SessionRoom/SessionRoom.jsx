import {useState, useEffect, useRef, useCallback} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {ToastContainer, toast} from 'react-toastify';
import io from 'socket.io-client';
import AgoraRTC from 'agora-rtc-sdk-ng';
import 'react-toastify/dist/ReactToastify.css';

const socket = io('http://localhost:3000', {withCredentials: true, reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 1000, reconnectionDelayMax: 5000, transports: ['websocket', 'polling']});

function SessionRoom() {
  const {id} = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isVoiceOn, setIsVoiceOn] = useState(false);
  const [session, setSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const clientRef = useRef(null);
  const audioTrackRef = useRef(null);
  const joinedRoomRef = useRef(false);
  const socketConnectedRef = useRef(false);
  const attemptedJoinRef = useRef(false);
  const voiceTokenRef = useRef(null);
  const chatContainerRef = useRef(null);
  const lastMessageRef = useRef(null);

  const initAgora = useCallback(async() => {
    try {
      if(!clientRef.current) {
        clientRef.current = AgoraRTC.createClient({mode: 'rtc', codec: 'vp8'});
        clientRef.current.enableAudioVolumeIndicator();
        
        clientRef.current.on('user-published', async(user, mediaType) => {
          if(mediaType === 'audio') {
            try {
              await clientRef.current.subscribe(user, mediaType);
              console.log('Subscribed to user:', user.uid);
              if(user.audioTrack) {
                user.audioTrack.setVolume(100);
                user.audioTrack.play();
                console.log('Playing audio for user:', user.uid);
              } else {
                console.warn('No audio track available for user:', user.uid);
              }
            } catch(err) {
              console.error('Subscribe/play error:', err);
              toast.error('Failed to play audio: ' + err.message);
            }
          }
        });
        
        clientRef.current.on('user-unpublished', user => {
          console.log('User unpublished:', user.uid);
        });
        
        clientRef.current.on('volume-indicator', volumes => {
          const speaker = volumes.find(v => v.level > 10);
          if(speaker && session) {
            let speakerName = null;
            const participant = session.participants?.find(p => p._id === speaker.uid || p._id == speaker.uid);
            if(participant) {
              speakerName = participant.name || `Participant ${speaker.uid}`;
            } else {
              const evaluator = session.evaluators?.find(e => e._id === speaker.uid || e._id == speaker.uid);
              if(evaluator) {
                speakerName = evaluator.name || `Evaluator ${speaker.uid}`;
              } else if(session.moderatorId === speaker.uid || session.moderatorId == speaker.uid) {
                speakerName = session.moderatorName || "Moderator";
              } else {
                speakerName = `User ${speaker.uid}`;
              }
            }
            setActiveSpeaker(speakerName);
          } else {
            setActiveSpeaker(null);
          }
        });
        
        clientRef.current.on('connection-state-change', state => {
          console.log('Agora connection state:', state);
        });
        
        clientRef.current.on('exception', event => {
          console.error('Agora exception:', event);
        });
      }
    } catch(err) {
      console.error('Agora init error:', err);
      toast.error('Failed to initialize audio: ' + err.message);
    }
  }, [session]);

  const fetchSessionAndChat = useCallback(async() => {
    try {
      const token = localStorage.getItem('token');
      if(!token) {
        toast.error('Authentication required');
        navigate('/login');
        return;
      }
      
      const response = await fetch(`http://localhost:3000/api/sessions/${id}`, {
        headers: {Authorization: `Bearer ${token}`}
      });
      
      const data = await response.json();
      
      if(response.ok) {
        setSession(data);
        
        const startTime = new Date(data.startTime).getTime();
        const durationMs = data.duration * 60 * 1000;
        const endTime = startTime + durationMs;
        const now = Date.now();
        setTimeLeft(endTime > now ? Math.floor((endTime - now) / 1000) : 0);
        
        const chatResponse = await fetch(`http://localhost:3000/api/sessions/${id}/chat`, {
          headers: {Authorization: `Bearer ${token}`}
        });
        
        const chatData = await chatResponse.json();
        
        if(chatResponse.ok) {
          setMessages(Array.isArray(chatData) ? chatData : []);
        } else {
          console.error('Chat fetch error:', chatData);
          toast.error('Failed to load chat history');
        }
        
        if(socketConnectedRef.current && !joinedRoomRef.current) {
          joinRoom();
        }
      } else {
        console.error('Session fetch error:', data);
        toast.error(data.error || 'Session not found');
        navigate('/dashboard');
      }
    } catch(error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load session');
      navigate('/dashboard');
    }
  }, [id, navigate]);

  const joinRoom = useCallback(() => {
    if(!joinedRoomRef.current && !attemptedJoinRef.current) {
      console.log('Joining room', id);
      attemptedJoinRef.current = true;
      socket.emit('join-room', {
        sessionId: id,
        userId: user.id,
        role: user.role || 'Guest'
      });
      joinedRoomRef.current = true;
    }
  }, [id, user.id, user.role]);

  const joinVoiceChannel = useCallback(async(token, channel, uid) => {
    try {
      if(!clientRef.current) throw new Error('Agora client not initialized');
      
      console.log('Joining Agora with params:', {
        appId: import.meta.env.VITE_AGORA_APP_ID,
        channel,
        token,
        uid
      });
      
      const numericUid = typeof uid === 'number' ? uid : (parseInt(uid, 10) || Math.floor(Math.random() * 999000) + 1000);
      
      await clientRef.current.join(
        import.meta.env.VITE_AGORA_APP_ID,
        channel,
        token,
        numericUid
      );
      
      console.log('Joined Agora channel:', channel, 'as uid:', numericUid);
      
      if(!audioTrackRef.current) {
        audioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack({
          encoderConfig: 'speech_standard',
          AEC: true,
          ANS: true
        });
        console.log('Audio track created');
      }
      
      await clientRef.current.publish(audioTrackRef.current);
      console.log('Audio track published');
      setIsVoiceOn(true);
    } catch(error) {
      console.error('Voice join error:', error);
      toast.error('Failed to join voice: ' + error.message);
      setIsVoiceOn(false);
    }
  }, []);

  const leaveVoiceRoom = useCallback(async() => {
    if(!isVoiceOn) return;
    
    console.log('Leaving voice room');
    try {
      socket.emit('leave-voice-room', {
        sessionId: id,
        userId: user.id
      });
      
      if(audioTrackRef.current) {
        try {
          if(clientRef.current) {
            await clientRef.current.unpublish(audioTrackRef.current);
          }
          audioTrackRef.current.close();
          audioTrackRef.current = null;
        } catch(err) {
          console.error('Error unpublishing audio track:', err);
        }
      }
      
      if(clientRef.current) {
        try {
          await clientRef.current.leave();
        } catch(err) {
          console.error('Error leaving Agora channel:', err);
        }
      }
      
      setIsVoiceOn(false);
      setActiveSpeaker(null);
    } catch(error) {
      console.error('Error leaving voice room:', error);
    }
  }, [id, isVoiceOn, user.id]);

  const handleSendMessage = useCallback(() => {
    if(!message.trim()) return;
    
    console.log('Sending message:', message);
    socket.emit('send-message', {
      sessionId: id,
      userId: user.id,
      username: user.name || 'Guest',
      role: user.role || 'Guest',
      message
    });
    
    setMessage('');
  }, [id, message, user.id, user.name, user.role]);

  const handleVoiceToggle = useCallback(async() => {
    try {
      if(isVoiceOn) {
        await leaveVoiceRoom();
      } else {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({audio: true});
          stream.getTracks().forEach(track => track.stop());
          
          socket.emit('join-voice-room', {
            sessionId: id,
            userId: user.id
          });
        } catch(permError) {
          console.error('Microphone permission error:', permError);
          toast.error('Microphone access denied. Please allow microphone access in your browser settings.');
        }
      }
    } catch(error) {
      console.error('Voice toggle error:', error);
      toast.error('Failed to toggle voice: ' + error.message);
    }
  }, [id, isVoiceOn, leaveVoiceRoom, user.id]);

  const handleEndSession = useCallback(async() => {
    try {
      console.log('Ending session');
      
      const response = await fetch(`http://localhost:3000/api/sessions/${id}/end`, {
        method: 'PATCH',
        headers: {Authorization: `Bearer ${localStorage.getItem('token')}`}
      });
      
      if(!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to end session');
      }
      
      socket.emit('end-session', {sessionId: id});
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch(error) {
      console.error('End session error:', error);
      toast.error(error.message || 'Failed to end session');
    }
  }, [id, navigate]);

  const handleLeaveRoom = useCallback(async() => {
    if(isVoiceOn) {
      await leaveVoiceRoom();
    }
    
    socket.emit('leave-room', {sessionId: id});
    navigate('/dashboard');
  }, [id, isVoiceOn, leaveVoiceRoom, navigate]);

  useEffect(() => {
    if(chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    initAgora();
    return() => {
      leaveVoiceRoom();
    };
  }, [initAgora, leaveVoiceRoom]);

  useEffect(() => {
    fetchSessionAndChat();
  }, [fetchSessionAndChat]);

  useEffect(() => {
    if(timeLeft === null) return;
    
    if(timeLeft <= 0 && session?.status === 'active') {
      handleEndSession();
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    
    return() => clearInterval(timer);
  }, [timeLeft, session, handleEndSession]);

  useEffect(() => {
    function handleConnect() {
      console.log('Socket connected:', socket.id);
      socketConnectedRef.current = true;
      
      if(session && !joinedRoomRef.current) {
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
      setMessages(prev => {
        const exists = prev.some(m =>
          m.userId === msg.userId &&
          m.message === msg.message &&
          new Date(m.timestamp).getTime() === new Date(msg.timestamp).getTime()
        );
        return exists ? prev : [...prev, {...msg}];
      });
    }
    
    function handleAiMessage(msg) {
      console.log('AI message:', msg);
      setMessages(prev => [...prev, {...msg}]);
    }
    
    function handleUserJoined({userId}) {
      toast.info(`User ${userId} joined`);
    }
    
    function handleUserRemoved({userId}) {
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
    
    if(socket.connected && !joinedRoomRef.current) {
      socketConnectedRef.current = true;
      joinRoom();
    }
    
    return() => {
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

  const formatTime = seconds => `${Math.floor(seconds / 60)}:${seconds % 60 < 10 ? '0' : ''}${seconds % 60}`;

  return(
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6 bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent">{session?.topic || 'Loading Session...'}</h1>
        
        {activeSpeaker ? (
          <div className="w-full mb-4 flex items-center justify-center bg-green-800/40 py-3 px-5 rounded-lg border border-green-600/30">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-green-400 font-medium text-lg">Currently Speaking: {activeSpeaker}</span>
          </div>
        ) : (
          <div className="w-full mb-4 flex items-center justify-center bg-gray-800/40 py-3 px-5 rounded-lg border border-gray-600/30">
            <span className="text-gray-400 font-medium">No one speaking</span>
          </div>
        )}
        
        <div className="flex justify-between items-center mb-4">
          <div className="text-white">{timeLeft !== null && `Time Left: ${formatTime(timeLeft)}`}</div>
        </div>
        
        <div ref={chatContainerRef} className="h-80 overflow-y-auto bg-gray-800/50 p-4 rounded-lg mb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          {messages.length === 0 ? (
            <p className="text-gray-400">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`p-2 mb-2 rounded-lg ${msg.userId === user.id ? 'bg-blue-900/30 ml-8' : 'bg-gray-700/30 mr-8'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-300">{msg.username} <span className="text-xs text-gray-400">({msg.role})</span></span>
                  <span className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-white break-words">{msg.message}</p>
                {idx === messages.length - 1 && <div ref={lastMessageRef}></div>}
              </div>
            ))
          )}
        </div>
        
        <div className="flex gap-2 mb-4">
          <input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} type="text" placeholder="Type a message" className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300" />
          <button onClick={handleSendMessage} className="py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg font-semibold hover:from-blue-500 hover:to-blue-700 transition-all duration-300">Send</button>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button onClick={handleVoiceToggle} className={`py-2 px-4 bg-gradient-to-r ${isVoiceOn ? 'from-green-600 to-green-800' : 'from-gray-600 to-gray-800'} text-white rounded-lg font-semibold hover:opacity-90 transition-all duration-300 flex items-center`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${isVoiceOn ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></span>
            {isVoiceOn ? 'Leave Voice' : 'Join Voice'}
          </button>
          
          {user.role === 'Moderator' && (
            <button onClick={handleEndSession} className="py-2 px-4 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg font-semibold hover:from-red-500 hover:to-red-700 transition-all duration-300">End Session</button>
          )}
          
          {user.role === 'Evaluator' && (
            <button onClick={() => navigate(`/feedback/${id}`)} className="py-2 px-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg font-semibold hover:from-purple-500 hover:to-purple-700 transition-all duration-300">Submit Feedback</button>
          )}
          
          <button onClick={handleLeaveRoom} className="py-2 px-4 bg-gradient-to-r from-gray-600 to-gray-800 text-white rounded-lg font-semibold hover:from-gray-500 hover:to-gray-700 transition-all duration-300">Leave</button>
        </div>
        
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark" />
      </div>
    </div>
  );
}

export default SessionRoom;