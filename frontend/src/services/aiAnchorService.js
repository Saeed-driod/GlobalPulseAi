/**
 * AI Anchor Presenter & Lip-Sync Service for GlobalPulse AI (JavaScript export)
 */

export const ANCHOR_PROFILES = {
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

export function generateViral35sScript(title, summary, content, category = "Global News") {
  const cleanTitle = (title || "")
    .replace(/#\w+/g, "")
    .replace(/^BREAKING:\s*/i, "")
    .replace(/^EXCLUSIVE:\s*/i, "")
    .trim();

  let hook = cleanTitle;
  if (!hook.endsWith(".") && !hook.endsWith("?") && !hook.endsWith("!")) {
    hook += ".";
  }

  const rawBullets = (summary || "")
    .split("\n")
    .map((s) => s.replace(/^[•▸*#\-]\s*/, "").trim())
    .filter((s) => s.length > 20 && !s.toLowerCase().includes("operational findings") && !s.toLowerCase().includes("breaking intelligence dispatch"));

  let coreFacts = [];
  if (rawBullets.length >= 2) {
    coreFacts = rawBullets.slice(0, 3).map((f) => (f.endsWith(".") ? f : f + "."));
  } else {
    const sentences = (summary || "")
      .replace(/([.?!])\s+/g, "$1|")
      .split("|")
      .map((s) => s.trim())
      .filter((s) => s.length > 25);
    coreFacts = sentences.slice(0, 3);
  }

  if (coreFacts.length === 0) {
    coreFacts = [
      `Key developments are rapidly shifting across ${category} as verified field data confirms significant market momentum.`,
      `Industry leaders and strategic analysts point out that this changes current operational benchmarks worldwide.`,
      `The immediate response from global markets highlights how high the stakes are for all participants.`,
    ];
  }

  let takeaway = `Expect widespread shifts across the industry as institutions and investors adapt to this momentum.`;
  if (category.toLowerCase().includes("tech") || category.toLowerCase().includes("ai")) {
    takeaway = `This milestone marks a decisive shift in how next-generation AI capabilities are deployed at scale.`;
  }

  const cta = `For the complete investigative breakdown, visit globalpulseai.vercel.app and follow @GlobalPulseAI.`;

  const scriptParts = [hook, ...coreFacts, takeaway, cta];
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

export async function generateLipSyncVideo(scriptText, anchorId) {
  if (anchorId === "none") return null;
  const profile = ANCHOR_PROFILES[anchorId];
  if (!profile || !profile.avatarUrl) return null;

  const didKey =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_DID_API_KEY ||
        process.env.VITE_DID_API_KEY ||
        ""
      : "";

  if (didKey) {
    try {
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
              voice_id: profile.gender === "female" ? "en-US-JennyNeural" : "en-US-GuyNeural",
            },
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const talkId = data.id;
        for (let i = 0; i < 20; i++) {
          await new Promise((r) => setTimeout(r, 2000));
          const checkRes = await fetch(`https://api.d-id.com/talks/${talkId}`, {
            headers: { Authorization: `Basic ${didKey}` },
          });
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            if (checkData.status === "done" && checkData.result_url) {
              return checkData.result_url;
            }
          }
        }
      }
    } catch (e) {
      console.warn("[aiAnchorService] D-ID call error:", e);
    }
  }

  return null;
}
