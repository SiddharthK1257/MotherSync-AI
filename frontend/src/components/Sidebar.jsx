import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Bot, 
  Activity, 
  FileText, 
  CalendarDays, 
  Hospital, 
  Stethoscope, 
  FileDown, 
  ShieldAlert,
  ChevronRight,
  HeartPulse,
  LogOut
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const { user, isDoctor, logout } = useAuth();

  const patientNavItems = [
    { id: 'dashboard', label: 'Pregnancy Command Center', icon: LayoutDashboard, badge: 'Live' },
    { id: 'agents', label: 'AI Care Team (10 Agents)', icon: Bot, badge: 'ACOG' },
    { id: 'vitals', label: 'Vitals & Kick Telemetry', icon: Activity, badge: null },
    { id: 'reports', label: 'Lab & Ultrasound AI Analysis', icon: FileText, badge: 'OCR' },
    { id: 'appointments', label: 'Appointments & Doctor Prep', icon: CalendarDays, badge: null },
    { id: 'hospitals', label: '24/7 Maternity Hospital Finder', icon: Hospital, badge: 'Live' },
    { id: 'clinical-summary', label: 'Clinical Summary & PDF', icon: FileDown, badge: 'PDF' },
  ];

  const doctorNavItems = [
    { id: 'doctor-portal', label: 'Physician Patient Dashboard', icon: Stethoscope, badge: 'Clinical' },
    { id: 'agents', label: 'Clinical Supervisor & Agents', icon: Bot, badge: '10 Agents' },
    { id: 'reports', label: 'Diagnostic Lab Review', icon: FileText, badge: null },
    { id: 'clinical-summary', label: 'Generate Clinical Summary', icon: FileDown, badge: 'PDF' },
  ];

  const navItems = isDoctor ? doctorNavItems : patientNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-72 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between`}
      >
        <div className="p-4 space-y-6 overflow-y-auto">
          
          {/* Navigation Links */}
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              {isDoctor ? 'Clinical Navigation' : 'Maternal Care Modules'}
            </p>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onClose?.();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-50 to-rose-50 text-teal-900 font-semibold border border-teal-200 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-teal-50 group-hover:text-teal-600'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-left leading-tight">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isActive ? 'bg-teal-200 text-teal-900' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className={`h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 ${isActive ? 'text-teal-600' : ''}`} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Clinical Guardrail Badge Card */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md">
            <div className="flex items-center gap-2 mb-1.5 text-teal-300 text-xs font-bold">
              <HeartPulse className="h-4 w-4" />
              <span>Deterministic Safety Engine</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Strict 4-tier risk classification & zero-hallucination clinical grounding active on all agent workflows.
            </p>
          </div>

        </div>

        {/* User Card & Logout in Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email || 'user@mothersync.ai'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Log Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            🌸 <strong className="text-slate-600">MotherSync AI:</strong> Multi-Agent Maternal Healthcare Platform.
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
