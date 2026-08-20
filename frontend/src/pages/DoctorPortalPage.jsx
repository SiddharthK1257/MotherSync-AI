import React, { useState, useEffect } from 'react';
import { doctorAPI, reportAPI } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import VitalsChart from '../components/VitalsChart';
import {
  Stethoscope,
  Users,
  Activity,
  FileCheck,
  CheckCircle2,
  FileDown,
  Calendar,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  Heart
} from 'lucide-react';

export const DoctorPortalPage = ({ setActiveTab }) => {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [doctorNoteInput, setDoctorNoteInput] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteFeedback, setNoteFeedback] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await doctorAPI.getPatients();
      if (res.data.success && res.data.data.length > 0) {
        setPatients(res.data.data);
        setSelectedPatientId(res.data.data[0]._id);
        fetchDossier(res.data.data[0]._id);
      }
    } catch (err) {
      console.error('Fetch doctor patients error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDossier = async (id) => {
    try {
      const res = await doctorAPI.getPatientDossier(id);
      if (res.data.success) {
        setDossier(res.data);
      }
    } catch (err) {
      console.error('Fetch dossier error:', err);
    }
  };

  const handleSelectPatient = (id) => {
    setSelectedPatientId(id);
    fetchDossier(id);
  };

  const handleSaveDoctorReview = async (reportId) => {
    if (!doctorNoteInput.trim()) return;
    setSavingNote(true);
    try {
      const res = await reportAPI.doctorReviewReport(reportId, doctorNoteInput);
      if (res.data.success) {
        setNoteFeedback('Physician notes saved and attached to patient chart.');
        fetchDossier(selectedPatientId);
        setDoctorNoteInput('');
      }
    } catch (err) {
      setNoteFeedback('Failed to save doctor note.');
    } finally {
      setSavingNote(false);
    }
  };

  const currentPatient = dossier?.patient || patients[0];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Stethoscope className="h-6 w-6 text-indigo-600" />
            <span>Physician Clinical Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dr. Sarah Jenkins, MD (FACOG) • St. Jude Maternal-Fetal Medicine Center
          </p>
        </div>

        <button
          onClick={() => setActiveTab('clinical-summary')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all self-start sm:self-auto"
        >
          <FileDown className="h-4 w-4" />
          <span>Export Clinical Summary PDF</span>
        </button>
      </div>

      {/* Main Grid: Patients List on Left, Active Dossier on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Patient Roster */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" />
              <span>Assigned Patients ({patients.length})</span>
            </h2>
          </div>

          <div className="space-y-2">
            {patients.map((pat) => (
              <div
                key={pat._id}
                onClick={() => handleSelectPatient(pat._id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedPatientId === pat._id
                    ? 'bg-indigo-50/70 border-indigo-300 shadow-sm ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{pat.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Week {pat.gestationalWeek} • Due {new Date(pat.dueDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <RiskBadge level={pat.riskStatus?.riskLevel || 'routine'} size="sm" showIcon={false} />
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-between text-xs text-slate-600">
                  <span>Latest BP: <strong>{pat.latestVitals?.bp || '124/82'}</strong></span>
                  <span>HR: <strong>{pat.latestVitals?.hr || '84 bpm'}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 Columns: Patient Detailed Dossier */}
        <div className="lg:col-span-2 space-y-6">
          {dossier ? (
            <>
              {/* Patient Profile Card */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-extrabold text-slate-900">{currentPatient.name}</h2>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-semibold">
                        G1P0 • Week {currentPatient.gestationalWeek}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Phone: {currentPatient.phone} | Emergency Contact: Marcus Vance (+1 555-789-0123)
                    </p>
                  </div>

                  <RiskBadge level={dossier.currentRisk?.riskLevel || 'routine'} size="md" />
                </div>

                {/* Medical Background Tags */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Allergies</p>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {(currentPatient.maternalInfo?.allergies || ['Penicillin']).join(', ')}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Prescriptions</p>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {(currentPatient.maternalInfo?.currentMedications || ['Prenatal Multi', 'Oral Iron 65mg']).join(', ')}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Baseline Vitals</p>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      BP 118/76 | HR 78 | Fasting 92
                    </p>
                  </div>
                </div>
              </div>

              {/* Vitals Telemetry Trends */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-600" />
                  <span>Longitudinal Hemodynamic Trends</span>
                </h3>
                <VitalsChart records={dossier.healthRecords || []} />
              </div>

              {/* Diagnostic Reports & Doctor Notes */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-indigo-600" />
                  <span>Diagnostic Lab & Ultrasound Records</span>
                </h3>

                <div className="space-y-4">
                  {(dossier.medicalReports || []).map((rep) => (
                    <div key={rep._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{rep.title}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">{rep.aiSummary}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200 font-bold text-slate-700">
                          {rep.type?.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Doctor Notes Attachment */}
                      <div className="pt-2 border-t border-slate-200 space-y-2">
                        <label className="block text-[11px] font-bold text-indigo-900">
                          Physician Chart Notes / Clinical Orders:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            defaultValue={rep.doctorNotes || ''}
                            onChange={(e) => setDoctorNoteInput(e.target.value)}
                            placeholder="e.g. Normal fetal biometry confirmed. Continue oral iron 65mg."
                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                          />
                          <button
                            onClick={() => handleSaveDoctorReview(rep._id)}
                            disabled={savingNote}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {noteFeedback && (
                  <p className="text-xs text-emerald-700 font-medium">{noteFeedback}</p>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <p className="text-xs text-slate-400">Select a patient to inspect their clinical dossier.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default DoctorPortalPage;
