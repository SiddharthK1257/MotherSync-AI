// In-Memory Seed & State Store for zero-config offline resilience
const mockStore = {
  users: [
    {
      _id: 'usr_elena_vance_01',
      name: 'Elena Vance',
      email: 'elena@mothersync.ai',
      password: '$2a$10$YourHashedPasswordHerePlaceholder',
      role: 'patient',
      phone: '+1 (555) 342-8921',
      gestationalWeek: 24,
      dueDate: new Date(Date.now() + 112 * 24 * 60 * 60 * 1000).toISOString(),
      currentTrimester: 2,
      pregnancyHistory: {
        gravida: 1,
        para: 0,
        previousComplications: []
      },
      maternalInfo: {
        age: 29,
        heightCm: 168,
        weightKg: 68.5,
        medicalHistory: ['Mild seasonal allergies'],
        allergies: ['Penicillin'],
        currentMedications: ['Prenatal Multivitamin with DHA', 'Iron Supplement (Ferrous Sulfate 65mg)'],
        supplements: ['Vitamin D3 1000 IU', 'Omega-3 DHA 200mg', 'Calcium Citrate 500mg'],
        existingConditions: ['None diagnosed'],
        lifestyle: {
          activityLevel: 'Light to Moderate (Daily walking & Prenatal Yoga)',
          dietPreference: 'Mediterranean / Pescatarian'
        }
      },
      baselineVitals: {
        bpSystolic: 118,
        bpDiastolic: 76,
        heartRate: 78,
        bloodGlucose: 92,
        weight: 64.0
      },
      emergencyContacts: [
        {
          name: 'Marcus Vance',
          relationship: 'Spouse / Partner',
          phone: '+1 (555) 789-0123',
          email: 'marcus.vance@example.com',
          notifyOnRedAlert: true
        },
        {
          name: 'Clara Vance',
          relationship: 'Mother',
          phone: '+1 (555) 456-7890',
          email: 'clara.vance@example.com',
          notifyOnRedAlert: true
        }
      ],
      preferredHospital: {
        name: 'St. Jude Women & Children Memorial Hospital',
        phone: '+1 (555) 911-MATERNITY',
        address: '450 Healthcare Blvd, Suite 100',
        lat: 37.7749,
        lng: -122.4194
      },
      doctorInfo: {
        assignedDoctorName: 'Dr. Sarah Jenkins, MD (FACOG)',
        hospitalAffiliation: 'St. Jude Maternal-Fetal Medicine Center',
        contactEmail: 'dr.jenkins@stjudematernal.org'
      },
      onboardingCompleted: true,
      createdAt: new Date('2026-03-01T08:00:00Z')
    },
    {
      _id: 'usr_dr_jenkins_02',
      name: 'Dr. Sarah Jenkins, MD (FACOG)',
      email: 'doctor@mothersync.ai',
      password: '$2a$10$YourHashedPasswordHerePlaceholder',
      role: 'doctor',
      phone: '+1 (555) 902-1200',
      doctorInfo: {
        assignedDoctorName: 'Dr. Sarah Jenkins, MD (FACOG)',
        hospitalAffiliation: 'St. Jude Maternal-Fetal Medicine Center',
        contactEmail: 'dr.jenkins@stjudematernal.org'
      },
      onboardingCompleted: true,
      createdAt: new Date('2026-01-10T08:00:00Z')
    }
  ],

  healthRecords: [
    {
      _id: 'hr_wk16_01',
      userId: 'usr_elena_vance_01',
      week: 16,
      date: new Date('2026-06-25T09:00:00Z'),
      bpSystolic: 116,
      bpDiastolic: 74,
      heartRate: 74,
      bloodGlucose: 88,
      glucoseType: 'fasting',
      weight: 64.8,
      fetalKicks: null,
      symptoms: [{ name: 'Mild morning nausea', severity: 'mild', notes: 'Subsided by lunchtime' }],
      mood: 'Good',
      waterIntakeOz: 72,
      riskLevel: 'routine',
      riskRationale: 'Vital signs within normal physiological ranges for second trimester.',
      aiFlaggedConcerns: []
    },
    {
      _id: 'hr_wk18_02',
      userId: 'usr_elena_vance_01',
      week: 18,
      date: new Date('2026-07-09T09:00:00Z'),
      bpSystolic: 118,
      bpDiastolic: 76,
      heartRate: 78,
      bloodGlucose: 90,
      glucoseType: 'fasting',
      weight: 65.5,
      fetalKicks: 4,
      symptoms: [{ name: 'Lower back stiffness', severity: 'mild', notes: 'After prolonged sitting' }],
      mood: 'Energized',
      waterIntakeOz: 80,
      riskLevel: 'routine',
      riskRationale: 'Vitals stable; normal anatomical milestone stage.',
      aiFlaggedConcerns: []
    },
    {
      _id: 'hr_wk20_03',
      userId: 'usr_elena_vance_01',
      week: 20,
      date: new Date('2026-07-23T10:00:00Z'),
      bpSystolic: 120,
      bpDiastolic: 78,
      heartRate: 80,
      bloodGlucose: 94,
      glucoseType: 'fasting',
      weight: 66.4,
      fetalKicks: 8,
      symptoms: [{ name: 'Leg cramps during sleep', severity: 'mild', notes: 'Calf muscle tension' }],
      mood: 'Happy',
      waterIntakeOz: 88,
      riskLevel: 'routine',
      riskRationale: 'Stable hemodynamic profile; normal mid-pregnancy progression.',
      aiFlaggedConcerns: []
    },
    {
      _id: 'hr_wk22_04',
      userId: 'usr_elena_vance_01',
      week: 22,
      date: new Date('2026-08-06T09:30:00Z'),
      bpSystolic: 122,
      bpDiastolic: 80,
      heartRate: 82,
      bloodGlucose: 96,
      glucoseType: 'fasting',
      weight: 67.3,
      fetalKicks: 12,
      symptoms: [{ name: 'Mild ankle edema', severity: 'mild', notes: 'Noticeable towards evening' }],
      mood: 'Good',
      waterIntakeOz: 92,
      riskLevel: 'routine',
      riskRationale: 'Mild physiologic edema; blood pressure remains normotensive.',
      aiFlaggedConcerns: []
    },
    {
      _id: 'hr_wk24_05',
      userId: 'usr_elena_vance_01',
      week: 24,
      date: new Date('2026-08-20T08:00:00Z'),
      bpSystolic: 124,
      bpDiastolic: 82,
      heartRate: 84,
      bloodGlucose: 98,
      glucoseType: 'fasting',
      weight: 68.5,
      fetalKicks: 14,
      symptoms: [{ name: 'Occasional mild heartburn', severity: 'mild', notes: 'After evening dinner' }],
      mood: 'Relaxed & Well',
      waterIntakeOz: 96,
      riskLevel: 'routine',
      riskRationale: 'Vitals within expected physiological ranges for Week 24. No hypertensive or critical indicators detected.',
      aiFlaggedConcerns: []
    }
  ],

  medicalReports: [
    {
      _id: 'rep_us_anatomy_20wk',
      userId: 'usr_elena_vance_01',
      title: '20-Week Detailed Anatomy Ultrasound Scan',
      type: 'ultrasound',
      fileName: 'Anatomy_Scan_Week20_ElenaVance.pdf',
      extractedText: 'CLINICAL ULTRASOUND REPORT: Gestational Age: 20 weeks 2 days. Single live intrauterine fetus. Cephalic presentation. Fetal Heart Rate: 146 bpm regular. Anatomical survey: Intracranial anatomy normal, 4-chamber cardiac view normal, stomach and urinary bladder visualized, spine intact, 4 extremities visualized with no gross structural deformities. Placenta: Anterior, grade 1, no previa. Amniotic fluid index: 14.2 cm (Normal). Estimated Fetal Weight: 340g (52nd percentile). IMPRESSION: Normal anatomical survey consistent with gestational dates.',
      structuredFindings: [
        { parameter: 'Fetal Heart Rate', value: '146', unit: 'bpm', referenceRange: '110 - 160 bpm', status: 'normal' },
        { parameter: 'Amniotic Fluid Index (AFI)', value: '14.2', unit: 'cm', referenceRange: '8.0 - 18.0 cm', status: 'normal' },
        { parameter: 'Estimated Fetal Weight', value: '340', unit: 'g', referenceRange: '50th percentile (300-380g)', status: 'normal' },
        { parameter: 'Placental Location', value: 'Anterior (Clear of Os)', unit: '', referenceRange: 'No previa', status: 'normal' }
      ],
      aiSummary: 'The 20-week anatomy ultrasound shows standard fetal biometric measurements and anatomical milestones within expected clinical ranges.',
      laymanExplanation: 'Your baby’s major organs, heart rhythm (146 bpm), fluid levels, and growth measurements were visualized clearly and match your expected 20-week timeline.',
      clinicianDiscussionPoints: [
        'Anterior placenta location is noted - this is standard and healthy, but may soften the initial perception of early fetal kicks.',
        'Next routine screening: Glucose Tolerance Test (OGTT) at 24-28 weeks.'
      ],
      questionsForDoctor: [
        'Is the anterior placenta position expected to affect kick-counting sensitivity later in the third trimester?',
        'When should I schedule the 26-28 week glucose tolerance screening?'
      ],
      riskFlag: 'low',
      doctorReviewed: true,
      doctorNotes: 'Reviewed with patient. Excellent biometric growth. Proceed with standard second-trimester schedule.',
      dateUploaded: new Date('2026-07-24T14:30:00Z')
    },
    {
      _id: 'rep_cbc_iron_22wk',
      userId: 'usr_elena_vance_01',
      title: 'Second Trimester CBC & Ferritin Panel',
      type: 'blood_test',
      fileName: 'Maternal_CBC_Ferritin_Week22.pdf',
      extractedText: 'LABORATORY REPORT - COMPLETE BLOOD COUNT: Hemoglobin: 11.2 g/dL (Ref: 11.0 - 14.5 g/dL). Hematocrit: 33.5% (Ref: 33 - 42%). Platelet Count: 245,000 /uL (Ref: 150k - 450k). Serum Ferritin: 24 ng/mL (Ref: 15 - 150 ng/mL). Blood Glucose (Fasting): 92 mg/dL (Ref: < 95 mg/dL). Blood Type: O Positive. Antibody Screen: Negative.',
      structuredFindings: [
        { parameter: 'Hemoglobin', value: '11.2', unit: 'g/dL', referenceRange: '11.0 - 14.5 g/dL', status: 'normal' },
        { parameter: 'Hematocrit', value: '33.5', unit: '%', referenceRange: '33.0 - 42.0%', status: 'normal' },
        { parameter: 'Serum Ferritin', value: '24', unit: 'ng/mL', referenceRange: '15 - 150 ng/mL (Optimal >30)', status: 'borderline' },
        { parameter: 'Platelets', value: '245,000', unit: '/uL', referenceRange: '150,000 - 450,000 /uL', status: 'normal' },
        { parameter: 'Fasting Glucose', value: '92', unit: 'mg/dL', referenceRange: '< 95 mg/dL', status: 'normal' }
      ],
      aiSummary: 'Hemoglobin and blood counts are within normal second-trimester reference values. Ferritin is on the lower-normal boundary, which is frequent as maternal blood volume expands.',
      laymanExplanation: 'Your blood counts look generally healthy. Your iron storage (ferritin) is slightly on the lower side of normal, which is very common during mid-pregnancy as your baby absorbs iron.',
      clinicianDiscussionPoints: [
        'Ferritin at 24 ng/mL indicates adequate but borderline iron reserves.',
        'Discuss continuing daily prenatal iron and iron-rich dietary pairings (vitamin C foods).'
      ],
      questionsForDoctor: [
        'Should I continue my current 65mg iron supplement or adjust timing with vitamin C?',
        'Do I need a repeat ferritin check during the third trimester?'
      ],
      riskFlag: 'low',
      doctorReviewed: true,
      doctorNotes: 'Maintain daily prenatal vitamin and oral iron. Good tolerance noted.',
      dateUploaded: new Date('2026-08-08T11:15:00Z')
    }
  ],

  appointments: [
    {
      _id: 'apt_wk26_ogtt',
      userId: 'usr_elena_vance_01',
      title: '26-Week Prenatal Checkup & Glucose Screening (OGTT)',
      type: 'glucose_tolerance',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      time: '09:00 AM',
      doctorName: 'Dr. Sarah Jenkins, MD',
      clinicLocation: 'St. Jude Women’s Health, Suite 402',
      status: 'upcoming',
      notes: 'Remember fasting protocol (8-10 hours prior as instructed by clinic). Arrive 15 mins early for registration.',
      suggestedQuestions: [
        'How long will the 1-hour glucose screen take?',
        'Can I drink plain water during the fasting window?',
        'Should I review my blood pressure readings from the last 4 weeks?'
      ],
      remindersSent: false,
      createdAt: new Date('2026-08-10T10:00:00Z')
    },
    {
      _id: 'apt_wk28_rh_tdap',
      userId: 'usr_elena_vance_01',
      title: '28-Week Third Trimester Transition & Tdap Vaccination',
      type: 'routine_prenatal',
      date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      time: '02:30 PM',
      doctorName: 'Dr. Sarah Jenkins, MD',
      clinicLocation: 'St. Jude Women’s Health, Suite 402',
      status: 'upcoming',
      notes: 'Routine fundal height measurement, Doppler fetal heart rate, and Tdap vaccine discussion for neonatal pertussis protection.',
      suggestedQuestions: [
        'What should I expect for kick counting frequency starting at Week 28?',
        'What are the common side effects of the Tdap vaccine during pregnancy?'
      ],
      remindersSent: false,
      createdAt: new Date('2026-08-15T10:00:00Z')
    }
  ],

  timelineEvents: [
    {
      _id: 'tle_01',
      userId: 'usr_elena_vance_01',
      week: 16,
      date: new Date('2026-06-25T09:00:00Z'),
      category: 'vital_check',
      title: 'Week 16 Routine Vitals Logged',
      description: 'BP: 116/74 mmHg, Heart Rate: 74 bpm, Weight: 64.8 kg. Normotensive profile.',
      badgeType: 'routine'
    },
    {
      _id: 'tle_02',
      userId: 'usr_elena_vance_01',
      week: 20,
      date: new Date('2026-07-24T14:30:00Z'),
      category: 'lab_report',
      title: '20-Week Anatomy Ultrasound Scan Uploaded',
      description: 'Fetal Heart Rate 146 bpm, Amniotic Fluid Index 14.2 cm. Anatomical survey within normal range.',
      badgeType: 'milestone'
    },
    {
      _id: 'tle_03',
      userId: 'usr_elena_vance_01',
      week: 22,
      date: new Date('2026-08-08T11:15:00Z'),
      category: 'lab_report',
      title: 'CBC & Ferritin Blood Panel Analyzed',
      description: 'Hemoglobin 11.2 g/dL (normal), Ferritin 24 ng/mL (lower-normal boundary). Prenatal iron regimen continued.',
      badgeType: 'info'
    },
    {
      _id: 'tle_04',
      userId: 'usr_elena_vance_01',
      week: 24,
      date: new Date('2026-08-20T08:00:00Z'),
      category: 'vital_check',
      title: 'Week 24 Maternal Vitals Check',
      description: 'BP: 124/82 mmHg, HR: 84 bpm, Fetal Kicks: 14/2hrs. Overall monitoring status: Routine 🟢.',
      badgeType: 'routine'
    }
  ],

  emergencyLogs: []
};

module.exports = mockStore;
