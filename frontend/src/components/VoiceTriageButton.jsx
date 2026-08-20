import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react';
import { agentAPI } from '../services/api';
import { useEmergencyModal } from '../context/EmergencyModalContext';

export const VoiceTriageButton = ({ onTranscriptReceived, className = '' }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const { openEmergencyModal } = useEmergencyModal();

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = async () => {
      setIsListening(false);
      if (transcript && transcript.trim().length > 0) {
        handleProcessVoiceTranscript(transcript);
      }
    };

    if (isListening) {
      try {
        recognition.start();
      } catch (e) {
        console.warn('Speech recognition start failed:', e);
      }
    } else {
      try {
        recognition.stop();
      } catch (e) {}
    }

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, [isListening]);

  const handleProcessVoiceTranscript = async (text) => {
    setIsProcessing(true);
    try {
      if (onTranscriptReceived) {
        onTranscriptReceived(text);
      }

      // Run immediate emergency triage check
      const res = await agentAPI.voiceTriage(text);
      if (res.data.success && res.data.triage?.riskLevel === 'urgent') {
        openEmergencyModal({
          triage: res.data.triage,
          isLiveSOS: true
        });
      }
    } catch (err) {
      console.error('Voice triage processing error:', err);
    } finally {
      setIsProcessing(false);
      setTranscript('');
    }
  };

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const promptText = prompt('Speech recognition is not supported in this browser. Please enter your symptoms:');
      if (promptText) handleProcessVoiceTranscript(promptText);
      return;
    }

    setIsListening(!isListening);
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={toggleListening}
        disabled={isProcessing}
        className={`relative flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all ${
          isListening
            ? 'bg-red-600 text-white animate-pulse shadow-red-500/40 shadow-lg scale-105'
            : isProcessing
            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
            : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
        }`}
        title="Speak your symptoms for instant AI speech triage"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
            <span>Analyzing Speech...</span>
          </>
        ) : isListening ? (
          <>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <Mic className="h-4 w-4" />
            <span>Listening... Speak Now</span>
          </>
        ) : (
          <>
            <Mic className="h-4 w-4 text-teal-600" />
            <span>Voice Triage</span>
          </>
        )}
      </button>

      {/* Real-time speech preview tooltip */}
      {isListening && transcript && (
        <div className="absolute bottom-full mb-2 left-0 right-0 z-30 p-2.5 rounded-xl bg-slate-900 text-white text-xs shadow-xl animate-fadeIn whitespace-nowrap overflow-hidden text-ellipsis max-w-xs">
          <p className="text-[10px] text-teal-400 font-bold">Transcribing:</p>
          <p className="italic">"{transcript}"</p>
        </div>
      )}
    </div>
  );
};

export default VoiceTriageButton;
