import { HomePageClient } from "../components/HomePageClient";
import { Article } from "../types/article";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NEON_CONNECTION_STRING = process.env.DATABASE_URL || "";

async function getInitialArticles(): Promise<Article[]> {
  if (NEON_CONNECTION_STRING) {
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
      if (res.ok) {
        const data = await res.json();
        const rows = (data.rows || []) as Article[];
        if (rows.length > 0) return rows;
      }
    } catch (err) {
      console.warn("Neon initial query failed, trying backend fallback:", err);
    }
  }

  // Seamless fallback to Render backend API
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://globlepluseai.onrender.com";
    const res = await fetch(`${backendUrl}/api/articles?limit=30`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      return (data.items || []) as Article[];
    }
  } catch (backendErr) {
    console.warn("Backend API initial articles fetch failed:", backendErr);
  }

  return [];
}

export default async function HomePage() {
  const initialArticles = await getInitialArticles();
  return <HomePageClient initialArticles={initialArticles} />;
}
