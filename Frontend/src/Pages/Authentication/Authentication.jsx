import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, User, Users, ArrowRight } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AuthComponent() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Participant');
  const [stars, setStars] = useState([]);

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

  // Handle form submission
  async function handleSubmit(event) {
    event.preventDefault();
    const url = isLogin ? 'http://localhost:3000/api/auth/login' : 'http://localhost:3000/api/auth/register';
    const body = isLogin ? { email, password } : { name, email, password, role };
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (data.status === 'ok') {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success(`${isLogin ? 'Login' : 'Registration'} successful!`);
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        toast.error(data.error || 'Please check your credentials');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    }
  }

  return (
    <>
      <style jsx global>{`
        html, body {
          overflow: hidden;
          height: 100%;
          margin: 0;
        }
      `}</style>
      <div className="h-screen bg-gradient-to-br from-[#0f0f1a] via-[#1a1025] to-[#1e0a2e] text-white flex items-center justify-center">
        {/* Stars background */}
        <div className="fixed inset-0 z-0">
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
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>

        {/* Mesh gradient overlays */}
        <div className="fixed inset-0 z-0 bg-gradient-radial from-[#5f0f9980] via-transparent to-transparent opacity-30" />
        <div className="fixed inset-0 z-0 bg-gradient-radial from-[#e91e6380] via-transparent to-transparent opacity-20 translate-x-1/4" />
        <div className="fixed inset-0 z-0 bg-gradient-radial from-[#4a00e080] via-transparent to-transparent opacity-15 translate-y-1/8" />
        <div className="fixed inset-0 z-0 bg-gradient-radial from-[#8e2de280] via-transparent to-transparent opacity-10 -translate-x-1/6 translate-y-1/4" />
        <div className="fixed inset-0 z-0 bg-gradient-radial from-[#ff008080] via-transparent to-transparent opacity-10 translate-x-1/2 -translate-y-1/8" />

        {/* Auth Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-gradient-to-tr from-[#1a0b25] to-[#2a1040] p-1 rounded-3xl w-full max-w-md z-10"
        >
          <div className="bg-[#0f0f1a]/80 backdrop-blur-sm p-8 rounded-3xl border border-purple-500/20 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-pink-600/5 to-purple-600/5" />
            <div className="relative z-10">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400"
              >
                {isLogin ? 'Login to SpeakSpace' : 'Create Your Account'}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-gray-300 text-center mb-8"
              >
                {isLogin ? 'Access your account to start mastering your communication skills.' : 'Join SpeakSpace to enhance your communication skills.'}
              </motion.p>
              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.6 }}
                      className="relative"
                    >
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        type="text"
                        placeholder="Enter your name"
                        required
                        className="w-full pl-12 pr-4 py-3 rounded-full bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:outline-none focus:border-pink-500 transition-all duration-300"
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.8 }}
                      className="relative"
                    >
                      <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-3 rounded-full bg-white/10 backdrop-blur-sm text-gray-400 border border-white/20 focus:outline-none focus:border-pink-500 transition-all duration-300 appearance-none"
                      >
                        <option value="Participant">Participant</option>
                        <option value="Moderator">Moderator</option>
                        <option value="Evaluator">Evaluator</option>
                      </select>
                    </motion.div>
                  </>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: isLogin ? 0.6 : 1.0 }}
                  className="relative"
                >
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="Enter your email"
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-full bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:outline-none focus:border-pink-500 transition-all duration-300"
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: isLogin ? 0.8 : 1.2 }}
                  className="relative"
                >
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="Enter your password"
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-full bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:outline-none focus:border-pink-500 transition-all duration-300"
                  />
                </motion.div>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  className="relative w-full py-3 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium overflow-hidden group"
                >
                  <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-pink-400 to-purple-400 opacity-0 group-hover:opacity-50 transition-opacity duration-500 blur-xl" />
                  <span className="absolute top-0 left-0 w-0 h-full bg-white transition-all duration-300 group-hover:w-full opacity-20" />
                  <span className="relative z-10">{isLogin ? 'Sign In' : 'Sign Up'}</span>
                  <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 to-purple-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                </motion.button>
              </form>
              {isLogin && (
                  <a href="http://localhost:3000/auth/google">
                    <button className="w-full py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full font-medium hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1.04.69-2.36 1.09-3.71 1.09-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.66-2.84z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l2.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Sign in with Google
                    </button>
                  </a>
              )}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: isLogin ? 1.2 : 1.4 }}
                className="mt-6 text-center"
              >
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setName('');
                    setEmail('');
                    setPassword('');
                    setRole('Participant');
                  }}
                  className="text-gray-400 hover:text-pink-300 transition-colors text-sm inline-flex items-center"
                >
                  {isLogin ? 'Need to register? Sign Up' : 'Already have an account? Sign In'}
                  <ArrowRight className="ml-2 h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Floating elements */}
        <motion.div
          className="fixed -right-20 top-1/4 w-64 h-64 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-3xl"
          animate={{
            x: [0, 10, 0],
            y: [0, -10, 0],
            opacity: [0.4, 0.5, 0.4],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: 'reverse',
          }}
        />
        <motion.div
          className="fixed -left-20 bottom-1/4 w-80 h-80 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl"
          animate={{
            x: [0, -10, 0],
            y: [0, 10, 0],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: 'reverse',
          }}
        />

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
    </>
  );
}

export default AuthComponent;