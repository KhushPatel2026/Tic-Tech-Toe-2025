import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';

function Analytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch(`http://localhost:3000/api/feedback/analytics/${user.id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        toast.error('Failed to load analytics');
      }
    }
    fetchAnalytics();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8">
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6">
        <h1 className="text-3xl font-bold text-white mb-6">Performance Analytics</h1>
        {analytics && (
          <div className="space-y-4">
            <p className="text-white">Average Communication: {analytics.averageCommunication.toFixed(2)}</p>
            <p className="text-white">Average Clarity: {analytics.averageClarity.toFixed(2)}</p>
            <p className="text-white">Total Sessions: {analytics.totalSessions}</p>
            <div className="mt-4">
              <h2 className="text-xl text-white mb-2">Trends</h2>
              {analytics.trend.map((t, idx) => (
                <div key={idx} className="p-2 bg-gray-800/50 rounded-lg text-white">Session: {t.sessionId} | Comm: {t.communication} | Clarity: {t.clarity} | {new Date(t.createdAt).toLocaleDateString()}</div>
              ))}
            </div>
          </div>
        )}
        <button onClick={() => navigate('/dashboard')} className="mt-6 py-2 px-4 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-semibold hover:from-gray-600 hover:to-gray-800 transition-all duration-300">Back to Dashboard</button>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark" />
      </div>
    </div>
  );
}

export default Analytics;