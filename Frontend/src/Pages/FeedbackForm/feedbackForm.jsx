import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import io from "socket.io-client";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, User } from "lucide-react";

const socket = io("http://localhost:3000", { withCredentials: true });

export default function FeedbackForm() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [feedbacks, setFeedbacks] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch(`http://localhost:3000/api/sessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await response.json();
        if (response.ok) {
          setParticipants(data.participants);
          setFeedbacks(
            data.participants.reduce(
              (acc, p) => ({
                ...acc,
                [p._id]: {
                  communication: 1,
                  clarity: 1,
                  confidence: 1,
                  engagement: 1,
                  reasoning: 1,
                  comments: "",
                },
              }),
              {}
            )
          );
          setLoading(false);
        } else {
          toast.error(data.error || "Failed to load session");
          setLoading(false);
        }
      } catch (error) {
        toast.error("Failed to fetch session");
        setLoading(false);
      }
    }
    fetchSession();
  }, [sessionId]);

  const handleFeedbackChange = (participantId, field, value) => {
    setFeedbacks((prev) => ({
      ...prev,
      [participantId]: {
        ...prev[participantId],
        [field]: field === "comments" ? value : Number(value),
      },
    }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    const feedbackArray = Object.entries(feedbacks).map(([participantId, { communication, clarity, confidence, engagement, reasoning, comments }]) => ({
      sessionId,
      participantId,
      communication,
      clarity,
      confidence,
      engagement,
      reasoning,
      comments,
    }));
    try {
      const response = await fetch("http://localhost:3000/api/feedback/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(feedbackArray),
      });
      if (response.ok) {
        toast.success("Feedback submitted, session ended!");
        socket.emit("end-session", { sessionId });
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to submit feedback");
      }
    } catch (error) {
      toast.error("Failed to submit feedback");
    }
  }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] via-[#1a1025] to-[#1e0a2e] text-white overflow-hidden">
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
          className="max-w-5xl mx-auto bg-gradient-to-tr from-[#1a0b25]/80 to-[#2a1040]/80 backdrop-blur-md p-1 rounded-2xl overflow-hidden"
        >
          <div className="bg-[#0f0f1a]/60 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-purple-500/20 min-h-[70vh]">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center justify-center mb-8"
            >
              <User className="h-8 w-8 text-pink-500 mr-3" />
              <h1 className="text-2xl md:text-3xl font-bold text-center">
                Submit{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                  Feedback
                </span>
              </h1>
            </motion.div>

            {/* Form content */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
              </div>
            ) : participants.length > 0 ? (
              <form onSubmit={handleSubmit} className="space-y-8">
                {participants.map((p, index) => (
                  <motion.div
                    key={p._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                    className="bg-[#1a1025]/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/10 space-y-6"
                  >
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-pink-400 mr-2" />
                      <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                        {p.name} ({p.email})
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-400">Communication</label>
                        <select
                          value={feedbacks[p._id]?.communication}
                          onChange={(e) => handleFeedbackChange(p._id, "communication", e.target.value)}
                          required
                          className="w-full px-4 py-3 bg-[#0f0f1a]/60 border border-purple-500/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                        >
                          {[1, 2, 3, 4, 5].map((val) => (
                            <option key={val} value={val}>
                              {val}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Clarity</label>
                        <select
                          value={feedbacks[p._id]?.clarity}
                          onChange={(e) => handleFeedbackChange(p._id, "clarity", e.target.value)}
                          required
                          className="w-full px-4 py-3 bg-[#0f0f1a]/60 border border-purple-500/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                        >
                          {[1, 2, 3, 4, 5].map((val) => (
                            <option key={val} value={val}>
                              {val}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Confidence</label>
                        <select
                          value={feedbacks[p._id]?.confidence}
                          onChange={(e) => handleFeedbackChange(p._id, "confidence", e.target.value)}
                          required
                          className="w-full px-4 py-3 bg-[#0f0f1a]/60 border border-purple-500/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                        >
                          {[1, 2, 3, 4, 5].map((val) => (
                            <option key={val} value={val}>
                              {val}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Engagement</label>
                        <select
                          value={feedbacks[p._id]?.engagement}
                          onChange={(e) => handleFeedbackChange(p._id, "engagement", e.target.value)}
                          required
                          className="w-full px-4 py-3 bg-[#0f0f1a]/60 border border-purple-500/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                        >
                          {[1, 2, 3, 4, 5].map((val) => (
                            <option key={val} value={val}>
                              {val}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Reasoning</label>
                        <select
                          value={feedbacks[p._id]?.reasoning}
                          onChange={(e) => handleFeedbackChange(p._id, "reasoning", e.target.value)}
                          required
                          className="w-full px-4 py-3 bg-[#0f0f1a]/60 border border-purple-500/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                        >
                          {[1, 2, 3, 4, 5].map((val) => (
                            <option key={val} value={val}>
                              {val}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Comments</label>
                      <textarea
                        value={feedbacks[p._id]?.comments}
                        onChange={(e) => handleFeedbackChange(p._id, "comments", e.target.value)}
                        placeholder="Add your comments..."
                        className="w-full px-4 py-3 bg-[#0f0f1a]/60 border border-purple-500/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                      />
                    </div>
                  </motion.div>
                ))}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(236,72,153,0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium flex items-center justify-center"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit All Feedback
                </motion.button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-[#1a1025]/50 backdrop-blur-sm rounded-xl p-8 text-center"
              >
                <p className="text-gray-400">No participants found for this session.</p>
              </motion.div>
            )}

            {/* Back to dashboard */}
            <div className="mt-8 text-center">
              <motion.button
                onClick={() => navigate("/dashboard")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-gray-400 hover:text-white transition-colors text-sm inline-flex items-center"
              >
                <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
                Back to Dashboard
              </motion.button>
            </div>
          </div>
        </motion.div>
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
        toastClassName="bg-[#1a1025]/90 backdrop-blur-md border border-purple-500/20 text-white"
        progressClassName="bg-pink-500"
      />
    </div>
  );
}