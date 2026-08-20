const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  week: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  
  // Vitals
  bpSystolic: { type: Number, required: true },
  bpDiastolic: { type: Number, required: true },
  heartRate: { type: Number, required: true },
  bloodGlucose: { type: Number }, // mg/dL (fasting or post-prandial)
  glucoseType: { type: String, enum: ['fasting', 'post-prandial', 'random'], default: 'fasting' },
  weight: { type: Number }, // kg
  fetalKicks: { type: Number }, // Kick counts in 2 hours

  // Symptoms & Subjective info
  symptoms: [{
    name: { type: String },
    severity: { type: String, enum: ['mild', 'moderate', 'severe'], default: 'mild' },
    notes: { type: String }
  }],
  mood: { type: String, default: 'Normal' },
  waterIntakeOz: { type: Number, default: 64 },
  notes: { type: String },

  // Risk Classification
  riskLevel: {
    type: String,
    enum: ['routine', 'follow_up', 'prompt_eval', 'urgent'],
    default: 'routine'
  },
  riskRationale: { type: String },
  aiFlaggedConcerns: [String],

  createdAt: { type: Date, default: Date.now }
});

let HealthRecord;
try {
  HealthRecord = mongoose.model('HealthRecord', healthRecordSchema);
} catch (e) {
  HealthRecord = mongoose.model('HealthRecord');
}

module.exports = HealthRecord;
