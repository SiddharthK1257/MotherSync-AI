const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const MedicalReport = require('../models/MedicalReport');
const TimelineEvent = require('../models/TimelineEvent');
const AuditLog = require('../models/AuditLog');
const GeminiService = require('../services/geminiService');
const { protect } = require('../middleware/authMiddleware');
const mockStore = require('../models/mockStore');
const { isMockMode } = require('../config/db');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `lab-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'text/plain'
  ];
  if (allowedMimeTypes.includes(file.mimetype) || file.originalname.match(/\.(pdf|jpe?g|png|webp|txt)$/i)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Please upload PDF, JPG, JPEG, PNG, or WEBP.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter
});

// @route   GET /api/labs
// @desc    Get all lab & ultrasound diagnostic reports from MongoDB
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    if (isMockMode() || typeof userId === 'string' && String(userId).startsWith('usr_')) {
      const reports = mockStore.medicalReports
        .filter(r => String(r.userId) === String(userId) || r.userId === 'usr_elena_vance_01')
        .sort((a, b) => new Date(b.dateUploaded || b.uploadedAt) - new Date(a.dateUploaded || a.uploadedAt));

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
    console.error('Fetch labs error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/labs/:id
// @desc    Get single lab report
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (isMockMode() || typeof req.user._id === 'string' && String(req.user._id).startsWith('usr_')) {
      const report = mockStore.medicalReports.find(r => String(r._id) === String(id));
      if (!report) return res.status(404).json({ success: false, message: 'Lab report not found.' });
      return res.json({ success: true, data: report });
    }

    const report = await MedicalReport.findOne({ _id: id, userId: req.user._id });
    if (!report) return res.status(404).json({ success: false, message: 'Lab report not found.' });
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/labs/upload
// @desc    Upload file (PDF/JPG/PNG/WEBP) for Lab / Ultrasound Extraction
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user._id;
    const { title, reportType, type, rawText } = req.body;
    const file = req.file;

    let fileBuffer = null;
    let mimeType = 'text/plain';

    if (file) {
      mimeType = file.mimetype;
      fileBuffer = fs.readFileSync(file.path);
    }

    if (!file && (!rawText || rawText.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a PDF, JPG, JPEG, PNG, or WEBP file or provide report text.'
      });
    }

    const chosenType = reportType || type;

    const aiAnalysis = await GeminiService.analyzeMedicalDocument({
      fileBuffer,
      mimeType,
      fileName: file ? file.originalname : 'Lab_Report.txt',
      rawText: rawText || '',
      reportType: chosenType
    });

    const finalType = chosenType || aiAnalysis.type || 'blood_test';

    const reportData = {
      userId,
      title: title || aiAnalysis.title || (file ? file.originalname.replace(/\.[^/.]+$/, '') : 'Diagnostic Lab Analysis'),
      type: finalType,
      fileName: file ? file.filename : `${chosenType}_report_${Date.now()}.pdf`,
      fileUrl: file ? `/uploads/${file.filename}` : null,
      extractedText: rawText || (aiAnalysis.aiSummary ? `Summary: ${aiAnalysis.aiSummary}` : ''),
      structuredFindings: aiAnalysis.structuredFindings || [],
      ultrasoundDetails: aiAnalysis.ultrasoundDetails || null,
      abnormalFindings: aiAnalysis.abnormalFindings || [],
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
      const savedReport = { _id: `rep_${Date.now()}`, ...reportData };
      mockStore.medicalReports.unshift(savedReport);

      mockStore.timelineEvents.push({
        _id: `tle_rep_${Date.now()}`,
        userId,
        week: req.user.gestationalWeek || 24,
        date: new Date(),
        category: 'lab_report',
        title: `${savedReport.title} Uploaded & Analyzed`,
        description: savedReport.aiSummary,
        badgeType: savedReport.riskFlag === 'urgent' ? 'urgent' : savedReport.riskFlag === 'high' ? 'prompt_eval' : 'info'
      });

      return res.status(201).json({ success: true, data: savedReport });
    }

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

    await AuditLog.record({
      userId,
      eventType: 'lab_uploaded',
      details: { title: savedReport.title, type: chosenType, findingsCount: savedReport.structuredFindings.length }
    });

    res.status(201).json({ success: true, data: savedReport });
  } catch (error) {
    console.error('Lab file upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/labs
// @desc    Upload / analyze diagnostic report text or base64 with Gemini & save to MongoDB
router.post('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { title, reportType = 'blood_test', type = 'blood_test', fileName, rawText, base64Data, mimeType } = req.body;

    if (!rawText && !base64Data) {
      return res.status(400).json({
        success: false,
        message: "I couldn't reliably extract this value. Please upload a clearer report or ask a healthcare professional to review it."
      });
    }

    let fileBuffer = null;
    if (base64Data) {
      const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
      fileBuffer = Buffer.from(cleanBase64, 'base64');
    }

    const chosenType = reportType || type || 'blood_test';

    const aiAnalysis = await GeminiService.analyzeMedicalDocument({
      fileBuffer,
      mimeType: mimeType || 'image/jpeg',
      fileName: fileName || `${chosenType}_report_${Date.now()}.pdf`,
      rawText: rawText || '',
      reportType: chosenType
    });

    const finalType = chosenType || aiAnalysis.type || 'blood_test';

    const reportData = {
      userId,
      title: title || aiAnalysis.title || 'Diagnostic Report Analysis',
      type: finalType,
      fileName: fileName || `${chosenType}_report_${Date.now()}.pdf`,
      extractedText: rawText || aiAnalysis.aiSummary,
      structuredFindings: aiAnalysis.structuredFindings || [],
      ultrasoundDetails: aiAnalysis.ultrasoundDetails || null,
      abnormalFindings: aiAnalysis.abnormalFindings || [],
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
      const savedReport = { _id: `rep_${Date.now()}`, ...reportData };
      mockStore.medicalReports.unshift(savedReport);

      mockStore.timelineEvents.push({
        _id: `tle_rep_${Date.now()}`,
        userId,
        week: req.user.gestationalWeek || 24,
        date: new Date(),
        category: 'lab_report',
        title: `${savedReport.title} Uploaded & Analyzed`,
        description: savedReport.aiSummary,
        badgeType: savedReport.riskFlag === 'urgent' ? 'urgent' : savedReport.riskFlag === 'high' ? 'prompt_eval' : 'info'
      });

      return res.status(201).json({ success: true, data: savedReport });
    }

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

    await AuditLog.record({
      userId,
      eventType: 'lab_uploaded',
      details: { title: savedReport.title, type: chosenType, findingsCount: savedReport.structuredFindings.length }
    });

    res.status(201).json({ success: true, data: savedReport });
  } catch (error) {
    console.error('Lab report upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
