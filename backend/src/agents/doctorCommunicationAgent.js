const GeminiService = require('../services/geminiService');

class DoctorCommunicationAgent {
  static async process({ userMessage, userProfile = {}, healthContext = {} }) {
    const week = userProfile.gestationalWeek || 24;
    const records = healthContext.records || [];
    const latestVitals = healthContext.latestVitals || { bpSystolic: 124, bpDiastolic: 82, heartRate: 84 };

    const systemPrompt = `You are the Doctor Communication & Clinical Summary Agent for MotherSync AI.
Your role:
- Synthesize patient vitals, symptoms, and uploaded report trends into structured, high-value clinical summaries for obstetricians and midwives.
- Generate high-yield questions for the patient to ask ("Prepare for My Appointment").
- Ensure all information requires patient review and explicit consent before sharing.
- Emphasize objective data (dates, blood pressure readings, reported frequencies) over speculation.

Format:
### Executive Patient Brief
### Key Longitudinal Observations
### Tailored Questions to Ask Your Obstetrician`;

    const userPrompt = `User request: "${userMessage}"
Patient info: ${userProfile.name || 'Patient'}, Week ${week}, Latest BP: ${latestVitals.bpSystolic}/${latestVitals.bpDiastolic}, HR: ${latestVitals.heartRate} bpm. Recent logs: ${records.length} records.`;

    const rawResponse = await GeminiService.generateContent({
      prompt: userPrompt,
      systemInstruction: systemPrompt,
      temperature: 0.2
    });

    return {
      agentName: 'Doctor Communication Agent',
      content: rawResponse,
      riskLevel: 'routine',
      suggestedQuestions: [
        'How can I download or print this doctor summary for my upcoming visit?',
        'What are the top 3 questions I should prioritize asking my OB/GYN?',
        'Can I share my longitudinal blood pressure log directly with my clinic?'
      ],
      citations: ['ACOG Guidelines on Patient-Provider Communication', 'American Academy of Family Physicians (AAFP)']
    };
  }

  /**
   * Generates dynamic "Prepare for My Appointment" questions tailored to patient context
   */
  static async generateAppointmentQuestions({ userProfile, vitalsHistory = [], reports = [], symptoms = [] }) {
    const prompt = `Based on the following pregnancy patient data:
- Gestational Week: ${userProfile?.gestationalWeek || 24}
- Vitals History: ${JSON.stringify(vitalsHistory.slice(-4))}
- Recent Symptoms: ${JSON.stringify(symptoms)}
- Uploaded Reports: ${reports.map(r => r.title).join(', ') || 'None'}

Generate 4 highly specific, medically relevant questions for the patient to ask their OB/GYN at their next appointment. Return JSON with:
{
  "generalQuestions": ["..."],
  "vitalsSpecificQuestions": ["..."],
  "reportSpecificQuestions": ["..."],
  "summaryTip": "..."
}`;

    return await GeminiService.generateStructuredJSON({ prompt });
  }
}

module.exports = DoctorCommunicationAgent;
