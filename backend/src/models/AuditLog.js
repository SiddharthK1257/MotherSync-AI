const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  eventType: {
    type: String,
    enum: [
      'vital_recorded',
      'symptom_recorded',
      'fetal_kick_recorded',
      'lab_uploaded',
      'ai_analysis_generated',
      'alert_created',
      'appointment_created',
      'appointment_updated',
      'appointment_deleted',
      'clinical_summary_generated',
      'emergency_sos_triggered',
      'user_login',
      'user_registered',
      'doctor_review_saved'
    ],
    required: true
  },
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now }
});

auditLogSchema.statics.record = async function (data) {
  try {
    return await this.create({
      ...data,
      timestamp: new Date()
    });
  } catch (err) {
    console.warn('⚠️ [AuditLog] Failed to record audit entry:', err.message);
    return null;
  }
};

let AuditLog;
try {
  AuditLog = mongoose.model('AuditLog', auditLogSchema);
} catch (e) {
  AuditLog = mongoose.model('AuditLog');
}

module.exports = AuditLog;
