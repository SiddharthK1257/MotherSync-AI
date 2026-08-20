import React, { useState } from 'react';
import { reportAPI } from '../services/api';
import { FileText, Upload, Sparkles, X, Loader2, AlertCircle, CheckCircle2, FileUp } from 'lucide-react';

export const ReportUploadModal = ({ isOpen, onClose, onReportAnalyzed }) => {
  const [reportTitle, setReportTitle] = useState('');
  const [reportType, setReportType] = useState('ultrasound');
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const samplePresets = {
    ultrasound: {
      title: '20-Week Detailed Anatomy Ultrasound Scan',
      type: 'ultrasound',
      fileName: 'Anatomy_Scan_Week20_Sample.pdf',
      text: 'CLINICAL ULTRASOUND REPORT: Gestational Age: 20 weeks 2 days. Single live intrauterine fetus. Cephalic presentation. Fetal Heart Rate: 146 bpm regular. Anatomical survey: Intracranial anatomy normal, 4-chamber cardiac view normal, stomach and urinary bladder visualized, spine intact, 4 extremities visualized with no gross structural deformities. Placenta: Anterior, grade 1, no previa. Amniotic fluid index: 14.2 cm (Normal). Estimated Fetal Weight: 340g (52nd percentile). IMPRESSION: Normal anatomical survey consistent with gestational dates.'
    },
    blood: {
      title: 'Second Trimester CBC & Ferritin Panel',
      type: 'blood_test',
      fileName: 'Maternal_CBC_Ferritin_Panel.pdf',
      text: 'LABORATORY REPORT - COMPLETE BLOOD COUNT: Hemoglobin: 11.2 g/dL (Ref: 11.0 - 14.5 g/dL). Hematocrit: 33.5% (Ref: 33 - 42%). Platelet Count: 245,000 /uL (Ref: 150k - 450k). Serum Ferritin: 24 ng/mL (Ref: 15 - 150 ng/mL). Blood Glucose (Fasting): 92 mg/dL (Ref: < 95 mg/dL). Blood Type: O Positive. Antibody Screen: Negative.'
    },
    glucose: {
      title: '26-Week 1-Hour Glucose Challenge Test (OGTT)',
      type: 'glucose_tolerance',
      fileName: 'OGTT_Screening_Results.pdf',
      text: 'LABORATORY REPORT: Oral Glucose Tolerance Screen (50g Glucose Load). Fasting Blood Sugar: 88 mg/dL (Ref: < 95 mg/dL). 1-Hour Post-Load Plasma Glucose: 126 mg/dL (Ref: < 140 mg/dL). IMPRESSION: Normal glucose tolerance screen. No evidence of gestational diabetes mellitus.'
    }
  };

  const handleApplyPreset = (key) => {
    const preset = samplePresets[key];
    setReportTitle(preset.title);
    setReportType(preset.type);
    setFileName(preset.fileName);
    setRawText(preset.text);
    setError(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      if (!reportTitle) setReportTitle(file.name.replace(/\.[^/.]+$/, ''));
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result;
        if (typeof content === 'string') {
          setRawText(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rawText.trim()) {
      setError('Please provide report text or select a demo sample.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await reportAPI.analyzeReport({
        title: reportTitle || 'Diagnostic Lab Report',
        type: reportType,
        fileName: fileName || `${reportType}_report.pdf`,
        rawText
      });

      if (res.data.success) {
        onReportAnalyzed?.(res.data.data);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to process report with AI agent.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Sparkles className="h-5 w-5 text-teal-200" />
            </div>
            <div>
              <h3 className="font-bold text-lg">AI Medical Report & Lab Analyzer</h3>
              <p className="text-xs text-teal-100">Extracts structured metrics, plain-language insights & doctor questions</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Quick Demo Presets */}
          <div className="p-3 rounded-2xl bg-teal-50/70 border border-teal-100 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
              ⚡ Quick Test Samples (Click to Autofill):
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset('ultrasound')}
                className="px-3 py-1.5 rounded-xl bg-white border border-teal-200 hover:border-teal-400 text-xs font-semibold text-teal-900 shadow-sm"
              >
                👶 20-Week Anatomy Scan
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('blood')}
                className="px-3 py-1.5 rounded-xl bg-white border border-teal-200 hover:border-teal-400 text-xs font-semibold text-teal-900 shadow-sm"
              >
                🩸 CBC & Ferritin Iron Panel
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('glucose')}
                className="px-3 py-1.5 rounded-xl bg-white border border-teal-200 hover:border-teal-400 text-xs font-semibold text-teal-900 shadow-sm"
              >
                🧪 Glucose OGTT Test
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Report Title</label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="e.g. 20-Week Ultrasound"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Report Category</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
              >
                <option value="ultrasound">Anatomy Ultrasound Scan</option>
                <option value="blood_test">Blood / CBC / Iron Panel</option>
                <option value="glucose_tolerance">Glucose Tolerance (OGTT)</option>
                <option value="urine_analysis">Urinalysis / Protein Dipstick</option>
                <option value="doctor_note">Physician Consultation Note</option>
              </select>
            </div>
          </div>

          {/* Upload or Paste Area */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">Lab Text / Report Findings</label>
              <label className="cursor-pointer text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                <FileUp className="h-3.5 w-3.5" />
                <span>Upload PDF / Text File</span>
                <input
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste raw laboratory report text, ultrasound summary, or lab values here..."
              className="w-full p-3 rounded-2xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            {fileName && (
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <FileText className="h-3 w-3 text-teal-600" />
                <span>Attached: {fileName}</span>
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white text-xs font-bold shadow-md shadow-teal-600/30 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Agent Analyzing Findings...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Analyze Report with AI Agent</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default ReportUploadModal;
