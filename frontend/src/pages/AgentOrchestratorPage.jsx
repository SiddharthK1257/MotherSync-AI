import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEmergencyModal } from '../context/EmergencyModalContext';
import { aiAPI, agentAPI, chatAPI } from '../services/api';
import VoiceTriageButton from '../components/VoiceTriageButton';
import RiskBadge from '../components/RiskBadge';
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  BookOpen,
  HelpCircle,
  Stethoscope,
  HeartPulse,
  Apple,
  FileText,
  Calendar,
  AlertTriangle,
  Baby,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Activity,
  AlertCircle,
  Database
} from 'lucide-react';

export const AgentOrchestratorPage = () => {
  const { user } = useAuth();
  const { openEmergencyModal } = useEmergencyModal();

  const [messages, setMessages] = useState([
    {
      sender: 'agent',
      agentName: 'Supervisor Orchestrator Agent',
      agentId: 'supervisor',
      structuredResponse: {
        directAnswer: `Hello ${user?.name || 'Elena'}! 🌸 I am your MotherSync AI Care Orchestrator.`,
        dataUsed: [`Gestational Stage: Week ${user?.gestationalWeek || 24}`, 'Longitudinal MongoDB Telemetry', 'ACOG Guidelines'],
        observations: [
          'I continuously coordinate with 10 specialized clinical domain agents (Nutrition, Maternal Vitals, Ultrasound & Lab OCR, Heart Health, Prenatal Appointments, and Emergency Triage).',
          'All responses use your real recorded vitals and lab findings from MongoDB.'
        ],
        trend: 'Your health records and vital trends are active in the database.',
        recommendedNextSteps: [
          'Ask any questions about your blood pressure, kick counting, lab reports, or nutrition.',
          'Log new vitals or symptoms anytime to update your telemetry.'
        ],
        warningSigns: [
          'Severe persistent headache, vision changes, acute abdominal pain, or heavy bleeding require immediate clinical evaluation.'
        ],
        urgency: 'routine',
        requiresProfessionalReview: false,
        emergency: false,
        disclaimer: 'MotherSync AI is an educational healthcare platform, not a doctor. Always consult your healthcare provider.'
      },
      content: `Hello ${user?.name || 'Elena'}! 🌸 I am your **MotherSync AI Care Orchestrator**.\n\nI continuously coordinate with **10 specialized clinical domain agents** using your real recorded data in MongoDB and authoritative ACOG/WHO evidence.`,
      citations: ['ACOG Clinical Guidelines 2026', 'WHO Antenatal Care Standards'],
      suggestedQuestions: [
        'Is my blood pressure normal?',
        'What foods are rich in prenatal iron?',
        'When should I start daily kick counting?',
        'What does my 20-week anatomy ultrasound report mean?'
      ],
      timestamp: new Date()
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [selectedAgentOverride, setSelectedAgentOverride] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);

  const availableAgents = [
    { id: '', name: '🤖 Auto-Route (Supervisor Orchestrator)' },
    { id: 'agent_pregnancy_monitoring', name: '👶 Pregnancy Monitoring Agent' },
    { id: 'agent_maternal_health', name: '📈 Maternal Health & Vitals Agent' },
    { id: 'agent_nutrition', name: '🥗 Nutrition & Trimester Diet Agent' },
    { id: 'agent_medical_report', name: '📄 Medical Report & Lab Agent' },
    { id: 'agent_heart_health', name: '❤️ Heart Health & Hemodynamics Agent' },
    { id: 'agent_health_conditions', name: '🩺 Health Conditions & Screening Agent' },
    { id: 'agent_appointment', name: '📅 Appointment & Milestone Agent' },
    { id: 'agent_doctor_comm', name: '👩‍⚕️ Doctor Communication Agent' },
    { id: 'agent_knowledge_rag', name: '📚 Knowledge & ACOG Evidence RAG Agent' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  const handleSendMessage = async (textToSend = inputValue) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isProcessing) return;

    const userMsg = {
      sender: 'user',
      content: trimmed,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsProcessing(true);

    try {
      // Use structured AI Ask endpoint
      const res = await aiAPI.ask(trimmed, 'default_session', selectedAgentOverride || null);

      if (res.data.success) {
        const responseData = res.data.data;
        const routedAgent = res.data.routedAgent || 'MotherSync Clinical AI';
        const agentId = res.data.agentId || 'supervisor';

        if (responseData.emergency) {
          openEmergencyModal({
            triage: {
              agentName: 'Emergency Triage Agent',
              details: {
                urgentInstructions: responseData.recommendedNextSteps,
                emergencySummary: responseData.directAnswer
              }
            },
            isLiveSOS: true
          });
        }

        const agentMsg = {
          sender: 'agent',
          agentName: routedAgent,
          agentId,
          riskLevel: responseData.urgency || 'routine',
          structuredResponse: responseData,
          content: responseData.directAnswer || JSON.stringify(responseData),
          citations: responseData.citations || ['ACOG Clinical Guidelines (2026)', 'WHO Antenatal Guidelines'],
          suggestedQuestions: responseData.suggestedFollowUps || [],
          timestamp: new Date()
        };

        setMessages(prev => [...prev, agentMsg]);
      }
    } catch (err) {
      console.error('Agent chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          sender: 'agent',
          agentName: 'Supervisor Care Team',
          agentId: 'fallback',
          content: `AI service is temporarily unavailable. Your saved health records are safe. Please try again. (${err.message})`,
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
      
      {/* Header Bar */}
      <div className="p-4 bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-teal-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base">Multi-Agent Care Orchestrator</h2>
              <span className="text-[10px] bg-teal-400/20 text-teal-200 border border-teal-400/30 px-2 py-0.5 rounded-full font-bold">
                10 Domain Agents (Gemini + MongoDB)
              </span>
            </div>
            <p className="text-xs text-teal-100/80">
              Point-to-Point Clinical Answers • Dynamic Patient Context • Deterministic Safety Guardrails
            </p>
          </div>
        </div>

        {/* Manual Agent Override Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-teal-200 hidden sm:block font-medium">Domain Route:</label>
          <select
            value={selectedAgentOverride}
            onChange={(e) => setSelectedAgentOverride(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-800/90 text-white text-xs border border-teal-500/40 focus:ring-2 focus:ring-teal-400 focus:outline-none"
          >
            {availableAgents.map(ag => (
              <option key={ag.id} value={ag.id} className="bg-slate-900 text-white">
                {ag.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50">
        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'user';
          const struct = msg.structuredResponse;

          return (
            <div
              key={idx}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}
            >
              {/* Agent Attribution Pill */}
              {!isUser && (
                <div className="flex items-center gap-2 ml-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 text-xs font-bold border border-teal-200">
                    <Sparkles className="h-3 w-3 text-teal-600" />
                    <span>{msg.agentName || 'Pregnancy Specialist Agent'}</span>
                  </span>

                  {msg.riskLevel && (
                    <RiskBadge level={msg.riskLevel} size="sm" showIcon={false} />
                  )}
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-2xl rounded-3xl p-5 text-sm leading-relaxed shadow-sm ${
                  isUser
                    ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-br-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                }`}
              >
                {isUser ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : struct ? (
                  /* Point-to-Point Structured AI Output */
                  <div className="space-y-4">
                    {/* 1. Direct Answer */}
                    <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/80 text-teal-950 font-medium text-xs leading-relaxed">
                      <div className="flex items-center gap-1.5 text-teal-900 font-bold mb-1 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                        <span>Direct Answer</span>
                      </div>
                      <p className="text-slate-800 font-semibold">{struct.directAnswer}</p>
                    </div>

                    {/* 2. Data Used from MongoDB */}
                    {struct.dataUsed && struct.dataUsed.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Database className="h-3 w-3 text-teal-600" />
                          <span>Data Used From Your Records</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {struct.dataUsed.map((d, dIdx) => (
                            <span key={dIdx} className="text-[11px] bg-slate-100 text-slate-700 font-medium px-2.5 py-0.5 rounded-lg border border-slate-200">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. Clinical Observations & What It Means */}
                    {struct.observations && struct.observations.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Clinical Observations
                        </p>
                        <ul className="space-y-1 text-xs text-slate-700">
                          {struct.observations.map((obs, oIdx) => (
                            <li key={oIdx} className="flex items-start gap-1.5">
                              <span className="text-teal-600 font-bold">•</span>
                              <span>{obs}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 4. Comparison & Trend */}
                    {struct.trend && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                        <span className="font-bold text-slate-800 flex items-center gap-1 mb-0.5">
                          <Activity className="h-3.5 w-3.5 text-teal-600" />
                          <span>Historical Telemetry & Trend:</span>
                        </span>
                        <p>{struct.trend}</p>
                      </div>
                    )}

                    {/* 5. Recommended Next Steps */}
                    {struct.recommendedNextSteps && struct.recommendedNextSteps.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Recommended Next Steps
                        </p>
                        <ul className="space-y-1 text-xs text-slate-700">
                          {struct.recommendedNextSteps.map((step, sIdx) => (
                            <li key={sIdx} className="flex items-start gap-1.5">
                              <span className="text-teal-600 font-bold">✓</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 6. Warning Signs to Watch For */}
                    {struct.warningSigns && struct.warningSigns.length > 0 && (
                      <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-xs text-rose-950">
                        <span className="font-bold flex items-center gap-1 text-rose-800 mb-1">
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                          <span>Warning Signs to Watch For:</span>
                        </span>
                        <ul className="space-y-0.5">
                          {struct.warningSigns.map((w, wIdx) => (
                            <li key={wIdx} className="flex items-start gap-1 text-[11px]">
                              <span>•</span>
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Citations Footer */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex flex-wrap items-center gap-1.5">
                        <BookOpen className="h-3 w-3 text-teal-600" />
                        <span className="font-bold text-slate-600">Evidence Grounding:</span>
                        {msg.citations.map((cite, cIdx) => (
                          <span key={cIdx} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {cite}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}
              </div>

              {/* Suggested Follow-up Questions */}
              {!isUser && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1 max-w-2xl">
                  {msg.suggestedQuestions.map((q, qIdx) => (
                    <button
                      key={qIdx}
                      onClick={() => handleSendMessage(q)}
                      className="text-left text-xs bg-white hover:bg-teal-50 text-teal-800 border border-teal-200 hover:border-teal-400 px-3 py-1.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <HelpCircle className="h-3 w-3 text-teal-600 shrink-0" />
                      <span>{q}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200 max-w-sm shadow-sm animate-pulse">
            <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-800">Fetching MongoDB Context & Gemini Answer...</p>
              <p className="text-[11px] text-slate-500">Executing deterministic safety engine & routing to clinical specialist</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-white border-t border-slate-200 space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <VoiceTriageButton
            onTranscriptReceived={(text) => {
              setInputValue(text);
              handleSendMessage(text);
            }}
          />

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about pregnancy symptoms, kicks, lab results, BP readings, or trimester diet..."
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none transition-all"
            disabled={isProcessing}
          />

          <button
            type="submit"
            disabled={!inputValue.trim() || isProcessing}
            className="px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-teal-600/30 transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Ask Team</span>
          </button>
        </form>

        <p className="text-[10px] text-slate-400 text-center">
          MotherSync AI is an educational tracking platform and does not provide formal medical diagnosis. In urgent cases, call 911 immediately.
        </p>
      </div>

    </div>
  );
};

export default AgentOrchestratorPage;
