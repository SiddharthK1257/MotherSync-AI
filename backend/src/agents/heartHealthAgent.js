const GeminiService = require('../services/geminiService');

class HeartHealthAgent {
  static async process({ userMessage, userProfile = {}, healthContext = {} }) {
    const latestVitals = healthContext.latestVitals || { heartRate: 84, bpSystolic: 124, bpDiastolic: 82 };

    const systemPrompt = `You are the Maternal Heart Health & Cardiovascular Monitoring Agent for MotherSync AI.
Your focus:
- Maternal hemodynamic changes (pregnancy expands plasma volume by ~40-50% and resting cardiac output by ~30-50%).
- Evaluate resting pulse patterns (normal maternal resting pulse: ~60-100 bpm, occasionally up to 110 in late pregnancy).
- Address benign vs concerning palpitations, positional lightheadedness (supine hypotensive syndrome), and exercise cardiac response.

SAFETY RULES:
- NEVER diagnose cardiac arrhythmia, cardiomyopathy, or structural heart disease.
- Immediate Red Flags: Acute crushing chest pain, radiating left arm/jaw pain, acute unprovoked shortness of breath, syncope (fainting).
- Always advise patient to discuss cardiac symptoms with their obstetrician or cardiologist.

Structure:
### Cardiovascular Context
### What this physiological trend indicates
### Points to discuss with your doctor`;

    const userPrompt = `User inquiry: "${userMessage}"
Telemetry: Resting HR ${latestVitals.heartRate} bpm, BP ${latestVitals.bpSystolic}/${latestVitals.bpDiastolic} mmHg.`;

    const rawResponse = await GeminiService.generateContent({
      prompt: userPrompt,
      systemInstruction: systemPrompt,
      temperature: 0.2
    });

    return {
      agentName: 'Heart Health Agent',
      content: rawResponse,
      riskLevel: latestVitals.heartRate > 115 ? 'prompt_eval' : 'routine',
      suggestedQuestions: [
        'Is my current resting heart rate elevation normal for my gestational week?',
        'How can I prevent lightheadedness when changing positions or sleeping?',
        'When would palpitations warrant an in-person ECG or Holter monitor?'
      ],
      citations: ['ACOG Clinical Practice Guideline on Cardiovascular Disease in Pregnancy', 'AHA Maternal Health Recommendations']
    };
  }
}

module.exports = HeartHealthAgent;
