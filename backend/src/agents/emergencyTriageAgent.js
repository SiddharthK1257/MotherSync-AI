class EmergencyTriageAgent {
  static async process({ userMessage, userProfile = {}, detectedFlags = [], healthContext = {} }) {
    const flagNames = detectedFlags.map(f => f.term).join(', ') || 'Acute symptoms reported';
    const week = userProfile.gestationalWeek || 24;
    const patientName = userProfile.name || 'Patient';
    const emergencyContact = (userProfile.emergencyContacts && userProfile.emergencyContacts[0]) || {
      name: 'Primary Emergency Contact',
      phone: '+1 (555) 911-0000',
      relationship: 'Partner/Family'
    };
    const hospital = userProfile.preferredHospital || {
      name: 'Nearest Maternal Emergency Facility',
      phone: '+1 (555) 911-MATERNITY',
      address: 'Proceed to nearest emergency room'
    };

    // Emergency Summary for First Responders & Doctors
    const emergencySummary = `EMERGENCY CLINICAL SUMMARY:
Patient: ${patientName} | Gestational Week: ${week} (Trimester ${week <= 13 ? 1 : week <= 27 ? 2 : 3})
Triggered Symptoms: ${flagNames}
User Message: "${userMessage}"
Baseline BP: ${userProfile.baselineVitals?.bpSystolic || 120}/${userProfile.baselineVitals?.bpDiastolic || 80} mmHg
Known Allergies: ${(userProfile.maternalInfo?.allergies || ['None reported']).join(', ')}
Current Medications: ${(userProfile.maternalInfo?.currentMedications || ['Prenatal vitamins']).join(', ')}
Primary OB/GYN: ${userProfile.doctorInfo?.assignedDoctorName || 'Dr. Sarah Jenkins, MD'}
Hospital Destination: ${hospital.name}`;

    // Message for Trusted Contact
    const trustedContactMessage = `URGENT ALERT: MotherSync AI has logged an emergency status for ${patientName} (Week ${week} Pregnant) due to reported symptoms: "${flagNames}". Recommended seeking immediate emergency medical evaluation at ${hospital.name} (${hospital.phone}).`;

    const urgentInstructions = [
      'STOP normal conversation and seek immediate in-person emergency care.',
      'Call local emergency services immediately (911 / 112 / 108) or proceed to the nearest Maternity Emergency Ward.',
      `Target Hospital: ${hospital.name} - ${hospital.address} (Phone: ${hospital.phone})`,
      'Do NOT attempt to drive yourself if experiencing severe pain, dizziness, or heavy bleeding.',
      `Notify your emergency contact (${emergencyContact.name}: ${emergencyContact.phone}).`
    ];

    const content = `🚨 **URGENT MEDICAL ATTENTION REQUIRED**

### What was detected
Your reported information includes serious pregnancy warning signs: **${flagNames}**.

### Critical Action Required:
1. **Seek immediate emergency care:** Call emergency services (911 / 112 / 108) or go to the nearest emergency hospital immediately.
2. **Designated Facility:** ${hospital.name} (${hospital.phone})
3. **Emergency Contact:** ${emergencyContact.name} (${emergencyContact.phone}) - [Click "Notify Contact" to send pre-formatted SMS/WhatsApp alert].

---
*MotherSync AI has generated an Emergency Medical Summary below for you to present directly to emergency room physicians and paramedics.*`;

    return {
      agentName: 'Emergency Triage Agent',
      content,
      riskLevel: 'urgent',
      details: {
        detectedFlags: flagNames,
        urgentInstructions,
        emergencySummary,
        trustedContactMessage,
        hospital,
        emergencyContact
      }
    };
  }
}

module.exports = EmergencyTriageAgent;
