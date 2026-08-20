const GeminiService = require('../services/geminiService');

// Curated Evidence-Based Knowledge Base
const EVIDENCE_KNOWLEDGE_BASE = [
  {
    topic: 'Hypertension and Preeclampsia in Pregnancy',
    source: 'ACOG Practice Bulletin No. 222 (Gestational Hypertension and Preeclampsia)',
    updated: 'January 2026',
    keyTakeaways: [
      'Normal pregnancy blood pressure is typically < 120/80 mmHg. Stage 1 gestational hypertension is defined as systolic >= 140 or diastolic >= 90 mmHg on two occasions at least 4 hours apart after 20 weeks.',
      'Severe preeclampsia indicators include BP >= 160/110 mmHg, persistent severe headache unresponsive to medication, visual disturbances (scotomas/flashing), epigastric or right upper quadrant pain, pulmonary edema, or severe thrombocytopenia.',
      'Aspirin prophylaxis (low-dose 81-162 mg/day) is initiated at 12-16 weeks for individuals at moderate to high risk under clinical guidance.'
    ]
  },
  {
    topic: 'Gestational Diabetes Mellitus (GDM) Screening',
    source: 'ACOG Practice Bulletin No. 190 / ADA 2026 Standards of Medical Care in Pregnancy',
    updated: 'March 2026',
    keyTakeaways: [
      'Universal screening is routinely performed between 24 and 28 weeks of gestation using the 1-hour 50-gram glucose challenge test (GCT).',
      'Target fasting glucose levels during pregnancy are < 95 mg/dL; 1-hour postprandial < 140 mg/dL; 2-hour postprandial < 120 mg/dL.',
      'First-line management begins with nutritional counseling, carbohydrate distribution, and moderate physical activity.'
    ]
  },
  {
    topic: 'Fetal Movement and Kick Counting',
    source: 'Society for Maternal-Fetal Medicine (SMFM) Clinical Guidance / ACOG',
    updated: '2026 Review',
    keyTakeaways: [
      'Formal kick counting is generally initiated around 28 weeks (or 24 weeks for higher-risk pregnancies).',
      'A widely used standard: Feeling at least 10 distinct movements within 2 hours during the baby\'s active window while resting comfortably in a quiet setting.',
      'Any acute maternal perception of decreased fetal movement (DFM) warrants immediate clinical contact or non-stress testing (NST).'
    ]
  },
  {
    topic: 'Prenatal Nutrition & Supplementation',
    source: 'WHO Recommendations on Antenatal Care for a Positive Pregnancy Experience',
    updated: '2026 Edition',
    keyTakeaways: [
      'Daily elemental iron (30-60 mg) and folic acid (400-800 mcg) are recommended throughout pregnancy to prevent maternal anemia and neural tube defects.',
      'Dietary calcium requirement is 1000 mg/day (1300 mg/day for adolescents).',
      'DHA omega-3 fatty acids (200-300 mg/day) support fetal neural and visual development.'
    ]
  },
  {
    topic: 'Medication Safety in Pregnancy',
    source: 'CDC Treating for Two Initiative / FDA Pregnancy Exposure Registries',
    updated: '2026',
    keyTakeaways: [
      'Medication safety during pregnancy depends on specific drug pharmacokinetics, trimester of exposure, maternal metabolism, and dosage.',
      'Over-the-counter NSAIDs (such as Ibuprofen) should be avoided in the third trimester (>20-28 weeks) due to potential premature closure of the fetal ductus arteriosus and oligohydramnios.',
      'Acetaminophen is considered standard first-line for mild analgesia when used at recommended doses for short duration, under clinician advice.'
    ]
  }
];

class KnowledgeRAGAgent {
  static async process({ userMessage, userProfile = {}, healthContext = {} }) {
    // Retrieve relevant clinical guidance chunks
    const matchedEvidence = this.retrieveRelevantEvidence(userMessage);

    const systemPrompt = `You are the Evidence-Based Knowledge & RAG Agent for MotherSync AI.
Your role:
- Answer pregnancy health questions using verified clinical guidelines (ACOG, WHO, CDC, SMFM, NHS).
- Ground your responses in authoritative evidence rather than hallucinating medical claims.
- Cite your sources clearly with update dates.
- Emphasize that educational guidance cannot substitute for personal clinical examination.`;

    const contextText = matchedEvidence.map(e => `[Source: ${e.source} (${e.updated})]\nTopic: ${e.topic}\nKey Takeaways:\n${e.keyTakeaways.join('\n')}`).join('\n\n');

    const userPrompt = `User question: "${userMessage}"

AUTHORITATIVE CLINICAL KNOWLEDGE CONTEXT:
${contextText}

Please provide a clear, empathetic, evidence-based answer referencing these clinical standards where applicable.`;

    const rawResponse = await GeminiService.generateContent({
      prompt: userPrompt,
      systemInstruction: systemPrompt,
      temperature: 0.2
    });

    return {
      agentName: 'Knowledge / RAG Agent',
      content: rawResponse,
      riskLevel: 'routine',
      suggestedQuestions: [
        'What are the official ACOG guidelines for this topic?',
        'How does this recommendation change between trimesters?',
        'What should I ask my healthcare team regarding this guideline?'
      ],
      citations: matchedEvidence.map(e => `${e.source} (${e.updated})`)
    };
  }

  static retrieveRelevantEvidence(query = '') {
    const q = query.toLowerCase();
    const matches = EVIDENCE_KNOWLEDGE_BASE.filter(item => {
      const combined = (item.topic + ' ' + item.keyTakeaways.join(' ')).toLowerCase();
      return q.split(' ').some(word => word.length > 3 && combined.includes(word));
    });

    return matches.length > 0 ? matches : EVIDENCE_KNOWLEDGE_BASE.slice(0, 2);
  }
}

module.exports = KnowledgeRAGAgent;
