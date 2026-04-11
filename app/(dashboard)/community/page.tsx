"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, Plus, Eye, Clock, ChevronRight, Users, TrendingUp, Filter, Search, Sparkles } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const CATEGORIES = [
  { value: "all", label: "All Questions", icon: "📋", color: "#6b7280", bgColor: "#f3f4f6" },
  { value: "crop", label: "Crop Health", icon: "🌱", color: "#16a34a", bgColor: "#dcfce7" },
  { value: "soil", label: "Soil & Fertilizers", icon: "🌿", color: "#b45309", bgColor: "#fef3c7" },
  { value: "irrigation", label: "Irrigation", icon: "💧", color: "#1d4ed8", bgColor: "#dbeafe" },
  { value: "weather", label: "Weather", icon: "🌤️", color: "#4338ca", bgColor: "#e0e7ff" },
  { value: "general", label: "General", icon: "🚜", color: "#6b7280", bgColor: "#f3f4f6" },
];

const DEMO_QUESTIONS = [
  {
    id: "demo-1",
    title: "My tomato plants have yellow leaves with brown spots. What disease is this and how to treat?",
    content: "The leaves started turning yellow from the bottom. Now there are brown circular spots on the leaves. I'm worried this might spread to all plants.",
    category: "crop",
    user_name: "Ramesh Kumar",
    user_avatar: "RK",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    answers_count: 2,
    views: 156,
    is_trending: true,
  },
  {
    id: "demo-2",
    title: "Which fertilizer is best for wheat in sandy soil?",
    content: "I have sandy loam soil in my field. What NPK ratio should I use for wheat cultivation this rabi season?",
    category: "soil",
    user_name: "Suresh Patel",
    user_avatar: "SP",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    answers_count: 1,
    views: 89,
    is_trending: false,
  },
  {
    id: "demo-3",
    title: "How often should I irrigate paddy during summer?",
    content: "It's summer season and temperatures are rising. What's the recommended irrigation schedule for paddy?",
    category: "irrigation",
    user_name: "Vijay Reddy",
    user_avatar: "VR",
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    answers_count: 3,
    views: 234,
    is_trending: true,
  },
  {
    id: "demo-4",
    title: "Will heavy rainfall affect mango flowering season?",
    content: "There's heavy rainfall forecast for next week. I have mango trees that are about to flower. Should I be worried?",
    category: "weather",
    user_name: "Anil Sharma",
    user_avatar: "AS",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    answers_count: 1,
    views: 67,
    is_trending: false,
  },
  {
    id: "demo-5",
    title: "What are the best practices for organic farming?",
    content: "I want to switch to organic farming. What are the basic practices I should follow for vegetables?",
    category: "general",
    user_name: "Mahesh Singh",
    user_avatar: "MS",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    answers_count: 2,
    views: 312,
    is_trending: true,
  },
];

export default function CommunityPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<typeof DEMO_QUESTIONS>([]);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredQuestions = questions.filter(q => 
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    return date.toLocaleDateString("en-IN");
  }

  function getCategoryStyle(cat: string) {
    return CATEGORIES.find((c) => c.value === cat) || CATEGORIES[0];
  }

  const totalAnswers = questions.reduce((sum, q) => sum + q.answers_count, 0);
  const totalViews = questions.reduce((sum, q) => sum + q.views, 0);

  return (
    <div className="community-container">
      {/* Hero Section */}
      <div className="community-hero">
        <div className="community-hero-content">
          <div>
            <div className="community-hero-badge">
              <Sparkles size={14} />
              <span>Farmer Community</span>
            </div>
            <h1 className="community-hero-title">Community Q&A</h1>
            <p className="community-hero-subtitle">
              Connect with 10,000+ farmers. Ask questions, share knowledge, and get expert advice.
            </p>
          </div>
          {user && (
            <Link href="/community/ask" className="community-ask-btn">
              <Plus size={18} />
              Ask Question
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="community-stats">
          <div className="community-stat">
            <Users size={20} />
            <span className="community-stat-value">10,000+</span>
            <span className="community-stat-label">Farmers</span>
          </div>
          <div className="community-stat-divider" />
          <div className="community-stat">
            <MessageCircle size={20} />
            <span className="community-stat-value">{questions.length}</span>
            <span className="community-stat-label">Questions</span>
          </div>
          <div className="community-stat-divider" />
          <div className="community-stat">
            <Eye size={20} />
            <span className="community-stat-value">{totalViews.toLocaleString()}</span>
            <span className="community-stat-label">Views</span>
          </div>
        </div>
      </div>

      <div className="community-layout">
        {/* Sidebar */}
        <aside className="community-sidebar">
          <div className="community-sidebar-section">
            <h3 className="community-sidebar-title">Categories</h3>
            <div className="community-categories">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`community-category-btn ${category === cat.value ? 'active' : ''}`}
                >
                  <span className="community-category-icon">{cat.icon}</span>
                  <span className="community-category-label">{cat.label}</span>
                  {category === cat.value && <ChevronRight size={14} className="community-category-arrow" />}
                </button>
              ))}
            </div>
          </div>

          <div className="community-sidebar-section">
            <h3 className="community-sidebar-title">Trending Topics</h3>
            <div className="community-trending">
              <div className="community-trending-item">
                <TrendingUp size={14} className="community-trending-icon" />
                <span>Wheat MSP 2026</span>
              </div>
              <div className="community-trending-item">
                <TrendingUp size={14} className="community-trending-icon" />
                <span>Organic Farming</span>
              </div>
              <div className="community-trending-item">
                <TrendingUp size={14} className="community-trending-icon" />
                <span>Drip Irrigation</span>
              </div>
              <div className="community-trending-item">
                <TrendingUp size={14} className="community-trending-icon" />
                <span>PM-KISAN Scheme</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="community-main">
          {/* Search and Filters */}
          <div className="community-filters">
            <div className="community-search">
              <Search size={18} className="community-search-icon" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="community-search-input"
              />
            </div>
            <div className="community-sort">
              <Filter size={14} />
              {["newest", "popular", "unanswered"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`community-sort-btn ${sort === s ? 'active' : ''}`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Questions List */}
          {loading ? (
            <div className="community-loading">
              <div className="community-loading-spinner" />
              <span>Loading questions...</span>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="community-empty">
              <div className="community-empty-icon">💬</div>
              <h3>No questions found</h3>
              <p>Try adjusting your search or be the first to ask!</p>
              {user && (
                <Link href="/community/ask" className="community-ask-btn">
                  <Plus size={16} />
                  Ask Question
                </Link>
              )}
            </div>
          ) : (
            <div className="community-questions">
              {filteredQuestions.map((q, index) => {
                const catStyle = getCategoryStyle(q.category);
                return (
                  <Link
                    key={q.id}
                    href={`/community/question/${q.id}`}
                    className="community-question-card"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {q.is_trending && (
                      <div className="community-question-trending">
                        <TrendingUp size={12} />
                        <span>Trending</span>
                      </div>
                    )}
                    
                    <div className="community-question-header">
                      <span
                        className="community-question-category"
                        style={{ 
                          background: catStyle.bgColor,
                          color: catStyle.color 
                        }}
                      >
                        {catStyle.icon} {catStyle.label}
                      </span>
                      <span className="community-question-time">
                        <Clock size={12} />
                        {formatDate(q.created_at)}
                      </span>
                    </div>

                    <h3 className="community-question-title">{q.title}</h3>
                    <p className="community-question-preview">{q.content}</p>

                    <div className="community-question-footer">
                      <div className="community-question-author">
                        <div className="community-question-avatar">
                          {q.user_avatar}
                        </div>
                        <span className="community-question-name">{q.user_name}</span>
                      </div>
                      
                      <div className="community-question-stats">
                        <span className="community-question-stat">
                          <MessageCircle size={14} />
                          {q.answers_count} {q.answers_count === 1 ? 'answer' : 'answers'}
                        </span>
                        <span className="community-question-stat">
                          <Eye size={14} />
                          {q.views} views
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Floating Action Button for Mobile */}
      {user && (
        <Link href="/community/ask" className="community-fab">
          <Plus size={24} />
        </Link>
      )}
    </div>
  );
}
