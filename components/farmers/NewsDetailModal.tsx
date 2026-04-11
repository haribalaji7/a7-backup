"use client";

import { X, ExternalLink, Clock, Calendar } from "lucide-react";

interface News {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: string;
  publishedAt: string;
  imageUrl: string | null;
  url: string;
}

interface NewsDetailModalProps {
  news: News | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function NewsDetailModal({ news, isOpen, onClose }: NewsDetailModalProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const categoryColors: Record<string, string> = {
    Schemes: "linear-gradient(135deg, #16a34a, #15803d)",
    Weather: "linear-gradient(135deg, #0ea5e9, #0284c7)",
    Market: "linear-gradient(135deg, #f59e0b, #d97706)",
    "Crop Health": "linear-gradient(135deg, #ef4444, #dc2626)",
    Logistics: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
    Production: "linear-gradient(135deg, #6366f1, #4f46e5)",
  };

  if (!isOpen || !news) return null;

  return (
    <div className="news-modal-overlay" onClick={onClose}>
      <div className="news-modal" onClick={(e) => e.stopPropagation()}>
        <button className="news-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="news-modal-header">
          <span
            className="news-modal-category"
            style={{ background: categoryColors[news.category] || "#6b7280" }}
          >
            {news.category}
          </span>
          <span className="news-modal-source">{news.source}</span>
        </div>

        <h2 className="news-modal-title">{news.title}</h2>

        <div className="news-modal-meta">
          <div className="news-modal-time">
            <Calendar size={14} style={{ display: "inline", marginRight: 6 }} />
            {formatDate(news.publishedAt)}
          </div>
        </div>

        <div className="news-modal-content">
          <p className="news-modal-summary">{news.summary}</p>
        </div>

        <div className="news-modal-footer">
          <a
            href={news.url}
            target="_blank"
            rel="noopener noreferrer"
            className="news-modal-link"
          >
            Read Original Article
            <ExternalLink size={14} style={{ display: "inline", marginLeft: 6 }} />
          </a>
        </div>
      </div>
    </div>
  );
}
