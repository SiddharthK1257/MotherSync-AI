const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pregnancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'PregnancyProfile' },
  medicationName: { type: String, required: true, trim: true },
  dosage: { type: String, required: true },
  schedule: { type: String, default: 'Once daily' },
  prescribingClinician: { type: String, default: 'Dr. Sarah Jenkins, MD' },
  reminderSettings: {
    enabled: { type: Boolean, default: true },
    time: { type: String, default: '08:00 AM' }
  },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

let Medication;
try {
  Medication = mongoose.model('Medication', medicationSchema);
} catch (e) {
  Medication = mongoose.model('Medication');
}

module.exports = Medication;
