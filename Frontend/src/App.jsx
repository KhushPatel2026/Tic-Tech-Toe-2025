import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthComponent from './Pages/Authentication/Authentication';
import Dashboard from './Pages/Dashboard/Dashboard';
import LandingPage from './Pages/LandingPage/LandingPage';
import SessionCreate from './Pages/SessionCreate/SessionCreate';
import SessionRoom from './Pages/SessionRoom/SessionRoom';
import FeedbackForm from './Pages/FeedbackForm/feedbackForm';
import FeedbackHistory from './Pages/FeedbackHistory/FeedBackHistory';
import Analytics from './Pages/Analytics/Analytics';
import AIInterviewPrep from './Pages/AIInterview/AiInterview';
import MockGD from './Pages/MockGD/MockGD';
import MockDataAnalyticsPage from './Pages/MockAnalytics/MockAnalytics'
import './App.css';

function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  useEffect(() => {
    async function verifyToken() {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const response = await fetch('http://localhost:3000/api/auth/verify', { headers: { 'x-access-token': token } });
        const data = await response.json();
        if (data.status !== 'ok') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          toast.error('Session expired. Please log in again.');
          navigate('/login');
        }
      } catch (error) {
        toast.error('Authorization failed');
        navigate('/login');
      }
    }
    verifyToken();
  }, [navigate]);
  return children;
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      fetch('http://localhost:3000/api/auth/verify', { headers: { 'x-access-token': token } })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'ok') {
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate('/dashboard', { replace: true });
          }
        })
        .catch(() => toast.error('Invalid token'));
    }
  }, [location, navigate]);

  return (
    <div className="relative">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthComponent />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/create-session" element={<ProtectedRoute><SessionCreate /></ProtectedRoute>} />
        <Route path="/session/:id" element={<ProtectedRoute><SessionRoom /></ProtectedRoute>} />
        <Route path="/feedback/:sessionId" element={<ProtectedRoute><FeedbackForm /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><FeedbackHistory /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/ai-interview" element={<ProtectedRoute><AIInterviewPrep /></ProtectedRoute>} />
        <Route path="/mock-gd" element={<ProtectedRoute><MockGD /></ProtectedRoute>} />
        <Route path="/mock-analytics" element={<ProtectedRoute><MockDataAnalyticsPage /></ProtectedRoute>} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark" />
    </div>
  );
}

export default App;