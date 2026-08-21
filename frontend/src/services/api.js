import axios from 'axios';

export const getApiBaseUrl = () => {
  // 1. Explicit env override if provided
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim() !== '') {
    return import.meta.env.VITE_API_URL;
  }
  // 2. In browser on non-localhost domain (Vercel, Render, custom domains), default to Render backend
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://mothersync-ai.onrender.com/api';
  }
  // 3. Fallback for production builds vs local dev
  return import.meta.env.PROD ? 'https://mothersync-ai.onrender.com/api' : 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

// Attach JWT token & ensure correct production baseURL automatically
api.interceptors.request.use(
  (config) => {
    const currentBaseUrl = getApiBaseUrl();
    if (!config.baseURL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && config.baseURL.includes('localhost'))) {
      config.baseURL = currentBaseUrl;
    }
    const token = localStorage.getItem('mothersync_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Centralized Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// 1. Authentication APIs (with multi-route fallback)
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  demoLogin: (role = 'patient') => api.post('/auth/demo-login', { role }),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile').catch(() => api.get('/users/profile')),
  updateProfile: (data) => api.put('/auth/profile', data).catch(() => api.put('/users/profile', data)),
};

// 2. Pregnancy Profile APIs
export const pregnancyAPI = {
  getProfile: () => api.get('/pregnancy/profile').catch(() => api.get('/patient/profile')).catch(() => api.get('/auth/profile')),
  updateProfile: (data) => api.put('/pregnancy/profile', data).catch(() => api.put('/patient/profile', data)).catch(() => api.put('/auth/profile', data)),
};

// 3. Dynamic Dashboard & Command Center API
export const dashboardAPI = {
  getDashboard: () => api.get('/dashboard'),
};

// 4. Vitals & Health Telemetry APIs
export const vitalsAPI = {
  getVitals: () => api.get('/vitals'),
  logVital: (vitalData) => api.post('/vitals', vitalData),
  getAnalytics: () => api.get('/health-records/analytics'),
};

// Backward-compatible alias
export const healthAPI = {
  getHealthRecords: () => api.get('/vitals'),
  logHealthRecord: (recordData) => api.post('/vitals', recordData),
  logKickSession: (kickData) => api.post('/kicks', kickData),
  getAnalytics: () => api.get('/health-records/analytics'),
};

// 5. Symptoms APIs
export const symptomsAPI = {
  getSymptoms: () => api.get('/symptoms'),
  logSymptom: (symptomData) => api.post('/symptoms', symptomData),
};

// 6. Fetal Kicks APIs
export const kicksAPI = {
  getKicks: () => api.get('/kicks'),
  logKick: (kickData) => api.post('/kicks', kickData),
};

// 7. Diagnostic Lab & Ultrasound Reports APIs (with multi-route fallback)
export const labsAPI = {
  getLabs: () => api.get('/labs').catch(() => api.get('/reports')),
  getLabById: (id) => api.get(`/labs/${id}`).catch(() => api.get(`/reports/${id}`)),
  uploadLab: (data) => api.post('/labs', data).catch(() => api.post('/reports', data)),
  uploadFile: (formData) => api.post('/labs/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).catch(() => api.post('/reports/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })),
};

// Backward-compatible alias
export const reportAPI = {
  getReports: () => api.get('/labs').catch(() => api.get('/reports')),
  getReportById: (id) => api.get(`/labs/${id}`).catch(() => api.get(`/reports/${id}`)),
  analyzeReport: (reportData) => api.post('/labs', reportData).catch(() => api.post('/reports', reportData)),
  uploadFile: (formData) => api.post('/reports/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).catch(() => api.post('/labs/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })),
  doctorReviewReport: (id, doctorNotes) => api.post(`/reports/${id}/doctor-review`, { doctorNotes }),
};

// 8. Appointments & Doctor Prep APIs
export const appointmentAPI = {
  getAppointments: () => api.get('/appointments'),
  createAppointment: (data) => api.post('/appointments', data),
  deleteAppointment: (id) => api.delete(`/appointments/${id}`),
  prepareAppointment: (id) => api.post(`/appointments/${id}/prepare`),
};

// 9. Alerts APIs
export const alertsAPI = {
  getAlerts: () => api.get('/alerts'),
};

// 10. AI & Gemini Care Team APIs
export const aiAPI = {
  ask: (question, sessionId = 'default_session', manualAgentOverride = null) =>
    api.post('/ai/ask', { question, sessionId, manualAgentOverride }),
  analyzeLab: (rawText, reportType) =>
    api.post('/ai/analyze-lab', { rawText, reportType }),
  prepareVisit: () =>
    api.post('/ai/prepare-visit'),
  getClinicalSummary: () =>
    api.post('/ai/clinical-summary'),
};

// 11. Multi-Agent Orchestrator APIs
export const agentAPI = {
  getAgentsList: () => api.get('/agents/list'),
  sendChatMessage: (message, manualAgentOverride = null) =>
    api.post('/agents/chat', { message, manualAgentOverride }),
  voiceTriage: (transcript) => api.post('/agents/voice-triage', { transcript }),
  prepareDoctorQuestions: () => api.post('/agents/prepare-questions'),
};

// 12. Chat History APIs
export const chatAPI = {
  getHistory: (sessionId = 'default_session') => api.get('/chat/history', { params: { sessionId } }),
  clearHistory: (sessionId = 'default_session') => api.delete('/chat/history', { params: { sessionId } }),
};

// 13. 24/7 Maternity Hospitals & Emergency Locator APIs
export const hospitalAPI = {
  getNearbyHospitals: (lat, lng, radius) =>
    api.get('/hospitals/nearby', { params: { lat, lng, radius } }),
};

// 14. Emergency SOS & Incident Logging APIs
export const emergencyAPI = {
  triggerSOS: (data) => api.post('/emergency/sos', data),
  getLogs: () => api.get('/emergency/logs'),
};

// 15. Doctor Portal APIs
export const doctorAPI = {
  getPatients: () => api.get('/doctor/patients'),
  getPatientDossier: (id) => api.get(`/doctor/patient/${id}`),
};

// 16. Clinical PDF Telemetry Export
export const pdfAPI = {
  getPdfSummaryUrl: () => `${getApiBaseUrl()}/pdf/summary`,
  downloadPdfSummary: async () => {
    const token = localStorage.getItem('mothersync_token');
    const response = await axios.get(`${getApiBaseUrl()}/pdf/summary`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob',
    });
    return response.data;
  },
};

// 17. Timeline APIs
export const timelineAPI = {
  getTimelineEvents: () => api.get('/timeline'),
};

export default api;
