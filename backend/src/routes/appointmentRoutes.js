const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const HealthRecord = require('../models/HealthRecord');
const MedicalReport = require('../models/MedicalReport');
const TimelineEvent = require('../models/TimelineEvent');
const mockStore = require('../models/mockStore');
const DoctorCommunicationAgent = require('../agents/doctorCommunicationAgent');
const { protect } = require('../middleware/authMiddleware');
const { isMockMode } = require('../config/db');

// @route   GET /api/appointments
// @desc    Get upcoming and past appointments from MongoDB
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    if (isMockMode() || typeof userId === 'string' && String(userId).startsWith('usr_')) {
      const apts = mockStore.appointments
        .filter(a => String(a.userId) === String(userId) || a.userId === 'usr_elena_vance_01')
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      return res.json({
        success: true,
        count: apts.length,
        data: apts
      });
    }

    const apts = await Appointment.find({ userId }).sort({ date: 1 });
    res.json({
      success: true,
      count: apts.length,
      data: apts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/appointments
// @desc    Schedule a new prenatal visit or ultrasound in MongoDB
router.post('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { title, type = 'routine_prenatal', date, time = '10:00 AM', doctorName, clinicLocation, notes = '' } = req.body;

    if (!title || !date) {
      return res.status(400).json({ success: false, message: 'Appointment title and date are required.' });
    }

    const suggestedQuestions = [
      'What physiological symptoms or kicks should I track leading up to this visit?',
      'Are there any lab or ultrasound prerequisites needed before arrival?',
      'Should my partner accompany me for this appointment milestone?'
    ];

    const aptData = {
      userId,
      title,
      type,
      date: new Date(date),
      time,
      doctorName: doctorName || req.user.doctorInfo?.assignedDoctorName || 'Dr. Sarah Jenkins, MD',
      clinicLocation: clinicLocation || req.user.doctorInfo?.hospitalAffiliation || "St. Jude Women's Health Center",
      status: 'upcoming',
      notes,
      suggestedQuestions,
      remindersSent: false,
      createdAt: new Date()
    };

    if (isMockMode() || typeof userId === 'string' && String(userId).startsWith('usr_')) {
      const aptId = `apt_${Date.now()}`;
      const savedApt = { _id: aptId, ...aptData };
      mockStore.appointments.push(savedApt);

      mockStore.timelineEvents.push({
        _id: `tle_apt_${Date.now()}`,
        userId,
        week: req.user.gestationalWeek || 24,
        date: new Date(date),
        category: 'appointment',
        title: `Appointment Scheduled: ${title}`,
        description: `Scheduled for ${new Date(date).toLocaleDateString()} at ${time} with ${savedApt.doctorName}.`,
        badgeType: 'info'
      });

      return res.status(201).json({ success: true, data: savedApt });
    }

    // MongoDB Mode
    const savedApt = await Appointment.create(aptData);

    await TimelineEvent.create({
      userId,
      week: req.user.gestationalWeek || 24,
      date: new Date(date),
      category: 'appointment',
      title: `Appointment Scheduled: ${title}`,
      description: `Scheduled for ${new Date(date).toLocaleDateString()} at ${time} with ${savedApt.doctorName}.`,
      badgeType: 'info'
    });

    res.status(201).json({ success: true, data: savedApt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/appointments/:id/prepare
// @desc    Generate customized appointment discussion questions for doctor with live MongoDB data & Gemini
router.post('/:id/prepare', protect, async (req, res) => {
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/appointments/:id
// @desc    Cancel / delete an appointment in MongoDB
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (isMockMode() || typeof req.user._id === 'string' && String(req.user._id).startsWith('usr_')) {
      const idx = mockStore.appointments.findIndex(a => String(a._id) === String(id));
      if (idx !== -1) {
        mockStore.appointments.splice(idx, 1);
      }
      return res.json({ success: true, message: 'Appointment removed' });
    }

    await Appointment.findOneAndDelete({ _id: id, userId: req.user._id });
    res.json({ success: true, message: 'Appointment removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
