import React, { useState, useRef } from 'react';
import { reportAPI } from '../services/api';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  X, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  FileUp, 
  Camera, 
  Image as ImageIcon,
  Check
} from 'lucide-react';

export const ReportUploadModal = ({ isOpen, onClose, onReportAnalyzed }) => {
  const [activeInputTab, setActiveInputTab] = useState('file'); // 'file' | 'text' | 'presets'
  const [reportTitle, setReportTitle] = useState('');
  const [reportType, setReportType] = useState('ultrasound');
  const [selectedFile, setSelectedFile] = useState(null);
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  if (!isOpen) return null;

  const loadingSteps = [
    'Uploading report...',
    'Reading document & extracting text...',
    'Extracting clinical parameters...',
    'Analyzing with Gemini AI...',
    'Saving findings to MongoDB...',
    'Updating Pregnancy Command Center...'
  ];

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
    setSelectedFile(null);
    setActiveInputTab('text');
    setError(null);
  };

  const handleFileSelection = (file) => {
    if (!file) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'text/plain'];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|jpe?g|png|webp|txt)$/i)) {
      setError('Unsupported file type. Please upload PDF, JPG, JPEG, PNG, or WEBP.');
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
    if (!reportTitle) {
      setReportTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
    }
    setError(null);

    // If text file, also extract preview
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          setRawText(e.target.result);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelection(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile && !rawText.trim()) {
      setError('Please select a medical report file (PDF/Image) or paste report text.');
      return;
    }

    setIsLoading(true);
    setLoadingStep(0);
    setError(null);

    const stepTimer = setInterval(() => {
      setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 1200);

    try {
      let res;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', reportTitle || selectedFile.name.replace(/\.[^/.]+$/, ''));
        formData.append('reportType', reportType);
        if (rawText) formData.append('rawText', rawText);

        res = await reportAPI.uploadFile(formData);
      } else {
        res = await reportAPI.analyzeReport({
          title: reportTitle || 'Diagnostic Lab Report',
          type: reportType,
          fileName: fileName || `${reportType}_report.pdf`,
          rawText
        });
      }

      clearInterval(stepTimer);

      if (res.data?.success) {
        onReportAnalyzed?.(res.data.data);
        onClose();
      } else {
        setError(res.data?.message || 'Failed to process report with AI agent.');
      }
    } catch (err) {
      clearInterval(stepTimer);
      setError(err.message || 'Failed to analyze report. Please ensure the document is clear.');
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
              <p className="text-xs text-teal-100">Extracts structured parameters, plain-language insights & doctor questions (PDF, JPG, PNG, WEBP)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Input Method Switcher */}
          <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveInputTab('file')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeInputTab === 'file'
                  ? 'bg-white text-teal-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileUp className="h-3.5 w-3.5 text-teal-600" />
              <span>Upload Document / Image</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveInputTab('text')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeInputTab === 'text'
                  ? 'bg-white text-teal-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-teal-600" />
              <span>Paste Report Text</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveInputTab('presets')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeInputTab === 'presets'
                  ? 'bg-white text-teal-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              <span>Demo Samples</span>
            </button>
          </div>

          {/* Quick Demo Presets Tab */}
          {activeInputTab === 'presets' && (
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-100 space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                ⚡ Click any sample to load authentic clinical test data:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('ultrasound')}
                  className="p-2.5 rounded-xl bg-white border border-teal-200 hover:border-teal-400 text-xs font-semibold text-teal-900 shadow-xs text-left"
                >
                  👶 20-Week Anatomy Scan
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('blood')}
                  className="p-2.5 rounded-xl bg-white border border-teal-200 hover:border-teal-400 text-xs font-semibold text-teal-900 shadow-xs text-left"
                >
                  🩸 CBC & Ferritin Panel
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('glucose')}
                  className="p-2.5 rounded-xl bg-white border border-teal-200 hover:border-teal-400 text-xs font-semibold text-teal-900 shadow-xs text-left"
                >
                  🧪 Glucose OGTT Test
                </button>
              </div>
            </div>
          )}

          {/* Form Fields: Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Report Title</label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="e.g. 20-Week Ultrasound Scan"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Report Category</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-medium"
              >
                <option value="ultrasound">Anatomy Ultrasound Scan (Level II / Growth)</option>
                <option value="blood_test">Complete Blood Count (CBC) / Iron Ferritin</option>
                <option value="glucose_tolerance">Glucose Tolerance Screening (OGTT)</option>
                <option value="urine_analysis">Urinalysis / Protein Dipstick</option>
                <option value="prescription">Prescription / Medication Slip</option>
                <option value="doctor_note">Physician Consultation Summary</option>
                <option value="other">Other Diagnostic Document</option>
              </select>
            </div>
          </div>

          {/* File Upload Zone */}
          {activeInputTab === 'file' && (
            <div>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-teal-500 bg-teal-50/50'
                    : selectedFile
                    ? 'border-teal-300 bg-teal-50/20'
                    : 'border-slate-300 hover:border-teal-400 bg-slate-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.txt"
                  onChange={(e) => handleFileSelection(e.target.files?.[0])}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleFileSelection(e.target.files?.[0])}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
                      <FileCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{selectedFile.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Ready for Gemini extraction
                      </p>
                    </div>
                    <span className="inline-block text-[11px] font-semibold text-teal-600 hover:underline">
                      Click to choose another file
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto border border-teal-100">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">
                        Drag & Drop your report here, or <span className="text-teal-600">Browse Files</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Supports PDF, JPG, JPEG, PNG, WEBP (up to 20MB)
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          cameraInputRef.current?.click();
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold shadow-xs"
                      >
                        <Camera className="h-3.5 w-3.5 text-teal-600" />
                        <span>Take Photo / Camera</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Paste Raw Text Tab */}
          {activeInputTab === 'text' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Medical Report Text / Laboratory Findings
              </label>
              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste raw laboratory report text, ultrasound summary, or lab values here..."
                className="w-full p-3.5 rounded-2xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          )}

          {/* Loading States Progress Overlay */}
          {isLoading && (
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-xs">
                <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                <span>{loadingSteps[loadingStep]}</span>
              </div>
              <div className="w-full bg-teal-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-teal-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
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
                  <span>Processing with Gemini AI...</span>
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

// Component for file check icon in JSX
const FileCheck = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default ReportUploadModal;
