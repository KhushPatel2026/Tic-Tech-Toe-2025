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
  FileText, 
  Trophy, 
  Edit, 
  CheckCircle, 
  ChevronRight,
  Brain
} from "lucide-react";

export default function AIInterviewPrep() {
  const navigate = useNavigate();
  const [step, setStep] = useState("input");
  const [jobPosition, setJobPosition] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [experience, setExperience] = useState("Entry-Level");
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [answerText, setAnswerText] = useState("");
  const [isVoiceOn, setIsVoiceOn] = useState(false);
  const [analysis, setAnalysis] = useState([]);
  const [overallScores, setOverallScores] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  let speechRecognition = null;

  useEffect(() => {
    if (!isVoiceOn || step !== "questions") return;
    speechRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    speechRecognition.lang = "en-US";
    speechRecognition.interimResults = false;
    speechRecognition.onresult = (event) => setAnswerText(event.results[0][0].transcript);
    speechRecognition.onerror = () => toast.error("Speech recognition error");
    speechRecognition.start();
    return () => speechRecognition?.stop();
  }, [isVoiceOn, step]);

  useEffect(() => {
    if (step !== "analysis" || !analysis.length) return;
    async function saveResults() {
      try {
        const response = await fetch("http://localhost:3000/api/ai-interview/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ jobPosition, jobDescription, experience, results: analysis, overallScores }),
        });
        if (!response.ok) toast.error("Failed to save results");
      } catch (error) {
        toast.error("Error saving results");
      }
    }
    saveResults();
  }, [step, analysis, overallScores, jobPosition, jobDescription, experience]);

  async function handleJobSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/ai-interview/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ jobPosition, jobDescription, experience }),
      });
      const data = await response.json();
      if (response.ok) {
        setQuestions(data.questions);
        setStep("questions");
      } else {
        toast.error(data.error || "Failed to generate questions");
      }
    } catch (error) {
      toast.error("Failed to generate questions");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAnswerSubmit() {
    if (!answerText) {
      toast.error("Please provide an answer");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/ai-interview/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          jobPosition,
          experience,
          question: questions[currentQuestionIndex],
          answer: answerText,
          isLast: currentQuestionIndex === 4,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        if (!data.analysis || !Array.isArray(data.analysis) || data.analysis.length === 0) {
          throw new Error("Invalid analysis response from server");
        }
        setAnswers((prev) => [...prev, answerText]);
        setAnalysis((prev) => [
          ...prev,
          {
            question: data.analysis[0]?.question || questions[currentQuestionIndex],
            answer: data.analysis[0]?.answer || answerText,
            analysis: data.analysis[0]?.analysis || "",
          },
        ]);
        if (currentQuestionIndex === 4) {
          if (data.overallScores) {
            setAnalysis(data.analysis);
            setOverallScores(data.overallScores);
            setStep("analysis");
          } else {
            throw new Error("Missing overall scores");
          }
        }
        setAnswerText("");
        setIsVoiceOn(false);
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        toast.error(data.details || data.error || "Failed to analyze answer");
      }
    } catch (error) {
      toast.error("Failed to analyze answer: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }

  function toggleVoice() {
    setIsVoiceOn((prev) => !prev);
  }

  function goToQuestion(index) {
    if (index >= 0 && index < 5 && index <= currentQuestionIndex) {
      setCurrentQuestionIndex(index);
      setAnswerText(answers[index] || "");
    }
  }

  function restartInterview() {
    setStep("input");
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setAnswerText("");
    setAnalysis([]);
    setOverallScores(null);
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

  const fadeAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
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
                Interview Assistant
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
            <div className="flex items-center mb-6 text-sm text-gray-400">
              <span className={`${step === "input" ? "text-pink-400 font-medium" : ""}`}>
                Job Details
              </span>
              <ChevronRight className="h-4 w-4 mx-2" />
              <span className={`${step === "questions" ? "text-pink-400 font-medium" : ""}`}>
                Questions
              </span>
              <ChevronRight className="h-4 w-4 mx-2" />
              <span className={`${step === "analysis" ? "text-pink-400 font-medium" : ""}`}>
                Analysis
              </span>
            </div>

            {/* Loading Spinner */}
            {isLoading && (
              <div className="flex justify-center items-center py-20">
                <div className="w-16 h-16 border-4 border-purple-500/30 border-t-pink-500 rounded-full animate-spin"></div>
              </div>
            )}

            {/* Content Sections with AnimatePresence */}
            <AnimatePresence mode="wait">
              {/* Step 1: Input Job Details */}
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
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                      Prepare for Your Interview
                    </h2>
                    <p className="text-gray-400 max-w-lg mx-auto mt-2">
                      Enter job details to generate tailored interview questions and enhance your preparation.
                    </p>
                  </div>

                  <form onSubmit={handleJobSubmit} className="space-y-6 max-w-md mx-auto">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-300">
                          Job Position
                        </label>
                        <span className="text-xs text-gray-400">Required</span>
                      </div>
                      <input
                        value={jobPosition}
                        onChange={(e) => setJobPosition(e.target.value)}
                        type="text"
                        placeholder="e.g., Software Engineer, Product Manager"
                        required
                        className="w-full px-4 py-3 bg-[#15111e]/80 border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-all duration-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-300">
                          Job Description
                        </label>
                        <span className="text-xs text-gray-400">Required</span>
                      </div>
                      <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the job description here"
                        required
                        rows={5}
                        className="w-full px-4 py-3 bg-[#15111e]/80 border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-all duration-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">
                        Experience Level
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {["Entry-Level", "Mid-Level", "Senior-Level"].map(
                          (level) => (
                            <button
                              key={level}
                              type="button"
                              onClick={() => setExperience(level)}
                              className={`py-2 px-3 rounded-lg text-sm font-medium transition duration-300 ${
                                experience === level
                                  ? "bg-gradient-to-r from-pink-600/80 to-purple-600/80 border-none text-white shadow-lg shadow-pink-600/20"
                                  : "bg-[#15111e]/60 border border-purple-500/20 text-gray-300 hover:border-pink-500/40"
                              }`}
                            >
                              {level}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{
                        scale: 1.02,
                        boxShadow: "0 0 15px rgba(236,72,153,0.4)",
                      }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium flex items-center justify-center disabled:opacity-50 shadow-lg shadow-pink-900/20"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Generate Interview Questions
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {/* Step 2: Questions */}
              {!isLoading && step === "questions" && (
                <motion.div
                  key="questions"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={fadeAnimation}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">
                        Current Job Position
                      </div>
                      <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                        {jobPosition}
                      </h2>
                    </div>
                    <div className="text-xs text-gray-400">
                      Question {currentQuestionIndex + 1} of 5
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#1a1025]/50 rounded-full h-2 mb-6">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-in-out"
                      style={{ width: `${((currentQuestionIndex + 1) / 5) * 100}%` }}
                    ></div>
                  </div>

                  {/* Question Card */}
                  <div className="bg-[#15111e]/60 rounded-xl p-4 border border-purple-500/10 mb-4">
                    <p className="text-lg md:text-xl font-medium text-gray-200 leading-relaxed">
                      {questions[currentQuestionIndex]}
                    </p>
                  </div>

                  {/* Answer Input */}
                  <div className="bg-[#15111e]/60 rounded-xl p-4 border border-purple-500/10">
                    <div className="mb-2 flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-300">
                        Your Answer
                      </label>
                      <div className="text-xs text-gray-400">
                        {answerText.length} characters
                      </div>
                    </div>
                    <textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Type your answer or use voice input..."
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
                            <Mic className="h-4 w-4 mr-2" />
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
                        onClick={handleAnswerSubmit}
                        disabled={isLoading || !answerText.trim()}
                        whileHover={{
                          scale: 1.02,
                          boxShadow: "0 0 15px rgba(236,72,153,0.4)",
                        }}
                        whileTap={{ scale: 0.98 }}
                        className="py-2 px-6 flex-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg shadow-pink-900/20"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Submit Answer
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
                      Your Interview Performance
                    </h2>
                    <p className="text-gray-400 max-w-lg mx-auto mt-2">
                      Review your answers and get detailed feedback to improve your interview skills.
                    </p>
                  </div>

                  {/* Overall Scores */}
                  {overallScores && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-[#15111e]/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/10 mb-6"
                    >
                      <div className="flex items-center mb-6">
                        <CheckCircle className="h-5 w-5 text-pink-400 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-200">
                          Performance Metrics
                        </h3>
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
                              <h4 className="text-sm font-medium text-gray-300 capitalize">
                                {key}
                              </h4>
                              <div
                                className={`text-lg font-bold ${getScoreColor(
                                  score
                                )}`}
                              >
                                {score}/5
                              </div>
                            </div>
                            <div className="w-full bg-[#1a1025]/50 rounded-full h-2 mb-1">
                              <div
                                className={`${
                                  score >= 4
                                    ? "bg-green-400"
                                    : score === 3
                                    ? "bg-yellow-400"
                                    : "bg-red-400"
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

                  {/* Question-by-Question Feedback */}
                  <div className="space-y-4">
                    <div className="flex items-center mb-4">
                      <Trophy className="h-5 w-5 text-pink-400 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-200">
                        Detailed Feedback
                      </h3>
                    </div>
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
                          <h3 className="font-medium text-gray-200">
                            Question {idx + 1}
                          </h3>
                        </div>
                        <div className="pl-8 border-l border-purple-500/20 mb-4">
                          <p className="text-gray-300 text-sm italic mb-2">
                            "{item.question}"
                          </p>
                          <p className="text-gray-300 text-sm italic">
                            Your Answer: "{item.answer}"
                          </p>
                        </div>
                        <div className="bg-[#0f0f1a]/40 rounded-lg p-4 border border-purple-500/10">
                          <div className="flex items-center mb-2">
                            <Brain className="h-4 w-4 text-purple-400 mr-2" />
                            <h4 className="text-sm font-medium text-purple-400">
                              Feedback
                            </h4>
                          </div>
                          <p className="text-sm text-gray-300">
                            {item.analysis}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 mt-8">
                    <motion.button
                      onClick={restartInterview}
                      whileHover={{
                        scale: 1.02,
                        boxShadow: "0 0 15px rgba(138,43,226,0.4)",
                      }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full sm:flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium flex items-center justify-center text-sm shadow-lg shadow-purple-900/20"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </motion.button>
                    <motion.button
                      onClick={() => navigate("/dashboard")}
                      whileHover={{
                        scale: 1.02,
                        boxShadow: "0 0 15px rgba(236,72,153,0.4)",
                      }}
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