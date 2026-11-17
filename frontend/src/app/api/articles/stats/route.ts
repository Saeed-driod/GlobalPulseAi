import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/backendUrl";
import { isAdminRequest } from "@/lib/adminAuth";

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

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication for stats
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const backendUrl = getBackendBaseUrl();
    const backendHeaders: Record<string, string> = {};
    const adminSecret = request.headers.get("x-admin-secret");
    if (adminSecret) {
      backendHeaders["X-Admin-Secret"] = adminSecret;
    }

    // 1. Primary: Fetch from Oracle VM Cloud Backend
    try {
      const bRes = await fetch(`${backendUrl}/api/articles/stats`, {
        headers: backendHeaders,
        cache: "no-store",
      });
      if (bRes.ok) {
        return NextResponse.json(await bRes.json());
      }
    } catch (bErr) {
      console.warn("[API Stats] Oracle backend fetch error:", bErr);
    }

    // 2. Query Neon Database
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

    // 3. Fallback to Render backend API
    try {
      const bRes = await fetch(`${backendUrl}/api/articles/stats`, {
        headers: backendHeaders,
        cache: "no-store",
      });
      if (bRes.ok) {
        return NextResponse.json(await bRes.json());
      }
    } catch {}

    // Return real zeros when no data exists (no made-up numbers)
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
