import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { motion } from "framer-motion";
import { BarChart2, ChevronLeft, ChevronRight, ArrowRight, Users, Mic } from "lucide-react";

export default function MockDataAnalyticsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("interviews");
  const [interviewData, setInterviewData] = useState([]);
  const [gdData, setGdData] = useState([]);
  const [interviewPage, setInterviewPage] = useState(1);
  const [gdPage, setGdPage] = useState(1);
  const [expandedSession, setExpandedSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchData();
  }, [activeTab, interviewPage, gdPage]);

  async function fetchData() {
    setIsLoading(true);
    try {
      const endpoint =
        activeTab === "interviews"
          ? `http://localhost:3000/api/ai-interview/history?page=${interviewPage}&limit=${itemsPerPage}`
          : `http://localhost:3000/api/mock-gd/history?page=${gdPage}&limit=${itemsPerPage}`;
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data.results)) {
        const validResults = data.results.filter(
          (session) => session.overallScores && Object.keys(session.overallScores).length === 5
        );
        activeTab === "interviews" ? setInterviewData(validResults) : setGdData(validResults);
        if (validResults.length < data.results.length) {
          toast.warn("Some sessions were skipped due to incomplete data.");
        }
      } else {
        toast.error(data.error || "Failed to fetch data");
      }
    } catch (error) {
      toast.error("Error fetching data");
    } finally {
      setIsLoading(false);
    }
  }

  function toggleSession(id) {
    setExpandedSession(expandedSession === id ? null : id);
  }

  function getTrendData(sessions) {
    return sessions
      .map((s, idx) => ({
        name: `Session ${sessions.length - idx}`,
        communication: s.overallScores.communication || 0,
        clarity: s.overallScores.clarity || 0,
        confidence: s.overallScores.confidence || 0,
        engagement: s.overallScores.engagement || 0,
        reasoning: s.overallScores.reasoning || 0,
      }))
      .reverse();
  }

  function getRadarData(sessions) {
    if (!sessions.length)
      return [
        { metric: "Communication", value: 0 },
        { metric: "Clarity", value: 0 },
        { metric: "Confidence", value: 0 },
        { metric: "Engagement", value: 0 },
        { metric: "Reasoning", value: 0 },
      ];
    const metrics = ["communication", "clarity", "confidence", "engagement", "reasoning"];
    return metrics.map((metric) => ({
      metric: metric.charAt(0).toUpperCase() + metric.slice(1),
      value: sessions.reduce((sum, s) => sum + (s.overallScores[metric] || 0), 0) / sessions.length,
    }));
  }

  function getInsights(sessions) {
    if (!sessions.length) return { strengths: [], improvements: [] };
    const metrics = ["communication", "clarity", "confidence", "engagement", "reasoning"];
    const avgScores = metrics.map((metric) => ({
      metric,
      avg: sessions.reduce((sum, s) => sum + (s.overallScores[metric] || 0), 0) / sessions.length,
    }));
    return {
      strengths: avgScores.filter((s) => s.avg >= 4).map((s) => s.metric),
      improvements: avgScores.filter((s) => s.avg < 3).map((s) => s.metric),
    };
  }

  function renderSession(session, type) {
    const isExpanded = expandedSession === session._id;
    const date = new Date(session.createdAt).toLocaleDateString();
    const scores = session.overallScores || {
      communication: 0,
      clarity: 0,
      confidence: 0,
      engagement: 0,
      reasoning: 0,
    };
    return (
      <motion.div
        key={session._id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-[#0f0f1a]/60 rounded-lg p-4 mb-4 border border-purple-500/10 hover:bg-[#1a1025]/50 transition-all duration-300"
      >
        <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSession(session._id)}>
          <div>
            <p className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
              {type === "interview" ? session.jobPosition || "Untitled Interview" : session.topic || "Untitled GD"}
            </p>
            <p className="text-gray-400 text-sm">
              {type === "interview" ? session.experience || "N/A" : session.hardnessLevel || "N/A"} • {date}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {["communication", "clarity", "confidence", "engagement", "reasoning"].map((metric) => (
              <span
                key={metric}
                className={`text-sm ${
                  scores[metric] >= 4
                    ? "text-green-400"
                    : scores[metric] === 3
                    ? "text-pink-400"
                    : "text-red-400"
                }`}
              >
                {metric.charAt(0).toUpperCase()}: {scores[metric]}/5
              </span>
            ))}
          </div>
        </div>
        {isExpanded && (
          <div className="mt-4 border-t border-purple-500/20 pt-4">
            {type === "interview" ? (
              (session.results || []).map((item, idx) => (
                <div key={idx} className="mb-4">
                  <p className="text-white">
                    <strong>Q{idx + 1}:</strong> {item.question || "N/A"}
                  </p>
                  <p className="text-gray-300">
                    <strong>Answer:</strong> {item.answer || "N/A"}
                  </p>
                  <p className="text-gray-300">
                    <strong>Feedback:</strong> {item.analysis || "No feedback available"}
                  </p>
                </div>
              ))
            ) : (
              (session.analysis || []).map((item, idx) => (
                <div key={idx} className="mb-4">
                  <p className="text-white">
                    <strong>Turn {idx + 1}:</strong> {item.response || "N/A"}
                  </p>
                  <p className="text-gray-300">
                    <strong>Feedback:</strong> {item.analysis || "No feedback available"}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </motion.div>
    );
  }

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
          className="max-w-6xl mx-auto bg-gradient-to-tr from-[#1a0b25]/80 to-[#2a1040]/80 backdrop-blur-md p-1 rounded-2xl overflow-hidden"
        >
          <div className="bg-[#0f0f1a]/60 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-purple-500/20">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center justify-center mb-8"
            >
              <BarChart2 className="h-8 w-8 text-pink-500 mr-3" />
              <h1 className="text-2xl md:text-3xl font-bold text-center">
                Mock Data{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                  Analytics
                </span>
              </h1>
            </motion.div>

            {/* Tabs */}
            <motion.div
              className="flex gap-4 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <motion.button
                onClick={() => setActiveTab("interviews")}
                whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(236,72,153,0.5)" }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center py-2 px-4 rounded-lg font-semibold transition-all duration-300 ${
                  activeTab === "interviews"
                    ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white"
                    : "bg-[#0f0f1a]/60 text-gray-400 border border-purple-500/10 hover:bg-[#1a1025]/50"
                }`}
              >
                <Mic className="h-4 w-4 mr-2" />
                Mock Interviews
              </motion.button>
              <motion.button
                onClick={() => setActiveTab("group-discussions")}
                whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(236,72,153,0.5)" }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center py-2 px-4 rounded-lg font-semibold transition-all duration-300 ${
                  activeTab === "group-discussions"
                    ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white"
                    : "bg-[#0f0f1a]/60 text-gray-400 border border-purple-500/10 hover:bg-[#1a1025]/50"
                }`}
              >
                <Users className="h-4 w-4 mr-2" />
                Group Discussions
              </motion.button>
            </motion.div>

            {/* Track Record Section */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400 mb-4">
                Your Track Record
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Line Chart */}
                <motion.div
                  className="bg-[#1a1025]/50 backdrop-blur-sm rounded-lg p-4 border border-purple-500/10"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  <h3 className="text-lg text-white mb-2">Score Trends Over Time</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getTrendData(activeTab === "interviews" ? interviewData : gdData)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                      <XAxis dataKey="name" stroke="#fff" />
                      <YAxis domain={[0, 5]} stroke="#fff" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a1025",
                          border: "none",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                      <Legend wrapperStyle={{ color: "#fff" }} />
                      <Line type="monotone" dataKey="communication" stroke="#ec4899" />
                      <Line type="monotone" dataKey="clarity" stroke="#a855f7" />
                      <Line type="monotone" dataKey="confidence" stroke="#8b5cf6" />
                      <Line type="monotone" dataKey="engagement" stroke="#d946ef" />
                      <Line type="monotone" dataKey="reasoning" stroke="#f472b6" />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>
                {/* Radar Chart */}
                <motion.div
                  className="bg-[#1a1025]/50 backdrop-blur-sm rounded-lg p-4 border border-purple-500/10"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                >
                  <h3 className="text-lg text-white mb-2">Average Performance</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={getRadarData(activeTab === "interviews" ? interviewData : gdData)}>
                      <PolarGrid stroke="#4b5563" />
                      <PolarAngleAxis dataKey="metric" stroke="#fff" />
                      <PolarRadiusAxis angle={90} domain={[0, 5]} stroke="#fff" />
                      <Radar
                        name="Performance"
                        dataKey="value"
                        stroke="#ec4899"
                        fill="#ec4899"
                        fillOpacity={0.6}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a1025",
                          border: "none",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>
              {/* Insights */}
              <motion.div
                className="bg-[#1a1025]/50 backdrop-blur-sm rounded-lg p-4 mt-4 border border-purple-500/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-white font-semibold">Strengths:</p>
                    <ul className="text-gray-300">
                      {getInsights(activeTab === "interviews" ? interviewData : gdData).strengths.map(
                        (s, idx) => (
                          <li key={idx}>• {s.charAt(0).toUpperCase() + s.slice(1)}</li>
                        )
                      )}
                      {!getInsights(activeTab === "interviews" ? interviewData : gdData).strengths.length && (
                        <li>• None yet, keep practicing!</li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Areas for Improvement:</p>
                    <ul className="text-gray-300">
                      {getInsights(activeTab === "interviews" ? interviewData : gdData).improvements.map(
                        (i, idx) => (
                          <li key={idx}>• {i.charAt(0).toUpperCase() + i.slice(1)}</li>
                        )
                      )}
                      {!getInsights(activeTab === "interviews" ? interviewData : gdData).improvements.length && (
                        <li>• Doing great, maintain consistency!</li>
                      )}
                    </ul>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Past Sessions Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <h2 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400 mb-4">
                Past Sessions
              </h2>
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
                </div>
              ) : activeTab === "interviews" ? (
                interviewData.length ? (
                  <>
                    {interviewData.map((session) => renderSession(session, "interview"))}
                    <div className="flex justify-between mt-4">
                      <motion.button
                        onClick={() => setInterviewPage((p) => Math.max(1, p - 1))}
                        disabled={interviewPage === 1}
                        whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(236,72,153,0.5)" }}
                        whileTap={{ scale: 0.95 }}
                        className="py-2 px-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg disabled:opacity-50"
                      >
                        <ChevronLeft className="h-4 w-4 mr-2 inline" />
                        Previous
                      </motion.button>
                      <motion.button
                        onClick={() => setInterviewPage((p) => p + 1)}
                        disabled={interviewData.length < itemsPerPage}
                        whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(236,72,153,0.5)" }}
                        whileTap={{ scale: 0.95 }}
                        className="py-2 px-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg disabled:opacity-50"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-2 inline" />
                      </motion.button>
                    </div>
                  </>
                ) : (
                  <motion.div
                    className="bg-[#1a1025]/50 backdrop-blur-sm rounded-xl p-8 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <p className="text-gray-400">No interview sessions found. Start practicing!</p>
                  </motion.div>
                )
              ) : (
                gdData.length ? (
                  <>
                    {gdData.map((session) => renderSession(session, "gd"))}
                    <div className="flex justify-between mt-4">
                      <motion.button
                        onClick={() => setGdPage((p) => Math.max(1, p - 1))}
                        disabled={gdPage === 1}
                        whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(236,72,153,0.5)" }}
                        whileTap={{ scale: 0.95 }}
                        className="py-2 px-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg disabled:opacity-50"
                      >
                        <ChevronLeft className="h-4 w-4 mr-2 inline" />
                        Previous
                      </motion.button>
                      <motion.button
                        onClick={() => setGdPage((p) => p + 1)}
                        disabled={gdData.length < itemsPerPage}
                        whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(236,72,153,0.5)" }}
                        whileTap={{ scale: 0.95 }}
                        className="py-2 px-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg disabled:opacity-50"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-2 inline" />
                      </motion.button>
                    </div>
                  </>
                ) : (
                  <motion.div
                    className="bg-[#1a1025]/50 backdrop-blur-sm rounded-xl p-8 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <p className="text-gray-400">No group discussion sessions found. Start practicing!</p>
                  </motion.div>
                )
              )}
            </motion.div>

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