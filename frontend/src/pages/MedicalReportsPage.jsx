import React, { useState, useEffect } from 'react';
import { reportAPI } from '../services/api';
import ReportUploadModal from '../components/ReportUploadModal';
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Calendar
} from 'lucide-react';

export const MedicalReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await reportAPI.getReports();
      if (res.data.success) {
        setReports(res.data.data);
        if (res.data.data.length > 0) {
          setExpandedId(res.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Fetch reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReportAnalyzed = (newReport) => {
    setReports(prev => [newReport, ...prev]);
    setExpandedId(newReport._id);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-teal-600" />
            <span>Diagnostic Reports & Lab AI Interpreter</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            AI-powered plain language translation, structured lab extraction & physician talking points
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-teal-600/30 transition-all self-start sm:self-auto"
        >
          <Upload className="h-4 w-4" />
          <span>Upload & Analyze Report</span>
        </button>
      </div>

      {/* Reports Stream */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <FileText className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700">No medical reports uploaded yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Upload your 20-week anatomy ultrasound scan, CBC blood count, or glucose test to get an instant AI breakdown.
            </p>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold"
            >
              Upload First Report
            </button>
          </div>
        ) : (
          reports.map((rep) => {
            const isExpanded = expandedId === rep._id;

            return (
              <div
                key={rep._id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all"
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : rep._id)}
                  className="p-5 cursor-pointer flex items-center justify-between hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200">
                      <FileCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900">{rep.title}</h3>
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {rep.type?.replace('_', ' ')}
                        </span>
                        {rep.doctorReviewed && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Doctor Reviewed</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>Uploaded {new Date(rep.dateUploaded).toLocaleDateString()}</span>
                        {rep.fileName && <span>• {rep.fileName}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline-flex text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-xl">
                      {rep.structuredFindings?.length || 0} Findings Extracted
                    </span>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Analysis */}
                {isExpanded && (
                  <div className="p-6 border-t border-slate-100 bg-slate-50/40 space-y-6">
                    
                    {/* Layman Plain Language Summary */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-rose-50/50 border border-teal-200/70 space-y-1.5">
                      <div className="flex items-center gap-2 text-teal-900 font-bold text-xs">
                        <Sparkles className="h-4 w-4 text-teal-600" />
                        <span>AI Plain-Language Translation for Mother</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {rep.laymanExplanation || rep.aiSummary}
                      </p>
                    </div>

                    {/* Structured Findings Table */}
                    {rep.structuredFindings && rep.structuredFindings.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Structured Clinical Findings & Reference Intervals
                        </h4>
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                              <tr>
                                <th className="p-3">Biomarker / Measurement</th>
                                <th className="p-3">Result Value</th>
                                <th className="p-3">Reference Range</th>
                                <th className="p-3">Clinical Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {rep.structuredFindings.map((finding, fIdx) => (
                                <tr key={fIdx} className="hover:bg-slate-50/50">
                                  <td className="p-3 font-semibold text-slate-800">{finding.parameter}</td>
                                  <td className="p-3 font-bold text-teal-900">{finding.value} {finding.unit}</td>
                                  <td className="p-3 text-slate-500">{finding.referenceRange || 'Standard range'}</td>
                                  <td className="p-3">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      finding.status === 'abnormal' || finding.status === 'critical'
                                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                        : finding.status === 'borderline'
                                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    }`}>
                                      {finding.status?.toUpperCase() || 'NORMAL'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Questions for Doctor */}
                    {rep.questionsForDoctor && rep.questionsForDoctor.length > 0 && (
                      <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                          <HelpCircle className="h-4 w-4 text-teal-600" />
                          <span>Recommended Questions for Your Next Prenatal Visit</span>
                        </div>
                        <ul className="space-y-1.5">
                          {rep.questionsForDoctor.map((q, qIdx) => (
                            <li key={qIdx} className="text-xs text-slate-700 flex items-start gap-2">
                              <span className="text-teal-600 font-bold">•</span>
                              <span>{q}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Doctor Review Notes if present */}
                    {rep.doctorNotes && (
                      <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-1">
                        <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                          <Stethoscope className="h-4 w-4 text-indigo-600" />
                          <span>Physician Clinical Review & Notes</span>
                        </div>
                        <p className="text-xs text-indigo-950">{rep.doctorNotes}</p>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Upload Modal */}
      <ReportUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onReportAnalyzed={handleReportAnalyzed}
      />

    </div>
  );
};

export default MedicalReportsPage;
