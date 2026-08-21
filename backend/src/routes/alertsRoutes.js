const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const EmergencyLog = require('../models/EmergencyLog');
const { protect } = require('../middleware/authMiddleware');
const mockStore = require('../models/mockStore');
const { isMockMode } = require('../config/db');

// @route   GET /api/alerts
// @desc    Get all active alerts for current patient from MongoDB
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    if (isMockMode() || typeof userId === 'string' && String(userId).startsWith('usr_')) {
      const emergencyAlerts = (mockStore.emergencyLogs || [])
        .filter(e => String(e.userId) === String(userId) || e.userId === 'usr_elena_vance_01')
        .map(e => ({
          _id: `alt_${e._id}`,
          createdAt: e.timestamp,
          severity: 'urgent',
          category: 'emergency_sos',
          message: e.emergencySummary,
          recommendedAction: e.urgentInstructions?.[0] || 'Seek immediate medical evaluation.',
          status: e.resolved ? 'resolved' : 'active',
          source: 'red_alert'
        }));

      const defaultAlerts = [
        {
          _id: 'alt_def_01',
          createdAt: new Date(),
          severity: 'routine',
          category: 'maternal_telemetry',
          message: 'Week 24 baseline blood pressure and fetal kick tracking active.',
          recommendedAction: 'Maintain hydration and log your scheduled readings.',
          status: 'active',
          source: 'safety_engine'
        },
        ...emergencyAlerts
      ];

      return res.json({
        success: true,
        count: defaultAlerts.length,
        data: defaultAlerts
      });
    }

    const alerts = await Alert.find({ userId }).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    console.error('Fetch alerts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
