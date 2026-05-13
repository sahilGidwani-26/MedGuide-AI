// routes/vitals.js
const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/auth');
const Vital    = require('../models/Vital');
const { callGemini } = require('../ai/gemini');

// ─── Alert generator (same logic as frontend, runs server-side too) ───────────
function generateAlerts(entry) {
  const alerts = [];

  const { bp_systolic, bp_diastolic, blood_sugar, heart_rate, temperature } = entry;

  if (bp_systolic != null) {
    if (bp_systolic >= 140)      alerts.push({ level: 'danger',  vital: 'Blood Pressure', msg: `BP systolic ${bp_systolic} mmHg — Hypertension Stage 2. Doctor se milna zaruri hai.` });
    else if (bp_systolic >= 130) alerts.push({ level: 'warning', vital: 'Blood Pressure', msg: `BP ${bp_systolic} mmHg — elevated. Salt kam karo, rest lo.` });
    else if (bp_systolic < 90)   alerts.push({ level: 'warning', vital: 'Blood Pressure', msg: `BP ${bp_systolic} mmHg — Low BP. Paani piyo, lait jao.` });
  }

  if (blood_sugar != null) {
    if (blood_sugar > 200)      alerts.push({ level: 'danger',  vital: 'Blood Sugar', msg: `Blood sugar ${blood_sugar} mg/dL — bahut zyada! Doctor se milna chahiye.` });
    else if (blood_sugar > 140) alerts.push({ level: 'warning', vital: 'Blood Sugar', msg: `Blood sugar ${blood_sugar} mg/dL — Pre-diabetic range. Diet control karo.` });
    else if (blood_sugar < 70)  alerts.push({ level: 'danger',  vital: 'Blood Sugar', msg: `Blood sugar ${blood_sugar} mg/dL — Hypoglycemia! Meetha khao abhi.` });
  }

  if (heart_rate != null) {
    if (heart_rate > 120)     alerts.push({ level: 'danger',  vital: 'Heart Rate', msg: `Heart rate ${heart_rate} bpm — bahut tez.` });
    else if (heart_rate < 50) alerts.push({ level: 'warning', vital: 'Heart Rate', msg: `Heart rate ${heart_rate} bpm — slow hai. Doctor se milna.` });
  }

  if (temperature != null) {
    if (temperature >= 38.5)      alerts.push({ level: 'danger',  vital: 'Temperature', msg: `Bukhaar ${temperature}°C — high fever! Doctor ko dikhao.` });
    else if (temperature >= 37.5) alerts.push({ level: 'warning', vital: 'Temperature', msg: `Temperature ${temperature}°C — hafka bukhaar. Aaram karo.` });
    else if (temperature < 35.5)  alerts.push({ level: 'danger',  vital: 'Temperature', msg: `Temperature ${temperature}°C — Hypothermia risk. Doctor ko batao.` });
  }

  return alerts;
}

// ─── GET /api/vitals ──────────────────────────────────────────────────────────
// All records for logged-in user (last 90 days)
router.get('/', protect, async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - Number(days));
    const sinceStr = since.toISOString().split('T')[0];

    const vitals = await Vital.find({
      user: req.user._id,
      date: { $gte: sinceStr },
    }).sort({ date: 1, time: 1 }).lean();

    res.json({ success: true, count: vitals.length, data: vitals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/vitals ─────────────────────────────────────────────────────────
// Log a new vitals entry
router.post('/', protect, async (req, res) => {
  try {
    const {
      date, time,
      bp_systolic, bp_diastolic,
      blood_sugar, weight,
      heart_rate, temperature,
      note,
    } = req.body;

    const entry = {
      user:         req.user._id,
      date:         date || new Date().toISOString().split('T')[0],
      time:         time || '08:00',
      bp_systolic:  bp_systolic  != null ? Number(bp_systolic)  : null,
      bp_diastolic: bp_diastolic != null ? Number(bp_diastolic) : null,
      blood_sugar:  blood_sugar  != null ? Number(blood_sugar)  : null,
      weight:       weight       != null ? Number(weight)       : null,
      heart_rate:   heart_rate   != null ? Number(heart_rate)   : null,
      temperature:  temperature  != null ? Number(temperature)  : null,
      note:         note || '',
    };

    entry.alerts = generateAlerts(entry);

    const vital = await Vital.create(entry);
    res.status(201).json({ success: true, data: vital });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/vitals/:id ───────────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const vital = await Vital.findOne({ _id: req.params.id, user: req.user._id });
    if (!vital) return res.status(404).json({ success: false, message: 'Not found' });
    await vital.deleteOne();
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/vitals/summary ──────────────────────────────────────────────────
// AI-powered health summary (Groq)
router.get('/summary', protect, async (req, res) => {
  try {
    const vitals = await Vital.find({ user: req.user._id })
      .sort({ date: -1 }).limit(10).lean();

    if (!vitals.length) {
      return res.json({ success: true, summary: 'Abhi koi vitals record nahi hain. Pehle kuch readings log karo.' });
    }

    const dataStr = vitals.map(v =>
      `${v.date}: BP ${v.bp_systolic}/${v.bp_diastolic}, Sugar ${v.blood_sugar}, HR ${v.heart_rate}, Temp ${v.temperature}, Weight ${v.weight}`
    ).join('\n');

    const prompt = `You are a health AI. Analyze these patient vitals (last 10 readings) and give a brief health summary in simple Hinglish (2-3 sentences max). Mention any concerning trends. Do NOT prescribe medicines.\n\nReadings:\n${dataStr}\n\nSummary:`;

    const summary = await callGemini(prompt);
    res.json({ success: true, summary: summary.trim() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;