import React, { useState, useEffect } from 'react';
import { Baby, Play, Pause, RotateCcw, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { kicksAPI } from '../services/api';

export const KickCounterWidget = ({ onKickLogged }) => {
  const [kicks, setKicks] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleKickTap = () => {
    if (!isActive) setIsActive(true);
    const nextCount = kicks + 1;
    setKicks(nextCount);

    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleReset = () => {
    setIsActive(false);
    setSeconds(0);
    setKicks(0);
    setSaveSuccess(null);
  };

  const handleSaveKickSession = async () => {
    if (kicks === 0) return;
    setIsSaving(true);
    try {
      const durationMins = Math.max(1, Math.round(seconds / 60));
      const res = await kicksAPI.logKick({
        kickCount: kicks,
        duration: durationMins,
        notes: 'User logged kick counting session'
      });

      setSaveSuccess(res.data.feedback || 'Kick session logged to MongoDB!');
      setIsActive(false);
      if (onKickLogged) onKickLogged(res.data);
    } catch (err) {
      console.error('Kick log error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const isGoalReached = kicks >= 10;

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50 via-white to-teal-50/50 border border-rose-200/70 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-rose-800">
          <Baby className="h-5 w-5" />
          <h3 className="font-bold text-sm">Fetal Kick Counter (Goal: 10 Movements)</h3>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/80 border border-slate-200 text-slate-700">
          <span>{formatTime(seconds)}</span>
        </div>
      </div>

      {/* Progress & Target */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-600">Progress toward session benchmark:</span>
          <span className={isGoalReached ? 'text-emerald-700 font-bold' : 'text-slate-900 font-bold'}>
            {kicks} / 10 movements
          </span>
        </div>

        <div className="w-full bg-rose-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-300 ${
              isGoalReached ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
            style={{ width: `${Math.min(100, (kicks / 10) * 100)}%` }}
          />
        </div>
      </div>

      {/* Interactive Kick Tap Button */}
      <div className="flex flex-col items-center justify-center py-2">
        <button
          type="button"
          onClick={handleKickTap}
          className="relative group w-28 h-28 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 text-white font-black text-2xl shadow-lg shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 border-4 border-white"
        >
          <Baby className="h-7 w-7 transition-transform group-hover:scale-110" />
          <span className="text-sm font-bold tracking-wider uppercase">TAP KICK</span>
        </button>
        <p className="text-[11px] text-slate-500 mt-2">Tap each time you feel a distinct baby movement</p>
      </div>

      {/* Milestone note */}
      {isGoalReached && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
          <span><strong>10 Movements Reached!</strong> Session benchmark recorded in database.</span>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-rose-100">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsActive(!isActive)}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1"
          >
            {isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span>{isActive ? 'Pause' : 'Start'}</span>
          </button>

          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 text-xs"
            title="Reset Counter"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          onClick={handleSaveKickSession}
          disabled={kicks === 0 || isSaving}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            kicks > 0
              ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isSaving ? 'Logging...' : 'Save Session'}
        </button>
      </div>

      {saveSuccess && (
        <p className="text-[11px] text-emerald-700 font-medium text-center">{saveSuccess}</p>
      )}

      <p className="text-[9px] text-slate-400 text-center leading-tight">
        Kick counting is a supportive self-monitoring exercise and does not guarantee fetal health. Contact your clinic if you notice a significant decrease in movements.
      </p>
    </div>
  );
};

export default KickCounterWidget;
