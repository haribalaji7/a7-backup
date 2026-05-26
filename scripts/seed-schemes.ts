import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const schemes = [
  {
    name: "PM-KISAN",
    full_name: "Pradhan Mantri Kisan Samman Nidhi",
    description: "Direct income support of Rs 6000/year to farmer families",
    benefit: "₹6,000/year",
    eligibility: "All landholding farmer families",
    category: "Financial",
    state: "All India",
    last_updated: "2026-04-10",
    apply_link: "https://pmkisan.gov.in",
    is_new: false,
  },
  {
    name: "PMFBY",
    full_name: "Pradhan Mantri Fasal Bima Yojana",
    description: "Crop insurance scheme for yield losses due to natural calamities",
    benefit: "Insurance coverage up to ₹2 lakh/hectare",
    eligibility: "All farmers including sharecroppers",
    category: "Insurance",
    state: "All India",
    last_updated: "2026-04-09",
    apply_link: "https://pmfby.gov.in",
    is_new: true,
  },
  {
    name: "Kisan Credit Card",
    full_name: "Kisan Credit Card Scheme",
    description: "Easy credit for agricultural needs at concessional interest rates",
    benefit: "Credit up to ₹3 lakh at 4% interest",
    eligibility: "All farmers, fishermen, animal husbandry",
    category: "Credit",
    state: "All India",
    last_updated: "2026-04-08",
    apply_link: "https://bankofindia.co.in/kcc",
    is_new: false,
  },
  {
    name: "SMAM",
    full_name: "Sub-Mission on Agricultural Mechanization",
    description: "Financial assistance for purchase of farm machinery",
    benefit: "Subsidy up to 50-80% on machinery",
    eligibility: "Small & marginal farmers, cooperatives",
    category: "Equipment",
    state: "All India",
    last_updated: "2026-04-05",
    apply_link: "https://agricoop.nic.in/smam",
    is_new: false,
  },
  {
    name: "PKVY",
    full_name: "Paramparagat Krishi Vikas Yojana",
    description: "Promote organic farming through cluster approach",
    benefit: "₹50,000/hectare for 3 years",
    eligibility: "Farmer groups, FPOs, clusters",
    category: "Organic Farming",
    state: "All India",
    last_updated: "2026-04-11",
    apply_link: "https://pgsindia.co.in/pkvy",
    is_new: true,
  },
  {
    name: "NFSM",
    full_name: "National Food Security Mission",
    description: "Increase production of rice, wheat, pulses, coarse cereals",
    benefit: "Quality seeds, inputs, machinery support",
    eligibility: "All farmers in target districts",
    category: "Production",
    state: "All India",
    last_updated: "2026-04-07",
    apply_link: "https://nfsm.gov.in",
    is_new: false,
  },
  {
    name: "MIDH",
    full_name: "Mission for Integrated Development of Horticulture",
    description: "Development of horticulture crops including fruits, vegetables",
    benefit: "Subsidy for plantation, cold storage, market",
    eligibility: "Farmers, FPOs, entrepreneurs",
    category: "Horticulture",
    state: "All India",
    last_updated: "2026-04-06",
    apply_link: "https://midh.gov.in",
    is_new: false,
  },
  {
    name: "RKVY-RAFTAAR",
    full_name: "Rashtriya Krishi Vikas Yojana - RAFTAAR",
    description: "Supplementary grant for strengthening agricultural infrastructure",
    benefit: "Project-based funding up to 100%",
    eligibility: "State governments, FPOs, private sector",
    category: "Infrastructure",
    state: "All India",
    last_updated: "2026-04-04",
    apply_link: "https://rkvy.nic.in",
    is_new: false,
  },
];

async function main() {
  console.log("Seeding government_schemes table...\n");

  const { data: existing } = await supabase
    .from("government_schemes")
    .select("name")
    .in("name", schemes.map(s => s.name));

  const existingNames = new Set((existing || []).map((s: any) => s.name));
  const toInsert = schemes.filter(s => !existingNames.has(s.name));

  if (toInsert.length === 0) {
    console.log("All schemes already exist in the database. Nothing to seed.");
    return;
  }

  console.log(`Inserting ${toInsert.length} new schemes...`);

  const { data, error } = await supabase
    .from("government_schemes")
    .insert(toInsert)
    .select();

  if (error) {
    console.error("Insert failed:", error.message);
    console.log("\n--- SQL to run manually in Supabase SQL Editor ---\n");

    for (const s of toInsert) {
      console.log(`INSERT INTO public.government_schemes (name, full_name, description, benefit, eligibility, category, state, last_updated, apply_link, is_new)
VALUES ('${s.name.replace(/'/g, "''")}', '${s.full_name.replace(/'/g, "''")}', '${s.description.replace(/'/g, "''")}', '${s.benefit.replace(/'/g, "''")}', '${s.eligibility.replace(/'/g, "''")}', '${s.category}', '${s.state}', '${s.last_updated}', '${s.apply_link}', ${s.is_new});\n`);
    }
    return;
  }

  console.log(`Successfully seeded ${data?.length || 0} schemes!`);
}

main().catch(console.error);
