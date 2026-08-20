const express = require('express');
const router = express.Router();
const HealthRecord = require('../models/HealthRecord');
const EmergencyLog = require('../models/EmergencyLog');
const SupervisorAgent = require('../agents/supervisorAgent');
const DoctorCommunicationAgent = require('../agents/doctorCommunicationAgent');
const EmergencyTriageAgent = require('../agents/emergencyTriageAgent');
const { protect } = require('../middleware/authMiddleware');
const mockStore = require('../models/mockStore');
const { isMockMode } = require('../config/db');

// List of all 10 specialized agents + Supervisor
router.get('/list', (req, res) => {
  res.json({
    success: true,
    supervisor: 'Supervisor Orchestrator Agent',
    agents: [
      { id: 'agent_pregnancy_monitoring', name: 'Pregnancy Monitoring Agent', description: 'Gestational age, trimester milestones, developmental timeline.' },
      { id: 'agent_maternal_health', name: 'Maternal Health Agent', description: 'Blood pressure, heart rate, weight trends, symptom surveillance.' },
      { id: 'agent_nutrition', name: 'Nutrition Agent', description: 'Trimester-tailored meal guidance, allergies, hydration, food safety.' },
      { id: 'agent_medical_report', name: 'Medical Report Agent', description: 'Laboratory analysis, ultrasound explanations, doctor discussion flags.' },
      { id: 'agent_emergency', name: 'Emergency Triage Agent', description: 'Deterministic red flag detection, urgent protocol, hospital dispatch.' },
      { id: 'agent_heart_health', name: 'Heart Health Agent', description: 'Maternal hemodynamics, resting pulse patterns, cardio safety.' },
      { id: 'agent_health_conditions', name: 'Health Conditions Agent', description: 'Preeclampsia, gestational diabetes, anemia, infection surveillance.' },
      { id: 'agent_appointment', name: 'Appointment Agent', description: 'Prenatal test schedules, ultrasound milestones, smart visit reminders.' },
      { id: 'agent_doctor_comm', name: 'Doctor Communication Agent', description: 'Clinical summaries, "Prepare for My Appointment" questions.' },
      { id: 'agent_knowledge_rag', name: 'Knowledge / RAG Agent', description: 'ACOG, WHO, CDC evidence-based guidelines with live citations.' }
    ]
  });
});

// @route   POST /api/agents/chat
// @desc    Orchestrates user message through Supervisor Agent with live MongoDB health context & Gemini AI
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, manualAgentOverride } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const userProfile = req.user;
    let userRecords = [];

    if (isMockMode() || typeof userProfile._id === 'string' && String(userProfile._id).startsWith('usr_')) {
      userRecords = mockStore.healthRecords.filter(r => String(r.userId) === String(userProfile._id) || r.userId === 'usr_elena_vance_01');
    } else {
      userRecords = await HealthRecord.find({ userId: userProfile._id }).sort({ date: 1 });
    }

    const latestRecord = userRecords[userRecords.length - 1];

    const healthContext = {
      gestationalWeek: userProfile.gestationalWeek || 24,
      currentTrimester: userProfile.currentTrimester || 2,
      latestVitals: latestRecord ? {
        bpSystolic: latestRecord.bpSystolic,
        bpDiastolic: latestRecord.bpDiastolic,
        heartRate: latestRecord.heartRate,
        bloodGlucose: latestRecord.bloodGlucose,
        weight: latestRecord.weight,
        fetalKicks: latestRecord.fetalKicks
      } : userProfile.baselineVitals,
      recentSymptoms: latestRecord?.symptoms || [],
      maternalInfo: userProfile.maternalInfo,
      records: userRecords
    };

    const orchestratorResult = await SupervisorAgent.routeAndProcess({
      userMessage: message,
      userProfile,
      healthContext,
      manualAgentOverride
    });

    res.json({
      success: true,
      data: orchestratorResult
    });
  } catch (error) {
    console.error('Agent chat route error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/agents/voice-triage
// @desc    Emergency voice mode speech analysis & immediate triage in MongoDB
router.post('/voice-triage', protect, async (req, res) => {
  try {
    const { transcript } = req.body;
    const userProfile = req.user;

    const emergencyResult = await EmergencyTriageAgent.process({
      userMessage: transcript,
      userProfile,
      detectedFlags: [{ term: transcript }]
    });

    const incidentData = {
      userId: userProfile._id,
      timestamp: new Date(),
      triggerMethod: 'voice',
      rawVoiceTranscript: transcript,
      symptomsReported: [transcript],
      triageRiskLevel: 'URGENT_RED',
      urgentInstructions: emergencyResult.details?.urgentInstructions || [
        'Seek immediate maternal emergency care.',
        'Lie on your left side to maintain optimal blood flow.',
        'Call emergency response (911 / 112 / 108).'
      ],
      emergencySummary: emergencyResult.details?.emergencySummary || 'Emergency voice triage triggered.',
      trustedContactsNotified: [
        {
          name: userProfile.emergencyContacts?.[0]?.name || 'Primary Contact',
          phone: userProfile.emergencyContacts?.[0]?.phone || '+1 (555) 911-0000',
          channel: 'sms/whatsapp',
          status: 'user_approved',
          dispatchTime: new Date()
        }
      ]
    };

    let incidentId;
    if (isMockMode() || typeof userProfile._id === 'string' && String(userProfile._id).startsWith('usr_')) {
      incidentId = `emg_${Date.now()}`;
      mockStore.emergencyLogs.push({ _id: incidentId, ...incidentData });
    } else {
      const created = await EmergencyLog.create(incidentData);
      incidentId = created._id;
    }

    res.json({
      success: true,
      incidentId,
      triage: emergencyResult
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/agents/prepare-questions
// @desc    Generates customized "Prepare for My Appointment" questions from MongoDB data
router.post('/prepare-questions', protect, async (req, res) => {
  try {
    const userProfile = req.user;
    let vitalsHistory = [];
    let reports = [];

    if (isMockMode() || typeof userProfile._id === 'string' && String(userProfile._id).startsWith('usr_')) {
      vitalsHistory = mockStore.healthRecords.filter(r => String(r.userId) === String(userProfile._id) || r.userId === 'usr_elena_vance_01');
      reports = mockStore.medicalReports.filter(r => String(r.userId) === String(userProfile._id) || r.userId === 'usr_elena_vance_01');
    } else {
      vitalsHistory = await HealthRecord.find({ userId: userProfile._id }).sort({ date: 1 });
      const MedicalReport = require('../models/MedicalReport');
      reports = await MedicalReport.find({ userId: userProfile._id }).sort({ dateUploaded: -1 });
    }

    const questions = await DoctorCommunicationAgent.generateAppointmentQuestions({
      userProfile,
      vitalsHistory,
      reports,
      symptoms: vitalsHistory.map(v => v.symptoms).flat().filter(Boolean)
    });

    res.json({
      success: true,
      questions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
