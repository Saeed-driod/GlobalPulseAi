import { NextResponse } from "next/server";

export const revalidate = 900; // 15 minutes cache on edge

const DEFAULT_STREAMS: Record<string, string> = {
  "sky-news": "umLWFz4izTM",
  "al-jazeera": "gCNeDWCI0vo",
  "dw-news": "LuKwFajn37U",
  "nasa-live": "ROboUHfPUrU",
  "abc-news": "KQhNZQ_Uag8",
};

const CHANNEL_URLS: Record<string, string> = {
  "sky-news": "https://www.youtube.com/@SkyNews/live",
  "al-jazeera": "https://www.youtube.com/@aljazeeraenglish/live",
  "dw-news": "https://www.youtube.com/@dwnews/live",
  "nasa-live": "https://www.youtube.com/@NASA/live",
  "abc-news": "https://www.youtube.com/@ABCNews/live",
};

async function resolveLiveVideoId(url: string, fallback: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 900 },
    });
    clearTimeout(timeout);

    if (!res.ok) return fallback;
    const html = await res.text();

    const canonicalMatch = html.match(
      /<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})"/
    );
    if (canonicalMatch && canonicalMatch[1]) {
      return canonicalMatch[1];
    }

    const vidMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    if (vidMatch && vidMatch[1]) {
      return vidMatch[1];
    }

    return fallback;
  } catch {
    return fallback;
  }
}

export async function GET() {
  const entries = await Promise.all(
    Object.entries(CHANNEL_URLS).map(async ([key, url]) => {
      const vid = await resolveLiveVideoId(url, DEFAULT_STREAMS[key]);
      return [key, vid];
    })
  );

  const streams = Object.fromEntries(entries);
  return NextResponse.json(
    {
      success: true,
      streams,
      updated_at: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
      },
    }
  );
}

