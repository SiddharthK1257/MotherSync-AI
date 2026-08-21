const mongoose = require('mongoose');

const emergencyContactModelSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  relationship: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  notificationPermission: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

let EmergencyContact;
try {
  EmergencyContact = mongoose.model('EmergencyContact', emergencyContactModelSchema);
} catch (e) {
  EmergencyContact = mongoose.model('EmergencyContact');
}

module.exports = EmergencyContact;
