import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/services/supabase";

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

async function verifyAuth(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  const queryToken = request.nextUrl.searchParams.get("token");
  const secret = process.env.SYNC_SECRET;

  if (!secret) return false;
  if (authHeader === `Bearer ${secret}`) return true;
  if (queryToken === secret) return true;
  return false;
}

export async function POST(request: NextRequest) {
  if (!(await verifyAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch("https://www.myscheme.gov.in/schemes", {
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) throw new Error(`myScheme.gov.in returned ${res.status}`);
    const html = await res.text();

    const schemes: { name: string; slug: string }[] = [];
    const nameRegex = /<a[^>]*href="\/schemes\/([^"]+)"[^>]*>([^<]+)<\/a>/gi;
    let match;
    while ((match = nameRegex.exec(html)) !== null) {
      schemes.push({ slug: match[1], name: match[2].trim() });
    }

    let inserted = 0;
    let updated = 0;
    const seen = new Set<string>();

    for (const scheme of schemes.slice(0, 50)) {
      if (!scheme.name || seen.has(scheme.name)) continue;
      seen.add(scheme.name);

      const { data: existing } = await supabase
        .from("government_schemes")
        .select("id")
        .eq("name", scheme.name)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("government_schemes")
          .update({
            apply_link: `https://www.myscheme.gov.in/schemes/${scheme.slug}`,
            last_updated: new Date().toISOString().split("T")[0],
          })
          .eq("id", existing.id);

        if (!error) updated++;
      } else {
        const { error } = await supabase
          .from("government_schemes")
          .insert({
            name: scheme.name,
            full_name: scheme.name,
            description: `Government scheme: ${scheme.name}`,
            benefit: "Varies based on scheme guidelines",
            eligibility: "Check official website",
            category: detectCategory(scheme.name, scheme.name),
            state: "All India",
            apply_link: `https://www.myscheme.gov.in/schemes/${scheme.slug}`,
            last_updated: new Date().toISOString().split("T")[0],
            is_new: true,
          });

        if (!error) inserted++;
      }
    }

    return NextResponse.json({
      success: true,
      inserted,
      updated,
      total: seen.size,
      source: "myscheme.gov.in",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Scheme sync failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
