"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Leaf, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error: authError } = await signIn(email, password);
      
      if (authError) {
        const errorMsg = authError.message;
        if (errorMsg.includes("rate limit") || errorMsg.includes("Too many requests")) {
          setError("Too many login attempts. Please wait a few minutes before trying again.");
        } else if (errorMsg.includes("Email not confirmed")) {
          setError("Please confirm your email first. Check your inbox for the confirmation link.");
        } else if (errorMsg.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please try again.");
        } else {
          setError(errorMsg);
        }
        setLoading(false);
      } else {
        router.push("/");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
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
            Smart Agri AI
          </h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.9)", maxWidth: 400, lineHeight: 1.6 }}>
            Transform your farm with AI-powered insights, satellite monitoring, and smart crop management.
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ width: "100%", maxWidth: 400 }}
        >
          <h2 style={{ fontSize: 28, fontWeight: 700, color: "#14532d", marginBottom: 8 }}>
            Welcome back
          </h2>
          <p style={{ color: "#6b7280", marginBottom: 32 }}>
            Sign in to access your smart farm dashboard
          </p>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
              {loading ? <Loader2 size={18} className="animate-spin" /> : "Sign In"}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: "center" }}>
            <span style={{ color: "#6b7280" }}>Don't have an account? </span>
            <a href="/signup" style={{ color: "#16a34a", fontWeight: 600, textDecoration: "none" }}>
              Sign up
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
