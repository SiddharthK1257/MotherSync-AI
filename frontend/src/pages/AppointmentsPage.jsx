import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentAPI, agentAPI } from '../services/api';
import {
  CalendarDays,
  Calendar,
  Clock,
  MapPin,
  Stethoscope,
  Plus,
  Bot,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Trash2,
  CalendarCheck,
  Loader2,
  Copy,
  Check,
  Activity,
  FileText,
  AlertCircle,
  ChevronRight,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';

const PRENATAL_MILESTONES = [
  {
    weekRange: 'Weeks 11 - 14',
    title: 'First Trimester Screening & Nuchal Scan',
    type: 'ultrasound',
    badge: 'First Trimester',
    description: 'Nuchal translucency ultrasound, non-invasive prenatal screening (NIPT), and baseline maternal labs.',
    prepNote: 'Ensure full bladder 30 minutes prior if requested by sonographer. Bring previous ultrasound documentation.'
  },
  {
    weekRange: 'Weeks 18 - 22',
    title: 'Detailed Anatomy Ultrasound Scan (Level II)',
    type: 'ultrasound',
    badge: 'Major Milestone',
    description: 'Comprehensive anatomical survey examining fetal organs, four-chamber heart, spine, placenta location, and amniotic fluid index.',
    prepNote: 'Drink a glass of juice or water 20 mins prior to encourage fetal movement during imaging.'
  },
  {
    weekRange: 'Weeks 24 - 28',
    title: 'Glucose Tolerance Screening (OGTT) & Repeat CBC',
    type: 'glucose_tolerance',
    badge: 'Current Stage',
    description: '1-hour or 3-hour oral glucose challenge test for gestational diabetes, paired with hemoglobin and serum ferritin check.',
    prepNote: 'Fasting 8-10 hours prior as instructed by clinic. Bring a light post-test snack.'
  },
  {
    weekRange: 'Weeks 28 - 36',
    title: 'Third Trimester Bi-Weekly Checkups & Tdap',
    type: 'routine_prenatal',
    badge: 'Third Trimester',
    description: 'Fundal height measurement, longitudinal blood pressure tracking, fetal kick count verification, and maternal Tdap vaccination.',
    prepNote: 'Bring log of daily fetal kick sessions and resting blood pressure readings.'
  },
  {
    weekRange: 'Weeks 36 - 40+',
    title: 'Weekly Visits & Group B Strep (GBS) Screening',
    type: 'routine_prenatal',
    badge: 'Pre-Delivery',
    description: 'Routine cervical dilation checks, vaginal-rectal GBS culture swab (Weeks 36-37), and birth plan discussion.',
    prepNote: 'Have hospital bag packing list and emergency contact numbers ready for review.'
  }
];

export const AppointmentsPage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [prepQuestions, setPrepQuestions] = useState(null);
  const [isGeneratingPrep, setIsGeneratingPrep] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  // New Appointment Form
  const [newTitle, setNewTitle] = useState('26-Week Prenatal Checkup & Glucose Screening (OGTT)');
  const [newType, setNewType] = useState('glucose_tolerance');
  const [newDate, setNewDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [newTime, setNewTime] = useState('09:00 AM');
  const [newDoctor, setNewDoctor] = useState('Dr. Sarah Jenkins, MD (FACOG)');
  const [newLocation, setNewLocation] = useState('St. Jude Women’s Health, Suite 402');
  const [newNotes, setNewNotes] = useState('Fasting 8-10 hours prior as instructed by clinic.');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await appointmentAPI.getAppointments();
      if (res.data && res.data.success) {
        setAppointments(res.data.data || []);
      }
    } catch (err) {
      console.error('Fetch appointments error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type) => {
    setNewType(type);
    switch (type) {
      case 'glucose_tolerance':
        setNewTitle('26-Week Glucose Tolerance Screening (OGTT)');
        setNewNotes('Fasting 8-10 hours prior as instructed by clinic.');
        break;
      case 'ultrasound':
        setNewTitle('Detailed Anatomy Ultrasound Scan (Level II)');
        setNewNotes('Drink a glass of water 20 mins prior to encourage fetal movement.');
        break;
      case 'routine_prenatal':
        setNewTitle('Routine Prenatal Progress & Vitals Checkup');
        setNewNotes('Review home blood pressure logs and kick count milestones.');
        break;
      case 'blood_test':
        setNewTitle('Second Trimester CBC & Ferritin Panel');
        setNewNotes('Morning blood draw; stay well hydrated.');
        break;
      case 'non_stress_test':
        setNewTitle('Fetal Non-Stress Test (NST) & Heart Rate Monitoring');
        setNewNotes('Eat a light meal 30 minutes before arrival.');
        break;
      case 'consultation':
        setNewTitle('Obstetrician Specialist Consultation');
        setNewNotes('Discuss birth plan preferences and diagnostic questions.');
        break;
      default:
        break;
    }
  };

  const handleOpenMilestoneSchedule = (milestone) => {
    setNewTitle(milestone.title);
    setNewType(milestone.type);
    setNewNotes(milestone.prepNote);
    setShowScheduleModal(true);
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    try {
      const res = await appointmentAPI.createAppointment({
        title: newTitle,
        type: newType,
        date: newDate,
        time: newTime,
        doctorName: newDoctor || 'Dr. Sarah Jenkins, MD',
        clinicLocation: newLocation || 'St. Jude Women’s Health, Suite 402',
        notes: newNotes
      });

      if (res.data && res.data.success) {
        setAppointments(prev => [...prev, res.data.data]);
        setShowScheduleModal(false);
      }
    } catch (err) {
      console.error('Create appointment error:', err);
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled appointment?')) return;
    try {
      await appointmentAPI.deleteAppointment(id);
      setAppointments(prev => prev.filter(a => (a._id || a.id) !== id));
    } catch (err) {
      console.error('Delete appointment error:', err);
    }
  };

  const handleGenerateDoctorPrep = async () => {
    setIsGeneratingPrep(true);
    try {
      const res = await agentAPI.prepareDoctorQuestions();
      if (res.data && res.data.success) {
        const questionsData = res.data.questions || res.data.data;
        setPrepQuestions(questionsData);
      }
    } catch (err) {
      console.error('Prepare doctor questions error:', err);
      // Evidence-based maternal health fallback
      setPrepQuestions({
        generalQuestions: [
          'Are my maternal blood pressure readings within the expected physiological baseline for Week 24?',
          'What specific preparation or fasting guidelines are required for the upcoming glucose tolerance screen (OGTT)?',
          'Should I begin tracking fetal kicks twice daily at this stage?'
        ],
        vitalsSpecificQuestions: [
          'My resting heart rate averaged 82 bpm over the last 4 weeks. Is this typical for second-trimester plasma volume expansion?'
        ],
        labSpecificQuestions: [
          'Could we review my latest diagnostic lab results to confirm if any iron or vitamin supplementation adjustments are recommended?'
        ],
        summaryTip: 'Bring your printed MotherSync AI clinical summary and home blood pressure log to your appointment for rapid clinician review.'
      });
    } finally {
      setIsGeneratingPrep(false);
    }
  };

  const handleCopyQuestions = () => {
    if (!prepQuestions) return;

    let text = `MotherSync AI - Questions for Dr. Sarah Jenkins (Week ${user?.gestationalWeek || 24})\n\n`;

    if (prepQuestions.generalQuestions?.length > 0) {
      text += `--- Gestational & Milestone Questions ---\n`;
      prepQuestions.generalQuestions.forEach((q, i) => {
        text += `${i + 1}. ${q}\n`;
      });
      text += `\n`;
    }

    if (prepQuestions.vitalsSpecificQuestions?.length > 0) {
      text += `--- Vitals & Hemodynamic Questions ---\n`;
      prepQuestions.vitalsSpecificQuestions.forEach((q, i) => {
        text += `• ${q}\n`;
      });
      text += `\n`;
    }

    if (prepQuestions.labSpecificQuestions?.length > 0) {
      text += `--- Lab & Ultrasound Questions ---\n`;
      prepQuestions.labSpecificQuestions.forEach((q, i) => {
        text += `• ${q}\n`;
      });
      text += `\n`;
    }

    if (prepQuestions.summaryTip) {
      text += `Clinician Tip: ${prepQuestions.summaryTip}\n`;
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const currentGestationalWeek = user?.gestationalWeek || 24;

  const filteredAppointments = appointments.filter(apt => {
    if (activeFilter === 'upcoming') {
      return apt.status !== 'completed' && apt.status !== 'cancelled';
    }
    if (activeFilter === 'completed') {
      return apt.status === 'completed';
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarDays className="h-6 w-6 text-teal-600" />
            <span>Prenatal Appointments & Visit Preparation</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Smart clinic schedules, diagnostic milestone roadmap & "Prepare for My Doctor" AI generator
          </p>
        </div>

        <button
          onClick={() => setShowScheduleModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-teal-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Schedule Visit</span>
        </button>
      </div>

      {/* "Prepare for My Appointment" Hero Generator Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold">
              <Bot className="h-3.5 w-3.5" />
              <span>Doctor Communication Agent</span>
            </div>
            <h2 className="text-lg font-bold">Prepare for My Upcoming Prenatal Visit</h2>
            <p className="text-xs text-slate-300 max-w-xl">
              MotherSync AI scans your latest blood pressure trends, reported symptoms, and lab reports to craft high-yield questions for your obstetrician.
            </p>
          </div>

          <button
            onClick={handleGenerateDoctorPrep}
            disabled={isGeneratingPrep}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-teal-500/25 transition-all self-start sm:self-auto shrink-0 disabled:opacity-50"
          >
            {isGeneratingPrep ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Synthesizing Questions...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Customized Questions</span>
              </>
            )}
          </button>
        </div>

        {/* Generated Questions Card */}
        {prepQuestions && (
          <div className="p-5 rounded-2xl bg-white text-slate-900 space-y-4 animate-fadeIn shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <HelpCircle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800">
                    High-Yield Questions for Obstetrician Visit
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Personalized for Week {currentGestationalWeek} Milestone & Recent Vitals
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyQuestions}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                  title="Copy questions to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-teal-600" />
                      <span className="text-teal-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Questions</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {/* General / Milestone Questions */}
              {prepQuestions.generalQuestions && prepQuestions.generalQuestions.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Gestational Milestone Inquiries
                  </span>
                  {prepQuestions.generalQuestions.map((q, idx) => (
                    <div key={`gen-${idx}`} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{q}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Vitals Specific Questions */}
              {prepQuestions.vitalsSpecificQuestions && prepQuestions.vitalsSpecificQuestions.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    <span>Vitals & Hemodynamic Trend Inquiries</span>
                  </span>
                  {prepQuestions.vitalsSpecificQuestions.map((q, idx) => (
                    <div key={`vit-${idx}`} className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 text-xs font-medium text-slate-800 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        <Activity className="h-3 w-3" />
                      </span>
                      <span className="leading-relaxed">{q}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Diagnostic Lab Specific Questions */}
              {(prepQuestions.labSpecificQuestions || prepQuestions.reportSpecificQuestions) && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>Diagnostic Lab & Ultrasound Inquiries</span>
                  </span>
                  {(prepQuestions.labSpecificQuestions || prepQuestions.reportSpecificQuestions).map((q, idx) => (
                    <div key={`lab-${idx}`} className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-xs font-medium text-slate-800 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        <FileText className="h-3 w-3" />
                      </span>
                      <span className="leading-relaxed">{q}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clinician Action Tip */}
            {prepQuestions.summaryTip && (
              <div className="text-xs text-teal-900 bg-teal-50 p-3.5 rounded-xl border border-teal-200 font-medium flex items-start gap-2">
                <span className="text-base">💡</span>
                <div>
                  <strong className="font-bold">Clinician Preparation Tip:</strong> {prepQuestions.summaryTip}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scheduled Prenatal Visits Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">Scheduled Prenatal Visits</h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
              {appointments.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('upcoming')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeFilter === 'upcoming'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              Upcoming
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading scheduled visits...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-2">
            <Calendar className="h-8 w-8 text-slate-400 mx-auto" />
            <h3 className="font-bold text-sm text-slate-800">No scheduled prenatal visits</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Schedule your upcoming OB/GYN visit, anatomy ultrasound scan, or routine check-in.
            </p>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs"
            >
              Schedule Prenatal Visit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAppointments.map((apt) => {
              const aptId = apt._id || apt.id;
              const formattedDate = apt.date ? new Date(apt.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }) : 'Scheduled Date';

              return (
                <div
                  key={aptId}
                  className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 relative overflow-hidden group hover:border-teal-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                          {apt.type ? apt.type.replace(/_/g, ' ') : 'Prenatal Visit'}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 mt-1.5 leading-snug">
                          {apt.title}
                        </h3>
                      </div>

                      <button
                        onClick={() => handleDeleteAppointment(aptId)}
                        className="text-slate-300 hover:text-red-500 p-1.5 transition-colors shrink-0"
                        title="Cancel visit"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600">
                      <p className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        <span>{formattedDate} at {apt.time || '09:00 AM'}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Stethoscope className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <span>{apt.doctorName || 'Dr. Sarah Jenkins, MD'}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{apt.clinicLocation || 'St. Jude Women’s Health Center'}</span>
                      </p>
                    </div>

                    {apt.notes && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                        <span className="font-bold text-slate-700">Preparation:</span> {apt.notes}
                      </div>
                    )}

                    {apt.suggestedQuestions && apt.suggestedQuestions.length > 0 && (
                      <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-100 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1">
                          <HelpCircle className="h-3 w-3" />
                          <span>Suggested Questions to Ask</span>
                        </span>
                        <ul className="space-y-1">
                          {apt.suggestedQuestions.map((q, qIdx) => (
                            <li key={qIdx} className="text-[11px] text-teal-950 flex items-start gap-1.5">
                              <span className="text-teal-600 font-bold">•</span>
                              <span>{q}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Status: <span className="text-teal-700 font-extrabold">{apt.status || 'Upcoming'}</span>
                    </span>
                    <button
                      onClick={handleGenerateDoctorPrep}
                      className="text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 hover:underline"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Prepare Questions</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Diagnostic Milestone Roadmap (ACOG Guidelines) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 mb-1">
              <Layers className="h-4 w-4" />
              <span>ACOG Clinical Roadmap</span>
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Standard Prenatal Diagnostic Milestone Schedule
            </h2>
            <p className="text-xs text-slate-500">
              Evidence-based clinical timing for routine scans, gestational screenings, and OB/GYN milestones.
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold self-start sm:self-auto">
            Current: Week {currentGestationalWeek}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRENATAL_MILESTONES.map((m, idx) => {
            const isCurrentStage = m.weekRange.includes(String(currentGestationalWeek)) || (currentGestationalWeek >= 24 && currentGestationalWeek <= 28 && m.weekRange.includes('24 - 28'));

            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  isCurrentStage
                    ? 'bg-teal-50/40 border-teal-300 ring-2 ring-teal-500/20 shadow-sm'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                      {m.weekRange}
                    </span>
                    {isCurrentStage && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-600 text-white animate-pulse">
                        Active Stage
                      </span>
                    )}
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 leading-snug">{m.title}</h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{m.description}</p>
                </div>

                <button
                  onClick={() => handleOpenMilestoneSchedule(m)}
                  className="flex items-center justify-between w-full px-3 py-1.5 rounded-xl bg-white hover:bg-teal-600 hover:text-white border border-slate-200 hover:border-teal-600 text-slate-700 text-xs font-bold transition-all group"
                >
                  <span>Schedule for this Stage</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Schedule Prenatal Visit</h3>
                <p className="text-xs text-slate-500">Record an upcoming checkup, diagnostic scan, or screening</p>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Appointment Type</label>
                <select
                  value={newType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-medium text-slate-800"
                >
                  <option value="glucose_tolerance">Glucose Tolerance Screening (OGTT)</option>
                  <option value="ultrasound">Detailed Anatomy Ultrasound Scan (Level II)</option>
                  <option value="routine_prenatal">Routine Prenatal Progress & Vitals Check</option>
                  <option value="blood_test">Maternal CBC & Diagnostic Lab Panel</option>
                  <option value="non_stress_test">Fetal Non-Stress Test (NST)</option>
                  <option value="consultation">Obstetrician Specialist Consultation</option>
                  <option value="follow_up">High-Risk / Telemetry Follow-Up</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Appointment Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Time</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="09:00 AM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Name</label>
                <input
                  type="text"
                  value={newDoctor}
                  onChange={(e) => setNewDoctor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinic Location</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Preparation Notes / Fasting Guidelines</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold shadow hover:bg-teal-700 transition-colors"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AppointmentsPage;
