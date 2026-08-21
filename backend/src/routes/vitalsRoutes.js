const express = require('express');
const router = express.Router();
const HealthRecord = require('../models/HealthRecord');
const TimelineEvent = require('../models/TimelineEvent');
const Alert = require('../models/Alert');
const AuditLog = require('../models/AuditLog');
const mockStore = require('../models/mockStore');
const SafetyEngine = require('../services/safetyEngine');
const { protect } = require('../middleware/authMiddleware');
const { isMockMode } = require('../config/db');

// @route   GET /api/vitals
// @desc    Get all vitals records for the user from MongoDB
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    if (isMockMode() || typeof userId === 'string' && String(userId).startsWith('usr_')) {
      const records = mockStore.healthRecords
        .filter(r => String(r.userId) === String(userId) || r.userId === 'usr_elena_vance_01')
        .sort((a, b) => new Date(a.date || a.recordedAt) - new Date(b.date || b.recordedAt));

      const latestRecord = records[records.length - 1];
      const riskData = latestRecord ? SafetyEngine.evaluateVitalsRisk({
        bpSystolic: latestRecord.bpSystolic || latestRecord.systolicBP,
        bpDiastolic: latestRecord.bpDiastolic || latestRecord.diastolicBP,
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

      return res.json({
        success: true,
        count: records.length,
        data: records,
        currentRisk: riskData
      });
    }

    // MongoDB Mode
    const records = await HealthRecord.find({ userId }).sort({ date: 1, recordedAt: 1 });

    const latestRecord = records[records.length - 1];
    const riskData = latestRecord ? SafetyEngine.evaluateVitalsRisk({
      bpSystolic: latestRecord.bpSystolic || latestRecord.systolicBP,
      bpDiastolic: latestRecord.bpDiastolic || latestRecord.diastolicBP,
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
    console.error('Fetch vitals error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/vitals
// @desc    Log new vitals with validation, risk check, alert creation, and MongoDB storage
router.post('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      week,
      systolicBP,
      diastolicBP,
      bpSystolic,
      bpDiastolic,
      heartRate,
      bloodGlucose,
      glucoseType = 'fasting',
      weight,
      temperature = 36.8,
      oxygenSaturation = 98,
      source = 'manual',
      fetalKicks,
      symptoms = [],
      mood = 'Good',
      waterIntakeOz = 64,
      notes = '',
      recordedAt
    } = req.body;

    const sys = Number(systolicBP || bpSystolic);
    const dia = Number(diastolicBP || bpDiastolic);
    const hr = Number(heartRate);

    // Validation: Reject impossible medical values
    if (!sys || isNaN(sys) || sys < 50 || sys > 260) {
      return res.status(400).json({ success: false, message: 'Please enter a valid systolic blood pressure (50-260 mmHg).' });
    }
    if (!dia || isNaN(dia) || dia < 30 || dia > 180) {
      return res.status(400).json({ success: false, message: 'Please enter a valid diastolic blood pressure (30-180 mmHg).' });
    }
    if (!hr || isNaN(hr) || hr < 30 || hr > 240) {
      return res.status(400).json({ success: false, message: 'Please enter a valid resting heart rate (30-240 bpm).' });
    }
    if (bloodGlucose && (Number(bloodGlucose) < 20 || Number(bloodGlucose) > 600)) {
      return res.status(400).json({ success: false, message: 'Please enter a realistic blood glucose reading (20-600 mg/dL).' });
    }
    if (temperature && (Number(temperature) < 32 || Number(temperature) > 43)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid body temperature (32-43°C).' });
    }
    if (oxygenSaturation && (Number(oxygenSaturation) < 50 || Number(oxygenSaturation) > 100)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid oxygen saturation (50-100% SpO2).' });
    }

    const currentWeek = Number(week) || req.user.gestationalWeek || 24;

    // Run Safety Engine Risk Stratification
    const riskData = SafetyEngine.evaluateVitalsRisk({
      bpSystolic: sys,
      bpDiastolic: dia,
      heartRate: hr,
      bloodGlucose: bloodGlucose ? Number(bloodGlucose) : null,
      week: currentWeek,
      symptoms
    });

    const formattedSymptoms = (Array.isArray(symptoms) ? symptoms : [symptoms])
      .filter(Boolean)
      .map(s => {
        if (typeof s === 'string') {
          return { name: s, severity: 'mild', notes: '' };
        }
        return {
          name: s.name || s.symptom || 'Unspecified symptom',
          severity: s.severity || 'mild',
          notes: s.notes || s.description || ''
        };
      });

    const newRecordData = {
      userId,
      week: currentWeek,
      date: recordedAt ? new Date(recordedAt) : new Date(),
      recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      bpSystolic: sys,
      bpDiastolic: dia,
      systolicBP: sys,
      diastolicBP: dia,
      heartRate: hr,
      bloodGlucose: bloodGlucose ? Number(bloodGlucose) : null,
      glucoseType,
      weight: weight ? Number(weight) : null,
      temperature: Number(temperature) || 36.8,
      oxygenSaturation: Number(oxygenSaturation) || 98,
      source,
      fetalKicks: fetalKicks !== undefined && fetalKicks !== null ? Number(fetalKicks) : null,
      symptoms: formattedSymptoms,
      mood,
      waterIntakeOz: Number(waterIntakeOz) || 64,
      notes,
      riskLevel: riskData.riskLevel,
      riskRationale: riskData.summaryRationale,
      aiFlaggedConcerns: riskData.rationales
    };

    if (isMockMode() || typeof userId === 'string' && String(userId).startsWith('usr_')) {
      const record = { _id: `hr_${Date.now()}`, ...newRecordData };
      mockStore.healthRecords.push(record);

      const timelineEvent = {
        _id: `tle_${Date.now()}`,
        userId,
        week: currentWeek,
        date: new Date(),
        category: 'vital_check',
        title: `Week ${currentWeek} Vitals Logged`,
        description: `BP: ${sys}/${dia} mmHg, HR: ${hr} bpm. Status: ${riskData.badge.label}`,
        badgeType: riskData.riskLevel === 'urgent' ? 'urgent' : riskData.riskLevel === 'prompt_eval' ? 'prompt_eval' : 'routine'
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
      description: `BP: ${sys}/${dia} mmHg, HR: ${hr} bpm. Status: ${riskData.badge.label}`,
      badgeType: riskData.riskLevel === 'urgent' ? 'urgent' : riskData.riskLevel === 'prompt_eval' ? 'prompt_eval' : 'routine'
    });

    // Create Alert in DB if risk is elevated
    if (riskData.riskLevel === 'urgent' || riskData.riskLevel === 'prompt_eval') {
      await Alert.create({
        userId,
        severity: riskData.riskLevel === 'urgent' ? 'urgent' : 'routine',
        category: 'maternal_vitals',
        message: `Elevated vital reading logged (BP ${sys}/${dia} mmHg, HR ${hr} bpm).`,
        recommendedAction: riskData.rationales[0] || 'Prompt medical review recommended.',
        status: 'active',
        source: 'safety_engine'
      });
    }

    await AuditLog.record({
      userId,
      eventType: 'vital_recorded',
      details: { bp: `${sys}/${dia}`, hr, riskLevel: riskData.riskLevel }
    });

    res.status(201).json({
      success: true,
      data: record,
      risk: riskData,
      timelineEvent
    });
  } catch (error) {
    console.error('Log vitals error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/vitals/analytics
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
