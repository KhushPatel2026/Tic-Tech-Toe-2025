// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, ChevronRight, User, BarChart3, MessageCircle, History, LogOut, Plus } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';

function Dashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [stars, setStars] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

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

  // Fetch sessions
  useEffect(() => {
    async function fetchSessions() {
      try {
        const response = await fetch('http://localhost:3000/api/sessions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setSessions(data);
      } catch (error) {
        toast.error('Failed to load sessions');
      }
    }
    fetchSessions();
  }, [token]);

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
          animate={{
            x: [0, 20, 0],
            y: [0, -20, 0],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
        
        <motion.div
          className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl"
          animate={{
            x: [0, -20, 0],
            y: [0, 20, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
        
        <motion.div
          className="absolute top-2/3 right-1/3 w-72 h-72 rounded-full bg-gradient-to-r from-pink-600/20 to-orange-600/20 blur-3xl"
          animate={{
            x: [0, 15, 0],
            y: [0, 15, 0],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
      </div>

      {/* Header with Glass Effect */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#0f0f1a]/70 border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Mic className="h-6 w-6 text-pink-500" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
              SpeakSpace
            </span>
          </div>
          
          <nav className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="text-gray-300 hover:text-white transition-colors px-3 py-2"
            >
              Home
            </button>
            <motion.button
              onClick={() => localStorage.clear() & navigate('/')}
              className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </motion.button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-20 pb-24">
        <div className="container mx-auto px-4">
          {/* Welcome Banner */}
          <motion.div 
            className="mb-8 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-md border border-white/10 p-6">
              <div className="absolute -right-12 -top-12 w-40 h-40 bg-pink-500/20 rounded-full blur-2xl"></div>
              <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                    Welcome, {user?.role || 'User'}
                  </h1>
                  <p className="text-gray-300 max-w-xl">
                    Manage your sessions, track your progress, and enhance your communication skills
                  </p>
                </div>
                
                {user?.role === 'Moderator' && (
                  <motion.button
                    onClick={() => navigate('/create-session')}
                    className="flex items-center space-x-2 px-5 py-3 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="h-5 w-5" />
                    <span>Create New Session</span>
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
          
          {/* Feature Cards */}
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-xl font-bold text-white mb-4 px-1">Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <motion.div
                className="rounded-xl overflow-hidden bg-gradient-to-br from-[#1a0b25] to-[#2a1040] border border-white/5 hover:border-white/10 shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div 
                  className="h-full cursor-pointer relative overflow-hidden group"
                  onClick={() => navigate('/mock-gd')}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="p-6 relative z-10 h-full flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <MessageCircle className="h-6 w-6 text-blue-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Mock Group Discussion</h3>
                      <p className="text-gray-300 text-sm">
                        Practice group discussions with AI-powered feedback to improve your communication skills.
                      </p>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <span className="text-blue-400 flex items-center text-sm font-medium">
                        Start Now
                        <ChevronRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                className="rounded-xl overflow-hidden bg-gradient-to-br from-[#1a0b25] to-[#2a1040] border border-white/5 hover:border-white/10 shadow-xl hover:shadow-orange-500/10 transition-all duration-300"
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div 
                  className="h-full cursor-pointer relative overflow-hidden group"
                  onClick={() => navigate('/ai-interview')}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="p-6 relative z-10 h-full flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 mb-4 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <User className="h-6 w-6 text-orange-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Mock AI Interview</h3>
                      <p className="text-gray-300 text-sm">
                        Prepare for interviews with AI-driven questions and personalized feedback to boost your confidence.
                      </p>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <span className="text-orange-400 flex items-center text-sm font-medium">
                        Start Now
                        <ChevronRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                className="rounded-xl overflow-hidden bg-gradient-to-br from-[#1a0b25] to-[#2a1040] border border-white/5 hover:border-white/10 shadow-xl hover:shadow-pink-500/10 transition-all duration-300"
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div 
                  className="h-full cursor-pointer relative overflow-hidden group"
                  onClick={() => navigate('/mock-analytics')}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="p-6 relative z-10 h-full flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 mb-4 rounded-full bg-pink-500/20 flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-pink-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Mock Analytics</h3>
                      <p className="text-gray-300 text-sm">
                        Dive into detailed analytics of your mock sessions to track progress and identify areas for improvement.
                      </p>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <span className="text-pink-400 flex items-center text-sm font-medium">
                        View Analytics
                        <ChevronRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
          
          {/* Sessions Container */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sessions List */}
            <motion.div 
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="bg-[#13101c] backdrop-blur-sm rounded-xl border border-white/5 p-6 h-full shadow-xl">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                  <span className="bg-gradient-to-r from-pink-500 to-purple-500 h-5 w-1 rounded mr-2"></span>
                  Your Sessions
                </h2>
                
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  <AnimatePresence>
                    {sessions.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-10"
                      >
                        <div className="w-16 h-16 mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
                          <MessageCircle className="h-6 w-6 text-purple-400" />
                        </div>
                        <p className="text-gray-400 text-center">
                          No sessions available. Create or join a session to get started!
                        </p>
                      </motion.div>
                    ) : (
                      sessions.map((session) => (
                        <motion.div
                          key={session._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.4 }}
                          className="bg-gradient-to-r from-[#1e1129]/50 to-[#261339]/50 rounded-lg border border-white/5 overflow-hidden group hover:border-purple-500/20 transition-all duration-300"
                        >
                          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-1">{session.topic}</h3>
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex h-2 w-2 rounded-full ${
                                  session.status === 'active' ? 'bg-green-500' : 
                                  session.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                                }`}></span>
                                <span className="text-sm text-gray-300">{session.status}</span>
                              </div>
                            </div>
                            
                            <motion.button
                              onClick={() => navigate(`/session/${session._id}`)}
                              className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 text-white text-sm font-medium flex items-center justify-center hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Join Session
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
            
            {/* Quick Access Panel */}
            <motion.div
              className="lg:col-span-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="bg-[#13101c] backdrop-blur-sm rounded-xl border border-white/5 p-6 shadow-xl h-full">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                  <span className="bg-gradient-to-r from-pink-500 to-purple-500 h-5 w-1 rounded mr-2"></span>
                  Quick Access
                </h2>
                
                <div className="space-y-3">
                  <motion.button
                    onClick={() => navigate('/history')}
                    className="w-full flex items-center justify-between p-4 rounded-lg bg-[#1e1129]/50 hover:bg-[#261339]/50 border border-white/5 hover:border-purple-500/20 transition-all duration-300"
                    whileHover={{ x: 5 }}
                  >
                    <div className="flex items-center">
                      <History className="h-5 w-5 text-purple-400 mr-3" />
                      <span className="text-white">Feedback History</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </motion.button>
                  
                  <motion.button
                    onClick={() => navigate('/analytics')}
                    className="w-full flex items-center justify-between p-4 rounded-lg bg-[#1e1129]/50 hover:bg-[#261339]/50 border border-white/5 hover:border-purple-500/20 transition-all duration-300"
                    whileHover={{ x: 5 }}
                  >
                    <div className="flex items-center">
                      <BarChart3 className="h-5 w-5 text-pink-400 mr-3" />
                      <span className="text-white">Analytics</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </motion.button>
                </div>
                
                {/* Stats Summary */}
                <div className="mt-6 pt-6 border-t border-white/5">
                  <h3 className="text-md font-medium text-white mb-4">Activity Summary</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#1e1129]/50 rounded-lg p-4 border border-white/5">
                      <p className="text-xs text-gray-400 mb-1">Sessions</p>
                      <p className="text-2xl font-bold text-white">{sessions.length}</p>
                    </div>
                    <div className="bg-[#1e1129]/50 rounded-lg p-4 border border-white/5">
                      <p className="text-xs text-gray-400 mb-1">Role</p>
                      <p className="text-lg font-bold text-white">{user?.role || 'User'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-white/5 bg-[#0a0a18]/70 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center">
            <div className="flex items-center space-x-2 mb-3">
              <Mic className="h-5 w-5 text-pink-500" />
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
                SpeakSpace
              </span>
            </div>
            <p className="text-gray-400 text-sm text-center">
              © {new Date().getFullYear()} SpeakSpace. Made by team Pixel.
            </p>
          </div>
        </div>
      </footer>

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

export default Dashboard;