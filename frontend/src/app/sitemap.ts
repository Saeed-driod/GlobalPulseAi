import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://globlepluse.onrender.com").replace(/\/$/, "");
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

  const nowIso = new Date().toISOString();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}`,
      lastModified: nowIso,
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: nowIso,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/privacy-policy`,
      lastModified: nowIso,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: nowIso,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: nowIso,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  let articleRoutes: MetadataRoute.Sitemap = [];

  try {
    const res = await fetch(`${apiBase}/api/articles?status=PUBLISHED&limit=100`, {
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      const articles = data.items || [];
      articleRoutes = articles.map((article: any) => ({
        url: `${BASE_URL}/news/${article.slug}`,
        lastModified: article.published_at ? new Date(article.published_at).toISOString() : nowIso,
        changeFrequency: "hourly" as const,
        priority: 0.9,
      }));
    }
  } catch (err) {
    console.warn("Could not fetch published articles for sitemap, falling back to static entries:", err);
  }

  return [...staticRoutes, ...articleRoutes];
}
