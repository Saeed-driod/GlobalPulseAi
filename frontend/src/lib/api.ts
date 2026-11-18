import { Article, AdminStats, ArticleListResponse, ActionResponse, VideoProgressInfo, WorkerStatusInfo, AnalyticsSummary } from "../types/article";


export function getApiBase(): string {
  // Client-side browser inspection: ALWAYS use relative path "" so Vercel Serverless API routes handle data!
  // This guarantees the public portal NEVER depends on Render and NEVER suffers from CORS or suspension!
  if (typeof window !== "undefined") {
    return "";
  }

  // Server-side development
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  // Production SSR calls internal Next.js domain
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "https://globalpulseai.vercel.app"
  ).replace(/\/+$/, "");
}

export function getBackendUrl(): string {
  // Client-side browser: Use relative proxy path to completely prevent HTTPS Mixed Content & CORS blocks!
  if (typeof window !== "undefined") {
    return "/backend-api";
  }
  const envUrl = process.env.BACKEND_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return "http://150.136.214.192";
}

export const API_BASE = getApiBase();

export const FALLBACK_ARTICLES: Article[] = [];

// Direct Neon Cloud PostgreSQL HTTP SQL fallback endpoint
// Ensures the public website never goes down even if the Render backend sleeps or suspends!
const NEON_CONNECTION_STRING = process.env.DATABASE_URL || "";

async function queryNeonDirect<T = any>(query: string, params: any[] = []): Promise<T[]> {
  if (!NEON_CONNECTION_STRING) {
    return [];
  }
  try {
    let endpoint = "https://ep-bold-feather-b4sildv7-pooler.c-6.us-east-2.aws.neon.tech/sql";
    const hostMatch = NEON_CONNECTION_STRING.match(/@([^/:]+)/);
    if (hostMatch && hostMatch[1]) {
      endpoint = `https://${hostMatch[1]}/sql`;
    }
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Neon-Connection-String": NEON_CONNECTION_STRING,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, params }),
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      console.warn("Neon HTTP SQL returned status", res.status);
      return [];
    }
    const data = await res.json();
    return (data.rows || []) as T[];
  } catch (err) {
    console.error("Direct Neon query error:", err);
    return [];
  }
}

export async function fetchArticles(params?: {
  status?: string;
  category?: string;
  search?: string;
  skip?: number;
  limit?: number;
  revalidate?: number;
  admin?: boolean;
}): Promise<ArticleListResponse> {
  const isAdmin = !!params?.admin;
  const statusToUse = params?.status || (isAdmin ? "ALL" : undefined);
  const secret = isAdmin ? getAdminSecret() : "";

  try {
    const searchParams = new URLSearchParams();
    if (statusToUse) searchParams.set("status", statusToUse);
    if (params?.category && params.category !== "All" && params.category !== "ALL") {
      searchParams.set("category", params.category);
    }
    if (params?.search) searchParams.set("search", params.search);
    if (params?.skip !== undefined) searchParams.set("skip", params.skip.toString());
    if (params?.limit !== undefined) searchParams.set("limit", params.limit.toString());

    const headers: Record<string, string> = {};
    if (secret) {
      headers["X-Admin-Secret"] = secret;
    }

    const fetchOptions: RequestInit = {
      ...(typeof window === "undefined" && params?.revalidate !== undefined
        ? { next: { revalidate: params.revalidate } }
        : { cache: "no-store" }),
      headers,
    };

    const res = await fetch(`${getApiBase()}/api/articles?${searchParams.toString()}`, fetchOptions);

    if (!res.ok) {
      throw new Error(`API returned status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn("Backend API not reachable, querying Neon Cloud PostgreSQL directly:", err);
    try {
      const conditions: string[] = [];
      const values: any[] = [];
      let pIdx = 1;

      // Public callers always get 'PUBLISHED' only; admin callers can query ALL or specific status
      if (!isAdmin) {
        conditions.push(`status = $${pIdx++}`);
        values.push("PUBLISHED");
      } else if (statusToUse && statusToUse.toUpperCase() !== "ALL") {
        conditions.push(`status = $${pIdx++}`);
        values.push(statusToUse.toUpperCase());
      }

      if (params?.category && params.category !== "All" && params.category !== "ALL") {
        conditions.push(`category = $${pIdx++}`);
        values.push(params.category);
      }

      if (params?.search && params.search.trim()) {
        const escaped = params.search.trim().replace(/([%_\\])/g, "\\$1");
        conditions.push(`(title ILIKE $${pIdx} ESCAPE '\\' OR summary ILIKE $${pIdx} ESCAPE '\\')`);
        values.push(`%${escaped}%`);
        pIdx++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const rawLimit = Number(params?.limit);
      const limit = isNaN(rawLimit) ? 20 : Math.max(1, Math.min(100, Math.floor(rawLimit)));
      const rawSkip = Number(params?.skip);
      const skip = isNaN(rawSkip) ? 0 : Math.max(0, Math.min(100000, Math.floor(rawSkip)));

      const countSql = `SELECT count(*)::int as total FROM articles ${whereClause};`;
      const countRows = await queryNeonDirect<{ total: number }>(countSql, values);
      const total = countRows[0]?.total || 0;

      const fetchValues = [...values, limit, skip];
      const fetchSql = `SELECT * FROM articles ${whereClause} ORDER BY id DESC LIMIT $${pIdx++} OFFSET $${pIdx++};`;
      const items = await queryNeonDirect<Article>(fetchSql, fetchValues);

      if (items.length > 0) {
        return {
          items,
          total,
          page: Math.floor(skip / limit) + 1,
          limit,
        };
      }
    } catch (neonErr) {
      console.error("Neon fallback query failed:", neonErr);
    }

    // Fallback to Render backend API
    try {
      const searchParams = new URLSearchParams();
      if (statusToUse) searchParams.set("status", statusToUse);
      if (params?.category && params.category !== "All" && params.category !== "ALL") {
        searchParams.set("category", params.category);
      }
      if (params?.search) searchParams.set("search", params.search);
      if (params?.skip !== undefined) searchParams.set("skip", params.skip.toString());
      if (params?.limit !== undefined) searchParams.set("limit", params.limit.toString());

      const headers: Record<string, string> = {};
      if (secret) {
        headers["X-Admin-Secret"] = secret;
      }

      const fetchOptions: RequestInit = {
        ...(typeof window === "undefined" && params?.revalidate !== undefined
          ? { next: { revalidate: params.revalidate } }
          : { cache: "no-store" }),
        headers,
      };

      const bRes = await fetch(`${getBackendUrl()}/api/articles?${searchParams.toString()}`, fetchOptions);
      if (bRes.ok) {
        return await bRes.json();
      }
    } catch (bErr) {
      console.warn("Backend API fallback fetch failed:", bErr);
    }

    let filtered = [...FALLBACK_ARTICLES];
    if (statusToUse && statusToUse.toUpperCase() !== "ALL") {
      filtered = filtered.filter((a) => a.status === statusToUse.toUpperCase());
    } else if (!isAdmin) {
      filtered = filtered.filter((a) => a.status === "PUBLISHED");
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
    const rawLimit = Number(params?.limit);
    const limit = isNaN(rawLimit) ? 20 : Math.max(1, Math.min(100, Math.floor(rawLimit)));
    return {
      items: filtered,
      total: filtered.length,
      page: 1,
      limit,
    };
  }
}

export async function fetchArticleBySlug(
  slug: string,
  options?: { revalidate?: number; admin?: boolean }
): Promise<Article | null> {
  const isAdmin = !!options?.admin;
  const secret = isAdmin ? getAdminSecret() : "";
  const headers: Record<string, string> = {};
  if (secret) {
    headers["X-Admin-Secret"] = secret;
  }

  const fetchOptions: RequestInit = {
    ...(typeof window === "undefined" && options?.revalidate !== undefined
      ? { next: { revalidate: options.revalidate } }
      : { cache: "no-store" }),
    headers,
  };

  try {
    const res = await fetch(`${getApiBase()}/api/articles/${encodeURIComponent(slug)}`, fetchOptions);
    if (res.ok) {
      const article = await res.json();
      if (!isAdmin && article && article.status !== "PUBLISHED") {
        return null;
      }
      return article;
    }
  } catch (err) {
    console.warn("Could not fetch article by slug from API, querying Neon:", err);
  }

  // Direct Neon PostgreSQL fallback (parameterized query)
  try {
    let sql = "SELECT * FROM articles WHERE slug = $1";
    const params: any[] = [slug];
    if (!isAdmin) {
      sql += " AND status = $2";
      params.push("PUBLISHED");
    }
    sql += " LIMIT 1;";

    const rows = await queryNeonDirect<Article>(sql, params);
    if (rows && rows.length > 0) {
      // Views increment removed - views are counted only by the analytics tracker
      return rows[0];
    }
  } catch (neonErr) {
    console.error("Neon slug lookup failed:", neonErr);
  }

  // Fallback to Render backend API
  try {
    const backendRes = await fetch(`${getBackendUrl()}/api/articles/${encodeURIComponent(slug)}`, fetchOptions);
    if (backendRes.ok) {
      const article = await backendRes.json();
      if (!isAdmin && article && article.status !== "PUBLISHED") {
        return null;
      }
      return article;
    }
  } catch (bErr) {
    console.warn("Backend API article lookup fallback failed:", bErr);
  }

  // Fallback match
  const found = FALLBACK_ARTICLES.find((a) => a.slug === slug);
  if (found) {
    if (!isAdmin && found.status !== "PUBLISHED") {
      return null;
    }
    return found;
  }
  return null;
}

export async function fetchAdminStats(options?: { admin?: boolean }): Promise<AdminStats> {
  const secret = getAdminSecret();
  const headers: Record<string, string> = {};
  if (secret) {
    headers["X-Admin-Secret"] = secret;
  }

  try {
    const res = await fetch(`${getApiBase()}/api/articles/stats`, {
      cache: "no-store",
      headers,
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Admin stats API unavailable, trying backend:", err);
  }

  try {
    const res = await fetch(`${getBackendUrl()}/api/articles/stats`, {
      cache: "no-store",
      headers,
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend admin stats API unavailable, computing from Neon:", err);
  }

  try {
    const rows = await queryNeonDirect<{
      total_articles: number;
      drafts_count: number;
      video_ready_count: number;
      published_count: number;
      total_views: number;
    }>(`
      SELECT 
        count(*)::int as total_articles,
        count(*) FILTER (WHERE status = 'DRAFT')::int as drafts_count,
        count(*) FILTER (WHERE status = 'VIDEO_READY')::int as video_ready_count,
        count(*) FILTER (WHERE status = 'PUBLISHED')::int as published_count,
        coalesce(sum(views), 0)::int as total_views
      FROM articles;
    `);
    if (rows && rows.length > 0) {
      return rows[0];
    }
  } catch (neonErr) {
    console.error("Neon admin stats query failed:", neonErr);
  }

  // Real zeros fallback - no made-up numbers
  return {
    total_articles: 0,
    drafts_count: 0,
    video_ready_count: 0,
    published_count: 0,
    total_views: 0,
  };
}

export function getAdminSecret(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("gp_admin_key") || localStorage.getItem("gp_admin_secret") || "";
  }
  return "";
}

export function setAdminSecret(key: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("gp_admin_key", key);
    localStorage.setItem("gp_admin_secret", key);
  }
}

export function clearAdminSecret(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("gp_admin_key");
    localStorage.removeItem("gp_admin_secret");
  }
}

export async function verifyAdminSecret(key: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/admin/verify`, {
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
    return { success: false, message: "Authentication service offline." };
  }
}

export async function triggerFetchNow(category?: string): Promise<ActionResponse> {
  try {
    const url = new URL(`${getBackendUrl()}/api/articles/fetch-now`);
    if (category && category !== "ALL") {
      url.searchParams.set("category", category);
    }
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "X-Admin-Secret": getAdminSecret(),
      },
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({}));
    return {
      success: false,
      message: err.detail || `Server returned error (${res.status})`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Failed to contact backend API. Check your internet or server status.",
    };
  }
}

export async function generateVideo(
  articleId: number,
  format: "long" | "short" = "long"
): Promise<ActionResponse> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/articles/${articleId}/generate-video?format=${format}`, {
      method: "POST",
      headers: {
        "X-Admin-Secret": getAdminSecret(),
      },
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({}));
    return {
      success: false,
      message: err.detail || `Video generation failed (${res.status})`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Network error while generating video.",
    };
  }
}

export async function queueVideo(
  articleId: number,
  format: "long" | "short" = "short"
): Promise<ActionResponse> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/articles/${articleId}/queue-video?format=${format}`, {
      method: "POST",
      headers: {
        "X-Admin-Secret": getAdminSecret(),
      },
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({}));
    return {
      success: false,
      message: err.detail || `Failed to queue video (${res.status})`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Network error while queueing video.",
    };
  }
}

export async function fetchVideoProgress(articleId: number): Promise<VideoProgressInfo | null> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/video-progress/${articleId}`, {
      cache: "no-store",
    });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchWorkerStatus(): Promise<WorkerStatusInfo> {
  const secret = getAdminSecret();
  const headers: Record<string, string> = {};
  if (secret) {
    headers["X-Admin-Secret"] = secret;
  }
  try {
    const res = await fetch(`${getBackendUrl()}/api/worker/status`, {
      cache: "no-store",
      headers,
    });
    if (res.ok) {
      return await res.json();
    }
    return {
      online: false,
      worker_name: "LOCAL_PC_WORKER",
      status: "OFFLINE",
      channel_name: "@GlobalPulseAI",
      total_completed: 0,
    };
  } catch {
    return {
      online: false,
      worker_name: "LOCAL_PC_WORKER",
      status: "OFFLINE",
      channel_name: "@GlobalPulseAI",
      total_completed: 0,
    };
  }
}

export async function fetchActiveVideoJobs(): Promise<{
  active_jobs: VideoProgressInfo[];
  recent_completed: VideoProgressInfo[];
}> {
  const secret = getAdminSecret();
  const headers: Record<string, string> = {};
  if (secret) {
    headers["X-Admin-Secret"] = secret;
  }
  try {
    const res = await fetch(`${getBackendUrl()}/api/worker/active-jobs`, {
      cache: "no-store",
      headers,
    });
    if (res.ok) {
      return await res.json();
    }
    return { active_jobs: [], recent_completed: [] };
  } catch {
    return { active_jobs: [], recent_completed: [] };
  }
}

export async function publishArticle(
  articleId: number,
  format: "long" | "short" = "long"
): Promise<ActionResponse> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/articles/${articleId}/publish?format=${format}`, {
      method: "POST",
      headers: {
        "X-Admin-Secret": getAdminSecret(),
      },
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({}));
    return {
      success: false,
      message: err.detail || `Publish failed (${res.status})`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Network error while publishing article.",
    };
  }
}

export async function autoPublishArticle(
  articleId: number,
  format: "long" | "short" = "long"
): Promise<ActionResponse> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/articles/${articleId}/auto-publish?format=${format}`, {
      method: "POST",
      headers: {
        "X-Admin-Secret": getAdminSecret(),
      },
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({}));
    return {
      success: false,
      message: err.detail || `Auto-publish failed (${res.status})`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Network error while running auto-publish.",
    };
  }
}

export async function publishInstantArticle(
  articleId: number
): Promise<ActionResponse> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/articles/${articleId}/publish-instant`, {
      method: "POST",
      headers: {
        "X-Admin-Secret": getAdminSecret(),
      },
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({}));
    return {
      success: false,
      message: err.detail || `Instant publish failed (${res.status})`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Network error while publishing article instantly.",
    };
  }
}

export async function getLastError(): Promise<any> {
  const secret = getAdminSecret();
  const headers: Record<string, string> = {};
  if (secret) {
    headers["X-Admin-Secret"] = secret;
  }
  try {
    const res = await fetch(`${getBackendUrl()}/api/debug/last-error`, {
      headers,
    });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch {
    return null;
  }
}

export async function checkOrAuthorizeYouTube(): Promise<{
  success: boolean;
  authenticated: boolean;
  message: string;
  channel_title?: string;
  token_file?: string;
}> {
  const secret = getAdminSecret();
  const headers: Record<string, string> = {};
  if (secret) {
    headers["X-Admin-Secret"] = secret;
  }
  try {
    const res = await fetch(`${getBackendUrl()}/api/auth-youtube/status`, {
      headers,
    });
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
    const res = await fetch(`${getBackendUrl()}/api/pipeline/run?limit=${limit}&format=${format}`, {
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
  const secret = getAdminSecret();
  const headers: Record<string, string> = {};
  if (secret) {
    headers["X-Admin-Secret"] = secret;
  }
  try {
    const res = await fetch(`${getBackendUrl()}/api/scheduler/status`, {
      headers,
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("Failed to fetch scheduler status:", err);
  }
  return null;
}

export async function fetchAnalyticsSummary(options?: { admin?: boolean }): Promise<AnalyticsSummary | null> {
  const secret = getAdminSecret();
  const headers: Record<string, string> = {};
  if (secret) {
    headers["X-Admin-Secret"] = secret;
  }

  try {
    const res = await fetch(`${getApiBase()}/api/analytics/summary`, {
      cache: "no-store",
      headers,
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("Failed to fetch real analytics summary:", err);
  }

  try {
    const res = await fetch(`${getBackendUrl()}/api/analytics/summary`, {
      cache: "no-store",
      headers,
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend analytics summary fallback failed:", err);
  }
  return null;
}

export type AdsMode = "full" | "review" | "off";

export interface AdSettings {
  master_enabled: boolean;
  ads_mode?: AdsMode;
  monetag_global_script?: string;
  direct_link_url?: string;
  adsterra_header_banner?: string;
  adsterra_infeed_banner?: string;
  adsterra_sidebar_banner?: string;
  updated_at?: string;
}

let cachedAdSettings: AdSettings | null = null;
let cachedAdSettingsTime = 0;
let inFlightAdSettingsPromise: Promise<AdSettings> | null = null;
const AD_SETTINGS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function clearAdSettingsCache(): void {
  cachedAdSettings = null;
  cachedAdSettingsTime = 0;
  inFlightAdSettingsPromise = null;
}

export async function fetchAdSettings(forceRefresh = false): Promise<AdSettings> {
  const now = Date.now();
  if (!forceRefresh && cachedAdSettings && now - cachedAdSettingsTime < AD_SETTINGS_CACHE_TTL_MS) {
    return cachedAdSettings;
  }
  if (!forceRefresh && inFlightAdSettingsPromise) {
    return inFlightAdSettingsPromise;
  }

  inFlightAdSettingsPromise = (async () => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/settings/ads`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        cachedAdSettings = data;
        cachedAdSettingsTime = Date.now();
        return data;
      }
    } catch (err) {
      console.warn("Failed to fetch ad settings from backend, using default fallback:", err);
    } finally {
      inFlightAdSettingsPromise = null;
    }

    const fallback: AdSettings = {
      master_enabled: true,
      ads_mode: "review",
      monetag_global_script: "",
      direct_link_url: "",
      adsterra_header_banner: "",
      adsterra_infeed_banner: "",
      adsterra_sidebar_banner: "",
    };
    cachedAdSettings = fallback;
    cachedAdSettingsTime = Date.now();
    return fallback;
  })();

  return inFlightAdSettingsPromise;
}

export async function updateAdSettings(payload: Partial<AdSettings>): Promise<{ success: boolean; data?: AdSettings; message?: string }> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/settings/ads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Secret": getAdminSecret(),
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      cachedAdSettings = data;
      cachedAdSettingsTime = Date.now();
      return { success: true, data };
    }
    const err = await res.json().catch(() => ({}));
    return { success: false, message: err.detail || "Failed to save ad settings." };
  } catch (err: any) {
    return { success: false, message: err?.message || "Network error while saving ad settings." };
  }
}




