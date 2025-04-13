const { GoogleGenerativeAI } = require('@google/generative-ai');
const AIInterviewResult = require('../Model/AiInterviewResults');

let sessionAnswers = [];

const generateQuestions = async (req, res) => {
  const { jobPosition, jobDescription, experience } = req.body;
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Updated model name
    const prompt = `Generate exactly five diverse, concise, and professional interview questions for a ${jobPosition} role at ${experience} experience level, based on this job description: "${jobDescription}". Cover technical skills, problem-solving, teamwork, career motivation, and leadership. Ensure no overlap in focus. Output only valid JSON with no additional text or markdown:
{
  "questions": ["question 1", "question 2", "question 3", "question 4", "question 5"]
}`;
    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    responseText = responseText.replace(/```json\n|```/g, '').trim();
    if (!responseText.startsWith('{') || !responseText.endsWith('}')) {
      console.error('Invalid JSON response from model:', responseText);
      throw new Error('Invalid JSON response from model');
    }
    const { questions } = JSON.parse(responseText);
    if (!Array.isArray(questions) || questions.length !== 5) {
      console.error('Invalid questions format:', questions);
      throw new Error('Invalid questions format');
    }
    sessionAnswers = [];
    res.json({ questions });
  } catch (error) {
    console.error('Error generating questions:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to generate questions' });
  }
};

const analyzeAnswer = async (req, res) => {
  const { jobPosition, experience, question, answer, isLast } = req.body;
  try {
    if (!question || !answer) {
      throw new Error('Missing question or answer');
    }
    sessionAnswers.push({ question, answer });

    let response = {
      analysis: [{ question, answer, analysis: '' }],
    };

    if (isLast) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are evaluating interview answers for a ${jobPosition} role at ${experience} level. Given the following questions and answers:\n${sessionAnswers
        .map((a, i) => `Question ${i + 1}: ${a.question}\nAnswer ${i + 1}: ${a.answer}`)
        .join('\n')}\nPerform the following:
1. For each answer, provide detailed, professional feedback on articulation, coherence, confidence, enthusiasm, and logic (plain text, no markdown).
2. Provide overall scores (1-5) for:
   - Communication: Articulation and professionalism.
   - Clarity: Structure and coherence.
   - Confidence: Assertiveness and conviction.
   - Engagement: Enthusiasm and interaction.
   - Reasoning: Logic and depth.
Output only valid JSON with no additional text or markdown:
{
  "analysis": [
    {"question": "question 1", "answer": "answer 1", "analysis": "feedback 1"},
    {"question": "question 2", "answer": "answer 2", "analysis": "feedback 2"},
    {"question": "question 3", "answer": "answer 3", "analysis": "feedback 3"},
    {"question": "question 4", "answer": "answer 4", "analysis": "feedback 4"},
    {"question": "question 5", "answer": "answer 5", "analysis": "feedback 5"}
  ],
  "overallScores": {"communication": 1, "clarity": 1, "confidence": 1, "engagement": 1, "reasoning": 1}
}`;
      const result = await model.generateContent(prompt);
      let responseText = result.response.text();
      responseText = responseText.replace(/```json\n|```/g, '').trim();

      if (!responseText.startsWith('{') || !responseText.endsWith('}')) {
        console.error('Invalid JSON response from model:', responseText);
        throw new Error('Invalid JSON response from model');
      }

      const data = JSON.parse(responseText);

      if (
        !data.analysis ||
        !Array.isArray(data.analysis) ||
        data.analysis.length !== sessionAnswers.length ||
        !data.overallScores ||
        typeof data.overallScores !== 'object'
      ) {
        console.error('Invalid analysis format:', data);
        throw new Error('Invalid analysis format');
      }

      // Map the actual questions and answers from sessionAnswers
      response = {
        analysis: data.analysis.map((item, index) => ({
          question: sessionAnswers[index]?.question || item.question,
          answer: sessionAnswers[index]?.answer || item.answer,
          analysis: item.analysis || '',
        })),
        overallScores: data.overallScores,
      };

      sessionAnswers = [];
    }

    res.json(response);
  } catch (error) {
    console.error('Error analyzing answer:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to analyze answer', details: error.message });
  }
};

const saveResults = async (req, res) => {
  const { jobPosition, jobDescription, experience, results, overallScores } = req.body;
  try {
    const result = new AIInterviewResult({
      userId: req.user.id,
      jobPosition,
      jobDescription,
      experience,
      results,
      overallScores,
    });
    await result.save();
    res.json({ message: 'Results saved successfully' });
  } catch (error) {
    console.error('Error saving results:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to save results' });
  }
};

const getHistory = async (req, res) => {
  const { page = 1, limit = 5 } = req.query;
  try {
    const results = await AIInterviewResult.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ results });
  } catch (error) {
    console.error('Error fetching history:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

module.exports = { generateQuestions, analyzeAnswer, saveResults, getHistory };