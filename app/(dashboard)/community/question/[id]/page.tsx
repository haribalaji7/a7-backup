"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Send, ThumbsUp, CheckCircle, Circle, MessageCircle, Eye } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const DEMO_QUESTIONS: Record<string, {
  title: string;
  content: string;
  category: string;
  user_name: string;
  created_at: string;
  answers_count: number;
  views: number;
}> = {
  "demo-1": {
    title: "My tomato plants have yellow leaves with brown spots. What disease is this and how to treat?",
    content: "The leaves started turning yellow from the bottom. Now there are brown circular spots on the leaves. I'm worried this might spread to all plants.",
    category: "crop",
    user_name: "Ramesh Kumar",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    answers_count: 2,
    views: 156,
  },
  "demo-2": {
    title: "Which fertilizer is best for wheat in sandy soil?",
    content: "I have sandy loam soil in my field. What NPK ratio should I use for wheat cultivation this rabi season?",
    category: "soil",
    user_name: "Suresh Patel",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    answers_count: 1,
    views: 89,
  },
  "demo-3": {
    title: "How often should I irrigate paddy during summer?",
    content: "It's summer season and temperatures are rising. What's the recommended irrigation schedule for paddy?",
    category: "irrigation",
    user_name: "Vijay Reddy",
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    answers_count: 3,
    views: 234,
  },
  "demo-4": {
    title: "Will heavy rainfall affect mango flowering season?",
    content: "There's heavy rainfall forecast for next week. I have mango trees that are about to flower. Should I be worried?",
    category: "weather",
    user_name: "Anil Sharma",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    answers_count: 1,
    views: 67,
  },
  "demo-5": {
    title: "What are the best practices for organic farming?",
    content: "I want to switch to organic farming. What are the basic practices I should follow for vegetables?",
    category: "general",
    user_name: "Mahesh Singh",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    answers_count: 2,
    views: 312,
  },
};

const DEMO_ANSWERS: Record<string, Array<{
  id: string;
  content: string;
  user_name: string;
  created_at: string;
  upvotes: number;
  is_accepted: boolean;
}>> = {
  "demo-1": [
    {
      id: "a1-1",
      content: "Based on your description, this sounds like Early Blight (Alternaria solani). The yellow leaves with brown concentric spots are classic symptoms. Here's what to do:\n\n1. Remove affected leaves immediately\n2. Apply copper-based fungicide (e.g., Copper Oxychloride 50% @ 2-3 g per liter)\n3. Ensure proper spacing between plants for air circulation\n4. Avoid overhead irrigation - water at base\n5. Apply neem oil spray weekly as preventive measure",
      user_name: "Dr. Prakash Rao",
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      upvotes: 12,
      is_accepted: true,
    },
    {
      id: "a1-2",
      content: "I had the same issue last year. The brown spots with yellow halo are definitely early blight. I used Mancozeb 75% WP @ 2g per liter and it worked well. Also, make sure to remove plant debris after harvest as the fungus can overwinter.",
      user_name: "Krishna Murthy",
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      upvotes: 8,
      is_accepted: false,
    },
  ],
  "demo-2": [
    {
      id: "a2-1",
      content: "For sandy soil, I recommend using DAP (Di-Ammonium Phosphate) with urea. Apply:\n- DAP: 100 kg/acre\n- Urea: 50 kg/acre\n- Also add zinc sulfate 25 kg/acre\n\nSandy soil has low nutrient retention, so split the urea application - half at sowing and half at knee height stage.",
      user_name: "Agriculture Officer Venkatesh",
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      upvotes: 5,
      is_accepted: true,
    },
  ],
  "demo-3": [
    {
      id: "a3-1",
      content: "For paddy in summer, I recommend alternate wetting and drying (AWD) method:\n- Irrigate when water level drops 5cm below soil surface\n- Maintain 2-5cm water depth during critical stages\n- Drain field 15 days before harvest\nThis saves 30% water and reduces disease incidence.",
      user_name: "Balu Naidu",
      created_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      upvotes: 15,
      is_accepted: true,
    },
    {
      id: "a3-2",
      content: "During summer, water evaporates quickly. I irrigate every 2-3 days in the first month, then weekly after that. The key is to keep the field saturated but not flooded. Morning irrigation is best.",
      user_name: "Ravi Kumar",
      created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      upvotes: 7,
      is_accepted: false,
    },
    {
      id: "a3-3",
      content: "Don't overwater! Excess water leads to root rot and bacterial diseases. Use furrow irrigation instead of flooding. Check soil moisture with your hand - if it forms a ball and doesn't crumble, there's enough moisture.",
      user_name: "Sunita Devi",
      created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      upvotes: 9,
      is_accepted: false,
    },
  ],
  "demo-4": [
    {
      id: "a4-1",
      content: "Moderate rainfall during flowering is actually beneficial for mango trees as it helps with pollination. However, heavy rainfall can:\n- Wash away pollen\n- Increase fungal diseases like anthracnose\n- Cause flower drop\n\nProtect flowering trees with plastic sheet covers during heavy rain.",
      user_name: "Horticulture Expert Radha",
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      upvotes: 6,
      is_accepted: true,
    },
  ],
  "demo-5": [
    {
      id: "a5-1",
      content: "Key practices for organic vegetable farming:\n1. Use compost and vermicompost - 2-3 tons/acre\n2. Practice crop rotation (legume → leafy → fruiting)\n3. Use neem-based pest control\n4. Mulching to retain moisture and control weeds\n5. Green manure crops before planting\n6. Biological pest control (trichogramma cards)\n\nStart small and expand gradually!",
      user_name: "Organic Farmer Gopal",
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      upvotes: 18,
      is_accepted: true,
    },
    {
      id: "a5-2",
      content: "The most important thing in organic farming is soil health. Focus on:\n- Adding organic matter regularly\n- Using biofertilizers (Azotobacter, PSB)\n- Avoiding chemical pesticides\n- Companion planting\n- Natural predators for pest management\n\nIt takes time but yields better quality produce with premium prices!",
      user_name: "Meera Jain",
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      upvotes: 11,
      is_accepted: false,
    },
  ],
};

const CATEGORIES: Record<string, { label: string; icon: string }> = {
  crop: { label: "Crop/Plant Health", icon: "🌱" },
  soil: { label: "Soil & Fertilizers", icon: "🌿" },
  irrigation: { label: "Irrigation & Water", icon: "💧" },
  weather: { label: "Weather & Climate", icon: "🌤️" },
  general: { label: "General Farming", icon: "🚜" },
};

export default function QuestionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const questionId = params.id as string;
  const { user } = useAuth();

  const [question, setQuestion] = useState<typeof DEMO_QUESTIONS[string] | null>(null);
  const [answers, setAnswers] = useState<typeof DEMO_ANSWERS[string]>([]);
  const [newAnswer, setNewAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestionAndAnswers();
  }, [questionId]);

  async function fetchQuestionAndAnswers() {
    setLoading(true);
    try {
      const [qRes, aRes] = await Promise.all([
        fetch(`/api/community/questions/${questionId}`),
        fetch(`/api/community/answers?question_id=${questionId}`),
      ]);

      const qData = await qRes.json();
      const aData = await aRes.json();

      if (qData.question) {
        setQuestion(qData.question);
      } else if (DEMO_QUESTIONS[questionId]) {
        setQuestion(DEMO_QUESTIONS[questionId]);
      }

      if (aData.answers && aData.answers.length > 0) {
        setAnswers(aData.answers);
      } else if (DEMO_ANSWERS[questionId]) {
        setAnswers(DEMO_ANSWERS[questionId]);
      }
    } catch {
      if (DEMO_QUESTIONS[questionId]) {
        setQuestion(DEMO_QUESTIONS[questionId]);
        setAnswers(DEMO_ANSWERS[questionId] || []);
      }
    }
    setLoading(false);
  }

  async function handleSubmitAnswer() {
    if (!newAnswer.trim() || newAnswer.length < 10) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/community/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: questionId,
          content: newAnswer,
          user_id: user?.id || null,
          user_name: user?.email?.split('@')[0] || "Anonymous Farmer",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAnswers([...answers, data.answer]);
        setNewAnswer("");
      }
    } catch {
      const newAnswerObj = {
        id: `local-${Date.now()}`,
        content: newAnswer,
        user_name: user?.email?.split('@')[0] || "Anonymous Farmer",
        created_at: new Date().toISOString(),
        upvotes: 0,
        is_accepted: false,
      };
      setAnswers([...answers, newAnswerObj]);
      setNewAnswer("");
    }
    setSubmitting(false);
  }

  async function handleUpvote(answerId: string) {
    try {
      await fetch(`/api/community/answers/${answerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upvote" }),
      });
      setAnswers(answers.map(a => a.id === answerId ? { ...a, upvotes: a.upvotes + 1 } : a));
    } catch {
      setAnswers(answers.map(a => a.id === answerId ? { ...a, upvotes: a.upvotes + 1 } : a));
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  if (loading) {
    return (
      <div>
        <div className="page-title">Loading...</div>
      </div>
    );
  }

  if (!question) {
    return (
      <div>
        <div className="page-title">Question Not Found</div>
        <button onClick={() => router.push("/community")} className="btn btn-green" style={{ marginTop: 16 }}>
          Back to Community
        </button>
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

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{
            padding: "2px 10px",
            borderRadius: 4,
            fontSize: 12,
            background: "#f0fdf4",
            color: "#16a34a",
            fontWeight: 500,
          }}>
            {CATEGORIES[question.category]?.icon} {CATEGORIES[question.category]?.label}
          </span>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>• {formatDate(question.created_at)}</span>
          <span style={{ fontSize: 12, color: "#9ca3af", display: "flex", alignItems: "center", gap: 4 }}>
            <Eye size={12} /> {question.views} views
          </span>
        </div>

        <div style={{ fontSize: 18, fontWeight: 600, color: "#1f2937", marginBottom: 12, lineHeight: 1.5 }}>
          {question.title}
        </div>

        <div style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.7, marginBottom: 16 }}>
          {question.content}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6b7280", borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>
          <span>👤 Asked by {question.user_name}</span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#1f2937" }}>
          {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
        </div>
      </div>

      {answers.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 32, marginBottom: 20 }}>
          <MessageCircle size={40} color="#d1d5db" style={{ marginBottom: 12 }} />
          <div style={{ color: "#6b7280", marginBottom: 8 }}>No answers yet</div>
          <div style={{ fontSize: 13, color: "#9ca3af" }}>Be the first to answer this question!</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
          {answers.map((answer) => (
            <div
              key={answer.id}
              className="card"
              style={{
                padding: 16,
                borderLeft: answer.is_accepted ? "3px solid #22c55e" : "3px solid transparent",
              }}
            >
              {answer.is_accepted && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, color: "#16a34a", fontSize: 12, fontWeight: 500 }}>
                  <CheckCircle size={14} />
                  Accepted Answer
                </div>
              )}

              <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, marginBottom: 12, whiteSpace: "pre-wrap" }}>
                {answer.content}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>
                  Answered by {answer.user_name} • {formatDate(answer.created_at)}
                </div>
                <button
                  onClick={() => handleUpvote(answer.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 10px",
                    borderRadius: 16,
                    border: "1px solid #e5e7eb",
                    background: "white",
                    color: "#6b7280",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  <ThumbsUp size={12} />
                  {answer.upvotes}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {user ? (
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1f2937", marginBottom: 12 }}>
            Your Answer
          </div>
          <textarea
            className="field-input"
            placeholder="Write your answer here. Share your knowledge to help fellow farmers..."
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            rows={5}
            style={{ resize: "vertical", marginBottom: 12 }}
          />
          <button
            onClick={handleSubmitAnswer}
            disabled={!newAnswer.trim() || newAnswer.length < 10 || submitting}
            className="btn btn-green"
            style={{ display: "flex", alignItems: "center", gap: 8, opacity: (!newAnswer.trim() || newAnswer.length < 10 || submitting) ? 0.5 : 1 }}
          >
            <Send size={14} />
            {submitting ? "Submitting..." : "Submit Answer"}
          </button>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>
            Minimum 10 characters required
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: "center", padding: 24, background: "#f9fafb" }}>
          <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>
            Please login to post an answer
          </div>
          <button onClick={() => router.push("/login")} className="btn btn-green">
            Login to Answer
          </button>
        </div>
      )}
    </div>
  );
}