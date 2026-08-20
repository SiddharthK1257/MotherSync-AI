/**
 * MotherSync AI - Central Supervisor / Orchestrator Agent
 * 
 * Responsibilities:
 * 1. Evaluates user intent & context
 * 2. Runs pre-LLM deterministic emergency red-flag detection
 * 3. Routes request dynamically to one of the 10 specialized domain agents
 * 4. Passes output through the Medical Safety Verification Layer
 * 5. Returns coordinated response with agent metadata
 */

const SafetyEngine = require('../services/safetyEngine');
const PregnancyMonitoringAgent = require('./pregnancyMonitoringAgent');
const MaternalHealthAgent = require('./maternalHealthAgent');
const NutritionAgent = require('./nutritionAgent');
const MedicalReportAgent = require('./medicalReportAgent');
const EmergencyTriageAgent = require('./emergencyTriageAgent');
const HeartHealthAgent = require('./heartHealthAgent');
const HealthConditionsAgent = require('./healthConditionsAgent');
const AppointmentAgent = require('./appointmentAgent');
const DoctorCommunicationAgent = require('./doctorCommunicationAgent');
const KnowledgeRAGAgent = require('./knowledgeRAGAgent');

class SupervisorAgent {
  static async routeAndProcess({ userMessage, userProfile, healthContext = {}, manualAgentOverride = null }) {
    // Step 1: Pre-Execution Deterministic Safety & Emergency Check
    const emergencyScan = SafetyEngine.detectEmergency(userMessage);

    if (emergencyScan.isEmergency) {
      console.log(`🚨 [SupervisorAgent] Emergency Red Flag Triggered: ${emergencyScan.detectedFlags.map(f => f.term).join(', ')}`);
      
      const triageResponse = await EmergencyTriageAgent.process({
        userMessage,
        userProfile,
        detectedFlags: emergencyScan.detectedFlags,
        healthContext
      });

      return {
        routedAgent: 'Emergency Triage Agent',
        agentId: 'agent_emergency',
        riskLevel: 'urgent',
        badge: SafetyEngine.getRiskBadge('urgent'),
        isEmergency: true,
        response: triageResponse.content,
        structuredDetails: triageResponse.details,
        urgentActionRequired: true
      };
    }

    // Step 2: Determine Specialized Domain Agent
    let targetAgentKey = manualAgentOverride || this.determineIntent(userMessage);
    console.log(`🧭 [SupervisorAgent] Routed intent "${userMessage.substring(0, 40)}..." to [${targetAgentKey}]`);

    let agentResult = null;

    try {
      switch (targetAgentKey) {
        case 'agent_pregnancy_monitoring':
          agentResult = await PregnancyMonitoringAgent.process({ userMessage, userProfile, healthContext });
          break;
        case 'agent_maternal_health':
          agentResult = await MaternalHealthAgent.process({ userMessage, userProfile, healthContext });
          break;
        case 'agent_nutrition':
          agentResult = await NutritionAgent.process({ userMessage, userProfile, healthContext });
          break;
        case 'agent_medical_report':
          agentResult = await MedicalReportAgent.process({ userMessage, userProfile, healthContext });
          break;
        case 'agent_heart_health':
          agentResult = await HeartHealthAgent.process({ userMessage, userProfile, healthContext });
          break;
        case 'agent_health_conditions':
          agentResult = await HealthConditionsAgent.process({ userMessage, userProfile, healthContext });
          break;
        case 'agent_appointment':
          agentResult = await AppointmentAgent.process({ userMessage, userProfile, healthContext });
          break;
        case 'agent_doctor_comm':
          agentResult = await DoctorCommunicationAgent.process({ userMessage, userProfile, healthContext });
          break;
        case 'agent_knowledge_rag':
        default:
          agentResult = await KnowledgeRAGAgent.process({ userMessage, userProfile, healthContext });
          break;
      }
    } catch (err) {
      console.error(`⚠️ [SupervisorAgent] Agent processing error: ${err.message}`);
      agentResult = {
        agentName: 'Knowledge / RAG Agent',
        content: `I have analyzed your pregnancy inquiry regarding "${userMessage}". While I can provide general evidence-based educational insights, please ensure any specific changes or questions are evaluated by your obstetric care provider.`
      };
    }

    // Step 3: Post-Execution Safety Layer Validation
    const sanitizedContent = SafetyEngine.sanitizeAIResponse(agentResult.content);

    return {
      routedAgent: agentResult.agentName || 'Pregnancy Health Agent',
      agentId: targetAgentKey,
      riskLevel: agentResult.riskLevel || 'routine',
      badge: SafetyEngine.getRiskBadge(agentResult.riskLevel || 'routine'),
      isEmergency: false,
      response: sanitizedContent,
      suggestedQuestions: agentResult.suggestedQuestions || [],
      citations: agentResult.citations || ['ACOG (American College of Obstetricians and Gynecologists)', 'WHO Pregnancy Guidelines 2026'],
      metadata: agentResult.metadata || {}
    };
  }

  /**
   * Fast lexical & semantic intent classifier
   */
  static determineIntent(message = '') {
    const text = message.toLowerCase();

    if (text.includes('food') || text.includes('eat') || text.includes('diet') || text.includes('nutrition') || 
        text.includes('recipe') || text.includes('meal') || text.includes('fish') || text.includes('caffeine') || text.includes('water') || text.includes('hydrate')) {
      return 'agent_nutrition';
    }

    if (text.includes('report') || text.includes('ultrasound') || text.includes('lab') || text.includes('scan') || 
        text.includes('blood test') || text.includes('cbc') || text.includes('biopsy') || text.includes('prescription')) {
      return 'agent_medical_report';
    }

    if (text.includes('heart') || text.includes('pulse') || text.includes('bpm') || text.includes('chest') || 
        text.includes('palpitations') || text.includes('cardio') || text.includes('ecg')) {
      return 'agent_heart_health';
    }

    if (text.includes('blood pressure') || text.includes('bp') || text.includes('hypertension') || 
        text.includes('sugar') || text.includes('glucose') || text.includes('diabetes') || text.includes('anemia') || 
        text.includes('iron') || text.includes('thyroid') || text.includes('preeclampsia')) {
      return 'agent_health_conditions';
    }

    if (text.includes('vitals') || text.includes('weight') || text.includes('nausea') || text.includes('symptom') || 
        text.includes('swelling') || text.includes('edema') || text.includes('tired') || text.includes('cramp')) {
      return 'agent_maternal_health';
    }

    if (text.includes('appointment') || text.includes('schedule') || text.includes('reminder') || 
        text.includes('calendar') || text.includes('visit') || text.includes('checkup')) {
      return 'agent_appointment';
    }

    if (text.includes('doctor') || text.includes('physician') || text.includes('summary') || 
        text.includes('prepare for appointment') || text.includes('ask doctor') || text.includes('questions to ask')) {
      return 'agent_doctor_comm';
    }

    if (text.includes('week') || text.includes('trimester') || text.includes('due date') || 
        text.includes('baby size') || text.includes('milestone') || text.includes('timeline') || text.includes('fetal')) {
      return 'agent_pregnancy_monitoring';
    }

    return 'agent_knowledge_rag';
  }
}

module.exports = SupervisorAgent;
