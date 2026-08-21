const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, default: 'default_session' },
  role: { type: String, enum: ['user', 'model', 'system', 'agent'], required: true },
  agentName: { type: String },
  agentId: { type: String },
  message: { type: String, required: true },
  contextUsed: { type: mongoose.Schema.Types.Mixed },
  structuredResponse: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

let ChatHistory;
try {
  ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);
} catch (e) {
  ChatHistory = mongoose.model('ChatHistory');
}

module.exports = ChatHistory;
