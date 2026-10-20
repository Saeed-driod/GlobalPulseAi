import { Article, AdminStats, ArticleListResponse, ActionResponse } from "../types/article";

export function getApiBase(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() && !envUrl.includes("localhost")) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("globlepluse") || host.includes("onrender.com")) {
      return "https://globlepluseai.onrender.com";
    }
  }
  return (envUrl || "http://localhost:8000").trim().replace(/\/+$/, "");
}

export const API_BASE = getApiBase();

export const FALLBACK_ARTICLES: Article[] = [];

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

    const res = await fetch(`${getApiBase()}/api/articles?${searchParams.toString()}`, {
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
    const res = await fetch(`${getApiBase()}/api/articles/${slug}`, {
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
    const res = await fetch(`${getApiBase()}/api/articles/stats`, {
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
    const res = await fetch(`${getApiBase()}/api/admin/verify`, {
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
    const res = await fetch(`${getApiBase()}/api/articles/fetch-now`, {
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
    const res = await fetch(`${getApiBase()}/api/articles/${articleId}/generate-video?format=${format}`, {
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

export async function publishArticle(
  articleId: number,
  format: "long" | "short" = "long"
): Promise<ActionResponse> {
  try {
    const res = await fetch(`${getApiBase()}/api/articles/${articleId}/publish?format=${format}`, {
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
    const res = await fetch(`${getApiBase()}/api/articles/${articleId}/auto-publish?format=${format}`, {
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
    const res = await fetch(`${getApiBase()}/api/articles/${articleId}/publish-instant`, {
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
  try {
    const res = await fetch(`${getApiBase()}/api/debug/last-error`);
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
  try {
    const res = await fetch(`${getApiBase()}/api/auth-youtube/status`);
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
    const res = await fetch(`${getApiBase()}/api/pipeline/run?limit=${limit}&format=${format}`, {
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
    const res = await fetch(`${getApiBase()}/api/scheduler/status`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("Failed to fetch scheduler status:", err);
  }
  return null;
}



