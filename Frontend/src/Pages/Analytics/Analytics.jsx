import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {ToastContainer, toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {motion, AnimatePresence} from 'framer-motion';
import {BarChart2, ArrowRight, Calendar, TrendingUp, Activity, Award, ChevronDown, ChevronUp, History, FileText} from 'lucide-react';
import {LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area} from 'recharts';
import jsPDF from 'jspdf';

const CustomTooltip = ({active, payload, label}) => {
  if (active && payload && payload.length) {
    return (
      <div className='bg-[#1a1025]/90 backdrop-blur-md p-3 rounded-lg border border-purple-500/20 shadow-lg'>
        <p className='text-white font-medium'>{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{color: entry.color}}>{entry.name}: {entry.value.toFixed(2)}</p>
        ))}
      </div>
    );
  }
  return null;
};

const RadarChartComponent = ({data}) => (
  <ResponsiveContainer width='100%' height='100%'>
    <RadarChart cx='50%' cy='50%' outerRadius='80%' data={data}>
      <PolarGrid stroke='#6b21a8' strokeOpacity={0.3}/>
      <PolarAngleAxis dataKey='subject' tick={{fill: '#d1d5db'}}/>
      <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{fill: '#d1d5db'}}/>
      <Radar name='Skills' dataKey='score' stroke='#ec4899' fill='#ec4899' fillOpacity={0.5}/>
      <Tooltip content={<CustomTooltip/>}/>
    </RadarChart>
  </ResponsiveContainer>
);

const LineChartComponent = ({data}) => (
  <ResponsiveContainer width='100%' height='100%'>
    <LineChart data={data} margin={{top: 5, right: 30, left: 20, bottom: 5}}>
      <CartesianGrid strokeDasharray='3 3' stroke='#6b21a8' strokeOpacity={0.3}/>
      <XAxis dataKey='createdAt' tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} tick={{fill: '#d1d5db'}}/>
      <YAxis domain={[0, 5]} tick={{fill: '#d1d5db'}}/>
      <Tooltip content={<CustomTooltip/>}/>
      <Legend/>
      <Line type='monotone' dataKey='communication' name='Communication' stroke='#ec4899' activeDot={{r: 8}}/>
      <Line type='monotone' dataKey='clarity' name='Clarity' stroke='#8b5cf6' activeDot={{r: 8}}/>
      <Line type='monotone' dataKey='confidence' name='Confidence' stroke='#10b981' activeDot={{r: 8}}/>
      <Line type='monotone' dataKey='engagement' name='Engagement' stroke='#f59e0b' activeDot={{r: 8}}/>
      <Line type='monotone' dataKey='reasoning' name='Reasoning' stroke='#3b82f6' activeDot={{r: 8}}/>
    </LineChart>
  </ResponsiveContainer>
);

const AreaChartComponent = ({data}) => (
  <ResponsiveContainer width='100%' height='100%'>
    <AreaChart data={data} margin={{top: 10, right: 30, left: 0, bottom: 0}}>
      <CartesianGrid strokeDasharray='3 3' stroke='#6b21a8' strokeOpacity={0.3}/>
      <XAxis dataKey='name' tick={{fill: '#d1d5db'}}/>
      <YAxis tick={{fill: '#d1d5db'}}/>
      <Tooltip content={<CustomTooltip/>}/>
      <Area type='monotone' dataKey='sessions' name='Sessions' stroke='#8b5cf6' fill='url(#colorSessions)'/>
      <defs>
        <linearGradient id='colorSessions' x1='0' y1='0' x2='0' y2='1'>
          <stop offset='5%' stopColor='#8b5cf6' stopOpacity={0.8}/>
          <stop offset='95%' stopColor='#8b5cf6' stopOpacity={0.1}/>
        </linearGradient>
      </defs>
    </AreaChart>
  </ResponsiveContainer>
);

const StrengthsBarChart = ({data}) => (
  <ResponsiveContainer width='100%' height='100%'>
    <BarChart data={data} layout='vertical' margin={{top: 5, right: 50, left: 40, bottom: 5}}>
      <CartesianGrid strokeDasharray='3 3' stroke='#6b21a8' strokeOpacity={0.3}/>
      <XAxis type='number' domain={[0, 5]} tick={{fill: '#d1d5db'}}/>
      <YAxis dataKey='area' type='category' tick={{fill: '#d1d5db'}}/>
      <Tooltip content={<CustomTooltip/>}/>
      <Bar dataKey='score' name='Score' fill='url(#colorStrength)' radius={[0, 4, 4, 0]}/>
      <defs>
        <linearGradient id='colorStrength' x1='0' y1='0' x2='1' y2='0'>
          <stop offset='0%' stopColor='#10b981' stopOpacity={0.8}/>
          <stop offset='100%' stopColor='#34d399' stopOpacity={0.8}/>
        </linearGradient>
      </defs>
    </BarChart>
  </ResponsiveContainer>
);

const ImprovementsBarChart = ({data}) => (
  <ResponsiveContainer width='100%' height='100%'>
    <BarChart data={data} layout='vertical' margin={{top: 5, right: 30, left: 59, bottom: 5}}>
      <CartesianGrid strokeDasharray='3 3' stroke='#6b21a8' strokeOpacity={0.3}/>
      <XAxis type='number' domain={[0, 5]} tick={{fill: '#d1d5db'}}/>
      <YAxis dataKey='area' type='category' tick={{fill: '#d1d5db'}}/>
      <Tooltip content={<CustomTooltip/>}/>
      <Bar dataKey='score' name='Score' fill='url(#colorImprovement)' radius={[0, 4, 4, 0]}/>
      <defs>
        <linearGradient id='colorImprovement' x1='0' y1='0' x2='1' y2='0'>
          <stop offset='0%' stopColor='#f59e0b' stopOpacity={0.8}/>
          <stop offset='100%' stopColor='#fbbf24' stopOpacity={0.8}/>
        </linearGradient>
      </defs>
    </BarChart>
  </ResponsiveContainer>
);

const predefinedRecommendations = {
  Communication: [
    'Practice active listening to enhance your communication skills.',
    'Join group discussions to refine your ability to articulate ideas clearly.',
    'Use your strong communication to lead team projects effectively.'
  ],
  Clarity: [
    'Structure your responses with clear introductions and conclusions.',
    'Practice summarizing complex ideas to improve clarity.',
    'Seek feedback on your explanations to ensure they are easy to follow.'
  ],
  Confidence: [
    'Prepare thoroughly for sessions to boost your confidence.',
    'Practice public speaking to build self-assurance in group settings.',
    'Leverage your confidence to inspire others in discussions.'
  ],
  Engagement: [
    'Ask open-ended questions to maintain high engagement in conversations.',
    'Participate in interactive workshops to enhance audience engagement.',
    'Use your strong engagement to foster collaborative environments.'
  ],
  Reasoning: [
    'Solve logic puzzles regularly to sharpen your reasoning skills.',
    'Engage in debates to practice structured argumentation.',
    'Analyze case studies to improve your critical thinking abilities.'
  ]
};

export default function Analytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    async function fetchAnalytics() {
      if (!user || !user.id) {
        toast.error('User not authenticated');
        navigate('/login');
        return;
      }
      try {
        const response = await fetch(`http://localhost:3000/api/feedback/analytics/${user.id}`, {headers: {Authorization: `Bearer ${localStorage.getItem('token')}`}});
        if (!response.ok) {throw new Error('Failed to fetch analytics');}
        const data = await response.json();
        const skills = [
          {subject: 'Communication', score: data.averageCommunication || 0},
          {subject: 'Clarity', score: data.averageClarity || 0},
          {subject: 'Confidence', score: data.averageConfidence || 0},
          {subject: 'Engagement', score: data.averageEngagement || 0},
          {subject: 'Reasoning', score: data.averageReasoning || 0}
        ];
        const sortedSkills = [...skills].sort((a, b) => b.score - a.score);
        const strengthAreas = sortedSkills.slice(0, 2).map((skill) => ({area: skill.subject, score: skill.score}));
        const improvementAreas = sortedSkills.slice(-2).map((skill) => ({area: skill.subject, score: skill.score}));
        const recommendations = [];
        improvementAreas.forEach((area) => {
          const recs = predefinedRecommendations[area.area];
          if (recs && recs.length > 0) {recommendations.push(recs[0]);}
        });
        if (strengthAreas.length > 0) {
          const recs = predefinedRecommendations[strengthAreas[0].area];
          if (recs && recs.length > 2) {recommendations.push(recs[2]);}
        }
        const transformedData = {
          averageCommunication: data.averageCommunication || 0,
          averageClarity: data.averageClarity || 0,
          averageConfidence: data.averageConfidence || 0,
          averageEngagement: data.averageEngagement || 0,
          averageReasoning: data.averageReasoning || 0,
          totalSessions: data.totalSessions || 0,
          skillsRadar: skills.map((skill) => ({subject: skill.subject, score: skill.score, fullMark: 5})),
          trend: data.trend.map((t) => ({
            id: t.sessionId,
            sessionTopic: `Session ${t.sessionId}`,
            createdAt: t.createdAt,
            communication: t.communication,
            clarity: t.clarity,
            confidence: t.confidence,
            engagement: t.engagement,
            reasoning: t.reasoning
          })),
          improvementAreas,
          strengthAreas,
          sessionsOverTime: [
            {name: 'Jan', sessions: 5},
            {name: 'Feb', sessions: 8},
            {name: 'Mar', sessions: 12},
            {name: 'Apr', sessions: 10}
          ],
          recommendations
        };
        setAnalytics(transformedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        toast.error('Failed to load analytics');
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [user, navigate]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'});
  };

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? '' : section);
  };

  const [stars, setStars] = useState([]);

  useEffect(() => {
    const generateStars = () => {
      const newStars = [];
      for (let i = 0; i < 100; i++) {
        newStars.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.8 + 0.2,
          blinking: Math.random() > 0.7
        });
      }
      setStars(newStars);
    };
    generateStars();
  }, []);

  async function generatePDFReport() {
    setIsGeneratingReport(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(236, 72, 153);
      doc.text('Performance Analytics Report', pageWidth / 2, 20, {align: 'center'});
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`User: ${user?.name || 'User'}`, margin, 35);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 42);
      doc.setLineWidth(0.5);
      doc.setDrawColor(236, 72, 153);
      doc.line(margin, 48, pageWidth - margin, 48);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(236, 72, 153);
      doc.text('Performance Overview', margin, 60);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      const metrics = [
        {subject: 'Total Sessions', score: analytics.totalSessions},
        {subject: 'Communication', score: analytics.averageCommunication.toFixed(2)},
        {subject: 'Clarity', score: analytics.averageClarity.toFixed(2)},
        {subject: 'Confidence', score: analytics.averageConfidence.toFixed(2)},
        {subject: 'Engagement', score: analytics.averageEngagement.toFixed(2)},
        {subject: 'Reasoning', score: analytics.averageReasoning.toFixed(2)}
      ];
      metrics.forEach((item, idx) => {
        doc.text(`${item.subject}: ${item.score}${item.subject === 'Total Sessions' ? '' : '/5'}`, margin + (idx % 2 === 0 ? 0 : 80), 70 + Math.floor(idx / 2) * 10);
      });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(236, 72, 153);
      doc.text('Strengths & Areas for Improvement', margin, 110);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text('Strengths:', margin, 120);
      const strengthsText = analytics.strengthAreas.length ? analytics.strengthAreas.map(s => `${s.area} (${s.score.toFixed(2)}/5)`).join(', ') : 'Keep practicing!';
      doc.text(strengthsText, margin + 5, 127);
      doc.text('Areas for Improvement:', margin, 137);
      const improvementsText = analytics.improvementAreas.length ? analytics.improvementAreas.map(i => `${i.area} (${i.score.toFixed(2)}/5)`).join(', ') : 'You’re doing great!';
      doc.text(improvementsText, margin + 5, 144);
      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(236, 72, 153);
      doc.text('Session Summaries', margin, 20);
      let yPos = 30;
      analytics.trend.forEach((s, idx) => {
        const date = formatDate(s.createdAt);
        const totalScore = [s.communication, s.clarity, s.confidence, s.engagement, s.reasoning].reduce((sum, score) => sum + score, 0);
        const avgScore = totalScore / 5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`${idx + 1}. ${s.sessionTopic}`, margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Date: ${date}`, margin + 5, yPos + 7);
        doc.text(`Average Score: ${avgScore.toFixed(2)}/5`, margin + 5, yPos + 14);
        const scoresText = `Communication: ${s.communication}/5, Clarity: ${s.clarity}/5, Confidence: ${s.confidence}/5, Engagement: ${s.engagement}/5, Reasoning: ${s.reasoning}/5`;
        const splitScores = doc.splitTextToSize(`Scores: ${scoresText}`, pageWidth - margin * 2);
        doc.text(splitScores, margin + 5, yPos + 21);
        yPos += 35;
        if (yPos > 250) {doc.addPage(); yPos = 20;}
        doc.setLineWidth(0.2);
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
      });
      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(236, 72, 153);
      doc.text('Recommendations', margin, 20);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      analytics.recommendations.forEach((r, idx) => {
        const splitRec = doc.splitTextToSize(`${idx + 1}. ${r}`, pageWidth - margin * 2);
        doc.text(splitRec, margin, 30 + idx * 15);
      });
      doc.save('performance-analytics-report.pdf');
      toast.success('Performance analytics report downloaded successfully!');
    } catch (error) {
      toast.error(`Error generating report: ${error.message}`);
    } finally {
      setIsGeneratingReport(false);
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-[#0f0f1a] via-[#1a1025] to-[#1e0a2e] text-white overflow-hidden'>
      <div className='fixed inset-0 z-0'>
        <div className='absolute inset-0 bg-gradient-radial from-[#5f0f9980] via-transparent to-transparent opacity-30'/>
        <div className='absolute inset-0 bg-gradient-radial from-[#e91e6380] via-transparent to-transparent opacity-20 translate-x-1/2'/>
        <div className='absolute inset-0 bg-gradient-radial from-[#4a00e080] via-transparent to-transparent opacity-20 translate-y-1/4'/>
        <div className='absolute inset-0 bg-gradient-radial from-[#8e2de280] via-transparent to-transparent opacity-30 -translate-x-1/3 translate-y-1/2'/>
      </div>
      <div className='fixed inset-0 z-0'>
        {stars.map((star) => (
          <div key={star.id} className={`absolute rounded-full bg-white ${star.blinking ? 'animate-pulse' : ''}`} style={{left: `${star.x}%`, top: `${star.y}%`, width: `${star.size}px`, height: `${star.size}px`, opacity: star.opacity, transform: 'translate(-50%, -50%)'}}/>
        ))}
      </div>
      <div className='container mx-auto px-4 py-12 relative z-10'>
        <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.6}} className='max-w-5xl mx-auto bg-gradient-to-tr from-[#1a0b25]/80 to-[#2a1040]/80 backdrop-blur-md p-1 rounded-2xl overflow-hidden'>
          <div className='bg-[#0f0f1a]/60 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-purple-500/20 min-h-[70vh]'>
            <motion.div initial={{opacity: 0, y: -20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.6, delay: 0.2}} className='flex items-center mb-8'>
              <BarChart2 className='h-8 w-8 text-pink-500 mr-3'/>
              <h1 className='text-2xl md:text-3xl font-bold'>Performance <span className='bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400'>Analytics</span></h1>
            </motion.div>
            {loading ? (
              <div className='flex justify-center items-center py-20'>
                <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500'></div>
              </div>
            ) : analytics ? (
              <div className='space-y-8'>
                <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.6, delay: 0.3}} className='bg-[#1a1025]/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/10'>
                  <div className='flex justify-between items-center cursor-pointer' onClick={() => toggleSection('overview')}>
                    <div className='flex items-center'>
                      <Activity className='h-5 w-5 text-pink-400 mr-2'/>
                      <h2 className='text-xl font-semibold'>Performance Overview</h2>
                    </div>
                    {activeSection === 'overview' ? <ChevronUp className='h-5 w-5 text-gray-400'/> : <ChevronDown className='h-5 w-5 text-gray-400'/>}
                  </div>
                  <AnimatePresence>
                    {activeSection === 'overview' && (
                      <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} exit={{opacity: 0, height: 0}} transition={{duration: 0.3}} className='mt-4 overflow-hidden'>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
                          <div className='bg-[#0f0f1a]/60 p-4 rounded-lg border border-purple-500/10'>
                            <p className='text-gray-400 text-sm'>Total Sessions</p>
                            <p className='text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400'>{analytics.totalSessions}</p>
                          </div>
                          <div className='bg-[#0f0f1a]/60 p-4 rounded-lg border border-purple-500/10'>
                            <p className='text-gray-400 text-sm'>Average Communication</p>
                            <p className='text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400'>{analytics.averageCommunication.toFixed(1)}</p>
                          </div>
                          <div className='bg-[#0f0f1a]/60 p-4 rounded-lg border border-purple-500/10'>
                            <p className='text-gray-400 text-sm'>Average Clarity</p>
                            <p className='text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400'>{analytics.averageClarity.toFixed(1)}</p>
                          </div>
                          <div className='bg-[#0f0f1a]/60 p-4 rounded-lg border border-purple-500/10'>
                            <p className='text-gray-400 text-sm'>Average Confidence</p>
                            <p className='text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400'>{analytics.averageConfidence.toFixed(1)}</p>
                          </div>
                          <div className='bg-[#0f0f1a]/60 p-4 rounded-lg border border-purple-500/10'>
                            <p className='text-gray-400 text-sm'>Average Engagement</p>
                            <p className='text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400'>{analytics.averageEngagement.toFixed(1)}</p>
                          </div>
                          <div className='bg-[#0f0f1a]/60 p-4 rounded-lg border border-purple-500/10'>
                            <p className='text-gray-400 text-sm'>Average Reasoning</p>
                            <p className='text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400'>{analytics.averageReasoning.toFixed(1)}</p>
                          </div>
                        </div>
                        <div className='h-80 w-full'>
                          <p className='text-lg font-medium mb-4'>Skills Assessment</p>
                          <RadarChartComponent data={analytics.skillsRadar}/>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.6, delay: 0.4}} className='bg-[#1a1025]/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/10'>
                  <div className='flex justify-between items-center cursor-pointer' onClick={() => toggleSection('trends')}>
                    <div className='flex items-center'>
                      <TrendingUp className='h-5 w-5 text-purple-400 mr-2'/>
                      <h2 className='text-xl font-semibold'>Performance Trends</h2>
                    </div>
                    {activeSection === 'trends' ? <ChevronUp className='h-5 w-5 text-gray-400'/> : <ChevronDown className='h-5 w-5 text-gray-400'/>}
                  </div>
                  <AnimatePresence>
                    {activeSection === 'trends' && (
                      <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} exit={{opacity: 0, height: 0}} transition={{duration: 0.3}} className='mt-4 overflow-hidden'>
                        <div className='h-80 w-full'>
                          <p className='text-lg font-medium mb-4'>Skill Progress Over Time</p>
                          <LineChartComponent data={analytics.trend}/>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.6, delay: 0.5}} className='bg-[#1a1025]/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/10'>
                  <div className='flex justify-between items-center cursor-pointer' onClick={() => toggleSection('strengths')}>
                    <div className='flex items-center'>
                      <Award className='h-5 w-5 text-yellow-400 mr-2'/>
                      <h2 className='text-xl font-semibold'>Strengths & Areas for Improvement</h2>
                    </div>
                    {activeSection === 'strengths' ? <ChevronUp className='h-5 w-5 text-gray-400'/> : <ChevronDown className='h-5 w-5 text-gray-400'/>}
                  </div>
                  <AnimatePresence>
                    {activeSection === 'strengths' && (
                      <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} exit={{opacity: 0, height: 0}} transition={{duration: 0.3}} className='mt-4 overflow-hidden'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                          <div>
                            <p className='text-lg font-medium mb-4 text-green-400'>Your Strengths</p>
                            <div className='h-60 w-full'>
                              <StrengthsBarChart data={analytics.strengthAreas}/>
                            </div>
                          </div>
                          <div>
                            <p className='text-lg font-medium mb-4 text-amber-400'>Areas for Improvement</p>
                            <div className='h-60 w-full'>
                              <ImprovementsBarChart data={analytics.improvementAreas}/>
                            </div>
                          </div>
                        </div>
                        <div className='mt-6 p-4 bg-[#0f0f1a]/60 rounded-lg border border-purple-500/10'>
                          <p className='text-lg font-medium mb-2'>Personalized Recommendations</p>
                          <ul className='list-disc list-inside space-y-2 text-gray-300'>
                            {analytics.recommendations.length > 0 ? (
                              analytics.recommendations.map((rec, index) => (
                                <li key={index}>{rec}</li>
                              ))
                            ) : (
                              <li>No recommendations available.</li>
                            )}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            ) : (
              <motion.div initial={{opacity: 0}} animate={{opacity: 1}} transition={{duration: 0.6, delay: 0.4}} className='bg-[#1a1025]/50 backdrop-blur-sm rounded-xl p-8 text-center'>
                <p className='text-gray-400'>No analytics data available yet.</p>
              </motion.div>
            )}
            <div className='mt-8 flex flex-col sm:flex-row justify-center gap-4'>
              <motion.button whileHover={{scale: 1.05, boxShadow: '0 0 15px rgba(236,72,153,0.5)'}} whileTap={{scale: 0.95}} onClick={() => navigate('/dashboard')} className='w-full px-6 py-3 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium flex items-center justify-center'>
                <ArrowRight className='h-4 w-4 mr-2 rotate-180'/>Back to Dashboard
              </motion.button>
              <motion.button whileHover={{scale: 1.05, boxShadow: '0 0 15px rgba(236,72,153,0.5)'}} whileTap={{scale: 0.95}} onClick={generatePDFReport} disabled={isGeneratingReport || !analytics} className='w-full px-6 py-3 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed'>
                <FileText className='h-4 w-4 mr-2'/>{isGeneratingReport ? 'Generating...' : 'Download Report'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
      <ToastContainer position='top-right' autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme='dark' toastClassName='bg-[#1a1025]/90 backdrop-blur-md border border-purple-500/20 text-white' progressClassName='bg-pink-500'/>
    </div>
  );
}