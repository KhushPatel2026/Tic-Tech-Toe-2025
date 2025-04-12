import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import { Mic, Send, RefreshCw, ArrowRight, HelpCircle } from "lucide-react";

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
      console.error("Error in handleJobSubmit:", error);
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
            console.error("Missing overallScores in final response:", data);
            throw new Error("Missing overall scores");
          }
        }
        setAnswerText("");
        setIsVoiceOn(false);
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        console.error("Server error response:", data);
        toast.error(data.details || data.error || "Failed to analyze answer");
      }
    } catch (error) {
      console.error("Error in handleAnswerSubmit:", error);
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
              <HelpCircle className="h-8 w-8 text-pink-500 mr-3" />
              <h1 className="text-2xl md:text-3xl font-bold text-center">
                AI Interview{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                  Prep
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
                onSubmit={handleJobSubmit}
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div>
                  <label className="text-sm text-gray-400">Job Position</label>
                  <input
                    value={jobPosition}
                    onChange={(e) => setJobPosition(e.target.value)}
                    type="text"
                    placeholder="e.g., Software Engineer"
                    required
                    className="w-full px-4 py-3 bg-[#0f0f1a]/60 border border-purple-500/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Job Description</label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Enter the job description"
                    required
                    className="w-full px-4 py-3 bg-[#0f0f1a]/60 border border-purple-500/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Experience Level</label>
                  <select
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-[#0f0f1a]/60 border border-purple-500/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                  >
                    <option value="Entry-Level">Entry-Level</option>
                    <option value="Mid-Level">Mid-Level</option>
                    <option value="Senior-Level">Senior-Level</option>
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
                  Start Interview
                </motion.button>
              </motion.form>
            )}

            {!isLoading && step === "questions" && (
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="w-full bg-[#1a1025]/50 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-pink-500 to-purple-500 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / 5) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                  Question {currentQuestionIndex + 1} of 5: {questions[currentQuestionIndex]}
                </p>
                <div>
                  <label className="text-sm text-gray-400">Your Answer</label>
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Type or speak your answer..."
                    className="w-full px-4 py-3 bg-[#0f0f1a]/60 border border-purple-500/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
                <div className="flex gap-2 mb-4">
                  {Array(5)
                    .fill()
                    .map((_, i) => (
                      <motion.button
                        key={i}
                        onClick={() => goToQuestion(i)}
                        disabled={i > currentQuestionIndex}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-3 py-1 rounded-full text-sm ${
                          i <= currentQuestionIndex
                            ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white"
                            : "bg-[#0f0f1a]/60 text-gray-400 border border-purple-500/10"
                        } disabled:opacity-50`}
                      >
                        {i + 1}
                      </motion.button>
                    ))}
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
                    onClick={handleAnswerSubmit}
                    disabled={isLoading}
                    whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(236,72,153,0.5)" }}
                    whileTap={{ scale: 0.95 }}
                    className="py-2 px-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg font-medium flex items-center justify-center disabled:opacity-50"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Answer
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
                  Analysis of Your Answers
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
                      <strong>Question {idx + 1}:</strong> {item.question}
                    </p>
                    <p className="text-white">
                      <strong>Your Answer:</strong> {item.answer}
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
                    onClick={restartInterview}
                    whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(138,43,226,0.5)" }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium flex items-center justify-center"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Restart Interview
                  </motion.button>
                  <motion.button
                    onClick={() => navigate("/dashboard")}
                    whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(236,72,153,0.5)" }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full px- Beginning of the code... px-6 py-3 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium flex items-center justify-center"
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