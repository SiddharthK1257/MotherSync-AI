const GeminiService = require('../services/geminiService');
const SafetyEngine = require('../services/safetyEngine');

class MaternalHealthAgent {
  static async process({ userMessage, userProfile = {}, healthContext = {} }) {
    const latestVitals = healthContext.latestVitals || {
      bpSystolic: 124,
      bpDiastolic: 82,
      heartRate: 84,
      bloodGlucose: 98,
      weight: 68.5
    };

    const riskEval = SafetyEngine.evaluateVitalsRisk({
      bpSystolic: latestVitals.bpSystolic,
      bpDiastolic: latestVitals.bpDiastolic,
      heartRate: latestVitals.heartRate,
      bloodGlucose: latestVitals.bloodGlucose,
      week: userProfile.gestationalWeek || 24,
      symptoms: healthContext.recentSymptoms || []
    });

    const systemPrompt = `You are the Maternal Health Agent for MotherSync AI.
Your responsibilities:
- Analyze maternal vital signs (Blood Pressure, Heart Rate, Glucose, Weight trends)
- Evaluate reported symptoms (nausea, edema, cramps, fatigue, dizziness)
- Explain physiological shifts during pregnancy
- Detect trends that warrant clinical follow-up

SAFETY MANDATES:
- NEVER diagnose a medical condition.
- NEVER tell a user their symptoms are "definitely benign" or "nothing to worry about".
- Provide objective, evidence-based context.
- Suggest discussion with an obstetrician or midwife.

Format response clearly using:
### What I noticed
### Why it may matter
### What I cannot determine
### What you should do next`;

    const userPrompt = `User question: "${userMessage}"
Latest telemetry: BP ${latestVitals.bpSystolic}/${latestVitals.bpDiastolic} mmHg, HR ${latestVitals.heartRate} bpm, Glucose ${latestVitals.bloodGlucose || 'N/A'} mg/dL, Weight ${latestVitals.weight || 'N/A'} kg.
Computed Risk Level: ${riskEval.riskLevel.toUpperCase()}. Rationale: ${riskEval.summaryRationale}`;

    const rawResponse = await GeminiService.generateContent({
      prompt: userPrompt,
      systemInstruction: systemPrompt,
      temperature: 0.2
    });

    return {
      agentName: 'Maternal Health Agent',
      content: rawResponse,
      riskLevel: riskEval.riskLevel,
      suggestedQuestions: [
        'How should I log my blood pressure readings at home?',
        'When is mild ankle swelling considered normal vs concerning?',
        'Should I mention my recent fatigue to my obstetrician?'
      ],
      citations: ['ACOG Practice Bulletin No. 222 (Hypertension in Pregnancy)', 'ACOG Maternal Physiology Guidance']
    };
  }
}

module.exports = MaternalHealthAgent;
