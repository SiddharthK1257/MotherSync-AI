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
  role: {
    type: String,
    enum: ['patient', 'doctor', 'clinician', 'caregiver', 'admin'],
    default: 'patient'
  },
  phone: { type: String },
  
  // Pregnancy Profile Reference & Embedded Fields
  pregnancyProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'PregnancyProfile' },
  gestationalWeek: { type: Number, default: 24 },
  dueDate: { type: Date },
  pregnancyStartDate: { type: Date },
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
    bloodGroup: { type: String, default: 'O+' },
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
    name: { type: String, default: 'St. Jude Women & Children Memorial Hospital' },
    phone: { type: String, default: '+1 (555) 911-MATERNITY' },
    address: { type: String, default: '450 Healthcare Blvd, Suite 100' },
    lat: { type: Number, default: 37.7749 },
    lng: { type: Number, default: -122.4194 }
  },

  doctorInfo: {
    assignedDoctorName: { type: String, default: 'Dr. Sarah Jenkins, MD (FACOG)' },
    hospitalAffiliation: { type: String, default: 'St. Jude Maternal-Fetal Medicine Center' },
    contactEmail: { type: String, default: 'dr.jenkins@stjudematernal.org' }
  },

  onboardingCompleted: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Encrypt password before save
userSchema.pre('save', async function (next) {
  this.updatedAt = new Date();
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!enteredPassword || !this.password) return false;
  if (this.password === enteredPassword) return true;
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (e) {
    return this.password === enteredPassword;
  }
};

let User;
try {
  User = mongoose.model('User', userSchema);
} catch (e) {
  User = mongoose.model('User');
}

module.exports = User;
