import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';

function MockGD() {
  const navigate = useNavigate();
  const [step, setStep] = useState('input'); // input, discussion, analysis
  const [topicInput, setTopicInput] = useState('');
  const [hardnessLevel, setHardnessLevel] = useState('Easy');
  const [topic, setTopic] = useState('');
  const [discussion, setDiscussion] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [responseText, setResponseText] = useState('');
  const [isVoiceOn, setIsVoiceOn] = useState(false);
  const [analysis, setAnalysis] = useState([]);
  const [overallScores, setOverallScores] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  let speechRecognition = null;

  useEffect(() => {
    if (!isVoiceOn || step !== 'discussion') return;
    speechRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    speechRecognition.lang = 'en-US';
    speechRecognition.interimResults = false;
    speechRecognition.onresult = (event) => setResponseText(event.results[0][0].transcript);
    speechRecognition.onerror = () => toast.error('Speech recognition error');
    speechRecognition.start();
    return () => speechRecognition?.stop();
  }, [isVoiceOn, step]);

  useEffect(() => {
    if (step !== 'analysis' || !analysis.length) return;
    async function saveResults() {
      try {
        const response = await fetch('http://localhost:3000/api/mock-gd/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ topic, hardnessLevel, discussion, analysis, overallScores }),
        });
        if (!response.ok) toast.error('Failed to save results');
      } catch (error) {
        toast.error('Error saving results');
      }
    }
    saveResults();
  }, [step, analysis, overallScores, topic, hardnessLevel, discussion]);

  async function handleTopicSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/mock-gd/topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ topic: topicInput, hardnessLevel }),
      });
      const data = await response.json();
      if (response.ok) {
        setTopic(data.topic);
        setStep('discussion');
      } else {
        toast.error(data.error || 'Failed to generate topic');
      }
    } catch (error) {
      toast.error('Failed to generate topic');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResponseSubmit() {
    if (!responseText) return toast.error('Please provide a response');
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/mock-gd/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ topic, hardnessLevel, discussion, userResponse: responseText, turn: currentTurn }),
      });
      const data = await response.json();
      if (response.ok) {
        setDiscussion(prev => [...prev, { speaker: 'User', text: responseText }, ...data.aiResponses]);
        setResponseText('');
        setIsVoiceOn(false);
        setCurrentTurn(prev => prev + 1);
        if (data.analysis) setAnalysis(data.analysis);
        if (data.overallScores) setOverallScores(data.overallScores);
        if (currentTurn === 4) setStep('analysis');
      } else {
        toast.error(data.error || 'Failed to process response');
      }
    } catch (error) {
      toast.error('Failed to process response');
    } finally {
      setIsLoading(false);
    }
  }

  function toggleVoice() {
    setIsVoiceOn(prev => !prev);
  }

  function restartGD() {
    setStep('input');
    setTopic('');
    setTopicInput('');
    setHardnessLevel('Easy');
    setDiscussion([]);
    setCurrentTurn(0);
    setResponseText('');
    setAnalysis([]);
    setOverallScores(null);
  }

  const getScoreColor = (score) => {
    if (score >= 4) return 'text-green-400';
    if (score === 3) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8">
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6">
        <h1 className="text-3xl font-bold text-white text-center mb-8 bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent">Mock Group Discussion</h1>
        {step === 'input' && (
          <form onSubmit={handleTopicSubmit} className="space-y-6">
            <input
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              type="text"
              placeholder="Enter discussion topic (e.g., Impact of AI in marketing)"
              required
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
            <select
              value={hardnessLevel}
              onChange={(e) => setHardnessLevel(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
              <option value="Expert">Expert</option>
            </select>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-semibold hover:from-gray-600 hover:to-gray-800 transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? 'Generating...' : 'Start Discussion'}
            </button>
          </form>
        )}
        {step === 'discussion' && (
          <div className="space-y-6">
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${((currentTurn + 1) / 5) * 100}%` }}></div>
            </div>
            <p className="text-yellow-400 text-xl">Topic: {topic}</p>
            <div className="max-h-64 overflow-y-auto space-y-4">
              {discussion.map((item, idx) => (
                <div key={idx} className={`p-3 rounded-lg ${item.speaker === 'User' ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-300'}`}>
                  <strong>{item.speaker}:</strong> {item.text}
                </div>
              ))}
            </div>
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Your response"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
            <div className="flex gap-4">
              <button
                onClick={toggleVoice}
                className="py-2 px-4 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-semibold hover:from-gray-600 hover:to-gray-800 transition-all duration-300"
              >
                {isVoiceOn ? 'Stop Voice' : 'Use Voice'}
              </button>
              <button
                onClick={handleResponseSubmit}
                disabled={isLoading}
                className="py-2 px-4 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-semibold hover:from-gray-600 hover:to-gray-800 transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Submit Response'}
              </button>
            </div>
          </div>
        )}
        {step === 'analysis' && (
          <div className="space-y-6">
            <h2 className="text-2xl text-white">Analysis of Your Contributions</h2>
            {analysis.map((item, idx) => (
              <div key={idx} className="border-b border-gray-700 pb-4">
                <p className="text-yellow-400"><strong>Turn {idx + 1}:</strong> {item.response}</p>
                <p className="text-white"><strong>Feedback:</strong> {item.analysis}</p>
              </div>
            ))}
            {overallScores && (
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-xl text-white">Overall Scores</h3>
                <div className="grid grid-cols-2 gap-2 text-white">
                  <p className={getScoreColor(overallScores.communication)}><strong>Communication:</strong> {overallScores.communication}/5</p>
                  <p className={getScoreColor(overallScores.clarity)}><strong>Clarity:</strong> {overallScores.clarity}/5</p>
                  <p className={getScoreColor(overallScores.confidence)}><strong>Confidence:</strong> {overallScores.confidence}/5</p>
                  <p className={getScoreColor(overallScores.engagement)}><strong>Engagement:</strong> {overallScores.engagement}/5</p>
                  <p className={getScoreColor(overallScores.reasoning)}><strong>Reasoning:</strong> {overallScores.reasoning}/5</p>
                </div>
              </div>
            )}
            <div className="flex gap-4">
              <button
                onClick={restartGD}
                className="w-full py-3 bg-gradient-to-r from-yellow-600 to-yellow-800 text-white rounded-lg font-semibold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300"
              >
                Restart Discussion
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-semibold hover:from-gray-600 hover:to-gray-800 transition-all duration-300"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full mt-4 text-gray-300 hover:text-white transition-colors duration-300 text-sm"
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

export default MockGD;