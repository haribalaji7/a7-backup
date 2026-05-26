import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface ScrapedScheme {
  name: string;
  full_name: string;
  description: string;
  benefit: string;
  eligibility: string;
  category: string;
  state: string;
  apply_link: string;
}

const CATEGORY_KEYWORDS: [RegExp, string][] = [
  [/financial|income|subsidy|cash|fund/i, "Financial"],
  [/insurance|bima|cover|risk/i, "Insurance"],
  [/credit|loan|card|kcc|interest/i, "Credit"],
  [/machiner|equipment|tractor|tool|implement/i, "Equipment"],
  [/organic|natural farming|pkvy/i, "Organic Farming"],
  [/food|production|cereal|pulse|grain|nfsm/i, "Production"],
  [/horticulture|fruit|vegetable|garden|midh/i, "Horticulture"],
  [/infrastructure|storage|cold chain|godown|warehouse/i, "Infrastructure"],
];

function detectCategory(description: string, name: string): string {
  const text = `${name} ${description}`;
  for (const [pattern, category] of CATEGORY_KEYWORDS) {
    if (pattern.test(text)) return category;
  }
  return "Financial";
}

async function fetchFromMyScheme(): Promise<ScrapedScheme[]> {
  const res = await fetch("https://www.myscheme.gov.in/schemes", {
    signal: AbortSignal.timeout(15000),
  });
  const html = await res.text();

  const schemes: ScrapedScheme[] = [];
  const nameRegex = /<a[^>]*href="\/schemes\/([^"]+)"[^>]*>([^<]+)<\/a>/gi;
  const descRegex = /<p[^>]*class="[^"]*scheme-description[^"]*"[^>]*>([^<]+)<\/p>/gi;

  const names: { slug: string; name: string }[] = [];
  let match;
  while ((match = nameRegex.exec(html)) !== null) {
    names.push({ slug: match[1], name: match[2].trim() });
  }

  const descriptions: string[] = [];
  while ((match = descRegex.exec(html)) !== null) {
    descriptions.push(match[1].trim());
  }

  for (let i = 0; i < Math.min(names.length, 50); i++) {
    const { slug, name } = names[i];
    const description = descriptions[i] || `Government scheme: ${name}`;

    schemes.push({
      name,
      full_name: name,
      description,
      benefit: "Varies based on scheme guidelines",
      eligibility: "Check official website for eligibility criteria",
      category: detectCategory(description, name),
      state: "All India",
      apply_link: `https://www.myscheme.gov.in/schemes/${slug}`,
    });
  }

  return schemes;
}

async function fetchFromJsonFile(filePath: string): Promise<ScrapedScheme[]> {
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  if (Array.isArray(data)) {
    return data.map((item: any) => ({
      name: item.name || item.scheme_name || "",
      full_name: item.full_name || item.fullName || item.scheme_name || "",
      description: item.description || item.desc || "",
      benefit: item.benefit || "",
      eligibility: item.eligibility || item.eligible || "",
      category: item.category || detectCategory(item.description || "", item.name || ""),
      state: item.state || "All India",
      apply_link: item.apply_link || item.applyLink || item.url || "",
    }));
  }
  throw new Error("JSON file must contain an array of schemes");
}

async function upsertSchemes(schemes: ScrapedScheme[]): Promise<{ inserted: number; updated: number }> {
  let inserted = 0;
  let updated = 0;

  for (const scheme of schemes) {
    if (!scheme.name) continue;

    const { data: existing } = await supabase
      .from("government_schemes")
      .select("id, last_updated")
      .eq("name", scheme.name)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("government_schemes")
        .update({
          full_name: scheme.full_name,
          description: scheme.description,
          benefit: scheme.benefit,
          eligibility: scheme.eligibility,
          category: scheme.category,
          state: scheme.state,
          apply_link: scheme.apply_link,
          last_updated: new Date().toISOString().split("T")[0],
        })
        .eq("id", existing.id);

      if (!error) updated++;
    } else {
      const { error } = await supabase
        .from("government_schemes")
        .insert({
          name: scheme.name,
          full_name: scheme.full_name,
          description: scheme.description,
          benefit: scheme.benefit,
          eligibility: scheme.eligibility,
          category: scheme.category,
          state: scheme.state,
          apply_link: scheme.apply_link,
          last_updated: new Date().toISOString().split("T")[0],
          is_new: true,
        });

      if (!error) inserted++;
    }
  }

  return { inserted, updated };
}

async function main() {
  const args = process.argv.slice(2);
  const source = args[0] || "myscheme";
  const filePath = args[1];

  console.log(`Syncing schemes from source: ${source}\n`);

  let schemes: ScrapedScheme[];

  switch (source) {
    case "myscheme":
      console.log("Fetching from myScheme.gov.in...");
      schemes = await fetchFromMyScheme();
      break;
    case "json":
      if (!filePath) throw new Error("JSON file path required: npm run sync -- json ./data.json");
      console.log(`Loading from file: ${filePath}`);
      schemes = await fetchFromJsonFile(filePath);
      break;
    default:
      throw new Error(`Unknown source: ${source}. Use 'myscheme' or 'json'`);
  }

  console.log(`Found ${schemes.length} schemes\n`);

  const result = await upsertSchemes(schemes);

  console.log(`Sync complete:`);
  console.log(`  Inserted: ${result.inserted}`);
  console.log(`  Updated: ${result.updated}`);
  console.log(`  Total processed: ${schemes.length}`);
}

main().catch((err) => {
  console.error("Sync failed:", err.message);
  process.exit(1);
});
