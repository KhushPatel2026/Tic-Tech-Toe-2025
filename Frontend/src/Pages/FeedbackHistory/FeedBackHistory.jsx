import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { History, User, Calendar, Star, ArrowRight, BarChart2 } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function FeedbackHistory() {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));
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

  // Fetch feedback history
  useEffect(() => {
    async function fetchFeedback() {
      if (!user || !user.id) {
        toast.error('User not authenticated');
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`http://localhost:3000/api/feedback/history/${user.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await response.json();
        if (response.ok) {
          setFeedbacks(data);
        } else {
          toast.error(data.error || 'Failed to load feedback history');
        }
      } catch (error) {
        toast.error('Failed to load feedback history');
      } finally {
        setLoading(false);
      }
    }
    fetchFeedback();
  }, [user]);

  // Function to view detailed feedback
  const viewFeedbackDetails = (feedback) => {
    setSelectedFeedback(feedback);
  };

  // Function to close detailed view
  const closeDetails = () => {
    setSelectedFeedback(null);
  };

  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Function to render rating stars
  const renderRatingStars = (rating) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
      ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] via-[#1a1025] to-[#1e0a2e] text-white">
      {/* Background mesh gradients */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-radial from-[#5f0f9980] via-transparent to-transparent opacity-30" />
        <div className="absolute inset-0 bg-gradient-radial from-[#e91e6380] via-transparent to-transparent opacity-20 translate-x-1/2" />
        <div className="absolute inset-0 bg-gradient-radial from-[#4a00e080] via-transparent to-transparent opacity-20 translate-y-1/4" />
        <div className="absolute inset-0 bg-gradient-radial from-[#8e2de280] via-transparent to-transparent opacity-30 -translate-x-1/3 translate-y-1/2" />
      </div>
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


      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Main content card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto bg-gradient-to-tr from-[#1a0b25]/80 to-[#2a1040]/80 backdrop-blur-md p-1 rounded-2xl"
        >
          <div className="bg-[#0f0f1a]/60 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-purple-500/20 min-h-[70vh]">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center mb-8"
            >
              <History className="h-8 w-8 text-pink-500 mr-3" />
              <h1 className="text-2xl md:text-3xl font-bold">
                Feedback{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                  History
                </span>
              </h1>
            </motion.div>

            {/* Feedback list */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
              </div>
            ) : feedbacks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-[#1a1025]/50 backdrop-blur-sm rounded-xl p-8 text-center"
              >
                <p className="text-gray-400">No feedback available yet.</p>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                {selectedFeedback ? (
                  // Detailed feedback view
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="bg-[#1a1025]/70 backdrop-blur-md rounded-xl p-6 border border-purple-500/20"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <h2 className="text-xl font-semibold text-white">{selectedFeedback.sessionId.topic}</h2>
                      <button
                        onClick={closeDetails}
                        className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
                      >
                        <ArrowRight className="h-5 w-5 rotate-180" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-purple-400 mr-2" />
                          <div>
                            <p className="text-sm text-gray-400">Evaluator</p>
                            <p className="text-white">{selectedFeedback.evaluatorId.name}</p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-blue-400 mr-2" />
                          <div>
                            <p className="text-sm text-gray-400">Date</p>
                            <p className="text-white">{formatDate(selectedFeedback.createdAt)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Communication</p>
                          <div className="flex items-center">
                            {renderRatingStars(selectedFeedback.communication)}
                            <span className="ml-2 text-white">{selectedFeedback.communication}/5</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-400 mb-1">Clarity</p>
                          <div className="flex items-center">
                            {renderRatingStars(selectedFeedback.clarity)}
                            <span className="ml-2 text-white">{selectedFeedback.clarity}/5</span>
                          </div>
                        </div>

                        {selectedFeedback.confidence && (
                          <div>
                            <p className="text-sm text-gray-400 mb-1">Confidence</p>
                            <div className="flex items-center">
                              {renderRatingStars(selectedFeedback.confidence)}
                              <span className="ml-2 text-white">{selectedFeedback.confidence}/5</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6">
                      <p className="text-sm text-gray-400 mb-2">Feedback Comments</p>
                      <div className="bg-[#0f0f1a]/60 p-4 rounded-lg border border-purple-500/10">
                        <p className="text-white">{selectedFeedback.comments || 'No comments provided.'}</p>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={closeDetails}
                        className="px-6 py-2 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium"
                      >
                        Back to All Feedback
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  // Feedback list view
                  <motion.div
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {feedbacks.map((feedback, index) => (
                      <motion.div
                        key={feedback._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        className="bg-[#1a1025]/50 backdrop-blur-sm p-5 rounded-xl border border-purple-500/10 hover:border-purple-500/30 transition-all duration-300 cursor-pointer"
                        onClick={() => viewFeedbackDetails(feedback)}
                      >
                        <div className="flex flex-col md:flex-row justify-between md:items-center">
                          <div className="mb-3 md:mb-0">
                            <h3 className="font-medium text-white text-lg mb-1">{feedback.sessionId.topic}</h3>
                            <div className="flex items-center text-sm text-gray-400">
                              <User className="h-3.5 w-3.5 mr-1" />
                              <span>{feedback.evaluatorId.name}</span>
                              <span className="mx-2">•</span>
                              <Calendar className="h-3.5 w-3.5 mr-1" />
                              <span>{formatDate(feedback.createdAt)}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="flex flex-col items-center">
                              <div className="flex">{renderRatingStars(feedback.communication)}</div>
                              <span className="text-xs text-gray-400 mt-1">Communication</span>
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-2 rounded-full bg-purple-600/20 hover:bg-purple-600/30 transition-colors"
                            >
                              <ArrowRight className="h-4 w-4 text-purple-400" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Action buttons */}
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/dashboard">
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: '0 0 15px rgba(236,72,153,0.5)',
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium flex items-center justify-center"
                >
                  <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                  Back to Dashboard
                </motion.button>
              </Link>

              <Link to="#">
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: '0 0 15px rgba(138,43,226,0.5)',
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium flex items-center justify-center"
                >
                  <BarChart2 className="h-4 w-4 mr-2" />
                  View Analytics
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Back to home link */}
        <div className="mt-8 text-center">
          <Link to="/" className="text-gray-400 hover:text-white transition-colors text-sm inline-flex items-center">
            <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
            Back to Home
          </Link>
        </div>
      </div>

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

export default FeedbackHistory;