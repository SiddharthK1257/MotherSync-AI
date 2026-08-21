const express = require('express');
const router = express.Router();
const PregnancyProfile = require('../models/PregnancyProfile');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/authMiddleware');
const mockStore = require('../models/mockStore');
const { isMockMode } = require('../config/db');

// @route   GET /api/pregnancy/profile
// @desc    Get current user's pregnancy profile from MongoDB
router.get('/profile', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    if (isMockMode() || typeof userId === 'string' && String(userId).startsWith('usr_')) {
      const user = mockStore.users.find(u => String(u._id) === String(userId)) || mockStore.users[0];
      const gWeek = user.gestationalWeek || 24;
      const trimester = gWeek <= 13 ? 1 : gWeek <= 27 ? 2 : 3;

      return res.json({
        success: true,
        data: {
          userId: user._id,
          pregnancyStartDate: new Date(Date.now() - gWeek * 7 * 24 * 60 * 60 * 1000),
          estimatedDueDate: user.dueDate || new Date(Date.now() + (40 - gWeek) * 7 * 24 * 60 * 60 * 1000),
          gestationalWeek: gWeek,
          trimester,
          age: user.maternalInfo?.age || 29,
          height: user.maternalInfo?.heightCm || 168,
          prePregnancyWeight: user.baselineVitals?.weight || 64.0,
          currentWeight: user.maternalInfo?.weightKg || 68.5,
          bloodGroup: user.maternalInfo?.bloodGroup || 'O+',
          knownConditions: user.maternalInfo?.existingConditions || [],
          allergies: user.maternalInfo?.allergies || ['Penicillin'],
          previousPregnancies: user.pregnancyHistory?.para || 0,
          previousComplications: user.pregnancyHistory?.previousComplications || [],
          currentMedications: user.maternalInfo?.currentMedications || ['Prenatal Multivitamin with DHA', 'Oral Iron 65mg'],
          careProvider: {
            name: user.doctorInfo?.assignedDoctorName || 'Dr. Sarah Jenkins, MD (FACOG)',
            clinic: user.doctorInfo?.hospitalAffiliation || 'St. Jude Maternal-Fetal Medicine Center',
            email: user.doctorInfo?.contactEmail || 'dr.jenkins@stjudematernal.org'
          }
        }
      });
    }

    // MongoDB Mode
    let profile = await PregnancyProfile.findOne({ userId });
    if (!profile) {
      const gWeek = req.user.gestationalWeek || 24;
      const startDate = req.user.pregnancyStartDate || new Date(Date.now() - gWeek * 7 * 24 * 60 * 60 * 1000);
      const dueDate = req.user.dueDate || new Date(new Date(startDate).getTime() + 280 * 24 * 60 * 60 * 1000);

      profile = await PregnancyProfile.create({
        userId,
        pregnancyStartDate: startDate,
        estimatedDueDate: dueDate,
        gestationalWeek: gWeek,
        trimester: gWeek <= 13 ? 1 : gWeek <= 27 ? 2 : 3,
        age: req.user.maternalInfo?.age || 29,
        height: req.user.maternalInfo?.heightCm || 168,
        prePregnancyWeight: req.user.baselineVitals?.weight || 64,
        currentWeight: req.user.maternalInfo?.weightKg || 68.5,
        bloodGroup: req.user.maternalInfo?.bloodGroup || 'O+',
        allergies: req.user.maternalInfo?.allergies || [],
        knownConditions: req.user.maternalInfo?.existingConditions || [],
        currentMedications: req.user.maternalInfo?.currentMedications || ['Prenatal Multivitamin']
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Get pregnancy profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/pregnancy/profile
// @desc    Update pregnancy profile in MongoDB
router.put('/profile', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body;
    delete updates._id;
    delete updates.userId;

    if (isMockMode() || typeof userId === 'string' && String(userId).startsWith('usr_')) {
      const user = mockStore.users.find(u => String(u._id) === String(userId));
      if (user) {
        if (updates.gestationalWeek) user.gestationalWeek = Number(updates.gestationalWeek);
        if (updates.estimatedDueDate) user.dueDate = new Date(updates.estimatedDueDate);
        if (updates.age && user.maternalInfo) user.maternalInfo.age = Number(updates.age);
        if (updates.currentWeight && user.maternalInfo) user.maternalInfo.weightKg = Number(updates.currentWeight);
        if (updates.allergies && user.maternalInfo) user.maternalInfo.allergies = updates.allergies;
        if (updates.currentMedications && user.maternalInfo) user.maternalInfo.currentMedications = updates.currentMedications;
      }
      return res.json({ success: true, data: updates });
    }

    let profile = await PregnancyProfile.findOne({ userId });
    if (!profile) {
      profile = new PregnancyProfile({ userId, ...updates });
    } else {
      Object.assign(profile, updates);
    }
    await profile.save();

    // Also update User document for convenience
    await User.findByIdAndUpdate(userId, {
      gestationalWeek: profile.gestationalWeek,
      dueDate: profile.estimatedDueDate,
      currentTrimester: profile.trimester
    });

    await AuditLog.record({
      userId,
      eventType: 'clinical_summary_generated',
      details: { action: 'pregnancy_profile_updated', week: profile.gestationalWeek }
    });

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Update pregnancy profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
