const mongoose = require('mongoose');

const pregnancyProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  pregnancyStartDate: { type: Date },
  estimatedDueDate: { type: Date },
  gestationalWeek: { type: Number, default: 24 },
  trimester: { type: Number, default: 2 },
  age: { type: Number, default: 29 },
  height: { type: Number, default: 168 }, // in cm
  prePregnancyWeight: { type: Number, default: 64.0 }, // in kg
  currentWeight: { type: Number, default: 68.5 }, // in kg
  bloodGroup: { type: String, default: 'O+' },
  knownConditions: { type: [String], default: [] },
  allergies: { type: [String], default: ['Penicillin'] },
  previousPregnancies: { type: Number, default: 0 },
  previousComplications: { type: [String], default: [] },
  currentMedications: { type: [String], default: ['Prenatal Multivitamin with DHA', 'Oral Iron 65mg'] },
  careProvider: {
    name: { type: String, default: 'Dr. Sarah Jenkins, MD (FACOG)' },
    clinic: { type: String, default: 'St. Jude Maternal-Fetal Medicine Center' },
    email: { type: String, default: 'dr.jenkins@stjudematernal.org' },
    phone: { type: String, default: '+1 (555) 902-1200' }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-update timestamp
pregnancyProfileSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  if (this.pregnancyStartDate && !this.estimatedDueDate) {
    this.estimatedDueDate = new Date(new Date(this.pregnancyStartDate).getTime() + 280 * 24 * 60 * 60 * 1000);
  }
  if (this.pregnancyStartDate) {
    const diffDays = Math.floor((new Date() - new Date(this.pregnancyStartDate)) / (1000 * 60 * 60 * 24));
    this.gestationalWeek = Math.max(1, Math.min(42, Math.floor(diffDays / 7) + 1));
    this.trimester = this.gestationalWeek <= 13 ? 1 : this.gestationalWeek <= 27 ? 2 : 3;
  }
  next();
});

let PregnancyProfile;
try {
  PregnancyProfile = mongoose.model('PregnancyProfile', pregnancyProfileSchema);
} catch (e) {
  PregnancyProfile = mongoose.model('PregnancyProfile');
}

module.exports = PregnancyProfile;
