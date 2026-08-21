import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEmergencyModal } from '../context/EmergencyModalContext';
import { dashboardAPI, vitalsAPI, appointmentAPI } from '../services/api';
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
  AlertCircle,
  Loader2,
  Droplets,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CalendarCheck
} from 'lucide-react';

export const DashboardPage = ({ setActiveTab }) => {
  const { user, currentRisk, setCurrentRisk } = useAuth();
  const { triggerDirectSOS } = useEmergencyModal();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Timeline selected week
  const [selectedTimelineWeek, setSelectedTimelineWeek] = useState(24);

  // Quick Vitals Input State
  const [quickBpSys, setQuickBpSys] = useState('');
  const [quickBpDia, setQuickBpDia] = useState('');
  const [quickHr, setQuickHr] = useState('');
  const [quickGlucose, setQuickGlucose] = useState('');
  const [isLoggingVitals, setIsLoggingVitals] = useState(false);
  const [vitalsFeedback, setVitalsFeedback] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await dashboardAPI.getDashboard();
      if (res.data?.success) {
        setDashboardData(res.data.data);
        if (res.data.data.safetyStatus) {
          setCurrentRisk(res.data.data.safetyStatus);
        }
        const currentW = res.data.data.pregnancy?.gestationalWeek || user?.gestationalWeek || 24;
        setSelectedTimelineWeek(currentW);
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogVitals = async (e) => {
    e.preventDefault();
    setIsLoggingVitals(true);
    setVitalsFeedback(null);

    const sys = Number(quickBpSys);
    const dia = Number(quickBpDia);
    const hr = Number(quickHr);

    if (!sys || !dia || !hr) {
      setVitalsFeedback({
        type: 'error',
        text: 'Please enter valid Systolic BP, Diastolic BP, and Heart Rate.'
      });
      setIsLoggingVitals(false);
      return;
    }

    try {
      const res = await vitalsAPI.logVital({
        week: dashboardData?.pregnancy?.gestationalWeek || user?.gestationalWeek || 24,
        systolicBP: sys,
        diastolicBP: dia,
        bpSystolic: sys,
        bpDiastolic: dia,
        heartRate: hr,
        bloodGlucose: quickGlucose ? Number(quickGlucose) : null,
        symptoms: []
      });

      if (res.data?.success) {
        setVitalsFeedback({
          type: 'success',
          text: `Vitals stored in MongoDB! Safety status: ${res.data.risk?.badge?.label || 'Routine 🟢'}`
        });
        setQuickBpSys('');
        setQuickBpDia('');
        setQuickHr('');
        setQuickGlucose('');
        fetchDashboard();
      }
    } catch (err) {
      setVitalsFeedback({
        type: 'error',
        text: err.message || 'Failed to log vitals'
      });
    } finally {
      setIsLoggingVitals(false);
    }
  };

  const currentWeek = dashboardData?.pregnancy?.gestationalWeek || user?.gestationalWeek || 24;
  const currentTrimester = dashboardData?.pregnancy?.trimester || user?.currentTrimester || (currentWeek <= 13 ? 1 : currentWeek <= 27 ? 2 : 3);
  const progressPercent = dashboardData?.pregnancy?.progressPercent || Math.min(100, Math.round((currentWeek / 40) * 100));
  const records = dashboardData?.historicalRecords || [];
  const nextAppointment = dashboardData?.nextAppointment;
  const latestVitals = dashboardData?.latestVitals;
  const latestReport = dashboardData?.latestReport;
  const patientName = dashboardData?.patient?.name || user?.name || 'Patient';
  const isDemo = String(user?.email || '').includes('elena@mothersync.ai') || String(user?._id || '').startsWith('usr_');

  // Build week-by-week data mapping for weeks 1 to 40
  const weekDataMap = {};
  for (let w = 1; w <= 40; w++) {
    weekDataMap[w] = {
      week: w,
      vitals: records.filter((r) => r.week === w),
      hasReport: latestReport && (latestReport.week === w || (w === 20 && latestReport.type === 'ultrasound')),
      isCurrent: w === currentWeek
    };
  }

  const selectedWeekInfo = weekDataMap[selectedTimelineWeek] || {
    week: selectedTimelineWeek,
    vitals: [],
    hasReport: false,
    isCurrent: selectedTimelineWeek === currentWeek
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Demo Mode Notice Banner */}
      {isDemo && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
              DEMO DATA — NOT A REAL PATIENT
            </span>
            <span>Running with synthetic demo datasets for evaluation. You can log real vitals, upload documents, and test multi-agent AI responses.</span>
          </div>
        </div>
      )}

      {/* 1. Pregnancy Milestone & Progress Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white shadow-xl p-6 sm:p-8">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          
          {/* Left Info */}
          <div className="lg:col-span-2 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-teal-200 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-teal-300" />
              <span>Pregnancy Command Center (MongoDB-Backed)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {patientName}! 🌸
            </h1>

            <p className="text-sm text-teal-100/90 leading-relaxed max-w-xl">
              You are currently in <strong>Week {currentWeek} (Trimester {currentTrimester})</strong>.
              {dashboardData?.pregnancy?.estimatedDueDate && (
                <span> Estimated due date: <strong>{new Date(dashboardData.pregnancy.estimatedDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>.</span>
              )}
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
            <p className="text-xs font-bold uppercase tracking-wider text-teal-200">Safety Status Stratification</p>
            <RiskBadge level={currentRisk?.riskLevel || dashboardData?.safetyStatus?.riskLevel || 'routine'} size="lg" />
            <p className="text-xs text-teal-100/80 leading-snug">
              {currentRisk?.summaryRationale || dashboardData?.safetyStatus?.summaryRationale || 'Normotensive profile maintained. Standard prenatal monitoring protocol active.'}
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

      {/* 2. Week 1 to Week 40 Interactive Timeline */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-teal-600" />
            <h2 className="font-bold text-base text-slate-900">Week 1 → Week 40 Gestational Journey Timeline</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Selected: <strong className="text-teal-700">Week {selectedTimelineWeek}</strong> {selectedTimelineWeek === currentWeek ? '(Current Week)' : ''}
          </span>
        </div>

        {/* Timeline Horizontal Scroller */}
        <div className="overflow-x-auto pb-2 scrollbar-thin">
          <div className="flex items-center gap-2 min-w-max py-2">
            {Array.from({ length: 40 }, (_, i) => i + 1).map((wk) => {
              const wkInfo = weekDataMap[wk];
              const isCurr = wk === currentWeek;
              const isSel = wk === selectedTimelineWeek;
              const hasData = wkInfo && (wkInfo.vitals.length > 0 || wkInfo.hasReport);

              return (
                <button
                  key={wk}
                  type="button"
                  onClick={() => setSelectedTimelineWeek(wk)}
                  className={`flex flex-col items-center justify-center min-w-[3.25rem] p-2 rounded-2xl border transition-all ${
                    isSel
                      ? 'bg-teal-600 text-white border-teal-700 shadow-md scale-105'
                      : isCurr
                      ? 'bg-teal-50 text-teal-900 border-teal-300 ring-2 ring-teal-500/30'
                      : hasData
                      ? 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                      : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300 opacity-60'
                  }`}
                >
                  <span className={`text-[10px] font-bold ${isSel ? 'text-teal-200' : 'text-slate-400'}`}>
                    WK
                  </span>
                  <span className="text-sm font-black">{wk}</span>
                  <div className="h-1.5 w-1.5 rounded-full mt-1 flex items-center justify-center">
                    {hasData ? (
                      <span className={`h-1.5 w-1.5 rounded-full ${isSel ? 'bg-white' : 'bg-teal-600'}`} />
                    ) : isCurr ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Week Clinical Records Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">
                Week {selectedTimelineWeek} Milestones & Health Records
              </span>
              {selectedTimelineWeek === currentWeek && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  Current Week
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500">
              Trimester {selectedTimelineWeek <= 13 ? 1 : selectedTimelineWeek <= 27 ? 2 : 3}
            </span>
          </div>

          <div className="pt-3">
            {selectedWeekInfo.vitals.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-teal-800">
                  {selectedWeekInfo.vitals.length} Vital Reading{selectedWeekInfo.vitals.length > 1 ? 's' : ''} Recorded in Database:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                  {selectedWeekInfo.vitals.map((v, vIdx) => (
                    <div key={vIdx} className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                      <p className="font-bold text-slate-900">
                        BP: {v.bpSystolic || v.systolicBP}/{v.bpDiastolic || v.diastolicBP} mmHg • HR: {v.heartRate} bpm
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Date: {new Date(v.date || v.recordedAt).toLocaleDateString()} {v.bloodGlucose ? `• Glucose: ${v.bloodGlucose} mg/dL` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : selectedWeekInfo.hasReport ? (
              <div className="text-xs text-slate-700 space-y-1">
                <p className="font-bold text-teal-800">Medical Report Uploaded for Week {selectedTimelineWeek}</p>
                <p className="text-slate-500">{latestReport?.title || 'Diagnostic Report'}</p>
              </div>
            ) : (
              <div className="py-2 text-xs text-slate-400 flex items-center justify-between">
                <span>No health records recorded for Week {selectedTimelineWeek}.</span>
                {selectedTimelineWeek === currentWeek && (
                  <button
                    onClick={() => setActiveTab('vitals')}
                    className="text-teal-600 font-bold hover:underline text-xs"
                  >
                    Log Vitals for Week {selectedTimelineWeek} →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Primary Telemetry Grid */}
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
              <span className="text-[11px] text-slate-400 font-medium">Automatic clinical safety check & MongoDB save</span>
            </div>

            <form onSubmit={handleQuickLogVitals} className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Systolic BP</label>
                <input
                  type="number"
                  value={quickBpSys}
                  onChange={(e) => setQuickBpSys(e.target.value)}
                  placeholder="e.g. 118"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Diastolic BP</label>
                <input
                  type="number"
                  value={quickBpDia}
                  onChange={(e) => setQuickBpDia(e.target.value)}
                  placeholder="e.g. 76"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Heart Rate</label>
                <input
                  type="number"
                  value={quickHr}
                  onChange={(e) => setQuickHr(e.target.value)}
                  placeholder="e.g. 78 bpm"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Glucose (mg/dL)</label>
                <input
                  type="number"
                  value={quickGlucose}
                  onChange={(e) => setQuickGlucose(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="col-span-2 sm:col-span-1 flex items-end">
                <button
                  type="submit"
                  disabled={isLoggingVitals}
                  className="w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs shadow transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isLoggingVitals ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Log Vitals</span>
                  )}
                </button>
              </div>
            </form>

            {vitalsFeedback && (
              <p className={`text-xs font-medium ${vitalsFeedback.type === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>
                {vitalsFeedback.text}
              </p>
            )}
          </div>

        </div>

        {/* Right 1 Col: Kick Counter & Next Appointment */}
        <div className="space-y-6">
          
          {/* Kick Counter Widget */}
          <KickCounterWidget onKickLogged={fetchDashboard} />

          {/* Next Upcoming Appointment Card */}
          {nextAppointment ? (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  Next Prenatal Visit
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {new Date(nextAppointment.date || nextAppointment.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>

              <h4 className="font-bold text-sm text-slate-900 leading-snug">{nextAppointment.title || 'Routine Prenatal Consultation'}</h4>
              <p className="text-xs text-slate-500">
                With <strong>{nextAppointment.doctorName}</strong> at {nextAppointment.clinicLocation || nextAppointment.location || 'Clinic'} ({nextAppointment.time || 'Morning'})
              </p>

              <button
                onClick={() => setActiveTab('appointments')}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-50 hover:bg-teal-50 hover:text-teal-700 text-slate-700 text-xs font-bold border border-slate-200 transition-colors"
              >
                <Bot className="h-3.5 w-3.5 text-teal-600" />
                <span>Prepare Questions for Doctor</span>
              </button>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 text-center">
              <Calendar className="h-6 w-6 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No appointment scheduled</p>
              <button
                onClick={() => setActiveTab('appointments')}
                className="text-xs text-teal-600 font-bold hover:underline"
              >
                Schedule Prenatal Visit
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
              Ask questions about trimester nutrition, ultrasound lab explanations, heart health, or fetal kicks with Point-to-Point clinical answers.
            </p>

            <button
              onClick={() => setActiveTab('agents')}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow transition-all"
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
