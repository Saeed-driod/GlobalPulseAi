import { NextRequest, NextResponse } from "next/server";

const NEON_CONNECTION_STRING = process.env.DATABASE_URL || "";

async function queryNeon<T = any>(query: string, params: any[] = []): Promise<T[]> {
  if (!NEON_CONNECTION_STRING) {
    return [];
  }
  try {
    let endpoint = "https://ep-bold-feather-b4sildv7-pooler.c-6.us-east-2.aws.neon.tech/sql";
    const hostMatch = NEON_CONNECTION_STRING.match(/@([^/:]+)/);
    if (hostMatch && hostMatch[1]) {
      endpoint = `https://${hostMatch[1]}/sql`;
    }
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Neon-Connection-String": NEON_CONNECTION_STRING,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, params }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(`Neon SQL error ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.rows || []) as T[];
  } catch (err) {
    console.error("Neon query error:", err);
    return [];
  }
}

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    if (!slug) {
      return NextResponse.json({ error: "Slug required" }, { status: 400 });
    }

    const cleanSlug = slug.replace(/'/g, "''");
    const rows = await queryNeon(
      `SELECT * FROM articles WHERE slug = '${cleanSlug}' LIMIT 1;`
    );

    if (!rows || rows.length === 0) {
      // Seamless fallback to Render backend API
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://150.136.214.192";
        const bRes = await fetch(`${backendUrl}/api/articles/${cleanSlug}`, { cache: "no-store" });
        if (bRes.ok) {
          const article = await bRes.json();
          return NextResponse.json(article);
        }
      } catch (bErr) {
        console.warn("[API Article Slug] Backend fallback error:", bErr);
      }
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Increment view count in background
    queryNeon(`UPDATE articles SET views = views + 1 WHERE slug = '${cleanSlug}';`).catch(() => {});

    return NextResponse.json(rows[0]);
  } catch (err: any) {
    console.error("[API Article Slug] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch article", detail: err?.message || String(err) },
      { status: 500 }
    );
  }
}

