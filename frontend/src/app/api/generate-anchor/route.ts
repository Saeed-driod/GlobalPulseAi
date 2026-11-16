import { NextRequest, NextResponse } from "next/server";

// Publicly reachable high-resolution studio presenter portraits
const ANCHOR_IMAGE_URLS = {
  female: "https://globalpulseai.vercel.app/assets/anchors/anchor_female_sarah.jpg",
  male: "https://globalpulseai.vercel.app/assets/anchors/anchor_male_david.jpg",
};

/**
 * POST /api/generate-anchor
 * Initiates D-ID Talks API video generation with selected anchor and neural voice.
 */
export async function POST(req: NextRequest) {
  try {
    const apiKey = (process.env.DID_API_KEY || process.env.NEXT_PUBLIC_DID_API_KEY || "").trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          code: "MISSING_API_KEY",
          error: "D-ID API Key not configured. Please set DID_API_KEY in environment variables.",
        },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { scriptText, presenterGender = "female", customImageUrl } = body;

    if (!scriptText || typeof scriptText !== "string" || scriptText.trim().length < 5) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid scriptText (at least 5 characters) is required to generate the talking anchor.",
        },
        { status: 400 }
      );
    }

    const isFemale = presenterGender.toLowerCase().includes("female") || presenterGender.toLowerCase() === "sarah";
    const sourceUrl = customImageUrl || (isFemale ? ANCHOR_IMAGE_URLS.female : ANCHOR_IMAGE_URLS.male);
    const voiceId = isFemale ? "en-US-JennyNeural" : "en-US-GuyNeural";

    const cleanScript = scriptText.replace(/#\w+/g, "").replace(/\s+/g, " ").trim();
    const authHeader = apiKey.startsWith("Basic ") ? apiKey : `Basic ${apiKey}`;

    const payload = {
      source_url: sourceUrl,
      script: {
        type: "text",
        subtitles: false,
        provider: {
          type: "microsoft",
          voice_id: voiceId,
        },
        input: cleanScript,
      },
      config: {
        fluent: true,
        pad_audio: 0.0,
      },
    };

    console.log(`[API /generate-anchor] Sending request to D-ID Talks API (Voice: ${voiceId}, Gender: ${isFemale ? "female" : "male"})...`);

    const didRes = await fetch("https://api.d-id.com/talks", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const didData = await didRes.json().catch(() => null);

    if (!didRes.ok) {
      console.warn("[API /generate-anchor] D-ID responded with error:", didRes.status, didData);

      if (didRes.status === 402 || didData?.kind === "InsufficientCreditsError") {
        return NextResponse.json(
          {
            success: false,
            code: "INSUFFICIENT_CREDITS",
            error: "D-ID API: Insufficient credits remaining on account (0 credits). You can recharge at studio.d-id.com or continue using the 100% Free Built-in Studio Presenter Mode.",
            details: didData,
          },
          { status: 402 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          code: didData?.kind || "DID_API_ERROR",
          error: didData?.description || didData?.message || `D-ID API returned status ${didRes.status}`,
          details: didData,
        },
        { status: didRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      id: didData.id,
      status: didData.status,
      created_at: didData.created_at,
      object: didData.object,
      presenterGender: isFemale ? "female" : "male",
      voiceId,
    });
  } catch (err: any) {
    console.error("[API /generate-anchor] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Internal server error occurred while contacting D-ID Talks API.",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/generate-anchor?id=<talkId>
 * Polls the status of an active D-ID talk job.
 */
export async function GET(req: NextRequest) {
  try {
    const apiKey = (process.env.DID_API_KEY || process.env.NEXT_PUBLIC_DID_API_KEY || "").trim();
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "DID_API_KEY is not configured." },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const talkId = searchParams.get("id");

    if (!talkId) {
      return NextResponse.json(
        { success: false, error: "Missing required query parameter: id" },
        { status: 400 }
      );
    }

    const authHeader = apiKey.startsWith("Basic ") ? apiKey : `Basic ${apiKey}`;

    const didRes = await fetch(`https://api.d-id.com/talks/${talkId}`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
    });

    const didData = await didRes.json().catch(() => null);

    if (!didRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: didData?.description || didData?.message || `Failed to fetch talk ${talkId}`,
        },
        { status: didRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      id: didData.id,
      status: didData.status,
      result_url: didData.result_url || null,
      duration: didData.duration || null,
      error: didData.error || null,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to check D-ID talk status.",
      },
      { status: 500 }
    );
  }
}
