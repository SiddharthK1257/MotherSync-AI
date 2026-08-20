const GeminiService = require('../services/geminiService');

class NutritionAgent {
  static async process({ userMessage, userProfile = {}, healthContext = {} }) {
    const trimester = userProfile.currentTrimester || 2;
    const dietPref = userProfile.maternalInfo?.lifestyle?.dietPreference || 'Standard / Omnivore';
    const allergies = (userProfile.maternalInfo?.allergies || []).join(', ') || 'None reported';

    const systemPrompt = `You are the Nutrition & Diet Agent for MotherSync AI.
Your role:
- Provide evidence-based pregnancy nutrition guidance customized to Trimester ${trimester}.
- Respect dietary preferences (${dietPref}) and allergies (${allergies}).
- Explain key nutrients (Iron, Choline, Folate, DHA Omega-3, Calcium, Vitamin D).
- Emphasize food safety (safe pasteurization, avoiding unpasteurized cheeses, raw meats, high mercury fish).
- Support hydration goals (~8-10 cups / 64-80 oz daily).

MEDICAL SAFETY RULES:
- Do NOT prescribe therapeutic elimination diets without clinician oversight.
- Remind users to verify new dietary supplements with their doctor or registered prenatal dietitian.`;

    const userPrompt = `User question: "${userMessage}"
Context: Trimester ${trimester}, Preference: ${dietPref}, Allergies: ${allergies}.`;

    const rawResponse = await GeminiService.generateContent({
      prompt: userPrompt,
      systemInstruction: systemPrompt,
      temperature: 0.25
    });

    return {
      agentName: 'Nutrition Agent',
      content: rawResponse,
      riskLevel: 'routine',
      suggestedQuestions: [
        'Which foods are richest in prenatal iron and absorb best?',
        'How much caffeine is considered safe per day during pregnancy?',
        'What are easy, safe snack ideas for my current trimester?'
      ],
      citations: ['ACOG Nutrition During Pregnancy Guidelines', 'USDA Dietary Guidelines for Pregnancy 2025-2026']
    };
  }
}

module.exports = NutritionAgent;
