import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Attach JWT token automatically
api.interceptors.request.use(
  (config) => {
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

// Authentication APIs
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  demoLogin: (role = 'patient') => api.post('/auth/demo-login', { role }),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Multi-Agent Orchestrator APIs
export const agentAPI = {
  getAgentsList: () => api.get('/agents/list'),
  sendChatMessage: (message, manualAgentOverride = null) =>
    api.post('/agents/chat', { message, manualAgentOverride }),
  voiceTriage: (transcript) => api.post('/agents/voice-triage', { transcript }),
  prepareDoctorQuestions: () => api.post('/agents/prepare-questions'),
};

// Health Records & Vitals Telemetry APIs
export const healthAPI = {
  getHealthRecords: () => api.get('/health-records'),
  logHealthRecord: (recordData) => api.post('/health-records', recordData),
  logKickSession: (kickData) => api.post('/health-records/kick', kickData),
  getAnalytics: () => api.get('/health-records/analytics'),
};

// Diagnostic & Lab Reports APIs
export const reportAPI = {
  getReports: () => api.get('/reports'),
  getReportById: (id) => api.get(`/reports/${id}`),
  analyzeReport: (reportData) => api.post('/reports/analyze', reportData),
  doctorReviewReport: (id, doctorNotes) =>
    api.post(`/reports/${id}/doctor-review`, { doctorNotes }),
};

// Appointments & Doctor Visit Prep APIs
export const appointmentAPI = {
  getAppointments: () => api.get('/appointments'),
  createAppointment: (data) => api.post('/appointments', data),
  deleteAppointment: (id) => api.delete(`/appointments/${id}`),
  prepareAppointment: (id) => api.post(`/appointments/${id}/prepare`),
};

// 24/7 Maternity Hospitals & Emergency Locator APIs
export const hospitalAPI = {
  getNearbyHospitals: (lat, lng, radius) =>
    api.get('/hospitals/nearby', { params: { lat, lng, radius } }),
};

// Emergency SOS & Incident Logging APIs
export const emergencyAPI = {
  triggerSOS: (data) => api.post('/emergency/sos', data),
  getLogs: () => api.get('/emergency/logs'),
};

// Doctor Portal APIs
export const doctorAPI = {
  getPatients: () => api.get('/doctor/patients'),
  getPatientDossier: (id) => api.get(`/doctor/patient/${id}`),
};

// Clinical PDF Telemetry Export
export const pdfAPI = {
  getPdfSummaryUrl: () => `${API_BASE_URL}/pdf/summary`,
  downloadPdfSummary: async () => {
    const token = localStorage.getItem('mothersync_token');
    const response = await axios.get(`${API_BASE_URL}/pdf/summary`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob',
    });
    return response.data;
  },
};

// Timeline APIs
export const timelineAPI = {
  getTimelineEvents: () => api.get('/timeline'),
};

export default api;
