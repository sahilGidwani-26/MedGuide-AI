const MentalHealth = require('../models/MentalHealth');
const { callGemini } = require('../ai/gemini'); // your existing Groq wrapper

// ── Helper: get-or-create doc for user ───────────────────────
const getDoc = async (userId) => {
  let doc = await MentalHealth.findOne({ user: userId });
  if (!doc) doc = await MentalHealth.create({ user: userId });
  return doc;
};

// ────────────────────────────────────────────────────────────
// GET  /api/mental-health
// Returns the full mental health document for the logged-in user
// ────────────────────────────────────────────────────────────
exports.getData = async (req, res, next) => {
  try {
    const doc = await getDoc(req.user._id);
    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────────
// POST /api/mental-health/mood
// Body: { emoji, label, score, color, note? }
// ────────────────────────────────────────────────────────────
exports.logMood = async (req, res, next) => {
  try {
    const { emoji, label, score, color, note = '' } = req.body;
    if (!emoji || !label || score == null || !color) {
      return res.status(400).json({ success: false, message: 'emoji, label, score, color are required' });
    }

    const doc = await getDoc(req.user._id);
    doc.moodHistory.push({ emoji, label, score, color, note });
    await doc.save();

    res.status(201).json({ success: true, data: doc.moodHistory[doc.moodHistory.length - 1] });
  } catch (err) { next(err); }
};

// DELETE /api/mental-health/mood
// Clears entire mood history
exports.clearMoods = async (req, res, next) => {
  try {
    const doc = await getDoc(req.user._id);
    doc.moodHistory = [];
    await doc.save();
    res.json({ success: true, message: 'Mood history cleared' });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────────
// POST /api/mental-health/stress
// Body: { level, note? }
// ────────────────────────────────────────────────────────────
exports.logStress = async (req, res, next) => {
  try {
    const { level, note = '' } = req.body;
    if (level == null || level < 1 || level > 10) {
      return res.status(400).json({ success: false, message: 'level must be 1-10' });
    }

    const doc = await getDoc(req.user._id);
    doc.stressHistory.push({ level, note });
    await doc.save();

    res.status(201).json({ success: true, data: doc.stressHistory[doc.stressHistory.length - 1] });
  } catch (err) { next(err); }
};

// DELETE /api/mental-health/stress
exports.clearStress = async (req, res, next) => {
  try {
    const doc = await getDoc(req.user._id);
    doc.stressHistory = [];
    await doc.save();
    res.json({ success: true, message: 'Stress history cleared' });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────────
// POST /api/mental-health/breathing
// Body: { cycles, durationSec? }
// ────────────────────────────────────────────────────────────
exports.logBreathing = async (req, res, next) => {
  try {
    const { cycles, durationSec = 0 } = req.body;
    if (!cycles || cycles < 1) {
      return res.status(400).json({ success: false, message: 'cycles must be >= 1' });
    }

    const doc = await getDoc(req.user._id);
    doc.breathingHistory.push({ cycles, durationSec });
    await doc.save();

    res.status(201).json({ success: true, data: doc.breathingHistory[doc.breathingHistory.length - 1] });
  } catch (err) { next(err); }
};

// DELETE /api/mental-health/breathing
exports.clearBreathing = async (req, res, next) => {
  try {
    const doc = await getDoc(req.user._id);
    doc.breathingHistory = [];
    await doc.save();
    res.json({ success: true, message: 'Breathing history cleared' });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────────
// POST /api/mental-health/phq9
// Body: { answers: [0-3 x9], score, severityLabel, severityColor }
// ────────────────────────────────────────────────────────────
exports.logPhq9 = async (req, res, next) => {
  try {
    const { answers, score, severityLabel, severityColor } = req.body;
    if (!Array.isArray(answers) || answers.length !== 9) {
      return res.status(400).json({ success: false, message: 'answers must be array of 9 numbers' });
    }

    const doc = await getDoc(req.user._id);
    doc.phq9History.push({ answers, score, severityLabel, severityColor });
    await doc.save();

    res.status(201).json({ success: true, data: doc.phq9History[doc.phq9History.length - 1] });
  } catch (err) { next(err); }
};

// DELETE /api/mental-health/phq9
exports.clearPhq9 = async (req, res, next) => {
  try {
    const doc = await getDoc(req.user._id);
    doc.phq9History = [];
    await doc.save();
    res.json({ success: true, message: 'PHQ-9 history cleared' });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────────
// POST /api/mental-health/chat
// Body: { message: string }
// Calls Groq, saves both user + assistant turns, returns reply
// ────────────────────────────────────────────────────────────
exports.chat = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }

    const doc = await getDoc(req.user._id);

    // Build context from last 20 messages for Groq
    const recent = doc.chatHistory.slice(-20).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');

    const prompt = `You are a compassionate mental health support assistant named MindCare AI. 
Listen with empathy, validate feelings, offer gentle coping strategies.
Never diagnose or prescribe medication. Always encourage professional help for serious concerns.
Keep responses warm, concise (2-4 sentences), and supportive.

Previous conversation:
${recent}

User: ${message}
Assistant:`;

    const reply = await callGemini(prompt);

    // Save both turns
    doc.chatHistory.push({ role: 'user',      content: message });
    doc.chatHistory.push({ role: 'assistant', content: reply   });
    await doc.save();

    res.json({
      success: true,
      data: {
        reply,
        userMessage: { role: 'user',      content: message, sentAt: new Date() },
        aiMessage:   { role: 'assistant', content: reply,   sentAt: new Date() },
      },
    });
  } catch (err) { next(err); }
};

// DELETE /api/mental-health/chat
exports.clearChat = async (req, res, next) => {
  try {
    const doc = await getDoc(req.user._id);
    doc.chatHistory = [];
    await doc.save();
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────────
// GET /api/mental-health/summary
// Returns quick stats for dashboard widgets
// ────────────────────────────────────────────────────────────
exports.getSummary = async (req, res, next) => {
  try {
    const doc = await getDoc(req.user._id);

    const last7Days = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const recentMoods = doc.moodHistory.filter(m => new Date(m.loggedAt) >= last7Days);
    const avgMood = recentMoods.length
      ? (recentMoods.reduce((a, b) => a + b.score, 0) / recentMoods.length).toFixed(1)
      : null;

    const recentStress = doc.stressHistory.filter(s => new Date(s.loggedAt) >= last7Days);
    const avgStress = recentStress.length
      ? (recentStress.reduce((a, b) => a + b.level, 0) / recentStress.length).toFixed(1)
      : null;

    const totalBreathCycles = doc.breathingHistory.reduce((a, b) => a + b.cycles, 0);

    const lastPhq9 = doc.phq9History.length ? doc.phq9History[doc.phq9History.length - 1] : null;

    res.json({
      success: true,
      data: {
        avgMoodLast7Days:    avgMood,
        avgStressLast7Days:  avgStress,
        totalMoodEntries:    doc.moodHistory.length,
        totalStressEntries:  doc.stressHistory.length,
        totalBreathSessions: doc.breathingHistory.length,
        totalBreathCycles,
        totalPhq9Tests:      doc.phq9History.length,
        lastPhq9Score:       lastPhq9?.score ?? null,
        lastPhq9Severity:    lastPhq9?.severityLabel ?? null,
        totalChatMessages:   doc.chatHistory.length,
      },
    });
  } catch (err) { next(err); }
};