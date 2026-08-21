const mongoose = require('mongoose');

const symptomSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recordedAt: { type: Date, default: Date.now },
  symptom: { type: String, required: true },
  severity: { type: String, enum: ['mild', 'moderate', 'severe'], default: 'mild' },
  duration: { type: String, default: 'Recent' },
  description: { type: String },
  associatedSymptoms: { type: [String], default: [] },
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

let Symptom;
try {
  Symptom = mongoose.model('Symptom', symptomSchema);
} catch (e) {
  Symptom = mongoose.model('Symptom');
}

module.exports = Symptom;
