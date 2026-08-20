require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { connectDB } = require('./config/db');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const agentRoutes = require('./routes/agentRoutes');
const healthRecordRoutes = require('./routes/healthRecordRoutes');
const reportRoutes = require('./routes/reportRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
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
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/health-records', healthRecordRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/timeline', timelineRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    app: 'MotherSync AI',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    clinicalEngine: 'Operational',
    agentsLoaded: 10
  });
});

// Root welcome
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to MotherSync AI API - Multi-Agent Pregnancy Health & Care Coordination Engine',
    documentation: '/api/agents/list',
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
║                   🌸 MOTHYERSYNC AI 🌸                        ║
║     Multi-Agent Maternal Healthcare & Clinical Engine         ║
╠═══════════════════════════════════════════════════════════════╣
║  🚀 Server Active:   http://localhost:${PORT}                    ║
║  🛡️  Safety Engine:   Enforced (Deterministic + Guardrails)    ║
║  🤖 Multi-Agents:     10 Clinical Specialist Agents Active     ║
║  📊 Health Endpoint:  http://localhost:${PORT}/api/health         ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});
