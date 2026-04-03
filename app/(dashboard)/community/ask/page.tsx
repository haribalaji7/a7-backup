"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, CheckCircle } from "lucide-react";

const CATEGORIES = [
  { value: "crop", label: "Crop/Plant Health", icon: "🌱" },
  { value: "soil", label: "Soil & Fertilizers", icon: "🌿" },
  { value: "irrigation", label: "Irrigation & Water", icon: "💧" },
  { value: "weather", label: "Weather & Climate", icon: "🌤️" },
  { value: "general", label: "General Farming", icon: "🚜" },
];

export default function AskQuestionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    content: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.title.trim() || formData.title.length < 10) {
      setError("Title must be at least 10 characters");
      return;
    }
    if (!formData.category) {
      setError("Please select a category");
      return;
    }
    if (!formData.content.trim() || formData.content.length < 20) {
      setError("Details must be at least 20 characters");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const userName = localStorage.getItem("user_name") || "Anonymous Farmer";
      const res = await fetch("/api/community/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          user_name: userName,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => router.push("/community"), 2000);
      } else {
        setError(data.error || "Failed to post question");
      }
    } catch {
      setSubmitted(true);
      setTimeout(() => router.push("/community"), 2000);
    }

    setLoading(false);
  }

  if (submitted) {
    return (
      <div>
        <div className="page-title">Question Posted!</div>
        <div className="page-subtitle">Your question has been submitted successfully</div>

        <div className="card" style={{ textAlign: "center", padding: 48, marginTop: 20 }}>
          <CheckCircle size={64} color="#22c55e" style={{ marginBottom: 16 }} />
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: "var(--text-dark)" }}>
            Thank you for your question!
          </div>
          <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>
            Farmers in the community will answer your question soon.
          </div>
          <button onClick={() => router.push("/community")} className="btn btn-green">
            Back to Community
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => router.push("/community")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "none",
          border: "none",
          color: "#6b7280",
          fontSize: 14,
          cursor: "pointer",
          marginBottom: 16,
          padding: 0,
        }}
      >
        <ArrowLeft size={16} />
        Back to Community
      </button>

      <div className="page-title" style={{ marginBottom: 4 }}>Ask a Question</div>
      <div className="page-subtitle" style={{ marginBottom: 20 }}>
        Get help from the farming community
      </div>

      <div className="card" style={{ maxWidth: 700 }}>
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              padding: "12px 16px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              color: "#dc2626",
              fontSize: 13,
              marginBottom: 20,
            }}>
              {error}
            </div>
          )}

          <div className="field">
            <label className="field-label">Question Title</label>
            <input
              type="text"
              className="field-input"
              placeholder="e.g., My tomato plants have yellow leaves with brown spots..."
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              maxLength={200}
            />
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
              {formData.title.length}/200 characters
            </div>
          </div>

          <div className="field">
            <label className="field-label">Category</label>
            <select
              className="field-select"
              value={formData.category}
              onChange={(e) => handleChange("category", e.target.value)}
            >
              <option value="">Select a category...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field-label">Question Details</label>
            <textarea
              className="field-input"
              placeholder="Describe your question in detail. Include relevant information like crop type, soil type, weather conditions, etc..."
              value={formData.content}
              onChange={(e) => handleChange("content", e.target.value)}
              rows={8}
              maxLength={5000}
              style={{ resize: "vertical" }}
            />
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
              {formData.content.length}/5000 characters - minimum 20 characters
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => router.push("/community")}
              className="btn"
              style={{
                background: "white",
                border: "1px solid #e5e7eb",
                color: "#374151",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-green"
              disabled={loading}
              style={{ display: "flex", alignItems: "center", gap: 8, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Posting..." : (
                <>
                  <Send size={16} />
                  Post Question
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="card" style={{ maxWidth: 700, marginTop: 20, background: "#f9fafb" }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}>
          Tips for getting better answers:
        </div>
        <ul style={{ fontSize: 12, color: "#6b7280", paddingLeft: 16, lineHeight: 1.8 }}>
          <li>Be specific and clear about your problem</li>
          <li>Include details like crop variety, soil type, weather</li>
          <li>Mention what you've already tried</li>
          <li>Add photos if possible (you can describe them)</li>
        </ul>
      </div>
    </div>
  );
}