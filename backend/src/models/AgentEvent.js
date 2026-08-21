const mongoose = require('mongoose');

const agentEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestType: { type: String, default: 'chat_query' },
  selectedAgent: { type: String, required: true },
  riskLevel: { type: String, default: 'routine' },
  action: { type: String, default: 'answered' },
  timestamp: { type: Date, default: Date.now }
});

let AgentEvent;
try {
  AgentEvent = mongoose.model('AgentEvent', agentEventSchema);
} catch (e) {
  AgentEvent = mongoose.model('AgentEvent');
}

module.exports = AgentEvent;
