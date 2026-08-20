const express = require('express');
const router = express.Router();
const HealthRecord = require('../models/HealthRecord');
const MedicalReport = require('../models/MedicalReport');
const Appointment = require('../models/Appointment');
const PDFReportGenerator = require('../services/pdfReportGenerator');
const SafetyEngine = require('../services/safetyEngine');
const mockStore = require('../models/mockStore');
const { protect } = require('../middleware/authMiddleware');
const { isMockMode } = require('../config/db');

// @route   GET /api/pdf/summary
// @desc    Generate and stream clinical appointment summary PDF from real MongoDB data
router.get('/summary', protect, async (req, res) => {
  try {
    const user = req.user || mockStore.users[0];
    let healthRecords = [];
    let medicalReports = [];
    let appointments = [];

    if (isMockMode() || typeof user._id === 'string' && String(user._id).startsWith('usr_')) {
      healthRecords = mockStore.healthRecords.filter(r => String(r.userId) === String(user._id) || r.userId === 'usr_elena_vance_01');
      medicalReports = mockStore.medicalReports.filter(r => String(r.userId) === String(user._id) || r.userId === 'usr_elena_vance_01');
      appointments = mockStore.appointments.filter(a => String(a.userId) === String(user._id) || a.userId === 'usr_elena_vance_01');
    } else {
      healthRecords = await HealthRecord.find({ userId: user._id }).sort({ date: 1 });
      medicalReports = await MedicalReport.find({ userId: user._id }).sort({ dateUploaded: -1 });
      appointments = await Appointment.find({ userId: user._id }).sort({ date: 1 });
    }

    const latest = healthRecords[healthRecords.length - 1];
    const riskData = latest ? SafetyEngine.evaluateVitalsRisk({
      bpSystolic: latest.bpSystolic,
      bpDiastolic: latest.bpDiastolic,
      heartRate: latest.heartRate,
      bloodGlucose: latest.bloodGlucose,
      week: latest.week,
      symptoms: latest.symptoms
    }) : { riskLevel: 'routine', badge: SafetyEngine.getRiskBadge('routine'), summaryRationale: 'Normotensive baseline profile.' };

    const doc = PDFReportGenerator.generatePatientSummaryPDF({
      user,
      healthRecords,
      medicalReports,
      appointments,
      riskData
    });

    const filename = `MotherSync_Clinical_Summary_${(user.name || 'Patient').replace(/\s+/g, '_')}_Wk${user.gestationalWeek || 24}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    doc.pipe(res);
  } catch (error) {
    console.error('PDF generation route error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
