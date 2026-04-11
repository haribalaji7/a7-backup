import { NextRequest, NextResponse } from "next/server";

const mockSchemes = [
  {
    id: "1",
    name: "PM-KISAN",
    fullName: "Pradhan Mantri Kisan Samman Nidhi",
    description: "Direct income support of Rs 6000/year to farmer families",
    benefit: "₹6,000/year",
    eligibility: "All landholding farmer families",
    category: "Financial",
    state: "All India",
    lastUpdated: "2026-04-10",
    applyLink: "https://pmkisan.gov.in",
    isNew: false,
  },
  {
    id: "2",
    name: "PMFBY",
    fullName: "Pradhan Mantri Fasal Bima Yojana",
    description: "Crop insurance scheme for yield losses due to natural calamities",
    benefit: "Insurance coverage up to ₹2 lakh/hectare",
    eligibility: "All farmers including sharecroppers",
    category: "Insurance",
    state: "All India",
    lastUpdated: "2026-04-09",
    applyLink: "https://pmfby.gov.in",
    isNew: true,
  },
  {
    id: "3",
    name: "Kisan Credit Card",
    fullName: "Kisan Credit Card Scheme",
    description: "Easy credit for agricultural needs at concessional interest rates",
    benefit: "Credit up to ₹3 lakh at 4% interest",
    eligibleFor: "All farmers, fishermen, animal husbandry",
    category: "Credit",
    state: "All India",
    lastUpdated: "2026-04-08",
    applyLink: "https://bankofindia.co.in/kcc",
    isNew: false,
  },
  {
    id: "4",
    name: "SMAM",
    fullName: "Sub-Mission on Agricultural Mechanization",
    description: "Financial assistance for purchase of farm machinery",
    benefit: "Subsidy up to 50-80% on machinery",
    eligibility: "Small & marginal farmers, cooperatives",
    category: "Equipment",
    state: "All India",
    lastUpdated: "2026-04-05",
    applyLink: "https://agricoop.nic.in/smam",
    isNew: false,
  },
  {
    id: "5",
    name: "PKVY",
    fullName: "Paramparagat Krishi Vikas Yojana",
    description: "Promote organic farming through cluster approach",
    benefit: "₹50,000/hectare for 3 years",
    eligibility: "Farmer groups, FPOs, clusters",
    category: "Organic Farming",
    state: "All India",
    lastUpdated: "2026-04-11",
    applyLink: "https://pgsindia.co.in/pkvy",
    isNew: true,
  },
  {
    id: "6",
    name: "NFSM",
    fullName: "National Food Security Mission",
    description: "Increase production of rice, wheat, pulses, coarse cereals",
    benefit: "Quality seeds, inputs, machinery support",
    eligibility: "All farmers in target districts",
    category: "Production",
    state: "All India",
    lastUpdated: "2026-04-07",
    applyLink: "https://nfsm.gov.in",
    isNew: false,
  },
  {
    id: "7",
    name: "MIDH",
    fullName: "Mission for Integrated Development of Horticulture",
    description: "Development of horticulture crops including fruits, vegetables",
    benefit: "Subsidy for plantation, cold storage, market",
    eligibility: "Farmers, FPOs, entrepreneurs",
    category: "Horticulture",
    state: "All India",
    lastUpdated: "2026-04-06",
    applyLink: "https://midh.gov.in",
    isNew: false,
  },
  {
    id: "8",
    name: "RKVY-RAFTAAR",
    fullName: "Rashtriya Krishi Vikas Yojana - RAFTAAR",
    description: "Supplementary grant for strengthening agricultural infrastructure",
    benefit: "Project-based funding up to 100%",
    eligibility: "State governments, FPOs, private sector",
    category: "Infrastructure",
    state: "All India",
    lastUpdated: "2026-04-04",
    applyLink: "https://rkvy.nic.in",
    isNew: false,
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search")?.toLowerCase();

  let filtered = mockSchemes;

  if (category && category !== "all") {
    filtered = filtered.filter(s => s.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    filtered = filtered.filter(s => 
      s.name.toLowerCase().includes(search) ||
      s.fullName.toLowerCase().includes(search) ||
      s.description.toLowerCase().includes(search)
    );
  }

  return NextResponse.json({
    schemes: filtered,
    total: filtered.length,
    lastUpdated: new Date().toISOString(),
  });
}