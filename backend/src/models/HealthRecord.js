const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  week: { type: Number, default: 24 },
  date: { type: Date, default: Date.now },
  recordedAt: { type: Date, default: Date.now },
  
  // Maternal Vitals
  bpSystolic: { type: Number, required: true },
  bpDiastolic: { type: Number, required: true },
  systolicBP: { type: Number },
  diastolicBP: { type: Number },
  heartRate: { type: Number, required: true },
  bloodGlucose: { type: Number }, // mg/dL (fasting or post-prandial)
  glucoseType: { type: String, enum: ['fasting', 'post-prandial', 'random'], default: 'fasting' },
  weight: { type: Number }, // kg
  temperature: { type: Number, default: 36.8 }, // Celsius
  oxygenSaturation: { type: Number, default: 98 }, // % SpO2
  source: { type: String, enum: ['manual', 'device', 'imported'], default: 'manual' },
  fetalKicks: { type: Number }, // Kick counts in 2 hours

  // Symptoms & Subjective observations
  symptoms: [{
    name: { type: String },
    severity: { type: String, enum: ['mild', 'moderate', 'severe'], default: 'mild' },
    notes: { type: String }
  }],
  mood: { type: String, default: 'Normal' },
  waterIntakeOz: { type: Number, default: 64 },
  notes: { type: String, default: '' },

  // Deterministic Safety Engine Classification
  riskLevel: {
    type: String,
    enum: ['routine', 'follow_up', 'prompt_eval', 'urgent'],
    default: 'routine'
  },
  riskRationale: { type: String },
  aiFlaggedConcerns: [String],

  createdAt: { type: Date, default: Date.now }
});

// Virtual sync for systolicBP / diastolicBP aliases
healthRecordSchema.pre('save', function (next) {
  if (this.bpSystolic && !this.systolicBP) this.systolicBP = this.bpSystolic;
  if (this.bpDiastolic && !this.diastolicBP) this.diastolicBP = this.bpDiastolic;
  if (this.systolicBP && !this.bpSystolic) this.bpSystolic = this.systolicBP;
  if (this.diastolicBP && !this.bpDiastolic) this.bpDiastolic = this.diastolicBP;
  if (!this.recordedAt && this.date) this.recordedAt = this.date;
  if (!this.date && this.recordedAt) this.date = this.recordedAt;
  next();
});

let HealthRecord;
try {
  HealthRecord = mongoose.model('HealthRecord', healthRecordSchema);
} catch (e) {
  HealthRecord = mongoose.model('HealthRecord');
}

module.exports = HealthRecord;
