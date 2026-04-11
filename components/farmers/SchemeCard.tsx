"use client";
import { ExternalLink, Star, IndianRupee } from "lucide-react";

interface Scheme {
  id: string;
  name: string;
  fullName: string;
  description: string;
  benefit: string;
  eligibility: string;
  category: string;
  state: string;
  lastUpdated: string;
  applyLink: string;
  isNew: boolean;
}

interface SchemeCardProps {
  scheme: Scheme;
}

export default function SchemeCard({ scheme }: SchemeCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const categoryColors: Record<string, string> = {
    Financial: "#16a34a",
    Insurance: "#7c3aed",
    Credit: "#0891b2",
    Equipment: "#ea580c",
    "Organic Farming": "#65a30d",
    Production: "#6366f1",
    Horticulture: "#db2777",
    Infrastructure: "#4b5563",
  };

  return (
    <div className="scheme-card">
      <div className="scheme-header">
        <div className="scheme-title-row">
          <span className="scheme-name">{scheme.name}</span>
          {scheme.isNew && <span className="scheme-badge-new">NEW</span>}
        </div>
        <span 
          className="scheme-category"
          style={{ background: categoryColors[scheme.category] || "#6b7280" }}
        >
          {scheme.category}
        </span>
      </div>
      
      <div className="scheme-fullname">{scheme.fullName}</div>
      <div className="scheme-description">{scheme.description}</div>
      
      <div className="scheme-benefit">
        <IndianRupee size={14} />
        <span>{scheme.benefit}</span>
      </div>
      
      <div className="scheme-eligibility">
        <span className="scheme-eligibility-label">Eligibility:</span> {scheme.eligibility}
      </div>
      
      <div className="scheme-footer">
        <div className="scheme-meta">
          <span className="scheme-state">{scheme.state}</span>
          <span className="scheme-date">{formatDate(scheme.lastUpdated)}</span>
        </div>
        <a 
          href={scheme.applyLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="scheme-apply-btn"
        >
          Apply Now
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}