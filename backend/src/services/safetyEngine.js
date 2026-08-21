/**
 * MotherSync AI - Deterministic Medical Safety Engine
 * 
 * Enforces strict clinical safety guardrails, 4-tier risk classification,
 * emergency red-flag interception, and standardized healthcare disclaimer compliance.
 */

// Critical Emergency Symptoms & Triggers
const EMERGENCY_RED_FLAGS = [
  { term: 'severe chest pain', pattern: /chest\s+pain/i, category: 'cardiovascular' },
  { term: 'difficulty breathing', pattern: /(difficulty|trouble|shortness\s+of)\s+(breathing|breath)/i, category: 'respiratory' },
  { term: 'fainting or syncope', pattern: /(fainting|passed\s+out|loss\s+of\s+consciousness|syncope|blacked\s+out)/i, category: 'neurological' },
  { term: 'seizure or convulsion', pattern: /(seizure|convulsion|eclampsia)/i, category: 'neurological' },
  { term: 'vaginal bleeding', pattern: /(vaginal\s+bleeding|heavy\s+bleeding|severe.*bleeding|hemorrhage|blood.*clot|soaking.*pad)/i, category: 'obstetric' },
  { term: 'severe abdominal or pelvic pain', pattern: /(severe|sharp|unbearable|acute|intense).*(abdominal|pelvic|stomach|belly|cramp|pain)/i, category: 'obstetric' },
  { term: 'amniotic fluid leakage / water broke', pattern: /(water\s+broke|fluid\s+leak|leaking\s+fluid|rupture\s+of\s+membranes)/i, category: 'obstetric' },
  { term: 'preeclampsia headache & visual symptoms', pattern: /(severe\s+headache|blurry\s+vision|blurred\s+vision|seeing\s+spots|flashing\s+lights|scotoma)/i, category: 'preeclampsia' },
  { term: 'sudden facial or hand swelling', pattern: /(sudden|severe).*(swelling|edema).*(face|hands|eyes)/i, category: 'preeclampsia' },
  { term: 'right upper quadrant pain', pattern: /(upper\s+right|epigastric|under\s+rib).*(pain|ache)/i, category: 'preeclampsia' },
  { term: 'absent or markedly reduced fetal movement', pattern: /(no|stopped|decrease|reduced|less|absent|not).*(baby.*mov|fetal.*mov|kick)/i, category: 'fetal_wellbeing' },
  { term: 'high fever / systemic infection', pattern: /(high\s+fever|fever\s+(above|>|over)\s+(38|101)|chills.*fever)/i, category: 'infection' }
];

// Disallowed Medical Assertions to Strip / Guard Against
const PROHIBITED_PHRASES = [
  /your baby is (definitely|100%|completely|guaranteed) healthy/i,
  /your baby is (unhealthy|deformed|abnormal|doomed)/i,
  /you have ([a-z\s]+) disease for sure/i,
  /i diagnose you with/i,
  /you (must|should) stop taking your (prescribed|medication|medicine)/i,
  /take ([0-9]+)\s?(mg|g|tablets) of/i
];

class SafetyEngine {
  /**
   * Scans user text for acute medical emergencies requiring immediate triage override.
   */
  static detectEmergency(text = '') {
    const raw = String(text || '');
    const lower = raw.toLowerCase();
    const detectedFlags = [];

    for (const flag of EMERGENCY_RED_FLAGS) {
      if (flag.pattern ? flag.pattern.test(raw) : lower.includes(flag.term.toLowerCase())) {
        detectedFlags.push(flag);
      }
    }

    const isEmergency = detectedFlags.length > 0;

    return {
      isEmergency,
      detectedFlags,
      riskLevel: isEmergency ? 'urgent' : 'routine',
      recommendedAction: isEmergency ? 'IMMEDIATE_EMERGENCY_CARE' : 'STANDARD_ASSISTANCE'
    };
  }

  /**
   * Computes the 4-Tier Pregnancy Risk Status based on vitals, week, and reported symptoms.
   * 
   * Levels:
   * 🟢 routine: Normotensive, stable HR, standard physiological changes
   * 🟡 follow_up: Minor isolated symptoms, borderline ferritin/glucose
   * 🟠 prompt_eval: Elevated BP (130-139/85-89), persistent fever, reduced movement, persistent vomiting
   * 🔴 urgent: Severe BP (>=140/90), acute hemorrhage, acute chest pain, neurological preeclampsia triad
   */
  static evaluateVitalsRisk({ bpSystolic, bpDiastolic, heartRate, bloodGlucose, week = 24, symptoms = [] }) {
    const rationales = [];
    let riskLevel = 'routine';

    // 1. Blood Pressure Evaluation (ACOG Clinical Criteria)
    if (bpSystolic >= 160 || bpDiastolic >= 110) {
      riskLevel = 'urgent';
      rationales.push(`Blood pressure reading (${bpSystolic}/${bpDiastolic} mmHg) meets Stage 2 Severe Hypertensive range during pregnancy. Immediate clinical evaluation is required to assess for severe preeclampsia.`);
    } else if (bpSystolic >= 140 || bpDiastolic >= 90) {
      if (riskLevel !== 'urgent') riskLevel = 'prompt_eval';
      rationales.push(`Blood pressure reading (${bpSystolic}/${bpDiastolic} mmHg) is in the gestational hypertension range (>=140/90 mmHg). Prompt medical evaluation by your obstetrician is advised.`);
    } else if (bpSystolic >= 130 || bpDiastolic >= 85) {
      if (riskLevel === 'routine') riskLevel = 'follow_up';
      rationales.push(`Blood pressure (${bpSystolic}/${bpDiastolic} mmHg) shows mild elevation above baseline. Regular repeat monitoring and non-urgent clinical discussion are recommended.`);
    }

    // 2. Heart Rate Evaluation
    if (heartRate > 120) {
      if (riskLevel !== 'urgent') riskLevel = 'prompt_eval';
      rationales.push(`Resting heart rate is elevated (${heartRate} bpm). Maternal tachycardia warrants medical review to exclude dehydration, thyroid changes, or infection.`);
    } else if (heartRate < 50) {
      if (riskLevel === 'routine') riskLevel = 'follow_up';
      rationales.push(`Resting heart rate (${heartRate} bpm) is low. Discuss with your physician at your next visit.`);
    }

    // 3. Fasting Glucose Evaluation (Gestational Diabetes thresholds)
    if (bloodGlucose) {
      if (bloodGlucose >= 140) {
        if (riskLevel !== 'urgent') riskLevel = 'prompt_eval';
        rationales.push(`Blood glucose (${bloodGlucose} mg/dL) is notably elevated above pregnancy targets (<95 fasting, <120-140 post-prandial). Evaluation for gestational glucose regulation is recommended.`);
      } else if (bloodGlucose >= 100) {
        if (riskLevel === 'routine') riskLevel = 'follow_up';
        rationales.push(`Fasting glucose (${bloodGlucose} mg/dL) is slightly above the optimal pregnancy baseline (<95 mg/dL).`);
      }
    }

    // 4. Symptoms Scan
    const symptomNames = (symptoms || []).map(s => (typeof s === 'string' ? s : s.name || '')).join(' ').toLowerCase();
    const emergencyCheck = this.detectEmergency(symptomNames);
    if (emergencyCheck.isEmergency) {
      riskLevel = 'urgent';
      rationales.push(`Reported symptoms include potentially urgent pregnancy warning signs (${emergencyCheck.detectedFlags.map(f => f.term).join(', ')}).`);
    }

    if (rationales.length === 0) {
      rationales.push('Your recorded vital signs and reported metrics fall within normal physiological parameters for this stage of pregnancy.');
    }

    return {
      riskLevel,
      badge: this.getRiskBadge(riskLevel),
      rationales,
      summaryRationale: rationales.join(' '),
      disclaimer: 'This status is generated for health tracking and general education only. It is NOT a medical diagnosis or a guarantee of fetal health. Always follow your obstetrician or midwife’s personalized guidance.'
    };
  }

  static getRiskBadge(level) {
    switch (level) {
      case 'urgent':
        return { color: 'red', label: 'Urgent Evaluation Recommended', code: '🔴' };
      case 'prompt_eval':
        return { color: 'orange', label: 'Prompt Medical Evaluation Recommended', code: '🟠' };
      case 'follow_up':
        return { color: 'yellow', label: 'Healthcare Professional Follow-up Recommended', code: '🟡' };
      case 'routine':
      default:
        return { color: 'green', label: 'Routine Monitoring', code: '🟢' };
    }
  }

  /**
   * Sanitizes and enforces safety guidelines on generated text before sending to user.
   */
  static sanitizeAIResponse(responseText = '') {
    let sanitized = responseText;

    // Check for prohibited phrases and replace with safe clinical communication
    for (const pattern of PROHIBITED_PHRASES) {
      if (pattern.test(sanitized)) {
        sanitized = sanitized.replace(
          pattern,
          'Your healthcare provider is the only one who can evaluate and confirm your and your baby’s health.'
        );
      }
    }

    // Ensure mandatory disclaimer is attached if not already present
    const mandatoryDisclaimer = '\n\n*MotherSync AI is an educational and monitoring platform designed to support you and your care team, not a doctor. Always consult your obstetrician, midwife, or call emergency services for acute symptoms.*';
    
    if (!sanitized.includes('MotherSync AI') && !sanitized.includes('educational and monitoring')) {
      sanitized += mandatoryDisclaimer;
    }

    return sanitized;
  }

  /**
   * Formats structured 4-part safety response.
   */
  static formatStructuredSafetyResponse({ noticed, whyItMatters, cannotDetermine, whatToDoNext }) {
    return `### What I noticed
${noticed}

### Why it may matter
${whyItMatters}

### What I cannot determine
${cannotDetermine || 'This AI platform cannot diagnose the underlying cause, verify fetal health directly, or substitute for in-person clinical examinations and diagnostic imaging.'}

### What you should do next
${whatToDoNext}

---
*MotherSync AI is an educational healthcare platform, not a doctor. Please contact your obstetrician, midwife, or emergency services for urgent symptoms.*`;
  }
}

module.exports = SafetyEngine;
