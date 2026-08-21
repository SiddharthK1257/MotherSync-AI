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
  static async generateAppointmentQuestions({ userProfile = {}, vitalsHistory = [], reports = [], symptoms = [] }) {
    const week = userProfile?.gestationalWeek || 24;
    const latestVital = vitalsHistory[vitalsHistory.length - 1] || {};
    const bp = latestVital.bpSystolic ? `${latestVital.bpSystolic}/${latestVital.bpDiastolic} mmHg` : '120/78 mmHg';
    const hr = latestVital.heartRate ? `${latestVital.heartRate} bpm` : '80 bpm';

    try {
      const res = await GeminiService.generateAppointmentQuestions({ userProfile, vitalsHistory, reports, symptoms });
      if (res && (Array.isArray(res.generalQuestions) && res.generalQuestions.length > 0 || Array.isArray(res.vitalsSpecificQuestions) && res.vitalsSpecificQuestions.length > 0)) {
        return res;
      }
    } catch (err) {
      console.warn('[DoctorCommunicationAgent] Gemini generation error, using clinical synthesis:', err.message);
    }

    // Dynamic evidence-based fallback tailored to patient context
    const reportTitles = reports.map(r => r.title).filter(Boolean);
    return {
      generalQuestions: [
        `Are my maternal and fetal biometric measurements progressing on track for Week ${week}?`,
        'What preparation or fasting guidelines should I follow for my upcoming glucose tolerance screening (OGTT)?',
        'Should I continue standard fetal kick counts twice daily at this gestational stage?'
      ],
      vitalsSpecificQuestions: [
        `My blood pressure averaged ${bp} with a resting heart rate of ${hr}. Are these hemodynamics within expected baseline for second-trimester volume expansion?`
      ],
      labSpecificQuestions: reportTitles.length > 0 ? [
        `Regarding my recent ${reportTitles[0]}: are any adjustments recommended for my prenatal iron or vitamin supplementation?`
      ] : [
        'Are there any routine blood tests, antibody screens, or ultrasounds recommended before our next appointment milestone?'
      ],
      summaryTip: 'Bring your printed MotherSync AI clinical summary and blood pressure log to your appointment for rapid clinician review.'
    };
  }
}

module.exports = DoctorCommunicationAgent;
