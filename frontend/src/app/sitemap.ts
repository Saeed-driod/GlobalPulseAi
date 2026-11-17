import type { MetadataRoute } from "next";
import { fetchArticles } from "@/lib/api";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "https://globalpulseai.vercel.app"
  ).replace(/\/$/, "");
  const currentDate = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: currentDate,
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/live`,
      lastModified: currentDate,
      changeFrequency: "always",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/sports`,
      lastModified: currentDate,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/privacy-policy`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/category/ai-tech`,
      lastModified: currentDate,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/category/markets`,
      lastModified: currentDate,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/category/world-politics`,
      lastModified: currentDate,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/category/science`,
      lastModified: currentDate,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/category/sports`,
      lastModified: currentDate,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/category/entertainment`,
      lastModified: currentDate,
      changeFrequency: "hourly",
      priority: 0.9,
    },
  ];

  const HARD_CAP = 5000;
  const PAGE_LIMIT = 500;
  const allArticles: any[] = [];
  let skip = 0;
  let totalArticles = Infinity;

  while (skip < totalArticles && allArticles.length < HARD_CAP) {
    try {
      const fetchLimit = Math.min(PAGE_LIMIT, HARD_CAP - allArticles.length);
      const res = await fetchArticles({
        status: "PUBLISHED",
        limit: fetchLimit,
        skip,
        revalidate: 3600,
      });

      const items = res.items || [];
      if (items.length === 0) break;

      allArticles.push(...items);
      totalArticles = typeof res.total === "number" ? res.total : allArticles.length;
      skip += items.length;

      // If backend returned fewer items than requested, we reached the end
      if (items.length < fetchLimit) break;
    } catch (err) {
      console.warn(`[Sitemap Warning] Error fetching articles page at skip ${skip}:`, err);
      // Keep what was already collected and stop looping
      break;
    }
  }

  const dynamicRoutes: MetadataRoute.Sitemap = allArticles
    .filter((article) => article && article.slug && !article.is_noindex)
    .map((article) => ({
      url: `${siteUrl}/news/${article.slug}`,
      lastModified: article.published_at
        ? new Date(article.published_at)
        : article.created_at
        ? new Date(article.created_at)
        : currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    }));

  return [...staticRoutes, ...dynamicRoutes];
}
