import { NextRequest, NextResponse } from "next/server";

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
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`Neon SQL error ${res.status}`);
  }
  const data = await res.json();
  return (data.rows || []) as T[];
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

    const rows = await queryNeon(
      "SELECT * FROM articles WHERE slug = $1 LIMIT 1;",
      [slug]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Increment view count in background
    queryNeon("UPDATE articles SET views = views + 1 WHERE slug = $1;", [slug]).catch(() => {});

    return NextResponse.json(rows[0]);
  } catch (err: any) {
    console.error("[API Article Slug] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch article", detail: err?.message || String(err) },
      { status: 500 }
    );
  }
}

