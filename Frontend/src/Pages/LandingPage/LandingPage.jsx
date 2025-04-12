// src/pages/Home.jsx
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Mic, Sparkles, Users, BookOpen, ChevronRight, Star, ArrowRight, Menu, X } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stars, setStars] = useState([]);
  const token = localStorage.getItem('token');
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const testimonialsRef = useRef(null);

  // Parallax effects
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);

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

  // Handle CTA button click
  const handleCTAClick = () => {
    navigate(token ? '/dashboard' : '/login');
  };

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
          <Link to="/" className="flex items-center space-x-2">
            <Mic className="h-8 w-8 text-pink-500" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
              SpeakSpace
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="#features" className="text-gray-300 hover:text-white transition-colors">
              Features
            </Link>
            <Link to="#how-it-works" className="text-gray-300 hover:text-white transition-colors">
              How it works
            </Link>
            <Link to="#contact" className="text-gray-300 hover:text-white transition-colors">
              Contact
            </Link>
            <button
              onClick={handleCTAClick}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-medium transition-all duration-300 hover:shadow-[0_0_15px_rgba(236,72,153,0.5)] transform hover:scale-105"
            >
              {token ? 'Dashboard' : 'Join Now'}
            </button>
          </nav>

          {/* Mobile menu button */}
          <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#0f0f1a]/95 backdrop-blur-md"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
                <Link
                  to="#features"
                  className="text-gray-300 hover:text-white transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Features
                </Link>
                <Link
                  to="#testimonials"
                  className="text-gray-300 hover:text-white transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Testimonials
                </Link>
                <Link
                  to="#contact"
                  className="text-gray-300 hover:text-white transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </Link>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleCTAClick();
                  }}
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium text-center"
                >
                  {token ? 'Dashboard' : 'Join Now'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden"
        style={{ y: heroY, opacity: heroOpacity }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="container mx-auto px-4 z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-block px-4 py-1 mb-6 rounded-full bg-gradient-to-r from-pink-600/20 to-purple-600/20 border border-pink-500/30"
            >
              <span className="text-sm font-medium text-pink-400">GD & Interview Skill Builder</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-none"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                Master Your Communication
              </span>
              <br />
              <span className="text-white">Ace Every Interview</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto"
            >
              Practical, AI-powered training that helps you build confidence, improve your speaking skills, and stand
              out in group discussions and interviews.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                <button
                  onClick={handleCTAClick}
                  className="relative inline-flex items-center justify-center px-8 py-3 overflow-hidden rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium w-full sm:w-auto text-center group"
                >
                  <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
                  <span className="relative">{token ? 'Go to Dashboard' : 'Start Learning Now'}</span>
                  <span className="absolute right-0 w-12 h-32 -mt-12 transition-all duration-1000 transform translate-x-12 bg-white opacity-10 rotate-12 group-hover:-translate-x-40 ease"></span>
                </button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                <Link
                  to="#features"
                  className="relative inline-flex items-center justify-center px-8 py-3 overflow-hidden rounded-full bg-white/10 backdrop-blur-sm text-white font-medium border border-white/20 w-full sm:w-auto text-center group"
                >
                  <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-purple-500 rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
                  <span className="relative flex items-center">
                    Explore Features
                    <ChevronRight className="ml-2 h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-125" />
                  </span>
                </Link>
              </motion.div>
            </motion.div>

            {/* <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
              className="mt-12 text-sm text-gray-400 flex items-center justify-center"
            >
              <Star className="h-4 w-4 text-yellow-500 mr-2" />
              Trusted by 10,000+ students and job seekers
            </motion.div> */}
          </div>
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

      {/* Features Section */}
      <section id="features" ref={featuresRef} className="relative py-20 md:py-32">
        <div className="container mx-auto px-4 z-10 relative">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-5xl font-bold mb-6"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                Features
              </span>{' '}
              that set you apart
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-gray-300 max-w-2xl mx-auto"
            >
              Our platform offers everything you need to develop exceptional communication skills and ace your next
              group discussion or interview.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="bg-gradient-to-tr from-[#1a0b25] to-[#2a1040] p-1 rounded-2xl group"
            >
              <div className="bg-[#0f0f1a]/80 backdrop-blur-sm p-6 rounded-2xl h-full border border-purple-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-pink-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="p-3 bg-gradient-to-tr from-pink-600/20 to-purple-600/20 rounded-xl inline-block mb-4 relative z-10">
                  <Mic className="h-6 w-6 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white relative z-10">AI Speech Analysis</h3>
                <p className="text-gray-300 mb-4 relative z-10">
                  Get real-time feedback on your speaking patterns, filler words, and pacing to improve your verbal
                  communication.
                </p>
                <Link
                  to="#"
                  className="text-pink-400 inline-flex items-center relative z-10 group-hover:text-pink-300 transition-colors"
                >
                  Learn more
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>

            {/* Feature Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="bg-gradient-to-tr from-[#1a0b25] to-[#2a1040] p-1 rounded-2xl group"
            >
              <div className="bg-[#0f0f1a]/80 backdrop-blur-sm p-6 rounded-2xl h-full border border-purple-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-pink-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="p-3 bg-gradient-to-tr from-pink-600/20 to-purple-600/20 rounded-xl inline-block mb-4 relative z-10">
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white relative z-10">Virtual GD Simulations</h3>
                <p className="text-gray-300 mb-4 relative z-10">
                  Practice group discussions with AI participants that respond to your points and challenge your ideas.
                </p>
                <Link
                  to="#"
                  className="text-pink-400 inline-flex items-center relative z-10 group-hover:text-pink-300 transition-colors"
                >
                  Learn more
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>

            {/* Feature Card 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="bg-gradient-to-tr from-[#1a0b25] to-[#2a1040] p-1 rounded-2xl group"
            >
              <div className="bg-[#0f0f1a]/80 backdrop-blur-sm p-6 rounded-2xl h-full border border-purple-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-pink-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="p-3 bg-gradient-to-tr from-pink-600/20 to-purple-600/20 rounded-xl inline-block mb-4 relative z-10">
                  <BookOpen className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white relative z-10">Interview Preparation</h3>
                <p className="text-gray-300 mb-4 relative z-10">
                  Access industry-specific interview questions and practice with our AI interviewer to build confidence.
                </p>
                <Link
                  to="#"
                  className="text-pink-400 inline-flex items-center relative z-10 group-hover:text-pink-300 transition-colors"
                >
                  Learn more
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>

            {/* Feature Card 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="bg-gradient-to-tr from-[#1a0b25] to-[#2a1040] p-1 rounded-2xl group"
            >
              <div className="bg-[#0f0f1a]/80 backdrop-blur-sm p-6 rounded-2xl h-full border border-purple-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-pink-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="p-3 bg-gradient-to-tr from-pink-600/20 to-purple-600/20 rounded-xl inline-block mb-4 relative z-10">
                  <Sparkles className="h-6 w-6 text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white relative z-10">Personalized Feedback</h3>
                <p className="text-gray-300 mb-4 relative z-10">
                  Receive detailed insights on your performance with actionable tips to improve your communication
                  skills.
                </p>
                <Link
                  to="#"
                  className="text-pink-400 inline-flex items-center relative z-10 group-hover:text-pink-300 transition-colors"
                >
                  Learn more
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>

            {/* Feature Card 5 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="bg-gradient-to-tr from-[#1a0b25] to-[#2a1040] p-1 rounded-2xl group md:col-span-2 lg:col-span-1"
            >
              <div className="bg-[#0f0f1a]/80 backdrop-blur-sm p-6 rounded-2xl h-full border border-purple-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-pink-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="p-3 bg-gradient-to-tr from-pink-600/20 to-purple-600/20 rounded-xl inline-block mb-4 relative z-10">
                  <Star className="h-6 w-6 text-orange-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white relative z-10">Progress Tracking</h3>
                <p className="text-gray-300 mb-4 relative z-10">
                  Monitor your improvement over time with detailed analytics and performance metrics.
                </p>
                <Link
                  to="#"
                  className="text-pink-400 inline-flex items-center relative z-10 group-hover:text-pink-300 transition-colors"
                >
                  Learn more
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>

            {/* Feature Card 6 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="bg-gradient-to-tr from-[#1a0b25] to-[#2a1040] p-1 rounded-2xl group"
            >
              <div className="bg-[#0f0f1a]/80 backdrop-blur-sm p-6 rounded-2xl h-full border border-purple-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-pink-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="p-3 bg-gradient-to-tr from-pink-600/20 to-purple-600/20 rounded-xl inline-block mb-4 relative z-10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-cyan-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-white relative z-10">Instant Feedback</h3>
                <p className="text-gray-300 mb-4 relative z-10">
                  Get real-time analysis and suggestions to improve your communication style during practice sessions.
                </p>
                <Link
                  to="#"
                  className="text-pink-400 inline-flex items-center relative z-10 group-hover:text-pink-300 transition-colors"
                >
                  Learn more
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" ref={testimonialsRef} className="relative py-20 md:py-32">
        <div className="container mx-auto px-4 z-10 relative">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-5xl font-bold mb-6"
            >
              How{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                SpeakSpace
              </span>{' '}
              Works
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-gray-300 max-w-2xl mx-auto"
            >
              A simple four-step process to transform your communication skills
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{
                y: -10,
                transition: { duration: 0.3 },
              }}
              className="relative"
            >
              <div className="bg-gradient-to-tr from-[#1a0b25] to-[#2a1040] p-1 rounded-2xl h-full">
                <div className="bg-[#0f0f1a]/80 backdrop-blur-sm p-6 rounded-2xl h-full border border-purple-500/20 relative overflow-hidden">
                  <div className="absolute -right-12 -top-12 w-24 h-24 rounded-full bg-pink-600/10 blur-xl" />
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center履歴書 text-white font-bold text-lg">
                      1
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold text-white">Choose Your Role</h3>
                    </div>
                  </div>
                  <p className="text-gray-300">
                    Select whether you want to be a Participant, Moderator, or Evaluator depending on your practice
                    needs.
                  </p>
                </div>
              </div>
              <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-pink-500 to-transparent" />
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{
                y: -10,
                transition: { duration: 0.3 },
              }}
              className="relative"
            >
              <div className="bg-gradient-to-tr from-[#1a0b25] to-[#2a1040] p-1 rounded-2xl h-full">
                <div className="bg-[#0f0f1a]/80 backdrop-blur-sm p-6 rounded-2xl h-full border border-purple-500/20 relative overflow-hidden">
                  <div className="absolute -right-12 -top-12 w-24 h-24 rounded-full bg-purple-600/10 blur-xl" />
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                      2
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold text-white">Set Up or Join a Session</h3>
                    </div>
                  </div>
                  <p className="text-gray-300">
                    Pick a discussion topic, set the timer, and manage participants — or join an existing live room.
                  </p>
                </div>
              </div>
              <div className="hidden lg:block absolute top-1/2 -right Search for a mentor or career coach who specializes in your industry or desired role. A mentor with relevant experience can provide tailored advice, help you navigate challenges, and open doors to opportunities through their network. Platforms like LinkedIn, MentorCruise, or industry-specific forums can connect you with professionals willing to guide you. If formal mentorship isn’t available, seek informational interviews with experts to gain insights and build relationships. -4 w-8 h-0.5 bg-gradient-to-r from-purple-500 to-transparent" />
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{
                y: -10,
                transition: { duration: 0.3 },
              }}
              className="relative"
            >
              <div className="bg-gradient-to-tr from-[#1a0b25] to-[#2a1040] p-1 rounded-2xl h-full">
                <div className="bg-[#0f0f1a]/80 backdrop-blur-sm p-6 rounded-2xl h-full border border-purple-500/20 relative overflow-hidden">
                  <div className="absolute -right-12 -top-12 w-24 h-24 rounded-full bg-blue-600/10 blur-xl" />
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                      3
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold text-white">Engage in Real-Time Discussions</h3>
                    </div>
                  </div>
                  <p className="text-gray-300">
                    Participate in a text or voice-based GD/interview simulation with live collaboration tools.
                  </p>
                </div>
              </div>
              <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-transparent" />
            </motion.div>

            {/* Step 4 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              whileHover={{
                y: -10,
                transition: { duration: 0.3 },
              }}
            >
              <div className="bg-gradient-to-tr from-[#1a0b25] to-[#2a1040] p-1 rounded-2xl h-full">
                <div className="bg-[#0f0f1a]/80 backdrop-blur-sm p-6 rounded-2xl h-full border border-purple-500/20 relative overflow-hidden">
                  <div className="absolute -right-12 -top-12 w-24 h-24 rounded-full bg-cyan-600/10 blur-xl" />
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                      4
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold text-white">Get Actionable Feedback</h3>
                    </div>
                  </div>
                  <p className="text-gray-300">
                    Receive instant feedback and performance analytics from peers or evaluators to improve your
                    communication and confidence.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Floating elements */}
        <motion.div
          className="absolute -left-20 top-1/3 w-64 h-64 rounded-full bg-gradient-to-r from-purple-600/10 to-pink-600/10 blur-3xl"
          animate={{
            x: [0, 20, 0],
            y: [0, -20, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: 'reverse',
          }}
        />
        <motion.div
          className="absolute -right-20 bottom-1/3 w-80 h-80 rounded-full bg-gradient-to-r from-blue-600/10 to-purple-600/10 blur-3xl"
          animate={{
            x: [0, -20, 0],
            y: [0, 20, 0],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: 'reverse',
          }}
        />
      </section>

      {/* Call to Action Section */}
      <section id="get-started" className="relative py-20 md:py-32">
        <div className="container mx-auto px-4 z-10 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-tr from-[#1a0b25] to-[#2a1040] p-1 rounded-3xl overflow-hidden"
          >
            <div className="bg-[#0f0f1a]/80 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-purple-500/20 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-pink-600/5 to-purple-600/5" />
              <div className="max-w-3xl mx-auto text-center relative z-10">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                  Ready to{' '}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                    Transform
                  </span>{' '}
                  Your Communication Skills?
                </h2>
                <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                  Join thousands of students and professionals who have improved their speaking skills and aced their
                  interviews with SpeakSpace.
                </p>
                <div className="flex flex-col md:flex-row gap-4 justify-center mb-8">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:outline-none focus:border-pink-500 w-full md:w-80"
                  />
                  <motion.button
                    onClick={handleCTAClick}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    className="relative px-8 py-3 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium overflow-hidden group"
                  >
                    <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-pink-400 to-purple-400 opacity-0 group-hover:opacity-50 transition-opacity duration-500 blur-xl"></span>
                    <span className="absolute top-0 left-0 w-0 h-full bg-white transition-all duration-300 group-hover:w-full opacity-20"></span>
                    <span className="relative z-10">{token ? 'Go to Dashboard' : 'Get Started Free'}</span>
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 to-purple-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                  </motion.button>
                </div>
                <p className="text-sm text-gray-400">No credit card required. Start with a 7-day free trial.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <Link to="/" className="flex items-center space-x-2 mb-4">
                <Mic className="h-8 w-8 text-pink-500" />
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
                  SpeakSpace
                </span>
              </Link>
              <p className="text-gray-400 text-sm">
                Empowering better communication skills for students and professionals.
              </p>
            </div>

            <div>
              <h4 className="text-white font-medium mb-4">Features</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    AI Speech Analysis
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    GD Simulations
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Interview Prep
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Progress Tracking
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-medium mb-4">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Guides
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Support
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-medium mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© {new Date().getFullYear()} SpeakSpace. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link to="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <Link to="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
              <Link to="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <Link to="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}