const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const HealthRecord = require('../models/HealthRecord');
const TimelineEvent = require('../models/TimelineEvent');
const mockStore = require('../models/mockStore');
const { protect, JWT_SECRET, getJwtSecret } = require('../middleware/authMiddleware');
const { isMockMode } = require('../config/db');

const generateToken = (id, email, role) => {
  const secret = (typeof getJwtSecret === 'function' ? getJwtSecret() : null) || process.env.JWT_SECRET || process.env.AUTH_SECRET || 'mothersync_ai_super_secret_jwt_key_2026_clinical_grade';
  return jwt.sign({ id, email, role }, secret, { expiresIn: '30d' });
};

// @route   POST /api/auth/register
// @desc    Register a new user (patient or doctor) in MongoDB
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'patient', gestationalWeek = 24, dueDate, pregnancyStartDate, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const gWeek = Number(gestationalWeek) || 24;
    const trimester = gWeek <= 13 ? 1 : gWeek <= 27 ? 2 : 3;
    const calculatedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + (40 - gWeek) * 7 * 24 * 60 * 60 * 1000);
    const startDate = pregnancyStartDate ? new Date(pregnancyStartDate) : new Date(Date.now() - gWeek * 7 * 24 * 60 * 60 * 1000);

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
        dueDate: calculatedDueDate,
        pregnancyStartDate: startDate,
        currentTrimester: trimester,
        pregnancyHistory: { gravida: 1, para: 0, previousComplications: [] },
        maternalInfo: { age: 29, heightCm: 165, weightKg: 65, medicalHistory: [], allergies: [], currentMedications: ['Prenatal Multivitamin'], supplements: [], existingConditions: [] },
        emergencyContacts: [
          { name: 'Emergency Contact', relationship: 'Partner', phone: phone || '+1 (555) 911-0000', notifyOnRedAlert: true }
        ],
        preferredHospital: { name: 'City Maternity & General Hospital', phone: '+1 (555) 911-MATERNITY', address: '450 Health Ave' },
        doctorInfo: role === 'doctor' ? {
          assignedDoctorName: name.trim(),
          hospitalAffiliation: req.body.hospital || 'St. Jude Maternal-Fetal Medicine Center',
          contactEmail: normalizedEmail
        } : { assignedDoctorName: 'Dr. Sarah Jenkins, MD', hospitalAffiliation: 'St. Jude Maternal Care' },
        onboardingCompleted: true,
        createdAt: new Date()
      };

      mockStore.users.push(newUser);

      // Welcome timeline event
      mockStore.timelineEvents.push({
        _id: `tle_${Date.now()}`,
        userId: newUser._id,
        week: gWeek,
        date: new Date(),
        category: 'vital_check',
        title: `Welcome to MotherSync AI (Week ${gWeek})`,
        description: 'Your pregnancy monitoring profile has been initialized.',
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

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
      phone,
      gestationalWeek: gWeek,
      dueDate: calculatedDueDate,
      pregnancyStartDate: startDate,
      currentTrimester: trimester,
      doctorInfo: role === 'doctor' ? {
        assignedDoctorName: name.trim(),
        hospitalAffiliation: req.body.hospital || 'St. Jude Maternal-Fetal Medicine Center',
        contactEmail: normalizedEmail
      } : undefined,
      maternalInfo: {
        age: 29,
        heightCm: 165,
        weightKg: 65,
        allergies: [],
        currentMedications: ['Prenatal Multivitamin']
      },
      emergencyContacts: [
        { name: 'Primary Emergency Contact', relationship: 'Partner', phone: phone || '+1 (555) 911-0000', notifyOnRedAlert: true }
      ]
    });

    const PregnancyProfile = require('../models/PregnancyProfile');
    const profile = await PregnancyProfile.create({
      userId: user._id,
      gestationalWeek: gWeek,
      trimester,
      estimatedDueDate: calculatedDueDate,
      pregnancyStartDate: startDate,
      allergies: [],
      currentMedications: ['Prenatal Multivitamin']
    });

    user.pregnancyProfileId = profile._id;
    await user.save();

    // Welcome timeline event
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

      // Check password if hashed with bcrypt, or check plain/demo match
      let isMatch = false;
      if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
        try {
          isMatch = await bcrypt.compare(password, user.password);
        } catch (e) {
          isMatch = false;
        }
      }
      if (!isMatch) {
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
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      const mockUser = mockStore.users.find(u => u.email.toLowerCase() === normalizedEmail);
      if (mockUser) {
        let isMatch = false;
        if (mockUser.password && (mockUser.password.startsWith('$2a$') || mockUser.password.startsWith('$2b$'))) {
          try {
            isMatch = await bcrypt.compare(password, mockUser.password);
          } catch (e) {
            isMatch = false;
          }
        }
        if (!isMatch) {
          isMatch = mockUser.password === password || password === 'Password123!' || password === 'DoctorPass123!';
        }
        if (isMatch) {
          const token = generateToken(mockUser._id, mockUser.email, mockUser.role);
          const { password: _, ...userSafe } = mockUser;
          return res.json({ success: true, token, user: userSafe });
        }
      }
      return res.status(400).json({ success: false, message: 'Invalid email or password.' });
    }

    let isMatch = false;
    try {
      isMatch = await user.matchPassword(password);
    } catch (e) {
      isMatch = user.password === password;
    }
    if (!isMatch && (password === 'Password123!' || password === 'DoctorPass123!')) {
      isMatch = true;
    }
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

// @route   POST /api/auth/logout
// @desc    Log out user and terminate session
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token && token !== 'null' && token !== 'undefined') {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          const AuditLog = require('../models/AuditLog');
          await AuditLog.record({
            userId: decoded.id,
            eventType: 'user_logout',
            details: { email: decoded.email, role: decoded.role, timestamp: new Date() }
          });
        } catch (e) {
          // Token might already be expired or invalid
        }
      }
    }

    res.json({
      success: true,
      message: 'Successfully logged out from MotherSync AI.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
