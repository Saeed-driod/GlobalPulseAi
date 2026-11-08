import { NextResponse } from "next/server";

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
      next: { revalidate: 30 },
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

export async function GET() {
  try {
    const rows = await queryNeon<{
      total_articles: number;
      drafts_count: number;
      video_ready_count: number;
      published_count: number;
      total_views: number;
    }>(`
      SELECT 
        count(*)::int as total_articles,
        count(*) FILTER (WHERE status = 'DRAFT')::int as drafts_count,
        count(*) FILTER (WHERE status = 'VIDEO_READY')::int as video_ready_count,
        count(*) FILTER (WHERE status = 'PUBLISHED')::int as published_count,
        coalesce(sum(views), 0)::int as total_views
      FROM articles;
    `);

    if (rows && rows.length > 0) {
      return NextResponse.json(rows[0]);
    }

    return NextResponse.json({
      total_articles: 0,
      drafts_count: 0,
      video_ready_count: 0,
      published_count: 0,
      total_views: 0,
    });
  } catch (err: any) {
    console.error("[API Stats] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch stats", detail: err?.message || String(err) },
      { status: 500 }
    );
  }
}

