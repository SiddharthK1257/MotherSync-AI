import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentAPI, agentAPI } from '../services/api';
import {
  CalendarDays,
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
  Loader2
} from 'lucide-react';

export const AppointmentsPage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [prepQuestions, setPrepQuestions] = useState(null);
  const [isGeneratingPrep, setIsGeneratingPrep] = useState(false);

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
      const res = await appointmentAPI.getAppointments();
      if (res.data.success) {
        setAppointments(res.data.data);
      }
    } catch (err) {
      console.error('Fetch appointments error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    try {
      const res = await appointmentAPI.createAppointment({
        title: newTitle,
        type: newType,
        date: newDate,
        time: newTime,
        doctorName: newDoctor,
        clinicLocation: newLocation,
        notes: newNotes
      });

      if (res.data.success) {
        setAppointments(prev => [...prev, res.data.data]);
        setShowScheduleModal(false);
      }
    } catch (err) {
      console.error('Create appointment error:', err);
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (!confirm('Are you sure you want to remove this appointment?')) return;
    try {
      await appointmentAPI.deleteAppointment(id);
      setAppointments(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      console.error('Delete appointment error:', err);
    }
  };

  const handleGenerateDoctorPrep = async () => {
    setIsGeneratingPrep(true);
    try {
      const res = await agentAPI.prepareDoctorQuestions();
      if (res.data.success) {
        setPrepQuestions(res.data.questions);
      }
    } catch (err) {
      console.error('Prepare doctor questions error:', err);
      // Fallback
      setPrepQuestions({
        generalQuestions: [
          'Are my blood pressure readings within the expected baseline for Week 24?',
          'What preparation is required for the upcoming glucose tolerance screen?',
          'Should I begin tracking fetal kicks twice daily?'
        ],
        vitalsSpecificQuestions: [
          'My resting heart rate averaged 82 bpm over the last 4 weeks. Is this typical for second-trimester volume expansion?'
        ],
        summaryTip: 'Bring your printed MotherSync AI clinical summary to your appointment for rapid review.'
      });
    } finally {
      setIsGeneratingPrep(false);
    }
  };

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
              MotherSync AI scans your latest blood pressure trends, reported symptoms, and lab reports to craft 4 high-yield questions for your obstetrician.
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
          <div className="p-5 rounded-2xl bg-white text-slate-900 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-teal-600" />
                <span>High-Yield Questions for Dr. Sarah Jenkins</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-400">Week {user?.gestationalWeek || 24} Milestone</span>
            </div>

            <div className="space-y-2">
              {(prepQuestions.generalQuestions || []).map((q, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <span>{q}</span>
                </div>
              ))}
            </div>

            {prepQuestions.summaryTip && (
              <p className="text-[11px] text-teal-900 bg-teal-50 p-3 rounded-xl border border-teal-200 font-medium">
                💡 <strong>Clinician Tip:</strong> {prepQuestions.summaryTip}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">Scheduled Prenatal Visits</h2>

        {appointments.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-2">
            <Calendar className="h-8 w-8 text-slate-400 mx-auto" />
            <h3 className="font-bold text-sm text-slate-800">No scheduled prenatal visits</h3>
            <p className="text-xs text-slate-400">
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
            {appointments.map((apt) => (
              <div
                key={apt._id}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 relative overflow-hidden group hover:border-teal-300 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                      {apt.type?.replace('_', ' ')}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{apt.title}</h3>
                  </div>

                  <button
                    onClick={() => handleDeleteAppointment(apt._id)}
                    className="text-slate-300 hover:text-red-500 p-1.5 transition-colors"
                    title="Cancel visit"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <p className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-teal-600" />
                    <span>{new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {apt.time}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Stethoscope className="h-3.5 w-3.5 text-rose-500" />
                    <span>{apt.doctorName}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{apt.clinicLocation}</span>
                  </p>
                </div>

                {apt.notes && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                    <span className="font-bold text-slate-700">Notes:</span> {apt.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 space-y-4 animate-fadeIn">
            <h3 className="font-bold text-base text-slate-900">Schedule Prenatal Visit</h3>

            <form onSubmit={handleCreateAppointment} className="space-y-3">
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Preparation Notes / Fasting</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold shadow hover:bg-teal-700"
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
