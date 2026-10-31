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
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`Neon SQL error ${res.status}`);
  }
  const data = await res.json();
  return (data.rows || []) as T[];
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
    const values: any[] = [];
    let pIdx = 1;

    if (status && status !== "ALL") {
      conditions.push(`status = $${pIdx++}`);
      values.push(status);
    }

    if (category && category !== "All" && category !== "All Stories" && category !== "ALL") {
      conditions.push(`category = $${pIdx++}`);
      values.push(category);
    }

    if (search) {
      conditions.push(`(title ILIKE $${pIdx} OR summary ILIKE $${pIdx})`);
      pIdx++;
      values.push(`%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countSql = `SELECT count(*)::int as total FROM articles ${whereClause};`;
    const countRows = await queryNeon<{ total: number }>(countSql, values);
    const total = countRows[0]?.total || 0;

    const fetchSql = `SELECT * FROM articles ${whereClause} ORDER BY id DESC LIMIT ${limit} OFFSET ${skip};`;
    const items = await queryNeon(fetchSql, values);

    return NextResponse.json({
      items,
      total,
      page: Math.floor(skip / limit) + 1,
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
