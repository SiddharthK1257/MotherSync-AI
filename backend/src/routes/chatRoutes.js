const express = require('express');
const router = express.Router();
const ChatHistory = require('../models/ChatHistory');
const { protect } = require('../middleware/authMiddleware');
const { isMockMode } = require('../config/db');

// In-memory chat storage fallback
const inMemoryChatLogs = [];

// @route   GET /api/chat/history
// @desc    Get chat conversation history for the current session / user
router.get('/history', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionId = 'default_session' } = req.query;

    if (isMockMode() || typeof userId === 'string' && String(userId).startsWith('usr_')) {
      const logs = inMemoryChatLogs.filter(c => String(c.userId) === String(userId) && c.sessionId === sessionId);
      return res.json({
        success: true,
        count: logs.length,
        data: logs
      });
    }

    const history = await ChatHistory.find({ userId, sessionId }).sort({ createdAt: 1 });
    res.json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error('Fetch chat history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/chat/history
// @desc    Clear session chat history
router.delete('/history', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionId = 'default_session' } = req.query;

    if (isMockMode() || typeof userId === 'string' && String(userId).startsWith('usr_')) {
      for (let i = inMemoryChatLogs.length - 1; i >= 0; i--) {
        if (String(inMemoryChatLogs[i].userId) === String(userId) && inMemoryChatLogs[i].sessionId === sessionId) {
          inMemoryChatLogs.splice(i, 1);
        }
      }
      return res.json({ success: true, message: 'Chat history cleared' });
    }

    await ChatHistory.deleteMany({ userId, sessionId });
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
