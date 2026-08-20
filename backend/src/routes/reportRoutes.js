const express = require('express');
const router = express.Router();
const MedicalReport = require('../models/MedicalReport');
const TimelineEvent = require('../models/TimelineEvent');
const mockStore = require('../models/mockStore');
const MedicalReportAgent = require('../agents/medicalReportAgent');
const { protect } = require('../middleware/authMiddleware');
const { isMockMode } = require('../config/db');

// @route   GET /api/reports
// @desc    Get all medical reports for the user from MongoDB
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    if (isMockMode() || typeof userId === 'string' && String(userId).startsWith('usr_')) {
      const reports = mockStore.medicalReports
        .filter(r => String(r.userId) === String(userId) || r.userId === 'usr_elena_vance_01')
        .sort((a, b) => new Date(b.dateUploaded) - new Date(a.dateUploaded));

      return res.json({
        success: true,
        count: reports.length,
        data: reports
      });
    }

    const reports = await MedicalReport.find({ userId }).sort({ dateUploaded: -1 });
    res.json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/reports/:id
// @desc    Get single report details
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (isMockMode() || typeof req.user._id === 'string' && String(req.user._id).startsWith('usr_')) {
      const report = mockStore.medicalReports.find(r => String(r._id) === String(id));
      if (!report) {
        return res.status(404).json({ success: false, message: 'Report not found' });
      }
      return res.json({ success: true, data: report });
    }

    const report = await MedicalReport.findOne({ _id: id, userId: req.user._id });
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/reports/analyze
// @desc    Upload / paste medical report for AI translation & structured extraction into MongoDB
router.post('/analyze', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { title, type = 'blood_test', fileName, rawText } = req.body;

    if (!rawText || rawText.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide medical report text or extracted content.' });
    }

    // Call Medical Report Agent to extract structured parameters & plain language summary using Gemini
    const aiAnalysis = await MedicalReportAgent.analyzeDocumentText({
      rawText,
      reportType: type
    });

    const reportData = {
      userId,
      title: title || aiAnalysis.title || 'Diagnostic Report Analysis',
      type: type || aiAnalysis.type || 'blood_test',
      fileName: fileName || `${type}_report_${Date.now()}.pdf`,
      extractedText: rawText,
      structuredFindings: aiAnalysis.structuredFindings || [],
      aiSummary: aiAnalysis.aiSummary || 'Medical report processed successfully.',
      laymanExplanation: aiAnalysis.laymanExplanation || 'Key findings have been summarized for your review.',
      clinicianDiscussionPoints: aiAnalysis.clinicianDiscussionPoints || [],
      questionsForDoctor: aiAnalysis.questionsForDoctor || [
        'How do these results relate to my current gestational stage?',
        'Do any findings warrant repeat testing?'
      ],
      riskFlag: aiAnalysis.riskFlag || 'low',
      doctorReviewed: false,
      doctorNotes: '',
      dateUploaded: new Date()
    };

    if (isMockMode() || typeof userId === 'string' && String(userId).startsWith('usr_')) {
      const reportId = `rep_${Date.now()}`;
      const savedReport = { _id: reportId, ...reportData };
      mockStore.medicalReports.unshift(savedReport);

      const timelineId = `tle_rep_${Date.now()}`;
      mockStore.timelineEvents.push({
        _id: timelineId,
        userId,
        week: req.user.gestationalWeek || 24,
        date: new Date(),
        category: 'lab_report',
        title: `${savedReport.title} Uploaded & Analyzed`,
        description: savedReport.aiSummary,
        badgeType: savedReport.riskFlag === 'urgent' ? 'urgent' : savedReport.riskFlag === 'high' ? 'prompt_eval' : 'info'
      });

      return res.status(201).json({
        success: true,
        data: savedReport
      });
    }

    // MongoDB Mode
    const savedReport = await MedicalReport.create(reportData);

    await TimelineEvent.create({
      userId,
      week: req.user.gestationalWeek || 24,
      date: new Date(),
      category: 'lab_report',
      title: `${savedReport.title} Uploaded & Analyzed`,
      description: savedReport.aiSummary,
      badgeType: savedReport.riskFlag === 'urgent' ? 'urgent' : 'info'
    });

    res.status(201).json({
      success: true,
      data: savedReport
    });
  } catch (error) {
    console.error('Report analysis error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/reports/:id/doctor-review
// @desc    Doctor reviews and attaches notes to patient report in MongoDB
router.post('/:id/doctor-review', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { doctorNotes } = req.body;

    if (isMockMode() || typeof req.user._id === 'string' && String(req.user._id).startsWith('usr_')) {
      const rep = mockStore.medicalReports.find(r => String(r._id) === String(id));
      if (!rep) {
        return res.status(404).json({ success: false, message: 'Report not found' });
      }
      rep.doctorReviewed = true;
      rep.doctorNotes = doctorNotes || 'Reviewed by Obstetrician. Findings confirmed.';
      return res.json({ success: true, data: rep });
    }

    const rep = await MedicalReport.findById(id);
    if (!rep) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    rep.doctorReviewed = true;
    rep.doctorNotes = doctorNotes || 'Reviewed by Obstetrician.';
    await rep.save();

    res.json({ success: true, data: rep });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
