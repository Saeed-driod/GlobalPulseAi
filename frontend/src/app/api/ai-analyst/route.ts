import { NextRequest, NextResponse } from "next/server";

// Best-effort in-memory per-IP rate limiter (10 requests per minute)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateLimitMap.set(ip, timestamps);
    return true;
  }

  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);

  // Periodic garbage collection
  if (rateLimitMap.size > 1000) {
    for (const [key, ts] of rateLimitMap.entries()) {
      const active = ts.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
      if (active.length === 0) rateLimitMap.delete(key);
      else rateLimitMap.set(key, active);
    }
  }

  return false;
}

export async function POST(req: NextRequest) {
  try {
    // 1. In-memory per-IP rate limit check (10 requests / min)
    const forwarded = req.headers.get("x-forwarded-for");
    const clientIp = forwarded
      ? forwarded.split(",")[0].trim()
      : req.headers.get("x-real-ip") || "anonymous";

    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded. Maximum 10 analysis requests per minute.",
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawText = (body.text || "").trim();
    const rawMode = body.mode || "executive";
    const mode = ["executive", "eli5", "market"].includes(rawMode)
      ? rawMode
      : "executive";

    if (!rawText || rawText.length < 20) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter at least 20 characters of news text or a headline to synthesize.",
        },
        { status: 400 }
      );
    }

    // 2. Try Gemini AI if API key is present in environment
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
        const prompt = `You are GlobalPulse AI Intelligence Engine. Synthesize the following news text under mode "${mode}".
Return STRICT JSON with these keys:
{
  "headline": "Short punchy 1-sentence synthesized takeaway",
  "bullets": ["3 distinct analytical bullet points, max 20 words each"],
  "entities": ["3 to 5 key organizations, entities, or concepts mentioned"],
  "reading_time_saved": "e.g. 2 mins 40 secs"
}

Text to analyze:
"""${rawText.slice(0, 3000)}"""
`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": geminiKey,
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2,
              },
            }),
            signal: AbortSignal.timeout(8000), // 8 seconds timeout
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const textResponse = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textResponse) {
            const parsed = JSON.parse(textResponse);
            return NextResponse.json({
              success: true,
              mode,
              source: "ai",
              headline: parsed.headline || "Synthesized Intelligence Takeaway",
              bullets: Array.isArray(parsed.bullets) ? parsed.bullets : [],
              entities: Array.isArray(parsed.entities) ? parsed.entities : [],
              reading_time_saved: parsed.reading_time_saved || "1m 30s",
            });
          }
        }
      } catch {
        // Fall back cleanly to basic heuristic text analyzer
      }
    }

    // 3. Basic Heuristic NLP Engine (Reliable fallback when AI is unavailable or offline)
    const words = rawText.split(/\s+/);
    const wordCount = words.length;
    const readingTimeSavedSec = Math.max(30, Math.round((wordCount / 200) * 60));
    const minutesSaved = Math.floor(readingTimeSavedSec / 60);
    const secondsSaved = readingTimeSavedSec % 60;
    const timeSavedStr = minutesSaved > 0 ? `${minutesSaved}m ${secondsSaved}s` : `${secondsSaved}s`;

    const sentences = rawText
      .split(/(?<=[.?!])\s+/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 15);

    let bullets: string[] = [];
    if (mode === "eli5") {
      bullets = [
        "In simple terms: A major event occurred that changes operations across this area.",
        "Why it matters: It removes redundant steps and allows faster coordination.",
        "What happens next: Teams and organizations are preparing to adopt these developments.",
      ];
    } else if (mode === "market") {
      bullets = [
        "Capital Flow Impact: Analysts are tracking sector allocation shifts across major financial hubs.",
        "Cost Dynamics: Early adopters project measurable efficiency improvements over upcoming quarters.",
        "Market Structure: Competing entities face increased pressure to modernize legacy operations.",
      ];
    } else {
      // Executive mode
      bullets = [
        sentences[0] ? sentences[0].slice(0, 160) : "Reporting confirms significant developments across the sector.",
        sentences[1] ? sentences[1].slice(0, 160) : "Key stakeholders and observers are monitoring unfolding operational consequences.",
        sentences[2] ? sentences[2].slice(0, 160) : "Further official dispatches and metric releases are anticipated shortly.",
      ];
    }

    const detectedEntities = Array.from(
      new Set(
        (rawText.match(/\b[A-Z][a-z]{3,}\b/g) || [
          "Global Intelligence",
          "Enterprise Network",
          "Technology Protocol",
        ]).slice(0, 4)
      )
    );

    return NextResponse.json({
      success: true,
      mode,
      source: "basic",
      headline: sentences[0] ? sentences[0].slice(0, 120) : "Synthesized Intelligence Takeaway",
      bullets,
      entities: detectedEntities.length > 0 ? detectedEntities : ["Global Intelligence", "Enterprise", "AI Systems"],
      reading_time_saved: timeSavedStr,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to synthesize news text." },
      { status: 500 }
    );
  }
}
