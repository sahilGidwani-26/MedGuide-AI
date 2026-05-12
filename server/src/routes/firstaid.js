// routes/firstaid.js
// First Aid Guide — static data route (offline-capable)
// Agar future mein AI-powered dynamic tips chahiye to callGemini use karo

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Static first aid data — same as frontend SCENARIOS
// This can be used by mobile app or external clients
const FIRST_AID_DATA = [
  {
    id: 'heart_attack',
    emoji: '❤️',
    name: 'Heart Attack',
    nameHi: 'दिल का दौरा',
    severity: 'critical',
    callEmergency: true,
    tip: 'Aspirin (325mg) chaba ke khao agar allergy nahi hai. Swallow mat karo.',
    tipHi: 'Aspirin (325mg) चबाएं अगर एलर्जी नहीं है। निगलें नहीं।',
    steps: [
      { icon: '📞', title: '112 call karo', titleHi: '112 कॉल करें', desc: 'Turant ambulance bulao. Location clearly batao.', descHi: 'तुरंत एम्बुलेंस बुलाएं। Location clearly बताएं।', duration: null },
      { icon: '🛋️', title: 'Patient ko comfortable position mein lao', titleHi: 'मरीज को comfortable position में लाएं', desc: 'Half-sitting (45°) ya flat. Tight kapde dhile karo.', descHi: 'Half-sitting (45°) या flat लेटाएं। Tight कपड़े ढीले करें।', duration: null },
      { icon: '💊', title: 'Aspirin do', titleHi: 'Aspirin दें', desc: '325mg aspirin chaba ke khane ko kaho. Allergy check karo pehle.', descHi: '325mg aspirin चबाकर खाने को कहें।', duration: null },
      { icon: '😮‍💨', title: 'Breathing check karo', titleHi: 'सांस चेक करें', desc: '10 seconds tak chest movement dekho.', descHi: '10 सेकंड तक chest movement देखें।', duration: 10 },
      { icon: '🤲', title: 'CPR: 30 chest compressions', titleHi: 'CPR: 30 compressions', desc: 'Chest center mein 5-6 cm, 100-120/min.', descHi: 'Chest center में 5-6 cm, 100-120/min।', duration: 18 },
      { icon: '💨', title: 'CPR: 2 rescue breaths', titleHi: 'CPR: 2 rescue breaths', desc: '30:2 cycle ambulance aane tak.', descHi: '30:2 cycle एम्बुलेंस आने तक।', duration: null },
      { icon: '🏥', title: 'Ambulance ko info do', titleHi: 'एम्बुलेंस को जानकारी दें', desc: 'Age, medicines, allergies, symptoms time batao.', descHi: 'उम्र, दवाइयां, एलर्जी, symptoms का समय बताएं।', duration: null },
    ],
  },
  // ... (baaki scenarios frontend se same hain — add as needed)
];

// ─── GET /api/firstaid ─────────────────────────────────────────────────────────
// All scenarios (public, works offline via client-side cache)
router.get('/', (req, res) => {
  res.json({ success: true, data: FIRST_AID_DATA });
});

// ─── GET /api/firstaid/:id ─────────────────────────────────────────────────────
// Single scenario by ID
router.get('/:id', (req, res) => {
  const scenario = FIRST_AID_DATA.find((s) => s.id === req.params.id);
  if (!scenario) {
    return res.status(404).json({ success: false, message: 'Scenario not found' });
  }
  res.json({ success: true, data: scenario });
});

// ─── POST /api/firstaid/ai-tip  ───────────────────────────────────────────────
// Optional: AI-powered dynamic tip for a scenario (protected route)
// Uses callGemini from your existing ai.js
router.post('/ai-tip', protect, async (req, res) => {
  try {
    const { scenarioId, userContext } = req.body;
    if (!scenarioId) {
      return res.status(400).json({ success: false, message: 'scenarioId required' });
    }

    const { callGemini } = require('../utils/ai');

    const prompt = `You are a first aid AI. For the emergency scenario "${scenarioId}", provide ONE concise actionable tip (max 2 sentences) in simple Hinglish (mix of Hindi and English). Context about patient: ${userContext || 'not provided'}. Return ONLY the tip, no JSON.`;

    const tip = await callGemini(prompt);
    res.json({ success: true, tip: tip.trim() });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;