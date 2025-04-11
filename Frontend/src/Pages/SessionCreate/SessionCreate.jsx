import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';

function SessionCreate() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('');
  const [participantEmails, setParticipantEmails] = useState('');
  const [evaluatorEmails, setEvaluatorEmails] = useState('');
  const [isAIPractice, setIsAIPractice] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const body = {
      topic,
      duration: Number(duration),
      participantEmails: participantEmails ? participantEmails.split(',').map(email => email.trim()) : [],
      evaluatorEmails: evaluatorEmails ? evaluatorEmails.split(',').map(email => email.trim()) : [],
      isAIPractice,
    };
    try {
      const response = await fetch('http://localhost:3000/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(body) });
      const data = await response.json();
      if (response.ok) {
        toast.success('Session created successfully!');
        setTimeout(() => navigate(`/session/${data._id}`), 1500);
      } else {
        toast.error(data.error || 'Failed to create session');
      }
    } catch (error) {
      toast.error('Failed to create session');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="w-full max-w-md p-8 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20">
        <h1 className="text-3xl font-bold text-white text-center mb-8 bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent">Create Session</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input value={topic} onChange={(e) => setTopic(e.target.value)} type="text" placeholder="Topic" required className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300" />
          <input value={duration} onChange={(e) => setDuration(e.target.value)} type="number" placeholder="Duration (minutes)" required className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300" />
          <input value={participantEmails} onChange={(e) => setParticipantEmails(e.target.value)} type="text" placeholder="Participant Emails (comma-separated)" className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300" />
          <input value={evaluatorEmails} onChange={(e) => setEvaluatorEmails(e.target.value)} type="text" placeholder="Evaluator Emails (comma-separated)" className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300" />
          <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={isAIPractice} onChange={(e) => setIsAIPractice(e.target.checked)} className="w-5 h-5" />AI Practice Session</label>
          <button type="submit" className="w-full py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-semibold hover:from-gray-600 hover:to-gray-800 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg">Create</button>
        </form>
        <button onClick={() => navigate('/dashboard')} className="w-full mt-4 text-gray-300 hover:text-white transition-colors duration-300 text-sm">Back to Dashboard</button>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark" />
      </div>
    </div>
  );
}

export default SessionCreate;