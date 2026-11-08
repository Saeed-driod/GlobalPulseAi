/**
 * GlobalPulse AI - Image Optimization & Branded Card Utility
 * Rejects third-party publisher hotlinking and AI-generated fake news photos.
 * Provides custom self-hosted branded OG cards (/api/og) and licensed illustration handlers.
 */

const PUBLISHER_DOMAINS = [
  "ichef.bbci.co.uk", "bbci.co.uk", "bbc.com", "bbc.co.uk",
  "guim.co.uk", "theguardian.com",
  "reuters.com", "reutersmedia.net",
  "espn.com", "espncdn.com", "espncricinfo.com",
  "cnbc.com", "nbcnews.com",
  "politico.com",
  "aljazeera.com",
  "scx1.b-cdn.net", "sciencedaily.com", "phys.org",
  "cdn.sanity.io", "coindesk.com",
  "s.yimg.com", "yahoo.com",
  "variety.com",
  "ign.com", "ignimgs.com",
  "arstechnica.com", "condenast.com",
  "theverge.com", "vox-cdn.com",
  "techcrunch.com",
  "image.pollinations.ai"
];

export function isPublisherHotlink(url?: string | null): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return PUBLISHER_DOMAINS.some((domain) => u.includes(domain));
}

export function getBrandedOgUrl(title: string, category: string = "AI & Tech"): string {
  const cleanTitle = (title || "Global Breaking News").replace(/\|?\s*GlobalPulse AI/gi, "").trim();
  const encodedTitle = encodeURIComponent(cleanTitle);
  const encodedCat = encodeURIComponent(category || "News");
  return `/api/og?title=${encodedTitle}&category=${encodedCat}`;
}

export function getHdImageUrl(url?: string | null, title?: string, category?: string): string {
  if (!url || typeof url !== "string") {
    return title ? getBrandedOgUrl(title, category) : "/default-thumbnail.jpg";
  }

  // Reject publisher hotlinks and AI-generated photos
  if (isPublisherHotlink(url)) {
    return title ? getBrandedOgUrl(title, category) : "/default-thumbnail.jpg";
  }

  // Handle local /api/og routes
  if (url.startsWith("/api/og")) {
    return url;
  }

  // Handle licensed Unsplash photos
  if (url.includes("images.unsplash.com")) {
    return url.replace(/w=\d+/g, "w=1280");
  }

  return url;
}

// Backward-compatible fallback helper that returns our own branded OG card
export function getPollinationsFallback(title: string, category: string, seed: number = 100): string {
  return getBrandedOgUrl(title, category);
}
