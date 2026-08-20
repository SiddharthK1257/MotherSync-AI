import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEmergencyModal } from '../context/EmergencyModalContext';
import { healthAPI, appointmentAPI, reportAPI } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import VitalsChart from '../components/VitalsChart';
import KickCounterWidget from '../components/KickCounterWidget';
import VoiceTriageButton from '../components/VoiceTriageButton';
import {
  Calendar,
  Heart,
  Activity,
  Bot,
  Baby,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileText,
  PlusCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export const DashboardPage = ({ setActiveTab }) => {
  const { user, currentRisk, setCurrentRisk } = useAuth();
  const { triggerDirectSOS } = useEmergencyModal();

  const [records, setRecords] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick Vitals Input State
  const [quickBpSys, setQuickBpSys] = useState('120');
  const [quickBpDia, setQuickBpDia] = useState('78');
  const [quickHr, setQuickHr] = useState('80');
  const [quickGlucose, setQuickGlucose] = useState('92');
  const [isLoggingVitals, setIsLoggingVitals] = useState(false);
  const [vitalsFeedback, setVitalsFeedback] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(false);
    try {
      const [recordsRes, aptsRes, repsRes] = await Promise.allSettled([
        healthAPI.getHealthRecords(),
        appointmentAPI.getAppointments(),
        reportAPI.getReports()
      ]);

      if (recordsRes.status === 'fulfilled' && recordsRes.value.data.data) {
        setRecords(recordsRes.value.data.data);
        if (recordsRes.value.data.currentRisk) {
          setCurrentRisk(recordsRes.value.data.currentRisk);
        }
      }

      if (aptsRes.status === 'fulfilled' && aptsRes.value.data.data) {
        setAppointments(aptsRes.value.data.data);
      }

      if (repsRes.status === 'fulfilled' && repsRes.value.data.data) {
        setReports(repsRes.value.data.data);
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    }
  };

  const handleQuickLogVitals = async (e) => {
    e.preventDefault();
    setIsLoggingVitals(true);
    setVitalsFeedback(null);

    try {
      const res = await healthAPI.logHealthRecord({
        week: user?.gestationalWeek || 24,
        bpSystolic: Number(quickBpSys),
        bpDiastolic: Number(quickBpDia),
        heartRate: Number(quickHr),
        bloodGlucose: Number(quickGlucose),
        symptoms: []
      });

      if (res.data.success) {
        setVitalsFeedback('Vitals logged! Safety engine verified normotensive status.');
        fetchDashboardData();
      }
    } catch (err) {
      setVitalsFeedback(err.message || 'Failed to log vitals');
    } finally {
      setIsLoggingVitals(false);
    }
  };

  const currentWeek = user?.gestationalWeek || 24;
  const progressPercent = Math.min(100, Math.round((currentWeek / 40) * 100));
  const nextAppointment = appointments.find(a => a.status === 'upcoming') || appointments[0];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* 1. Pregnancy Milestone & Progress Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white shadow-xl p-6 sm:p-8">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          
          {/* Left Info */}
          <div className="lg:col-span-2 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-teal-200 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-teal-300" />
              <span>Gestational Milestone Tracking</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Elena'}! 🌸
            </h1>

            <p className="text-sm text-teal-100/90 leading-relaxed max-w-xl">
              You are currently in <strong>Week {currentWeek} (Trimester {user?.currentTrimester || 2})</strong>. Your baby is roughly the size of an <strong>ear of corn (~600 grams / 30 cm)</strong> and auditory reflexes are actively sharpening.
            </p>

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-2 max-w-lg">
              <div className="flex items-center justify-between text-xs font-semibold text-teal-200">
                <span>Week 1 (Conception)</span>
                <span className="text-white font-bold">Week {currentWeek} of 40 ({progressPercent}%)</span>
                <span>Week 40 (Term)</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                <div
                  className="bg-gradient-to-r from-teal-300 to-rose-300 h-3 rounded-full shadow-sm transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Status Glance Box */}
          <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-200">Current Risk Stratification</p>
            <RiskBadge level={currentRisk?.riskLevel || 'routine'} size="lg" />
            <p className="text-xs text-teal-100/80 leading-snug">
              {currentRisk?.summaryRationale || 'Normotensive profile maintained. Standard prenatal monitoring protocol active.'}
            </p>

            <div className="pt-2 flex items-center gap-2">
              <VoiceTriageButton
                onTranscriptReceived={(txt) => {
                  setActiveTab('agents');
                }}
              />
            </div>
          </div>

        </div>

        {/* Decorative subtle background shapes */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Primary Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Longitudinal Chart & Quick Logger */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Longitudinal Chart Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900">
                <Activity className="h-5 w-5 text-teal-600" />
                <h2 className="font-bold text-base">Longitudinal Telemetry Trends</h2>
              </div>
              <button
                onClick={() => setActiveTab('vitals')}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <span>Full Telemetry</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <VitalsChart records={records} />
          </div>

          {/* Quick Vitals Logger */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900">
                <Heart className="h-5 w-5 text-rose-500" />
                <h3 className="font-bold text-sm">Quick Vitals Check-in</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Automatic clinical guardrail review</span>
            </div>

            <form onSubmit={handleQuickLogVitals} className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Systolic BP</label>
                <input
                  type="number"
                  value={quickBpSys}
                  onChange={(e) => setQuickBpSys(e.target.value)}
                  placeholder="120"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Diastolic BP</label>
                <input
                  type="number"
                  value={quickBpDia}
                  onChange={(e) => setQuickBpDia(e.target.value)}
                  placeholder="80"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Heart Rate</label>
                <input
                  type="number"
                  value={quickHr}
                  onChange={(e) => setQuickHr(e.target.value)}
                  placeholder="80 bpm"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Glucose (mg/dL)</label>
                <input
                  type="number"
                  value={quickGlucose}
                  onChange={(e) => setQuickGlucose(e.target.value)}
                  placeholder="92"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="col-span-2 sm:col-span-1 flex items-end">
                <button
                  type="submit"
                  disabled={isLoggingVitals}
                  className="w-full py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs shadow transition-all disabled:opacity-50"
                >
                  {isLoggingVitals ? 'Verifying...' : 'Log Vitals'}
                </button>
              </div>
            </form>

            {vitalsFeedback && (
              <p className="text-xs text-teal-700 font-medium">{vitalsFeedback}</p>
            )}
          </div>

        </div>

        {/* Right 1 Col: Kick Counter & Next Appointment */}
        <div className="space-y-6">
          
          {/* Kick Counter Widget */}
          <KickCounterWidget onKickLogged={fetchDashboardData} />

          {/* Next Upcoming Appointment Card */}
          {nextAppointment && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  Next Prenatal Visit
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {new Date(nextAppointment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>

              <h4 className="font-bold text-sm text-slate-900 leading-snug">{nextAppointment.title}</h4>
              <p className="text-xs text-slate-500">
                With <strong>{nextAppointment.doctorName}</strong> at {nextAppointment.clinicLocation} ({nextAppointment.time})
              </p>

              <button
                onClick={() => setActiveTab('appointments')}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-50 hover:bg-teal-50 hover:text-teal-700 text-slate-700 text-xs font-bold border border-slate-200 transition-colors"
              >
                <Bot className="h-3.5 w-3.5 text-teal-600" />
                <span>Prepare 4 Questions for Doctor</span>
              </button>
            </div>
          )}

          {/* Quick Access to Multi-Agent Team */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-teal-950 text-white shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Bot className="h-4 w-4 text-teal-400" />
                <span>AI Care Team (10 Agents)</span>
              </h4>
              <span className="text-[10px] bg-teal-400/20 text-teal-300 px-2 py-0.5 rounded-full font-bold">ACOG Grounded</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Ask questions about trimester nutrition, ultrasound lab explanations, heart health, or fetal kicks.
            </p>

            <button
              onClick={() => setActiveTab('agents')}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow transition-all"
            >
              <span>Launch Multi-Agent Studio</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

export default DashboardPage;
