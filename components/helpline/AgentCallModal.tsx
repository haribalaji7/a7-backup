"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneOff, Mic, MicOff, Volume2, Globe, User, Wifi, Loader2 } from "lucide-react";

interface AgentCallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type LanguageCode = "en" | "ta" | "kn" | "ml" | "te" | "hi";

type CallState = "idle" | "connecting" | "listening" | "thinking" | "speaking";

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

const languages: { id: LanguageCode; label: string; voiceLang: string }[] = [
  { id: "en", label: "English", voiceLang: "en-US" },
  { id: "ta", label: "தமிழ்", voiceLang: "ta-IN" },
  { id: "kn", label: "ಕನ್ನಡ", voiceLang: "kn-IN" },
  { id: "ml", label: "മലയാളം", voiceLang: "ml-IN" },
  { id: "te", label: "తెలుగు", voiceLang: "te-IN" },
  { id: "hi", label: "हिंदी", voiceLang: "hi-IN" },
];

const translations: Record<LanguageCode, { status: string; agent: string; listening: string; thinking: string; speaking: string }> = {
  en: { status: "Connecting...", agent: "Agri Nova Expert", listening: "Listening...", thinking: "Thinking...", speaking: "Speaking..." },
  ta: { status: "இணைக்கிறது...", agent: "வேளாண் AI நிபுணர்", listening: "கேட்கிறது...", thinking: "நினைக்கிறது...", speaking: "பேசுகிறது..." },
  kn: { status: "ಸಂಪರ್ಕಿಸುತ್ತಿದೆ...", agent: "ಕೃಷಿ AI ತಜ್ಞ", listening: "ಕೇಳುತ್ತಿದೆ...", thinking: "ಯೋಚಿಸುತ್ತಿದೆ...", speaking: "ಮಾತಾಡುತ್ತಿದೆ..." },
  ml: { status: "ബന്ധിപ്പിക്കുന്നു...", agent: "കൃഷി AI വിദഗ്ധൻ", listening: "കേട്ടുകൊണ്ടിരിക്കുന്നു...", thinking: "ചിന്തിക്കുന്നു...", speaking: "സംസാരിക്കുന്നു..." },
  te: { status: "कनेक्ट हो रहा है...", agent: "कृषि AI विशेषज्ञ", listening: "सुन रहा है...", thinking: "सोच रहा है...", speaking: "बोल रहा है..." },
  hi: { status: "कनेक्ट हो रहा है...", agent: "कृषि AI विशेषज्ञ", listening: "सुन रहा हूं...", thinking: "सोच रहा हूं...", speaking: "बोल रहा हूं..." },
};

export default function AgentCallModal({ isOpen, onClose }: AgentCallModalProps) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [selectedLang, setSelectedLang] = useState<LanguageCode>("en");
  const [transcript, setTranscript] = useState("");
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const messagesRef = useRef<{ role: string; content: string }[]>([]);
  const startRecognitionRef = useRef<() => void>(() => {});

  const t = translations[selectedLang] || translations.en;

  const log = (msg: string) => console.log(msg);

  const startRecognition = () => {
    if (typeof window === "undefined") {
      log("No window");
      return;
    }

    const win = window as unknown as { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition };
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
    
    if (!SpeechRecognitionClass) {
      log("STT not supported - try Chrome");
      alert("Speech recognition not supported in this browser. Please use Chrome.");
      return;
    }

    log("Starting STT...");
    const recognition = new SpeechRecognitionClass();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = languages.find(l => l.id === selectedLang)?.voiceLang || "en-US";
    log("Lang: " + recognition.lang);

    recognition.onstart = () => {
      log("STT started");
      setCallState("listening");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        }
      }
      if (final) {
        log("Got: " + final);
        setTranscript(final);
        setTimeout(() => handleUserSpeech(final), 100);
      }
    };

    recognition.onerror = (e) => {
      log("STT error: " + e.error);
      if (e.error === "no-speech") {
        setTimeout(() => startRecognitionRef.current(), 500);
      }
    };

    recognition.onend = () => {
      log("STT ended");
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      log("STT start() called");
    } catch (e) {
      log("STT start failed: " + e);
    }
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  };

  const handleUserSpeech = async (text: string) => {
    log("Processing: " + text);
    stopRecognition();
    setTranscript("");
    setCallState("thinking");

    const newMessages = [...messagesRef.current, { role: "user", content: text }];
    messagesRef.current = newMessages;

    try {
      log("Calling API...");
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          language: selectedLang,
          voiceMode: true,
        }),
      });

      const data = await response.json();
      const aiResponse = data.message;
      log("API got: " + (aiResponse?.substring(0, 50) || "empty"));
      
      if (!aiResponse) {
        log("Empty response");
        setCallState("listening");
        startRecognition();
        return;
      }

      messagesRef.current = [...newMessages, { role: "assistant", content: aiResponse }];
      setCallState("speaking");
      speakResponse(aiResponse);
    } catch (err) {
      log("API error: " + err);
      setCallState("listening");
      startRecognition();
    }
  };

  const speakResponse = (text: string) => {
    log("TTS: Starting...");
    
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      log("TTS not available");
      setCallState("listening");
      startRecognition();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const langConfig = languages.find(l => l.id === selectedLang);
    const targetLang = langConfig?.voiceLang || "en-US";
    
    const voices = window.speechSynthesis.getVoices();
    log("Voices: " + voices.length);
    
    const voice = voices.find(v => v.lang.toLowerCase().startsWith(targetLang.split("-")[0])) 
      || voices.find(v => v.lang.toLowerCase().startsWith("en"));
    
    if (voice) {
      utterance.voice = voice;
      log("Voice: " + voice.name);
    }
    
    utterance.lang = targetLang;
    utterance.rate = 0.9;

    utterance.onend = () => {
      log("TTS done");
      if (!isMuted) {
        setCallState("listening");
        setTimeout(() => startRecognition(), 500);
      }
    };

    utterance.onerror = (e) => {
      log("TTS error: " + e.error);
      if (!isMuted) {
        setCallState("listening");
        startRecognition();
      }
    };

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    log("TTS speak() called");
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    synthRef.current = null;
  };

  useEffect(() => {
    startRecognitionRef.current = startRecognition;
  }, [selectedLang]);

  useEffect(() => {
    if (isOpen) {
      messagesRef.current = [];
      setTranscript("");
      setCallState("connecting");

      const timer = setTimeout(() => {
        setCallState("listening");
        startRecognition();
      }, 1500);

      return () => {
        clearTimeout(timer);
        stopRecognition();
        stopSpeaking();
      };
    } else {
      setCallState("idle");
      stopRecognition();
      stopSpeaking();
    }
  }, [isOpen]);

  useEffect(() => {
    if (callState === "listening" && !isMuted && isOpen) {
      stopRecognition();
      setTimeout(() => startRecognition(), 100);
    } else if (isMuted && callState === "listening") {
      stopRecognition();
    }
  }, [isMuted, selectedLang, callState, isOpen]);

  const handleMuteToggle = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (newMuted) {
      stopRecognition();
      stopSpeaking();
      setCallState("idle");
    } else {
      setCallState("listening");
      startRecognition();
    }
  };

  const getStatusText = () => {
    switch (callState) {
      case "connecting": return t.status;
      case "listening": return t.listening;
      case "thinking": return t.thinking;
      case "speaking": return t.speaking;
      default: return "";
    }
  };

  const getWaveformBars = () => {
    return Array.from({ length: 12 }, (_, i) => {
      let height = 8;
      if (callState === "listening") {
        height = 12 + Math.abs(Math.sin(i * 0.8)) * 20;
      } else if (callState === "thinking") {
        height = 16 + Math.abs(Math.sin(i * 0.5 + Date.now() * 0.005)) * 12;
      } else if (callState === "speaking") {
        height = 8 + Math.abs(Math.sin(i * 0.6)) * 28;
      }
      return height;
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "linear-gradient(135deg, rgba(34, 197, 94, 0.95), rgba(16, 185, 129, 0.98))" }}
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.4 }}
            className="relative w-full max-w-sm bg-white/10 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/20 shadow-2xl"
          >

            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                animate={{ 
                  scale: callState === "thinking" ? [1, 1.5, 1] : 1,
                  opacity: callState === "thinking" ? [0.3, 0.5, 0.3] : 0.3
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-20 -right-20 w-40 h-40 bg-white/20 rounded-full blur-3xl"
              />
              <motion.div
                animate={{ 
                  scale: callState === "speaking" ? [1, 1.4, 1] : 1,
                  opacity: callState === "speaking" ? [0.2, 0.4, 0.2] : 0.2
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-300/20 rounded-full blur-3xl"
              />
            </div>

            <div className="relative z-10 flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Wifi className="w-4 h-4" />
                <span>Live Call</span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="relative z-10 flex flex-col items-center p-8">
              <div className="relative mb-4">
                <motion.div
                  animate={{ 
                    scale: callState === "speaking" ? [1, 1.3, 1] : 1,
                    opacity: callState === "speaking" ? [0.4, 0.6, 0.4] : 0.3
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 bg-white/30 rounded-full blur-xl"
                />
                <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-white to-green-100 flex items-center justify-center shadow-lg">
                  <User className="w-14 h-14 text-green-600" />
                </div>
                
                {callState !== "idle" && callState !== "connecting" && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-md">
                    <span className={`w-2 h-2 rounded-full ${
                      callState === "listening" ? "bg-blue-500 animate-pulse" :
                      callState === "thinking" ? "bg-yellow-500 animate-pulse" :
                      callState === "speaking" ? "bg-green-500 animate-pulse" : "bg-gray-500"
                    }`} />
                    <span className="text-xs font-medium text-slate-700">{getStatusText()}</span>
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">{t.agent}</h2>
              <p className="text-white/70 mb-4 font-medium text-sm">{getStatusText()}</p>

              {callState !== "idle" && (
                <div className="flex items-center justify-center gap-1 h-12 mb-4">
                  {getWaveformBars().map((height, i) => (
                    <motion.div
                      key={i}
                      animate={{ height }}
                      transition={{ duration: 0.3, delay: i * 0.03 }}
                      className="w-1.5 bg-white/80 rounded-full"
                    />
                  ))}
                </div>
              )}

              {transcript && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/10 rounded-xl px-4 py-2 mb-4 max-w-full"
                >
                  <p className="text-white/90 text-sm text-center">&quot;{transcript}&quot;</p>
                </motion.div>
              )}

              <div className="flex items-center gap-2 mb-6">
                <Globe className="w-4 h-4 text-white/60" />
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value as LanguageCode)}
                  className="bg-white/10 text-white text-sm px-3 py-1.5 rounded-lg border border-white/20 outline-none cursor-pointer"
                >
                  {languages.map((lang) => (
                    <option key={lang.id} value={lang.id} className="text-slate-800">
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleMuteToggle}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    isMuted ? "bg-red-500/80 text-white" : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-16 h-16 rounded-2xl bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg"
                >
                  <PhoneOff className="w-6 h-6" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (callState === "speaking") {
                      stopSpeaking();
                      setCallState("listening");
                      startRecognition();
                    }
                  }}
                  className="w-12 h-12 rounded-2xl bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-all"
                >
                  {callState === "thinking" ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </motion.button>
              </div>

              <div className="mt-4 text-xs text-white/50 uppercase tracking-widest">
                AI Voice Assistant
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}