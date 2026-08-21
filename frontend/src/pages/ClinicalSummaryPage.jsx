import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { pdfAPI, healthAPI, reportAPI } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import {
  FileDown,
  Printer,
  FileCheck,
  CheckCircle2,
  Activity,
  Calendar,
  Sparkles,
  Heart,
  Loader2
} from 'lucide-react';

export const ClinicalSummaryPage = () => {
  const { user, currentRisk } = useAuth();
  const [records, setRecords] = useState([]);
  const [reports, setReports] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recRes, repRes] = await Promise.allSettled([
        healthAPI.getHealthRecords(),
        reportAPI.getReports()
      ]);

      if (recRes.status === 'fulfilled' && recRes.value.data.data) {
        setRecords(recRes.value.data.data);
      }
      if (repRes.status === 'fulfilled' && repRes.value.data.data) {
        setReports(repRes.value.data.data);
      }
    } catch (err) {
      console.warn('Summary fetch error:', err);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const blob = await pdfAPI.downloadPdfSummary();
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MotherSync_Clinical_Summary_${(user?.name || 'Patient').replace(/\s+/g, '_')}_Wk${user?.gestationalWeek || 24}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('PDF download error:', err);
      // Fallback: direct window open
      window.open(pdfAPI.getPdfSummaryUrl(), '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-5xl mx-auto">
      
      {/* Header with Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileDown className="h-6 w-6 text-teal-600" />
            <span>Clinical Telemetry & Visit Summary</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Doctor-ready longitudinal report with hemodynamic logs, lab findings, and tailored discussion points
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-teal-600/30 transition-all disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />
                <span>Download Official PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Printable Clinical Sheet Preview Card */}
      <div className="bg-white rounded-3xl border border-slate-300 shadow-xl overflow-hidden print:border-none print:shadow-none">
        
        {/* Document Header Banner */}
        <div className="bg-teal-800 text-white p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-teal-300 text-xs font-bold tracking-widest uppercase">
                <Heart className="h-4 w-4 fill-teal-300" />
                <span>MotherSync AI — Clinical Telemetry Summary</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
                PREGNANCY HEALTH & PREPAREDNESS DOSSIER
              </h2>
            </div>
            <div className="text-right text-xs text-teal-200">
              <p>Generated: {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
              <p className="font-mono text-[11px] text-teal-300">Document ID: #MS-{Date.now().toString().slice(-6)}</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Patient Demographics */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="font-bold text-slate-400 uppercase text-[10px]">Patient Name</p>
              <p className="font-bold text-sm text-slate-900 mt-0.5">{user?.name || 'Patient'}</p>
              <p className="text-slate-500">Blood Group: {user?.bloodGroup || 'O+'} | G1P0</p>
            </div>
            <div>
              <p className="font-bold text-slate-400 uppercase text-[10px]">Gestational Stage</p>
              <p className="font-bold text-sm text-slate-900 mt-0.5">Week {user?.gestationalWeek || 24}</p>
              <p className="text-slate-500">Trimester {user?.gestationalWeek <= 13 ? 1 : user?.gestationalWeek <= 27 ? 2 : 3}</p>
            </div>
            <div>
              <p className="font-bold text-slate-400 uppercase text-[10px]">Estimated Due Date</p>
              <p className="font-bold text-sm text-slate-900 mt-0.5">
                {user?.dueDate ? new Date(user.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Calculated based on LMP'}
              </p>
              <p className="text-slate-500">Singleton Gestation</p>
            </div>
            <div>
              <p className="font-bold text-slate-400 uppercase text-[10px]">Primary OB/GYN</p>
              <p className="font-bold text-sm text-slate-900 mt-0.5">Dr. Sarah Jenkins, MD</p>
              <p className="text-slate-500">St. Jude Maternal Care</p>
            </div>
          </div>

          {/* Current Risk Status Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Safety Engine Status Stratification
              </p>
              <h3 className="font-bold text-sm text-emerald-950 mt-0.5">
                {currentRisk?.badge?.label || 'ROUTINE MONITORING'}
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                {currentRisk?.summaryRationale || 'Vital signs within normal physiological reference ranges for current gestational stage.'}
              </p>
            </div>
            <RiskBadge level={currentRisk?.riskLevel || 'routine'} size="md" />
          </div>

          {/* Longitudinal Telemetry History Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-2">
              <Activity className="h-4 w-4 text-teal-600" />
              <span>Longitudinal Vitals & Symptom Trends</span>
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Week</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">BP (mmHg)</th>
                    <th className="p-2.5">Heart Rate</th>
                    <th className="p-2.5">Fasting Glucose</th>
                    <th className="p-2.5">Weight (kg)</th>
                    <th className="p-2.5">Symptoms</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-6 text-center text-slate-400 text-xs italic">
                        No health records available yet. Add your first vital reading or upload a medical report.
                      </td>
                    </tr>
                  ) : (
                    records.slice(-5).map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-teal-900">Wk {r.week || user?.gestationalWeek || 24}</td>
                        <td className="p-2.5 text-slate-500">{new Date(r.date || r.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                        <td className="p-2.5 font-semibold text-slate-800">{r.bpSystolic}/{r.bpDiastolic}</td>
                        <td className="p-2.5 text-slate-700">{r.heartRate} bpm</td>
                        <td className="p-2.5 text-slate-700">{r.bloodGlucose ? `${r.bloodGlucose} mg/dL` : '—'}</td>
                        <td className="p-2.5 text-slate-700">{r.weight ? `${r.weight} kg` : '—'}</td>
                        <td className="p-2.5 text-slate-600">
                          {r.symptoms?.length > 0 ? r.symptoms.map(s => s.name || s).join(', ') : 'None'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Diagnostic Lab Highlights */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-teal-600" />
              <span>Diagnostic Lab & Ultrasound Highlights</span>
            </h3>

            {reports.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 text-xs italic text-center">
                No uploaded laboratory or ultrasound reports yet. Upload a report in the Medical Reports module to extract clinical biomarkers.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {reports.slice(0, 4).map((rep) => (
                  <div key={rep._id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">{rep.title}</p>
                      <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                        {rep.type?.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-snug">{rep.aiSummary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tailored Questions for Doctor */}
          <div className="p-5 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900">
              Recommended Questions for Clinician Discussion
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-teal-950 font-medium">
              <li>Are my latest recorded blood pressure ({records.length > 0 ? `${records[records.length - 1].bpSystolic}/${records[records.length - 1].bpDiastolic} mmHg` : 'readings'}) and resting pulse within expected physiological ranges for Week {user?.gestationalWeek || 24}?</li>
              <li>Do my recent laboratory findings and hemoglobin/ferritin values warrant adjustments to prenatal iron or multivitamin supplementation?</li>
              <li>What specific clinical preparation and testing protocols are recommended for my upcoming gestational milestones?</li>
            </ol>
          </div>

          {/* Disclaimer */}
          <div className="p-4 rounded-2xl bg-slate-100 text-[10px] text-slate-500 leading-relaxed space-y-1">
            <p className="font-bold text-slate-700">CLINICAL DISCLAIMER & REGULATORY NOTICE:</p>
            <p>
              MotherSync AI is an educational tracking and clinical coordination tool designed to facilitate patient-physician dialogue. It is NOT a diagnostic medical device and does NOT replace the clinical judgment of an obstetrician, nurse midwife, or emergency medical services.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};

export default ClinicalSummaryPage;
