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

    const isAdmin = isAdminRequest(request);
    const backendHeaders: Record<string, string> = {};
    const adminHeader = request.headers.get("x-admin-secret");
    if (isAdmin && adminHeader) {
      backendHeaders["X-Admin-Secret"] = adminHeader;
    }

    const backendUrl = getBackendBaseUrl();

    // 1. Primary: Fetch from Oracle VM Cloud Backend
    try {
      const bRes = await fetch(`${backendUrl}/api/articles/${encodeURIComponent(slug)}`, {
        headers: backendHeaders,
        cache: "no-store",
      });
      if (bRes.ok) {
        const article = await bRes.json();
        if (!isAdmin && article && article.status !== "PUBLISHED") {
          return NextResponse.json({ error: "Article not found" }, { status: 404 });
        }
        return NextResponse.json(article);
      }
    } catch (bErr) {
      console.warn("[API Article Slug] Oracle backend fetch error:", bErr);
    }

    // 2. Query Neon with parameterized query
    let fetchSql = "SELECT * FROM articles WHERE slug = $1";
    const params: any[] = [slug];

    if (!isAdmin) {
      fetchSql += " AND status = $2";
      params.push("PUBLISHED");
    }
    fetchSql += " LIMIT 1;";

    const rows = await queryNeon(fetchSql, params);

    if (rows && rows.length > 0) {
      // Views increment removed - views are counted only by the analytics tracker
      return NextResponse.json(rows[0]);
    }

    // 3. Seamless fallback to Render backend API
    try {
      const bRes = await fetch(`${backendUrl}/api/articles/${encodeURIComponent(slug)}`, {
        headers: backendHeaders,
        cache: "no-store",
      });
      if (bRes.ok) {
        const article = await bRes.json();
        if (!isAdmin && article && article.status !== "PUBLISHED") {
          return NextResponse.json({ error: "Article not found" }, { status: 404 });
        }
        return NextResponse.json(article);
      }
    } catch (bErr) {
      console.warn("[API Article Slug] Backend fallback error:", bErr);
    }

    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  } catch (err: any) {
    console.error("[API Article Slug] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch article", detail: err?.message || String(err) },
      { status: 500 }
    );
  }
}
