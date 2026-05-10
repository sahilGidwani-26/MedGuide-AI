const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Placeholder for FCM notifications
router.post('/send', protect, async (req, res) => {
  res.json({ success: true, message: 'Notification queued' });
});

router.get('/', protect, async (req, res) => {
  res.json({ success: true, data: [] });
});

module.exports = router;
