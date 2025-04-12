import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
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
} from 'recharts';

function MockDataAnalyticsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('interviews'); // interviews, group-discussions
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
        activeTab === 'interviews'
          ? `http://localhost:3000/api/ai-interview/history?page=${interviewPage}&limit=${itemsPerPage}`
          : `http://localhost:3000/api/mock-gd/history?page=${gdPage}&limit=${itemsPerPage}`;
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data.results)) {
        // Filter sessions with valid overallScores
        const validResults = data.results.filter(
          session => session.overallScores && Object.keys(session.overallScores).length === 5
        );
        activeTab === 'interviews'
          ? setInterviewData(validResults)
          : setGdData(validResults);
        if (validResults.length < data.results.length) {
          toast.warn('Some sessions were skipped due to incomplete data.');
        }
      } else {
        toast.error(data.error || 'Failed to fetch data');
      }
    } catch (error) {
      toast.error('Error fetching data');
    } finally {
      setIsLoading(false);
    }
  }

  function toggleSession(id) {
    setExpandedSession(expandedSession === id ? null : id);
  }

  function getTrendData(sessions) {
    return sessions.map((s, idx) => ({
      name: `Session ${sessions.length - idx}`,
      communication: s.overallScores.communication || 0,
      clarity: s.overallScores.clarity || 0,
      confidence: s.overallScores.confidence || 0,
      engagement: s.overallScores.engagement || 0,
      reasoning: s.overallScores.reasoning || 0,
    })).reverse();
  }

  function getRadarData(sessions) {
    if (!sessions.length) return [{ metric: 'Communication', value: 0 }, { metric: 'Clarity', value: 0 }, { metric: 'Confidence', value: 0 }, { metric: 'Engagement', value: 0 }, { metric: 'Reasoning', value: 0 }];
    const metrics = ['communication', 'clarity', 'confidence', 'engagement', 'reasoning'];
    return metrics.map(metric => ({
      metric: metric.charAt(0).toUpperCase() + metric.slice(1),
      value: sessions.reduce((sum, s) => sum + (s.overallScores[metric] || 0), 0) / sessions.length,
    }));
  }

  function getInsights(sessions) {
    if (!sessions.length) return { strengths: [], improvements: [] };
    const metrics = ['communication', 'clarity', 'confidence', 'engagement', 'reasoning'];
    const avgScores = metrics.map(metric => ({
      metric,
      avg: sessions.reduce((sum, s) => sum + (s.overallScores[metric] || 0), 0) / sessions.length,
    }));
    return {
      strengths: avgScores.filter(s => s.avg >= 4).map(s => s.metric),
      improvements: avgScores.filter(s => s.avg < 3).map(s => s.metric),
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
      <div key={session._id} className="bg-gray-800/50 rounded-lg p-4 mb-4 border border-gray-700 hover:bg-gray-800/70 transition-all duration-300">
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => toggleSession(session._id)}
        >
          <div>
            <p className="text-yellow-400 font-semibold">
              {type === 'interview' ? session.jobPosition || 'Untitled Interview' : session.topic || 'Untitled GD'}
            </p>
            <p className="text-gray-400 text-sm">
              {type === 'interview' ? session.experience || 'N/A' : session.hardnessLevel || 'N/A'} • {date}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['communication', 'clarity', 'confidence', 'engagement', 'reasoning'].map(metric => (
              <span
                key={metric}
                className={`text-sm ${
                  scores[metric] >= 4 ? 'text-green-400' :
                  scores[metric] === 3 ? 'text-yellow-400' : 'text-red-400'
                }`}
              >
                {metric.charAt(0).toUpperCase()}: {scores[metric]}/5
              </span>
            ))}
          </div>
        </div>
        {isExpanded && (
          <div className="mt-4 border-t border-gray-700 pt-4">
            {type === 'interview' ? (
              (session.results || []).map((item, idx) => (
                <div key={idx} className="mb-4">
                  <p className="text-white"><strong>Q{idx + 1}:</strong> {item.question || 'N/A'}</p>
                  <p className="text-gray-300"><strong>Answer:</strong> {item.answer || 'N/A'}</p>
                  <p className="text-gray-300"><strong>Feedback:</strong> {item.analysis || 'No feedback available'}</p>
                </div>
              ))
            ) : (
              (session.analysis || []).map((item, idx) => (
                <div key={idx} className="mb-4">
                  <p className="text-white"><strong>Turn {idx + 1}:</strong> {item.response || 'N/A'}</p>
                  <p className="text-gray-300"><strong>Feedback:</strong> {item.analysis || 'No feedback available'}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8">
      <div className="max-w-5xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6">
        <h1 className="text-3xl font-bold text-white text-center mb-8 bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent">
          Mock Data Analytics
        </h1>
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('interviews')}
            className={`py-2 px-4 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === 'interviews'
                ? 'bg-gradient-to-r from-yellow-600 to-yellow-800 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Mock Interviews
          </button>
          <button
            onClick={() => setActiveTab('group-discussions')}
            className={`py-2 px-4 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === 'group-discussions'
                ? 'bg-gradient-to-r from-yellow-600 to-yellow-800 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Group Discussions
          </button>
        </div>

        {/* Track Record Section */}
        <div className="mb-8">
          <h2 className="text-2xl text-white mb-4">Your Track Record</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Line Chart */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg text-white mb-2">Score Trends Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getTrendData(activeTab === 'interviews' ? interviewData : gdData)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                  <XAxis dataKey="name" stroke="#fff" />
                  <YAxis domain={[0, 5]} stroke="#fff" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ color: '#fff' }} />
                  <Line type="monotone" dataKey="communication" stroke="#4ade80" />
                  <Line type="monotone" dataKey="clarity" stroke="#facc15" />
                  <Line type="monotone" dataKey="confidence" stroke="#f87171" />
                  <Line type="monotone" dataKey="engagement" stroke="#60a5fa" />
                  <Line type="monotone" dataKey="reasoning" stroke="#a78bfa" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* Radial Chart */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg text-white mb-2">Average Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={getRadarData(activeTab === 'interviews' ? interviewData : gdData)}>
                  <PolarGrid stroke="#4b5563" />
                  <PolarAngleAxis dataKey="metric" stroke="#fff" />
                  <PolarRadiusAxis angle={90} domain={[0, 5]} stroke="#fff" />
                  <Radar
                    name="Performance"
                    dataKey="value"
                    stroke="#4ade80"
                    fill="#4ade80"
                    fillOpacity={0.6}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-white font-semibold">Strengths:</p>
                <ul className="text-gray-300">
                  {getInsights(activeTab === 'interviews' ? interviewData : gdData).strengths.map((s, idx) => (
                    <li key={idx}>• {s.charAt(0).toUpperCase() + s.slice(1)}</li>
                  ))}
                  {!getInsights(activeTab === 'interviews' ? interviewData : gdData).strengths.length && (
                    <li>• None yet, keep practicing!</li>
                  )}
                </ul>
              </div>
              <div>
                <p className="text-white font-semibold">Areas for Improvement:</p>
                <ul className="text-gray-300">
                  {getInsights(activeTab === 'interviews' ? interviewData : gdData).improvements.map((i, idx) => (
                    <li key={idx}>• {i.charAt(0).toUpperCase() + i.slice(1)}</li>
                  ))}
                  {!getInsights(activeTab === 'interviews' ? interviewData : gdData).improvements.length && (
                    <li>• Doing great, maintain consistency!</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Past Sessions Section */}
        <div>
          <h2 className="text-2xl text-white mb-4">Past Sessions</h2>
          {isLoading ? (
            <p className="text-white">Loading...</p>
          ) : activeTab === 'interviews' ? (
            interviewData.length ? (
              <>
                {interviewData.map(session => renderSession(session, 'interview'))}
                <div className="flex justify-between mt-4">
                  <button
                    onClick={() => setInterviewPage(p => Math.max(1, p - 1))}
                    disabled={interviewPage === 1}
                    className="py-2 px-4 bg-gray-700 text-white rounded-lg disabled:opacity-50 hover:bg-gray-600"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setInterviewPage(p => p + 1)}
                    disabled={interviewData.length < itemsPerPage}
                    className="py-2 px-4 bg-gray-700 text-white rounded-lg disabled:opacity-50 hover:bg-gray-600"
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <p className="text-gray-300">No interview sessions found. Start practicing!</p>
            )
          ) : (
            gdData.length ? (
              <>
                {gdData.map(session => renderSession(session, 'gd'))}
                <div className="flex justify-between mt-4">
                  <button
                    onClick={() => setGdPage(p => Math.max(1, p - 1))}
                    disabled={gdPage === 1}
                    className="py-2 px-4 bg-gray-700 text-white rounded-lg disabled:opacity-50 hover:bg-gray-600"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setGdPage(p => p + 1)}
                    disabled={gdData.length < itemsPerPage}
                    className="py-2 px-4 bg-gray-700 text-white rounded-lg disabled:opacity-50 hover:bg-gray-600"
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <p className="text-gray-300">No group discussion sessions found. Start practicing!</p>
            )
          )}
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full mt-6 text-gray-300 hover:text-white transition-colors duration-300 text-sm"
        >
          Back to Dashboard
        </button>
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
    </div>
  );
}

export default MockDataAnalyticsPage;