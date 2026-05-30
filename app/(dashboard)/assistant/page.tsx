"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { Send, Bot, User, Mic, MicOff, Loader2, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { voiceService } from "@/services/voiceService";
import type { LanguageCode, ChatMessage } from "@/lib/types";
import { useLocale, LocaleProvider } from "@/contexts/LocaleContext";

const LANGUAGES: Record<string, { name: string; native: string }> = {
  en: { name: "English", native: "English" },
  hi: { name: "Hindi", native: "हिंदी" },
  bn: { name: "Bengali", native: "বাংলা" },
  ta: { name: "Tamil", native: "தமிழ்" },
  te: { name: "Telugu", native: "తెలుగు" },
  mr: { name: "Marathi", native: "मराठी" },
  gu: { name: "Gujarati", native: "ગુજરાતી" },
  pa: { name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  ml: { name: "Malayalam", native: "മലയാളം" },
  kn: { name: "Kannada", native: "ಕನ್ನಡ" },
  or: { name: "Odia", native: "ଓଡ଼ିଆ" },
  as: { name: "Assamese", native: "অসমীয়া" },
  ne: { name: "Nepali", native: "नेपाली" },
  ur: { name: "Urdu", native: "اردو" },
  sa: { name: "Sanskrit", native: "संस्कृतम्" },
  ks: { name: "Kashmiri", native: "कॉशुर" },
  sd: { name: "Sindhi", native: "सिन्धी" },
  mai: { name: "Maithili", native: "मैथिली" },
  bo: { name: "Bodo", native: "बरʼ" },
  doi: { name: "Dogri", native: "डोगरी" },
  mni: { name: "Manipuri", native: "মৈতৈলোন্" },
  kok: { name: "Konkani", native: "कोंकणी" },
  sat: { name: "Santali", native: "ᱥᱟᱱᱛᱟᱲᱤ" },
};



function formatTime() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function AssistantPageInner() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micState, setMicState] = useState<"idle" | "listening" | "processing" | "speaking">("idle");
  const [isRecording, setIsRecording] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [playingMessage, setPlayingMessage] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const { lang, setLang, t } = useLocale();

  const bottomRef = useRef<HTMLDivElement>(null);

  const prevLangRef = useRef(lang);

  useEffect(() => {
    if (!hasInitialized) {
      setMessages([{
        id: Date.now().toString(),
        role: "assistant",
        content: t.greeting,
        time: formatTime(),
      }]);
      setHasInitialized(true);
    }
  }, [t.greeting, hasInitialized]);

  useEffect(() => {
    if (hasInitialized && prevLangRef.current !== lang && prevLangRef.current) {
      prevLangRef.current = lang;
      voiceService.stopSpeech();
      setPlayingMessage(null);
      setMessages([{
        id: Date.now().toString(),
        role: "assistant",
        content: t.greeting,
        time: formatTime(),
      }]);
    }
    prevLangRef.current = lang;
  }, [lang, hasInitialized, t.greeting]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const placeholder = useMemo(() => t.placeholder, [t.placeholder]);

  useEffect(() => {
    setInput(t.placeholder);
  }, [t.placeholder]);

  useEffect(() => {
    setInput(placeholders[lang]);
  }, [lang]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function sendToAI(userMessage: string) {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
      time: formatTime(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);
    setError(null);

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      time: formatTime(),
    };
    setMessages([...newMessages, assistantMsg]);

    try {
      const conversationHistory = newMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: conversationHistory,
          language: lang 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to get response");
      }

      setMessages(prev => prev.map(m => 
        m.id === assistantMsgId ? { ...m, content: data.message } : m
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      setError(errorMessage);
      setMessages(prev => prev.map(m => 
        m.id === assistantMsgId ? { 
          ...m, 
          content: `⚠️ Sorry, I encountered an error: ${errorMessage}` 
        } : m
      ));
    } finally {
      setIsLoading(false);
    }
  }

  function sendMsg(text?: string) {
    const q = (text ?? input).trim();
    if (!q) return;
    setInput("");
    sendToAI(q);
  }

  async function toggleVoice() {
    if (micState === "speaking") {
      voiceService.stopSpeech();
      setPlayingMessage(null);
      setMicState("idle");
      return;
    }

    if (isRecording) {
      setMicState("processing");
      setIsRecording(false);
      
      voiceService.stopListening(lang, (text) => {
        setMicState("idle");
        setInput("");
        if (text.trim()) {
          sendToAI(text.trim());
        }
      }, (err) => {
        showToast(err);
        setMicState("idle");
        setInput("");
      });
      return;
    }

    if (micState === "listening") {
      voiceService.abortListening();
      setMicState("idle");
      setIsRecording(false);
      setInput("");
      return;
    }

    setMicState("listening");
    setIsRecording(true);
    
    voiceService.startListening(
      lang,
      (text) => {
        setMicState("idle");
        setIsRecording(false);
        setInput("");
        if (text.trim()) {
          sendToAI(text.trim());
        }
      },
      (err) => {
        showToast(err);
        setMicState("idle");
        setIsRecording(false);
        setInput("");
      },
      (interim) => {
        setInput(interim);
      }
    );
  }

  const playMessage = async (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg || msg.role === "user" || !msg.content) return;

    if (playingMessage === msgId) {
      voiceService.stopSpeech();
      setPlayingMessage(null);
      return;
    }

    setPlayingMessage(msgId);
    
    try {
      await voiceService.cloudTextToSpeech(
        msg.content,
        lang,
        () => {},
        () => setPlayingMessage(null),
        () => setPlayingMessage(null)
      );
    } catch {
      setPlayingMessage(null);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now().toString(),
      role: "assistant",
      content: t.greeting,
      time: formatTime(),
    }]);
    setError(null);
  };

  const labels = t.farmData;
  const questions = t.quickQuestions;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
        <div>
          <div className="page-title" style={{ marginBottom: 4 }}>AI Farm Assistant</div>
          <div className="page-subtitle" style={{ marginBottom: 0 }}>
            Chat with AI powered by GPT-4 • Supports 22 Indian languages
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={clearChat}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              background: "white",
              color: "#6b7280",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Clear Chat
          </button>
          <select
            value={lang}
            onChange={(e) => {
              const newLang = e.target.value as LanguageCode;
              setLang(newLang);
              setInput("");
            }}
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
              <option key={code} value={code}>{config.native} ({config.name})</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
        <div className="card" style={{ display: "flex", flexDirection: "column", height: 560 }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "4px 0", display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.map((m) => (
              <div key={m.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  background: m.role === "assistant" ? "#dcfce7" : "#f0f9ff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative"
                }}>
                  {m.role === "assistant" ? <Bot size={16} color="#16a34a" /> : <User size={16} color="#3b82f6" />}
                  {m.role === "assistant" && playingMessage === m.id && (
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
                    {m.content || (m.role === "assistant" && isLoading ? "Thinking..." : "")}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>{m.time}</div>
                    {m.role === "assistant" && m.content && (
                      <button
                        onClick={() => playMessage(m.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "2px 8px",
                          borderRadius: 12,
                          border: playingMessage === m.id ? "1px solid #22c55e" : "1px solid #e5e7eb",
                          background: playingMessage === m.id ? "#f0fdf4" : "white",
                          color: playingMessage === m.id ? "#16a34a" : "#6b7280",
                          fontSize: 10,
                          cursor: "pointer",
                        }}
                      >
                        {playingMessage === m.id ? <Volume2 size={12} /> : <Volume2 size={12} />}
                        {playingMessage === m.id ? "Playing" : "Listen"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid #f0f0f0", marginTop: 8 }}>
            <input
              className="form-input"
              placeholder={isRecording ? "Speaking..." : placeholder}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !isRecording && !isLoading && sendMsg()}
              disabled={isLoading || isRecording}
              style={{
                background: isRecording ? "#f0fdf4" : undefined,
                border: isRecording ? "1px solid #22c55e" : undefined,
              }}
            />
            
            <button 
              onClick={toggleVoice}
              disabled={isLoading}
              style={{
                background: isRecording ? "#ef4444" : "#f3f4f6",
                color: isRecording ? "white" : "#4b5563",
                border: "none",
                borderRadius: "8px",
                width: 42,
                height: 42,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.5 : 1,
                transition: "all 0.2s",
                position: "relative",
              }}
            >
              {isRecording && (
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
              <div style={{ position: "relative", zIndex: 1 }}>
                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
              </div>
            </button>

            <button 
              className="btn btn-green" 
              onClick={() => sendMsg()}
              disabled={isLoading || !input.trim() || isRecording}
              style={{ 
                minWidth: 42, 
                height: 42, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                opacity: (isLoading || !input.trim() || isRecording) ? 0.5 : 1,
              }}
            >
              {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>

          <style>{`
            .animate-spin { animation: spin 1s linear infinite; }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          `}</style>
        </div>

        <div className="card" style={{ height: "fit-content" }}>
          <div className="section-title">
            {lang === "ta" ? "அவசர் கேள்விகள்" : lang === "te" ? "అవసర ప్రశ్నలు" : lang === "ml" ? "ടെക്ക് ചോദ്യങ്ങൾ" : lang === "kn" ? "ಉತ್ಸಾಹ ಪ್ರಶ್ನೆಗಳು" : lang === "hi" ? "त्वरित प्रश्न" : "Quick Questions"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {questions.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMsg(q)}
                style={{
                  padding: "9px 12px",
                  textAlign: "left",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#15803d",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
                onMouseEnter={e => (e.target as HTMLElement).style.background = "#dcfce7"}
                onMouseLeave={e => (e.target as HTMLElement).style.background = "#f0fdf4"}
              >
                🌱 {q}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            <div className="section-title">{labels.title}</div>
            {[
              { label: labels.temp, val: "32°C" },
              { label: labels.humidity, val: "67%" },
              { label: labels.moisture, val: "38%" },
              { label: labels.uv, val: `8 – ${labels.high}` },
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

export default function AssistantPage() {
  return (
    <LocaleProvider>
      <AssistantPageInner />
    </LocaleProvider>
  );
}