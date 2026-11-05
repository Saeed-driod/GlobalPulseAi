/**
 * GlobalPulse AI - Image Optimization & HD Upscaler Utility
 * Automatically rewrites known low-res CDN thumbnail URLs to crystal-clear 1024px+ HD.
 */

export function getHdImageUrl(url?: string | null): string {
  if (!url || typeof url !== "string" || !url.startsWith("http")) {
    return url || "";
  }

  // 1. BBC CDN (ichef.bbci.co.uk): Rewrite 240/320/480/640 to 1024 HD
  if (url.includes("ichef.bbci.co.uk")) {
    return url
      .replace(/\/standard\/\d+\//g, "/standard/1024/")
      .replace(/\/news\/\d+\//g, "/news/1024/");
  }

  // 2. Sanity CDN (CoinDesk, etc.): Rewrite w=800&h=450 to w=1600&h=900
  if (url.includes("cdn.sanity.io")) {
    let upgraded = url
      .replace(/w=\d+&h=\d+/g, "w=1600&h=900")
      .replace(/w=\d+/g, "w=1600");
    if (!upgraded.includes("fit=")) {
      upgraded += "&fit=crop";
    }
    return upgraded;
  }

  // 3. ScienceX CDN (scx1.b-cdn.net): Rewrite /tmb/ to /800/
  if (url.includes("b-cdn.net") && url.includes("/tmb/")) {
    return url.replace("/tmb/", "/800/");
  }

  // 4. Yahoo CDN (s.yimg.com): Rewrite /resize/ to 1200x675
  if (url.includes("s.yimg.com")) {
    return url.replace(/\/resize\/\d+x\d+\//g, "/resize/1200x675/");
  }

  // 5. Pollinations AI: Upgrade to Flux 1280x720 with enhancement
  if (url.includes("image.pollinations.ai")) {
    let upgraded = url.replace(/width=\d+&height=\d+/g, "width=1280&height=720");
    if (!upgraded.includes("model=")) {
      upgraded += "&model=flux&enhance=true";
    }
    return upgraded;
  }

  // 6. Unsplash CDN: Ensure 1280px width
  if (url.includes("images.unsplash.com")) {
    return url.replace(/w=\d+/g, "w=1280");
  }

  return url;
}

export function getPollinationsFallback(title: string, category: string, seed: number = 100): string {
  const cleanWords = (title || "global intelligence news")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 5)
    .join(" ");

  const query = encodeURIComponent(
    `${cleanWords || category} editorial news photography realistic 8k`
  );

  return `https://image.pollinations.ai/prompt/${query}?width=1280&height=720&model=flux&enhance=true&nologo=true&seed=${seed}`;
}
