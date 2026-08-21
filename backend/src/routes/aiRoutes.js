const express = require('express');
const router = express.Router();
const User = require('../models/User');
const PregnancyProfile = require('../models/PregnancyProfile');
const HealthRecord = require('../models/HealthRecord');
const MedicalReport = require('../models/MedicalReport');
const Appointment = require('../models/Appointment');
const ChatHistory = require('../models/ChatHistory');
const Alert = require('../models/Alert');
const AuditLog = require('../models/AuditLog');
const GeminiService = require('../services/geminiService');
const SafetyEngine = require('../services/safetyEngine');
const SupervisorAgent = require('../agents/supervisorAgent');
const DoctorCommunicationAgent = require('../agents/doctorCommunicationAgent');
const MedicalReportAgent = require('../agents/medicalReportAgent');
const { protect } = require('../middleware/authMiddleware');
const mockStore = require('../models/mockStore');
const { isMockMode } = require('../config/db');

// @route   POST /api/ai/ask
// @desc    Point-to-point structured AI response using live MongoDB patient context & Gemini
router.post('/ask', protect, async (req, res) => {
  try {
    const { question, sessionId = 'default_session', manualAgentOverride } = req.body;

    if (!question || question.trim() === '') {
      return res.status(400).json({ success: false, message: 'Question is required.' });
    }

    const user = req.user;
    const userId = user._id;

    // Step 1: Pre-Execution Deterministic Safety & Emergency Check
    const emergencyScan = SafetyEngine.detectEmergency(question);

    let userRecords = [];
    let userReports = [];
    let pastChats = [];

    if (isMockMode() || typeof userId === 'string' && String(userId).startsWith('usr_')) {
      userRecords = mockStore.healthRecords.filter(r => String(r.userId) === String(userId) || r.userId === 'usr_elena_vance_01');
      userReports = mockStore.medicalReports.filter(r => String(r.userId) === String(userId) || r.userId === 'usr_elena_vance_01');
    } else {
      userRecords = await HealthRecord.find({ userId }).sort({ date: 1 });
      userReports = await MedicalReport.find({ userId }).sort({ dateUploaded: -1 }).limit(3);
      pastChats = await ChatHistory.find({ userId, sessionId }).sort({ createdAt: 1 }).limit(6);
    }

    const latestRecord = userRecords[userRecords.length - 1] || null;

    const patientContext = {
      name: user.name,
      gestationalWeek: user.gestationalWeek || 24,
      currentTrimester: user.currentTrimester || 2,
      dueDate: user.dueDate,
      maternalInfo: user.maternalInfo,
      latestVitals: latestRecord ? {
        bpSystolic: latestRecord.bpSystolic || latestRecord.systolicBP,
        bpDiastolic: latestRecord.bpDiastolic || latestRecord.diastolicBP,
        heartRate: latestRecord.heartRate,
        bloodGlucose: latestRecord.bloodGlucose,
        weight: latestRecord.weight,
        fetalKicks: latestRecord.fetalKicks
      } : user.baselineVitals,
      recentSymptoms: latestRecord?.symptoms || [],
      records: userRecords,
      recordsCount: userRecords.length,
      recentReports: userReports
    };

    // If emergency detected deterministically, intercept immediately
    if (emergencyScan.isEmergency) {
      const emergencyStructured = {
        directAnswer: `URGENT MEDICAL WARNING: Your inquiry mentions concerning symptoms (${emergencyScan.detectedFlags.map(f => f.term).join(', ')}).`,
        dataUsed: ['Reported acute symptoms', `Gestational Week: ${patientContext.gestationalWeek}`],
        observations: [
          'Acute pain, heavy vaginal bleeding, breathing difficulty, or sudden vision loss require immediate in-person clinical assessment.'
        ],
        trend: 'Emergency escalation override triggered.',
        recommendedNextSteps: [
          'Stop physical activity and lie safely on your left side.',
          'Call emergency services (911 / 112 / 108) or have someone drive you to the nearest maternity emergency room immediately.',
          'Notify your emergency contact.'
        ],
        warningSigns: emergencyScan.detectedFlags.map(f => f.term),
        urgency: 'urgent',
        requiresProfessionalReview: true,
        emergency: true,
        disclaimer: 'MotherSync AI emergency safety engine protocol.'
      };

      // Record in ChatHistory
      if (!isMockMode() && !(typeof userId === 'string' && String(userId).startsWith('usr_'))) {
        await ChatHistory.create({
          userId,
          sessionId,
          role: 'user',
          message: question
        });
        await ChatHistory.create({
          userId,
          sessionId,
          role: 'model',
          agentName: 'Emergency Triage Agent',
          agentId: 'agent_emergency',
          message: emergencyStructured.directAnswer,
          contextUsed: { emergencyScan },
          structuredResponse: emergencyStructured
        });
      }

      return res.json({
        success: true,
        routedAgent: 'Emergency Triage Agent',
        agentId: 'agent_emergency',
        data: emergencyStructured
      });
    }

    // Call Gemini with patient context
    const structuredAnswer = await GeminiService.generatePointToPointAnswer({
      userQuestion: question,
      patientContext,
      chatHistory: pastChats,
      domainAgent: manualAgentOverride || SupervisorAgent.determineIntent(question)
    });

    // Save chat interaction to MongoDB
    if (!isMockMode() && !(typeof userId === 'string' && String(userId).startsWith('usr_'))) {
      await ChatHistory.create({
        userId,
        sessionId,
        role: 'user',
        message: question
      });
      await ChatHistory.create({
        userId,
        sessionId,
        role: 'model',
        agentName: 'Supervisor Care Team',
        agentId: 'supervisor',
        message: structuredAnswer.directAnswer || JSON.stringify(structuredAnswer),
        contextUsed: { week: patientContext.gestationalWeek, vitals: patientContext.latestVitals },
        structuredResponse: structuredAnswer
      });
      await AuditLog.record({
        userId,
        eventType: 'ai_analysis_generated',
        details: { question: question.slice(0, 50), urgency: structuredAnswer.urgency }
      });
    }

    res.json({
      success: true,
      data: structuredAnswer
    });
  } catch (error) {
    console.error('AI ask route error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/ai/analyze-lab
// @desc    Analyze medical report / ultrasound using Gemini
router.post('/analyze-lab', protect, async (req, res) => {
  try {
    const { rawText, reportType = 'blood_test' } = req.body;

    if (!rawText || rawText.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "I couldn't reliably extract this value. Please upload a clearer report or ask a healthcare professional to review it."
      });
    }

    const aiAnalysis = await MedicalReportAgent.analyzeDocumentText({
      rawText,
      reportType
    });

    res.json({
      success: true,
      data: aiAnalysis
    });
  } catch (error) {
    console.error('AI analyze lab error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/ai/prepare-visit
// @desc    Synthesize doctor visit discussion questions from stored DB records
router.post('/prepare-visit', protect, async (req, res) => {
  try {
    const userProfile = req.user;
    let vitalsHistory = [];
    let reports = [];

    if (isMockMode() || typeof userProfile._id === 'string' && String(userProfile._id).startsWith('usr_')) {
      vitalsHistory = mockStore.healthRecords.filter(r => String(r.userId) === String(userProfile._id) || r.userId === 'usr_elena_vance_01');
      reports = mockStore.medicalReports.filter(r => String(r.userId) === String(userProfile._id) || r.userId === 'usr_elena_vance_01');
    } else {
      vitalsHistory = await HealthRecord.find({ userId: userProfile._id }).sort({ date: 1 });
      reports = await MedicalReport.find({ userId: userProfile._id }).sort({ dateUploaded: -1 });
    }

    const prepData = await DoctorCommunicationAgent.generateAppointmentQuestions({
      userProfile,
      vitalsHistory,
      reports,
      symptoms: vitalsHistory.map(v => v.symptoms).flat().filter(Boolean)
    });

    res.json({
      success: true,
      data: prepData
    });
  } catch (error) {
    console.error('AI prepare visit error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/ai/clinical-summary
// @desc    Generate dynamic clinical summary from MongoDB
router.post('/clinical-summary', protect, async (req, res) => {
  try {
    const user = req.user;
    let records = [];
    let reports = [];
    let appointments = [];

    if (isMockMode() || typeof user._id === 'string' && String(user._id).startsWith('usr_')) {
      records = mockStore.healthRecords.filter(r => String(r.userId) === String(user._id) || r.userId === 'usr_elena_vance_01');
      reports = mockStore.medicalReports.filter(r => String(r.userId) === String(user._id) || r.userId === 'usr_elena_vance_01');
      appointments = mockStore.appointments.filter(a => String(a.userId) === String(user._id) || a.userId === 'usr_elena_vance_01');
    } else {
      records = await HealthRecord.find({ userId: user._id }).sort({ date: 1 });
      reports = await MedicalReport.find({ userId: user._id }).sort({ dateUploaded: -1 });
      appointments = await Appointment.find({ userId: user._id }).sort({ date: 1 });
    }

    const latest = records[records.length - 1] || null;
    const currentRisk = latest ? SafetyEngine.evaluateVitalsRisk({
      bpSystolic: latest.bpSystolic || 120,
      bpDiastolic: latest.bpDiastolic || 78,
      heartRate: latest.heartRate || 80,
      week: user.gestationalWeek || 24,
      symptoms: latest.symptoms
    }) : { riskLevel: 'routine', summaryRationale: 'Normotensive baseline.' };

    const summary = {
      patientInfo: {
        name: user.name,
        gestationalWeek: user.gestationalWeek || 24,
        trimester: user.currentTrimester || 2,
        estimatedDueDate: user.dueDate,
        allergies: user.maternalInfo?.allergies || [],
        currentMedications: user.maternalInfo?.currentMedications || []
      },
      latestVitals: latest,
      recentRecords: records.slice(-5),
      riskAssessment: currentRisk,
      diagnosticHighlights: reports.slice(0, 2),
      upcomingAppointments: appointments.slice(0, 2),
      clinicalDisclaimer: 'AI-generated summary based on patient records — verify with a qualified healthcare professional.'
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('AI clinical summary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
