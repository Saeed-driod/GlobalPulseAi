import { HomePageClient } from "../components/HomePageClient";
import { Article } from "../types/article";
import { getBackendBaseUrl } from "../lib/backendUrl";

export const revalidate = 60;

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
  return <HomePageClient initialArticles={initialArticles} />;
}
