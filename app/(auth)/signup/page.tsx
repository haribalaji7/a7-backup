"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Mail, Lock, Eye, EyeOff, Loader2, User, ArrowLeft, Clock } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function SignupPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(600);
  const [canResend, setCanResend] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step !== "otp" || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleSendOtp = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send OTP");
        setLoading(false);
        return;
      }
      setStep("otp");
      setCountdown(600);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      setOtpError("");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    }
    setLoading(false);
  };

  const handleResend = async () => {
    if (!canResend) return;
    setOtpError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || "Failed to resend OTP");
        setLoading(false);
        return;
      }
      setCountdown(600);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } catch {
      setOtpError("An unexpected error occurred.");
    }
    setLoading(false);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    const nextIndex = Math.min(pasted.length, 5);
    otpRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setOtpError("Please enter the complete 6-digit code");
      return;
    }
    setOtpError("");
    setOtpLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp-and-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName: name, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.toLowerCase().includes("expired")) {
          setOtpError("This code has expired. Please request a new one.");
        } else {
          setOtpError(data.error || "Invalid verification code");
        }
        setOtpLoading(false);
        return;
      }

      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        router.push("/login");
        return;
      }
      router.push("/");
    } catch {
      setOtpError("An unexpected error occurred. Please try again.");
    }
    setOtpLoading(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 500) {
          setError("Server error. Please try again later.");
        } else {
          setError(data.error || "Failed to send OTP");
        }
        setLoading(false);
        return;
      }
      setStep("otp");
      setCountdown(600);
      setCanResend(false);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <motion.div
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          flex: 1,
          background: "linear-gradient(135deg, #166534 0%, #22c55e 50%, #15803d 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }} />
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          style={{ textAlign: "center", position: "relative", zIndex: 1 }}
        >
          <div style={{
            width: 80, height: 80,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            backdropFilter: "blur(10px)",
          }}>
            <Leaf size={40} color="white" />
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: "white", marginBottom: 12 }}>
            Agri Nova
          </h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.9)", maxWidth: 400, lineHeight: 1.6 }}>
            Join thousands of farmers using AI to maximize their yields and profits.
          </p>
        </motion.div>
      </motion.div>

      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        background: "#f8fafc",
      }}>
        <AnimatePresence mode="wait">
          {step === "form" ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.3 }}
              style={{ width: "100%", maxWidth: 400 }}
            >
              <h2 style={{ fontSize: 28, fontWeight: 700, color: "#14532d", marginBottom: 8 }}>
                Create account
              </h2>
              <p style={{ color: "#6b7280", marginBottom: 32 }}>
                Start your smart farming journey today
              </p>

              <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                    Full Name
                  </label>
                  <div style={{ position: "relative" }}>
                    <User size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      required
                      style={{
                        width: "100%",
                        padding: "12px 12px 12px 42px",
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        fontSize: 14,
                        outline: "none",
                        transition: "all 0.2s",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#22c55e"}
                      onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                    Email
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="farmer@example.com"
                      required
                      style={{
                        width: "100%",
                        padding: "12px 12px 12px 42px",
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        fontSize: 14,
                        outline: "none",
                        transition: "all 0.2s",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#22c55e"}
                      onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                    Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      style={{
                        width: "100%",
                        padding: "12px 12px 12px 42px",
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        fontSize: 14,
                        outline: "none",
                        transition: "all 0.2s",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#22c55e"}
                      onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#9ca3af",
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ color: "#dc2626", fontSize: 13 }}
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: "#22c55e",
                    color: "white",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : "Create Account"}
                </button>
              </form>

              <div style={{ marginTop: 24, textAlign: "center" }}>
                <span style={{ color: "#6b7280" }}>Already have an account? </span>
                <a href="/login" style={{ color: "#16a34a", fontWeight: 600, textDecoration: "none" }}>
                  Sign in
                </a>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.3 }}
              style={{ width: "100%", maxWidth: 400 }}
            >
              <button
                onClick={() => { setStep("form"); setOtpError(""); setOtp(["", "", "", "", "", ""]); }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6b7280",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: 0,
                  marginBottom: 24,
                }}
              >
                <ArrowLeft size={16} /> Back
              </button>

              <h2 style={{ fontSize: 28, fontWeight: 700, color: "#14532d", marginBottom: 8 }}>
                Verify your email
              </h2>
              <p style={{ color: "#6b7280", marginBottom: 4 }}>
                We've sent a 6-digit code to
              </p>
              <p style={{ color: "#14532d", fontWeight: 600, marginBottom: 32, fontSize: 15 }}>
                {email}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div
                  onPaste={handleOtpPaste}
                  style={{ display: "flex", gap: 10, justifyContent: "center" }}
                >
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      style={{
                        width: 52,
                        height: 60,
                        textAlign: "center",
                        fontSize: 24,
                        fontWeight: 700,
                        color: "#14532d",
                        border: `2px solid ${otpError ? "#dc2626" : digit ? "#22c55e" : "#e5e7eb"}`,
                        borderRadius: 12,
                        outline: "none",
                        transition: "all 0.2s",
                        background: digit ? "#f0fdf4" : "#ffffff",
                        caretColor: "#22c55e",
                      }}
                      onFocus={(e) => { if (!otpError) e.target.style.borderColor = "#22c55e"; }}
                      onBlur={(e) => { if (!otpError && !digit) e.target.style.borderColor = "#e5e7eb"; }}
                    />
                  ))}
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  fontSize: 13,
                  color: canResend ? "#9ca3af" : "#6b7280",
                }}>
                  <Clock size={14} />
                  <span>{formatTime(countdown)}</span>
                  <span style={{ margin: "0 4px" }}>•</span>
                  <button
                    onClick={handleResend}
                    disabled={!canResend || loading}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: canResend && !loading ? "pointer" : "default",
                      color: canResend && !loading ? "#16a34a" : "#9ca3af",
                      fontWeight: 600,
                      fontSize: 13,
                      padding: 0,
                      textDecoration: canResend && !loading ? "underline" : "none",
                    }}
                  >
                    Resend Code
                  </button>
                </div>

                {otpError && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ color: "#dc2626", fontSize: 13, textAlign: "center" }}
                  >
                    {otpError}
                  </motion.p>
                )}

                <button
                  onClick={handleVerify}
                  disabled={otpLoading || otp.join("").length !== 6}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: otp.join("").length === 6 ? "#22c55e" : "#9ca3af",
                    color: "white",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: otpLoading || otp.join("").length !== 6 ? "not-allowed" : "pointer",
                    opacity: otpLoading ? 0.7 : 1,
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {otpLoading ? (
                    <><Loader2 size={18} className="animate-spin" /> Verifying...</>
                  ) : (
                    "Verify and Create Account"
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
