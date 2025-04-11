import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';

function Dashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    async function fetchSessions() {
      try {
        const response = await fetch('http://localhost:3000/api/sessions', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        const data = await response.json();
        setSessions(data);
      } catch (error) {
        toast.error('Failed to load sessions');
      }
    }
    fetchSessions();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8">
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6">
        <h1 className="text-3xl font-bold text-white mb-6">Dashboard - {user.role}</h1>
        {user.role === 'Moderator' && <button onClick={() => navigate('/create-session')} className="mb-6 py-2 px-4 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-semibold hover:from-gray-600 hover:to-gray-800 transition-all duration-300">Create Session</button>}
        <div className="space-y-4">
          {sessions.map(session => (
            <div key={session._id} className="p-4 bg-gray-800/50 rounded-lg flex justify-between items-center">
              <div>
                <h2 className="text-xl text-white">{session.topic}</h2>
                <p className="text-gray-400">Status: {session.status}</p>
              </div>
              <button onClick={() => navigate(`/session/${session._id}`)} className="py-2 px-4 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-semibold hover:from-gray-600 hover:to-gray-800 transition-all duration-300">Join</button>
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-4">
          <button onClick={() => navigate('/history')} className="py-2 px-4 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-semibold hover:from-gray-600 hover:to-gray-800 transition-all duration-300">Feedback History</button>
          <button onClick={() => navigate('/analytics')} className="py-2 px-4 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-semibold hover:from-gray-600 hover:to-gray-800 transition-all duration-300">Analytics</button>
          <button onClick={() => localStorage.clear() & navigate('/')} className="py-2 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all duration-300">Logout</button>
        </div>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark" />
      </div>
    </div>
  );
}

export default Dashboard;