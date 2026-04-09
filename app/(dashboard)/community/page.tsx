"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, Plus, Eye, Clock, ChevronRight } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const CATEGORIES = [
  { value: "all", label: "All Questions", icon: "📋" },
  { value: "crop", label: "Crop/Plant Health", icon: "🌱" },
  { value: "soil", label: "Soil & Fertilizers", icon: "🌿" },
  { value: "irrigation", label: "Irrigation & Water", icon: "💧" },
  { value: "weather", label: "Weather & Climate", icon: "🌤️" },
  { value: "general", label: "General Farming", icon: "🚜" },
];

const DEMO_QUESTIONS = [
  {
    id: "demo-1",
    title: "My tomato plants have yellow leaves with brown spots. What disease is this and how to treat?",
    content: "The leaves started turning yellow from the bottom. Now there are brown circular spots on the leaves. I'm worried this might spread to all plants.",
    category: "crop",
    user_name: "Ramesh Kumar",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    answers_count: 2,
    views: 156,
  },
  {
    id: "demo-2",
    title: "Which fertilizer is best for wheat in sandy soil?",
    content: "I have sandy loam soil in my field. What NPK ratio should I use for wheat cultivation this rabi season?",
    category: "soil",
    user_name: "Suresh Patel",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    answers_count: 1,
    views: 89,
  },
  {
    id: "demo-3",
    title: "How often should I irrigate paddy during summer?",
    content: "It's summer season and temperatures are rising. What's the recommended irrigation schedule for paddy?",
    category: "irrigation",
    user_name: "Vijay Reddy",
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    answers_count: 3,
    views: 234,
  },
  {
    id: "demo-4",
    title: "Will heavy rainfall affect mango flowering season?",
    content: "There's heavy rainfall forecast for next week. I have mango trees that are about to flower. Should I be worried?",
    category: "weather",
    user_name: "Anil Sharma",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    answers_count: 1,
    views: 67,
  },
  {
    id: "demo-5",
    title: "What are the best practices for organic farming?",
    content: "I want to switch to organic farming. What are the basic practices I should follow for vegetables?",
    category: "general",
    user_name: "Mahesh Singh",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    answers_count: 2,
    views: 312,
  },
];

export default function CommunityPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<typeof DEMO_QUESTIONS>([]);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, [category, sort]);

  async function fetchQuestions() {
    setLoading(true);
    try {
      const res = await fetch(`/api/community/questions?category=${category}&sort=${sort}`);
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
      } else {
        setQuestions(DEMO_QUESTIONS.filter((q) => category === "all" || q.category === category));
      }
    } catch {
      setQuestions(DEMO_QUESTIONS.filter((q) => category === "all" || q.category === category));
    }
    setLoading(false);
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    return date.toLocaleDateString("en-IN");
  }

  function getCategoryLabel(cat: string) {
    return CATEGORIES.find((c) => c.value === cat)?.label || cat;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <div className="page-title" style={{ marginBottom: 4 }}>Community Q&A</div>
          <div className="page-subtitle" style={{ marginBottom: 0 }}>
            Ask questions, share knowledge, help fellow farmers
          </div>
        </div>
                {user && (
          <Link href="/community/ask" className="btn btn-green" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Plus size={16} />
            Ask Question
          </Link>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 20 }}>
        <div className="card" style={{ height: "fit-content", padding: 16 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Categories</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: category === cat.value ? "#f0fdf4" : "transparent",
                  color: category === cat.value ? "#16a34a" : "#374151",
                  fontSize: 13,
                  cursor: "pointer",
                  textAlign: "left",
                  fontWeight: category === cat.value ? 500 : 400,
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            {["newest", "oldest", "unanswered"].map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: "1px solid",
                  borderColor: sort === s ? "#22c55e" : "#e5e7eb",
                  background: sort === s ? "#f0fdf4" : "white",
                  color: sort === s ? "#16a34a" : "#6b7280",
                  fontSize: 12,
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                {s === "newest" ? "⬆ Newest" : s === "oldest" ? "⬇ Oldest" : "○ Unanswered"}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="card" style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
              Loading questions...
            </div>
          ) : questions.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 40 }}>
              <MessageCircle size={48} color="#d1d5db" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 16, color: "#374151", marginBottom: 8 }}>No questions yet</div>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
                Be the first to ask a question!
              </div>
              {user && (
                <Link href="/community/ask" className="btn btn-green">
                  Ask Question
                </Link>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {questions.map((q) => (
                <Link
                  key={q.id}
                  href={`/community/question/${q.id}`}
                  className="card"
                  style={{ padding: 16, textDecoration: "none", transition: "all 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#22c55e")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#f3f4f6")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          background: q.category === "crop" ? "#dcfce7" : q.category === "soil" ? "#fef3c7" : q.category === "irrigation" ? "#dbeafe" : q.category === "weather" ? "#e0e7ff" : "#f3f4f6",
                          color: q.category === "crop" ? "#16a34a" : q.category === "soil" ? "#b45309" : q.category === "irrigation" ? "#1d4ed8" : q.category === "weather" ? "#4338ca" : "#6b7280",
                          fontWeight: 500,
                        }}>
                          {getCategoryLabel(q.category)}
                        </span>
                        <span style={{ fontSize: 11, color: "#9ca3af" }}>• {formatDate(q.created_at)}</span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 500, color: "#1f2937", marginBottom: 6, lineHeight: 1.4 }}>
                        {q.title}
                      </div>
                      <div style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 16 }}>
                        <span>👤 {q.user_name}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <MessageCircle size={12} /> {q.answers_count} answers
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Eye size={12} /> {q.views} views
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={20} color="#9ca3af" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}