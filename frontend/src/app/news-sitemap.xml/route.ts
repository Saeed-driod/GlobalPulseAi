import { NextResponse } from "next/server";
import { fetchArticles } from "@/lib/api";

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

export const dynamic = "force-dynamic";

export async function GET() {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "https://globalpulseai.vercel.app"
  ).replace(/\/$/, "");

  let articles: any[] = [];
  try {
    const res = await fetchArticles({ limit: 100 });
    articles = res.items || [];
  } catch (err) {
    console.error("[News Sitemap] Error fetching articles:", err);
  }

  // Google News Sitemap rules:
  // Only include articles published in the last 48 hours
  const now = Date.now();
  const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;

  let newsArticles = articles.filter((art) => {
    if (art.is_noindex) return false;
    const dateStr = art.published_at || art.created_at;
    if (!dateStr) return false;
    const pubTime = new Date(dateStr).getTime();
    return now - pubTime <= FORTY_EIGHT_HOURS;
  });

  // Fallback: If no articles in the last 48h (e.g. fresh environment), include the 10 most recent indexable articles
  if (newsArticles.length === 0 && articles.length > 0) {
    newsArticles = articles.filter((art) => !art.is_noindex).slice(0, 10);
  }

  const xmlEntries = newsArticles
    .map((article) => {
      const pubDate = article.published_at || article.created_at || new Date().toISOString();
      const isoDate = new Date(pubDate).toISOString();
      const cleanHeadline = (article.title || "").replace(/\s*\|\s*GlobalPulse AI/gi, "").trim();

      return `  <url>
    <loc>${siteUrl}/news/${escapeXml(article.slug)}</loc>
    <news:news>
      <news:publication>
        <news:name>GlobalPulse AI</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${isoDate}</news:publication_date>
      <news:title>${escapeXml(cleanHeadline)}</news:title>
    </news:news>
  </url>`;
    })
    .join("\n");

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${xmlEntries}
</urlset>`;

  return new NextResponse(sitemapXml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}

