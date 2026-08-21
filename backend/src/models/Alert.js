const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  severity: {
    type: String,
    enum: ['info', 'routine', 'urgent', 'emergency'],
    default: 'routine'
  },
  category: { type: String, default: 'maternal_vitals' },
  message: { type: String, required: true },
  recommendedAction: { type: String },
  status: { type: String, enum: ['active', 'acknowledged', 'resolved'], default: 'active' },
  source: { type: String, default: 'safety_engine' }
});

let Alert;
try {
  Alert = mongoose.model('Alert', alertSchema);
} catch (e) {
  Alert = mongoose.model('Alert');
}

module.exports = Alert;
