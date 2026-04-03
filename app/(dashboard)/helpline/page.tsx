"use client";
import { useState, useEffect } from "react";
import { Phone, PhoneCall, Clock, Shield, ArrowRight, PhoneOff, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AgentCallModal from "@/components/helpline/AgentCallModal";

const emergencyServices = [
  { name: "Police", number: "100", color: "bg-blue-500", icon: "🚔" },
  { name: "Ambulance", number: "102 / 108", color: "bg-red-500", icon: "🚑" },
  { name: "Fire", number: "101", color: "bg-orange-500", icon: "🚒" },
  { name: "Emergency", number: "112", color: "bg-purple-500", icon: "🆘" },
];

const helplines = [
  {
    category: "Agriculture",
    icon: "🌾",
    color: "green",
    contacts: [
      { label: "Kisan Call Center", number: "1800-180-1551", available: "24/7" },
      { label: "National Farmers Helpline", number: "1551", available: "24/7" },
      { label: "Agri-Business Center", number: "1800-425-1556", available: "24/7" },
    ]
  },
  {
    category: "Government Schemes",
    icon: "🏛️",
    color: "blue",
    contacts: [
      { label: "PM-Kisan Helpline", number: "155261", available: "24/7" },
      { label: "PM-Kisan Toll Free", number: "1800115526", available: "24/7" },
      { label: "NHB Helpline", number: "1800-180-2006", available: "Mon-Sat" },
    ]
  },
  {
    category: "Weather & Crop",
    icon: "🌤️",
    color: "cyan",
    contacts: [
      { label: "Weather Updates", number: "1800-180-1717", available: "24/7" },
      { label: "Crop Insurance", number: "1800-258-0800", available: "24/7" },
    ]
  },
];

export default function HelplinePage() {
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [emergencyCall, setEmergencyCall] = useState<{ name: string; number: string; icon: string } | null>(null);
  const [callStatus, setCallStatus] = useState<"idle" | "calling" | "connected" | "ended">("idle");
  const [callTimer, setCallTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === "connected") {
      interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  function handleEmergencyClick(service: { name: string; number: string; icon: string }) {
    setEmergencyCall(service);
    setCallStatus("calling");
    setCallTimer(0);
    
    setTimeout(() => {
      setCallStatus("connected");
    }, 2000);
  }

  function endEmergencyCall() {
    setCallStatus("ended");
    setTimeout(() => {
      setEmergencyCall(null);
      setCallStatus("idle");
    }, 1500);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <div className="page-title" style={{ marginBottom: 4 }}>Helpline</div>
          <div className="page-subtitle" style={{ marginBottom: 0 }}>
            Emergency contacts and government helplines for farmers
          </div>
        </div>
        <button 
          onClick={() => setIsCallOpen(true)}
          className="btn btn-green"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <PhoneCall size={16} />
          Call AI Expert
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div className="section-title" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={16} style={{ color: "#ef4444" }} />
            Emergency Services
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {emergencyServices.map((service, i) => (
              <motion.button
                key={i}
                onClick={() => handleEmergencyClick(service)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="card"
                style={{ 
                  padding: "16px", 
                  cursor: "pointer",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                <div style={{ 
                  position: "absolute", 
                  top: 0, 
                  left: 0, 
                  width: 4, 
                  height: "100%", 
                  background: service.color.includes("blue") ? "#3b82f6" : 
                             service.color.includes("red") ? "#ef4444" : 
                             service.color.includes("orange") ? "#f97316" : "#a855f7",
                  borderRadius: "4px 0 0 4px"
                }} />
                <div style={{ fontSize: 28, marginBottom: 8 }}>{service.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{service.name}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#374151" }}>{service.number}</div>
              </motion.button>
            ))}
          </div>

          <div className="section-title" style={{ marginTop: 24, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <Phone size={16} style={{ color: "#22c55e" }} />
            Government Helplines
          </div>
          {helplines.map((section, idx) => (
            <div key={idx} className="card" style={{ marginBottom: 12, padding: 0, overflow: "hidden" }}>
              <div style={{ 
                padding: "12px 16px", 
                background: "linear-gradient(90deg, #22c55e, #16a34a)", 
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}>
                <span style={{ fontSize: 18 }}>{section.icon}</span>
                <span style={{ fontWeight: 600 }}>{section.category}</span>
              </div>
              <div style={{ padding: 12 }}>
                {section.contacts.map((contact, cIdx) => (
                  <div
                    key={cIdx}
                    onClick={() => handleEmergencyClick({ name: contact.label, number: contact.number, icon: "📞" })}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 12px",
                      borderRadius: 8,
                      marginBottom: cIdx < section.contacts.length - 1 ? 8 : 0,
                      background: "#f9fafb",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f0fdf4";
                      e.currentTarget.style.border = "1px solid #22c55e";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#f9fafb";
                      e.currentTarget.style.border = "1px solid transparent";
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13, color: "#1f2937" }}>{contact.label}</div>
                      <div style={{ fontSize: 11, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={10} /> {contact.available}
                      </div>
                    </div>
                    <span style={{ fontWeight: 600, color: "#16a34a", fontSize: 13 }}>{contact.number}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="section-title" style={{ marginBottom: 12 }}>Quick Guide</div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
              Click on any number above to initiate a call. Emergency services (100, 102, 101, 112) work throughout India.
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1f2937", marginBottom: 8 }}>🌾 Agricultural Helplines</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Kisan Call Center (1800-180-1551) - Free service for farming queries in multiple languages
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1f2937", marginBottom: 8 }}>🏛️ Government Schemes</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                PM-KISAN helpline for farmer welfare scheme inquiries and grievance redressal
              </div>
            </div>

            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1f2937", marginBottom: 8 }}>🤖 AI Expert</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Get instant AI-powered agricultural assistance - click "Call AI Expert" button above
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16, padding: 16, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#16a34a", marginBottom: 8 }}>
              💡 Tip
            </div>
            <div style={{ fontSize: 12, color: "#15803d" }}>
              Use the AI Expert for instant answers to your farming questions - available 24/7 in 5 Indian languages (English, Tamil, Telugu, Malayalam, Kannada)
            </div>
          </div>
        </div>
      </div>

      <AgentCallModal isOpen={isCallOpen} onClose={() => setIsCallOpen(false)} />

      <AnimatePresence>
        {emergencyCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: callStatus === "connected" 
                ? "linear-gradient(135deg, rgba(34, 197, 94, 0.95), rgba(16, 185, 129, 0.98))"
                : callStatus === "ended"
                ? "linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.98))"
                : "linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(37, 99, 235, 0.98))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 50,
              padding: 20
            }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              style={{
                maxWidth: 340,
                width: "100%",
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(40px)",
                borderRadius: 24,
                border: "1px solid rgba(255,255,255,0.2)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
                padding: 32,
                textAlign: "center"
              }}
            >
              {callStatus === "calling" && (
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <div style={{ width: 120, height: 120, borderRadius: "50%", border: "4px solid rgba(255,255,255,0.3)" }} />
                </motion.div>
              )}

              <div style={{ position: "relative", zIndex: 1 }}>
                <motion.div
                  animate={callStatus === "calling" ? { rotate: [0, -10, 10, 0] } : {}}
                  transition={callStatus === "calling" ? { duration: 0.5, repeat: Infinity } : {}}
                  style={{
                    width: 80,
                    height: 80,
                    margin: "0 auto 24px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {callStatus === "calling" && <PhoneCall size={40} style={{ color: "white" }} className="animate-pulse" />}
                  {callStatus === "connected" && <PhoneCall size={40} style={{ color: "white" }} />}
                  {callStatus === "ended" && <PhoneOff size={40} style={{ color: "white" }} />}
                </motion.div>

                <div style={{ fontSize: 24, fontWeight: 700, color: "white", marginBottom: 8 }}>
                  {callStatus === "calling" && "Calling..."}
                  {callStatus === "connected" && "Connected"}
                  {callStatus === "ended" && "Call Ended"}
                </div>

                <div style={{ fontSize: 18, color: "rgba(255,255,255,0.8)", marginBottom: 8 }}>
                  {emergencyCall.icon} {emergencyCall.name}
                </div>

                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 16 }}>
                  {emergencyCall.number.split(" / ")[0]}
                </div>

                {callStatus === "connected" && (
                  <div style={{ fontFamily: "monospace", fontSize: 24, color: "white", marginBottom: 24 }}>
                    {formatTime(callTimer)}
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, height: 48, marginBottom: 24 }}>
                  {(callStatus === "calling" || callStatus === "connected") && Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: callStatus === "calling"
                          ? [8, Math.random() * 24 + 8, 8]
                          : [8, Math.random() * 20 + 12, 8]
                      }}
                      transition={{
                        duration: callStatus === "calling" ? 0.8 : 0.5,
                        repeat: Infinity,
                        delay: i * 0.05
                      }}
                      style={{ width: 4, borderRadius: 4, background: "rgba(255,255,255,0.7)" }}
                    />
                  ))}
                </div>

                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "8px 16px", marginBottom: 24 }}>
                  <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 14 }}>
                    {callStatus === "calling" && "Please wait while we connect you..."}
                    {callStatus === "connected" && "You are connected. Speak now!"}
                    {callStatus === "ended" && "Call has ended successfully"}
                  </p>
                </div>

                <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
                  {(callStatus === "calling" || callStatus === "connected") && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={endEmergencyCall}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        border: "none",
                        background: "#ef4444",
                        color: "white",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 8px 24px rgba(239, 68, 68, 0.5)"
                      }}
                    >
                      <PhoneOff size={24} />
                    </motion.button>
                  )}
                  {callStatus === "ended" && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setEmergencyCall(null)}
                      style={{
                        padding: "12px 32px",
                        borderRadius: 12,
                        border: "none",
                        background: "white",
                        color: "#1f2937",
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                    >
                      Close
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}