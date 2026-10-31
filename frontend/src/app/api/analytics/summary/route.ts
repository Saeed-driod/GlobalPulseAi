import { NextResponse } from "next/server";

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
    next: { revalidate: 15 },
  });
  if (!res.ok) {
    throw new Error(`Neon SQL error ${res.status}`);
  }
  const data = await res.json();
  return (data.rows || []) as T[];
}

function getCountryFlag(code: string): string {
  if (!code || code.length !== 2) return "🌐";
  try {
    const codePoints = code
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return "🌐";
  }
}

function formatTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Total real reads and 24h real stats from database
    const statsRows = await queryNeon<any>(`
      SELECT 
        (SELECT coalesce(sum(views), 0)::int FROM articles) as total_views,
        (SELECT count(*)::int FROM analytics_visits WHERE created_at >= NOW() - INTERVAL '24 HOURS') as views_today,
        (SELECT count(DISTINCT coalesce(ip_hash, id::text))::int FROM analytics_visits WHERE created_at >= NOW() - INTERVAL '24 HOURS') as unique_today,
        (SELECT count(*)::int FROM analytics_visits) as total_visits;
    `);
    const totalViews = statsRows[0]?.total_views || 0;
    const viewsToday = statsRows[0]?.views_today || 0;
    const uniqueToday = statsRows[0]?.unique_today || 0;
    const totalVisits = statsRows[0]?.total_visits || 1;

    // 2. Real sources from analytics_visits table
    const sourceRows = await queryNeon<{ source: string; count: number }>(`
      SELECT 
        coalesce(referrer_source, 'Direct') as source, 
        count(*)::int as count 
      FROM analytics_visits 
      GROUP BY referrer_source 
      ORDER BY count DESC 
      LIMIT 6;
    `);
    const sources = sourceRows.map((s) => ({
      source: s.source,
      count: s.count,
      percent: Math.round((s.count / Math.max(totalVisits, 1)) * 100),
    }));

    // 3. Real countries from analytics_visits table
    const countryRows = await queryNeon<{ country_name: string; country_code: string; count: number }>(`
      SELECT 
        coalesce(country_name, 'Unknown') as country_name,
        coalesce(country_code, 'UN') as country_code,
        count(*)::int as count 
      FROM analytics_visits 
      GROUP BY country_name, country_code 
      ORDER BY count DESC 
      LIMIT 6;
    `);
    const countries = countryRows.map((c) => ({
      country_name: c.country_name,
      country_code: c.country_code,
      flag: getCountryFlag(c.country_code),
      count: c.count,
      percent: Math.round((c.count / Math.max(totalVisits, 1)) * 100),
    }));

    // 4. Real device breakdown
    const deviceRows = await queryNeon<any>(`
      SELECT 
        count(*) FILTER (WHERE device ILIKE '%Mobile%')::int as mobile_count,
        count(*) FILTER (WHERE device NOT ILIKE '%Mobile%')::int as desktop_count,
        count(*)::int as total
      FROM analytics_visits;
    `);
    const totalDev = deviceRows[0]?.total || 1;
    const mobilePercent = Math.round(((deviceRows[0]?.mobile_count || 0) / totalDev) * 100);
    const desktopPercent = 100 - mobilePercent;

    // 5. Real top articles ranked by actual reads
    const topArticleRows = await queryNeon<any>(`
      SELECT id, title, slug, category, views 
      FROM articles 
      WHERE views > 0 
      ORDER BY views DESC, id DESC 
      LIMIT 5;
    `);

    // 6. Real recent visits
    const recentRows = await queryNeon<any>(`
      SELECT 
        id, 
        path, 
        article_title, 
        coalesce(referrer_source, 'Direct') as source, 
        coalesce(country_code, 'UN') as country_code, 
        coalesce(country_name, 'Unknown') as country_name, 
        coalesce(device, 'Desktop') as device, 
        created_at 
      FROM analytics_visits 
      ORDER BY id DESC 
      LIMIT 6;
    `);
    const recentVisits = recentRows.map((r) => ({
      id: r.id,
      path: r.path || "/",
      article_title: r.article_title || null,
      source: r.source,
      country_code: r.country_code,
      country_name: r.country_name,
      flag: getCountryFlag(r.country_code),
      device: r.device,
      time_ago: formatTimeAgo(r.created_at),
    }));

    const topSource = sources.length > 0 ? sources[0].source : "Direct / Bio Link";
    const topCountry = countries.length > 0 ? countries[0].country_name : "United States";

    return NextResponse.json({
      total_views: totalViews,
      views_today: viewsToday,
      unique_visitors_today: uniqueToday,
      mobile_percent: mobilePercent,
      desktop_percent: desktopPercent,
      top_source: topSource,
      top_country: topCountry,
      sources,
      countries,
      top_articles: topArticleRows.map((a: any) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        category: a.category,
        views: a.views || 0,
      })),
      recent_visits: recentVisits,
    });
  } catch (err: any) {
    console.error("[API Analytics Summary] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch real analytics", detail: err?.message || String(err) },
      { status: 500 }
    );
  }
}
