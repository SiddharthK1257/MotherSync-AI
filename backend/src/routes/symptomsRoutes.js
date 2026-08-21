const express = require('express');
const router = express.Router();
const Symptom = require('../models/Symptom');
const Alert = require('../models/Alert');
const AuditLog = require('../models/AuditLog');
const SafetyEngine = require('../services/safetyEngine');
const { protect } = require('../middleware/authMiddleware');
const mockStore = require('../models/mockStore');
const { isMockMode } = require('../config/db');

// @route   GET /api/symptoms
// @desc    Get all logged symptoms for user from MongoDB
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    if (isMockMode() || typeof userId === 'string' && String(userId).startsWith('usr_')) {
      const records = mockStore.healthRecords.filter(r => String(r.userId) === String(userId) || r.userId === 'usr_elena_vance_01');
      const allSymptoms = [];
      records.forEach(r => {
        if (r.symptoms && Array.isArray(r.symptoms)) {
          r.symptoms.forEach(s => {
            allSymptoms.push({
              _id: `sym_${Date.now()}_${Math.random()}`,
              symptom: typeof s === 'string' ? s : s.name,
              severity: s.severity || 'mild',
              recordedAt: r.date || new Date(),
              description: s.notes || ''
            });
          });
        }
      });

      return res.json({
        success: true,
        count: allSymptoms.length,
        data: allSymptoms
      });
    }

    const symptoms = await Symptom.find({ userId }).sort({ recordedAt: -1 });
    res.json({
      success: true,
      count: symptoms.length,
      data: symptoms
    });
  } catch (error) {
    console.error('Fetch symptoms error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/symptoms
// @desc    Log a new symptom into MongoDB with safety evaluation
router.post('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { symptom, severity = 'mild', duration = 'Recent', description = '', associatedSymptoms = [] } = req.body;

    if (!symptom || symptom.trim() === '') {
      return res.status(400).json({ success: false, message: 'Symptom name is required.' });
    }

    // Safety Engine check
    const emergencyScan = SafetyEngine.detectEmergency(`${symptom} ${description}`);

    const symptomData = {
      userId,
      recordedAt: new Date(),
      symptom: symptom.trim(),
      severity: emergencyScan.isEmergency ? 'severe' : severity,
      duration,
      description,
      associatedSymptoms: Array.isArray(associatedSymptoms) ? associatedSymptoms : [associatedSymptoms],
      status: 'active'
    };

    if (isMockMode() || typeof userId === 'string' && String(userId).startsWith('usr_')) {
      const saved = { _id: `sym_${Date.now()}`, ...symptomData };
      return res.status(201).json({
        success: true,
        data: saved,
        isEmergency: emergencyScan.isEmergency,
        riskLevel: emergencyScan.riskLevel
      });
    }

    const saved = await Symptom.create(symptomData);

    if (emergencyScan.isEmergency) {
      await Alert.create({
        userId,
        severity: 'emergency',
        category: 'symptom_triage',
        message: `High-priority symptom logged: "${symptom}".`,
        recommendedAction: 'Immediate in-person maternal emergency evaluation advised.',
        status: 'active',
        source: 'safety_engine'
      });
    }

    await AuditLog.record({
      userId,
      eventType: 'symptom_recorded',
      details: { symptom, severity: saved.severity, isEmergency: emergencyScan.isEmergency }
    });

    res.status(201).json({
      success: true,
      data: saved,
      isEmergency: emergencyScan.isEmergency,
      riskLevel: emergencyScan.riskLevel
    });
  } catch (error) {
    console.error('Log symptom error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
