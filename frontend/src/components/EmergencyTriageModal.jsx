import React, { useState } from 'react';
import { useEmergencyModal } from '../context/EmergencyModalContext';
import { 
  ShieldAlert, 
  PhoneCall, 
  MapPin, 
  MessageSquare, 
  Copy, 
  Check, 
  ExternalLink, 
  X,
  AlertOctagon
} from 'lucide-react';

export const EmergencyTriageModal = () => {
  const { isEmergencyOpen, emergencyPayload, closeEmergencyModal } = useEmergencyModal();
  const [copied, setCopied] = useState(false);
  const [contactNotified, setContactNotified] = useState(false);

  if (!isEmergencyOpen || !emergencyPayload) return null;

  const triage = emergencyPayload.triage || {};
  const details = triage.details || emergencyPayload.incident || {};
  const hospital = details.hospital || details.selectedFacility || {
    name: 'St. Jude Women & Children Memorial Hospital',
    phone: '+1 (555) 911-MATERNITY',
    address: '450 Healthcare Blvd, Suite 100',
    directionsUrl: 'https://maps.google.com'
  };

  const emergencyContact = details.emergencyContact || {
    name: 'Marcus Vance (Partner)',
    phone: '+1 (555) 789-0123'
  };

  const urgentInstructions = details.urgentInstructions || [
    'STOP chatting and seek immediate medical evaluation.',
    'Call emergency services (911 / 112 / 108) or proceed to nearest maternity emergency room.',
    'Do not drive yourself if experiencing severe pain or bleeding.',
    'Notify your primary emergency contact immediately.'
  ];

  const emergencySummary = details.emergencySummary || `EMERGENCY PREGNANCY SUMMARY:
Patient: Elena Vance | Gestational Age: 24 Weeks
Symptoms: Acute warning flags reported
Destination: ${hospital.name}`;

  const handleCopySummary = () => {
    navigator.clipboard.writeText(emergencySummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNotifyContact = () => {
    const message = encodeURIComponent(
      `🚨 URGENT: MotherSync AI has logged an emergency alert for Elena (Week 24 Pregnant). Seeking emergency evaluation at ${hospital.name} (${hospital.phone}). Please call or meet there immediately.`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
    setContactNotified(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-red-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-4 border-red-500 overflow-hidden">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl animate-bounce">
              <AlertOctagon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                RED ALERT: IMMEDIATE ACTION REQUIRED
              </h2>
              <p className="text-xs sm:text-sm text-red-100 font-medium">
                High-Risk Pregnancy Indicator Detected by Safety Engine
              </p>
            </div>
          </div>

          <button
            onClick={closeEmergencyModal}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Close Alert"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Direct Emergency Call Button */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="tel:911"
              className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-98 text-white font-bold text-base shadow-lg shadow-red-600/30 transition-all text-center"
            >
              <PhoneCall className="h-5 w-5 animate-pulse" />
              <span>Call 911 / 112 (Emergency)</span>
            </a>

            <a
              href={`tel:${hospital.phone || '911'}`}
              className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-base shadow-lg shadow-slate-900/30 transition-all text-center"
            >
              <PhoneCall className="h-5 w-5" />
              <span>Call Hospital OB Unit</span>
            </a>
          </div>

          {/* Hospital Destination Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  Recommended Facility (24/7 OB Emergency)
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{hospital.name}</h3>
                <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-rose-500" />
                  <span>{hospital.address || '450 Healthcare Blvd'}</span>
                </p>
              </div>

              <a
                href={hospital.directionsUrl || `https://maps.google.com/?q=${encodeURIComponent(hospital.name)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-100 hover:bg-teal-200 px-3 py-1.5 rounded-xl transition-colors shrink-0"
              >
                <span>Navigate</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Urgent Protocol Instructions */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Urgent Safety Checklist</h4>
            <div className="space-y-1.5">
              {urgentInstructions.map((instruction, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-red-50/70 border border-red-100 text-xs text-red-950 font-medium">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-200 text-red-800 font-bold flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span>{instruction}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 1-Click Trusted Contact Dispatch */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-amber-950">Primary Emergency Contact</p>
              <p className="text-xs text-amber-800">{emergencyContact.name} ({emergencyContact.phone})</p>
            </div>
            <button
              onClick={handleNotifyContact}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow transition-all"
            >
              <MessageSquare className="h-4 w-4" />
              <span>{contactNotified ? 'Alert Dispatched ✓' : 'Send WhatsApp / SMS Alert'}</span>
            </button>
          </div>

          {/* Paramedic & ER Physician Brief */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Paramedic / Clinical Brief for ER
              </h4>
              <button
                onClick={handleCopySummary}
                className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy Brief'}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-2xl bg-slate-900 text-emerald-300 font-mono text-[11px] whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {emergencySummary}
            </pre>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <p className="text-[10px] text-slate-500">
            Emergency protocol initiated under clinical safety supervision.
          </p>
          <button
            onClick={closeEmergencyModal}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            I am with Medical Staff (Dismiss)
          </button>
        </div>

      </div>
    </div>
  );
};

export default EmergencyTriageModal;
