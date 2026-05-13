const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  getData,
  logMood,      clearMoods,
  logStress,    clearStress,
  logBreathing, clearBreathing,
  logPhq9,      clearPhq9,
  chat,         clearChat,
  getSummary,
} = require('../controllers/mentalHealthController');

// All routes require authentication
router.use(protect);

// Full data + summary
router.get('/',        getData);
router.get('/summary', getSummary);

// Mood
router.post  ('/mood', logMood);
router.delete('/mood', clearMoods);

// Stress
router.post  ('/stress', logStress);
router.delete('/stress', clearStress);

// Breathing
router.post  ('/breathing', logBreathing);
router.delete('/breathing', clearBreathing);

// PHQ-9
router.post  ('/phq9', logPhq9);
router.delete('/phq9', clearPhq9);

// AI Chat
router.post  ('/chat', chat);
router.delete('/chat', clearChat);

module.exports = router;