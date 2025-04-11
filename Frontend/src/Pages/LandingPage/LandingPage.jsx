import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="w-full max-w-md p-8 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 text-center">
        <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent">Welcome to SpeakSpace</h1>
        <p className="text-gray-300 mb-6">Enhance your group discussion and interview skills with real-time practice and feedback.</p>
        <button onClick={() => navigate(token ? '/dashboard' : '/login')} className="py-3 px-6 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-semibold hover:from-gray-600 hover:to-gray-800 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg">{token ? 'Go to Dashboard' : 'Get Started'}</button>
      </div>
    </div>
  );
}

export default LandingPage;