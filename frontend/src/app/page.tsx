import { HomePageClient } from "../components/HomePageClient";
import { Article } from "../types/article";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NEON_CONNECTION_STRING = process.env.DATABASE_URL || "";

async function getInitialArticles(): Promise<Article[]> {
  if (!NEON_CONNECTION_STRING) {
    return [];
  }
  try {
    let endpoint = "https://ep-bold-feather-b4sildv7-pooler.c-6.us-east-2.aws.neon.tech/sql";
    const hostMatch = NEON_CONNECTION_STRING.match(/@([^/:]+)/);
    if (hostMatch && hostMatch[1]) {
      endpoint = `https://${hostMatch[1]}/sql`;
    }
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Neon-Connection-String": NEON_CONNECTION_STRING,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "SELECT * FROM articles WHERE status = 'PUBLISHED' ORDER BY id DESC LIMIT 30;",
        params: [],
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn("Neon HTTP SQL initial query returned status", res.status);
      return [];
    }
    const data = await res.json();
    return (data.rows || []) as Article[];
  } catch (err) {
    console.error("Failed to fetch initial articles from Neon:", err);
    return [];
  }
}

export default async function HomePage() {
  const initialArticles = await getInitialArticles();
  return <HomePageClient initialArticles={initialArticles} />;
}
