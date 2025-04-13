const { GoogleGenerativeAI } = require('@google/generative-ai');
const MockGDResult = require('../Model/MockGDResult');

let sessionResponses = [];
let accumulatedAnalysis = [];

const cleanJSON = (text) => {
  return text.replace(/```json|```/g, '').trim();
};

const generateTopic = async (req, res) => {
  const { topic, hardnessLevel } = req.body;
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Refine the user-provided group discussion topic: "${topic}" to make it concise, professional, and suitable for a ${hardnessLevel} difficulty level (Easy: broad and simple, Medium: nuanced with some complexity, Hard: requires deep insight, Expert: highly technical or controversial). The topic should encourage debate on ethical, strategic, or technical issues. Output as JSON:
{
  "topic": "refined topic text"
}`;

    const result = await model.generateContent(prompt);
    const responseText = cleanJSON(result.response.text());
    const { topic: refinedTopic } = JSON.parse(responseText);

    sessionResponses = [];
    accumulatedAnalysis = [];

    res.json({ topic: refinedTopic });
  } catch (error) {
    console.error('Error generating topic:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to generate topic' });
  }
};

const respondToDiscussion = async (req, res) => {
  const { topic, hardnessLevel, discussion, userResponse, turn } = req.body;
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    sessionResponses.push(userResponse);

    const context = discussion.map(d => `${d.speaker}: ${d.text}`).join('\n');

    const prompt = `You are moderating a realistic group discussion on the topic: "${topic}" at ${hardnessLevel} difficulty (Easy: broad and simple, Medium: nuanced, Hard: deep insight, Expert: technical/controversial). The current discussion is:\n${context}\nUser: ${userResponse}\nPerform the following:
1. Generate responses from three AI participants (AI1, AI2, AI3) to continue the discussion. Responses should:
   - Be concise (50-70 words), professional, and relevant to the topic.
   - Reflect diverse perspectives (e.g., supportive, contrarian, or building on ideas).
   - Mimic a real group discussion by including occasional challenges ("I disagree because..."), agreements ("I see your point, but..."), or probing questions ("Can you clarify how...?").
   - Match ${hardnessLevel} difficulty in depth and complexity (e.g., Expert requires technical detail or nuanced arguments).
2. Analyze the user's contribution: "${userResponse}". Provide detailed, professional feedback (100-150 words) on articulation, coherence, confidence, enthusiasm, and logic, without using markdown. Consider ${hardnessLevel} expectations (e.g., Expert demands precise terminology).
${turn === 4 ? `3. Review all user contributions:\n${sessionResponses.map((r, i) => `Turn ${i + 1}: ${r}`).join('\n')}\nProvide overall scores as integers from 1 to 5 (1=poor, 5=excellent) for:
   - communication: Articulation and professionalism.
   - clarity: Structure and coherence of arguments.
   - confidence: Assertiveness and conviction in delivery.
   - engagement: Enthusiasm and interaction with others' points.
   - reasoning: Logic, depth, and relevance of arguments.
   Ensure scores reflect ${hardnessLevel} expectations (e.g., Expert requires exceptional depth and precision).` : ''}
Output as valid JSON with no extra text or markdown:
{
  "aiResponses": [
    {"speaker": "AI1", "text": "response text"},
    {"speaker": "AI2", "text": "response text"},
    {"speaker": "AI3", "text": "response text"}
  ],
  "analysis": [{"response": "${userResponse}", "analysis": "feedback text"}],
  "overallScores": ${turn === 4 ? '{"communication": 3, "clarity": 3, "confidence": 3, "engagement": 3, "reasoning": 3}' : 'null'}
}`;

    const result = await model.generateContent(prompt);
    const responseText = cleanJSON(result.response.text());

    let data;
    const defaultScores = { communication: 3, clarity: 3, confidence: 3, engagement: 3, reasoning: 3 };
    try {
      data = JSON.parse(responseText);
      data.aiResponses = Array.isArray(data.aiResponses) ? data.aiResponses : [
        { speaker: 'AI1', text: `Let's discuss ${topic} further. What are the key challenges?` },
        { speaker: 'AI2', text: `I see potential in ${topic}. Can we explore solutions?` },
        { speaker: 'AI3', text: `What are the ethical aspects of ${topic}?` },
      ];
      data.analysis = Array.isArray(data.analysis) ? data.analysis : [
        { response: userResponse, analysis: 'Your contribution was noted, but analysis is limited due to processing issues.' },
      ];
    } catch (parseError) {
      console.error('JSON parsing error in respondToDiscussion:', parseError.message, parseError.stack);
      data = {
        aiResponses: [
          { speaker: 'AI1', text: `Let's discuss ${topic} further. What are the key challenges?` },
          { speaker: 'AI2', text: `I see potential in ${topic}. Can we explore solutions?` },
          { speaker: 'AI3', text: `What are the ethical aspects of ${topic}?` },
        ],
        analysis: [{ response: userResponse, analysis: 'Your contribution was noted, but analysis is limited due to processing issues.' }],
        overallScores: turn === 4 ? defaultScores : null,
      };
    }

    // Validate and sanitize overallScores for turn === 4
    if (turn === 4) {
      if (!data.overallScores || typeof data.overallScores !== 'object') {
        console.warn(`Invalid overallScores: ${JSON.stringify(data.overallScores)}. Using defaults.`);
        data.overallScores = { ...defaultScores };
      } else {
        const requiredFields = ['communication', 'clarity', 'confidence', 'engagement', 'reasoning'];
        for (const key of requiredFields) {
          if (!(key in data.overallScores) || typeof data.overallScores[key] !== 'number' || data.overallScores[key] < 1 || data.overallScores[key] > 5) {
            console.warn(`Invalid score for ${key}: ${data.overallScores[key]}. Using default (3).`);
            data.overallScores[key] = defaultScores[key];
          } else {
            data.overallScores[key] = Math.floor(data.overallScores[key]);
          }
        }
      }
    } else {
      data.overallScores = null;
    }

    // Append analysis
    accumulatedAnalysis.push(...(data.analysis || []));
    data.analysis = [...accumulatedAnalysis];

    if (turn === 4) {
      sessionResponses = [];
      accumulatedAnalysis = [];
    }

    res.json(data);
  } catch (error) {
    console.error('Error processing response:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to process response' });
  }
};

const saveResults = async (req, res) => {
  const { topic, hardnessLevel, discussion, analysis, overallScores } = req.body;

  // Validate input
  if (!topic || !hardnessLevel || !discussion || !analysis || !overallScores) {
    console.error('Missing required fields:', { topic, hardnessLevel, discussion, analysis, overallScores });
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (!Array.isArray(discussion) || !Array.isArray(analysis)) {
    console.error('Invalid array fields:', { discussion, analysis });
    return res.status(400).json({ error: 'Discussion and analysis must be arrays' });
  }
  const requiredFields = ['communication', 'clarity', 'confidence', 'engagement', 'reasoning'];
  if (typeof overallScores !== 'object' || !overallScores) {
    console.error('Invalid overallScores:', overallScores);
    return res.status(400).json({ error: 'Overall scores must be a valid object' });
  }
  for (const key of requiredFields) {
    if (!(key in overallScores) || typeof overallScores[key] !== 'number' || overallScores[key] < 1 || overallScores[key] > 5) {
      console.error(`Invalid score for ${key}:`, overallScores[key]);
      return res.status(400).json({ error: `Invalid score for ${key}` });
    }
  }

  // Ensure integer scores
  const sanitizedScores = {};
  requiredFields.forEach((key) => {
    sanitizedScores[key] = Math.floor(overallScores[key]);
  });

  try {
    const result = new MockGDResult({
      userId: req.user.id,
      topic,
      hardnessLevel,
      discussion,
      analysis,
      overallScores: sanitizedScores,
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
    const results = await MockGDResult.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ results });
  } catch (error) {
    console.error('Error fetching history:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

module.exports = { generateTopic, respondToDiscussion, saveResults, getHistory };