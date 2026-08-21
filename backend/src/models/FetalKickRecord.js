const mongoose = require('mongoose');

const fetalKickRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recordedAt: { type: Date, default: Date.now },
  duration: { type: Number, default: 120 }, // duration in minutes
  kickCount: { type: Number, required: true },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

let FetalKickRecord;
try {
  FetalKickRecord = mongoose.model('FetalKickRecord', fetalKickRecordSchema);
} catch (e) {
  FetalKickRecord = mongoose.model('FetalKickRecord');
}

module.exports = FetalKickRecord;
