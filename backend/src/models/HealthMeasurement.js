const mongoose = require('mongoose');

const healthMeasurementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pregnancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'PregnancyProfile' },
  type: {
    type: String,
    required: true,
    enum: ['blood_pressure', 'heart_rate', 'weight', 'blood_glucose', 'temperature', 'oxygen_saturation', 'fetal_kicks']
  },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  systolic: { type: Number },
  diastolic: { type: Number },
  unit: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  source: { type: String, enum: ['manual', 'device', 'imported'], default: 'manual' },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

let HealthMeasurement;
try {
  HealthMeasurement = mongoose.model('HealthMeasurement', healthMeasurementSchema);
} catch (e) {
  HealthMeasurement = mongoose.model('HealthMeasurement');
}

module.exports = HealthMeasurement;
