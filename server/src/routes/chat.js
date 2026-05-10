const express = require('express');
const router = express.Router();
const { sendMessage, getChatHistory, getChatSession, deleteChatSession } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/message', sendMessage);
router.get('/history', getChatHistory);
router.route('/:sessionId').get(getChatSession).delete(deleteChatSession);

module.exports = router;
