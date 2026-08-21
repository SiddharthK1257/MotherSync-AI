import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useEmergencyModal } from '../context/EmergencyModalContext';
import RiskBadge from './RiskBadge';
import { 
  Heart, 
  ShieldAlert, 
  Stethoscope, 
  LogOut, 
  Calendar, 
  Sparkles,
  Menu
} from 'lucide-react';

export const Navbar = ({ onToggleSidebar, activeTab, setActiveTab }) => {
  const { user, isDoctor, isPatient, demoLogin, logout, currentRisk } = useAuth();
  const { triggerDirectSOS, isTriggeringSOS } = useEmergencyModal();

  const handleRoleToggle = async () => {
    try {
      if (isDoctor) {
        await demoLogin('patient');
        setActiveTab('dashboard');
      } else {
        await demoLogin('doctor');
        setActiveTab('doctor-portal');
      }
    } catch (err) {
      console.error('Role toggle failed:', err);
    }
  };

  const handleLogout = () => {
    logout();
    setActiveTab('dashboard');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Mobile Menu Button & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none"
              aria-label="Toggle Navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div 
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
                <Heart className="h-5 w-5 fill-white/20 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg text-slate-900 tracking-tight">MotherSync</span>
                  <span className="bg-gradient-to-r from-teal-600 to-rose-600 bg-clip-text text-transparent font-extrabold text-sm uppercase tracking-wider">AI</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium hidden sm:block">Clinical Multi-Agent Maternal Care</p>
              </div>
            </div>
          </div>

          {/* Center: Gestational Progress & Current Status (Patient Mode) */}
          {isPatient && user && (
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold">
                <Calendar className="h-3.5 w-3.5 text-teal-600" />
                <span>Week {user.gestationalWeek || 24} • Trimester {user.currentTrimester || 2}</span>
              </div>

              <RiskBadge level={currentRisk?.riskLevel || 'routine'} size="sm" />
            </div>
          )}

          {isDoctor && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold">
              <Stethoscope className="h-3.5 w-3.5 text-indigo-600" />
              <span>Physician Portal • Dr. Sarah Jenkins, MD (FACOG)</span>
            </div>
          )}

          {/* Right: Actions, SOS Emergency, Role Switcher & Logout */}
          <div className="flex items-center gap-2.5">
            
            {/* SOS Emergency Button */}
            <button
              onClick={() => triggerDirectSOS('One-Touch SOS Button Pressed')}
              disabled={isTriggeringSOS}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold shadow-md shadow-red-500/30 hover:shadow-lg hover:shadow-red-500/40 hover:scale-105 active:scale-95 transition-all animate-pulse"
              title="Immediate Emergency Triage & Contact Dispatch"
            >
              <ShieldAlert className="h-4 w-4" />
              <span>{isTriggeringSOS ? 'Triggering SOS...' : '🚨 SOS RED ALERT'}</span>
            </button>

            {/* Quick Role Switcher for Hackathon / Testing */}
            <button
              onClick={handleRoleToggle}
              className={`hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isDoctor 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                  : 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100'
              }`}
              title="Switch between Pregnant Mother & Obstetrician View"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isDoctor ? 'Patient View' : 'Doctor View'}</span>
            </button>

            {/* User Profile Badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name || 'User'}</p>
                <p className="text-[10px] text-slate-500 capitalize">{user?.role || 'Patient'}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 p-2 px-2.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-200"
              title="Log Out"
              aria-label="Log Out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline text-xs font-semibold">Log out</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;
