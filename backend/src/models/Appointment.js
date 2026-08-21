const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['routine_prenatal', 'routine', 'ultrasound', 'anomaly_scan', 'glucose_tolerance', 'non_stress_test', 'blood_test', 'consultation', 'follow_up', 'pediatric_intro', 'other'],
    default: 'routine_prenatal'
  },
  date: { type: Date, required: true },
  time: { type: String, default: '10:00 AM' },
  doctorName: { type: String, default: 'Dr. Sarah Jenkins, MD' },
  clinicLocation: { type: String, default: 'Memorial Women\'s Health Center, Suite 402' },
  status: { type: String, enum: ['upcoming', 'completed', 'rescheduled', 'cancelled'], default: 'upcoming' },
  notes: { type: String },
  associatedReportId: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalReport' },
  suggestedQuestions: [String],
  remindersSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

let Appointment;
try {
  Appointment = mongoose.model('Appointment', appointmentSchema);
} catch (e) {
  Appointment = mongoose.model('Appointment');
}

module.exports = Appointment;
