// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, ChevronRight } from 'lucide-react';
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
            <button
              onClick={() => navigate('/')}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Home
            </button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
              <button
                onClick={() => localStorage.clear() & navigate('/')}
                className="relative inline-flex items-center justify-center px-8 py-3 overflow-hidden rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium w-full sm:w-auto text-center group"
              >
                <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
                <span className="relative">Logout</span>
                <span className="absolute right-0 w-12 h-32 -mt-12 transition-all duration-1000 transform translate-x-12 bg-white opacity-10 rotate-12 group-hover:-translate-x-40 ease"></span>
              </button>
            </motion.div>
          </nav>
        </div>
      </header>

      {/* Main Dashboard Section */}
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
            <div className="bg-[#0f0f1a]/80 backdrop-blur-sm p-8 rounded-3xl border border-purple-500/20 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-pink-600/5 to-purple-600/5" />
              <div className="relative z-10">
                <motion.h1
                  className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  Welcome to Your Dashboard, {user?.role || 'User'}
                </motion.h1>
                <motion.p
                  className="text-lg text-gray-300 mb-10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  Manage your sessions, track your progress, and enhance your communication skills.
                </motion.p>

                {/*Section to redirect to Mock GD and Mock Interview powered by AI*/}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-10 mb-12">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-tr from-blue-600 to-purple-600 p-8 rounded-3xl shadow-xl cursor-pointer transition-all duration-300"
                    onClick={() => navigate('/mock-gd')}
                  >
                    <h3 className="text-2xl font-bold text-white mb-4">Mock Group Discussion</h3>
                    <p className="text-gray-300 leading-relaxed">
                      Practice group discussions with AI-powered feedback to improve your communication and reasoning skills.
                    </p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-tr from-yellow-600 to-orange-600 p-8 rounded-3xl shadow-xl cursor-pointer transition-all duration-300"
                    onClick={() => navigate('/ai-interview')}
                  >
                    <h3 className="text-2xl font-bold text-white mb-4">Mock AI Interview</h3>
                    <p className="text-gray-300 leading-relaxed">
                      Prepare for interviews with AI-driven questions and personalized feedback to boost your confidence.
                    </p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-tr from-purple-700 to-pink-700 p-8 rounded-3xl shadow-xl cursor-pointer transition-all duration-300"
                    onClick={() => navigate('/mock-analytics')}
                  >
                    <h3 className="text-2xl font-bold text-white mb-4">Mock Analytics</h3>
                    <p className="text-gray-300 leading-relaxed">
                      Dive into detailed analytics of your mock sessions to track progress and identify areas for improvement.
                    </p>
                  </motion.div>
                </div>          

                {/* Create Session Button for Moderators */}
                {user?.role === 'Moderator' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="mb-8"
                  >
                    <motion.div whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                      <button
                        onClick={() => navigate('/create-session')}
                        className="relative inline-flex items-center justify-center px-8 py-3 overflow-hidden rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium w-full sm:w-auto text-center group"
                      >
                        <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
                        <span className="relative">Create New Session</span>
                        <span className="absolute right-0 w-12 h-32 -mt-12 transition-all duration-1000 transform translate-x-12 bg-white opacity-10 rotate-12 group-hover:-translate-x-40 ease"></span>
                      </button>
                    </motion.div>
                  </motion.div>
                )}

                {/* Sessions List */}
                <motion.div
                  className="space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <h2 className="text-2xl font-bold text-white mb-4">Your Sessions</h2>
                  <AnimatePresence>
                    {sessions.length === 0 ? (
                      <motion.p
                        className="text-gray-400 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        No sessions available. Create or join a session to get started!
                      </motion.p>
                    ) : (
                      sessions.map((session) => (
                        <motion.div
                          key={session._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.4 }}
                          whileHover={{ y: -5 }}
                          className="bg-gradient-to-tr from-[#1a0b25] to-[#2a1040] p-1 rounded-2xl group"
                        >
                          <div className="bg-[#0f0f1a]/80 backdrop-blur-sm p-6 rounded-2xl border border-purple-500/20 relative overflow-hidden flex justify-between items-center">
                            <div className="absolute inset-0 bg-gradient-to-tr from-pink-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative z-10">
                              <h3 className="text-xl font-bold text-white mb-2">{session.topic}</h3>
                              <p className="text-gray-300">Status: {session.status}</p>
                            </div>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                              <button
                                onClick={() => navigate(`/session/${session._id}`)}
                                className="relative inline-flex items-center justify-center px-8 py-3 overflow-hidden rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium w-full sm:w-auto text-center group"
                              >
                                <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
                                <span className="relative flex items-center">
                                  Join
                                  <ChevronRight className="ml-2 h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-125" />
                                </span>
                                <span className="absolute right-0 w-12 h-32 -mt-12 transition-all duration-1000 transform translate-x-12 bg-white opacity-10 rotate-12 group-hover:-translate-x-40 ease"></span>
                              </button>
                            </motion.div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  className="mt-8 flex flex-col sm:flex-row gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1 }}
                >
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                    <button
                      onClick={() => navigate('/history')}
                      className="relative inline-flex items-center justify-center px-8 py-3 overflow-hidden rounded-full bg-white/10 backdrop-blur-sm text-white font-medium border border-white/20 w-full sm:w-auto text-center group"
                    >
                      <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-purple-500 rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
                      <span className="relative flex items-center">
                        Feedback History
                        <ChevronRight className="ml-2 h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-125" />
                      </span>
                    </button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                    <button
                      onClick={() => navigate('/analytics')}
                      className="relative inline-flex items-center justify-center px-8 py-3 overflow-hidden rounded-full bg-white/10 backdrop-blur-sm text-white font-medium border border-white/20 w-full sm:w-auto text-center group"
                    >
                      <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-purple-500 rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
                      <span className="relative flex items-center">
                        Analytics
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

export default Dashboard;