const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  static getGenAI() {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key.trim() === '' || key === 'your_gemini_api_key_here') return null;
    try {
      return new GoogleGenerativeAI(key.trim());
    } catch (e) {
      console.warn('⚠️ [Gemini AI] Initialization warning:', e.message);
      return null;
    }
  }

  /**
   * Primary LLM generation method with multi-model fallback hierarchy
   */
  static async generateContent({ prompt, systemInstruction = '', temperature = 0.2 }) {
    const genAI = this.getGenAI();

    if (!genAI) {
      return this.fallbackSynthesis({ prompt, systemInstruction });
    }

    // Modern Gemini model candidate hierarchy
    const modelCandidates = [
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-pro',
      'gemini-pro'
    ];

    for (const modelName of modelCandidates) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: temperature,
            maxOutputTokens: 1500,
          },
          systemInstruction: systemInstruction || undefined
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        if (text && text.trim().length > 0) {
          return text;
        }
      } catch (err) {
        // Silently try next model candidate in hierarchy
      }
    }

    // If live API calls fail or quota exceeded, fall back to offline medical synthesizer
    return this.fallbackSynthesis({ prompt, systemInstruction });
  }

  /**
   * Structured JSON extractor
   */
  static async generateStructuredJSON({ prompt, systemInstruction = '' }) {
    const jsonPrompt = `${prompt}\n\nIMPORTANT: Return ONLY a valid JSON object matching the requested schema. Do not enclose in markdown ticks if possible, or use standard \`\`\`json format.`;
    const rawResponse = await this.generateContent({ prompt: jsonPrompt, systemInstruction, temperature: 0.1 });
    
    try {
      let cleaned = rawResponse.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.substring(7);
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.substring(3);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
      }
      cleaned = cleaned.trim();
      return JSON.parse(cleaned);
    } catch (parseError) {
      console.warn('⚠️ [GeminiService] JSON parse failed, returning sanitized structured payload');
      return { raw: rawResponse, parsed: false };
    }
  }

  /**
   * High-fidelity offline clinical knowledge synthesizer
   * Provides evidence-based fallback aligned with ACOG & WHO guidelines.
   */
  static fallbackSynthesis({ prompt = '', systemInstruction = '' }) {
    const p = prompt.toLowerCase();
    
    if (p.includes('headache') || p.includes('vision') || p.includes('preeclampsia')) {
      return `### What I noticed
You are asking about headaches, visual changes, or elevated blood pressure symptoms during pregnancy.

### Why it may matter
In the second and third trimesters, severe throbbing headaches, seeing spots/flashing lights, sudden facial swelling, or upper right abdominal pain can be potential warning signs of preeclampsia (a pregnancy-specific hypertensive condition) that requires clinical blood pressure and urine protein evaluation.

### What I cannot determine
This platform cannot measure your current organ function, diagnose preeclampsia, or evaluate fetal placental perfusion.

### What you should do next
- Contact your obstetrician, maternal triage line, or prenatal clinic today for a blood pressure check.
- If the headache is severe and does not respond to rest/hydration, or if vision is blurry, seek urgent medical evaluation at your nearest maternity hospital emergency room.`;
    }

    if (p.includes('kick') || p.includes('movement') || p.includes('baby move')) {
      return `### What I noticed
You are inquiring about fetal movement and kick counting patterns.

### Why it may matter
Around 24-28 weeks and beyond, fetal movement patterns become more rhythmic. Obstetric guidance (ACOG) recommends noticing your baby's typical daily active windows. A common benchmark when doing a focused kick count is feeling 10 distinct kicks/movements within 2 hours while resting on your side.

### What I cannot determine
This app cannot perform non-stress testing (NST), biophysical profile (BPP), or ultrasound Doppler evaluation of fetal wellbeing.

### What you should do next
- Drink a glass of cold water, lie comfortably on your left side, and count movements in a quiet room.
- If you notice a sudden decrease, absence of movement, or significant change from your baby's baseline, contact your delivery unit or obstetrician immediately.`;
    }

    if (p.includes('food') || p.includes('eat') || p.includes('nutrition') || p.includes('diet') || p.includes('fish')) {
      return `### What I noticed
You are asking about pregnancy nutrition and food safety considerations.

### Why it may matter
Nutritional requirements shift across trimesters. In the second and third trimesters, maternal energy needs increase by ~300-450 kcal/day with emphasis on iron (27mg/day), folate (600mcg/day), calcium (1000mg/day), and omega-3 DHA (200-300mg/day). Food safety is vital to prevent foodborne listeria and toxoplasmosis.

### Key Evidence-Based Guidance:
1. **Safe & Recommended:** Well-cooked lean poultry, pasteurized dairy, lentils, beans, spinach, avocados, cooked low-mercury fish (salmon, trout, sardines).
2. **Foods to Avoid:** Raw/unpasteurized milk and soft cheeses (unpasteurized brie, feta), raw or undercooked seafood/eggs/meat, high-mercury fish (swordfish, shark, king mackerel), unwashed produce, excess caffeine (>200mg/day).
3. **Hydration Target:** Aim for 8-10 glasses (64-80 oz) of water daily.

### What you should do next
Discuss your dietary preferences, prenatal vitamins, and any food intolerances with your obstetrician or a certified prenatal dietitian.`;
    }

    if (p.includes('emergency') || p.includes('bleeding') || p.includes('pain') || p.includes('chest')) {
      return `### What I noticed
Your message mentions symptoms such as acute pain, bleeding, or chest sensations.

### Why it may matter
Severe chest discomfort, shortness of breath, acute vaginal bleeding, sudden fainting, or severe abdominal cramping are high-priority symptoms requiring immediate hands-on clinical evaluation.

### What you should do next
- Please stop chatting and seek immediate medical evaluation.
- Call emergency services (911 / 112 / 108) or proceed directly to your nearest hospital maternity emergency department.
- Notify your emergency contact.`;
    }

    return `### Pregnancy Health Information & Guidance
Based on authoritative clinical guidelines (ACOG, WHO, CDC):

1. **Monitoring & Observation:** Regular tracking of blood pressure (target < 120/80 mmHg), resting pulse (60-100 bpm), and routine prenatal screening milestones is foundational for maternal and fetal wellbeing.
2. **Collaborative Care:** Always note any new or unusual symptoms (such as persistent dizziness, swelling, severe headaches, or fluid changes) to discuss during your regular prenatal consultations.
3. **Emergency Red Flags:** Seek immediate in-person medical evaluation if experiencing sudden severe pain, heavy bleeding, breathing distress, sudden vision changes, or decreased fetal movement.

*Please discuss your specific health questions and symptoms with your obstetrician or healthcare team.*`;
  }
}

module.exports = GeminiService;
