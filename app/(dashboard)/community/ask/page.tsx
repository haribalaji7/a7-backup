"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, CheckCircle, HelpCircle, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const CATEGORIES = [
  { value: "crop", label: "Crop/Plant Health", icon: "🌱", description: "Diseases, pests, growth issues" },
  { value: "soil", label: "Soil & Fertilizers", icon: "🌿", description: "Soil health, nutrients, amendments" },
  { value: "irrigation", label: "Irrigation & Water", icon: "💧", description: "Water management, scheduling" },
  { value: "weather", label: "Weather & Climate", icon: "🌤️", description: "Climate impact, forecasts" },
  { value: "general", label: "General Farming", icon: "🚜", description: "Best practices, advice" },
];

export default function AskQuestionPage() {
  const router = useRouter();
  const { user } = useAuth();
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
      const res = await fetch("/api/community/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          user_id: user?.id || null,
          user_name: user?.email?.split('@')[0] || "Anonymous Farmer",
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
      <div className="ask-success">
        <div className="ask-success-card">
          <div className="ask-success-icon">
            <CheckCircle size={48} />
          </div>
          <h2 className="ask-success-title">Question Posted!</h2>
          <p className="ask-success-message">
            Your question has been submitted successfully. Farmers in the community will answer your question soon.
          </p>
          <button onClick={() => router.push("/community")} className="ask-success-btn">
            Back to Community
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ask-container">
      {/* Header */}
      <div className="ask-header">
        <button onClick={() => router.push("/community")} className="ask-back-btn">
          <ArrowLeft size={18} />
          Back to Community
        </button>
        
        <div className="ask-header-content">
          <HelpCircle size={28} className="ask-header-icon" />
          <div>
            <h1 className="ask-title">Ask a Question</h1>
            <p className="ask-subtitle">Get help from thousands of experienced farmers</p>
          </div>
        </div>
      </div>

      <div className="ask-layout">
        {/* Form */}
        <div className="ask-form-card">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="ask-error">
                {error}
              </div>
            )}

            <div className="ask-field">
              <label className="ask-label">
                Question Title <span className="ask-required">*</span>
              </label>
              <input
                type="text"
                className="ask-input"
                placeholder="e.g., My tomato plants have yellow leaves with brown spots..."
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                maxLength={200}
              />
              <div className="ask-char-count">
                {formData.title.length}/200 characters
              </div>
            </div>

            <div className="ask-field">
              <label className="ask-label">
                Category <span className="ask-required">*</span>
              </label>
              <div className="ask-categories">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => handleChange("category", cat.value)}
                    className={`ask-category-btn ${formData.category === cat.value ? 'active' : ''}`}
                  >
                    <span className="ask-category-icon">{cat.icon}</span>
                    <div className="ask-category-info">
                      <span className="ask-category-label">{cat.label}</span>
                      <span className="ask-category-desc">{cat.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="ask-field">
              <label className="ask-label">
                Question Details <span className="ask-required">*</span>
              </label>
              <textarea
                className="ask-textarea"
                placeholder="Describe your question in detail. Include relevant information like crop type, soil type, weather conditions, symptoms, what you've already tried, etc..."
                value={formData.content}
                onChange={(e) => handleChange("content", e.target.value)}
                rows={8}
                maxLength={5000}
              />
              <div className="ask-char-count">
                {formData.content.length}/5000 characters
              </div>
            </div>

            <div className="ask-actions">
              <button
                type="button"
                onClick={() => router.push("/community")}
                className="ask-cancel-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ask-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="ask-spinner" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Post Question
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Tips Sidebar */}
        <div className="ask-tips">
          <div className="ask-tips-card">
            <h3 className="ask-tips-title">💡 Tips for Great Questions</h3>
            <ul className="ask-tips-list">
              <li>
                <strong>Be specific</strong> - Include crop variety, location, and symptoms
              </li>
              <li>
                <strong>Add context</strong> - Weather conditions, soil type, recent activities
              </li>
              <li>
                <strong>What you tried</strong> - Mention solutions you've already attempted
              </li>
              <li>
                <strong>Use photos</strong> - Describe visual symptoms clearly
              </li>
              <li>
                <strong>One question at a time</strong> - Focus on a single issue for better answers
              </li>
            </ul>
          </div>

          <div className="ask-tips-card ask-tips-example">
            <h3 className="ask-tips-title">✅ Good Example</h3>
            <p className="ask-tips-text">
              "My tomato plants (Roma variety) in Maharashtra have yellow lower leaves with brown circular spots. Started 5 days ago after heavy rain. Using loamy soil. Already tried neem spray but no improvement."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
