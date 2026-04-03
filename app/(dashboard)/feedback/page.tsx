"use client";
import { useState } from "react";
import { MessageCircle, Send, CheckCircle, Star } from "lucide-react";

const feedbackTypes = [
  { value: "general", label: "General Feedback" },
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "improvement", label: "Improvement Suggestion" },
];

export default function FeedbackPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    type: "general",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (submitted) {
    return (
      <div>
        <div className="page-title">Thank You!</div>
        <div className="page-subtitle">Your feedback has been submitted successfully</div>

        <div className="card" style={{ textAlign: "center", padding: 48 }}>
          <CheckCircle size={64} color="#22c55e" style={{ marginBottom: 16 }} />
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: "var(--text-dark)" }}>
            We appreciate your feedback!
          </div>
          <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>
            Your input helps us improve Smart Agri AI for all farmers.
          </div>
          <button
            className="btn btn-green"
            onClick={() => {
              setSubmitted(false);
              setFormData({ name: "", email: "", type: "general", message: "" });
              setRating(0);
            }}
          >
            Submit Another Feedback
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-title">Feedback</div>
      <div className="page-subtitle">Help us improve Smart Agri AI — share your thoughts, report bugs, or suggest features</div>

      <div className="card" style={{ maxWidth: 600 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">How would you rate your experience?</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                >
                  <Star
                    size={28}
                    fill={star <= rating ? "#f59e0b" : "none"}
                    color={star <= rating ? "#f59e0b" : "#d1d5db"}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="field-label">Feedback Type</label>
            <select
              className="field-select"
              value={formData.type}
              onChange={(e) => handleChange("type", e.target.value)}
            >
              {feedbackTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="field">
              <label className="field-label">Name (Optional)</label>
              <input
                type="text"
                className="field-input"
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>

            <div className="field">
              <label className="field-label">Email (Optional)</label>
              <input
                type="email"
                className="field-input"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label className="field-label">Your Feedback</label>
            <textarea
              className="field-input"
              placeholder="Tell us what you think..."
              rows={5}
              value={formData.message}
              onChange={(e) => handleChange("message", e.target.value)}
              required
              style={{ resize: "vertical" }}
            />
          </div>

          <button type="submit" className="btn btn-green" style={{ width: "100%" }}>
            <Send size={16} />
            Submit Feedback
          </button>
        </form>
      </div>
    </div>
  );
}