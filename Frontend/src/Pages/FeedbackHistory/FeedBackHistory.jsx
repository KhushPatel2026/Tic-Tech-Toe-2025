import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';

function FeedbackHistory() {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    async function fetchFeedback() {
      try {
        const response = await fetch(`http://localhost:3000/api/feedback/history/${user.id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        const data = await response.json();
        setFeedbacks(data);
      } catch (error) {
        toast.error('Failed to load feedback history');
      }
    }
    fetchFeedback();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8">
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6">
        <h1 className="text-3xl font-bold text-white mb-6 bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent">Feedback History</h1>
        <div className="space-y-4">
          {feedbacks.length === 0 && <p className="text-gray-400">No feedback available yet.</p>}
          {feedbacks.map(feedback => (
            <div key={feedback._id} className="p-4 bg-gray-800/50 rounded-lg">
              <p className="text-white">Session: {feedback.sessionId.topic}</p>
              <p className="text-white">Evaluator: {feedback.evaluatorId.name}</p>
              <p className="text-white">Communication: {feedback.communication}/5</p>
              <p className="text-white">Clarity: {feedback.clarity}/5</p>
              <p className="text-white">Comments: {feedback.comments || 'None'}</p>
              <p className="text-gray-400 text-sm">Received: {new Date(feedback.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
        <button onClick={() => navigate('/dashboard')} className="mt-6 py-2 px-4 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-semibold hover:from-gray-600 hover:to-gray-800 transition-all duration-300">Back to Dashboard</button>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark" />
      </div>
    </div>
  );
}

export default FeedbackHistory;