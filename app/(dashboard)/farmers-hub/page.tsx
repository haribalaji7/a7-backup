"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Landmark, Newspaper } from "lucide-react";

const SchemeCard = dynamic(() => import("@/components/farmers/SchemeCard"), { ssr: false });
const NewsSection = dynamic(() => import("@/components/farmers/NewsSection"), { ssr: false });

export default function FarmersHubPage() {
  const [activeTab, setActiveTab] = useState<"schemes" | "news">("schemes");
  const [schemes, setSchemes] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [schemeCategory, setSchemeCategory] = useState("all");
  const [newsCategory, setNewsCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schemesRes, newsRes] = await Promise.all([
          fetch(`/api/schemes?category=${schemeCategory}&search=${searchQuery}`),
          fetch(`/api/news?category=${newsCategory}`),
        ]);
        const schemesData = await schemesRes.json();
        const newsData = await newsRes.json();
        setSchemes(schemesData.schemes || []);
        setNews(newsData.news || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [schemeCategory, newsCategory]);

  return (
    <div>
      <div className="page-title">Farmers Hub</div>
      <div className="page-subtitle">Government Schemes & Daily Agriculture News</div>

      <div className="card farmers-hub" style={{ padding: 24 }}>
        <div className="farmers-tabs">
          <button 
            className={`farmers-tab ${activeTab === "schemes" ? "active" : ""}`}
            onClick={() => setActiveTab("schemes")}
          >
            <Landmark size={14} style={{ display: "inline", marginRight: 6 }} />
            Government Schemes
          </button>
          <button 
            className={`farmers-tab ${activeTab === "news" ? "active" : ""}`}
            onClick={() => setActiveTab("news")}
          >
            <Newspaper size={14} style={{ display: "inline", marginRight: 6 }} />
            Daily News
          </button>
        </div>

        <div className="farmers-filter">
          {activeTab === "schemes" ? (
            <>
              <input 
                type="text" 
                className="farmers-search" 
                placeholder="Search schemes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select 
                className="farmers-select"
                value={schemeCategory}
                onChange={(e) => setSchemeCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="Financial">Financial</option>
                <option value="Insurance">Insurance</option>
                <option value="Credit">Credit</option>
                <option value="Equipment">Equipment</option>
                <option value="Organic Farming">Organic Farming</option>
                <option value="Production">Production</option>
                <option value="Horticulture">Horticulture</option>
                <option value="Infrastructure">Infrastructure</option>
              </select>
            </>
          ) : (
            <select 
              className="farmers-select"
              value={newsCategory}
              onChange={(e) => setNewsCategory(e.target.value)}
              style={{ minWidth: 160 }}
            >
              <option value="all">All Categories</option>
              <option value="Schemes">Schemes</option>
              <option value="Weather">Weather</option>
              <option value="Market">Market</option>
              <option value="Crop Health">Crop Health</option>
              <option value="Logistics">Logistics</option>
            </select>
          )}
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="farmers-skeleton" style={{ height: 200 }} />
            ))}
          </div>
        ) : activeTab === "schemes" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {schemes.map((scheme) => (
              <SchemeCard key={scheme.id} scheme={scheme} />
            ))}
            {schemes.length === 0 && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 40, color: "#6b7280" }}>
                No schemes found matching your criteria.
              </div>
            )}
          </div>
        ) : (
          <NewsSection news={news} />
        )}
      </div>
    </div>
  );
}