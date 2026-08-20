const GeminiService = require('../services/geminiService');

class MedicalReportAgent {
  static async process({ userMessage, userProfile = {}, healthContext = {} }) {
    const systemPrompt = `You are the Medical Report Explanation Agent for MotherSync AI.
Your role:
- Translate complex laboratory values, ultrasound metrics, and clinical reports into simple, empathetic language.
- Explain medical terms clearly (e.g. Hemoglobin, Platelets, AFI, Placenta, Gestational Sac).
- Clearly separate "What the report says" from "This is a clinical diagnosis."
- Identify values that fall outside typical reference intervals to facilitate physician discussion.

CRITICAL SAFETY RULES:
- NEVER declare a definitive diagnosis.
- NEVER fabricate missing values.
- Remind the patient that laboratory interpretations require comprehensive clinical context from their healthcare professional.

Use structured layout:
### What the report says
### What this generally means in pregnancy
### Why you may want to discuss it with your clinician
### Questions to ask your doctor`;

    const userPrompt = `User question regarding medical report: "${userMessage}"
Context: Gestational week ${userProfile.gestationalWeek || 24}.`;

    const rawResponse = await GeminiService.generateContent({
      prompt: userPrompt,
      systemInstruction: systemPrompt,
      temperature: 0.15
    });

    return {
      agentName: 'Medical Report Agent',
      content: rawResponse,
      riskLevel: 'routine',
      suggestedQuestions: [
        'What is the significance of this specific lab reading?',
        'Do I need any follow-up tests or repeat bloodwork?',
        'Should I make any adjustments based on this report finding?'
      ],
      citations: ['ACOG Committee Opinion on Diagnostic Tests in Pregnancy', 'Society for Maternal-Fetal Medicine (SMFM)']
    };
  }

  /**
   * Deep structured analysis of raw uploaded text
   */
  static async analyzeDocumentText({ rawText, reportType = 'blood_test' }) {
    const prompt = `Analyze this medical report text for a pregnant patient:
---
${rawText}
---
Extract structured information and return a JSON object with:
1. "title": descriptive title
2. "type": report type
3. "structuredFindings": array of { parameter, value, unit, referenceRange, status: "normal"|"borderline"|"abnormal"|"critical" }
4. "aiSummary": 2 sentence professional clinical summary
5. "laymanExplanation": plain language explanation for the pregnant mother
6. "clinicianDiscussionPoints": array of points to review with doctor
7. "questionsForDoctor": array of 3 actionable questions for the next visit
8. "riskFlag": "low"|"moderate"|"high"|"urgent"`;

    return await GeminiService.generateStructuredJSON({ prompt });
  }
}

module.exports = MedicalReportAgent;
