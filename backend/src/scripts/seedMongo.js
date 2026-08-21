require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const User = require('../models/User');
const PregnancyProfile = require('../models/PregnancyProfile');
const HealthRecord = require('../models/HealthRecord');
const Symptom = require('../models/Symptom');
const FetalKickRecord = require('../models/FetalKickRecord');
const MedicalReport = require('../models/MedicalReport');
const Appointment = require('../models/Appointment');
const Alert = require('../models/Alert');
const TimelineEvent = require('../models/TimelineEvent');
const AuditLog = require('../models/AuditLog');
const EmergencyLog = require('../models/EmergencyLog');
const ChatHistory = require('../models/ChatHistory');

async function seedMongoDB() {
  let uri = process.env.MONGODB_URI || 'mongodb+srv://siddharthtiwary15_db_user:<db_password>@cluster0.o15xdof.mongodb.net/mothersync?appName=Cluster0';
  const cliArg = process.argv[2];
  if (cliArg) {
    if (cliArg.startsWith('mongodb+srv://') || cliArg.startsWith('mongodb://')) {
      uri = cliArg;
    } else {
      uri = uri.replace('<db_password>', encodeURIComponent(cliArg)).replace('<password>', encodeURIComponent(cliArg));
    }
  }

  if (uri.includes('<db_password>') || uri.includes('<password>')) {
    console.log('\n?? [MongoDB Atlas Password Required]');
    console.log('Please provide your database password to connect and push data:');
    console.log('  node src/scripts/seedMongo.js <YOUR_PASSWORD>');
    console.log('Or set MONGODB_URI in backend/.env\n');
    process.exit(1);
  }

  console.log('?? Connecting to MongoDB Atlas Cluster: ' + uri.replace(/:[^:@]+@/, ':***@'));
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log('? Connected successfully to: ' + conn.connection.host + ' (Database: ' + conn.connection.name + ')');

    console.log('?? Clearing existing collections for fresh setup...');
    await Promise.all([
      User.deleteMany({}), PregnancyProfile.deleteMany({}), HealthRecord.deleteMany({}),
      Symptom.deleteMany({}), FetalKickRecord.deleteMany({}), MedicalReport.deleteMany({}),
      Appointment.deleteMany({}), Alert.deleteMany({}), TimelineEvent.deleteMany({}),
      EmergencyLog.deleteMany({}), ChatHistory.deleteMany({}), AuditLog.deleteMany({})
    ]);

    console.log('?? Pushing all maternal healthcare collections & clinical datasets to MongoDB Atlas...');
    const elena = await User.create({
      name: 'Elena Vance', email: 'elena@mothersync.ai', password: 'Password123!', role: 'patient',
      phone: '+1 (555) 342-8921', gestationalWeek: 24,
      pregnancyStartDate: new Date(Date.now() - 24 * 7 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 16 * 7 * 24 * 60 * 60 * 1000), currentTrimester: 2,
      pregnancyHistory: { gravida: 1, para: 0, previousComplications: [] },
      maternalInfo: {
        age: 29, heightCm: 168, weightKg: 68.5, bloodGroup: 'O+',
        medicalHistory: ['Mild seasonal allergies'], allergies: ['Penicillin'],
        currentMedications: ['Prenatal Multivitamin with DHA', 'Iron Supplement (Ferrous Sulfate 65mg)'],
        supplements: ['Vitamin D3 1000 IU', 'Omega-3 DHA 200mg', 'Calcium Citrate 500mg'],
        existingConditions: ['None diagnosed'],
        lifestyle: { activityLevel: 'Light to Moderate (Daily walking & Prenatal Yoga)', dietPreference: 'Mediterranean / Pescatarian' }
      },
      baselineVitals: { bpSystolic: 118, bpDiastolic: 76, heartRate: 78, bloodGlucose: 92, weight: 64.0 },
      emergencyContacts: [
        { name: 'Marcus Vance', relationship: 'Spouse / Partner', phone: '+1 (555) 789-0123', email: 'marcus.vance@example.com', notifyOnRedAlert: true },
        { name: 'Clara Vance', relationship: 'Mother', phone: '+1 (555) 456-7890', email: 'clara.vance@example.com', notifyOnRedAlert: true }
      ],
      preferredHospital: { name: 'St. Jude Women & Children Memorial Hospital', phone: '+1 (555) 911-MATERNITY', address: '450 Healthcare Blvd, Suite 100', lat: 37.7749, lng: -122.4194 },
      doctorInfo: { assignedDoctorName: 'Dr. Sarah Jenkins, MD (FACOG)', hospitalAffiliation: 'St. Jude Maternal-Fetal Medicine Center', contactEmail: 'dr.jenkins@stjudematernal.org' },
      onboardingCompleted: true
    });

    const profile = await PregnancyProfile.create({
      userId: elena._id, pregnancyStartDate: new Date(Date.now() - 24 * 7 * 24 * 60 * 60 * 1000),
      estimatedDueDate: new Date(Date.now() + 16 * 7 * 24 * 60 * 60 * 1000), gestationalWeek: 24, trimester: 2,
      age: 29, height: 168, prePregnancyWeight: 64.0, currentWeight: 68.5, bloodGroup: 'O+',
      knownConditions: [], allergies: ['Penicillin'], previousPregnancies: 0, previousComplications: [],
      currentMedications: ['Prenatal Multivitamin with DHA', 'Oral Iron 65mg'],
      careProvider: { name: 'Dr. Sarah Jenkins, MD (FACOG)', clinic: 'St. Jude Maternal-Fetal Medicine Center', email: 'dr.jenkins@stjudematernal.org', phone: '+1 (555) 902-1200' }
    });
    elena.pregnancyProfileId = profile._id; await elena.save();

    await User.create({
      name: 'Dr. Sarah Jenkins, MD (FACOG)', email: 'doctor@mothersync.ai', password: 'DoctorPass123!', role: 'doctor',
      phone: '+1 (555) 902-1200',
      doctorInfo: { assignedDoctorName: 'Dr. Sarah Jenkins, MD (FACOG)', hospitalAffiliation: 'St. Jude Maternal-Fetal Medicine Center', contactEmail: 'dr.jenkins@stjudematernal.org' },
      onboardingCompleted: true
    });

    const healthRecords = await HealthRecord.insertMany([
      { userId: elena._id, week: 16, date: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000), bpSystolic: 116, bpDiastolic: 74, heartRate: 74, bloodGlucose: 88, weight: 64.8, temperature: 36.6, oxygenSaturation: 99, symptoms: [{ name: 'Mild morning nausea', severity: 'mild' }], mood: 'Good', riskLevel: 'routine' },
      { userId: elena._id, week: 18, date: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000), bpSystolic: 118, bpDiastolic: 76, heartRate: 78, bloodGlucose: 90, weight: 65.5, temperature: 36.7, oxygenSaturation: 98, fetalKicks: 4, symptoms: [{ name: 'Lower back stiffness', severity: 'mild' }], mood: 'Energized', riskLevel: 'routine' },
      { userId: elena._id, week: 20, date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000), bpSystolic: 120, bpDiastolic: 78, heartRate: 80, bloodGlucose: 94, weight: 66.4, temperature: 36.8, oxygenSaturation: 98, fetalKicks: 8, symptoms: [{ name: 'Leg cramps during sleep', severity: 'mild' }], mood: 'Happy', riskLevel: 'routine' },
      { userId: elena._id, week: 22, date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), bpSystolic: 122, bpDiastolic: 80, heartRate: 82, bloodGlucose: 96, weight: 67.3, temperature: 36.8, oxygenSaturation: 99, fetalKicks: 12, symptoms: [{ name: 'Mild ankle edema', severity: 'mild' }], mood: 'Good', riskLevel: 'routine' },
      { userId: elena._id, week: 24, date: new Date(), bpSystolic: 124, bpDiastolic: 82, heartRate: 84, bloodGlucose: 98, weight: 68.5, temperature: 36.8, oxygenSaturation: 98, fetalKicks: 14, symptoms: [{ name: 'Occasional mild heartburn', severity: 'mild' }], mood: 'Relaxed & Well', riskLevel: 'routine' }
    ]);

    const symptoms = await Symptom.insertMany([
      { userId: elena._id, recordedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), symptom: 'Mild ankle edema', severity: 'mild', duration: 'Evening hours', status: 'monitored' },
      { userId: elena._id, recordedAt: new Date(), symptom: 'Occasional mild heartburn', severity: 'mild', duration: '30 mins post-meal', status: 'active' }
    ]);

    const kicks = await FetalKickRecord.insertMany([
      { userId: elena._id, recordedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), duration: 120, kickCount: 12, notes: 'Active movement session post-dinner.' },
      { userId: elena._id, recordedAt: new Date(), duration: 120, kickCount: 14, notes: 'Distinct rolls and kicks on left side.' }
    ]);

    const reports = await MedicalReport.insertMany([
      {
        userId: elena._id, title: '20-Week Detailed Anatomy Ultrasound Scan', type: 'ultrasound', fileName: 'Anatomy_Scan_Week20_ElenaVance.pdf',
        extractedText: 'CLINICAL ULTRASOUND: Gestational Age: 20w2d. Single live intrauterine fetus. FHR: 146 bpm regular. Anatomical survey: Intracranial anatomy normal, 4-chamber cardiac view normal, bladder visualized, spine intact, 4 extremities normal. Placenta: Anterior, grade 1, no previa. Amniotic fluid index: 14.2 cm. Estimated Fetal Weight: 340g. IMPRESSION: Normal anatomical survey.',
        structuredFindings: [
          { parameter: 'Fetal Heart Rate', value: '146', unit: 'bpm', referenceRange: '110 - 160 bpm', status: 'normal' },
          { parameter: 'Amniotic Fluid Index (AFI)', value: '14.2', unit: 'cm', referenceRange: '8.0 - 18.0 cm', status: 'normal' },
          { parameter: 'Estimated Fetal Weight', value: '340', unit: 'g', referenceRange: '50th percentile (300-380g)', status: 'normal' },
          { parameter: 'Placental Location', value: 'Anterior', unit: '', referenceRange: 'Clear of internal os', status: 'normal' }
        ],
        aiSummary: 'Normal 20-week anatomy survey with standard biometric growth and heart rate.',
        laymanExplanation: 'Your baby major organs, heart rhythm (146 bpm), fluid levels, and growth measurements are healthy and normal.',
        clinicianDiscussionPoints: ['Anterior placenta noted.', 'Next: 24-28 week glucose tolerance screening.'],
        questionsForDoctor: ['When should I schedule my 26-28 week glucose screening?'],
        riskFlag: 'low', doctorReviewed: true, doctorNotes: 'Excellent growth. Routine follow-up.'
      },
      {
        userId: elena._id, title: 'Second Trimester CBC & Ferritin Panel', type: 'blood_test', fileName: 'Maternal_CBC_Ferritin_Week22.pdf',
        extractedText: 'CBC REPORT: Hemoglobin: 11.2 g/dL. Hematocrit: 33.5%. Platelets: 245k /uL. Serum Ferritin: 24 ng/mL. Fasting Glucose: 92 mg/dL. Blood Type: O+.',
        structuredFindings: [
          { parameter: 'Hemoglobin', value: '11.2', unit: 'g/dL', referenceRange: '11.0 - 14.5 g/dL', status: 'normal' },
          { parameter: 'Hematocrit', value: '33.5', unit: '%', referenceRange: '33.0 - 42.0%', status: 'normal' },
          { parameter: 'Serum Ferritin', value: '24', unit: 'ng/mL', referenceRange: '15 - 150 ng/mL', status: 'borderline' },
          { parameter: 'Fasting Glucose', value: '92', unit: 'mg/dL', referenceRange: '< 95 mg/dL', status: 'normal' }
        ],
        aiSummary: 'Hemoglobin and blood counts are within normal range; ferritin is on the lower-normal boundary.',
        laymanExplanation: 'Your blood counts are normal. Iron storage is slightly low, which is common in mid-pregnancy.',
        clinicianDiscussionPoints: ['Adequate iron reserves. Continue daily oral iron.'],
        questionsForDoctor: ['Should I adjust oral iron timing with vitamin C?'],
        riskFlag: 'low', doctorReviewed: true, doctorNotes: 'Maintain daily prenatal iron.'
      }
    ]);

    const appointments = await Appointment.insertMany([
      { userId: elena._id, title: '26-Week Prenatal Checkup & Glucose Screening (OGTT)', type: 'glucose_tolerance', date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), time: '09:00 AM', doctorName: 'Dr. Sarah Jenkins, MD', clinicLocation: 'St. Jude Women’s Health, Suite 402', status: 'upcoming', notes: 'Fasting 8-10 hours prior as instructed by clinic.' },
      { userId: elena._id, title: '28-Week Third Trimester Transition & Tdap Vaccination', type: 'routine_prenatal', date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), time: '02:30 PM', doctorName: 'Dr. Sarah Jenkins, MD', clinicLocation: 'St. Jude Women’s Health, Suite 402', status: 'upcoming', notes: 'Routine Doppler fetal heart rate & Tdap vaccine discussion.' }
    ]);

    const alerts = await Alert.insertMany([
      { userId: elena._id, createdAt: new Date(), severity: 'routine', category: 'routine_check', message: 'Week 24 maternal vitals and kick sessions within normal parameters.', recommendedAction: 'Continue weekly home BP checks.', status: 'active', source: 'safety_engine' }
    ]);

    const timeline = await TimelineEvent.insertMany([
      { userId: elena._id, week: 16, date: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000), category: 'vital_check', title: 'Week 16 Routine Vitals Logged', description: 'BP: 116/74 mmHg, Heart Rate: 74 bpm. Normotensive.', badgeType: 'routine' },
      { userId: elena._id, week: 20, date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000), category: 'lab_report', title: '20-Week Anatomy Ultrasound Scan Uploaded', description: 'FHR 146 bpm, AFI 14.2 cm. Anatomical survey normal.', badgeType: 'milestone' },
      { userId: elena._id, week: 22, date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), category: 'lab_report', title: 'CBC & Ferritin Blood Panel Analyzed', description: 'Hemoglobin 11.2 g/dL (normal), Ferritin 24 ng/mL (lower-normal).', badgeType: 'info' },
      { userId: elena._id, week: 24, date: new Date(), category: 'vital_check', title: 'Week 24 Maternal Vitals Check', description: 'BP: 124/82 mmHg, HR: 84 bpm, Fetal Kicks: 14/2hrs. Routine ??.', badgeType: 'routine' }
    ]);

    console.log('\n?? MongoDB Atlas Seeding Complete!');
    console.log('   Users: 2 (Elena Vance + Dr. Jenkins)');
    console.log('   Pregnancy Profiles: 1');
    console.log('   Health Records: ' + healthRecords.length);
    console.log('   Symptoms: ' + symptoms.length);
    console.log('   Fetal Kicks: ' + kicks.length);
    console.log('   Medical Reports: ' + reports.length);
    console.log('   Appointments: ' + appointments.length);
    console.log('   Alerts: ' + alerts.length);
    console.log('   Timeline Events: ' + timeline.length);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('? MongoDB Atlas Seeding Error:', error.message);
    process.exit(1);
  }
}

seedMongoDB();
