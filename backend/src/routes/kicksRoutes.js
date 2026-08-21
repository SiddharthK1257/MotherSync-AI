const express = require('express');
const router = express.Router();
const FetalKickRecord = require('../models/FetalKickRecord');
const HealthRecord = require('../models/HealthRecord');
const TimelineEvent = require('../models/TimelineEvent');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/authMiddleware');
const mockStore = require('../models/mockStore');
const { isMockMode } = require('../config/db');

// @route   GET /api/kicks
// @desc    Get all fetal kick count records from MongoDB
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    if (isMockMode() || typeof userId === 'string' && String(userId).startsWith('usr_')) {
      const records = mockStore.healthRecords
        .filter(r => (String(r.userId) === String(userId) || r.userId === 'usr_elena_vance_01') && r.fetalKicks !== null && r.fetalKicks !== undefined)
        .map(r => ({
          _id: `kck_${r._id}`,
          userId: r.userId,
          recordedAt: r.date,
          duration: 120,
          kickCount: r.fetalKicks,
          notes: 'Standard 2-hour count session'
        }));

      return res.json({
        success: true,
        count: records.length,
        data: records
      });
    }

    const kicks = await FetalKickRecord.find({ userId }).sort({ recordedAt: -1 });
    res.json({
      success: true,
      count: kicks.length,
      data: kicks
    });
  } catch (error) {
    console.error('Fetch kicks error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/kicks
// @desc    Record fetal movement session into MongoDB
router.post('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { kickCount, duration = 120, notes = '', recordedAt } = req.body;

    const count = Number(kickCount);
    if (isNaN(count) || count < 0 || count > 150) {
      return res.status(400).json({ success: false, message: 'Please enter a valid kick count (0-150).' });
    }

    const currentWeek = req.user.gestationalWeek || 24;
    const feedback = count >= 10
      ? `Fetal movement benchmark achieved (${count} movements logged within ${duration} mins).`
      : `Logged ${count} kicks in ${duration} mins. If movement feels noticeably reduced, rest quietly on left side and hydrate. Contact your clinic if pattern does not resume.`;

    const kickData = {
      userId,
      recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      duration: Number(duration) || 120,
      kickCount: count,
      notes
    };

    if (isMockMode() || typeof userId === 'string' && String(userId).startsWith('usr_')) {
      const saved = { _id: `kck_${Date.now()}`, ...kickData };

      const userRecords = mockStore.healthRecords.filter(r => String(r.userId) === String(userId) || r.userId === 'usr_elena_vance_01');
      const latest = userRecords[userRecords.length - 1];
      if (latest) latest.fetalKicks = count;

      mockStore.timelineEvents.push({
        _id: `tle_kck_${Date.now()}`,
        userId,
        week: currentWeek,
        date: new Date(),
        category: 'fetal_milestone',
        title: `Fetal Kick Count Session: ${count} Kicks`,
        description: feedback,
        badgeType: count >= 10 ? 'milestone' : 'follow_up'
      });

      return res.status(201).json({
        success: true,
        data: saved,
        status: count >= 10 ? 'adequate' : 'monitor_closely',
        feedback
      });
    }

    const saved = await FetalKickRecord.create(kickData);

    // Update latest health record's kicks
    const latestHealthRec = await HealthRecord.findOne({ userId }).sort({ date: -1 });
    if (latestHealthRec) {
      latestHealthRec.fetalKicks = count;
      await latestHealthRec.save();
    }

    await TimelineEvent.create({
      userId,
      week: currentWeek,
      date: new Date(),
      category: 'fetal_milestone',
      title: `Fetal Kick Count Session: ${count} Kicks`,
      description: feedback,
      badgeType: count >= 10 ? 'milestone' : 'follow_up'
    });

    await AuditLog.record({
      userId,
      eventType: 'fetal_kick_recorded',
      details: { kickCount: count, duration }
    });

    res.status(201).json({
      success: true,
      data: saved,
      status: count >= 10 ? 'adequate' : 'monitor_closely',
      feedback
    });
  } catch (error) {
    console.error('Log kicks error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
