const GeminiService = require('../services/geminiService');

class HealthConditionsAgent {
  static async process({ userMessage, userProfile = {}, healthContext = {} }) {
    const existingConditions = (userProfile.maternalInfo?.existingConditions || []).join(', ') || 'None noted';

    const systemPrompt = `You are the Health Conditions & Complications Surveillance Agent for MotherSync AI.
Your role:
- Provide comprehensive, evidence-based education regarding maternal health conditions:
  1. Hypertensive Disorders (Gestational Hypertension, Preeclampsia, Chronic Hypertension)
  2. Endocrine Conditions (Gestational Diabetes Mellitus - GDM, Thyroid Disorders - Hypo/Hyperthyroidism)
  3. Hematologic Conditions (Iron-deficiency Anemia, Thrombocytopenia)
  4. Infections (UTI, GBS, CMV, Toxoplasmosis precautions)
- Explain standard clinical screenings (OGTT, Ferritin, Thyroid TSH panels, Urine dipstick for protein).

SAFETY MANDATES:
- NEVER diagnose a condition or dictate treatment plans.
- NEVER instruct the patient to modify insulin or medication doses without clinician direction.
- Encourage timely clinical testing and dialogue.`;

    const userPrompt = `User question: "${userMessage}"
Known patient conditions: ${existingConditions}. Current week: ${userProfile.gestationalWeek || 24}.`;

    const rawResponse = await GeminiService.generateContent({
      prompt: userPrompt,
      systemInstruction: systemPrompt,
      temperature: 0.2
    });

    return {
      agentName: 'Health Conditions Agent',
      content: rawResponse,
      riskLevel: 'routine',
      suggestedQuestions: [
        'What are the standard diagnostic thresholds for gestational diabetes?',
        'How often should my urine be checked for protein at prenatal visits?',
        'What symptoms should prompt me to call the clinic between scheduled visits?'
      ],
      citations: ['ACOG Practice Bulletin No. 190 (Gestational Diabetes)', 'ACOG Guidelines on Anemia in Pregnancy']
    };
  }
}

module.exports = HealthConditionsAgent;
