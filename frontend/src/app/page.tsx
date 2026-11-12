import { HomePageClient } from "../components/HomePageClient";
import { Article } from "../types/article";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getInitialArticles(): Promise<Article[]> {
  const backendUrl = "http://150.136.214.192";
  try {
    const res = await fetch(`${backendUrl}/api/articles?limit=30`, {
      cache: "no-store",
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
