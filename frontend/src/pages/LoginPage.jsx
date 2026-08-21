import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Heart, 
  Sparkles, 
  Stethoscope, 
  Baby, 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  Calendar,
  Eye,
  EyeOff,
  Building,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export const LoginPage = ({ onLoginSuccess }) => {
  const { login, register, demoLogin } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [registerRole, setRegisterRole] = useState('patient');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [gestationalWeek, setGestationalWeek] = useState(24);
  const [hospitalAffiliation, setHospitalAffiliation] = useState('St. Jude Maternal Care');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegisterMode) {
        const payload = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim(),
          role: registerRole,
          gestationalWeek: registerRole === 'patient' ? Number(gestationalWeek) : 24,
          hospital: registerRole === 'doctor' ? hospitalAffiliation : undefined
        };
        const res = await register(payload);
        onLoginSuccess?.(res?.user?.role || registerRole);
      } else {
        const res = await login(email.trim().toLowerCase(), password);
        onLoginSuccess?.(res?.user?.role || 'patient');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (role) => {
    setLoading(true);
    setError(null);
    try {
      const res = await demoLogin(role);
      onLoginSuccess?.(res?.user?.role || role);
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const prefillDemoCredentials = (role) => {
    setIsRegisterMode(false);
    setError(null);
    if (role === 'patient') {
      setEmail('elena@mothersync.ai');
      setPassword('Password123!');
    } else {
      setEmail('doctor@mothersync.ai');
      setPassword('DoctorPass123!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 selection:bg-teal-500 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-fadeIn">
        
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white p-6 sm:p-8 text-center space-y-2 relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white mx-auto shadow-md">
            <Heart className="h-6 w-6 fill-white/20 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">MotherSync AI</h1>
          <p className="text-xs text-teal-100/90 font-medium max-w-xs mx-auto">
            AI-Native Pregnancy Health Monitoring, Multi-Agent Care & Clinical Decision Engine
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Quick 1-Click Demo Evaluation Box */}
          <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-teal-950">
                <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                <span>1-Click Instant Evaluation</span>
              </span>
              <span className="text-[10px] bg-teal-200 text-teal-900 px-2 py-0.5 rounded-full font-bold">
                Fast Track
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemo('patient')}
                disabled={loading}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
              >
                <Baby className="h-4 w-4 shrink-0" />
                <span>Test as Patient</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemo('doctor')}
                disabled={loading}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
              >
                <Stethoscope className="h-4 w-4 shrink-0" />
                <span>Test as Doctor</span>
              </button>
            </div>
            
            <p className="text-[10px] text-teal-700 text-center font-medium">
              Instant login as <strong>Elena Vance</strong> (Week 24) or <strong>Dr. Sarah Jenkins, MD</strong>
            </p>
          </div>

          {/* Mode Tabs (Sign In / Register) */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                !isRegisterMode
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                isRegisterMode
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Role selector for registration */}
            {isRegisterMode && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Select Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegisterRole('patient')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      registerRole === 'patient'
                        ? 'bg-teal-50 border-teal-500 text-teal-800 ring-2 ring-teal-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Baby className="h-3.5 w-3.5" />
                    <span>Pregnant Mother</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegisterRole('doctor')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      registerRole === 'doctor'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-800 ring-2 ring-indigo-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Stethoscope className="h-3.5 w-3.5" />
                    <span>Obstetrician</span>
                  </button>
                </div>
              </div>
            )}

            {/* Registration specific fields */}
            {isRegisterMode && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {registerRole === 'doctor' ? 'Physician Full Name' : 'Full Name'}
                  </label>
                  <div className="relative">
                    <User className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={registerRole === 'doctor' ? 'Dr. Sarah Jenkins, MD' : 'Elena Vance'}
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                      required
                    />
                  </div>
                </div>

                {registerRole === 'patient' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Gestational Week</label>
                      <div className="relative">
                        <Calendar className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="number"
                          value={gestationalWeek}
                          onChange={(e) => setGestationalWeek(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                          min={1}
                          max={42}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Hospital / Clinic Center</label>
                    <div className="relative">
                      <Building className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={hospitalAffiliation}
                        onChange={(e) => setHospitalAffiliation(e.target.value)}
                        placeholder="St. Jude Maternal-Fetal Medicine"
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={registerRole === 'doctor' ? 'doctor@hospital.org' : 'elena@mothersync.ai'}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                  required
                />
              </div>
            </div>

            {/* Password with Eye Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error Message Box */}
            {error && (
              <div className="space-y-1.5">
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
                {!isRegisterMode && error.toLowerCase().includes('invalid') && (
                  <p className="text-[11px] text-slate-500 text-center">
                    New user?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterMode(true);
                        setError(null);
                      }}
                      className="font-bold text-teal-700 hover:underline"
                    >
                      Switch to Create Account
                    </button>{' '}
                    or click <strong>1-Click Instant Evaluation</strong> above.
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-bold text-xs shadow-md shadow-teal-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Authenticating with MotherSync Engine...</span>
              ) : isRegisterMode ? (
                <>
                  <span>Create {registerRole === 'doctor' ? 'Physician' : 'Mother'} Profile</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Pre-fill Helpers in Sign In Mode */}
          {!isRegisterMode && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <span>Quick Fill:</span>
              <button
                type="button"
                onClick={() => prefillDemoCredentials('patient')}
                className="font-semibold text-teal-700 hover:underline hover:text-teal-800"
              >
                Elena Vance (Patient)
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => prefillDemoCredentials('doctor')}
                className="font-semibold text-indigo-700 hover:underline hover:text-indigo-800"
              >
                Dr. Jenkins (Doctor)
              </button>
            </div>
          )}

          {/* Bottom Security Assurance */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
            <span>End-to-End JWT Session Security • ACOG Obstetric Engine Guardrails</span>
          </div>

        </div>

      </div>
    </div>
  );
};

export default LoginPage;
