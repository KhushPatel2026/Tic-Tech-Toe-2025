import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import { Mic, Send, RefreshCw, ArrowRight, MessageSquare } from "lucide-react";

export default function MockGD() {
  const navigate = useNavigate();
  const [step, setStep] = useState("input"); // input, discussion, analysis
  const [topicInput, setTopicInput] = useState("");
  const [hardnessLevel, setHardnessLevel] = useState("Easy");
  const [topic, setTopic] = useState("");
  const [discussion, setDiscussion] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [responseText, setResponseText] = useState("");
  const [isVoiceOn, setIsVoiceOn] = useState(false);
  const [analysis, setAnalysis] = useState([]);
  const [overallScores, setOverallScores] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  let speechRecognition = null;

  useEffect(() => {
    if (!isVoiceOn || step !== "discussion") return;
    speechRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    speechRecognition.lang = "en-US";
    speechRecognition.interimResults = false;
    speechRecognition.onresult = (event) => setResponseText(event.results[0][0].transcript);
    speechRecognition.onerror = () => toast.error("Speech recognition error");
    speechRecognition.start();
    return () => speechRecognition?.stop();
  }, [isVoiceOn, step]);

  useEffect(() => {
    if (step !== "analysis" || !analysis.length) return;
    async function saveResults() {
      try {
        const response = await fetch("http://localhost:3000/api/mock-gd/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ topic, hardnessLevel, discussion, analysis, overallScores }),
        });
        if (!response.ok) toast.error("Failed to save results");
      } catch (error) {
        toast.error("Error saving results");
      }
    }
    saveResults();
  }, [step, analysis, overallScores, topic, hardnessLevel, discussion]);

  async function handleTopicSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/mock-gd/topic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ topic: topicInput, hardnessLevel }),
      });
      const data = await response.json();
      if (response.ok) {
        setTopic(data.topic);
        setStep("discussion");
      } else {
        toast.error(data.error || "Failed to generate topic");
      }
    } catch (error) {
      toast.error("Failed to generate topic");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResponseSubmit() {
    if (!responseText) return toast.error("Please provide a response");
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/mock-gd/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ topic, hardnessLevel, discussion, userResponse: responseText, turn: currentTurn }),
      });
      const data = await response.json();
      if (response.ok) {
        setDiscussion((prev) => [...prev, { speaker: "User", text: responseText }, ...data.aiResponses]);
        setResponseText("");
        setIsVoiceOn(false);
        setCurrentTurn((prev) => prev + 1);
        if (data.analysis) setAnalysis(data.analysis);
        if (data.overallScores) setOverallScores(data.overallScores);
        if (currentTurn === 4) setStep("analysis");
      } else {
        toast.error(data.error || "Failed to process response");
      }
    } catch (error) {
      toast.error("Failed to process response");
    } finally {
      setIsLoading(false);
    }
  }

  function toggleVoice() {
    setIsVoiceOn((prev) => !prev);
  }

  function restartGD() {
    setStep("input");
    setTopic("");
    setTopicInput("");
    setHardnessLevel("Easy");
    setDiscussion([]);
    setCurrentTurn(0);
    setResponseText("");
    setAnalysis([]);
    setOverallScores(null);
  }

  const getScoreColor = (score) => {
    if (score >= 4) return "text-green-400";
    if (score === 3) return "text-pink-400";
    return "text-red-400";
  };

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
      <div className="fixed inset-0 z-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full bg-white ${i % 3 === 0 ? "animate-pulse" : ""}`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              opacity: Math.random() * 0.8 + 0.2,
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
              <MessageSquare className="h-8 w-8 text-pink-500 mr-3" />
              <h1 className="text-2xl md:text-3xl font-bold text-center">
                Mock{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                  Group Discussion
                </span>
              </h1>
            </motion.div>

            {isLoading && (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
              </div>
            )}

            {!isLoading && step === "input" && (
              <motion.form
                onSubmit={handleTopicSubmit}
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div>
                  <label className="text-sm text-gray-400">Discussion Topic</label>
                  <input
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    type="text"
                    placeholder="Enter discussion topic (e.g., Impact of AI in marketing)"
                    required
                    className="w-full px-4 py-3 bg-[#0f0f1a]/60 border border-purple-500/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Hardness Level</label>
                  <select
                    value={hardnessLevel}
                    onChange={(e) => setHardnessLevel(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-[#0f0f1a]/60 border border-purple-500/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(236,72,153,0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium flex items-center justify-center disabled:opacity-50"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Start Discussion
                </motion.button>
              </motion.form>
            )}

            {!isLoading && step === "discussion" && (
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="w-full bg-[#1a1025]/50 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-pink-500 to-purple-500 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${((currentTurn + 1) / 5) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                  Topic: {topic}
                </p>
                <div className="max-h-64 overflow-y-auto space-y-4">
                  {discussion.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: item.speaker === "User" ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.1 }}
                      className={`p-3 rounded-lg ${
                        item.speaker === "User"
                          ? "bg-gradient-to-r from-pink-900/30 to-purple-900/30 border border-pink-500/20"
                          : "bg-[#0f0f1a]/60 border border-purple-500/10"
                      }`}
                    >
                      <strong>{item.speaker}:</strong> {item.text}
                    </motion.div>
                  ))}
                </div>
                <div>
                  <label className="text-sm text-gray-400">Your Response</label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Type or speak your response..."
                    className="w-full px-4 py-3 bg-[#0f0f1a]/60 border border-purple-500/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
                <div className="flex gap-4">
                  <motion.button
                    onClick={toggleVoice}
                    whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(236,72,153,0.5)" }}
                    whileTap={{ scale: 0.95 }}
                    className={`py-2 px-4 rounded-lg flex items-center justify-center text-white font-medium ${
                      isVoiceOn
                        ? "bg-gradient-to-r from-red-600 to-red-800 animate-pulse"
                        : "bg-gradient-to-r from-pink-600 to-purple-600"
                    }`}
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    {isVoiceOn ? "Stop Voice" : "Use Voice"}
                  </motion.button>
                  <motion.button
                    onClick={handleResponseSubmit}
                    disabled={isLoading}
                    whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(236,72,153,0.5)" }}
                    whileTap={{ scale: 0.95 }}
                    className="py-2 px-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg font-medium flex items-center justify-center disabled:opacity-50"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Response
                  </motion.button>
                </div>
              </motion.div>
            )}

            {!isLoading && step === "analysis" && (
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <h2 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                  Analysis of Your Contributions
                </h2>
                {analysis.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className="bg-[#1a1025]/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/10"
                  >
                    <p className="text-pink-400">
                      <strong>Turn {idx + 1}:</strong> {item.response}
                    </p>
                    <p className="text-white">
                      <strong>Feedback:</strong> {item.analysis}
                    </p>
                  </motion.div>
                ))}
                {overallScores && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="bg-[#1a1025]/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/10"
                  >
                    <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                      Overall Scores
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <p className={getScoreColor(overallScores.communication)}>
                        <strong>Communication:</strong> {overallScores.communication}/5
                      </p>
                      <p className={getScoreColor(overallScores.clarity)}>
                        <strong>Clarity:</strong> {overallScores.clarity}/5
                      </p>
                      <p className={getScoreColor(overallScores.confidence)}>
                        <strong>Confidence:</strong> {overallScores.confidence}/5
                      </p>
                      <p className={getScoreColor(overallScores.engagement)}>
                        <strong>Engagement:</strong> {overallScores.engagement}/5
                      </p>
                      <p className={getScoreColor(overallScores.reasoning)}>
                        <strong>Reasoning:</strong> {overallScores.reasoning}/5
                      </p>
                    </div>
                  </motion.div>
                )}
                <div className="flex flex-col sm:flex-row gap-4">
                  <motion.button
                    onClick={restartGD}
                    whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(138,43,226,0.5)" }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium flex items-center justify-center"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Restart Discussion
                  </motion.button>
                  <motion.button
                    onClick={() => navigate("/dashboard")}
                    whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(236,72,153,0.5)" }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium flex items-center justify-center"
                  >
                    <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                    Back to Dashboard
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Back to dashboard link */}
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