const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const emergencyContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  relationship: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  notifyOnRedAlert: { type: Boolean, default: true }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor'], default: 'patient' },
  phone: { type: String },
  
  // Pregnancy Profile
  gestationalWeek: { type: Number, default: 24 },
  dueDate: { type: Date },
  currentTrimester: { type: Number, default: 2 },
  pregnancyHistory: {
    gravida: { type: Number, default: 1 },
    para: { type: Number, default: 0 },
    previousComplications: [String]
  },
  
  // Maternal Health Background
  maternalInfo: {
    age: { type: Number, default: 29 },
    heightCm: { type: Number, default: 165 },
    weightKg: { type: Number, default: 68 },
    medicalHistory: [String],
    allergies: [String],
    currentMedications: [String],
    supplements: [String],
    existingConditions: [String],
    lifestyle: {
      activityLevel: { type: String, default: 'Moderate' },
      dietPreference: { type: String, default: 'Omnivore' }
    }
  },

  // Baseline Vitals
  baselineVitals: {
    bpSystolic: { type: Number, default: 118 },
    bpDiastolic: { type: Number, default: 76 },
    heartRate: { type: Number, default: 78 },
    bloodGlucose: { type: Number, default: 92 },
    weight: { type: Number, default: 68 }
  },

  // Emergency & Care network
  emergencyContacts: [emergencyContactSchema],
  preferredHospital: {
    name: { type: String, default: 'City Maternal & Children Hospital' },
    phone: { type: String, default: '+1 (555) 911-CARE' },
    address: { type: String, default: '100 Health Sciences Plaza' },
    lat: { type: Number },
    lng: { type: Number }
  },

  doctorInfo: {
    assignedDoctorName: { type: String, default: 'Dr. Sarah Jenkins, MD (OB/GYN)' },
    hospitalAffiliation: { type: String, default: 'Memorial Women\'s Care' },
    contactEmail: { type: String, default: 'dr.jenkins@memorialcare.org' }
  },

  onboardingCompleted: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Encrypt password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

let User;
try {
  User = mongoose.model('User', userSchema);
} catch (e) {
  User = mongoose.model('User');
}

module.exports = User;
