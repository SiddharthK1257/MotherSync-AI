const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const HealthRecord = require('../models/HealthRecord');
const TimelineEvent = require('../models/TimelineEvent');
const mockStore = require('../models/mockStore');
const { protect, JWT_SECRET } = require('../middleware/authMiddleware');
const { isMockMode } = require('../config/db');

const generateToken = (id, email, role) => {
  return jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: '30d' });
};

// @route   POST /api/auth/register
// @desc    Register a new user (patient or doctor) in MongoDB
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'patient', gestationalWeek = 24, dueDate, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const gWeek = Number(gestationalWeek) || 24;
    const trimester = gWeek <= 13 ? 1 : gWeek <= 27 ? 2 : 3;

    if (isMockMode()) {
      const exists = mockStore.users.find(u => u.email.toLowerCase() === normalizedEmail);
      if (exists) {
        return res.status(400).json({ success: false, message: 'User with this email already exists.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = {
        _id: `usr_${Date.now()}`,
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role,
        phone: phone || '+1 (555) 000-0000',
        gestationalWeek: gWeek,
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + (40 - gWeek) * 7 * 24 * 60 * 60 * 1000),
        currentTrimester: trimester,
        pregnancyHistory: { gravida: 1, para: 0, previousComplications: [] },
        maternalInfo: { age: 29, heightCm: 165, weightKg: 65, medicalHistory: [], allergies: [], currentMedications: ['Prenatal Multivitamin'], supplements: [], existingConditions: [] },
        baselineVitals: { bpSystolic: 120, bpDiastolic: 78, heartRate: 80, bloodGlucose: 90, weight: 65 },
        emergencyContacts: [
          { name: 'Emergency Contact', relationship: 'Partner', phone: '+1 (555) 911-0000', notifyOnRedAlert: true }
        ],
        preferredHospital: { name: 'City Maternity & General Hospital', phone: '+1 (555) 911-MATERNITY', address: '450 Health Ave' },
        doctorInfo: { assignedDoctorName: 'Dr. Sarah Jenkins, MD', hospitalAffiliation: 'St. Jude Maternal Care' },
        onboardingCompleted: true,
        createdAt: new Date()
      };

      mockStore.users.push(newUser);

      // Create initial baseline vitals
      mockStore.healthRecords.push({
        _id: `hr_${Date.now()}`,
        userId: newUser._id,
        week: gWeek,
        date: new Date(),
        bpSystolic: 120,
        bpDiastolic: 78,
        heartRate: 80,
        bloodGlucose: 90,
        glucoseType: 'fasting',
        weight: 65,
        fetalKicks: gWeek >= 24 ? 10 : null,
        symptoms: [],
        mood: 'Excited',
        waterIntakeOz: 64,
        riskLevel: 'routine',
        riskRationale: 'Initial baseline telemetry established.',
        aiFlaggedConcerns: []
      });

      // Create welcome timeline event
      mockStore.timelineEvents.push({
        _id: `tle_${Date.now()}`,
        userId: newUser._id,
        week: gWeek,
        date: new Date(),
        category: 'vital_check',
        title: `Welcome to MotherSync AI (Week ${gWeek})`,
        description: 'Baseline pregnancy monitoring profile successfully initialized.',
        badgeType: 'routine'
      });

      const token = generateToken(newUser._id, newUser.email, newUser.role);
      const { password: _, ...userSafe } = newUser;
      return res.status(201).json({ success: true, token, user: userSafe });
    }

    // MongoDB Mode
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const calculatedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + (40 - gWeek) * 7 * 24 * 60 * 60 * 1000);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
      phone,
      gestationalWeek: gWeek,
      dueDate: calculatedDueDate,
      currentTrimester: trimester,
      maternalInfo: {
        age: 29,
        heightCm: 165,
        weightKg: 65,
        currentMedications: ['Prenatal Vitamins']
      },
      baselineVitals: {
        bpSystolic: 120,
        bpDiastolic: 78,
        heartRate: 80,
        bloodGlucose: 90,
        weight: 65
      },
      emergencyContacts: [
        { name: 'Primary Emergency Contact', relationship: 'Partner', phone: phone || '+1 (555) 911-0000', notifyOnRedAlert: true }
      ]
    });

    // Create initial baseline vitals in MongoDB
    await HealthRecord.create({
      userId: user._id,
      week: gWeek,
      date: new Date(),
      bpSystolic: 120,
      bpDiastolic: 78,
      heartRate: 80,
      bloodGlucose: 90,
      glucoseType: 'fasting',
      weight: 65,
      fetalKicks: gWeek >= 24 ? 10 : null,
      symptoms: [],
      mood: 'Good',
      waterIntakeOz: 64,
      riskLevel: 'routine',
      riskRationale: 'Baseline vitals registered successfully.',
      aiFlaggedConcerns: []
    });

    // Create initial timeline event
    await TimelineEvent.create({
      userId: user._id,
      week: gWeek,
      date: new Date(),
      category: 'vital_check',
      title: `Welcome to MotherSync AI (Week ${gWeek})`,
      description: 'Your pregnancy monitoring profile has been created.',
      badgeType: 'routine'
    });

    const token = generateToken(user._id, user.email, user.role);
    const userSafe = user.toObject();
    delete userSafe.password;

    res.status(201).json({
      success: true,
      token,
      user: userSafe
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate registered user with email & password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isMockMode()) {
      const user = mockStore.users.find(u => u.email.toLowerCase() === normalizedEmail);
      if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid email or password.' });
      }

      // Check password if hashed, or allow test pass
      let isMatch = false;
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        isMatch = await bcrypt.compare(password, user.password);
      } else {
        isMatch = user.password === password || password === 'Password123!' || password === 'DoctorPass123!';
      }

      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Invalid email or password.' });
      }

      const token = generateToken(user._id, user.email, user.role);
      const { password: _, ...userSafe } = user;
      return res.json({ success: true, token, user: userSafe });
    }

    // MongoDB Mode
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id, user.email, user.role);
    const userSafe = user.toObject();
    delete userSafe.password;

    res.json({
      success: true,
      token,
      user: userSafe
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/demo-login
// @desc    One-click demo credentials for testing / evaluation
router.post('/demo-login', async (req, res) => {
  try {
    const { role = 'patient' } = req.body;
    const targetEmail = role === 'doctor' ? 'doctor@mothersync.ai' : 'elena@mothersync.ai';

    if (isMockMode()) {
      const targetUser = mockStore.users.find(u => u.role === role) || (role === 'doctor' ? mockStore.users[1] : mockStore.users[0]);
      const token = generateToken(targetUser._id, targetUser.email, targetUser.role);
      const { password: _, ...userSafe } = targetUser;

      return res.json({
        success: true,
        message: `Logged in as Demo ${role === 'doctor' ? 'Doctor (Dr. Sarah Jenkins)' : 'Patient (Elena Vance, 24 Wks)'}`,
        token,
        user: userSafe
      });
    }

    // MongoDB Mode: find or seed demo user
    let user = await User.findOne({ email: targetEmail });
    if (!user) {
      const { seedInitialDataIfEmpty } = require('../config/db');
      await seedInitialDataIfEmpty();
      user = await User.findOne({ email: targetEmail });
    }

    if (!user) {
      // Fallback create if missing
      user = await User.create({
        name: role === 'doctor' ? 'Dr. Sarah Jenkins, MD (FACOG)' : 'Elena Vance',
        email: targetEmail,
        password: role === 'doctor' ? 'DoctorPass123!' : 'Password123!',
        role,
        gestationalWeek: 24
      });
    }

    const token = generateToken(user._id, user.email, user.role);
    const userSafe = user.toObject();
    delete userSafe.password;

    res.json({
      success: true,
      message: `Logged in as Demo ${role === 'doctor' ? 'Doctor (Dr. Sarah Jenkins)' : 'Patient (Elena Vance, 24 Wks)'}`,
      token,
      user: userSafe
    });
  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/auth/profile
// @desc    Get current authenticated user profile
router.get('/profile', protect, async (req, res) => {
  const userSafe = req.user.toObject ? req.user.toObject() : { ...req.user };
  delete userSafe.password;
  res.json({
    success: true,
    user: userSafe
  });
});

// @route   PUT /api/auth/profile
// @desc    Update user profile, onboarding, or emergency contacts in MongoDB
router.put('/profile', protect, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password; // Do not allow password override via simple profile update
    delete updates._id;

    if (isMockMode() || typeof req.user._id === 'string' && req.user._id.startsWith('usr_')) {
      const idx = mockStore.users.findIndex(u => String(u._id) === String(req.user._id));
      if (idx !== -1) {
        mockStore.users[idx] = { ...mockStore.users[idx], ...updates };
        req.user = mockStore.users[idx];
      }
      const { password: _, ...safe } = req.user;
      return res.json({ success: true, user: safe });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    Object.assign(user, updates);
    await user.save();

    const userSafe = user.toObject();
    delete userSafe.password;

    res.json({ success: true, user: userSafe });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
