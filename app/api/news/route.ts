import { NextRequest, NextResponse } from "next/server";

const mockNews = [
  {
    id: "1",
    title: "PM-KISAN Scheme: ₹2,000 installment released to 11 crore farmers",
    summary: "Union Agriculture Minister Shri Narendra Singh Tomar releases 12th installment of PM-KISAN, benefiting over 11 crore farmers across India with direct benefit transfer of ₹2,000 each.",
    source: "PIB India",
    category: "Schemes",
    publishedAt: "2026-04-11T08:30:00Z",
    imageUrl: null,
    url: "https://pmkisan.gov.in/",
  },
  {
    id: "2",
    title: "IMD predicts above-normal monsoon for 2026, La Nina conditions expected",
    summary: "India Meteorological Department forecasts 106% of long-period average rainfall for 2026 monsoon season, boosting prospects for agricultural output. El Niño conditions expected to weaken.",
    source: "IMD India",
    category: "Weather",
    publishedAt: "2026-04-10T14:00:00Z",
    imageUrl: null,
    url: "https://mausam.imd.gov.in/",
  },
  {
    id: "3",
    title: "Wheat MSP increased to ₹2,275 per quintal for 2026-27 season",
    summary: "Cabinet approves increase in Minimum Support Price for wheat by ₹150 per quintal. MSP for rabi crops announced to ensure remunerative prices for farmers.",
    source: "Ministry of Agriculture",
    category: "Market",
    publishedAt: "2026-04-10T10:15:00Z",
    imageUrl: null,
    url: "https://agricoop.nic.in/",
  },
  {
    id: "4",
    title: "Fall Armyworm threat: ICAR issues advisory for maize farmers",
    summary: "Indian Council of Agricultural Research releases integrated pest management guidelines as Fall Armyworm sightings reported in Karnataka and Maharashtra. Farmers urged to adopt recommended measures.",
    source: "ICAR India",
    category: "Crop Health",
    publishedAt: "2026-04-09T16:45:00Z",
    imageUrl: null,
    url: "https://www.icar.org.in/",
  },
  {
    id: "5",
    title: "Kisan Rail: New routes connect Bihar to Delhi and Mumbai",
    summary: "Indian Railways expands Kisan Rail services with two new routes from Muzaffarpur to reduce transport costs for perishable produce. Farmers to get 50% discount on transportation.",
    source: "Indian Railways",
    category: "Logistics",
    publishedAt: "2026-04-09T09:20:00Z",
    imageUrl: null,
    url: "https://indianrailways.gov.in/",
  },
  {
    id: "6",
    title: "Soil Health Card Scheme: 14 crore cards distributed",
    summary: "Government's flagship Soil Health Card scheme reaches milestone of 14 crore cards issued to farmers. Scheme helps farmers optimize fertilizer use based on soil test results.",
    source: "PIB India",
    category: "Schemes",
    publishedAt: "2026-04-08T11:00:00Z",
    imageUrl: null,
    url: "https://soilhealth.dac.gov.in/",
  },
  {
    id: "7",
    title: "Cotton exports surge 35% as global demand rises",
    summary: "India's cotton exports witness significant growth driven by demand from Bangladesh and Vietnam. Cotton Corporation of India reports increased procurement from farmers.",
    source: "Cotton Corporation of India",
    category: "Market",
    publishedAt: "2026-04-07T13:30:00Z",
    imageUrl: null,
    url: "https://cotcorp.gov.in/",
  },
  {
    id: "8",
    title: "Micro Irrigation Fund: ₹5,000 crore sanctioned for drip irrigation",
    summary: "NABARD disburses funds under Micro Irrigation Fund to states for promoting water-saving technologies. Subsidy increased to 80% for small and marginal farmers.",
    source: "NABARD",
    category: "Schemes",
    publishedAt: "2026-04-06T07:45:00Z",
    imageUrl: null,
    url: "https://www.nabard.org/",
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search")?.toLowerCase();

  let filtered = mockNews;

  if (category && category !== "all") {
    filtered = filtered.filter(n => n.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    filtered = filtered.filter(n => 
      n.title.toLowerCase().includes(search) ||
      n.summary.toLowerCase().includes(search)
    );
  }

  return NextResponse.json({
    news: filtered,
    total: filtered.length,
    lastUpdated: new Date().toISOString(),
  });
}
