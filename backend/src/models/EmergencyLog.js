const mongoose = require('mongoose');

const emergencyLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now },
  triggerMethod: {
    type: String,
    enum: ['button', 'voice', 'chat_triage', 'vitals_threshold'],
    default: 'button'
  },
  symptomsReported: [String],
  rawVoiceTranscript: { type: String },
  triageRiskLevel: { type: String, default: 'URGENT_RED' },
  urgentInstructions: [String],
  emergencySummary: { type: String, required: true },
  
  // Trusted contact dispatch
  trustedContactsNotified: [{
    name: String,
    phone: String,
    channel: String, // 'sms', 'whatsapp', 'simulated_dispatch'
    status: { type: String, enum: ['sent', 'delivered', 'pending', 'user_approved'], default: 'user_approved' },
    dispatchTime: { type: Date, default: Date.now }
  }],
  
  // Location & facility
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  selectedFacility: {
    name: String,
    phone: String,
    distanceKm: Number,
    address: String
  },

  resolved: { type: Boolean, default: false }
});

let EmergencyLog;
try {
  EmergencyLog = mongoose.model('EmergencyLog', emergencyLogSchema);
} catch (e) {
  EmergencyLog = mongoose.model('EmergencyLog');
}

module.exports = EmergencyLog;
