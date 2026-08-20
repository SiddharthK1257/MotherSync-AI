import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Heart, Sparkles, Stethoscope, Baby, ShieldCheck, Lock, Mail, User, Phone, Calendar } from 'lucide-react';

export const LoginPage = ({ onLoginSuccess }) => {
  const { login, register, demoLogin } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [gestationalWeek, setGestationalWeek] = useState(24);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegisterMode) {
        await register({
          name,
          email,
          password,
          phone,
          gestationalWeek: Number(gestationalWeek),
          role: 'patient'
        });
      } else {
        await login(email, password);
      }
      onLoginSuccess?.();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (role) => {
    setLoading(true);
    setError(null);
    try {
      await demoLogin(role);
      onLoginSuccess?.();
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 selection:bg-teal-500 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-fadeIn">
        
        {/* Header Hero */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white p-6 sm:p-8 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white mx-auto shadow-md">
            <Heart className="h-6 w-6 fill-white/20 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">MotherSync AI</h1>
          <p className="text-xs text-teal-100/90 font-medium max-w-xs mx-auto">
            AI-Native Pregnancy Health Monitoring, Multi-Agent Orchestration & Care Coordination
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Quick 1-Click Demo Testing Buttons */}
          <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-teal-900">
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              <span>1-Click Instant Demo Evaluation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemo('patient')}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
              >
                <Baby className="h-4 w-4" />
                <span>Test as Patient</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemo('doctor')}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
              >
                <Stethoscope className="h-4 w-4" />
                <span>Test as Doctor</span>
              </button>
            </div>
            <p className="text-[10px] text-teal-700 text-center">
              Preloads Elena Vance (Week 24) or Dr. Sarah Jenkins credentials
            </p>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Or with credentials
            </span>
          </div>

          {/* Standard Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Elena Vance"
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Gestational Week</label>
                    <input
                      type="number"
                      value={gestationalWeek}
                      onChange={(e) => setGestationalWeek(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      min={1}
                      max={42}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="elena@mothersync.ai"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 font-medium bg-red-50 p-2.5 rounded-xl border border-red-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-bold text-xs shadow-md shadow-teal-600/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : isRegisterMode ? 'Create Mother Account' : 'Sign In'}
            </button>
          </form>

          {/* Toggle Register / Login */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800"
            >
              {isRegisterMode
                ? 'Already have an account? Sign in'
                : "New mother? Register your pregnancy journey"}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default LoginPage;
