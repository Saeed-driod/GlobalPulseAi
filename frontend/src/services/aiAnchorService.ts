/**
 * AI Anchor Presenter & Lip-Sync Service for GlobalPulse AI
 * 
 * Supports:
 * 1. D-ID API (NEXT_PUBLIC_DID_API_KEY / VITE_DID_API_KEY)
 * 2. HeyGen API (NEXT_PUBLIC_HEYGEN_API_KEY / VITE_HEYGEN_API_KEY)
 * 3. Built-in Canvas Voice-Synced Animated Anchor Fallback (Zero cost, runs 100% offline/client-side)
 */

export type AnchorId = "sarah" | "david" | "none";

export interface AnchorProfile {
  id: AnchorId;
  name: string;
  title: string;
  gender: "female" | "male" | "none";
  avatarUrl: string;
  voiceGender: "female" | "male";
  preferredVoiceNames: string[];
}

export const ANCHOR_PROFILES: Record<AnchorId, AnchorProfile> = {
  sarah: {
    id: "sarah",
    name: "Sarah Jenkins",
    title: "Senior World & Tech Anchor",
    gender: "female",
    avatarUrl: "/assets/anchors/anchor_female_sarah.jpg",
    voiceGender: "female",
    preferredVoiceNames: [
      "Microsoft Jenny Online (Natural) - English (United States)",
      "Microsoft Aria Online (Natural) - English (United States)",
      "Google US English",
      "Samantha",
      "Victoria",
      "Karen",
    ],
  },
  david: {
    id: "david",
    name: "David Vance",
    title: "Chief Markets & AI Correspondent",
    gender: "male",
    avatarUrl: "/assets/anchors/anchor_male_david.jpg",
    voiceGender: "male",
    preferredVoiceNames: [
      "Microsoft Guy Online (Natural) - English (United States)",
      "Microsoft Christopher Online (Natural) - English (United States)",
      "Google UK English Male",
      "Daniel",
      "Alex",
      "Fred",
    ],
  },
  none: {
    id: "none",
    name: "B-Roll Only",
    title: "Cinematic News B-Roll & Subtitles",
    gender: "none",
    avatarUrl: "",
    voiceGender: "female",
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
 * Generates a high-retention 35-45 second news script (90-110 words max)
 * following the 4-part viral newsroom structure:
 *  1. 0-3s Hook: Immediate conflict / surprising fact
 *  2. 3-25s Core Facts: 3 punchy sentences (what, why, who)
 *  3. 25-35s Takeaway: Forward-looking consequence
 *  4. 35-40s CTA: Visit globalpulseai.vercel.app and subscribe
 */
export function generateViral35sScript(
  title: string,
  summary: string,
  content?: string,
  category: string = "Global News"
): ViralScript {
  const cleanTitle = title
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
    // Split summary by sentences
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

  // 3. Takeaway / Impact (25-35s)
  let takeaway = `Expect widespread shifts across the industry as institutions and investors adapt to this momentum.`;
  if (category.toLowerCase().includes("tech") || category.toLowerCase().includes("ai")) {
    takeaway = `This milestone marks a decisive shift in how next-generation AI capabilities are deployed at scale.`;
  } else if (category.toLowerCase().includes("market") || category.toLowerCase().includes("econom")) {
    takeaway = `Analysts predict these signals could redefine sector valuations over the coming quarter.`;
  } else if (category.toLowerCase().includes("sport")) {
    takeaway = `Championship odds and upcoming tournament seeding are now dramatically altered by this result.`;
  }

  // 4. Fast CTA (35-40s)
  const cta = `For the complete investigative breakdown, visit globalpulseai.vercel.app and follow @GlobalPulseAI.`;

  const scriptParts = [hook, ...coreFacts, takeaway, cta];
  const fullScript = scriptParts.join(" ").replace(/\s+/g, " ").trim();
  const words = fullScript.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  // Estimated audio duration at 145 words per minute
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

/**
 * Attempts to generate a real lip-synced talking head video via D-ID or HeyGen.
 * If no API key is provided or the call fails, returns null so the app falls back
 * gracefully to the zero-cost built-in voice-synced animated studio anchor.
 */
export async function generateLipSyncVideo(
  scriptText: string,
  anchorId: AnchorId
): Promise<string | null> {
  if (anchorId === "none") return null;

  const profile = ANCHOR_PROFILES[anchorId];
  if (!profile || !profile.avatarUrl) return null;

  const didKey =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_DID_API_KEY ||
        process.env.VITE_DID_API_KEY ||
        ""
      : "";

  const heygenKey =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_HEYGEN_API_KEY ||
        process.env.VITE_HEYGEN_API_KEY ||
        ""
      : "";

  // 1. Try D-ID if key is configured
  if (didKey) {
    try {
      console.log("[AI Anchor Service] Requesting D-ID lip-sync generation...");
      const fullOrigin =
        typeof window !== "undefined" ? window.location.origin : "https://globalpulseai.vercel.app";
      const sourceUrl = `${fullOrigin}${profile.avatarUrl}`;

      const res = await fetch("https://api.d-id.com/talks", {
        method: "POST",
        headers: {
          Authorization: `Basic ${didKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_url: sourceUrl,
          script: {
            type: "text",
            input: scriptText,
            subtitles: false,
            provider: {
              type: "microsoft",
              voice_id:
                profile.gender === "female"
                  ? "en-US-JennyNeural"
                  : "en-US-GuyNeural",
            },
          },
          config: {
            fluent: true,
            pad_audio: 0.5,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const talkId = data.id;

        // Poll for result
        for (let i = 0; i < 20; i++) {
          await new Promise((r) => setTimeout(r, 2000));
          const checkRes = await fetch(`https://api.d-id.com/talks/${talkId}`, {
            headers: { Authorization: `Basic ${didKey}` },
          });
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            if (checkData.status === "done" && checkData.result_url) {
              console.log("[AI Anchor Service] D-ID lip-sync video ready:", checkData.result_url);
              return checkData.result_url;
            }
            if (checkData.status === "error") {
              console.warn("[AI Anchor Service] D-ID generation error:", checkData.error);
              break;
            }
          }
        }
      } else {
        console.warn("[AI Anchor Service] D-ID API returned:", res.status, await res.text());
      }
    } catch (e) {
      console.warn("[AI Anchor Service] D-ID call failed, using built-in canvas presenter:", e);
    }
  }

  // 2. Try HeyGen if key is configured
  if (heygenKey) {
    try {
      console.log("[AI Anchor Service] Requesting HeyGen lip-sync generation...");
      const res = await fetch("https://api.heygen.com/v2/video/generate", {
        method: "POST",
        headers: {
          "X-Api-Key": heygenKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          video_inputs: [
            {
              character: {
                type: "talking_photo",
                talking_photo_id: anchorId === "sarah" ? "sarah_anchor" : "david_anchor",
              },
              voice: {
                type: "text",
                input_text: scriptText,
                voice_id: profile.gender === "female" ? "en_us_female" : "en_us_male",
              },
            },
          ],
          dimension: { width: 1080, height: 1920 },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.data?.video_url) {
          return data.data.video_url;
        }
      }
    } catch (e) {
      console.warn("[AI Anchor Service] HeyGen call failed:", e);
    }
  }

  // Fallback: null triggers real-time voice-synced Canvas Anchor Animation
  return null;
}
