import { NextResponse } from "next/server";

export const revalidate = 86400; // 24-hour cache

const KNOWN_TRAILERS: Record<string, string> = {
  "dune: part two": "Way9Dexny3w",
  "dune part two": "Way9Dexny3w",
  "dune 2": "Way9Dexny3w",
  "oppenheimer": "uYPbbksJxIg",
  "deadpool & wolverine": "73_1biulkYk",
  "deadpool and wolverine": "73_1biulkYk",
  "jawan": "MWOlnZSnXJo",
  "squid game": "oqxAJKy0ii4",
  "parasite": "isOGD_7hNIY",
  "rrr": "GY4BgdUSpbE",
  "interstellar": "zSWdZVtXT7E",
  "spirited away": "ByXuk9QqQkk",
  "demon slayer: mugen train": "ATJYac_dORw",
  "demon slayer mugen train": "ATJYac_dORw",
  "night of the living dead": "5gUKVMJPmfU",
  "modern times": "GLeDdzGUTq0",
  "gladiator ii": "4rgYUipGJNo",
  "gladiator 2": "4rgYUipGJNo",
  "avatar": "5PSNL1qE6VY",
  "avatar: the way of water": "d9MyW72ELq0",
  "avatar the way of water": "d9MyW72ELq0",
  "the dark knight": "EXeTwQWrcwY",
  "inception": "YoHD9XEInc0",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "";
  const cleanTitle = title.trim().toLowerCase();

  if (!cleanTitle) {
    return NextResponse.json({ success: false, error: "Title parameter required" }, { status: 400 });
  }

  // 1. Instant check in verified dictionary
  for (const [key, vid] of Object.entries(KNOWN_TRAILERS)) {
    if (cleanTitle.includes(key) || key.includes(cleanTitle)) {
      return NextResponse.json({
        success: true,
        title,
        videoId: vid,
        source: "verified_cache",
      });
    }
  }

  // 2. Dynamic live YouTube search scrape for any global movie
  try {
    const query = `${title} official trailer`;
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const html = await res.text();
      const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      if (match && match[1]) {
        return NextResponse.json({
          success: true,
          title,
          videoId: match[1],
          source: "live_search",
        });
      }
    }
  } catch (err) {
    console.warn("Dynamic trailer search error:", err);
  }

  // Fallback trailer ID (Dune 2)
  return NextResponse.json({
    success: true,
    title,
    videoId: "Way9Dexny3w",
    source: "fallback",
  });
}
