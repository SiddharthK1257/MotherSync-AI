const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pregnancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'PregnancyProfile' },
  type: {
    type: String,
    enum: ['medication', 'vitals', 'appointment', 'hydration', 'kick_counter', 'general'],
    default: 'general'
  },
  title: { type: String, required: true },
  description: { type: String },
  scheduledTime: { type: Date, default: Date.now },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

let Reminder;
try {
  Reminder = mongoose.model('Reminder', reminderSchema);
} catch (e) {
  Reminder = mongoose.model('Reminder');
}

module.exports = Reminder;
