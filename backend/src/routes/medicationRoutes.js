const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Medication = require('../models/Medication');
const { isMockMode } = require('../config/db');

// @route   GET /api/medications or /api/medications/:userId
// @desc    Get medications for user
// @access  Private
router.get(['/', '/:userId'], protect, async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user._id;
    if (String(targetUserId) !== String(req.user._id) && req.user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Unauthorized access to user records' });
    }

    if (isMockMode()) {
      return res.json({
        success: true,
        count: 2,
        data: [
          { _id: 'med_1', medicationName: 'Prenatal Multivitamin with DHA', dosage: '1 tablet daily', schedule: 'Morning with breakfast', prescribingClinician: 'Dr. Sarah Jenkins, MD' },
          { _id: 'med_2', medicationName: 'Oral Iron (Ferrous Sulfate)', dosage: '65 mg elemental iron', schedule: 'Evening with vitamin C juice', prescribingClinician: 'Dr. Sarah Jenkins, MD' }
        ]
      });
    }

    const medications = await Medication.find({ userId: targetUserId }).sort({ createdAt: -1 });
    res.json({ success: true, count: medications.length, data: medications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/medications
// @desc    Log a new patient medication
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { medicationName, dosage, schedule, prescribingClinician, notes } = req.body;
    if (!medicationName || !dosage) {
      return res.status(400).json({ success: false, message: 'medicationName and dosage are required' });
    }

    if (isMockMode()) {
      const newMed = { _id: 'med_' + Date.now(), userId: req.user._id, medicationName, dosage, schedule: schedule || 'Daily', prescribingClinician: prescribingClinician || 'Physician', notes };
      return res.status(201).json({ success: true, data: newMed });
    }

    const med = await Medication.create({
      userId: req.user._id,
      medicationName,
      dosage,
      schedule: schedule || 'Daily',
      prescribingClinician: prescribingClinician || 'Primary OB/GYN',
      notes
    });

    res.status(201).json({ success: true, data: med });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   DELETE /api/medications/:id
// @desc    Remove a medication entry
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    if (isMockMode()) {
      return res.json({ success: true, message: 'Medication removed' });
    }
    await Medication.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true, message: 'Medication removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
