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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
    console.error(error);
    res.status(500).json({ error: 'Failed to generate topic' });
  }
};

const respondToDiscussion = async (req, res) => {
  const { topic, hardnessLevel, discussion, userResponse, turn } = req.body;
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    sessionResponses.push(userResponse);

    const context = discussion.map(d => `${d.speaker}: ${d.text}`).join('\n');

    const prompt = `You are moderating a realistic group discussion on the topic: "${topic}" at ${hardnessLevel} difficulty (Easy: broad and simple, Medium: nuanced, Hard: deep insight, Expert: technical/controversial). The current discussion is:\n${context}\nUser: ${userResponse}\nPerform the following:
1. Generate responses from three AI participants (AI1, AI2, AI3) to continue the discussion. Responses should:
   - Be concise, professional, and relevant.
   - Reflect diverse perspectives (e.g., supportive, contrarian, or building on ideas).
   - Mimic a real GD by including occasional challenges ("I disagree because..."), agreements ("I see your point, but..."), or probing questions ("Can you clarify how...?").
   - Match ${hardnessLevel} difficulty in depth and complexity.
2. Analyze the user's contribution: "${userResponse}". Provide detailed, professional feedback on articulation, coherence, confidence, enthusiasm, and logic (plain text, no markdown). Consider ${hardnessLevel} expectations.
${turn === 4 ? `3. Review all user contributions:\n${sessionResponses.map((r, i) => `Turn ${i + 1}: ${r}`).join('\n')}\nProvide overall scores (1-5) for:
   - Communication: Articulation and professionalism.
   - Clarity: Structure and coherence.
   - Confidence: Assertiveness and conviction.
   - Engagement: Enthusiasm and interaction.
   - Reasoning: Logic and depth.
   Scores should reflect ${hardnessLevel} expectations (e.g., Expert requires exceptional depth).` : ''}
Output as JSON:
{
  "aiResponses": [
    {"speaker": "AI1", "text": "..."},
    {"speaker": "AI2", "text": "..."},
    {"speaker": "AI3", "text": "..."}
  ],
  "analysis": [{"response": "${userResponse}", "analysis": "..."}],
  ${turn === 4 ? '"overallScores": {"communication": 1, "clarity": 1, "confidence": 1, "engagement": 1, "reasoning": 1}' : '"overallScores": null'}
}`;

    const result = await model.generateContent(prompt);
    const responseText = cleanJSON(result.response.text());
    let data = JSON.parse(responseText);

    // Append analysis
    accumulatedAnalysis.push(...data.analysis);
    data.analysis = [...accumulatedAnalysis];

    if (turn === 4) {
      sessionResponses = [];
      accumulatedAnalysis = [];
    }

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process response' });
  }
};

const saveResults = async (req, res) => {
  const { topic, hardnessLevel, discussion, analysis, overallScores } = req.body;
  try {
    const result = new MockGDResult({
      userId: req.user.id,
      topic,
      hardnessLevel,
      discussion,
      analysis,
      overallScores,
    });
    await result.save();
    res.json({ message: 'Results saved successfully' });
  } catch (error) {
    console.error(error);
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
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

module.exports = { generateTopic, respondToDiscussion, saveResults, getHistory };
