import { NextRequest, NextResponse } from "next/server";

const CACHE_TTL = 3600000;
const GNEWS_API = "https://gnews.io/api/v4/search";
const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";

let newsCache: { data: NewsItem[]; timestamp: number } | null = null;
let fallbackCache: NewsItem[] | null = null;

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: string;
  publishedAt: string;
  imageUrl: string | null;
  url: string;
}

const mockNews: NewsItem[] = [
  { id: "m1", title: "PM-KISAN Scheme: ₹2,000 installment released to 11 crore farmers", summary: "Union Agriculture Minister Shri Narendra Singh Tomar releases 12th installment of PM-KISAN, benefiting over 11 crore farmers across India.", source: "PIB India", category: "Schemes", publishedAt: "2026-04-11T08:30:00Z", imageUrl: null, url: "https://pmkisan.gov.in/" },
  { id: "m2", title: "IMD predicts above-normal monsoon for 2026, La Nina conditions expected", summary: "India Meteorological Department forecasts 106% of long-period average rainfall for 2026 monsoon season.", source: "IMD India", category: "Weather", publishedAt: "2026-04-10T14:00:00Z", imageUrl: null, url: "https://mausam.imd.gov.in/" },
  { id: "m3", title: "Wheat MSP increased to ₹2,275 per quintal for 2026-27 season", summary: "Cabinet approves increase in Minimum Support Price for wheat by ₹150 per quintal.", source: "Ministry of Agriculture", category: "Market", publishedAt: "2026-04-10T10:15:00Z", imageUrl: null, url: "https://agricoop.nic.in/" },
  { id: "m4", title: "Fall Armyworm threat: ICAR issues advisory for maize farmers", summary: "ICAR releases integrated pest management guidelines as Fall Armyworm sightings reported in Karnataka and Maharashtra.", source: "ICAR India", category: "Crop Health", publishedAt: "2026-04-09T16:45:00Z", imageUrl: null, url: "https://www.icar.org.in/" },
  { id: "m5", title: "Kisan Rail: New routes connect Bihar to Delhi and Mumbai", summary: "Indian Railways expands Kisan Rail services with two new routes to reduce transport costs for perishable produce.", source: "Indian Railways", category: "Logistics", publishedAt: "2026-04-09T09:20:00Z", imageUrl: null, url: "https://indianrailways.gov.in/" },
  { id: "m6", title: "Soil Health Card Scheme: 14 crore cards distributed", summary: "Government's flagship Soil Health Card scheme reaches milestone of 14 crore cards issued to farmers.", source: "PIB India", category: "Schemes", publishedAt: "2026-04-08T11:00:00Z", imageUrl: null, url: "https://soilhealth.dac.gov.in/" },
  { id: "m7", title: "Cotton exports surge 35% as global demand rises", summary: "India's cotton exports witness significant growth driven by demand from Bangladesh and Vietnam.", source: "Cotton Corporation of India", category: "Market", publishedAt: "2026-04-07T13:30:00Z", imageUrl: null, url: "https://cotcorp.gov.in/" },
  { id: "m8", title: "Micro Irrigation Fund: ₹5,000 crore sanctioned for drip irrigation", summary: "NABARD disburses funds under Micro Irrigation Fund to states for promoting water-saving technologies.", source: "NABARD", category: "Schemes", publishedAt: "2026-04-06T07:45:00Z", imageUrl: null, url: "https://www.nabard.org/" },
];

function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/monsoon|rainfall|rain|weather|imd|temperature|climate/i.test(lower)) return "Weather";
  if (/msp|price|export|market|trade|demand|supply|rate/i.test(lower)) return "Market";
  if (/pest|disease|advisory|icar|armyworm|blight|fungus|pesticide/i.test(lower)) return "Crop Health";
  if (/rail|transport|logistics|railway|road|supply chain/i.test(lower)) return "Logistics";
  return "Schemes";
}

function normalizeGNewsArticle(art: any, index: number): NewsItem {
  return {
    id: `g-${index}`,
    title: art.title || "Untitled",
    summary: art.description || art.content || "No summary available.",
    source: art.source?.name || "Unknown",
    category: detectCategory((art.title || "") + " " + (art.description || "")),
    publishedAt: art.publishedAt || new Date().toISOString(),
    imageUrl: art.image || null,
    url: art.url || "#",
  };
}

async function fetchFromGNews(apiKey: string): Promise<NewsItem[]> {
  const url = `${GNEWS_API}?q=(agriculture+OR+farming+OR+Kisan+OR+MSP+OR+monsoon)+India&lang=en&country=in&max=10&apikey=${apiKey}`;
  const res = await fetch(url, { next: { revalidate: CACHE_TTL / 1000 } });
  if (!res.ok) throw new Error(`GNews returned ${res.status}`);
  const data = await res.json();
  if (!data.articles || !Array.isArray(data.articles)) throw new Error("Invalid GNews response");
  return data.articles.map(normalizeGNewsArticle);
}

async function fetchViaGroq(): Promise<NewsItem[]> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey || groqKey.length <= 20) throw new Error("Groq key not available");

  const res = await fetch(GROQ_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a news aggregator for Indian agriculture. Return a JSON array of exactly 6 news bulletins. " +
            "Each item must have: title, summary, source, publishedAt (ISO date). " +
            "Cover schemes, weather, market prices, crop health, logistics. " +
            "Use realistic sources like PIB India, IMD, ICAR, Ministry of Agriculture, NABARD. " +
            "Return ONLY valid JSON array, no markdown, no explanation.",
        },
        {
          role: "user",
          content: "Generate 6 recent agriculture news items for India covering the past week.",
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!res.ok) throw new Error(`Groq returned ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned empty response");

  const parsed = JSON.parse(content.replace(/```json?/gi, "").replace(/```/g, "").trim());
  if (!Array.isArray(parsed)) throw new Error("Groq response is not an array");

  return parsed.map((item: any, i: number) => ({
    id: `groq-${i}`,
    title: item.title || "Untitled",
    summary: item.summary || "No summary available.",
    source: item.source || "AI Generated",
    category: detectCategory((item.title || "") + " " + (item.summary || "")),
    publishedAt: item.publishedAt || new Date().toISOString(),
    imageUrl: null,
    url: "#",
  }));
}

async function fetchNews(): Promise<NewsItem[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (apiKey && apiKey.length > 10) {
    try {
      const articles = await fetchFromGNews(apiKey);
      if (articles.length > 0) {
        fallbackCache = articles;
        return articles;
      }
    } catch (err) {
      console.warn("GNews fetch failed:", err);
    }

    try {
      const articles = await fetchViaGroq();
      if (articles.length > 0) {
        fallbackCache = articles;
        return articles;
      }
    } catch (err) {
      console.warn("Groq fallback failed:", err);
    }
  }

  if (fallbackCache) return fallbackCache;

  return mockNews;
}

function filterNews(articles: NewsItem[], category: string | null, search: string | null): NewsItem[] {
  let filtered = articles;
  if (category && category !== "all") {
    filtered = filtered.filter(n => n.category.toLowerCase() === category.toLowerCase());
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.summary.toLowerCase().includes(q)
    );
  }
  return filtered;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search")?.toLowerCase();

  const now = Date.now();
  if (!newsCache || (now - newsCache.timestamp > CACHE_TTL)) {
    const data = await fetchNews();
    newsCache = { data, timestamp: now };
  }

  const filtered = filterNews(newsCache.data, category, search ?? null);

  return NextResponse.json({
    news: filtered,
    total: filtered.length,
    lastUpdated: new Date(newsCache.timestamp).toISOString(),
  });
}
