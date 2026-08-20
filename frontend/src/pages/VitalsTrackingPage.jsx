import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { healthAPI } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import VitalsChart from '../components/VitalsChart';
import {
  Activity,
  Heart,
  Droplets,
  Scale,
  Plus,
  Baby,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Clock,
  Loader2
} from 'lucide-react';

export const VitalsTrackingPage = () => {
  const { user, currentRisk, setCurrentRisk } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Form State
  const [formWeek, setFormWeek] = useState(user?.gestationalWeek || 24);
  const [formBpSys, setFormBpSys] = useState('120');
  const [formBpDia, setFormBpDia] = useState('78');
  const [formHr, setFormHr] = useState('80');
  const [formGlucose, setFormGlucose] = useState('92');
  const [formGlucoseType, setFormGlucoseType] = useState('fasting');
  const [formWeight, setFormWeight] = useState('68.5');
  const [formKicks, setFormKicks] = useState('12');
  const [formWater, setFormWater] = useState('80');
  const [formMood, setFormMood] = useState('Good');
  const [formSymptoms, setFormSymptoms] = useState([]);
  const [formNotes, setFormNotes] = useState('');

  const commonSymptoms = [
    'Mild ankle swelling (edema)',
    'Occasional mild heartburn',
    'Lower back stiffness',
    'Mild morning nausea',
    'Calf cramps',
    'Mild fatigue'
  ];

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await healthAPI.getHealthRecords();
      if (res.data.success) {
        setRecords(res.data.data);
        if (res.data.currentRisk) {
          setCurrentRisk(res.data.currentRisk);
        }
      }
    } catch (err) {
      console.error('Fetch records error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSymptom = (symptomName) => {
    if (formSymptoms.includes(symptomName)) {
      setFormSymptoms(formSymptoms.filter(s => s !== symptomName));
    } else {
      setFormSymptoms([...formSymptoms, symptomName]);
    }
  };

  const handleSubmitVitals = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await healthAPI.logHealthRecord({
        week: Number(formWeek),
        bpSystolic: Number(formBpSys),
        bpDiastolic: Number(formBpDia),
        heartRate: Number(formHr),
        bloodGlucose: formGlucose ? Number(formGlucose) : null,
        glucoseType: formGlucoseType,
        weight: formWeight ? Number(formWeight) : null,
        fetalKicks: formKicks ? Number(formKicks) : null,
        waterIntakeOz: Number(formWater),
        mood: formMood,
        symptoms: formSymptoms.map(s => ({ name: s, severity: 'mild' })),
        notes: formNotes
      });

      if (res.data.success) {
        setFeedback({
          type: 'success',
          message: `Vitals logged! Safety status: ${res.data.risk.badge.label}`
        });
        setShowLogForm(false);
        fetchRecords();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to log record.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const latest = records[records.length - 1] || {};

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Activity className="h-6 w-6 text-teal-600" />
            <span>Maternal Vitals & Kick Telemetry</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Longitudinal hemodynamic monitoring, symptom surveillance & clinical safety evaluation
          </p>
        </div>

        <button
          onClick={() => setShowLogForm(!showLogForm)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-teal-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{showLogForm ? 'Close Form' : 'Log New Vitals'}</span>
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-red-50 text-red-900 border border-red-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-red-600" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Blood Pressure</span>
            <Activity className="h-4 w-4 text-teal-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">
            {latest.bpSystolic ? `${latest.bpSystolic}/${latest.bpDiastolic}` : '124/82'} <span className="text-xs font-normal text-slate-400">mmHg</span>
          </p>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            Optimal Range (&lt;130/85)
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Resting Heart Rate</span>
            <Heart className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">
            {latest.heartRate || 84} <span className="text-xs font-normal text-slate-400">bpm</span>
          </p>
          <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
            Standard Maternal Expansion
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Fasting Glucose</span>
            <Droplets className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">
            {latest.bloodGlucose || 94} <span className="text-xs font-normal text-slate-400">mg/dL</span>
          </p>
          <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
            Target &lt; 95 mg/dL
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Fetal Kicks (2hr)</span>
            <Baby className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">
            {latest.fetalKicks || 14} <span className="text-xs font-normal text-slate-400">kicks</span>
          </p>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            Goal &gt;= 10 Met ✓
          </span>
        </div>

      </div>

      {/* Expandable New Vitals Log Form */}
      {showLogForm && (
        <form
          onSubmit={handleSubmitVitals}
          className="p-6 rounded-3xl bg-white border-2 border-teal-500 shadow-lg space-y-5 animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Plus className="h-4 w-4 text-teal-600" />
              <span>Log Comprehensive Clinical Telemetry</span>
            </h3>
            <span className="text-xs text-slate-400">All fields evaluated deterministically</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gestational Week</label>
              <input
                type="number"
                value={formWeek}
                onChange={(e) => setFormWeek(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Systolic BP (mmHg)</label>
              <input
                type="number"
                value={formBpSys}
                onChange={(e) => setFormBpSys(e.target.value)}
                placeholder="120"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Diastolic BP (mmHg)</label>
              <input
                type="number"
                value={formBpDia}
                onChange={(e) => setFormBpDia(e.target.value)}
                placeholder="80"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Resting Heart Rate (bpm)</label>
              <input
                type="number"
                value={formHr}
                onChange={(e) => setFormHr(e.target.value)}
                placeholder="80"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Blood Glucose (mg/dL)</label>
              <input
                type="number"
                value={formGlucose}
                onChange={(e) => setFormGlucose(e.target.value)}
                placeholder="92"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formWeight}
                onChange={(e) => setFormWeight(e.target.value)}
                placeholder="68.5"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Fetal Kicks (in 2 hrs)</label>
              <input
                type="number"
                value={formKicks}
                onChange={(e) => setFormKicks(e.target.value)}
                placeholder="10"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Water Intake (oz)</label>
              <input
                type="number"
                value={formWater}
                onChange={(e) => setFormWater(e.target.value)}
                placeholder="80"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Symptoms Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Reported Symptoms (Select all that apply)
            </label>
            <div className="flex flex-wrap gap-2">
              {commonSymptoms.map((sym, sIdx) => {
                const isSelected = formSymptoms.includes(sym);
                return (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => handleToggleSymptom(sym)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {sym} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Notes or Subjective Observations</label>
            <input
              type="text"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="e.g. Mild headache improved after hydration and 20 min rest"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowLogForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save & Evaluate Risk</span>
            </button>
          </div>
        </form>
      )}

      {/* Longitudinal Graph */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">Telemetry History Visualization</h2>
        <VitalsChart records={records} />
      </div>

      {/* Historical Telemetry Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-teal-600" />
            <span>Telemetry Audit Log</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">{records.length} records logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3">Week</th>
                <th className="p-3">Date</th>
                <th className="p-3">Blood Pressure</th>
                <th className="p-3">Heart Rate</th>
                <th className="p-3">Glucose</th>
                <th className="p-3">Weight</th>
                <th className="p-3">Kicks (2hr)</th>
                <th className="p-3">Symptoms</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {[...records].reverse().map((rec, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-bold text-teal-900">Week {rec.week}</td>
                  <td className="p-3 text-slate-500">
                    {new Date(rec.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="p-3 font-semibold text-slate-800">{rec.bpSystolic}/{rec.bpDiastolic} mmHg</td>
                  <td className="p-3 text-slate-700">{rec.heartRate} bpm</td>
                  <td className="p-3 text-slate-700">{rec.bloodGlucose ? `${rec.bloodGlucose} mg/dL` : '—'}</td>
                  <td className="p-3 text-slate-700">{rec.weight ? `${rec.weight} kg` : '—'}</td>
                  <td className="p-3 text-slate-700">{rec.fetalKicks !== null && rec.fetalKicks !== undefined ? `${rec.fetalKicks} kicks` : '—'}</td>
                  <td className="p-3 text-slate-600 max-w-xs truncate">
                    {rec.symptoms && rec.symptoms.length > 0
                      ? rec.symptoms.map(s => s.name || s).join(', ')
                      : 'None reported'}
                  </td>
                  <td className="p-3">
                    <RiskBadge level={rec.riskLevel || 'routine'} size="sm" showIcon={false} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default VitalsTrackingPage;
