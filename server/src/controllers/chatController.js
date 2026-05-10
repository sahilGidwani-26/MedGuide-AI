const Chat = require('../models/Chat');
const { chatWithAI } = require('../ai/gemini');
const { v4: uuidv4 } = require('uuid');

// @desc    Send message to AI chatbot
// @route   POST /api/chat/message
exports.sendMessage = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || message.trim().length < 1) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    let chat;
    const sid = sessionId || uuidv4();

    if (sessionId) {
      chat = await Chat.findOne({ sessionId, user: req.user.id });
    }

    if (!chat) {
      chat = new Chat({
        user: req.user.id,
        sessionId: sid,
        messages: []
      });
    }

    // Add user message
    chat.messages.push({ role: 'user', content: message.trim() });

    // Get last 10 messages for context
    const recentMessages = chat.messages.slice(-10);

    // Get AI response
    const aiResponse = await chatWithAI(recentMessages);

    // Add AI response
    chat.messages.push({ role: 'assistant', content: aiResponse });
    await chat.save();

    res.json({
      success: true,
      data: {
        sessionId: chat.sessionId,
        message: aiResponse,
        messageCount: chat.messages.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get chat history
// @route   GET /api/chat/history
exports.getChatHistory = async (req, res, next) => {
  try {
    const chats = await Chat.find({ user: req.user.id, isActive: true })
      .sort({ updatedAt: -1 })
      .limit(20)
      .select('sessionId messages createdAt updatedAt');

    res.json({ success: true, data: chats });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single chat session
// @route   GET /api/chat/:sessionId
exports.getChatSession = async (req, res, next) => {
  try {
    const chat = await Chat.findOne({ sessionId: req.params.sessionId, user: req.user.id });
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat session not found' });
    }
    res.json({ success: true, data: chat });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete chat session
// @route   DELETE /api/chat/:sessionId
exports.deleteChatSession = async (req, res, next) => {
  try {
    await Chat.findOneAndUpdate(
      { sessionId: req.params.sessionId, user: req.user.id },
      { isActive: false }
    );
    res.json({ success: true, message: 'Chat session deleted' });
  } catch (error) {
    next(error);
  }
};
