import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://globalpulseai.com";
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
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
        url: `${siteUrl}/news/${article.slug}`,
        lastModified: article.published_at ? new Date(article.published_at) : new Date(),
        changeFrequency: "hourly" as const,
        priority: 0.9,
      }));
    }
  } catch (err) {
    console.warn("Could not fetch published articles for sitemap, falling back to static entries:", err);
  }

  return [...staticRoutes, ...articleRoutes];
}
