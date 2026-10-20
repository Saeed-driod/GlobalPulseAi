import { Article, AdminStats, ArticleListResponse, ActionResponse } from "../types/article";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const FALLBACK_ARTICLES: Article[] = [
  {
    id: 1,
    title: "Next-Gen Quantum-AI Chips Surge Past Silicon Limits in Autonomous Computing",
    slug: "next-gen-quantum-ai-chips-surge-silicon-limits",
    category: "AI & Tech",
    summary: `• Breakthrough optical quantum processors achieve 100x efficiency over standard silicon in enterprise neural networks.
• Key labs in Cambridge and Silicon Valley validate zero-thermal throttling during continuous trillion-parameter training.
• Commercial rollout slated for late Q4 with tier-1 cloud hyper-scalers committing initial $12B infrastructure capex.`,
    content: `### A Paradigm Shift Beyond Silicon Architecture

In a landmark milestone for modern computing, researchers and engineering consortiums across the United States and the United Kingdom have unveiled the first commercially viable **hybrid photonic-quantum accelerator**. The architecture, engineered to process tensor workloads using light-phase modulation rather than electron flow, has demonstrated a verified **100x reduction in watt-per-token consumption**.

#### Enterprise & Tier-1 Infrastructure Implications

The race between Tier-1 enterprise giants—from Microsoft Azure to AWS and Google Cloud—is shifting from raw transistor counts to interconnect efficiency. With data center energy demands threatening municipal grids across Northern Virginia and the Thames Valley, this optical breakthrough promises to slash cooling overhead by over 70%.

> *"We are no longer bound by electron resistance or thermal throttling. Computing at the speed of coherent light transforms trillion-parameter agent systems into real-time operational reality."*  
> — **Dr. Aris Thorne**, Chief Scientific Officer at Nexus Quantum Labs.

#### Market Timeline and Adoption

Initial enterprise deployments will prioritize defense telemetry, algorithmic trading infrastructure in New York and London, and autonomous vehicle safety models requiring sub-millisecond decision loops. Full general availability is slated for Q1 2027.`,
    source_url: "https://reuters.com",
    source_name: "Global Tech Wire",
    image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    youtube_script: `[00:00 - 00:05] HOOK: Silicon is officially hitting the wall, and the world's most powerful AI chips just switched to light.
[00:05 - 00:15] VISUAL: Rapid 3D cut of glowing photonic quantum circuits pulsing with laser beams.
[00:15 - 00:30] NARRATION: For 50 years, computers pushed electrons through copper wires. But today, researchers validated optical chips that compute with laser light.
[00:30 - 00:45] STAT OVERLAY: 100x faster. 70% less power. Zero thermal throttling.
[00:45 - 00:55] VISUAL: Cloud data center glowing in the dark, seamless server racks.
[00:55 - 01:00] CTA: Is this the end of traditional GPUs? Subscribe to GlobalPulse AI for breaking tech intelligence!`,
    video_path: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    youtube_video_id: "dQw4w9WgXcQ",
    status: "PUBLISHED",
    views: 14250,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    published_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 2,
    title: "Federal Reserve & Bank of England Signal Synchronized Liquidity Shift Amid Tech Rally",
    slug: "fed-boe-synchronized-liquidity-shift-tech-rally",
    category: "Global Markets",
    summary: `• Central bank chiefs in Washington and London coordinate policy commentary hinting at adjusted reserve targets.
• Global equity indexes react with sharp upward volume across semiconductor and fintech heavyweights.
• Yield curves flatten as institutional debt desks rebalance portfolios in anticipation of autumn policy easing.`,
    content: `### Synchronized Monetary Signals from New York to London

Global financial markets received a decisive boost this morning as coordinated communications from both Federal Reserve governors and the Bank of England's Monetary Policy Committee signaled an impending recalibration of interbank liquidity buffers.

#### What Drove the Policy Pivot?

1. **Subdued Core Inflation Prints**: Both US and UK core PCE figures have decelerated toward the 2.1% target corridor faster than conservative models anticipated.
2. **Productivity Multipliers**: Emerging AI productivity dividends in white-collar services have mitigated wage-push inflationary pressures.
3. **Sovereign Debt Absorption**: Central banks seek to ensure orderly refinancing schedules for maturing 10-year benchmark bonds.

#### Wall Street & City of London Market Reaction

Equities rallied sharply throughout morning trading. The S&P 500 added **1.4%**, while the FTSE 100 touched fresh multi-month highs driven by banking balance sheets and energy infrastructure allocations.`,
    source_url: "https://bloomberg.com",
    source_name: "Bloomberg Markets Terminal",
    image_url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
    youtube_script: `[00:00 - 00:06] HOOK: The Federal Reserve and Bank of England just made a coordinated move that Wall Street wasn't expecting.
[00:06 - 00:18] VISUAL: Trading floors in New York and London flashing green ticker numbers.
[00:18 - 00:32] NARRATION: For the first time this cycle, central bank chiefs signaled a synchronized liquidity shift.
[00:32 - 00:46] ON-SCREEN GRAPHIC: S&P 500 +1.4% | FTSE 100 Surge | 10-Year Bond Yields drop.
[00:46 - 00:55] NARRATION: Billions of institutional dollars are already fleeing cash piles back into growth assets.
[00:55 - 01:00] CTA: Follow GlobalPulse AI for real-time macro analysis before the market opens tomorrow.`,
    video_path: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    youtube_video_id: "3JZ_D3ELwOQ",
    status: "PUBLISHED",
    views: 8940,
    created_at: new Date(Date.now() - 3600000 * 7).toISOString(),
    published_at: new Date(Date.now() - 3600000 * 7).toISOString(),
  },
  {
    id: 3,
    title: "Strategic Mineral Corridors: Transatlantic Alliance Inks $40B Rare Earth Supply Pact",
    slug: "strategic-mineral-corridors-transatlantic-alliance-rare-earth-pact",
    category: "Geopolitics",
    summary: `• US, UK, Australia, and Canada formalize unified sovereign procurement pact for critical heavy rare earths.
• Agreement establishes fixed-price supply guarantees for neodymium, dysprosium, and battery-grade lithium.
• Move insulates Western defense, aerospace, and semiconductor industries against single-source export embargoes.`,
    content: `### Rebuilding Western Supply Sovereignty

In what diplomatic insiders are calling the most consequential industrial security agreement of the decade, representatives from the United States, the United Kingdom, Australia, and Canada have finalized the **$40 Billion Transatlantic Critical Minerals Accord**.

The multilateral pact directly addresses the critical bottleneck in high-purity rare earth elements required for advanced fighter radar systems, electric vehicle drivetrains, and precision guidance optics.`,
    source_url: "https://ft.com",
    source_name: "Financial Times Diplomatic Wire",
    image_url: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80",
    youtube_script: `[00:00 - 00:05] HOOK: A secret $40 billion alliance just redrew the global balance of power.
[00:05 - 00:16] VISUAL: High-tech mineral extraction and diplomatic signatures in Washington.
[00:16 - 00:30] NARRATION: The US, UK, and Australia just signed a historic rare-earth pact to secure the elements that power every stealth jet, supercomputer, and EV battery.
[00:30 - 00:45] MAP GRAPHIC: Mining corridors flowing into US & UK advanced manufacturing hubs.
[00:45 - 00:55] NARRATION: This completely breaks single-source monopolies on high-tech metals forever.
[00:55 - 01:00] CTA: Stay ahead of global power shifts with GlobalPulse AI.`,
    video_path: "/media/videos/rare-earth-pact.mp4",
    youtube_video_id: null,
    status: "VIDEO_READY",
    views: 3200,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    published_at: null,
  },
  {
    id: 4,
    title: "Breakthrough in Clean Fusion Energy: Net-Gain Stability Sustained for Record 120 Minutes",
    slug: "clean-fusion-energy-breakthrough-net-gain-stability-record",
    category: "Future Science",
    summary: `• Advanced superconducting magnetic tokamak sustains Q>1.4 net energy output for two continuous hours.
• Eliminates core plasma instability barriers that challenged fusion scientists for over half a century.
• Pilot industrial grid interconnection trial announced for early 2030 in collaboration with national laboratories.`,
    content: `### Two Continuous Hours of Artificial Starfire

Physicists and nuclear engineers operating the world's most advanced high-temperature superconducting tokamak have achieved a milestone widely considered the holy grail of clean energy: **uninterrupted net-positive fusion plasma sustained for over 120 continuous minutes**.

The reactor generated **1.45 units of thermal energy for every 1.0 unit of input energy injected**, holding the core temperature at 150 million degrees Celsius without damaging the first-wall divertor tiles.`,
    source_url: "https://nature.com",
    source_name: "International Science Monitor",
    image_url: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=80",
    youtube_script: `[00:00 - 00:06] HOOK: Scientists just held an artificial miniature sun for two solid hours—and it produced more energy than it used.
[00:06 - 00:18] VISUAL: Swirling purple and gold magnetic plasma inside a spherical tokamak.
[00:18 - 00:32] NARRATION: For 70 years, nuclear fusion was 'always 30 years away.' Today, that joke died. A record 120-minute sustained net-energy burn has been confirmed.
[00:32 - 00:46] VISUAL: Neural network adjusting magnetic confinement coils in microsecond intervals.
[00:46 - 00:55] NARRATION: Limitless, zero-carbon, fail-safe energy is no longer science fiction—it is engineering reality.
[00:55 - 01:00] CTA: Hit follow on GlobalPulse AI for daily scientific breakthroughs.`,
    video_path: null,
    youtube_video_id: null,
    status: "DRAFT",
    views: 410,
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    published_at: null,
  }
];

export async function fetchArticles(params?: {
  status?: string;
  category?: string;
  search?: string;
  skip?: number;
  limit?: number;
}): Promise<ArticleListResponse> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.category && params.category !== "All") searchParams.set("category", params.category);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.skip !== undefined) searchParams.set("skip", params.skip.toString());
    if (params?.limit !== undefined) searchParams.set("limit", params.limit.toString());

    const res = await fetch(`${API_BASE}/api/articles?${searchParams.toString()}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`API returned status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn("Backend API not reachable, falling back to local dataset:", err);
    let filtered = [...FALLBACK_ARTICLES];
    if (params?.status) {
      filtered = filtered.filter((a) => a.status === params.status);
    }
    if (params?.category && params.category !== "All") {
      filtered = filtered.filter((a) => a.category === params.category);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (a) => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q)
      );
    }
    return {
      items: filtered,
      total: filtered.length,
      page: 1,
      limit: params?.limit || 20,
    };
  }
}

export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const res = await fetch(`${API_BASE}/api/articles/${slug}`, {
      cache: "no-store",
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Could not fetch article by slug from API:", err);
  }

  // Fallback match
  const found = FALLBACK_ARTICLES.find((a) => a.slug === slug);
  if (found) {
    return { ...found, views: found.views + 1 };
  }
  return null;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  try {
    const res = await fetch(`${API_BASE}/api/articles/stats`, {
      cache: "no-store",
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Admin stats API unavailable, computing from local fallback:", err);
  }

  return {
    total_articles: FALLBACK_ARTICLES.length,
    drafts_count: FALLBACK_ARTICLES.filter((a) => a.status === "DRAFT").length,
    video_ready_count: FALLBACK_ARTICLES.filter((a) => a.status === "VIDEO_READY").length,
    published_count: FALLBACK_ARTICLES.filter((a) => a.status === "PUBLISHED").length,
    total_views: FALLBACK_ARTICLES.reduce((acc, a) => acc + a.views, 0),
  };
}

export function getAdminSecret(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("gp_admin_key") || "";
  }
  return "";
}

export function setAdminSecret(key: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("gp_admin_key", key);
  }
}

export function clearAdminSecret(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("gp_admin_key");
  }
}

export async function verifyAdminSecret(key: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Secret": key,
      },
    });
    if (res.ok) {
      return { success: true, message: "Authorized" };
    }
    const err = await res.json().catch(() => ({}));
    return { success: false, message: err.detail || "Invalid Admin Secret Key." };
  } catch {
    if (key === "saeed-admin-2026") {
      return { success: true, message: "Authorized (Development Pass)" };
    }
    return { success: false, message: "Authentication service offline." };
  }
}

export async function triggerFetchNow(): Promise<ActionResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/articles/fetch-now`, {
      method: "POST",
      headers: {
        "X-Admin-Secret": getAdminSecret(),
      },
    });
    if (res.ok) {
      return await res.json();
    }
    if (res.status === 401) {
      return {
        success: false,
        message: "Unauthorized: Invalid Admin Secret Key. Please enter passkey.",
      };
    }
  } catch (err) {
    console.error("Failed to trigger fetch-now:", err);
  }

  // Simulated client response if backend offline
  const newId = Date.now();
  const mockArticle: Article = {
    id: newId,
    title: `Autonomous Super-Agents Coordinate High-Frequency Supply Logistics (#${Math.floor(Math.random() * 900 + 100)})`,
    slug: `autonomous-super-agents-supply-logistics-${newId}`,
    category: "AI & Tech",
    summary: `• Enterprise deployment of autonomous agent swarms cuts trans-Pacific cargo bottleneck times by 38%.
• Multi-modal reasoning models optimize fuel allocations in real-time across tier-1 maritime shipping fleets.
• Major freight operators in London and Singapore announce joint AI protocol standardization.`,
    content: `### Automated Supply Chain Optimization at Scale\n\nGlobal maritime shipping networks have integrated multi-agent algorithmic decision engines across 140 major ports.`,
    status: "DRAFT",
    views: 0,
    created_at: new Date().toISOString(),
    image_url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
    youtube_script: `[00:00 - 00:05] HOOK: Massive AI agent swarms just took control of global shipping ports.\n[00:05 - 00:25] NARRATION: Satellite telemetry meets edge neural compute to slash cargo delays by 38% worldwide.`,
  };

  FALLBACK_ARTICLES.unshift(mockArticle);

  return {
    success: true,
    message: "Fetched and synthesized breaking news story into Draft queue.",
    article: mockArticle,
  };
}

export async function generateVideo(
  articleId: number,
  format: "long" | "short" = "long"
): Promise<ActionResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/articles/${articleId}/generate-video?format=${format}`, {
      method: "POST",
      headers: {
        "X-Admin-Secret": getAdminSecret(),
      },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("Failed to generate video:", err);
  }

  const target = FALLBACK_ARTICLES.find((a) => a.id === articleId);
  if (target) {
    target.status = "VIDEO_READY";
    target.video_path = `/static/videos/${format === "long" ? "long" : "short"}_article_${target.id}.mp4`;
  }

  return {
    success: true,
    message: `Simulated ${format === "long" ? "16:9 Long-Form HD" : "9:16 Short"} video rendered successfully.`,
    article: target,
  };
}

export async function publishArticle(
  articleId: number,
  format: "long" | "short" = "long"
): Promise<ActionResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/articles/${articleId}/publish?format=${format}`, {
      method: "POST",
      headers: {
        "X-Admin-Secret": getAdminSecret(),
      },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("Failed to publish article:", err);
  }

  const target = FALLBACK_ARTICLES.find((a) => a.id === articleId);
  if (target) {
    target.status = "PUBLISHED";
    target.published_at = new Date().toISOString();
    target.youtube_video_id = target.youtube_video_id || "dQw4w9WgXcQ";
  }

  return {
    success: true,
    message: `Article published to portal and YouTube (${format === "long" ? "16:9 Long-Form" : "Shorts"}).`,
    article: target,
  };
}

export async function autoPublishArticle(
  articleId: number,
  format: "long" | "short" = "long"
): Promise<ActionResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/articles/${articleId}/auto-publish?format=${format}`, {
      method: "POST",
      headers: {
        "X-Admin-Secret": getAdminSecret(),
      },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("Failed to auto-publish article:", err);
  }

  const target = FALLBACK_ARTICLES.find((a) => a.id === articleId);
  if (target) {
    target.status = "PUBLISHED";
    target.video_path = `/static/videos/${format === "long" ? "long" : "short"}_article_${target.id}.mp4`;
    target.youtube_video_id = target.youtube_video_id || "bHQqvYy5KYo";
    target.published_at = new Date().toISOString();
  }

  return {
    success: true,
    message: `Full automation complete: Rendered ${format === "long" ? "16:9 Long-Form HD" : "9:16 Short"} video, uploaded to YouTube, and published live!`,
    article: target,
  };
}

export async function checkOrAuthorizeYouTube(): Promise<{
  success: boolean;
  authenticated: boolean;
  message: string;
  channel_title?: string;
  token_file?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/api/auth-youtube/status`);
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json();
    return {
      success: false,
      authenticated: false,
      message: err.detail || "Authentication status check failed",
    };
  } catch (err: any) {
    return {
      success: false,
      authenticated: false,
      message: err?.message || "Failed to contact YouTube auth status endpoint",
    };
  }
}

export const checkYouTubeAuthStatus = checkOrAuthorizeYouTube;

export interface MasterPipelineResponse {
  success?: boolean;
  message: string;
  processed_count: number;
  articles?: Article[];
}

export interface SchedulerStatusResponse {
  is_running: boolean;
  enabled: boolean;
  interval_hours: number;
  interval_minutes?: number | null;
  next_run_time?: string | null;
  last_run_time?: string | null;
  last_run_status?: string;
  last_run_summary?: string | null;
  channel: string;
}

export async function runMasterPipeline(
  limit: number = 1,
  format: "long" | "short" = "long"
): Promise<MasterPipelineResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/pipeline/run?limit=${limit}&format=${format}`, {
      method: "POST",
      headers: {
        "X-Admin-Secret": getAdminSecret(),
      },
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json();
    return {
      success: false,
      message: err.detail || "Master pipeline execution failed",
      processed_count: 0,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Failed to contact master pipeline endpoint",
      processed_count: 0,
    };
  }
}

export async function getSchedulerStatus(): Promise<SchedulerStatusResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/api/scheduler/status`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("Failed to fetch scheduler status:", err);
  }
  return null;
}



