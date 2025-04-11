import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import io from 'socket.io-client';

const socket = io('http://localhost:3000', { withCredentials: true });

function FeedbackForm() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [feedbacks, setFeedbacks] = useState({});

  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch(`http://localhost:3000/api/sessions/${sessionId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        const data = await response.json();
        if (response.ok) {
          setParticipants(data.participants);
          setFeedbacks(data.participants.reduce((acc, p) => ({ ...acc, [p._id]: { communication: 1, clarity: 1, comments: '' } }), {}));
        } else {
          toast.error(data.error || 'Failed to load session');
        }
      } catch (error) {
        toast.error('Failed to fetch session');
      }
    }
    fetchSession();
  }, [sessionId]);

  const handleFeedbackChange = (participantId, field, value) => {
    setFeedbacks(prev => ({ ...prev, [participantId]: { ...prev[participantId], [field]: field === 'comments' ? value : Number(value) } }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    const feedbackArray = Object.entries(feedbacks).map(([participantId, { communication, clarity, comments }]) => ({ sessionId, participantId, communication, clarity, comments }));
    try {
      const response = await fetch('http://localhost:3000/api/feedback/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(feedbackArray) });
      if (response.ok) {
        toast.success('Feedback submitted, session ended!');
        socket.emit('end-session', { sessionId }); // Notify room to close
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to submit feedback');
      }
    } catch (error) {
      toast.error('Failed to submit feedback');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8">
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6">
        <h1 className="text-3xl font-bold text-white text-center mb-8 bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent">Submit Feedback</h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          {participants.map(p => (
            <div key={p._id} className="space-y-6 border-b border-gray-700 pb-6">
              <h2 className="text-xl text-white">{p.name} ({p.email})</h2>
              <input value={p._id} disabled className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none" />
              <select value={feedbacks[p._id]?.communication} onChange={(e) => handleFeedbackChange(p._id, 'communication', e.target.value)} required className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300">
                <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option>
              </select>
              <select value={feedbacks[p._id]?.clarity} onChange={(e) => handleFeedbackChange(p._id, 'clarity', e.target.value)} required className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300">
                <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option>
              </select>
              <textarea value={feedbacks[p._id]?.comments} onChange={(e) => handleFeedbackChange(p._id, 'comments', e.target.value)} placeholder="Comments" className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300" />
            </div>
          ))}
          <button type="submit" className="w-full py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-semibold hover:from-gray-600 hover:to-gray-800 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg">Submit All</button>
        </form>
        <button onClick={() => navigate('/dashboard')} className="w-full mt-4 text-gray-300 hover:text-white transition-colors duration-300 text-sm">Back to Dashboard</button>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark" />
      </div>
    </div>
  );
}

export default FeedbackForm;