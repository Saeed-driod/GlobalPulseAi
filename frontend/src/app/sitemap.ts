import type { MetadataRoute } from "next";
import { fetchArticles } from "@/lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://globlepulseai.onrender.com").replace(/\/$/, "");
  const currentDate = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: currentDate,
      changeFrequency: "hourly",
      priority: 1.0,
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
  ];

  try {
    const res1 = await fetchArticles({ limit: 100, skip: 0 });
    let allArticles = [...(res1.items || [])];

    if (res1.total > 100) {
      const res2 = await fetchArticles({ limit: 100, skip: 100 });
      allArticles = [...allArticles, ...(res2.items || [])];
    }

    const dynamicRoutes: MetadataRoute.Sitemap = allArticles
      .filter((article) => article && article.slug)
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
  } catch (err) {
    console.error("[Sitemap Error] Could not load dynamic articles:", err);
    return staticRoutes;
  }
}
