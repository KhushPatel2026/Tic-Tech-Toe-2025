import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, 
  Send, 
  RefreshCw, 
  ArrowLeft, 
  MessageSquare, 
  User, 
  Bot, 
  ChevronRight,
  Award,
  BarChart3,
  Brain,
  Volume2,
  UserCircle2,
  Calendar,
  Settings
} from "lucide-react";

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
  const [selectedAnalysisTab, setSelectedAnalysisTab] = useState("feedback");
  const [isContributionsOpen, setIsContributionsOpen] = useState(false);
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
        else toast.success("Results saved successfully");
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
        // Add user response first
        setDiscussion((prev) => [{ speaker: "User", text: responseText }, ...prev]);
        
        // Add AI responses with a delay
        if (data.aiResponses && data.aiResponses.length > 0) {
          data.aiResponses.forEach((aiResponse, index) => {
            setTimeout(() => {
              setDiscussion((prev) => [aiResponse, ...prev]);
            }, (index + 1) * 1000); // 1-second delay per AI response
          });
        }

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
    setSelectedAnalysisTab("feedback");
  }

  const getScoreColor = (score) => {
    if (score >= 4) return "text-green-400";
    if (score === 3) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreEmoji = (score) => {
    if (score >= 4) return "★★★★★";
    if (score === 3) return "★★★☆☆";
    return "★★☆☆☆";
  };

  const getHardnessColor = (level) => {
    switch(level) {
      case "Easy": return "text-green-400";
      case "Medium": return "text-yellow-400";
      case "Hard": return "text-orange-400";
      case "Expert": return "text-red-400";
      default: return "text-green-400";
    }
  };

  const fadeAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] via-[#1a1025] to-[#1e0a2e] text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-radial from-[#5f0f9980] via-transparent to-transparent opacity-30" />
        <div className="absolute inset-0 bg-gradient-radial from-[#e91e6380] via-transparent to-transparent opacity-20 translate-x-1/2" />
        <div className="absolute top-0 left-0 w-full h-full">
          {Array.from({ length: 70 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                opacity: Math.random() * 0.8 + 0.2,
                animationDuration: `${Math.random() * 5 + 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Container */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Navigation Bar */}
        <motion.nav 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex justify-between items-center mb-8 bg-[#1a1025]/40 backdrop-blur-md px-6 py-3 rounded-xl border border-purple-500/10"
        >
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-6 w-6 text-pink-400" />
            <h1 className="text-xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                MockGD
              </span>
            </h1>
          </div>
        </motion.nav>

        {/* Main Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto bg-gradient-to-tr from-[#1a0b25]/80 to-[#2a1040]/80 backdrop-blur-md p-1 rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="bg-[#0f0f1a]/60 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-purple-500/20 min-h-[75vh]">
            {/* Header with breadcrumbs */}
            <div className="flex items-center mb-6 text-sm text-gray-4
00">
              <span className={`${step === "input" ? "text-pink-400 font-medium" : ""}`}>Choose Topic</span>
              <ChevronRight className="h-4 w-4 mx-2" />
              <span className={`${step === "discussion" ? "text-pink-400 font-medium" : ""}`}>Discussion</span>
              <ChevronRight className="h-4 w-4 mx-2" />
              <span className={`${step === "analysis" ? "text-pink-400 font-medium" : ""}`}>Analysis</span>
            </div>

            {/* Loading Spinner (Removed Button) */}
            {isLoading && (
              <div className="flex justify-center items-center py-20">
                <div className="w-16 h-16 border-4 border-purple-500/30 border-t-pink-500 rounded-full animate-spin"></div>
              </div>
            )}

            {/* Content Sections with AnimatePresence for smooth transitions */}
            <AnimatePresence mode="wait">
              {/* Step 1: Topic Selection */}
              {!isLoading && step === "input" && (
                <motion.div
                  key="input"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={fadeAnimation}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold mb-2">
                      Start Your Mock Group Discussion
                    </h2>
                    <p className="text-gray-400 max-w-lg mx-auto">
                      Participate in a realistic group discussion simulation to improve your communication skills.
                      Receive detailed feedback on your performance.
                    </p>
                  </div>

                  <form onSubmit={handleTopicSubmit} className="space-y-6 max-w-md mx-auto">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-300">Discussion Topic</label>
                        <span className="text-xs text-gray-400">Required</span>
                      </div>
                      <input
                        value={topicInput}
                        onChange={(e) => setTopicInput(e.target.value)}
                        type="text"
                        placeholder="E.g., Impact of AI in education, Climate change solutions..."
                        required
                        className="w-full px-4 py-3 bg-[#15111e]/80 border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-all duration-300"
                      />
                      <p className="text-xs text-gray-400 mt-1">Enter a topic you'd like to discuss or leave blank for a random topic</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Difficulty Level</label>
                      <div className="grid grid-cols-4 gap-2">
                        {["Easy", "Medium", "Hard", "Expert"].map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setHardnessLevel(level)}
                            className={`py-2 px-3 rounded-lg text-sm font-medium transition duration-300 
                              ${hardnessLevel === level 
                                ? "bg-gradient-to-r from-pink-600/80 to-purple-600/80 border-none text-white shadow-lg shadow-pink-600/20" 
                                : "bg-[#15111e]/60 border border-purple-500/20 text-gray-300 hover:border-pink-500/40"}`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(236,72,153,0.4)" }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium flex items-center justify-center disabled:opacity-50 shadow-lg shadow-pink-900/20"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Begin Discussion
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {/* Step 2: Discussion */}
              {!isLoading && step === "discussion" && (
                <motion.div
                  key="discussion"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={fadeAnimation}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Current topic</div>
                      <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                        {topic}
                      </h2>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getHardnessColor(hardnessLevel)} bg-[#15111e]/80`}>
                          {hardnessLevel}
                        </div>
                        <div className="text-xs text-gray-400">
                          Turn {currentTurn + 1} of 5
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#1a1025]/50 rounded-full h-2 mb-6">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-in-out"
                      style={{ width: `${((currentTurn + 1) / 5) * 100}%` }}
                    ></div>
                  </div>

                  {/* Conversation Section */}
                  <div className="bg-[#15111e]/60 rounded-xl p-4 border border-purple-500/10 h-64 overflow-y-auto mb-4 space-y-4">
                    {discussion.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                        <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                        <p>The discussion will appear here.</p>
                        <p>Start by submitting your first response!</p>
                      </div>
                    ) : (
                      discussion.slice().reverse().map((item, idx) => (
                        <motion.div
                          key={`${item.speaker}-${item.text}-${idx}`}
                          initial={{ opacity: 0, x: item.speaker === "User" ? 20 : -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4 }}
                          className={`flex items-start gap-3 p-3 rounded-lg ${
                            item.speaker === "User"
                              ? "bg-gradient-to-r from-pink-900/20 to-purple-900/20 border border-pink-500/20 ml-6"
                              : "bg-[#0f0f1a]/60 border border-purple-500/10 mr-6"
                          }`}
                        >
                          <div className={`flex-shrink-0 rounded-full p-2 ${
                            item.speaker === "User" 
                              ? "bg-pink-500/20" 
                              : "bg-purple-500/20"
                          }`}>
                            {item.speaker === "User" ? (
                              <User className="h-4 w-4 text-pink-400" />
                            ) : (
                              <Bot className="h-4 w-4 text-purple-400" />
                            )}
                          </div>
                          <div>
                            <div className={`text-xs font-medium mb-1 ${
                              item.speaker === "User" ? "text-pink-400" : "text-purple-400"
                            }`}>
                              {item.speaker}
                            </div>
                            <p className="text-sm">{item.text}</p>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Response Input Area */}
                  <div className="bg-[#15111e]/60 rounded-xl p-4 border border-purple-500/10">
                    <div className="mb-2 flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-300">Your Response</label>
                      <div className="text-xs text-gray-400">
                        {responseText.length} characters
                      </div>
                    </div>
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Type your response or use voice input..."
                      className="w-full px-4 py-3 bg-[#0f0f1a]/60 border border-purple-500/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-all duration-300 min-h-24"
                    />
                    
                    <div className="flex gap-3 mt-3">
                      <motion.button
                        onClick={toggleVoice}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`py-2 px-4 rounded-lg flex items-center justify-center text-white font-medium text-sm ${
                          isVoiceOn
                            ? "bg-red-600/80 animate-pulse"
                            : "bg-[#15111e] border border-purple-500/20 hover:border-pink-500/40"
                        }`}
                      >
                        {isVoiceOn ? (
                          <>
                            <Volume2 className="h-4 w-4 mr-2" />
                            Recording...
                          </>
                        ) : (
                          <>
                            <Mic className="h-4 w-4 mr-2" />
                            Voice Input
                          </>
                        )}
                      </motion.button>
                      <motion.button
                        onClick={handleResponseSubmit}
                        disabled={isLoading || !responseText.trim()}
                        whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(236,72,153,0.4)" }}
                        whileTap={{ scale: 0.98 }}
                        className="py-2 px-6 flex-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg shadow-pink-900/20"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Submit Response
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Analysis */}
              {!isLoading && step === "analysis" && (
                <motion.div
                  key="analysis"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={fadeAnimation}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                      Your Performance Analysis
                    </h2>
                    <p className="text-gray-400 max-w-lg mx-auto mt-2">
                      Review your contributions and learn how to improve your group discussion skills
                    </p>
                  </div>

                  {/* Analysis Tabs */}
                  <div className="flex border-b border-purple-500/20 mb-6">
                    <button
                      onClick={() => setSelectedAnalysisTab("feedback")}
                      className={`py-2 px-4 font-medium text-sm border-b-2 transition-all ${
                        selectedAnalysisTab === "feedback" 
                          ? "border-pink-500 text-pink-400" 
                          : "border-transparent text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      Detailed Feedback
                    </button>
                    <button
                      onClick={() => setSelectedAnalysisTab("scores")}
                      className={`py-2 px-4 font-medium text-sm border-b-2 transition-all ${
                        selectedAnalysisTab === "scores" 
                          ? "border-pink-500 text-pink-400" 
                          : "border-transparent text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      Overall Scores
                    </button>
                    <button
                      onClick={() => setSelectedAnalysisTab("summary")}
                      className={`py-2 px-4 font-medium text-sm border-b-2 transition-all ${
                        selectedAnalysisTab === "summary" 
                          ? "border-pink-500 text-pink-400" 
                          : "border-transparent text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      Summary
                    </button>
                  </div>

                  {/* Feedback Tab Content */}
                  <AnimatePresence mode="wait">
                    {selectedAnalysisTab === "feedback" && (
                      <motion.div
                        key="feedback"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        {analysis.map((item, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.1 }}
                            className="bg-[#15111e]/60 backdrop-blur-sm rounded-xl p-5 border border-purple-500/10 hover:border-pink-500/20 transition-colors"
                          >
                            <div className="flex items-center mb-3">
                              <div className="bg-pink-500/20 text-pink-400 rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold mr-2">
                                {idx + 1}
                              </div>
                              <h3 className="font-medium text-gray-200">Turn {idx + 1}</h3>
                            </div>
                            <div className="pl-8 border-l border-purple-500/20 mb-4">
                              <p className="text-gray-300 text-sm italic mb-2">"{item.response}"</p>
                            </div>
                            <div className="bg-[#0f0f1a]/40 rounded-lg p-4 border border-purple-500/10">
                              <div className="flex items-center mb-2">
                                <Brain className="h-4 w-4 text-purple-400 mr-2" />
                                <h4 className="text-sm font-medium text-purple-400">Feedback</h4>
                              </div>
                              <p className="text-sm text-gray-300">{item.analysis}</p>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}

                    {/* Scores Tab Content */}
                    {selectedAnalysisTab === "scores" && overallScores && (
                      <motion.div
                        key="scores"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-[#15111e]/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/10"
                      >
                        <div className="flex items-center mb-6">
                          <Award className="h-5 w-5 text-pink-400 mr-2" />
                          <h3 className="text-lg font-semibold text-gray-200">Performance Metrics</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {Object.entries(overallScores).map(([key, score], idx) => (
                            <motion.div
                              key={key}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: idx * 0.1 }}
                              className="bg-[#0f0f1a]/40 rounded-lg p-4 border border-purple-500/10 hover:border-pink-500/20 transition-colors"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-medium text-gray-300 capitalize">{key}</h4>
                                <div className={`text-lg font-bold ${getScoreColor(score)}`}>
                                  {score}/5
                                </div>
                              </div>
                              <div className="w-full bg-[#1a1025]/50 rounded-full h-2 mb-1">
                                <div
                                  className={`${
                                    score >= 4 ? "bg-green-400" : score === 3 ? "bg-yellow-400" : "bg-red-400"
                                  } h-2 rounded-full transition-all duration-500`}
                                  style={{ width: `${(score / 5) * 100}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-right text-gray-400">
                                {getScoreEmoji(score)}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Summary Tab Content */}
                    {selectedAnalysisTab === "summary" && (
                      <motion.div
                        key="summary"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-[#15111e]/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/10"
                      >
                        <div className="flex items-center mb-4">
                          <BarChart3 className="h-5 w-5 text-pink-400 mr-2" />
                          <h3 className="text-lg font-semibold text-gray-200">Discussion Summary</h3>
                        </div>

                        <div className="bg-[#0f0f1a]/40 rounded-lg p-4 border border-purple-500/10 mb-6">
                          <p className="text-sm text-gray-300 mb-2">
                            <strong>Topic:</strong> {topic || "Not specified"}
                          </p>
                          <p className="text-sm text-gray-300 mb-2">
                            <strong>Difficulty:</strong> <span className={getHardnessColor(hardnessLevel)}>{hardnessLevel}</span>
                          </p>
                          <p className="text-sm text-gray-300 mb-2">
                            <strong>Total Contributions:</strong> {discussion.filter(item => item.speaker === "User").length}
                          </p>
                          <p className="text-sm text-gray-300">
                            <strong>Average Score:</strong> {overallScores 
                              ? (Object.values(overallScores).reduce((a, b) => a + b, 0) / Object.keys(overallScores).length).toFixed(1) 
                              : "N/A"}/5
                          </p>
                        </div>

                        {/* Collapsible Contributions Section */}
                        <div className="mb-6">
                          <motion.button
                            onClick={() => setIsContributionsOpen(!isContributionsOpen)}
                            className="w-full flex items-center justify-between bg-[#0f0f1a]/40 rounded-lg p-4 border border-purple-500/10 hover:border-pink-500/20 transition-colors"
                            aria-expanded={isContributionsOpen}
                            aria-controls="contributions-list"
                          >
                            <div className="flex items-center">
                              <MessageSquare className="h-5 w-5 text-pink-400 mr-2" />
                              <h4 className="text-sm font-medium text-gray-200">Your Contributions</h4>
                            </div>
                            <ChevronRight 
                              className={`h-5 w-5 text-gray-400 transition-transform ${isContributionsOpen ? "rotate-90" : ""}`} 
                            />
                          </motion.button>
                          <AnimatePresence>
                            {isContributionsOpen && (
                              <motion.div
                                id="contributions-list"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-2 space-y-3">
                                  {discussion.filter(item => item.speaker === "User").map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="bg-[#15111e]/60 rounded-lg p-3 border border-purple-500/10 text-sm text-gray-300"
                                    >
                                      <p className="italic">"{item.text}"</p>
                                    </div>
                                  ))}
                                  {discussion.filter(item => item.speaker === "User").length === 0 && (
                                    <p className="text-sm text-gray-400 text-center py-4">
                                      No contributions recorded.
                                    </p>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Improvement Tips */}
                        <div className="bg-[#0f0f1a]/40 rounded-lg p-4 border border-purple-500/10">
                          <div className="flex items-center mb-3">
                            <Award className="h-5 w-5 text-pink-400 mr-2" />
                            <h4 className="text-sm font-medium text-gray-200">Tips for Improvement</h4>
                          </div>
                          <ul className="text-sm text-gray-300 list-disc pl-5 space-y-2">
                            <li>Try to structure your responses with clear points to enhance clarity.</li>
                            <li>Engage with others' points to show active participation.</li>
                            <li>Use examples or data to strengthen your arguments.</li>
                            <li>Practice concise delivery to maintain audience attention.</li>
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 mt-8">
                    <motion.button
                      onClick={restartGD}
                      whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(138,43,226,0.4)" }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full sm:flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium flex items-center justify-center text-sm shadow-lg shadow-purple-900/20"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </motion.button>
                    <motion.button
                      onClick={() => navigate("/dashboard")}
                      whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(236,72,153,0.4)" }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full sm:flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium flex items-center justify-center text-sm shadow-lg shadow-pink-900/20"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Dashboard
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Back to Dashboard Link */}
        <div className="mt-8 text-center">
          <motion.button
            onClick={() => navigate("/dashboard")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-gray-400 hover:text-pink-400 transition-colors text-sm inline-flex items-center"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </motion.button>
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
        toastClassName="bg-[#1a1025]/90 backdrop-blur-md border border-purple-500/20 text-white"
        progressClassName="bg-pink-500"
      />
    </div>
  );
}