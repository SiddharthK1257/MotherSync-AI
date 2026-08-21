import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import EmergencyTriageModal from './components/EmergencyTriageModal';

// Pages
import DashboardPage from './pages/DashboardPage';
import AgentOrchestratorPage from './pages/AgentOrchestratorPage';
import VitalsTrackingPage from './pages/VitalsTrackingPage';
import MedicalReportsPage from './pages/MedicalReportsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import HospitalFinderPage from './pages/HospitalFinderPage';
import DoctorPortalPage from './pages/DoctorPortalPage';
import ClinicalSummaryPage from './pages/ClinicalSummaryPage';
import LoginPage from './pages/LoginPage';

export function App() {
  const { user, loading, isDoctor } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-rose-500 text-white flex items-center justify-center mx-auto shadow-md animate-bounce text-xl">
            🌸
          </div>
          <p className="text-xs font-bold text-slate-700 tracking-wide">Initializing MotherSync AI Platform...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPage 
        onLoginSuccess={(role) => {
          setActiveTab(role === 'doctor' ? 'doctor-portal' : 'dashboard');
        }} 
      />
    );
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'agents':
        return <AgentOrchestratorPage />;
      case 'vitals':
        return <VitalsTrackingPage />;
      case 'reports':
        return <MedicalReportsPage />;
      case 'appointments':
        return <AppointmentsPage />;
      case 'hospitals':
        return <HospitalFinderPage />;
      case 'doctor-portal':
        return <DoctorPortalPage setActiveTab={setActiveTab} />;
      case 'clinical-summary':
        return <ClinicalSummaryPage />;
      case 'dashboard':
      default:
        return isDoctor ? (
          <DoctorPortalPage setActiveTab={setActiveTab} />
        ) : (
          <DashboardPage setActiveTab={setActiveTab} />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-teal-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Responsive Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 lg:pl-72 p-4 sm:p-6 lg:p-8 min-w-0">
          {renderActivePage()}
        </main>
      </div>

      {/* Global Emergency Red Alert Modal */}
      <EmergencyTriageModal />
    </div>
  );
}

export default App;
