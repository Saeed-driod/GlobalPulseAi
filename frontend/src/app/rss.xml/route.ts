import { NextResponse } from "next/server";
import { fetchArticles } from "@/lib/api";

function escapeXml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://globlepluse.onrender.com").replace(/\/$/, "");

  let articles: any[] = [];
  try {
    const res = await fetchArticles({ limit: 100 });
    articles = res.items || [];
  } catch (err) {
    console.error("[RSS Feed] Failed to fetch articles:", err);
  }

  const buildDate = new Date().toUTCString();

  const itemsXml = articles
    .filter((a) => a && a.slug)
    .map((article) => {
      const articleUrl = `${siteUrl}/news/${article.slug}`;
      const pubDate = article.published_at
        ? new Date(article.published_at).toUTCString()
        : article.created_at
        ? new Date(article.created_at).toUTCString()
        : buildDate;

      const cleanSummary = (article.summary || "")
        .replace(/^[•▸*-\s]+/gm, " ")
        .trim();

      const imageTag = article.image_url
        ? `<enclosure url="${escapeXml(article.image_url)}" length="0" type="image/jpeg" />`
        : "";

      return `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(article.category || "Global News")}</category>
      <description>${escapeXml(cleanSummary)}</description>
      <author>newsroom@globalpulse.ai (Muhammad Saeed)</author>
      ${imageTag}
    </item>`;
    })
    .join("");

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>GlobalPulse AI | Tier-1 Global Newsroom &amp; Video Intelligence</title>
    <link>${siteUrl}</link>
    <description>Automated AI-powered global news, geopolitical telemetry, and video intelligence for Tier-1 decision makers.</description>
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    ${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(rssXml.trim(), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
