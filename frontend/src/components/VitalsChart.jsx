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

  if (!records || records.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400 text-xs">
        No longitudinal vitals telemetry logged yet.
      </div>
    );
  }

  const sortedRecords = [...records].sort((a, b) => a.week - b.week);
  const labels = sortedRecords.map(r => `Week ${r.week}`);

  const getChartData = () => {
    switch (metricMode) {
      case 'hr':
        return {
          labels,
          datasets: [
            {
              label: 'Resting Heart Rate (bpm)',
              data: sortedRecords.map(r => r.heartRate || 80),
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
              label: 'Fasting Blood Glucose (mg/dL)',
              data: sortedRecords.map(r => r.bloodGlucose || 90),
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
              data: sortedRecords.map(r => r.weight || 65),
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
              label: 'Systolic BP (Target < 120)',
              data: sortedRecords.map(r => r.bpSystolic || 120),
              borderColor: '#0f766e',
              backgroundColor: 'rgba(15, 118, 110, 0.1)',
              tension: 0.3,
              pointRadius: 5,
              pointBackgroundColor: '#0f766e',
            },
            {
              label: 'Diastolic BP (Target < 80)',
              data: sortedRecords.map(r => r.bpDiastolic || 80),
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
          Telemetry Trajectory
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
