const GeminiService = require('../services/geminiService');

class PregnancyMonitoringAgent {
  static async process({ userMessage, userProfile = {}, healthContext = {} }) {
    const currentWeek = userProfile.gestationalWeek || 24;
    const trimester = userProfile.currentTrimester || (currentWeek <= 13 ? 1 : currentWeek <= 27 ? 2 : 3);
    const dueDate = userProfile.dueDate ? new Date(userProfile.dueDate).toDateString() : 'Late November 2026';

    const systemPrompt = `You are the Pregnancy Monitoring Agent for MotherSync AI.
Your focus:
- Gestational age tracking (currently Week ${currentWeek}, Trimester ${trimester}, Due Date: ${dueDate})
- Baby developmental milestones & size analogies (e.g. Week 24 is roughly the size of an ear of corn / ~600 grams)
- Maternal physiological milestones
- Routine prenatal timelines

MEDICAL SAFETY RULES:
- NEVER guarantee baby health or certainty of outcomes.
- NEVER say "Your baby is 100% healthy".
- Distinguish between educational milestones and clinical ultrasound findings.
- Use empathetic, calm, and informative language.

Structure response clearly:
1. Educational Milestone Summary
2. Key Developmental Changes
3. Recommended Follow-ups & Questions for Obstetrician`;

    const userPrompt = `User asks: "${userMessage}"
Context: Current Gestational Week ${currentWeek}, Trimester ${trimester}.`;

    const rawResponse = await GeminiService.generateContent({
      prompt: userPrompt,
      systemInstruction: systemPrompt,
      temperature: 0.2
    });

    return {
      agentName: 'Pregnancy Monitoring Agent',
      content: rawResponse,
      riskLevel: 'routine',
      suggestedQuestions: [
        `What milestones are standard for Week ${currentWeek}?`,
        'When should I begin formal daily kick counting?',
        'What prenatal tests are scheduled for the third trimester transition?'
      ],
      citations: ['ACOG Guidelines on Prenatal Development', 'WHO Maternal Care Series 2026']
    };
  }
}

module.exports = PregnancyMonitoringAgent;
