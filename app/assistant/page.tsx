"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Mic, MicOff, Loader2, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { voiceService, LanguageCode, LANGUAGES } from "../../services/voiceService";

interface Msg {
  role: "user" | "assistant";
  content: string;
  time: string;
}

const suggestions = [
  "How do I improve soil moisture?",
  "Best fertiliser for wheat in March?",
  "How to prevent early blight?",
  "When should I irrigate paddy?",
  "Natural pest control methods?",
];

const knowledgeBase: Record<string, string> = {
  moisture: "To improve soil moisture, apply mulching (paddy straw or sugarcane bagasse) 3–5 cm thick. Practise drip irrigation rather than flood irrigation — it saves 40–50% water. Add organic matter like vermicompost to improve water retention capacity.",
  wheat: "For wheat in March, apply top-dress with urea (25 kg/acre) if plants show yellowing. Ensure irrigation at boot-leaf and grain-filling stages. Watch for yellow rust — spray Propiconazole 25 EC (500 ml/acre) if spotted.",
  blight: "To prevent early blight (Alternaria solani), rotate crops annually. Avoid overhead irrigation. Apply Mancozeb 75% WP (2 g/L) or Chlorothalonil at 10-day intervals. Remove and destroy infected leaves immediately.",
  irrigat: "Paddy requires 5–7 cm standing water from transplanting to panicle initiation. Drain fields 7–10 days before harvesting. Mid-season drainage at 30 days after transplanting improves root depth and reduces methane emissions.",
  pest: "Natural pest control: Neem oil spray (5 ml/L) repels aphids and whiteflies. Release Trichogramma cards (1 card/acre) to control stem borers. Yellow sticky traps control thrips. Intercrop marigold to deter nematodes.",
  default: "Great question! Based on current conditions — temperature 32°C, humidity 67%, soil moisture at 38% — I recommend monitoring your crops closely this week. For specific advice on fertilisation, irrigation, pest control, or crop selection, just ask. I'm trained on Indian agriculture practices and can assist with Kharif and Rabi season planning.",
};

function getReply(q: string): string {
  const lower = q.toLowerCase();
  for (const key of Object.keys(knowledgeBase)) {
    if (lower.includes(key)) return knowledgeBase[key];
  }
  return knowledgeBase["default"];
}

function formatTime() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: "Namaste! 🌾 I'm your Smart Agri AI Assistant. I can help with crop management, soil health, pest control, irrigation, and more. How can I assist you today?",
      time: formatTime(),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  
  const [lang, setLang] = useState<LanguageCode>("en");
  const [micState, setMicState] = useState<"idle" | "listening" | "processing" | "speaking">("idle");
  const [toast, setToast] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function toggleVoice() {
    if (micState === "listening") {
      setMicState("processing");
      voiceService.stopListening(
        lang,
        (text) => {
          setMicState("idle");
          if (text.trim()) {
            sendMsg(text, true);
          }
        },
        (err) => {
          showToast(err);
          setMicState("idle");
        },
        () => {
          showToast("Offline voice mode enabled");
        }
      );
      return;
    }
    
    if (micState === "speaking") {
      window.speechSynthesis.cancel();
      setMicState("idle");
      return;
    }

    setMicState("listening");
    voiceService.startListening(
      lang,
      (text) => {
        setMicState("idle");
        if (text.trim()) {
           sendMsg(text, true);
        }
      },
      (err) => {
        showToast(err);
        setMicState("idle");
      },
      () => {
        showToast("Offline voice mode enabled");
      }
    );
  }

  function sendMsg(text?: string, isVoice: boolean = false) {
    const q = (text ?? input).trim();
    if (!q) return;
    if (!isVoice) setInput("");
    
    const userMsg: Msg = { role: "user", content: q, time: formatTime() };
    setMessages(prev => [...prev, userMsg]);
    setTyping(true);
    
    if (isVoice) setMicState("processing");

    setTimeout(() => {
      const reply = getReply(q);
      setMessages(prev => [...prev, { role: "assistant", content: reply, time: formatTime() }]);
      setTyping(false);

      if (isVoice) {
        setMicState("speaking");
        voiceService.textToSpeech(reply, lang)
          .then(() => setMicState("idle"))
          .catch(() => setMicState("idle"));
      }
    }, 1000 + Math.random() * 800);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
        <div>
          <div className="page-title" style={{ marginBottom: 4 }}>AI Farm Assistant</div>
          <div className="page-subtitle" style={{ marginBottom: 0 }}>Intelligent crop advisor powered by agriculture expertise — ask anything about your farm</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>Global Voice AI:</span>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as LanguageCode)}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: 13,
              background: "#ffffff",
              color: "#374151",
              outline: "none",
              cursor: "pointer",
              fontWeight: 500
            }}
          >
            {Object.entries(LANGUAGES).map(([code, config]) => (
              <option key={code} value={code}>{config.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
        {/* Chat */}
        <div className="card" style={{ display: "flex", flexDirection: "column", height: 560 }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "4px 0", display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  background: m.role === "assistant" ? "#dcfce7" : "#f0f9ff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative"
                }}>
                  {m.role === "assistant" ? <Bot size={16} color="#16a34a" /> : <User size={16} color="#3b82f6" />}
                  {m.role === "assistant" && micState === "speaking" && i === messages.length - 1 && !typing && (
                    <motion.div
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      style={{
                        position: "absolute", inset: 0, borderRadius: "50%",
                        border: "2px solid #16a34a"
                      }}
                    />
                  )}
                </div>
                <div style={{ maxWidth: "75%" }}>
                  <div style={{
                    padding: "10px 14px",
                    borderRadius: m.role === "user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                    background: m.role === "user" ? "#16a34a" : "#f9fafb",
                    color: m.role === "user" ? "white" : "#1f2937",
                    fontSize: 13,
                    lineHeight: 1.6,
                    border: m.role === "assistant" ? "1px solid #f0f0f0" : "none",
                  }}>
                    {m.content}
                  </div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 3, textAlign: m.role === "user" ? "right" : "left" }}>{m.time}</div>
                </div>
              </div>
            ))}
            {typing && (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bot size={16} color="#16a34a" />
                </div>
                <div style={{ padding: "10px 14px", borderRadius: "4px 12px 12px 12px", background: "#f9fafb", border: "1px solid #f0f0f0" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[0, 1, 2].map(j => (
                      <div key={j} style={{
                        width: 6, height: 6, borderRadius: "50%", background: "#9ca3af",
                        animation: `bounce 1.2s ${j * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid #f0f0f0", marginTop: 8 }}>
            <input
              className="form-input"
              placeholder={micState === "listening" ? "Listening..." : "Ask about crops, soil, weather, pests…"}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMsg()}
              disabled={typing || micState === "listening" || micState === "processing"}
            />
            
            <button 
              onClick={toggleVoice}
              disabled={typing && micState !== "speaking" && micState !== "processing"}
              style={{
                background: micState === "listening" ? "#ef4444" : "#f3f4f6",
                color: micState === "listening" ? "white" : "#4b5563",
                border: "none",
                borderRadius: "8px",
                width: 42,
                height: 42,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                position: "relative",
              }}
              title={micState === 'speaking' ? "Stop Speaking" : "Use Voice Input"}
            >
              {micState === "listening" && (
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "8px",
                    background: "#ef4444",
                    zIndex: 0
                  }}
                />
              )}
              <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {micState === "idle" && <Mic size={18} />}
                  {micState === "listening" && <MicOff size={18} />}
                  {micState === "processing" && <Loader2 size={18} className="animate-spin" />}
                  {micState === "speaking" && <Volume2 size={18} />}
              </div>
            </button>

            <button className="btn btn-green" onClick={() => sendMsg()} disabled={typing || !input.trim()} style={{ minWidth: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Send size={15} />
            </button>
          </div>

          <style>{`
            @keyframes bounce {
              0%, 60%, 100% { transform: translateY(0); }
              30% { transform: translateY(-6px); }
            }
            .animate-spin {
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>

        {/* Suggestions panel */}
        <div className="card" style={{ height: "fit-content" }}>
          <div className="section-title">Quick Questions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMsg(s)}
                style={{
                  padding: "9px 12px",
                  textAlign: "left",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#15803d",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontFamily: "inherit",
                }}
                onMouseEnter={e => { (e.target as HTMLElement).style.background = "#dcfce7"; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.background = "#f0fdf4"; }}
              >
                🌱 {s}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            <div className="section-title">Today's Farm Data</div>
            {[
              { label: "Temperature", val: "32°C" },
              { label: "Humidity", val: "67%" },
              { label: "Soil Moisture", val: "38%" },
              { label: "UV Index", val: "8 – High" },
            ].map((d, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6", fontSize: 12 }}>
                <span style={{ color: "#6b7280" }}>{d.label}</span>
                <span style={{ fontWeight: 600, color: "#1f2937" }}>{d.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            style={{
              position: "fixed",
              bottom: 24,
              left: "50%",
              background: "#1f2937",
              color: "white",
              padding: "10px 20px",
              borderRadius: "99px",
              fontSize: 14,
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <Bot size={16} color="#4ade80" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
