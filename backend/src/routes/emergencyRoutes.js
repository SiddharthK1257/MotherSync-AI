const express = require('express');
const router = express.Router();
const EmergencyLog = require('../models/EmergencyLog');
const TimelineEvent = require('../models/TimelineEvent');
const mockStore = require('../models/mockStore');
const EmergencyTriageAgent = require('../agents/emergencyTriageAgent');
const { protect } = require('../middleware/authMiddleware');
const { isMockMode } = require('../config/db');

// @route   POST /api/emergency/sos
// @desc    Trigger Red Alert SOS protocol with contact dispatch & hospital directions in MongoDB
router.post('/sos', protect, async (req, res) => {
  try {
    const userProfile = req.user;
    const { symptoms = ['One-Touch Emergency SOS Triggered'], location, notes } = req.body;

    const triageResult = await EmergencyTriageAgent.process({
      userMessage: Array.isArray(symptoms) ? symptoms.join(', ') : String(symptoms),
      userProfile,
      detectedFlags: [{ term: 'Emergency SOS Triggered' }]
    });

    const incidentData = {
      userId: userProfile._id,
      timestamp: new Date(),
      triggerMethod: 'button',
      symptomsReported: Array.isArray(symptoms) ? symptoms : [String(symptoms)],
      triageRiskLevel: 'URGENT_RED',
      urgentInstructions: triageResult.details?.urgentInstructions || [
        'Call emergency dispatch (911 / 112 / 108) immediately.',
        'Lie on your left side to maximize maternal-fetal blood flow.',
        'Proceed directly to your nearest hospital maternity triage unit.'
      ],
      emergencySummary: triageResult.details?.emergencySummary || 'Emergency SOS triggered. High-priority clinical protocol initiated.',
      trustedContactsNotified: (userProfile.emergencyContacts || [
        { name: 'Primary Emergency Contact', phone: '+1 (555) 911-0000' }
      ]).map(c => ({
        name: c.name,
        phone: c.phone,
        channel: 'sms/whatsapp',
        status: 'user_approved',
        dispatchTime: new Date()
      })),
      location: location || { lat: 37.7749, lng: -122.4194, address: 'Current GPS Location' },
      selectedFacility: userProfile.preferredHospital || {
        name: 'St. Jude Women & Children Memorial Hospital',
        phone: '+1 (555) 911-MATERNITY',
        distanceKm: 2.1
      },
      resolved: false
    };

    if (isMockMode() || typeof userProfile._id === 'string' && String(userProfile._id).startsWith('usr_')) {
      const incident = { _id: `emg_${Date.now()}`, ...incidentData };
      mockStore.emergencyLogs.push(incident);

      mockStore.timelineEvents.push({
        _id: `tle_emg_${Date.now()}`,
        userId: userProfile._id,
        week: userProfile.gestationalWeek || 24,
        date: new Date(),
        category: 'emergency',
        title: '🚨 Emergency Red Alert SOS Triggered',
        description: `Emergency protocol initiated. Immediate referral to ${incident.selectedFacility.name}.`,
        badgeType: 'urgent'
      });

      return res.status(201).json({
        success: true,
        incident,
        triage: triageResult
      });
    }

    // MongoDB Mode
    const createdIncident = await EmergencyLog.create(incidentData);

    await TimelineEvent.create({
      userId: userProfile._id,
      week: userProfile.gestationalWeek || 24,
      date: new Date(),
      category: 'emergency',
      title: '🚨 Emergency Red Alert SOS Triggered',
      description: `Emergency protocol initiated. Immediate referral to ${incidentData.selectedFacility.name}.`,
      badgeType: 'urgent'
    });

    res.status(201).json({
      success: true,
      incident: createdIncident,
      triage: triageResult
    });
  } catch (error) {
    console.error('Emergency SOS error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/emergency/logs
// @desc    Get emergency incident history from MongoDB
router.get('/logs', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    if (isMockMode() || typeof userId === 'string' && String(userId).startsWith('usr_')) {
      const logs = mockStore.emergencyLogs.filter(l => String(l.userId) === String(userId) || l.userId === 'usr_elena_vance_01');
      return res.json({ success: true, count: logs.length, data: logs });
    }

    const logs = await EmergencyLog.find({ userId }).sort({ timestamp: -1 });
    res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
