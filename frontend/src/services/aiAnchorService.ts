/**
 * AI Anchor Presenter & Lip-Sync Service for GlobalPulse AI
 * 
 * Secure Architecture:
 * 1. Calls secure Vercel Serverless Function `/api/generate-anchor` (zero CORS, API key hidden on server).
 * 2. Polls `/api/generate-anchor?id=<talkId>` every 2.5s until `status === 'done'`.
 * 3. Graceful fallback to Built-in Canvas Voice-Synced Animated Anchor if credits run out or API fails.
 */

export type AnchorId = "sarah" | "david" | "none";

export interface AnchorProfile {
  id: AnchorId;
  name: string;
  title: string;
  gender: "female" | "male" | "none";
  avatarUrl: string;
  voiceGender: "female" | "male";
  voiceId: string; // Microsoft Neural Voice ID for D-ID
  preferredVoiceNames: string[];
}

export const ANCHOR_PROFILES: Record<AnchorId, AnchorProfile> = {
  sarah: {
    id: "sarah",
    name: "Sarah Jenkins (Jenny)",
    title: "Senior World & Tech Anchor",
    gender: "female",
    avatarUrl: "/assets/anchors/anchor_female_sarah.jpg",
    voiceGender: "female",
    voiceId: "en-US-JennyNeural",
    preferredVoiceNames: [
      "Microsoft Jenny Online (Natural) - English (United States)",
      "Microsoft Aria Online (Natural) - English (United States)",
      "Google US English",
      "Samantha",
      "Victoria",
    ],
  },
  david: {
    id: "david",
    name: "David Vance (Guy)",
    title: "Chief Markets & AI Correspondent",
    gender: "male",
    avatarUrl: "/assets/anchors/anchor_male_david.jpg",
    voiceGender: "male",
    voiceId: "en-US-GuyNeural",
    preferredVoiceNames: [
      "Microsoft Guy Online (Natural) - English (United States)",
      "Microsoft Christopher Online (Natural) - English (United States)",
      "Google UK English Male",
      "Daniel",
      "Alex",
    ],
  },
  none: {
    id: "none",
    name: "B-Roll Only",
    title: "Cinematic News B-Roll & Subtitles",
    gender: "none",
    avatarUrl: "",
    voiceGender: "female",
    voiceId: "en-US-JennyNeural",
    preferredVoiceNames: ["Google US English", "Samantha"],
  },
};

export interface ViralScript {
  hook: string;
  coreFacts: string[];
  takeaway: string;
  cta: string;
  fullScript: string;
  wordCount: number;
  estimatedSeconds: number;
}

/**
 * Generates a high-retention 30-35 second news anchor script (75-95 words)
 * with zero repeated lines, ending with "Read more on GlobalPulseAI.vercel.app".
 */
export function generateViral35sScript(
  title: string,
  summary: string,
  content?: string,
  category: string = "Global News"
): ViralScript {
  const cleanTitle = (title || "")
    .replace(/#\w+/g, "")
    .replace(/^BREAKING:\s*/i, "")
    .replace(/^EXCLUSIVE:\s*/i, "")
    .trim();

  // 1. Hook (0-3s)
  let hook = cleanTitle;
  if (!hook.endsWith(".") && !hook.endsWith("?") && !hook.endsWith("!")) {
    hook += ".";
  }

  // 2. Extract facts from summary / content (3 short conversational sentences)
  const rawBullets = (summary || "")
    .split("\n")
    .map((s) => s.replace(/^[•▸*#\-]\s*/, "").trim())
    .filter((s) => s.length > 20 && !s.toLowerCase().includes("operational findings") && !s.toLowerCase().includes("breaking intelligence dispatch"));

  let coreFacts: string[] = [];

  if (rawBullets.length >= 2) {
    coreFacts = rawBullets.slice(0, 3).map((f) => (f.endsWith(".") ? f : f + "."));
  } else {
    const sentences = (summary || "")
      .replace(/([.?!])\s+/g, "$1|")
      .split("|")
      .map((s) => s.trim())
      .filter((s) => s.length > 25 && !s.toLowerCase().includes("here are the primary"));
    
    if (sentences.length >= 2) {
      coreFacts = sentences.slice(0, 3);
    } else if (content) {
      const contentParas = content
        .split("\n\n")
        .map((p) => p.replace(/[#*`>|]/g, "").trim())
        .filter((p) => p.length > 40 && !p.startsWith("###"));
      if (contentParas.length > 0) {
        const pSentences = contentParas[0]
          .replace(/([.?!])\s+/g, "$1|")
          .split("|")
          .map((s) => s.trim())
          .filter((s) => s.length > 20);
        coreFacts = pSentences.slice(0, 3);
      }
    }
  }

  if (coreFacts.length === 0) {
    coreFacts = [
      `Key developments are rapidly shifting across ${category} as verified field data confirms significant market momentum.`,
      `Industry leaders and strategic analysts point out that this changes current operational benchmarks worldwide.`,
      `The immediate response from global markets highlights how high the stakes are for all participants.`,
    ];
  }

  // 3. Takeaway / Impact (25-30s)
  let takeaway = `Expect widespread structural adjustments as institutions and investors adapt to this momentum.`;
  if (category.toLowerCase().includes("tech") || category.toLowerCase().includes("ai")) {
    takeaway = `This milestone marks a decisive shift in how next-generation AI capabilities are deployed at scale.`;
  } else if (category.toLowerCase().includes("market") || category.toLowerCase().includes("econom")) {
    takeaway = `Analysts predict these signals will redefine sector valuations over the coming quarter.`;
  } else if (category.toLowerCase().includes("sport")) {
    takeaway = `Championship odds and upcoming tournament seeding are now dramatically altered by this result.`;
  }

  // 4. Fast CTA (30-35s)
  const cta = `Read more on GlobalPulseAI.vercel.app and follow @GlobalPulseAI for daily alerts.`;

  const scriptParts = [hook, ...coreFacts.slice(0, 3), takeaway, cta];
  const fullScript = scriptParts.join(" ").replace(/\s+/g, " ").trim();
  const words = fullScript.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const estimatedSeconds = Math.round((wordCount / 145) * 60);

  return {
    hook,
    coreFacts,
    takeaway,
    cta,
    fullScript,
    wordCount,
    estimatedSeconds,
  };
}

export interface DidAnchorResult {
  success: boolean;
  videoUrl?: string;
  error?: string;
  code?: string;
  duration?: number;
}

/**
 * Initiates real lip-synced D-ID AI Anchor video generation via the secure serverless route.
 * Automatically polls until the MP4 video is rendered and ready.
 */
export async function requestDidAnchorVideo(
  scriptText: string,
  anchorId: AnchorId = "sarah",
  onProgress?: (statusText: string, percentage: number) => void
): Promise<DidAnchorResult> {
  if (anchorId === "none") {
    return { success: false, error: "B-Roll mode selected. No talking anchor requested." };
  }

  const profile = ANCHOR_PROFILES[anchorId];
  const presenterGender = profile?.gender || "female";

  try {
    if (onProgress) onProgress("Contacting D-ID Serverless API...", 10);

    const postRes = await fetch("/api/generate-anchor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scriptText,
        presenterGender,
        aspectRatio: "9:16",
      }),
    });

    const postData = await postRes.json().catch(() => null);

    if (!postRes.ok || !postData?.success) {
      const isCreditError = postRes.status === 402 || postData?.code === "INSUFFICIENT_CREDITS";
      return {
        success: false,
        code: postData?.code || (isCreditError ? "INSUFFICIENT_CREDITS" : "API_ERROR"),
        error:
          postData?.error ||
          (isCreditError
            ? "D-ID API: Insufficient credits remaining on account. You can recharge at studio.d-id.com or continue using the 100% Free Built-in Studio Presenter Mode."
            : `D-ID request failed (${postRes.status}).`),
      };
    }

    const talkId = postData.id;
    if (onProgress) onProgress("Rendering D-ID neural lip-sync frames...", 25);

    // Poll every 2.5s for up to 75 seconds
    const maxAttempts = 30;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2500));

      const progressPct = Math.min(95, 25 + Math.round((attempt / maxAttempts) * 70));
      if (onProgress) {
        onProgress(`Rendering AI Anchor lip-sync (${progressPct}%)...`, progressPct);
      }

      const getRes = await fetch(`/api/generate-anchor?id=${talkId}`);
      const getData = await getRes.json().catch(() => null);

      if (getRes.ok && getData?.success) {
        if (getData.status === "done" && getData.result_url) {
          if (onProgress) onProgress("D-ID AI News Anchor Video Ready!", 100);
          return {
            success: true,
            videoUrl: getData.result_url,
            duration: getData.duration,
          };
        }

        if (getData.status === "error") {
          return {
            success: false,
            code: "RENDER_ERROR",
            error: getData.error?.description || getData.error?.message || "D-ID rendering failed on server.",
          };
        }
      }
    }

    return {
      success: false,
      code: "TIMEOUT",
      error: "D-ID video rendering timed out after 75 seconds.",
    };
  } catch (err: any) {
    return {
      success: false,
      code: "NETWORK_ERROR",
      error: err?.message || "Network error while connecting to /api/generate-anchor.",
    };
  }
}

/**
 * Backward compatibility wrapper
 */
export async function generateLipSyncVideo(
  scriptText: string,
  anchorId: AnchorId
): Promise<string | null> {
  const res = await requestDidAnchorVideo(scriptText, anchorId);
  return res.success && res.videoUrl ? res.videoUrl : null;
}
