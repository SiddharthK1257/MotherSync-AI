const axios = require('axios');
const http = require('http');

// Start backend app in memory for test
process.env.NODE_ENV = 'test';
process.env.PORT = '5055';
process.env.JWT_SECRET = 'test_jwt_secret_token_1234567890';

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./src/config/db');

// Require all route handlers
const authRoutes = require('./src/routes/authRoutes');
const pregnancyRoutes = require('./src/routes/pregnancyRoutes');
const vitalsRoutes = require('./src/routes/vitalsRoutes');
const healthRecordRoutes = require('./src/routes/healthRecordRoutes');
const symptomsRoutes = require('./src/routes/symptomsRoutes');
const kicksRoutes = require('./src/routes/kicksRoutes');
const labsRoutes = require('./src/routes/labsRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const appointmentRoutes = require('./src/routes/appointmentRoutes');
const alertsRoutes = require('./src/routes/alertsRoutes');
const medicationRoutes = require('./src/routes/medicationRoutes');
const reminderRoutes = require('./src/routes/reminderRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const aiRoutes = require('./src/routes/aiRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const agentRoutes = require('./src/routes/agentRoutes');
const hospitalRoutes = require('./src/routes/hospitalRoutes');
const emergencyRoutes = require('./src/routes/emergencyRoutes');
const doctorRoutes = require('./src/routes/doctorRoutes');
const pdfRoutes = require('./src/routes/pdfRoutes');
const timelineRoutes = require('./src/routes/timelineRoutes');

const app = express();
connectDB();

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes);
app.use('/api/pregnancy', pregnancyRoutes);
app.use('/api/patient', pregnancyRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/health-records', healthRecordRoutes);
app.use('/api/symptoms', symptomsRoutes);
app.use('/api/kicks', kicksRoutes);
app.use('/api/labs', labsRoutes);
app.use('/api/ultrasounds', labsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/clinical-summary', pdfRoutes);
app.use('/api/timeline', timelineRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'MotherSync AI' });
});

async function runVerification() {
  const server = app.listen(5055, async () => {
    console.log('🚀 Test server started on port 5055. Beginning comprehensive verification suite...\n');

    const BASE = 'http://localhost:5055/api';
    let testsPassed = 0;
    let testsFailed = 0;

    async function test(name, fn) {
      try {
        await fn();
        console.log(`✅ PASS: ${name}`);
        testsPassed++;
      } catch (e) {
        console.error(`❌ FAIL: ${name} ->`, e.response?.data || e.message);
        testsFailed++;
      }
    }

    try {
      // 1. Health Check
      await test('Health check endpoint', async () => {
        const res = await axios.get(`${BASE}/health`);
        if (res.data.status !== 'ok') throw new Error('Health check status not ok');
      });

      // 2. Demo login as patient
      let patientToken = '';
      await test('Demo login (Patient: Elena Vance)', async () => {
        const res = await axios.post(`${BASE}/auth/demo-login`, { role: 'patient' });
        if (!res.data.token || res.data.user.role !== 'patient') throw new Error('Demo patient login failed');
        patientToken = res.data.token;
      });

      // 3. Demo login as doctor
      let doctorToken = '';
      await test('Demo login (Doctor: Dr. Sarah Jenkins)', async () => {
        const res = await axios.post(`${BASE}/auth/demo-login`, { role: 'doctor' });
        if (!res.data.token || res.data.user.role !== 'doctor') throw new Error('Demo doctor login failed');
        doctorToken = res.data.token;
      });

      // 4. Direct login with credentials
      await test('Direct login (elena@mothersync.ai / Password123!)', async () => {
        const res = await axios.post(`${BASE}/auth/login`, {
          email: 'elena@mothersync.ai',
          password: 'Password123!'
        });
        if (!res.data.token) throw new Error('Direct patient login failed');
      });

      // 5. Direct doctor login
      await test('Direct login (doctor@mothersync.ai / DoctorPass123!)', async () => {
        const res = await axios.post(`${BASE}/auth/login`, {
          email: 'doctor@mothersync.ai',
          password: 'DoctorPass123!'
        });
        if (!res.data.token) throw new Error('Direct doctor login failed');
      });

      // 6. Registration of new patient
      let newPatientToken = '';
      const testEmail = `testmother_${Date.now()}@example.com`;
      await test('Register new patient account', async () => {
        const res = await axios.post(`${BASE}/auth/register`, {
          name: 'Sarah Connor',
          email: testEmail,
          password: 'SecretPassword999!',
          role: 'patient',
          gestationalWeek: 20,
          phone: '+1 (555) 123-4567'
        });
        if (!res.data.token || res.data.user.email !== testEmail) throw new Error('Registration failed');
        newPatientToken = res.data.token;
      });

      // 7. Login with newly registered credentials
      await test('Login with newly created account', async () => {
        const res = await axios.post(`${BASE}/auth/login`, {
          email: testEmail,
          password: 'SecretPassword999!'
        });
        if (!res.data.token) throw new Error('New account login failed');
      });

      // 8. Auth profile endpoint
      const patientHeaders = { headers: { Authorization: `Bearer ${patientToken}` } };
      const doctorHeaders = { headers: { Authorization: `Bearer ${doctorToken}` } };

      await test('Get authenticated profile (/api/auth/profile)', async () => {
        const res = await axios.get(`${BASE}/auth/profile`, patientHeaders);
        if (!res.data.user || res.data.user.email !== 'elena@mothersync.ai') throw new Error('Profile fetch failed');
      });

      // 9. Update profile
      await test('Update user profile (/api/auth/profile)', async () => {
        const res = await axios.put(`${BASE}/auth/profile`, { phone: '+1 (555) 999-8888' }, patientHeaders);
        if (res.data.user.phone !== '+1 (555) 999-8888') throw new Error('Profile update failed');
      });

      // 10. Dashboard endpoint
      await test('Fetch dashboard (/api/dashboard)', async () => {
        const res = await axios.get(`${BASE}/dashboard`, patientHeaders);
        if (!res.data.success || !res.data.data.pregnancy) throw new Error('Dashboard data failed');
      });

      // 11. Vitals endpoints
      await test('Get vitals and log new vitals (/api/vitals)', async () => {
        const getRes = await axios.get(`${BASE}/vitals`, patientHeaders);
        if (!getRes.data.success) throw new Error('Get vitals failed');

        const postRes = await axios.post(`${BASE}/vitals`, {
          week: 25,
          bpSystolic: 120,
          bpDiastolic: 78,
          heartRate: 76,
          bloodGlucose: 92,
          weight: 68.9,
          symptoms: [{ name: 'Mild fatigue', severity: 'mild' }]
        }, patientHeaders);
        if (!postRes.data.success) throw new Error('Log vitals failed');

        const analyticsRes = await axios.get(`${BASE}/vitals/analytics`, patientHeaders);
        if (!analyticsRes.data.success) throw new Error('Vitals analytics failed');
      });

      // 12. Fetal Kicks endpoints
      await test('Get kicks and log new kick session (/api/kicks)', async () => {
        const getRes = await axios.get(`${BASE}/kicks`, patientHeaders);
        if (!getRes.data.success) throw new Error('Get kicks failed');

        const postRes = await axios.post(`${BASE}/kicks`, {
          kickCount: 15,
          duration: 120,
          notes: 'Active evening movement session'
        }, patientHeaders);
        if (!postRes.data.success) throw new Error('Log kicks failed');
      });

      // 13. Symptoms endpoints
      await test('Get symptoms and log new symptom (/api/symptoms)', async () => {
        const getRes = await axios.get(`${BASE}/symptoms`, patientHeaders);
        if (!getRes.data.success) throw new Error('Get symptoms failed');

        const postRes = await axios.post(`${BASE}/symptoms`, {
          symptom: 'Mild heartburn',
          severity: 'mild',
          description: 'Post meal reflux'
        }, patientHeaders);
        if (!postRes.data.success) throw new Error('Log symptom failed');
      });

      // 14. Diagnostic Labs / Reports endpoints
      await test('Get labs and reports (/api/labs and /api/reports)', async () => {
        const labsRes = await axios.get(`${BASE}/labs`, patientHeaders);
        if (!labsRes.data.success || !Array.isArray(labsRes.data.data)) throw new Error('Labs fetch failed');

        const repRes = await axios.get(`${BASE}/reports`, patientHeaders);
        if (!repRes.data.success || !Array.isArray(repRes.data.data)) throw new Error('Reports fetch failed');
      });

      // 15. Appointments endpoints
      await test('Appointments list, create, and prepare (/api/appointments)', async () => {
        const listRes = await axios.get(`${BASE}/appointments`, patientHeaders);
        if (!listRes.data.success) throw new Error('Get appointments failed');

        const createRes = await axios.post(`${BASE}/appointments`, {
          title: '30-Week Routine Checkup',
          type: 'routine_prenatal',
          date: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
          time: '11:00 AM',
          doctorName: 'Dr. Sarah Jenkins, MD'
        }, patientHeaders);
        if (!createRes.data.success) throw new Error('Create appointment failed');
      });

      // 16. Alerts endpoint
      await test('Get active alerts (/api/alerts)', async () => {
        const res = await axios.get(`${BASE}/alerts`, patientHeaders);
        if (!res.data.success || !Array.isArray(res.data.data)) throw new Error('Alerts fetch failed');
      });

      // 17. Agents list
      await test('Get 10 agents list (/api/agents/list)', async () => {
        const res = await axios.get(`${BASE}/agents/list`);
        if (!res.data.agents || res.data.agents.length !== 10) throw new Error('Agents list mismatch');
      });

      // 18. Agent Chat Route (Routing & Fallback)
      await test('Agent chat execution (/api/agents/chat)', async () => {
        const res = await axios.post(`${BASE}/agents/chat`, {
          message: 'What should I eat in my 24th week of pregnancy for good iron levels?'
        }, patientHeaders);
        if (!res.data.success || !res.data.data.response) throw new Error('Agent chat failed');
      });

      // 19. Emergency Voice Triage
      await test('Emergency voice triage (/api/agents/voice-triage)', async () => {
        const res = await axios.post(`${BASE}/agents/voice-triage`, {
          transcript: 'I am experiencing sudden blurry vision and a very severe headache.'
        }, patientHeaders);
        if (!res.data.success || !res.data.triage) throw new Error('Voice triage failed');
      });

      // 20. Hospital Finder
      await test('Nearby maternity hospital finder (/api/hospitals/nearby)', async () => {
        const res = await axios.get(`${BASE}/hospitals/nearby?lat=37.7749&lng=-122.4194`);
        if (!res.data.success || !Array.isArray(res.data.data) || res.data.data.length === 0) {
          throw new Error('Hospital discovery failed');
        }
      });

      // 21. Emergency SOS protocol
      await test('Emergency SOS protocol trigger (/api/emergency/sos)', async () => {
        const res = await axios.post(`${BASE}/emergency/sos`, {
          symptoms: ['One-Touch Emergency SOS Triggered'],
          location: { lat: 37.7749, lng: -122.4194 }
        }, patientHeaders);
        if (!res.data.success || !res.data.incident) throw new Error('Emergency SOS trigger failed');
      });

      // 22. Doctor Portal
      await test('Doctor patient dashboard (/api/doctor/patients)', async () => {
        const res = await axios.get(`${BASE}/doctor/patients`, doctorHeaders);
        if (!res.data.success || !Array.isArray(res.data.data)) throw new Error('Doctor portal fetch failed');
      });

      // 23. PDF Clinical Summary streaming
      await test('PDF Clinical Summary generation (/api/pdf/summary)', async () => {
        const res = await axios.get(`${BASE}/pdf/summary`, {
          headers: { Authorization: `Bearer ${patientToken}` },
          responseType: 'arraybuffer'
        });
        if (res.status !== 200 || !res.data || res.data.length < 100) throw new Error('PDF generation failed');
      });

      // 24. Timeline Events
      await test('Chronological timeline (/api/timeline)', async () => {
        const res = await axios.get(`${BASE}/timeline`, patientHeaders);
        if (!res.data.success || !Array.isArray(res.data.data)) throw new Error('Timeline fetch failed');
      });

      // 25. Medications & Reminders
      await test('Medications and Reminders (/api/medications, /api/reminders)', async () => {
        const medRes = await axios.get(`${BASE}/medications`, patientHeaders);
        if (!medRes.data.success) throw new Error('Medications fetch failed');

        const remRes = await axios.get(`${BASE}/reminders`, patientHeaders);
        if (!remRes.data.success) throw new Error('Reminders fetch failed');
      });

    } finally {
      server.close(() => {
        console.log(`\n======================================================`);
        console.log(`VERIFICATION SUMMARY: ${testsPassed} Passed | ${testsFailed} Failed`);
        console.log(`======================================================`);
        process.exit(testsFailed > 0 ? 1 : 0);
      });
    }
  });
}

runVerification();
