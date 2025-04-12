import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AIInterviewPrep() {
  const navigate = useNavigate();
  const [step, setStep] = useState('input');
  const [jobPosition, setJobPosition] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [experience, setExperience] = useState('Entry-Level');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [answerText, setAnswerText] = useState('');
  const [isVoiceOn, setIsVoiceOn] = useState(false);
  const [analysis, setAnalysis] = useState([]);
  const [overallScores, setOverallScores] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  let speechRecognition = null;

  useEffect(() => {
    if (!isVoiceOn || step !== 'questions') return;
    speechRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    speechRecognition.lang = 'en-US';
    speechRecognition.interimResults = false;
    speechRecognition.onresult = (event) => setAnswerText(event.results[0][0].transcript);
    speechRecognition.onerror = () => {
      const toastId = toast.error('Speech recognition error');
      setTimeout(() => {
        if (toast.isActive(toastId)) {
          toast.dismiss(toastId);
        }
      }, 3000);
    };
    speechRecognition.start();
    return () => speechRecognition?.stop();
  }, [isVoiceOn, step]);

  useEffect(() => {
    if (step !== 'analysis' || !analysis.length) return;
    async function saveResults() {
      try {
        const response = await fetch('http://localhost:3000/api/ai-interview/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ jobPosition, jobDescription, experience, results: analysis, overallScores }),
        });
        if (!response.ok) {
          const toastId = toast.error('Failed to save results');
          setTimeout(() => {
            if (toast.isActive(toastId)) {
              toast.dismiss(toastId);
            }
          }, 3000);
        }
      } catch (error) {
        const toastId = toast.error('Error saving results');
        setTimeout(() => toast.dismiss(toastId), 3000);
      }
    }
    saveResults();
  }, [step, analysis, overallScores, jobPosition, jobDescription, experience]);

  async function handleJobSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/ai-interview/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ jobPosition, jobDescription, experience }),
      });
      const data = await response.json();
      if (response.ok) {
        setQuestions(data.questions);
        setStep('questions');
      } else {
        const toastId = toast.error(data.error || 'Failed to generate questions');
        setTimeout(() => toast.dismiss(toastId), 3000);
      }
    } catch (error) {
      console.error('Error in handleJobSubmit:', error);
      const toastId = toast.error('Failed to generate questions');
      setTimeout(() => toast.dismiss(toastId), 3000);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAnswerSubmit() {
    if (!answerText) {
      const toastId = toast.error('Please provide an answer');
      setTimeout(() => toast.dismiss(toastId), 3000);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/ai-interview/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
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
          throw new Error('Invalid analysis response from server');
        }
        setAnswers((prev) => [...prev, answerText]);
        // Store the analysis for the current question
        setAnalysis((prev) => [
          ...prev,
          {
            question: data.analysis[0]?.question || questions[currentQuestionIndex],
            answer: data.analysis[0]?.answer || answerText,
            analysis: data.analysis[0]?.analysis || '',
          },
        ]);
        if (currentQuestionIndex === 4) {
          // For the last question, update all analyses with feedback and set scores
          if (data.overallScores) {
            setAnalysis(data.analysis);
            setOverallScores(data.overallScores);
            setStep('analysis');
          } else {
            console.error('Missing overallScores in final response:', data);
            throw new Error('Missing overall scores');
          }
        }
        setAnswerText('');
        setIsVoiceOn(false);
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        console.error('Server error response:', data);
        const toastId = toast.error(data.details || data.error || 'Failed to analyze answer');
        setTimeout(() => toast.dismiss(toastId), 3000);
      }
    } catch (error) {
      console.error('Error in handleAnswerSubmit:', error);
      const toastId = toast.error('Failed to analyze answer: ' + error.message);
      setTimeout(() => toast.dismiss(toastId), 3000);
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
      setAnswerText(answers[index] || '');
    }
  }

  function restartInterview() {
    setStep('input');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setAnswerText('');
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
        <h1 className="text-3xl font-bold text-white text-center mb-8 bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent">
          AI Interview Prep
        </h1>
        {step === 'input' && (
          <form onSubmit={handleJobSubmit} className="space-y-6">
            <input
              value={jobPosition}
              onChange={(e) => setJobPosition(e.target.value)}
              type="text"
              placeholder="Job Position (e.g., Software Engineer)"
              required
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Job Description"
              required
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <option value="Entry-Level">Entry-Level</option>
              <option value="Mid-Level">Mid-Level</option>
              <option value="Senior-Level">Senior-Level</option>
            </select>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-semibold hover:from-gray-600 hover:to-gray-800 transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? 'Generating...' : 'Start Interview'}
            </button>
          </form>
        )}
        {step === 'questions' && (
          <div className="space-y-6">
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-yellow-400 h-2.5 rounded-full"
                style={{ width: `${((currentQuestionIndex + 1) / 5) * 100}%` }}
              ></div>
            </div>
            <p className="text-yellow-400 text-xl">
              Question {currentQuestionIndex + 1} of 5: {questions[currentQuestionIndex]}
            </p>
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Type your answer or use voice"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
            <div className="flex gap-2 mb-4">
              {Array(5)
                .fill()
                .map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToQuestion(i)}
                    disabled={i > currentQuestionIndex}
                    className={`px-3 py-1 rounded-full text-sm ${
                      i <= currentQuestionIndex ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-gray-400'
                    } disabled:opacity-50`}
                  >
                    {i + 1}
                  </button>
                ))}
            </div>
            <div className="flex gap-4">
              <button
                onClick={toggleVoice}
                className="py-2 px-4 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-semibold hover:from-gray-600 hover:to-gray-800 transition-all duration-300"
              >
                {isVoiceOn ? 'Stop Voice' : 'Use Voice'}
              </button>
              <button
                onClick={handleAnswerSubmit}
                disabled={isLoading}
                className="py-2 px-4 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-semibold hover:from-gray-600 hover:to-gray-800 transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? 'Analyzing...' : 'Submit Answer'}
              </button>
            </div>
          </div>
        )}
        {step === 'analysis' && (
          <div className="space-y-6">
            <h2 className="text-2xl text-white">Analysis of Your Answers</h2>
            {analysis.map((item, idx) => (
              <div key={idx} className="border-b border-gray-700 pb-4">
                <p className="text-yellow-400">
                  <strong>Question {idx + 1}:</strong> {item.question}
                </p>
                <p className="text-white">
                  <strong>Your Answer:</strong> {item.answer}
                </p>
                <p className="text-white">
                  <strong>Feedback:</strong> {item.analysis}
                </p>
              </div>
            ))}
            {overallScores && (
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-xl text-white">Overall Scores</h3>
                <div className="grid grid-cols-2 gap-2 text-white">
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
              </div>
            )}
            <div className="flex gap-4">
              <button
                onClick={restartInterview}
                className="w-full py-3 bg-gradient-to-r from-yellow-600 to-yellow-800 text-white rounded-lg font-semibold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300"
              >
                Restart Interview
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
          limit={1}
        />
      </div>
    </div>
  );
}

export default AIInterviewPrep;