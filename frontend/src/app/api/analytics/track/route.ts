import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const NEON_CONNECTION_STRING =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_EcGX5KIFW9ej@ep-bold-feather-b4sildv7-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require";
const NEON_SQL_ENDPOINT = "https://ep-bold-feather-b4sildv7-pooler.c-6.us-east-2.aws.neon.tech/sql";

async function queryNeon<T = any>(query: string, params: any[] = []): Promise<T[]> {
  const res = await fetch(NEON_SQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Neon-Connection-String": NEON_CONNECTION_STRING,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, params }),
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`Neon SQL error ${res.status}`);
  }
  const data = await res.json();
  return (data.rows || []) as T[];
}

export const dynamic = "force-dynamic";

function getCountryName(code: string): string {
  const map: Record<string, string> = {
    US: "United States",
    PK: "Pakistan",
    GB: "United Kingdom",
    CA: "Canada",
    AU: "Australia",
    IN: "India",
    DE: "Germany",
    FR: "France",
    AE: "United Arab Emirates",
    SA: "Saudi Arabia",
  };
  return map[code.toUpperCase()] || code.toUpperCase();
}

function detectReferrerSource(ref: string): string {
  if (!ref) return "Direct / Bio Link";
  const lower = ref.toLowerCase();
  if (lower.includes("tiktok")) return "TikTok";
  if (lower.includes("youtube") || lower.includes("youtu.be")) return "YouTube";
  if (lower.includes("google")) return "Google Search";
  if (lower.includes("twitter") || lower.includes("t.co") || lower.includes("x.com")) return "Twitter / X";
  if (lower.includes("instagram") || lower.includes("facebook") || lower.includes("meta")) return "Meta / Instagram";
  if (lower.includes("linkedin")) return "LinkedIn";
  return "Referral";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const path = body.path || "/";
    const articleSlug = body.article_slug || null;
    const referrer = body.referrer || "";
    const device = body.device || "Desktop";
    const browser = body.browser || "Chrome";

    // Detect country and IP hash
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 32);
    const countryCode = request.headers.get("x-vercel-ip-country") || "PK";
    const countryName = getCountryName(countryCode);
    const city = request.headers.get("x-vercel-ip-city") || null;
    const referrerSource = detectReferrerSource(referrer);

    // Insert real visit into analytics_visits
    await queryNeon(
      `INSERT INTO analytics_visits (path, article_slug, referrer, referrer_source, country_code, country_name, city, device, browser, ip_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`,
      [path, articleSlug, referrer, referrerSource, countryCode, countryName, city, device, browser, ipHash]
    );

    // If an article was read, increment its real view counter
    if (articleSlug) {
      await queryNeon(
        `UPDATE articles SET views = views + 1 WHERE slug = $1;`,
        [articleSlug]
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[API Analytics Track] Error:", err);
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
