const express = require('express');
const router = express.Router();
const User = require('../models/User');
const PregnancyProfile = require('../models/PregnancyProfile');
const HealthRecord = require('../models/HealthRecord');
const Symptom = require('../models/Symptom');
const FetalKickRecord = require('../models/FetalKickRecord');
const MedicalReport = require('../models/MedicalReport');
const Appointment = require('../models/Appointment');
const Alert = require('../models/Alert');
const SafetyEngine = require('../services/safetyEngine');
const { protect } = require('../middleware/authMiddleware');
const mockStore = require('../models/mockStore');
const { isMockMode } = require('../config/db');

// @route   GET /api/dashboard
// @desc    Get dynamic aggregate pregnancy command center data from MongoDB
router.get('/', protect, async (req, res) => {
  try {
    const user = req.user;
    const userId = user._id;

    if (isMockMode() || typeof userId === 'string' && String(userId).startsWith('usr_')) {
      const records = mockStore.healthRecords
        .filter(r => String(r.userId) === String(userId) || r.userId === 'usr_elena_vance_01')
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      const appointments = mockStore.appointments
        .filter(a => String(a.userId) === String(userId) || a.userId === 'usr_elena_vance_01')
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      const reports = mockStore.medicalReports
        .filter(r => String(r.userId) === String(userId) || r.userId === 'usr_elena_vance_01')
        .sort((a, b) => new Date(b.dateUploaded) - new Date(a.dateUploaded));

      const latestRecord = records[records.length - 1] || null;
      const nextAppointment = appointments.find(a => a.status === 'upcoming' && new Date(a.date) >= new Date()) || appointments[0] || null;

      const gWeek = user.gestationalWeek || 24;
      const trimester = gWeek <= 13 ? 1 : gWeek <= 27 ? 2 : 3;

      const riskData = latestRecord ? SafetyEngine.evaluateVitalsRisk({
        bpSystolic: latestRecord.bpSystolic || 120,
        bpDiastolic: latestRecord.bpDiastolic || 78,
        heartRate: latestRecord.heartRate || 80,
        bloodGlucose: latestRecord.bloodGlucose,
        week: gWeek,
        symptoms: latestRecord.symptoms
      }) : SafetyEngine.evaluateVitalsRisk({
        bpSystolic: 120,
        bpDiastolic: 80,
        heartRate: 80,
        week: gWeek
      });

      return res.json({
        success: true,
        data: {
          patient: {
            id: user._id,
            name: user.name || 'Elena Vance',
            email: user.email,
            role: user.role
          },
          pregnancy: {
            gestationalWeek: gWeek,
            trimester,
            estimatedDueDate: user.dueDate || new Date(Date.now() + (40 - gWeek) * 7 * 24 * 60 * 60 * 1000),
            progressPercent: Math.min(100, Math.round((gWeek / 40) * 100))
          },
          latestVitals: latestRecord ? {
            bpSystolic: latestRecord.bpSystolic,
            bpDiastolic: latestRecord.bpDiastolic,
            heartRate: latestRecord.heartRate,
            bloodGlucose: latestRecord.bloodGlucose,
            weight: latestRecord.weight,
            temperature: latestRecord.temperature || 36.8,
            oxygenSaturation: latestRecord.oxygenSaturation || 98,
            fetalKicks: latestRecord.fetalKicks,
            recordedAt: latestRecord.date
          } : null,
          recentSymptoms: latestRecord?.symptoms || [],
          recentKicks: records.filter(r => r.fetalKicks !== null && r.fetalKicks !== undefined).slice(-3),
          latestReport: reports[0] || null,
          nextAppointment,
          safetyStatus: riskData,
          recordsCount: records.length,
          historicalRecords: records.slice(-8),
          alerts: [
            {
              severity: riskData.riskLevel === 'urgent' ? 'urgent' : 'routine',
              message: riskData.summaryRationale,
              createdAt: new Date()
            }
          ]
        }
      });
    }

    // MongoDB Mode
    const [profile, records, symptoms, kicks, reports, appointments, alerts] = await Promise.all([
      PregnancyProfile.findOne({ userId }),
      HealthRecord.find({ userId }).sort({ date: 1 }),
      Symptom.find({ userId }).sort({ recordedAt: -1 }).limit(5),
      FetalKickRecord.find({ userId }).sort({ recordedAt: -1 }).limit(5),
      MedicalReport.find({ userId }).sort({ dateUploaded: -1 }).limit(5),
      Appointment.find({ userId }).sort({ date: 1 }),
      Alert.find({ userId, status: 'active' }).sort({ createdAt: -1 }).limit(5)
    ]);

    // Calculate dynamic gestational week
    let calculatedWeek = user.gestationalWeek || 24;
    let dueDate = user.dueDate;

    if (profile) {
      if (profile.pregnancyStartDate) {
        const diffDays = Math.floor((new Date() - new Date(profile.pregnancyStartDate)) / (1000 * 60 * 60 * 24));
        calculatedWeek = Math.max(1, Math.min(42, Math.floor(diffDays / 7) + 1));
      } else if (profile.gestationalWeek) {
        calculatedWeek = profile.gestationalWeek;
      }
      if (profile.estimatedDueDate) {
        dueDate = profile.estimatedDueDate;
      }
    } else if (user.pregnancyStartDate) {
      const diffDays = Math.floor((new Date() - new Date(user.pregnancyStartDate)) / (1000 * 60 * 60 * 24));
      calculatedWeek = Math.max(1, Math.min(42, Math.floor(diffDays / 7) + 1));
    }

    const calculatedTrimester = calculatedWeek <= 13 ? 1 : calculatedWeek <= 27 ? 2 : 3;
    const latestRecord = records.length > 0 ? records[records.length - 1] : null;
    const nextAppointment = appointments.find(a => a.status === 'upcoming' && new Date(a.date) >= new Date()) || appointments[0] || null;

    const riskData = latestRecord ? SafetyEngine.evaluateVitalsRisk({
      bpSystolic: latestRecord.bpSystolic || latestRecord.systolicBP || 120,
      bpDiastolic: latestRecord.bpDiastolic || latestRecord.diastolicBP || 78,
      heartRate: latestRecord.heartRate || 80,
      bloodGlucose: latestRecord.bloodGlucose,
      week: calculatedWeek,
      symptoms: latestRecord.symptoms?.length > 0 ? latestRecord.symptoms : symptoms
    }) : SafetyEngine.evaluateVitalsRisk({
      bpSystolic: 120,
      bpDiastolic: 80,
      heartRate: 80,
      week: calculatedWeek
    });

    res.json({
      success: true,
      data: {
        patient: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        pregnancy: {
          gestationalWeek: calculatedWeek,
          trimester: calculatedTrimester,
          estimatedDueDate: dueDate || new Date(Date.now() + (40 - calculatedWeek) * 7 * 24 * 60 * 60 * 1000),
          progressPercent: Math.min(100, Math.round((calculatedWeek / 40) * 100))
        },
        latestVitals: latestRecord ? {
          bpSystolic: latestRecord.bpSystolic || latestRecord.systolicBP,
          bpDiastolic: latestRecord.bpDiastolic || latestRecord.diastolicBP,
          heartRate: latestRecord.heartRate,
          bloodGlucose: latestRecord.bloodGlucose,
          weight: latestRecord.weight,
          temperature: latestRecord.temperature,
          oxygenSaturation: latestRecord.oxygenSaturation,
          fetalKicks: latestRecord.fetalKicks,
          recordedAt: latestRecord.date || latestRecord.recordedAt
        } : null,
        recentSymptoms: symptoms.length > 0 ? symptoms : (latestRecord?.symptoms || []),
        recentKicks: kicks,
        latestReport: reports[0] || null,
        nextAppointment,
        safetyStatus: riskData,
        recordsCount: records.length,
        historicalRecords: records.slice(-8),
        alerts
      }
    });
  } catch (error) {
    console.error('Dashboard aggregate error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
