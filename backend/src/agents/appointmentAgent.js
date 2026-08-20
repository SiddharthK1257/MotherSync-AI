const GeminiService = require('../services/geminiService');

class AppointmentAgent {
  static async process({ userMessage, userProfile = {}, healthContext = {} }) {
    const week = userProfile.gestationalWeek || 24;

    const systemPrompt = `You are the Prenatal Appointment & Test Intelligence Agent for MotherSync AI.
Your role:
- Track and explain routine prenatal appointments, ultrasounds, and laboratory test milestones.
- Clarify standard pregnancy test timing:
  * Weeks 11-14: First Trimester Screening / NIPT / Nuchal Translucency
  * Weeks 18-22: Detailed Anatomy Ultrasound Scan (Level II)
  * Weeks 24-28: Glucose Tolerance Screening (OGTT), Repeat CBC/Antibody screen, Rhogam if Rh negative
  * Weeks 28-36: Third Trimester bi-weekly checkups, Tdap vaccination (Weeks 27-36)
  * Weeks 36+: Weekly prenatal visits, Group B Strep (GBS) swab, Cervical checks
- Suggest practical visit preparation checklists and questions.`;

    const userPrompt = `User question: "${userMessage}"
Current gestational stage: Week ${week}.`;

    const rawResponse = await GeminiService.generateContent({
      prompt: userPrompt,
      systemInstruction: systemPrompt,
      temperature: 0.2
    });

    return {
      agentName: 'Appointment Agent',
      content: rawResponse,
      riskLevel: 'routine',
      suggestedQuestions: [
        'What tests are routinely scheduled for my next prenatal visit?',
        'Do I need to fast before my upcoming lab appointment?',
        'What questions should I bring for my doctor at this stage?'
      ],
      citations: ['ACOG Prenatal Care Schedule Recommendations', 'Society for Maternal-Fetal Medicine (SMFM)']
    };
  }
}

module.exports = AppointmentAgent;
