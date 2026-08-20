const express = require('express');
const router = express.Router();
const User = require('../models/User');
const HealthRecord = require('../models/HealthRecord');
const MedicalReport = require('../models/MedicalReport');
const Appointment = require('../models/Appointment');
const TimelineEvent = require('../models/TimelineEvent');
const mockStore = require('../models/mockStore');
const SafetyEngine = require('../services/safetyEngine');
const { protect } = require('../middleware/authMiddleware');
const { isMockMode } = require('../config/db');

// @route   GET /api/doctor/patients
// @desc    Get all pregnant patients monitored by the physician from MongoDB
router.get('/patients', protect, async (req, res) => {
  try {
    if (isMockMode() || typeof req.user._id === 'string' && String(req.user._id).startsWith('usr_')) {
      const patient = mockStore.users.find(u => u.role === 'patient') || mockStore.users[0];
      const records = mockStore.healthRecords.filter(r => String(r.userId) === String(patient._id));
      const latest = records[records.length - 1];

      const riskData = latest ? SafetyEngine.evaluateVitalsRisk({
        bpSystolic: latest.bpSystolic,
        bpDiastolic: latest.bpDiastolic,
        heartRate: latest.heartRate,
        bloodGlucose: latest.bloodGlucose,
        week: latest.week,
        symptoms: latest.symptoms
      }) : { riskLevel: 'routine', badge: SafetyEngine.getRiskBadge('routine') };

      const patientSummary = [{
        _id: patient._id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        gestationalWeek: patient.gestationalWeek,
        currentTrimester: patient.currentTrimester,
        dueDate: patient.dueDate,
        latestVitals: latest ? {
          bp: `${latest.bpSystolic}/${latest.bpDiastolic} mmHg`,
          hr: `${latest.heartRate} bpm`,
          glucose: latest.bloodGlucose ? `${latest.bloodGlucose} mg/dL` : 'N/A',
          weight: latest.weight ? `${latest.weight} kg` : 'N/A',
          date: latest.date
        } : { bp: '124/82 mmHg', hr: '84 bpm' },
        riskStatus: riskData,
        reportsCount: mockStore.medicalReports.length,
        pendingReviewCount: mockStore.medicalReports.filter(r => !r.doctorReviewed).length
      }];

      return res.json({
        success: true,
        count: patientSummary.length,
        data: patientSummary
      });
    }

    // MongoDB Mode
    const patients = await User.find({ role: 'patient' });
    const patientSummaries = await Promise.all(patients.map(async (p) => {
      const records = await HealthRecord.find({ userId: p._id }).sort({ date: 1 });
      const reports = await MedicalReport.find({ userId: p._id });
      const latest = records[records.length - 1];

      const riskData = latest ? SafetyEngine.evaluateVitalsRisk({
        bpSystolic: latest.bpSystolic,
        bpDiastolic: latest.bpDiastolic,
        heartRate: latest.heartRate,
        bloodGlucose: latest.bloodGlucose,
        week: latest.week,
        symptoms: latest.symptoms
      }) : { riskLevel: 'routine', badge: SafetyEngine.getRiskBadge('routine') };

      return {
        _id: p._id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        gestationalWeek: p.gestationalWeek,
        currentTrimester: p.currentTrimester,
        dueDate: p.dueDate,
        latestVitals: latest ? {
          bp: `${latest.bpSystolic}/${latest.bpDiastolic} mmHg`,
          hr: `${latest.heartRate} bpm`,
          glucose: latest.bloodGlucose ? `${latest.bloodGlucose} mg/dL` : 'N/A',
          weight: latest.weight ? `${latest.weight} kg` : 'N/A',
          date: latest.date
        } : { bp: `${p.baselineVitals?.bpSystolic || 120}/${p.baselineVitals?.bpDiastolic || 78} mmHg`, hr: `${p.baselineVitals?.heartRate || 80} bpm` },
        riskStatus: riskData,
        reportsCount: reports.length,
        pendingReviewCount: reports.filter(r => !r.doctorReviewed).length
      };
    }));

    res.json({
      success: true,
      count: patientSummaries.length,
      data: patientSummaries
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/doctor/patient/:id
// @desc    Get complete clinical dossier for a single patient from MongoDB
router.get('/patient/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (isMockMode() || typeof req.user._id === 'string' && String(req.user._id).startsWith('usr_')) {
      const patient = mockStore.users.find(u => String(u._id) === String(id)) || mockStore.users[0];
      const records = mockStore.healthRecords.filter(r => String(r.userId) === String(patient._id));
      const reports = mockStore.medicalReports.filter(r => String(r.userId) === String(patient._id));
      const appointments = mockStore.appointments.filter(a => String(a.userId) === String(patient._id));
      const timeline = mockStore.timelineEvents.filter(t => String(t.userId) === String(patient._id));

      const latest = records[records.length - 1];
      const riskData = latest ? SafetyEngine.evaluateVitalsRisk({
        bpSystolic: latest.bpSystolic,
        bpDiastolic: latest.bpDiastolic,
        heartRate: latest.heartRate,
        bloodGlucose: latest.bloodGlucose,
        week: latest.week,
        symptoms: latest.symptoms
      }) : { riskLevel: 'routine', badge: SafetyEngine.getRiskBadge('routine') };

      return res.json({
        success: true,
        patient,
        healthRecords: records,
        medicalReports: reports,
        appointments,
        timeline,
        currentRisk: riskData
      });
    }

    // MongoDB Mode
    const patient = await User.findById(id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const records = await HealthRecord.find({ userId: id }).sort({ date: 1 });
    const reports = await MedicalReport.find({ userId: id }).sort({ dateUploaded: -1 });
    const appointments = await Appointment.find({ userId: id }).sort({ date: 1 });
    const timeline = await TimelineEvent.find({ userId: id }).sort({ date: -1 });

    const latest = records[records.length - 1];
    const riskData = latest ? SafetyEngine.evaluateVitalsRisk({
      bpSystolic: latest.bpSystolic,
      bpDiastolic: latest.bpDiastolic,
      heartRate: latest.heartRate,
      bloodGlucose: latest.bloodGlucose,
      week: latest.week,
      symptoms: latest.symptoms
    }) : { riskLevel: 'routine', badge: SafetyEngine.getRiskBadge('routine') };

    const patientSafe = patient.toObject();
    delete patientSafe.password;

    res.json({
      success: true,
      patient: patientSafe,
      healthRecords: records,
      medicalReports: reports,
      appointments,
      timeline,
      currentRisk: riskData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
