const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  week: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  category: {
    type: String,
    enum: ['vital_check', 'lab_report', 'appointment', 'fetal_milestone', 'alert', 'medication', 'doctor_note', 'emergency'],
    required: true
  },
  title: { type: String, required: true },
  description: { type: String },
  badgeType: {
    type: String,
    enum: ['routine', 'follow_up', 'prompt_eval', 'urgent', 'milestone', 'info'],
    default: 'info'
  },
  meta: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

let TimelineEvent;
try {
  TimelineEvent = mongoose.model('TimelineEvent', timelineEventSchema);
} catch (e) {
  TimelineEvent = mongoose.model('TimelineEvent');
}

module.exports = TimelineEvent;
