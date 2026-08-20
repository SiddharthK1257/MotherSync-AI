const mongoose = require('mongoose');

const medicalReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['blood_test', 'ultrasound', 'ecg', 'glucose_tolerance', 'urine_analysis', 'prescription', 'doctor_note', 'other'],
    default: 'blood_test'
  },
  fileName: { type: String },
  fileUrl: { type: String },
  extractedText: { type: String },
  
  // Structured findings
  structuredFindings: [{
    parameter: String,
    value: String,
    unit: String,
    referenceRange: String,
    status: { type: String, enum: ['normal', 'borderline', 'abnormal', 'critical'], default: 'normal' }
  }],
  
  aiSummary: { type: String },
  laymanExplanation: { type: String },
  clinicianDiscussionPoints: [String],
  questionsForDoctor: [String],
  
  riskFlag: {
    type: String,
    enum: ['low', 'moderate', 'high', 'urgent'],
    default: 'low'
  },

  doctorReviewed: { type: Boolean, default: false },
  doctorNotes: { type: String },
  dateUploaded: { type: Date, default: Date.now }
});

let MedicalReport;
try {
  MedicalReport = mongoose.model('MedicalReport', medicalReportSchema);
} catch (e) {
  MedicalReport = mongoose.model('MedicalReport');
}

module.exports = MedicalReport;
