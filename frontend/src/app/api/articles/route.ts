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
    const isAdmin = isAdminRequest(request);

    // 1. Determine sanitized status filter:
    // Public callers always get 'PUBLISHED' only (ignore any status parameter).
    // If isAdminRequest is true, status may be DRAFT, VIDEO_READY, PUBLISHED, or ALL.
    let statusFilter: string | null = "PUBLISHED";
    if (isAdmin) {
      const requestedStatus = (searchParams.get("status") || "ALL").toUpperCase();
      if (requestedStatus === "ALL") {
        statusFilter = null;
      } else if (["DRAFT", "VIDEO_READY", "PUBLISHED"].includes(requestedStatus)) {
        statusFilter = requestedStatus;
      } else {
        statusFilter = null;
      }
    }

    const rawCategory = searchParams.get("category");
    const category =
      rawCategory && !["All", "All Stories", "ALL"].includes(rawCategory.trim())
        ? rawCategory.trim()
        : null;

    const rawSearch = searchParams.get("search");
    const search = rawSearch && rawSearch.trim() ? rawSearch.trim() : null;

    // Parse limit and skip with Number, clamp limit to 1..100 and skip to 0..100000, fallback on NaN
    const rawLimit = Number(searchParams.get("limit"));
    const limit = isNaN(rawLimit) ? 20 : Math.max(1, Math.min(100, Math.floor(rawLimit)));

    const rawSkip = Number(searchParams.get("skip"));
    const skip = isNaN(rawSkip) ? 0 : Math.max(0, Math.min(100000, Math.floor(rawSkip)));

    // Prepare sanitized searchParams and headers for backend proxy calls
    const backendParams = new URLSearchParams();
    if (statusFilter) {
      backendParams.set("status", statusFilter);
    } else if (isAdmin) {
      backendParams.set("status", "ALL");
    } else {
      backendParams.set("status", "PUBLISHED");
    }
    if (category) backendParams.set("category", category);
    if (search) backendParams.set("search", search);
    backendParams.set("limit", limit.toString());
    backendParams.set("skip", skip.toString());

    const backendHeaders: Record<string, string> = {};
    const adminHeader = request.headers.get("x-admin-secret");
    if (isAdmin && adminHeader) {
      backendHeaders["X-Admin-Secret"] = adminHeader;
    }

    const backendUrl = getBackendBaseUrl();

    // 1. Primary: Fetch directly from high-speed Oracle VM Cloud Backend
    try {
      const bRes = await fetch(`${backendUrl}/api/articles?${backendParams.toString()}`, {
        headers: backendHeaders,
        cache: "no-store",
      });
      if (bRes.ok) {
        return NextResponse.json(await bRes.json());
      }
    } catch (bErr) {
      console.warn("[API Articles] Oracle backend fetch failed:", bErr);
    }

    // 2. Neon Database parameterized query
    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (statusFilter) {
      conditions.push(`status = $${pIdx++}`);
      params.push(statusFilter);
    }

    if (category) {
      conditions.push(`category = $${pIdx++}`);
      params.push(category);
    }

    if (search) {
      const escaped = search.replace(/([%_\\])/g, "\\$1");
      conditions.push(`(title ILIKE $${pIdx} ESCAPE '\\' OR summary ILIKE $${pIdx} ESCAPE '\\')`);
      params.push(`%${escaped}%`);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countSql = `SELECT count(*)::int as total FROM articles ${whereClause};`;
    const countRows = await queryNeon<{ total: number }>(countSql, params);
    const total = countRows[0]?.total || 0;

    const fetchParams = [...params, limit, skip];
    const fetchSql = `SELECT * FROM articles ${whereClause} ORDER BY id DESC LIMIT $${pIdx++} OFFSET $${pIdx++};`;
    const items = await queryNeon(fetchSql, fetchParams);

    if (items.length > 0) {
      return NextResponse.json({
        items,
        total,
        page: Math.floor(skip / limit) + 1,
        limit,
      });
    }

    // 3. Seamless fallback to Render backend API
    try {
      const bRes = await fetch(`${backendUrl}/api/articles?${backendParams.toString()}`, {
        headers: backendHeaders,
        cache: "no-store",
      });
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
