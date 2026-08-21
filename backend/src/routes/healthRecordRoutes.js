const express = require('express');
const router = express.Router();
const HealthRecord = require('../models/HealthRecord');
const TimelineEvent = require('../models/TimelineEvent');
const mockStore = require('../models/mockStore');
const SafetyEngine = require('../services/safetyEngine');
const { protect } = require('../middleware/authMiddleware');
const { isMockMode } = require('../config/db');

// @route   GET /api/health-records
// @desc    Get all health telemetry records for the logged in patient from MongoDB
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    if (isMockMode() || typeof userId === 'string' && String(userId).startsWith('usr_')) {
      const records = mockStore.healthRecords
        .filter(r => String(r.userId) === String(userId) || r.userId === 'usr_elena_vance_01')
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      const latestRecord = records[records.length - 1];
      const riskData = latestRecord ? SafetyEngine.evaluateVitalsRisk({
        bpSystolic: latestRecord.bpSystolic,
        bpDiastolic: latestRecord.bpDiastolic,
        heartRate: latestRecord.heartRate,
        bloodGlucose: latestRecord.bloodGlucose,
        week: latestRecord.week,
        symptoms: latestRecord.symptoms
      }) : SafetyEngine.evaluateVitalsRisk({
        bpSystolic: req.user.baselineVitals?.bpSystolic || 118,
        bpDiastolic: req.user.baselineVitals?.bpDiastolic || 76,
        heartRate: req.user.baselineVitals?.heartRate || 78,
        bloodGlucose: req.user.baselineVitals?.bloodGlucose || 90,
        week: req.user.gestationalWeek || 24
      });

      return res.json({
        success: true,
        count: records.length,
        data: records,
        currentRisk: riskData
      });
    }

    // MongoDB Mode
    let records = await HealthRecord.find({ userId }).sort({ date: 1 });

    // If a registered user has no records yet, initialize with baseline
    if (records.length === 0) {
      const baseline = await HealthRecord.create({
        userId,
        week: req.user.gestationalWeek || 24,
        date: new Date(),
        bpSystolic: req.user.baselineVitals?.bpSystolic || 120,
        bpDiastolic: req.user.baselineVitals?.bpDiastolic || 78,
        heartRate: req.user.baselineVitals?.heartRate || 80,
        bloodGlucose: req.user.baselineVitals?.bloodGlucose || 90,
        glucoseType: 'fasting',
        weight: req.user.baselineVitals?.weight || 65,
        fetalKicks: (req.user.gestationalWeek || 24) >= 24 ? 10 : null,
        symptoms: [],
        mood: 'Normal',
        waterIntakeOz: 64,
        riskLevel: 'routine',
        riskRationale: 'Baseline vitals telemetry established.',
        aiFlaggedConcerns: []
      });
      records = [baseline];
    }

    const latestRecord = records[records.length - 1];
    const riskData = latestRecord ? SafetyEngine.evaluateVitalsRisk({
      bpSystolic: latestRecord.bpSystolic,
      bpDiastolic: latestRecord.bpDiastolic,
      heartRate: latestRecord.heartRate,
      bloodGlucose: latestRecord.bloodGlucose,
      week: latestRecord.week,
      symptoms: latestRecord.symptoms
    }) : SafetyEngine.evaluateVitalsRisk({
      bpSystolic: 120,
      bpDiastolic: 80,
      heartRate: 80,
      week: req.user.gestationalWeek || 24
    });

    res.json({
      success: true,
      count: records.length,
      data: records,
      currentRisk: riskData
    });
  } catch (error) {
    console.error('Fetch health records error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/health-records
// @desc    Log new vitals & symptoms telemetry into MongoDB
router.post('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      week,
      bpSystolic,
      bpDiastolic,
      heartRate,
      bloodGlucose,
      glucoseType = 'fasting',
      weight,
      fetalKicks,
      symptoms = [],
      mood = 'Good',
      waterIntakeOz = 64,
      notes = ''
    } = req.body;

    if (!bpSystolic || !bpDiastolic || !heartRate) {
      return res.status(400).json({
        success: false,
        message: 'Systolic BP, Diastolic BP, and Heart Rate are required.'
      });
    }

    const currentWeek = Number(week) || req.user.gestationalWeek || 24;

    // Run Medical Safety Engine Risk Stratification
    const riskData = SafetyEngine.evaluateVitalsRisk({
      bpSystolic: Number(bpSystolic),
      bpDiastolic: Number(bpDiastolic),
      heartRate: Number(heartRate),
      bloodGlucose: bloodGlucose ? Number(bloodGlucose) : null,
      week: currentWeek,
      symptoms
    });

    const newRecordData = {
      userId,
      week: currentWeek,
      date: new Date(),
      bpSystolic: Number(bpSystolic),
      bpDiastolic: Number(bpDiastolic),
      heartRate: Number(heartRate),
      bloodGlucose: bloodGlucose ? Number(bloodGlucose) : null,
      glucoseType,
      weight: weight ? Number(weight) : null,
      fetalKicks: fetalKicks !== undefined && fetalKicks !== null ? Number(fetalKicks) : null,
      symptoms: Array.isArray(symptoms)
        ? symptoms.map(s => typeof s === 'string' ? { name: s, severity: 'mild' } : s)
        : (symptoms ? [{ name: String(symptoms), severity: 'mild' }] : []),
      mood: mood || 'Normal',
      waterIntakeOz: Number(waterIntakeOz) || 64,
      notes,
      riskLevel: riskData.riskLevel,
      riskRationale: riskData.summaryRationale,
      aiFlaggedConcerns: riskData.rationales
    };

    if (isMockMode() || typeof userId === 'string' && String(userId).startsWith('usr_')) {
      const recordId = `hr_log_${Date.now()}`;
      const record = { _id: recordId, ...newRecordData };
      mockStore.healthRecords.push(record);

      const timelineId = `tle_${Date.now()}`;
      const timelineEvent = {
        _id: timelineId,
        userId,
        week: currentWeek,
        date: new Date(),
        category: 'vital_check',
        title: `Week ${currentWeek} Vitals Logged`,
        description: `BP: ${bpSystolic}/${bpDiastolic} mmHg, HR: ${heartRate} bpm${bloodGlucose ? `, Glucose: ${bloodGlucose} mg/dL` : ''}. Status: ${riskData.badge.label}.`,
        badgeType: riskData.riskLevel === 'urgent' ? 'urgent' : riskData.riskLevel === 'prompt_eval' ? 'prompt_eval' : riskData.riskLevel === 'follow_up' ? 'follow_up' : 'routine'
      };
      mockStore.timelineEvents.push(timelineEvent);

      return res.status(201).json({
        success: true,
        data: record,
        risk: riskData,
        timelineEvent
      });
    }

    // MongoDB Mode
    const record = await HealthRecord.create(newRecordData);

    const timelineEvent = await TimelineEvent.create({
      userId,
      week: currentWeek,
      date: new Date(),
      category: 'vital_check',
      title: `Week ${currentWeek} Vitals Logged`,
      description: `BP: ${bpSystolic}/${bpDiastolic} mmHg, HR: ${heartRate} bpm. Status: ${riskData.badge.label}`,
      badgeType: riskData.riskLevel === 'urgent' ? 'urgent' : riskData.riskLevel === 'prompt_eval' ? 'prompt_eval' : riskData.riskLevel === 'follow_up' ? 'follow_up' : 'routine'
    });

    res.status(201).json({
      success: true,
      data: record,
      risk: riskData,
      timelineEvent
    });
  } catch (error) {
    console.error('Log health record error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/health-records/kick
// @desc    Quick session log for fetal kick counting
router.post('/kick', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { kickCount, durationMinutes = 120, notes = '' } = req.body;

    const count = Number(kickCount) || 10;
    const week = req.user.gestationalWeek || 24;

    const summaryText = count >= 10
      ? `Normal fetal movement goal achieved (${count} kicks logged within ${durationMinutes} mins).`
      : `Logged ${count} kicks in ${durationMinutes} mins. If you perceive reduced movement, rest quietly on left side and hydrate. Contact your clinic if pattern does not resume.`;

    if (isMockMode() || typeof userId === 'string' && String(userId).startsWith('usr_')) {
      const userRecords = mockStore.healthRecords.filter(r => String(r.userId) === String(userId) || r.userId === 'usr_elena_vance_01');
      const latest = userRecords[userRecords.length - 1];
      if (latest) {
        latest.fetalKicks = count;
      }

      const timelineId = `tle_kick_${Date.now()}`;
      const kickEvent = {
        _id: timelineId,
        userId,
        week,
        date: new Date(),
        category: 'fetal_milestone',
        title: `Fetal Kick Count Session: ${count} Kicks`,
        description: summaryText,
        badgeType: count >= 10 ? 'milestone' : 'follow_up'
      };
      mockStore.timelineEvents.push(kickEvent);

      return res.json({
        success: true,
        kickCount: count,
        durationMinutes,
        status: count >= 10 ? 'adequate' : 'monitor_closely',
        feedback: summaryText
      });
    }

    // MongoDB Mode
    const latest = await HealthRecord.findOne({ userId }).sort({ date: -1 });
    if (latest) {
      latest.fetalKicks = count;
      await latest.save();
    } else {
      await HealthRecord.create({
        userId,
        week,
        date: new Date(),
        bpSystolic: 120,
        bpDiastolic: 78,
        heartRate: 80,
        fetalKicks: count,
        riskLevel: 'routine'
      });
    }

    await TimelineEvent.create({
      userId,
      week,
      date: new Date(),
      category: 'fetal_milestone',
      title: `Fetal Kick Count Session: ${count} Kicks`,
      description: summaryText,
      badgeType: count >= 10 ? 'milestone' : 'follow_up'
    });

    res.json({
      success: true,
      kickCount: count,
      durationMinutes,
      status: count >= 10 ? 'adequate' : 'monitor_closely',
      feedback: summaryText
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/health-records/analytics
// @desc    Get aggregated telemetry analytics and trends from MongoDB
router.get('/analytics', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    let records = [];

    if (isMockMode() || typeof userId === 'string' && String(userId).startsWith('usr_')) {
      records = mockStore.healthRecords.filter(r => String(r.userId) === String(userId) || r.userId === 'usr_elena_vance_01');
    } else {
      records = await HealthRecord.find({ userId }).sort({ date: 1 });
    }

    if (records.length === 0) {
      return res.json({
        success: true,
        analytics: {
          avgSystolic: 120,
          avgDiastolic: 80,
          avgHeartRate: 80,
          totalLogs: 0,
          kickLogs: []
        }
      });
    }

    const avgSystolic = Math.round(records.reduce((acc, r) => acc + (r.bpSystolic || 0), 0) / records.length);
    const avgDiastolic = Math.round(records.reduce((acc, r) => acc + (r.bpDiastolic || 0), 0) / records.length);
    const avgHeartRate = Math.round(records.reduce((acc, r) => acc + (r.heartRate || 0), 0) / records.length);

    res.json({
      success: true,
      analytics: {
        avgSystolic,
        avgDiastolic,
        avgHeartRate,
        totalLogs: records.length,
        records: records.slice(-8),
        kicks: records.filter(r => r.fetalKicks !== null && r.fetalKicks !== undefined).map(r => ({ week: r.week, kicks: r.fetalKicks, date: r.date }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
