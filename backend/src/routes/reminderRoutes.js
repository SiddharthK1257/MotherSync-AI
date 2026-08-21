const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Reminder = require('../models/Reminder');
const { isMockMode } = require('../config/db');

// @route   GET /api/reminders or /api/reminders/:userId
// @desc    Get reminders for user
// @access  Private
router.get(['/', '/:userId'], protect, async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user._id;
    if (String(targetUserId) !== String(req.user._id) && req.user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Unauthorized access to user records' });
    }

    if (isMockMode()) {
      return res.json({
        success: true,
        count: 2,
        data: [
          { _id: 'rem_1', type: 'vitals', title: 'Daily Blood Pressure Log', description: 'Log seated morning blood pressure', scheduledTime: new Date(), completed: false },
          { _id: 'rem_2', type: 'hydration', title: 'Hydration Target (80 oz)', description: 'Maintain amniotic fluid hydration volume', scheduledTime: new Date(), completed: true }
        ]
      });
    }

    const reminders = await Reminder.find({ userId: targetUserId }).sort({ scheduledTime: 1 });
    res.json({ success: true, count: reminders.length, data: reminders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/reminders
// @desc    Create a new reminder
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { type, title, description, scheduledTime } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'title is required' });
    }

    if (isMockMode()) {
      const newRem = { _id: 'rem_' + Date.now(), userId: req.user._id, type: type || 'general', title, description, scheduledTime: scheduledTime || new Date(), completed: false };
      return res.status(201).json({ success: true, data: newRem });
    }

    const rem = await Reminder.create({
      userId: req.user._id,
      type: type || 'general',
      title,
      description,
      scheduledTime: scheduledTime || new Date(),
      completed: false
    });

    res.status(201).json({ success: true, data: rem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/reminders/:id/complete
// @desc    Mark reminder as completed
// @access  Private
router.put('/:id/complete', protect, async (req, res) => {
  try {
    if (isMockMode()) {
      return res.json({ success: true, message: 'Reminder marked completed' });
    }
    const rem = await Reminder.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { completed: true },
      { new: true }
    );
    res.json({ success: true, data: rem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
