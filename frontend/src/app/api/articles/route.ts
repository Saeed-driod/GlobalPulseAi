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
      next: { revalidate: 60 },
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
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status") || "PUBLISHED";
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);

    const conditions: string[] = [];

    if (status && status !== "ALL") {
      const cleanStatus = status.replace(/'/g, "''");
      conditions.push(`status = '${cleanStatus}'`);
    }

    if (category && category !== "All" && category !== "All Stories" && category !== "ALL") {
      const cleanCat = category.replace(/'/g, "''");
      conditions.push(`category = '${cleanCat}'`);
    }

    if (search) {
      const cleanSearch = search.replace(/'/g, "''");
      conditions.push(`(title ILIKE '%${cleanSearch}%' OR summary ILIKE '%${cleanSearch}%')`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countSql = `SELECT count(*)::int as total FROM articles ${whereClause};`;
    const countRows = await queryNeon<{ total: number }>(countSql);
    const total = countRows[0]?.total || 0;

    const fetchSql = `SELECT * FROM articles ${whereClause} ORDER BY id DESC LIMIT ${limit} OFFSET ${skip};`;
    const items = await queryNeon(fetchSql);

    if (items.length > 0) {
      return NextResponse.json({
        items,
        total,
        page: Math.floor(skip / limit) + 1,
        limit,
      });
    }

    // Seamless fallback to Render backend API
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://globlepluseai.onrender.com";
      const bRes = await fetch(`${backendUrl}/api/articles?${searchParams.toString()}`, { cache: "no-store" });
      if (bRes.ok) {
        return NextResponse.json(await bRes.json());
      }
    } catch (bErr) {
      console.warn("[API Articles] Backend fallback fetch failed:", bErr);
    }

    return NextResponse.json({
      items: [],
      total: 0,
      page: 1,
      limit,
    });
  } catch (err: any) {
    console.error("[API Articles] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch articles", detail: err?.message || String(err) },
      { status: 500 }
    );
  }
}

