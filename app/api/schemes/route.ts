import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/services/supabase";

interface SchemeRow {
  id: string;
  name: string;
  full_name: string;
  description: string;
  benefit: string;
  eligibility: string;
  category: string;
  state: string;
  last_updated: string;
  apply_link: string | null;
  is_new: boolean;
}

const mockSchemes: SchemeRow[] = [
  { id: "m1", name: "PM-KISAN", full_name: "Pradhan Mantri Kisan Samman Nidhi", description: "Direct income support of Rs 6000/year to farmer families", benefit: "₹6,000/year", eligibility: "All landholding farmer families", category: "Financial", state: "All India", last_updated: "2026-04-10", apply_link: "https://pmkisan.gov.in", is_new: false },
  { id: "m2", name: "PMFBY", full_name: "Pradhan Mantri Fasal Bima Yojana", description: "Crop insurance scheme for yield losses due to natural calamities", benefit: "Insurance coverage up to ₹2 lakh/hectare", eligibility: "All farmers including sharecroppers", category: "Insurance", state: "All India", last_updated: "2026-04-09", apply_link: "https://pmfby.gov.in", is_new: true },
  { id: "m3", name: "Kisan Credit Card", full_name: "Kisan Credit Card Scheme", description: "Easy credit for agricultural needs at concessional interest rates", benefit: "Credit up to ₹3 lakh at 4% interest", eligibility: "All farmers, fishermen, animal husbandry", category: "Credit", state: "All India", last_updated: "2026-04-08", apply_link: "https://bankofindia.co.in/kcc", is_new: false },
  { id: "m4", name: "SMAM", full_name: "Sub-Mission on Agricultural Mechanization", description: "Financial assistance for purchase of farm machinery", benefit: "Subsidy up to 50-80% on machinery", eligibility: "Small & marginal farmers, cooperatives", category: "Equipment", state: "All India", last_updated: "2026-04-05", apply_link: "https://agricoop.nic.in/smam", is_new: false },
  { id: "m5", name: "PKVY", full_name: "Paramparagat Krishi Vikas Yojana", description: "Promote organic farming through cluster approach", benefit: "₹50,000/hectare for 3 years", eligibility: "Farmer groups, FPOs, clusters", category: "Organic Farming", state: "All India", last_updated: "2026-04-11", apply_link: "https://pgsindia.co.in/pkvy", is_new: true },
  { id: "m6", name: "NFSM", full_name: "National Food Security Mission", description: "Increase production of rice, wheat, pulses, coarse cereals", benefit: "Quality seeds, inputs, machinery support", eligibility: "All farmers in target districts", category: "Production", state: "All India", last_updated: "2026-04-07", apply_link: "https://nfsm.gov.in", is_new: false },
  { id: "m7", name: "MIDH", full_name: "Mission for Integrated Development of Horticulture", description: "Development of horticulture crops including fruits, vegetables", benefit: "Subsidy for plantation, cold storage, market", eligibility: "Farmers, FPOs, entrepreneurs", category: "Horticulture", state: "All India", last_updated: "2026-04-06", apply_link: "https://midh.gov.in", is_new: false },
  { id: "m8", name: "RKVY-RAFTAAR", full_name: "Rashtriya Krishi Vikas Yojana - RAFTAAR", description: "Supplementary grant for strengthening agricultural infrastructure", benefit: "Project-based funding up to 100%", eligibility: "State governments, FPOs, private sector", category: "Infrastructure", state: "All India", last_updated: "2026-04-04", apply_link: "https://rkvy.nic.in", is_new: false },
];

function toCamelCase(row: SchemeRow) {
  return {
    id: row.id,
    name: row.name,
    fullName: row.full_name,
    description: row.description,
    benefit: row.benefit,
    eligibility: row.eligibility,
    category: row.category,
    state: row.state,
    lastUpdated: row.last_updated,
    applyLink: row.apply_link || "#",
    isNew: row.is_new,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search")?.toLowerCase();

  try {
    let query = supabase.from("government_schemes").select("*");

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,full_name.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    query = query.order("last_updated", { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    if (data && data.length > 0) {
      const schemes = (data as SchemeRow[]).map(toCamelCase);
      return NextResponse.json({
        schemes,
        total: schemes.length,
        lastUpdated: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("Supabase query failed, using fallback:", err);
  }

  let filtered = mockSchemes;
  if (category && category !== "all") {
    filtered = filtered.filter(s => s.category.toLowerCase() === category.toLowerCase());
  }
  if (search) {
    filtered = filtered.filter(s =>
      s.name.toLowerCase().includes(search) ||
      s.full_name.toLowerCase().includes(search) ||
      s.description.toLowerCase().includes(search)
    );
  }
  const schemes = filtered.map(toCamelCase);

  return NextResponse.json({
    schemes,
    total: schemes.length,
    lastUpdated: new Date().toISOString(),
  });
}