"use client";
import { useState, useEffect } from "react";
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, Globe, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type LanguageCode = "en" | "ta" | "te" | "ml" | "kn";

const LANGUAGES: Record<LanguageCode, { name: string; native: string }> = {
  en: { name: "English", native: "English" },
  ta: { name: "Tamil", native: "தமிழ்" },
  te: { name: "Telugu", native: "తెలుగు" },
  ml: { name: "Malayalam", native: "മലയാളം" },
  kn: { name: "Kannada", native: "ಕನ್ನಡ" },
};

const CALL_MESSAGES = {
  en: {
    connecting: "Connecting to AI Agent...",
    connected: "Connected with Smart Agri AI",
    speaking: "Speaking...",
    listening: "Listening...",
    muted: "Muted",
    speakerOn: "Speaker On",
    speakerOff: "Speaker Off",
  },
  ta: {
    connecting: "AI Agent உடன் இணைக்கிறது...",
    connected: "Smart Agri AI உடன் இணைக்கப்பட்டது",
    speaking: "பேசுகிறது...",
    listening: "கவனிக்கிறது...",
    muted: "முடக்கப்பட்டது",
    speakerOn: "Speaker On",
    speakerOff: "Speaker Off",
  },
  te: {
    connecting: "AI Agent কে connect、广州...",
    connected: "Smart Agri AI 广州 connected",
    speaking: "Speaking...",
    listening: "Listening...",
    muted: "Muted",
    speakerOn: "Speaker On",
    speakerOff: "Speaker Off",
  },
  ml: {
    connecting: "AI Agent മായി ബന്ധിപ്പിക്കുന്നു...",
    connected: "Smart Agri AI മായി ബന്ധിപ്പിച്ചു",
    speaking: "Speaking...",
    listening: "Listening...",
    muted: "Muted",
    speakerOn: "Speaker On",
    speakerOff: "Speaker Off",
  },
  kn: {
    connecting: "AI Agentಗೆ ಸಂಪರ್ಕ ಮಾಡುತ್ತಿದೆ...",
    connected: "Smart Agri AI ಸಂಪರ್ಕಗೊಂಡಿದೆ",
    speaking: "ಮಾತಾಡುತ್ತಿದೆ...",
    listening: "ಕೇಳುತ್ತಿದೆ...",
    muted: "ಮ್ಯೂಟ್",
    speakerOn: "ಸ್ಪೀಕರ್ ಆನ್",
    speakerOff: "ಸ್ಪೀಕರ್ ಆಫ್",
  },
};

const WAVE_BARS = 24;

interface AgentCallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AgentCallModal({ isOpen, onClose }: AgentCallModalProps) {
  const [callState, setCallState] = useState<"connecting" | "connected">("connecting");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [waveActive, setWaveActive] = useState(false);
  const [currentLang, setCurrentLang] = useState<LanguageCode>("en");

  useEffect(() => {
    if (isOpen) {
      setCallState("connecting");
      setWaveActive(false);
      setIsMuted(false);
      setIsSpeakerOn(true);
      
      const timer = setTimeout(() => {
        setCallState("connected");
        setWaveActive(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (callState === "connected" && waveActive) {
      setIsListening(true);
      interval = setInterval(() => {
        setIsListening(prev => !prev);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [callState, waveActive]);

  const t = (key: keyof typeof CALL_MESSAGES.en) => 
    CALL_MESSAGES[currentLang]?.[key] || CALL_MESSAGES.en[key];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(79, 70, 229, 0.98))",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            backdropFilter: "blur(20px)",
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            style={{
              width: "100%",
              maxWidth: 420,
              padding: 40,
              borderRadius: 32,
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(40px)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", marginBottom: -20 }}>
              <button
                onClick={onClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  transition: "all 0.2s",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ position: "relative", marginBottom: 32 }}>
              <motion.div
                animate={waveActive ? {
                  scale: [1, 1.3, 1],
                  opacity: [0.6, 0.2, 0.6],
                } : {}}
                transition={waveActive ? { duration: 2, repeat: Infinity } : {}}
                style={{
                  position: "absolute",
                  inset: -20,
                  borderRadius: "50%",
                  border: "3px solid rgba(255, 255, 255, 0.4)",
                }}
              />
              <motion.div
                animate={waveActive && isListening ? {
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 0.1, 0.4],
                } : {}}
                transition={waveActive && isListening ? { duration: 1.5, repeat: Infinity } : {}}
                style={{
                  position: "absolute",
                  inset: -40,
                  borderRadius: "50%",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                }}
              />
              <div style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 12px 40px rgba(139, 92, 246, 0.5)",
              }}>
                <Phone size={48} color="white" style={{ transform: "rotate(135deg)" }} />
              </div>
            </div>

            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "white", marginBottom: 8 }}>
                Smart Agri AI
              </div>
              <div style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.8)" }}>
                {callState === "connecting" ? t("connecting") : t("connected")}
              </div>
            </div>

            <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center", gap: 3, marginBottom: 24 }}>
              {Array.from({ length: WAVE_BARS }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={waveActive && isListening ? {
                    height: [8, Math.random() * 40 + 20, 8],
                  } : { height: 8 }}
                  transition={waveActive && isListening ? {
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.05,
                  } : { duration: 0.3 }}
                  style={{
                    width: 4,
                    borderRadius: 4,
                    background: isListening ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.4)",
                  }}
                />
              ))}
            </div>

            <div style={{
              padding: "8px 16px",
              borderRadius: 20,
              background: "rgba(255, 255, 255, 0.15)",
              marginBottom: 32,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <Globe size={16} color="white" />
              <select
                value={currentLang}
                onChange={(e) => setCurrentLang(e.target.value as LanguageCode)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {Object.entries(LANGUAGES).map(([code, config]) => (
                  <option key={code} value={code} style={{ color: "#1f2937" }}>
                    {config.native}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMuted(!isMuted)}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  border: "none",
                  background: isMuted ? "#ef4444" : "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  border: "none",
                  background: "#ef4444",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 24px rgba(239, 68, 68, 0.5)",
                }}
              >
                <PhoneOff size={28} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  border: "none",
                  background: !isSpeakerOn ? "#ef4444" : "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
              >
                {isSpeakerOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
              </motion.button>
            </div>

            <div style={{ marginTop: 24, display: "flex", gap: 16 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.6)", marginBottom: 2 }}>
                  {t("muted")}
                </div>
                <div style={{ fontSize: 12, color: "white", fontWeight: 500 }}>
                  {isMuted ? "On" : "Off"}
                </div>
              </div>
              <div style={{ width: 1, height: 30, background: "rgba(255, 255, 255, 0.2)" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.6)", marginBottom: 2 }}>
                  {isSpeakerOn ? t("speakerOn") : t("speakerOff")}
                </div>
                <div style={{ fontSize: 12, color: "white", fontWeight: 500 }}>
                  {isSpeakerOn ? "On" : "Off"}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
