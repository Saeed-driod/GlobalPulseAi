import { HomePageClient } from "../components/HomePageClient";
import { Article } from "../types/article";
import { getBackendBaseUrl } from "../lib/backendUrl";

export const revalidate = 60;

function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

async function getInitialArticles(): Promise<Article[]> {
  const backendUrl = getBackendBaseUrl();
  try {
    const res = await fetch(`${backendUrl}/api/articles?limit=30`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      return (data.items || []) as Article[];
    }
  } catch (backendErr) {
    console.warn("Oracle Backend API initial articles fetch failed:", backendErr);
  }

  return [];
}

export default async function HomePage() {
  const initialArticles = await getInitialArticles();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://globalpulseai.vercel.app").replace(/\/$/, "");

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "GlobalPulse AI",
    url: siteUrl,
    logo: `${siteUrl}/logo_wide_light.png`,
    sameAs: ["https://www.youtube.com/@GlobalPulseAI"],
  };

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "GlobalPulse AI",
    url: siteUrl,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(webSiteSchema) }}
      />
      <HomePageClient initialArticles={initialArticles} />
    </>
  );
}
