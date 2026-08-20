const express = require('express');
const router = express.Router();
const TimelineEvent = require('../models/TimelineEvent');
const mockStore = require('../models/mockStore');
const { protect } = require('../middleware/authMiddleware');
const { isMockMode } = require('../config/db');

// @route   GET /api/timeline
// @desc    Get chronological pregnancy timeline events from MongoDB
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    if (isMockMode() || typeof userId === 'string' && String(userId).startsWith('usr_')) {
      const events = mockStore.timelineEvents
        .filter(t => String(t.userId) === String(userId) || t.userId === 'usr_elena_vance_01')
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      return res.json({
        success: true,
        count: events.length,
        data: events
      });
    }

    const events = await TimelineEvent.find({ userId }).sort({ date: -1 });
    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
