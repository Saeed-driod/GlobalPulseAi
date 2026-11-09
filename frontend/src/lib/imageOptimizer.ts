/**
 * GlobalPulse AI - Image Optimization & Topic-Matched Visuals Utility
 * Rejects third-party publisher hotlinking and replaces black placeholder cards
 * with licensed, high-definition Unsplash editorial photography.
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

// Curated high-definition editorial photos (100% royalty-free, legal Unsplash visuals)
export const CATEGORY_PHOTOS: Record<string, string[]> = {
  "Sports": [
    "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1280&q=80"
  ],
  "AI & Tech": [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1280&q=80"
  ],
  "Markets": [
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1280&q=80"
  ],
  "Science": [
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1280&q=80"
  ],
  "Entertainment": [
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1280&q=80"
  ],
  "World Politics": [
    "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1280&q=80",
    "https://images.unsplash.com/photo-1569025743873-ea3a9ade89f9?auto=format&fit=crop&w=1280&q=80"
  ]
};

function normalizeCategory(category?: string): string {
  if (!category) return "AI & Tech";
  const c = category.toLowerCase();
  if (c.includes("sport")) return "Sports";
  if (c.includes("market") || c.includes("finance") || c.includes("econom")) return "Markets";
  if (c.includes("polit") || c.includes("world") || c.includes("geo")) return "World Politics";
  if (c.includes("scien") || c.includes("space") || c.includes("health") || c.includes("medic")) return "Science";
  if (c.includes("entertain") || c.includes("movie") || c.includes("film") || c.includes("music") || c.includes("show")) return "Entertainment";
  return "AI & Tech";
}

export function getCategoryCuratedPhoto(category?: string, title?: string, seed?: number): string {
  const normCat = normalizeCategory(category);
  const pool = CATEGORY_PHOTOS[normCat] || CATEGORY_PHOTOS["AI & Tech"];
  let index = 0;
  if (typeof seed === "number" && !isNaN(seed)) {
    index = Math.abs(seed) % pool.length;
  } else if (title) {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = (hash << 5) - hash + title.charCodeAt(i);
      hash |= 0;
    }
    index = Math.abs(hash) % pool.length;
  }
  return pool[index];
}

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
  // 1. If valid Unsplash photo, upgrade to 1280w HD
  if (url && typeof url === "string" && url.includes("images.unsplash.com")) {
    return url.replace(/w=\d+/g, "w=1280");
  }

  // 2. If valid external photo (not a publisher hotlink, not local /api/og)
  if (url && typeof url === "string" && url.startsWith("http") && !isPublisherHotlink(url)) {
    return url;
  }

  // 3. Fallback: Always return topic-matched, high-definition Unsplash photography
  return getCategoryCuratedPhoto(category, title);
}

export function getPollinationsFallback(title: string, category: string, seed: number = 100): string {
  return getCategoryCuratedPhoto(category, title, seed);
}
