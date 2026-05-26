import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zztymxdquxibaiyahzbs.supabase.co";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dHlteGRxdXhpYmFpeWFoemJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDU4Njg3OCwiZXhwIjoyMDkwMTYyODc4fQ.uA_r3jTY1qiJ7EGG8ShmjPVDc0XQlLRaTv0P8HINVyI";
const supabase = createClient(supabaseUrl, serviceKey);

const schemes = [
  { name: "PM-KISAN", full_name: "Pradhan Mantri Kisan Samman Nidhi", description: "Direct income support of Rs 6000/year to farmer families", benefit: "\u20B96,000/year", eligibility: "All landholding farmer families", category: "Financial", state: "All India", last_updated: "2026-04-10", apply_link: "https://pmkisan.gov.in", is_new: false },
  { name: "PMFBY", full_name: "Pradhan Mantri Fasal Bima Yojana", description: "Crop insurance scheme for yield losses due to natural calamities", benefit: "Insurance coverage up to \u20B92 lakh/hectare", eligibility: "All farmers including sharecroppers", category: "Insurance", state: "All India", last_updated: "2026-04-09", apply_link: "https://pmfby.gov.in", is_new: true },
  { name: "Kisan Credit Card", full_name: "Kisan Credit Card Scheme", description: "Easy credit for agricultural needs at concessional interest rates", benefit: "Credit up to \u20B93 lakh at 4% interest", eligibility: "All farmers, fishermen, animal husbandry", category: "Credit", state: "All India", last_updated: "2026-04-08", apply_link: "https://bankofindia.co.in/kcc", is_new: false },
  { name: "SMAM", full_name: "Sub-Mission on Agricultural Mechanization", description: "Financial assistance for purchase of farm machinery", benefit: "Subsidy up to 50-80% on machinery", eligibility: "Small & marginal farmers, cooperatives", category: "Equipment", state: "All India", last_updated: "2026-04-05", apply_link: "https://agricoop.nic.in/smam", is_new: false },
  { name: "PKVY", full_name: "Paramparagat Krishi Vikas Yojana", description: "Promote organic farming through cluster approach", benefit: "\u20B950,000/hectare for 3 years", eligibility: "Farmer groups, FPOs, clusters", category: "Organic Farming", state: "All India", last_updated: "2026-04-11", apply_link: "https://pgsindia.co.in/pkvy", is_new: true },
  { name: "NFSM", full_name: "National Food Security Mission", description: "Increase production of rice, wheat, pulses, coarse cereals", benefit: "Quality seeds, inputs, machinery support", eligibility: "All farmers in target districts", category: "Production", state: "All India", last_updated: "2026-04-07", apply_link: "https://nfsm.gov.in", is_new: false },
  { name: "MIDH", full_name: "Mission for Integrated Development of Horticulture", description: "Development of horticulture crops including fruits, vegetables", benefit: "Subsidy for plantation, cold storage, market", eligibility: "Farmers, FPOs, entrepreneurs", category: "Horticulture", state: "All India", last_updated: "2026-04-06", apply_link: "https://midh.gov.in", is_new: false },
  { name: "RKVY-RAFTAAR", full_name: "Rashtriya Krishi Vikas Yojana - RAFTAAR", description: "Supplementary grant for strengthening agricultural infrastructure", benefit: "Project-based funding up to 100%", eligibility: "State governments, FPOs, private sector", category: "Infrastructure", state: "All India", last_updated: "2026-04-04", apply_link: "https://rkvy.nic.in", is_new: false },
];

async function main() {
  console.log("Seeding government_schemes...");

  const { error: delErr } = await supabase.from("government_schemes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (delErr) console.log("Delete existing (ok if none):", delErr.message);

  const { data, error } = await supabase.from("government_schemes").insert(schemes).select();
  if (error) {
    console.error("Insert failed:", error.message);
    return;
  }
  console.log("Inserted " + data.length + " schemes successfully!");

  const { error: anonErr } = await supabase.rpc("exec", {
    sql: "CREATE POLICY IF NOT EXISTS anon_read_schemes ON public.government_schemes FOR SELECT USING (true);"
  });
  if (anonErr) {
    console.log("RPC exec unavailable:", anonErr.message);
    console.log("To allow anon reads, run in Supabase SQL Editor:");
    console.log("CREATE POLICY anon_read_schemes ON public.government_schemes FOR SELECT USING (true);");
  } else {
    console.log("RLS policy created successfully!");
  }
}

main().catch(console.error);
