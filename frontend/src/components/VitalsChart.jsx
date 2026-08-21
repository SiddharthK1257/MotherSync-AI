import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const VitalsChart = ({ records = [] }) => {
  const [metricMode, setMetricMode] = useState('bp'); // 'bp' | 'hr' | 'glucose' | 'weight'
  const [timeRange, setTimeRange] = useState('all'); // '7' | '30' | '90' | 'all'

  if (!records || records.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400 text-xs p-6 text-center space-y-1">
        <p className="font-semibold text-slate-600">No vitals recorded yet.</p>
        <p className="text-slate-400">Add your first reading to start tracking.</p>
      </div>
    );
  }

  // Filter records based on selected timeRange
  const filteredRecords = records.filter(r => {
    if (timeRange === 'all') return true;
    const days = Number(timeRange);
    const date = new Date(r.date || r.recordedAt || 0);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return date >= cutoff;
  });

  if (filteredRecords.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { id: '7', label: '7 Days' },
              { id: '30', label: '30 Days' },
              { id: '90', label: '90 Days' },
              { id: 'all', label: 'All Data' }
            ].map(range => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id)}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded-lg transition-all ${
                  timeRange === range.id ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-56 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs p-6 text-center space-y-1">
          <p className="font-semibold text-slate-600">No vitals recorded in the selected {timeRange}-day window.</p>
          <button onClick={() => setTimeRange('all')} className="text-teal-600 font-bold hover:underline">
            View All Historical Records ({records.length})
          </button>
        </div>
      </div>
    );
  }

  if (filteredRecords.length === 1) {
    const single = filteredRecords[0];
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Telemetry Status
          </span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { id: '7', label: '7 Days' },
              { id: '30', label: '30 Days' },
              { id: '90', label: '90 Days' },
              { id: 'all', label: 'All Data' }
            ].map(range => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id)}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded-lg transition-all ${
                  timeRange === range.id ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-56 flex flex-col items-center justify-center bg-teal-50/50 rounded-2xl border border-teal-200 text-teal-900 text-xs p-6 text-center space-y-2">
          <p className="font-bold text-sm">
            Latest Reading: {single.bpSystolic || single.systolicBP}/{single.bpDiastolic || single.diastolicBP} mmHg • HR: {single.heartRate} bpm
          </p>
          <p className="text-teal-700 max-w-sm">
            "Not enough historical data yet. Add additional readings to generate a trend."
          </p>
        </div>
      </div>
    );
  }

  const sortedRecords = [...filteredRecords].sort((a, b) => {
    const dateA = new Date(a.date || a.recordedAt || 0);
    const dateB = new Date(b.date || b.recordedAt || 0);
    return dateA - dateB;
  });

  const labels = sortedRecords.map(r => `Week ${r.week || 24}`);

  const getChartData = () => {
    switch (metricMode) {
      case 'hr':
        return {
          labels,
          datasets: [
            {
              label: 'Resting Heart Rate (bpm)',
              data: sortedRecords.map(r => r.heartRate || null),
              borderColor: '#f43f5e',
              backgroundColor: 'rgba(244, 63, 94, 0.1)',
              tension: 0.3,
              fill: true,
              pointRadius: 5,
              pointBackgroundColor: '#f43f5e',
            }
          ]
        };
      case 'glucose':
        return {
          labels,
          datasets: [
            {
              label: 'Blood Glucose (mg/dL)',
              data: sortedRecords.map(r => r.bloodGlucose || null),
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              tension: 0.3,
              fill: true,
              pointRadius: 5,
              pointBackgroundColor: '#8b5cf6',
            }
          ]
        };
      case 'weight':
        return {
          labels,
          datasets: [
            {
              label: 'Maternal Weight (kg)',
              data: sortedRecords.map(r => r.weight || null),
              borderColor: '#0284c7',
              backgroundColor: 'rgba(2, 132, 199, 0.1)',
              tension: 0.3,
              fill: true,
              pointRadius: 5,
              pointBackgroundColor: '#0284c7',
            }
          ]
        };
      case 'bp':
      default:
        return {
          labels,
          datasets: [
            {
              label: 'Systolic BP (Target < 130 mmHg)',
              data: sortedRecords.map(r => r.bpSystolic || r.systolicBP || null),
              borderColor: '#0f766e',
              backgroundColor: 'rgba(15, 118, 110, 0.1)',
              tension: 0.3,
              pointRadius: 5,
              pointBackgroundColor: '#0f766e',
            },
            {
              label: 'Diastolic BP (Target < 85 mmHg)',
              data: sortedRecords.map(r => r.bpDiastolic || r.diastolicBP || null),
              borderColor: '#06b6d4',
              backgroundColor: 'rgba(6, 182, 212, 0.1)',
              tension: 0.3,
              pointRadius: 5,
              pointBackgroundColor: '#06b6d4',
            }
          ]
        };
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' },
          color: '#334155',
          usePointStyle: true,
          boxWidth: 8
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: 'bold' },
        bodyFont: { family: 'Plus Jakarta Sans', size: 11 },
        padding: 10,
        cornerRadius: 8,
      }
    },
    scales: {
      x: {
        grid: { color: '#f1f5f9' },
        ticks: { font: { family: 'Plus Jakarta Sans', size: 10 }, color: '#64748b' }
      },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: { font: { family: 'Plus Jakarta Sans', size: 10 }, color: '#64748b' }
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Metric Switcher Tabs */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Telemetry Trajectory ({records.length} readings)
        </span>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'bp', label: 'Blood Pressure' },
            { id: 'hr', label: 'Heart Rate' },
            { id: 'glucose', label: 'Glucose' },
            { id: 'weight', label: 'Weight' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setMetricMode(tab.id)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                metricMode === tab.id
                  ? 'bg-white text-teal-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full">
        <Line data={getChartData()} options={options} />
      </div>
    </div>
  );
};

export default VitalsChart;
