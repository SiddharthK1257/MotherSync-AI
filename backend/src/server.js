const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./config/db');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const pregnancyRoutes = require('./routes/pregnancyRoutes');
const vitalsRoutes = require('./routes/vitalsRoutes');
const healthRecordRoutes = require('./routes/healthRecordRoutes');
const symptomsRoutes = require('./routes/symptomsRoutes');
const kicksRoutes = require('./routes/kicksRoutes');
const labsRoutes = require('./routes/labsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const alertsRoutes = require('./routes/alertsRoutes');
const medicationRoutes = require('./routes/medicationRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const aiRoutes = require('./routes/aiRoutes');
const chatRoutes = require('./routes/chatRoutes');
const agentRoutes = require('./routes/agentRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const timelineRoutes = require('./routes/timelineRoutes');

const app = express();

// Initialize Database (MongoDB with resilient In-Memory fallback)
connectDB();

// Security & Utility Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
// CORS Configuration supporting deployed Vercel frontend, custom domains & local development
const getAllowedOrigins = () => {
  const localOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000'
  ];

  if (process.env.FRONTEND_URL) {
    const configuredOrigins = process.env.FRONTEND_URL
      .split(',')
      .map(origin => origin.trim().replace(/\/+$/, ''))
      .filter(Boolean);
    return [...localOrigins, ...configuredOrigins];
  }

  return localOrigins;
};

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile apps, curl, Postman, health check)
    if (!origin) return callback(null, true);

    const allowed = getAllowedOrigins();
    const cleanOrigin = origin.replace(/\/+$/, '');

    const isAllowed = 
      allowed.includes(cleanOrigin) ||
      cleanOrigin.endsWith('.vercel.app') ||
      process.env.FRONTEND_URL === '*' ||
      process.env.NODE_ENV !== 'production';

    if (isAllowed) {
      return callback(null, true);
    }

    console.warn(`⚠️ [CORS Blocked] Origin: ${origin} not in allowed origins.`);
    return callback(new Error(`Origin ${origin} not allowed by CORS policy.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Authorization']
};

app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Core Master Prompt API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes); // User profile alias
app.use('/api/pregnancy', pregnancyRoutes);
app.use('/api/patient', pregnancyRoutes); // Patient profile alias
app.use('/api/vitals', vitalsRoutes);
app.use('/api/health-records', healthRecordRoutes); // Alias
app.use('/api/symptoms', symptomsRoutes);
app.use('/api/kicks', kicksRoutes);
app.use('/api/labs', labsRoutes);
app.use('/api/ultrasounds', labsRoutes); // Ultrasound alias
app.use('/api/reports', reportRoutes); // Alias
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
app.use('/api/clinical-summary', pdfRoutes); // Clinical summary PDF alias
app.use('/api/timeline', timelineRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const { isConnected, isMockMode } = require('./config/db');
  const connected = isConnected();
  const mock = isMockMode();
  res.json({
    status: 'ok',
    database: connected ? (mock ? 'connected (in-memory-store)' : 'connected') : 'disconnected',
    app: 'MotherSync AI / Pregnancy Guardian',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    clinicalEngine: 'Operational',
    agentsLoaded: 10,
    geminiAI: {
      configured: !!(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('<')),
      sdk: '@google/genai & @google/generative-ai'
    }
  });
});

// Root welcome
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to MotherSync AI API - Multi-Agent Pregnancy Health & Care Coordination Engine',
    documentation: '/api/agents/list',
    health: '/api/health',
    status: 'active'
  });
});

// Centralized 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found on MotherSync AI Server.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('💥 [Server Error]:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                   🌸 MOTHERSYNC AI 🌸                         ║
║     Multi-Agent Maternal Healthcare & Clinical Engine         ║
╠═══════════════════════════════════════════════════════════════╣
║  🚀 Server Active:   http://localhost:${PORT}                    ║
║  🛡️  Safety Engine:   Enforced (Deterministic + Guardrails)    ║
║  🤖 Multi-Agents:     10 Clinical Specialist Agents Active     ║
║  📊 Health Endpoint:  http://localhost:${PORT}/api/health         ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});
