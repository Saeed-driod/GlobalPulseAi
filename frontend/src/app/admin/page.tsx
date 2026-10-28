"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Article, AdminStats, VideoProgressInfo, WorkerStatusInfo, AnalyticsSummary } from "../../types/article";
import {
  fetchArticles,
  fetchAdminStats,
  triggerFetchNow,
  generateVideo,
  queueVideo,
  fetchVideoProgress,
  fetchWorkerStatus,
  fetchActiveVideoJobs,
  fetchAnalyticsSummary,
  publishArticle,
  publishInstantArticle,
  autoPublishArticle,
  checkOrAuthorizeYouTube,
  checkYouTubeAuthStatus,
  runMasterPipeline,
  getSchedulerStatus,
  SchedulerStatusResponse,
  getAdminSecret,
  setAdminSecret,
  clearAdminSecret,
  verifyAdminSecret,
  API_BASE,
  getApiBase,
} from "../../lib/api";
import { AnalyticsModal } from "../../components/AnalyticsModal";

import {
  Sparkles,
  RefreshCw,
  Video,
  Play,
  CheckCircle2,
  Eye,
  BarChart3,
  Clock,
  ArrowLeft,
  ExternalLink,
  Zap,
  Youtube,
  Lock,
  Unlock,
  ShieldCheck,
  Trophy,
} from "../../components/Icons";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [passkeyInput, setPasskeyInput] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [verifyingKey, setVerifyingKey] = useState<boolean>(false);

  const [stats, setStats] = useState<AdminStats>({
    total_articles: 0,
    drafts_count: 0,
    video_ready_count: 0,
    published_count: 0,
    total_views: 0,
  });
  const [articles, setArticles] = useState<Article[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [fetchingNews, setFetchingNews] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [previewTab, setPreviewTab] = useState<"article" | "script" | "metadata">("article");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [authorizingYouTube, setAuthorizingYouTube] = useState<boolean>(false);
  const [runningPipeline, setRunningPipeline] = useState<boolean>(false);
  const [schedulerInfo, setSchedulerInfo] = useState<SchedulerStatusResponse | null>(null);
  const [ytAuthStatus, setYtAuthStatus] = useState<{ authenticated: boolean; channel?: string } | null>(null);
  const [videoFormatMode, setVideoFormatMode] = useState<"long" | "short">("short");

  // Real-time local worker & video progress states
  const [workerStatus, setWorkerStatus] = useState<WorkerStatusInfo | null>(null);
  const [activeJobs, setActiveJobs] = useState<VideoProgressInfo[]>([]);
  const [recentCompleted, setRecentCompleted] = useState<VideoProgressInfo[]>([]);

  // Audience Analytics State
  const [showAnalyticsModal, setShowAnalyticsModal] = useState<boolean>(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSummary | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(false);

  const loadAnalytics = async () => {
    setLoadingAnalytics(true);
    const data = await fetchAnalyticsSummary();
    if (data) {
      setAnalyticsData(data);
    }
    setLoadingAnalytics(false);
  };

  const handleAuthYouTube = () => {
    showToast("Opening YouTube Channel Authorization Guide...");
    window.open(`${getApiBase()}/api/auth-youtube`, "_blank");
  };

  const handleRunMasterPipeline = async () => {
    setRunningPipeline(true);
    showToast(`Starting Master Automation: Fetching RSS -> Gemini AI -> ${videoFormatMode === "long" ? "16:9 Widescreen HD" : "9:16 Shorts"} Rendering -> YouTube Upload...`);
    try {
      const res = await runMasterPipeline(1, videoFormatMode);
      if (res.success) {
        showToast(res.message);
        await loadDashboardData();
      } else {
        showToast(res.message || "Master pipeline encountered an error.");
      }
    } catch {
      showToast("Error executing master pipeline.");
    } finally {
      setRunningPipeline(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadDashboardData = async () => {
    const s = await fetchAdminStats();
    setStats(s);
    const list = await fetchArticles({ limit: 50 });
    setArticles(list.items);
    const sched = await getSchedulerStatus();
    if (sched) {
      setSchedulerInfo(sched);
    }
    const yt = await checkYouTubeAuthStatus();
    if (yt) {
      setYtAuthStatus(yt);
    }
    try {
      const [w, j] = await Promise.all([fetchWorkerStatus(), fetchActiveVideoJobs()]);
      setWorkerStatus(w);
      setActiveJobs(j.active_jobs || []);
      setRecentCompleted(j.recent_completed || []);
    } catch {
      // quiet
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const storedKey = getAdminSecret();
      if (storedKey) {
        const res = await verifyAdminSecret(storedKey);
        if (res.success) {
          setIsAuthenticated(true);
          await loadDashboardData();
        } else {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setAuthChecking(false);
    };

    checkAuth();

    if (typeof window !== "undefined" && window.location.search.includes("youtube=connected")) {
      showToast("YouTube Channel GloblePulseAi successfully connected!");
    }
  }, []);

  // Real-time polling: Every 2.5 seconds, checks worker status and video render progress
  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;

    const pollWorkerAndJobs = async () => {
      try {
        const [wStatus, jobsData] = await Promise.all([
          fetchWorkerStatus(),
          fetchActiveVideoJobs(),
        ]);
        if (!isMounted) return;
        setWorkerStatus(wStatus);
        setActiveJobs(jobsData.active_jobs || []);
        setRecentCompleted(jobsData.recent_completed || []);

        if (jobsData.active_jobs && jobsData.active_jobs.length > 0) {
          const list = await fetchArticles({ limit: 50 });
          if (isMounted) setArticles(list.items);
        }
      } catch {
        // quiet
      }
    };

    pollWorkerAndJobs();
    const interval = setInterval(pollWorkerAndJobs, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated]);


  const handlePasskeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkeyInput.trim()) return;
    setVerifyingKey(true);
    setAuthError(null);
    const res = await verifyAdminSecret(passkeyInput.trim());
    setVerifyingKey(false);
    if (res.success) {
      setAdminSecret(passkeyInput.trim());
      setIsAuthenticated(true);
      showToast("Access Granted. Welcome to GlobalPulse AI Mission Control.");
      await loadDashboardData();
    } else {
      setAuthError(res.message || "Invalid passkey. Access denied.");
    }
  };

  const handleLogout = () => {
    clearAdminSecret();
    setIsAuthenticated(false);
    setPasskeyInput("");
    showToast("Dashboard locked. Session terminated.");
  };

  const handleFetchNow = async () => {
    setFetchingNews(true);
    const cat = filterCategory !== "ALL" ? filterCategory : undefined;
    const res = await triggerFetchNow(cat);
    setFetchingNews(false);
    if (res.success) {
      showToast(res.message);
      await loadDashboardData();
    }
  };

  const handleGenerateVideo = async (id: number) => {
    setActionLoadingId(id);
    const res = await generateVideo(id, videoFormatMode);
    setActionLoadingId(null);
    if (res.success) {
      showToast(res.message);
      await loadDashboardData();
      if (selectedArticle?.id === id && res.article) {
        setSelectedArticle(res.article);
      }
    } else {
      showToast(res.message || "Failed to generate video.");
    }
  };

  const handleQueueVideo = async (id: number) => {
    setActionLoadingId(id);
    showToast(`Queuing Article #${id} for ${videoFormatMode === "long" ? "16:9 HD" : "9:16 Shorts"} rendering & YouTube upload...`);
    // Optimistic UI update
    setArticles((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              video_status: "QUEUED",
              video_progress: 5,
              video_stage_text: "Queued for processing. Local Worker starting...",
              video_eta: "~50s remaining",
            }
          : a
      )
    );
    try {
      const res = await queueVideo(id, videoFormatMode);
      if (res.success) {
        showToast(res.message);
        const j = await fetchActiveVideoJobs();
        setActiveJobs(j.active_jobs || []);
      } else {
        showToast(res.message || "Failed to queue video.");
      }
    } catch {
      showToast("Error communicating with queue endpoint.");
    } finally {
      setActionLoadingId(null);
    }
  };


  const handlePublish = async (id: number) => {
    setActionLoadingId(id);
    const res = await publishArticle(id, videoFormatMode);
    setActionLoadingId(null);
    if (res.success) {
      showToast(res.message);
      await loadDashboardData();
      if (selectedArticle?.id === id && res.article) {
        setSelectedArticle(res.article);
      }
    } else {
      showToast(res.message || "Failed to publish article.");
    }
  };

  const handleInstantPublish = async (id: number) => {
    setActionLoadingId(id);
    const res = await publishInstantArticle(id);
    setActionLoadingId(null);
    if (res.success) {
      showToast(res.message);
      // Optimistically update article status to PUBLISHED immediately
      setArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "PUBLISHED" } : a))
      );
      await loadDashboardData();
      if (selectedArticle?.id === id && res.article) {
        setSelectedArticle(res.article);
      }
    } else {
      showToast(res.message || "Failed to publish article instantly.");
    }
  };

  const handleAutoPublish = async (id: number) => {
    setActionLoadingId(id);
    const res = await autoPublishArticle(id, videoFormatMode);
    setActionLoadingId(null);
    if (res.success) {
      showToast(res.message);
      // Optimistically mark as PUBLISHED because backend now publishes article immediately!
      setArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "PUBLISHED" } : a))
      );
      await loadDashboardData();
      if (selectedArticle?.id === id && res.article) {
        setSelectedArticle(res.article);
      }
    } else {
      showToast(res.message || "Failed to run automated pipeline.");
    }
  };


  const filteredArticles = articles.filter((a) => {
    const matchesStatus = filterStatus === "ALL" || a.status === filterStatus;
    const matchesCategory =
      filterCategory === "ALL" ||
      a.category === filterCategory ||
      (filterCategory === "World Politics" && a.category === "Geopolitics") ||
      (filterCategory === "Geopolitics" && a.category === "World Politics");
    return matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            DRAFT PENDING
          </span>
        );
      case "VIDEO_READY":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.3)] animate-pulse font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            VIDEO READY
          </span>
        );
      case "PUBLISHED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-400/40 shadow-[0_0_10px_rgba(16,185,129,0.25)] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            PUBLISHED LIVE
          </span>
        );
      default:
        return null;
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center font-mono">
        <Sparkles className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
        <p className="text-xs text-neutral-400 uppercase tracking-widest">
          Verifying Admin Security Clearance...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center items-center px-4 font-sans relative overflow-hidden">
        {/* Futuristic glowing backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-neutral-900/90 border border-neutral-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl shadow-cyan-950/20 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-cyan-500/30">
            <Lock className="w-6 h-6" />
          </div>

          <h2 className="text-2xl font-bold font-serif text-center text-white">
            Mission Control Authentication
          </h2>
          <p className="text-xs text-neutral-400 font-mono text-center mt-2">
            GlobalPulse AI Restricted Operational Surface
          </p>

          <form onSubmit={handlePasskeySubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-mono text-neutral-300 mb-1.5 uppercase tracking-wider">
                Admin Secret Key / Passkey
              </label>
              <input
                type="password"
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                placeholder="Enter master admin secret..."
                className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm font-mono focus:outline-none focus:border-cyan-400 transition placeholder:text-neutral-600"
                autoFocus
              />
              <p className="text-[11px] text-neutral-500 font-mono mt-1.5">
                Default Dev Key: <code className="text-cyan-400 font-semibold">saeed-admin-2026</code>
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={verifyingKey || !passkeyInput.trim()}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {verifyingKey ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-cyan-200" />
                  <span>Verifying Passkey...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Authenticate & Enter Mission Control</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-500 font-mono">
            <Link href="/" className="hover:text-cyan-400 transition flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Public Portal
            </Link>
            <span className="flex items-center gap-1 text-emerald-400/80">
              <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit TLS Secured
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 border border-cyan-500 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-bounce font-mono">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Top Navigation */}
      <header className="bg-neutral-900/80 border-b border-neutral-800 backdrop-blur sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white font-mono transition"
            >
              <ArrowLeft className="w-4 h-4" /> Public Portal
            </Link>
            <div className="h-4 w-px bg-neutral-800" />
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
              <h1 className="text-lg font-bold text-white font-serif tracking-tight">
                GlobalPulse <span className="text-cyan-400 font-mono text-xs">ADMIN AUTOMATION CENTER</span>
              </h1>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Video Format Selector */}
            <div className="flex items-center bg-black/60 p-1 rounded-xl border border-neutral-700/80 text-xs font-mono shadow-inner">
              <button
                type="button"
                onClick={() => setVideoFormatMode("long")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                  videoFormatMode === "long"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-neutral-950 shadow-md shadow-cyan-500/25"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="16:9 Horizontal Widescreen Full-Length HD (1920x1080, 2-4 minutes, Bloomberg/CNBC Broadcast Style)"
              >
                <Video className="w-3.5 h-3.5" />
                <span>16:9 Long-Form HD</span>
              </button>
              <button
                type="button"
                onClick={() => setVideoFormatMode("short")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                  videoFormatMode === "short"
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/25"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="9:16 Vertical YouTube Shorts (1080x1920, 60s)"
              >
                <span>📱 9:16 Shorts</span>
              </button>
            </div>

            {/* Master One-Click Publisher */}
            <button
              onClick={handleRunMasterPipeline}
              disabled={runningPipeline}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-black text-xs shadow-lg shadow-purple-600/30 disabled:opacity-50 transition duration-150 transform active:scale-95"
              title={`One-click full autonomous execution: RSS Scrape -> Gemini AI Synthesis -> ${videoFormatMode === "long" ? "16:9 1080p Widescreen HD (2-4 min)" : "9:16 Short (60s)"} Video Rendering -> YouTube Upload -> Portal Syndication`}
            >
              <Zap className={`w-4 h-4 text-amber-300 ${runningPipeline ? "animate-bounce" : ""}`} />
              {runningPipeline
                ? "🚀 Executing Full Pipeline..."
                : `🚀 Run Full Auto Pipeline (${videoFormatMode === "long" ? "16:9 HD" : "Shorts"})`}
            </button>

            {ytAuthStatus?.authenticated ? (
              <div
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-xs shadow-lg shadow-emerald-500/20"
                title="Channel GloblePulseAi is connected and authorized for automated Shorts publishing"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <Youtube className="w-4 h-4 text-red-500" />
                <span>Connected: {ytAuthStatus.channel || "GloblePulseAi"}</span>
              </div>
            ) : (
              <button
                onClick={handleAuthYouTube}
                disabled={authorizingYouTube}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-bold text-xs shadow-lg transition duration-150"
                title="Test interactive OAuth2 login and connect YouTube channel (GloblePulseAi)"
              >
                <Youtube className="w-4 h-4 text-red-500" />
                {authorizingYouTube ? "Authenticating..." : "Authorize YouTube Channel"}
              </button>
            )}

            <button
              onClick={handleFetchNow}
              disabled={fetchingNews}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-neutral-950 font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition duration-150"
            >
              <RefreshCw className={`w-4 h-4 ${fetchingNews ? "animate-spin" : ""}`} />
              {fetchingNews ? "Scraping Wires & Rewriting..." : "Fetch & Rewrite Latest Global News"}
            </button>

            {/* Views & Audience Analysis Button */}
            <button
              onClick={() => {
                setShowAnalyticsModal(true);
                loadAnalytics();
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-neutral-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition duration-150 transform active:scale-95 cursor-pointer"
              title="Open Live Audience & Views Telemetry Analysis"
            >
              <BarChart3 className="w-4 h-4 text-neutral-950" />
              <span>📊 Views & Audience Analysis</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-neutral-400 hover:text-red-300 border border-white/10 font-mono text-xs transition"
              title="Lock admin session and clear credentials"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Session</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex-1">
        {/* LIVE VIDEO GENERATION & REAL-TIME UPLOAD CENTER */}
        <section className="mb-8 p-6 rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900/95 to-neutral-950 border-2 border-cyan-500/40 shadow-[0_0_40px_rgba(6,182,212,0.15)] relative overflow-hidden">
          {/* Subtle Cybernetic Background Grid & Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header Row */}
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 shrink-0">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-white font-serif tracking-tight">
                    LIVE VIDEO PROCESSING & YOUTUBE SHORTS CENTER
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-mono animate-pulse">
                    LIVE TELEMETRY
                  </span>
                </div>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">
                  Real-time Neural Voiceover • High-Definition Frames • FFmpeg Hardware MP4 Render • YouTube Channel @GloblePulseAi
                </p>
              </div>
            </div>

            {/* Local Worker Status & Daily YouTube Quota Indicator */}
            <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
              {/* Daily YouTube Quota Badge (Optimized: Max 4 Shorts + 1 Long per day) */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900/90 border border-neutral-700/80 text-xs font-mono shadow-inner">
                <span className="text-neutral-400">Daily YouTube:</span>
                <span className={`font-bold ${(workerStatus?.shorts_today ?? 0) >= (workerStatus?.max_shorts ?? 4) ? "text-emerald-400" : "text-cyan-400"}`}>
                  {workerStatus?.shorts_today ?? 0}/{workerStatus?.max_shorts ?? 4} Shorts
                </span>
                <span className="text-neutral-600">|</span>
                <span className={`font-bold ${(workerStatus?.longs_today ?? 0) >= (workerStatus?.max_longs ?? 1) ? "text-emerald-400" : "text-purple-400"}`}>
                  {workerStatus?.longs_today ?? 0}/{workerStatus?.max_longs ?? 1} Long
                </span>
                {(workerStatus?.shorts_today ?? 0) >= (workerStatus?.max_shorts ?? 4) && (workerStatus?.longs_today ?? 0) >= (workerStatus?.max_longs ?? 1) && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    CAP MET ({(workerStatus?.shorts_today ?? 0) + (workerStatus?.longs_today ?? 0)}/{(workerStatus?.max_shorts ?? 4) + (workerStatus?.max_longs ?? 1)})
                  </span>
                )}
              </div>

              {workerStatus?.online ? (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-xs shadow-lg shadow-emerald-500/10">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-bold">LOCAL WORKER ONLINE</span>
                  <span className="text-neutral-400 text-[10px]">({workerStatus.channel_name || "@GloblePulseAi"})</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="font-bold">LOCAL WORKER STANDBY / OFFLINE</span>
                </div>
              )}
            </div>
          </div>

          {/* Active Job Real-Time Progress Box */}
          {activeJobs && activeJobs.length > 0 ? (
            <div className="relative z-10 mt-6 space-y-4">
              {activeJobs.map((job) => (
                <div
                  key={job.article_id}
                  className="p-5 sm:p-6 rounded-2xl bg-neutral-950/80 border border-cyan-500/40 shadow-xl space-y-4"
                >
                  {/* Article Title & Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold border border-cyan-400/30">
                        Article #{job.article_id}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-mono text-xs font-bold border border-purple-400/30">
                        {job.category}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-300 font-mono text-xs font-bold border border-neutral-700">
                        {videoFormatMode === "long" ? "🖥️ 16:9 Long-Form HD" : "📱 9:16 Shorts"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-neutral-400">Est. Remaining:</span>
                      <span className="text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800">
                        {job.video_eta || "~30s remaining"}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                    {job.title}
                  </h3>

                  {/* 4-Stage Visual Progress Breadcrumbs */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                    {/* Stage 1: Voiceover */}
                    <div
                      className={`p-2.5 rounded-xl border text-xs font-mono flex items-center gap-2 transition ${
                        (job.video_progress || 0) >= 20
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                          : job.video_status === "VOICEOVER" || job.video_status === "QUEUED"
                          ? "bg-cyan-500/15 border-cyan-400 text-cyan-300 animate-pulse font-bold"
                          : "bg-neutral-900 border-neutral-800 text-neutral-500"
                      }`}
                    >
                      <span>🎙️</span>
                      <span className="truncate">1. Voiceover (TTS)</span>
                      {(job.video_progress || 0) >= 20 && <span className="ml-auto text-emerald-400">✓</span>}
                    </div>

                    {/* Stage 2: Slide Composition */}
                    <div
                      className={`p-2.5 rounded-xl border text-xs font-mono flex items-center gap-2 transition ${
                        (job.video_progress || 0) >= 50
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                          : job.video_status === "COMPOSING_FRAMES"
                          ? "bg-cyan-500/15 border-cyan-400 text-cyan-300 animate-pulse font-bold"
                          : "bg-neutral-900 border-neutral-800 text-neutral-500"
                      }`}
                    >
                      <span>🎨</span>
                      <span className="truncate">2. Visual Captions</span>
                      {(job.video_progress || 0) >= 50 && <span className="ml-auto text-emerald-400">✓</span>}
                    </div>

                    {/* Stage 3: FFmpeg Hardware Render */}
                    <div
                      className={`p-2.5 rounded-xl border text-xs font-mono flex items-center gap-2 transition ${
                        (job.video_progress || 0) >= 80
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                          : job.video_status === "RENDERING_FFMPEG"
                          ? "bg-cyan-500/15 border-cyan-400 text-cyan-300 animate-pulse font-bold"
                          : "bg-neutral-900 border-neutral-800 text-neutral-500"
                      }`}
                    >
                      <span>⚡</span>
                      <span className="truncate">3. FFmpeg MP4</span>
                      {(job.video_progress || 0) >= 80 && <span className="ml-auto text-emerald-400">✓</span>}
                    </div>

                    {/* Stage 4: YouTube Upload */}
                    <div
                      className={`p-2.5 rounded-xl border text-xs font-mono flex items-center gap-2 transition ${
                        (job.video_progress || 0) >= 100
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                          : job.video_status === "UPLOADING_YOUTUBE"
                          ? "bg-cyan-500/15 border-cyan-400 text-cyan-300 animate-pulse font-bold"
                          : "bg-neutral-900 border-neutral-800 text-neutral-500"
                      }`}
                    >
                      <span>🚀</span>
                      <span className="truncate">4. YouTube Upload</span>
                      {(job.video_progress || 0) >= 100 && <span className="ml-auto text-emerald-400">✓</span>}
                    </div>
                  </div>

                  {/* Big Glowing Progress Bar & Percentage */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="text-cyan-300 font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        {job.video_stage_text || "Processing video stages..."}
                      </span>
                      <span className="text-white font-black text-sm">{job.video_progress || 5}% Completed</span>
                    </div>

                    {/* Animated Progress Bar */}
                    <div className="w-full h-4 rounded-full bg-neutral-900 border border-neutral-700 overflow-hidden p-0.5 shadow-inner">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 transition-all duration-700 ease-out shadow-[0_0_20px_rgba(6,182,212,0.6)]"
                        style={{ width: `${Math.max(job.video_progress || 5, 5)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative z-10 mt-5 p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                  <Play className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white font-mono">
                    Ready to Generate & Upload Videos
                  </div>
                  <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                    Click the <strong className="text-cyan-400">"🎬 Render & Upload Video"</strong> button on any article below. Your local PC will render the video with FFmpeg and auto-upload to YouTube Shorts while displaying live progress above.
                  </p>
                </div>
              </div>

              {!workerStatus?.online && (
                <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono shrink-0">
                  ⚡ <strong>Step:</strong> Double-click <code className="bg-black/50 px-1 py-0.5 rounded text-amber-200">START_VIDEO_WORKER.bat</code> in the project folder to start background rendering.
                </div>
              )}
            </div>
          )}

          {/* Recently Uploaded Shorts Bar */}
          {recentCompleted && recentCompleted.length > 0 && (
            <div className="relative z-10 mt-5 pt-4 border-t border-white/10">
              <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold mb-3 flex items-center gap-2">
                <Youtube className="w-3.5 h-3.5 text-red-500" />
                <span>Recently Uploaded to YouTube Shorts:</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {recentCompleted.map((rc) => (
                  <div
                    key={rc.article_id}
                    className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-red-500/40 transition flex items-center justify-between gap-2"
                  >
                    <div className="truncate pr-2">
                      <div className="text-[10px] text-purple-300 font-mono font-bold">
                        #{rc.article_id} • {rc.category}
                      </div>
                      <div className="text-xs text-white font-medium truncate mt-0.5">
                        {rc.title}
                      </div>
                    </div>
                    {rc.youtube_video_id && rc.youtube_video_id !== "dQw4w9WgXcQ" ? (
                      <a
                        href={`https://www.youtube.com/shorts/${rc.youtube_video_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] font-mono shrink-0 flex items-center gap-1 shadow-md shadow-red-600/20 transition"
                      >
                        <Youtube className="w-3 h-3" />
                        Watch ↗
                      </a>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-mono font-bold shrink-0">
                        ✅ Uploaded
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 24/7 BACKGROUND AUTOMATION TELEMETRY BANNER */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-neutral-900 via-purple-950/20 to-neutral-900 border border-purple-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 shrink-0">
              <Clock className="w-5 h-5 text-purple-400" />

              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-purple-300">
                  24/7 Background Automation Engine (APScheduler)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {schedulerInfo?.is_running ? "ACTIVE & RUNNING" : "STANDBY (ACTIVE ON STARTUP)"}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-mono mt-1">
                Autonomous cycle: Scrapes wires → Synthesizes via Gemini AI → Renders vertical MP4 video → Uploads to YouTube every {schedulerInfo?.interval_hours || 6} hours.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-neutral-400 w-full md:w-auto justify-between md:justify-end">
            <div className="bg-neutral-950/70 px-3 py-1.5 rounded-lg border border-neutral-800">
              <span className="text-neutral-500">Target Channel:</span>{" "}
              <span className="text-red-400 font-semibold">GloblePulseAi</span>
            </div>
            {schedulerInfo?.next_run_time && (
              <div className="bg-neutral-950/70 px-3 py-1.5 rounded-lg border border-neutral-800 hidden lg:block">
                <span className="text-neutral-500">Next Run:</span>{" "}
                <span className="text-cyan-400 font-semibold">
                  {new Date(schedulerInfo.next_run_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
            <button
              onClick={handleRunMasterPipeline}
              disabled={runningPipeline}
              className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-purple-600/30 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              {runningPipeline ? "Running..." : "Trigger Master Now"}
            </button>
          </div>
        </div>

        {/* STATS OVERVIEW CARDS */}
        {/* STATS OVERVIEW CARDS */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
          <div className="p-6 rounded-2xl glass-panel hover:border-cyan-500/30 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-neutral-400 font-semibold tracking-wider">
                Total Dispatches
              </span>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-white mt-2 font-mono">
              {stats.total_articles}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1 font-mono">Monitored Across 5 Categories</div>
          </div>

          <div className="p-6 rounded-2xl glass-panel hover:border-amber-500/30 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-amber-400 font-semibold tracking-wider">
                Drafts Pending Review
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-amber-300 mt-2 font-mono">
              {stats.drafts_count}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1 font-mono">Ready for Video Generation</div>
          </div>

          <div className="p-6 rounded-2xl glass-panel hover:border-cyan-400/30 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-cyan-300 font-semibold tracking-wider">
                Videos Generated
              </span>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
                <Video className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-cyan-300 mt-2 font-mono">
              {stats.video_ready_count}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1 font-mono">60s Shorts Pipeline</div>
          </div>

          <div
            onClick={() => {
              setShowAnalyticsModal(true);
              loadAnalytics();
            }}
            className="p-6 rounded-2xl glass-panel hover:border-emerald-500/50 hover:bg-emerald-950/20 transition-all duration-300 group cursor-pointer border border-emerald-500/20 relative overflow-hidden"
            title="Click to view full audience & views analysis"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-emerald-400 font-semibold tracking-wider">
                Total Platform Reads
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-300 mt-2 font-mono flex items-baseline justify-between">
              <span>{stats.total_views.toLocaleString()}</span>
              <span className="text-[11px] text-emerald-400/80 font-mono font-normal group-hover:underline">Analyse →</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-1 font-mono flex items-center justify-between">
              <span>Tier-1 Global Audience</span>
              <span className="text-emerald-400/70 font-semibold">Live Telemetry</span>
            </div>
          </div>
        </section>

        {/* WORKFLOW QUEUE & TABLE */}
        <section className="glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          {/* Table Header & Tabs */}
          <div className="p-5 sm:p-6 border-b border-white/10 bg-slate-950/60 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white font-serif">
                  Autonomous Editorial & Video Queue
                </h2>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">
                  Review synthesized articles, generate 16:9 Long or 9:16 Shorts videos, and syndicate.
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs font-mono">
                {["ALL", "DRAFT", "VIDEO_READY", "PUBLISHED"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilterStatus(tab)}
                    className={`px-3 py-1 rounded-md transition ${
                      filterStatus === tab
                        ? "bg-neutral-800 text-white font-bold"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    {tab === "ALL" ? "All Statuses" : tab.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter Tabs Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-white/5 pt-3">
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mr-1">Category:</span>
              {[
                { name: "ALL", label: "All Categories" },
                { name: "AI & Tech", label: "AI & Tech" },
                { name: "Global Markets", label: "Global Markets" },
                { name: "World Politics", label: "World Politics" },
                { name: "Future Science", label: "Future Science" },
                { name: "Global Sports", label: "Global Sports", icon: Trophy },
              ].map((c) => {
                const Icon = c.icon;
                const isSelected = filterCategory === c.name;
                return (
                  <button
                    key={c.name}
                    onClick={() => setFilterCategory(c.name)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono whitespace-nowrap transition ${
                      isSelected
                        ? c.name === "Global Sports"
                          ? "bg-red-500/20 text-red-300 border border-red-500/40 font-bold"
                          : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold"
                        : "bg-neutral-900/60 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5 text-red-400" />}
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Queue Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/60 text-neutral-400 uppercase font-mono text-[10px] tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-5">Headline & Source</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Views</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredArticles.map((art) => {
                  const isLoading = actionLoadingId === art.id;
                  return (
                    <tr
                      key={art.id}
                      className="hover:bg-neutral-800/40 transition duration-150 group"
                    >
                      {/* Title & Slug */}
                      <td className="py-4 px-5 max-w-md">
                        <div className="font-bold text-neutral-100 group-hover:text-cyan-300 transition text-sm leading-snug">
                          {art.title}
                        </div>
                        <div className="text-[11px] text-neutral-500 font-mono mt-1 flex items-center gap-2">
                          <span>{art.source_name || "Reuters Wire"}</span>
                          <span>•</span>
                          <span className="truncate max-w-[200px]">{art.slug}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border ${
                          art.category === "Global Sports"
                            ? "bg-red-500/15 text-red-300 border-red-500/30"
                            : art.category === "AI & Tech"
                            ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                            : art.category === "Global Markets"
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            : art.category === "World Politics" || art.category === "Geopolitics"
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                            : art.category === "Future Science"
                            ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                            : "bg-neutral-800 text-neutral-300 border-neutral-700"
                        }`}>
                          {art.category === "Global Sports" && "🏆 "}
                          {art.category}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          {getStatusBadge(art.status)}
                          {art.youtube_video_id && art.youtube_video_id !== "dQw4w9WgXcQ" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600/20 text-red-300 border border-red-500/30 font-mono">
                              <Youtube className="w-2.5 h-2.5 text-red-400" /> YouTube Live
                            </span>
                          ) : art.video_status && ["QUEUED", "VOICEOVER", "COMPOSING_FRAMES", "RENDERING_FFMPEG", "UPLOADING_YOUTUBE"].includes(art.video_status) ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-mono animate-pulse">
                              ⚡ {art.video_progress || 5}% ({art.video_eta || "Rendering"})
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Views */}
                      <td className="py-4 px-4 whitespace-nowrap font-mono text-neutral-400">
                        {art.views.toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-2">
                          {/* Preview Article Button */}
                          <button
                            onClick={() => {
                              setSelectedArticle(art);
                              setPreviewTab("article");
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs border border-neutral-700 transition"
                            title="Preview synthesized article & TL;DR"
                          >
                            Article
                          </button>

                          {/* Preview YouTube Script Button */}
                          <button
                            onClick={() => {
                              setSelectedArticle(art);
                              setPreviewTab("script");
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 font-medium text-xs border border-purple-500/30 transition"
                            title="Preview 60-sec YouTube Shorts script"
                          >
                            <Video className="w-3.5 h-3.5 text-purple-400" />
                            Script
                          </button>

                          {/* YouTube Video Status & Action Buttons */}
                          {art.youtube_video_id && art.youtube_video_id !== "dQw4w9WgXcQ" ? (
                            <div className="inline-flex items-center gap-1.5">
                              <a
                                href={`https://www.youtube.com/shorts/${art.youtube_video_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/30 transition"
                                title="Watch published Short directly on YouTube channel @GloblePulseAi"
                              >
                                <Youtube className="w-3.5 h-3.5" />
                                <span>Watch Short ↗</span>
                              </a>
                              <button
                                onClick={() => handleQueueVideo(art.id)}
                                disabled={isLoading}
                                className="px-2 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white text-xs border border-neutral-700 transition"
                                title="Re-render & re-upload video"
                              >
                                🔄
                              </button>
                            </div>
                          ) : art.video_status && ["QUEUED", "VOICEOVER", "COMPOSING_FRAMES", "RENDERING_FFMPEG", "UPLOADING_YOUTUBE"].includes(art.video_status) ? (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-400/40 text-xs font-mono font-bold animate-pulse shadow-md shadow-cyan-500/10">
                              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                              <span>Rendering: {art.video_progress || 5}%</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleQueueVideo(art.id)}
                              disabled={isLoading}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs shadow-md shadow-red-600/25 transition disabled:opacity-50"
                              title={`Render ${videoFormatMode === "long" ? "16:9 HD" : "9:16 Shorts"} video locally and auto-upload to YouTube (@GloblePulseAi)`}
                            >
                              <Play className="w-3.5 h-3.5 text-yellow-300" />
                              <span>🎬 Render & Upload Video</span>
                            </button>
                          )}

                          {/* Instant Publish if DRAFT */}
                          {art.status !== "PUBLISHED" && (
                            <button
                              onClick={() => handleInstantPublish(art.id)}
                              disabled={isLoading}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
                              title="Instant Publish: Go live on web portal immediately"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Publish
                            </button>
                          )}

                          {/* View Live Article Link if PUBLISHED */}
                          {art.status === "PUBLISHED" && (
                            <Link
                              href={`/news/${art.slug}`}
                              target="_blank"
                              className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-400 font-semibold text-xs border border-neutral-700 transition inline-flex items-center gap-1"
                            >
                              <span>View Live</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* PREVIEW MODAL */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-cyan-400">
                  {selectedArticle.category} • {selectedArticle.status}
                </span>
                <h3 className="text-lg font-bold text-white font-serif mt-0.5 line-clamp-1">
                  {selectedArticle.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center border-b border-neutral-800 px-5 pt-2 gap-4 text-xs font-mono">
              <button
                onClick={() => setPreviewTab("article")}
                className={`pb-2.5 border-b-2 font-bold transition ${
                  previewTab === "article"
                    ? "border-cyan-400 text-cyan-400"
                    : "border-transparent text-neutral-400 hover:text-white"
                }`}
              >
                Full AI Article & TL;DR
              </button>
              <button
                onClick={() => setPreviewTab("script")}
                className={`pb-2.5 border-b-2 font-bold transition flex items-center gap-1.5 ${
                  previewTab === "script"
                    ? "border-cyan-400 text-cyan-400"
                    : "border-transparent text-neutral-400 hover:text-white"
                }`}
              >
                <Video className="w-3.5 h-3.5" /> 60-Sec YouTube Shorts Script
              </button>
              <button
                onClick={() => setPreviewTab("metadata")}
                className={`pb-2.5 border-b-2 font-bold transition ${
                  previewTab === "metadata"
                    ? "border-cyan-400 text-cyan-400"
                    : "border-transparent text-neutral-400 hover:text-white"
                }`}
              >
                Metadata & Video Assets
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm text-neutral-300 leading-relaxed font-sans">
              {previewTab === "article" && (
                <div>
                  <div className="p-4 rounded-lg bg-cyan-950/30 border border-cyan-500/30 mb-4">
                    <h5 className="text-xs font-mono font-bold text-cyan-300 uppercase mb-2">
                      Key Takeaways (TL;DR):
                    </h5>
                    <p className="whitespace-pre-line text-xs text-neutral-200 font-sans">
                      {selectedArticle.summary}
                    </p>
                  </div>
                  <h4 className="text-base font-bold text-white mb-2 font-serif">Article Body</h4>
                  <pre className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs whitespace-pre-wrap font-sans leading-relaxed">
                    {selectedArticle.content}
                  </pre>
                </div>
              )}

              {previewTab === "script" && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white font-serif">
                        Automated 60-Second Vertical Shorts Script
                      </h4>
                      <p className="text-[11px] text-neutral-400 font-mono">
                        Formatted with hooks, visual prompts, sound effects & CTA
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-red-600/90 text-white font-mono px-2 py-0.5 rounded font-bold">
                        RUNTIME: 58 SEC
                      </span>
                      <button
                        onClick={() => {
                          if (selectedArticle.youtube_script) {
                            navigator.clipboard.writeText(selectedArticle.youtube_script);
                            showToast("YouTube Shorts Script copied to clipboard!");
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-cyan-400 text-xs font-mono border border-neutral-700 transition"
                      >
                        Copy Script
                      </button>
                    </div>
                  </div>
                  <pre className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 text-cyan-300 font-mono text-xs whitespace-pre-wrap leading-loose">
                    {selectedArticle.youtube_script || "No YouTube Shorts script generated yet."}
                  </pre>
                </div>
              )}


              {previewTab === "metadata" && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                    <span className="text-neutral-500">SEO Slug:</span>{" "}
                    <span className="text-white font-bold">{selectedArticle.slug}</span>
                  </div>
                  <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                    <span className="text-neutral-500">Source Wire:</span>{" "}
                    <span className="text-white">{selectedArticle.source_name || "Reuters"}</span> (
                    <a
                      href={selectedArticle.source_url || "#"}
                      target="_blank"
                      className="text-cyan-400 underline"
                    >
                      Link
                    </a>
                    )
                  </div>
                  <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                    <span className="text-neutral-500">Rendered Video MP4:</span>{" "}
                    <span className="text-cyan-400 font-mono">
                      {selectedArticle.video_path || "Not generated yet"}
                    </span>
                    {selectedArticle.video_path && (
                      <div className="mt-3 p-2 bg-black rounded border border-neutral-800">
                        <div className="text-[10px] text-neutral-400 font-mono mb-1.5 flex items-center gap-1">
                          <Video className="w-3.5 h-3.5 text-cyan-400" />
                          Local Rendered Video Preview:
                        </div>
                        <video
                          controls
                          className="w-full max-h-60 rounded bg-black object-contain"
                          src={selectedArticle.video_path.startsWith("http") ? selectedArticle.video_path : `${getApiBase()}${selectedArticle.video_path}`}
                        />
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                    <span className="text-neutral-500">YouTube Video ID:</span>{" "}
                    <span className="text-white font-mono">
                      {selectedArticle.youtube_video_id ? (
                        <a
                          href={`https://www.youtube.com/watch?v=${selectedArticle.youtube_video_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-red-400 hover:underline"
                        >
                          {selectedArticle.youtube_video_id} (Open on YouTube ↗)
                        </a>
                      ) : (
                        "None (Will be assigned upon YouTube upload)"
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-neutral-800 bg-neutral-950/50 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-neutral-500 font-mono">
                Article ID: #{selectedArticle.id}
              </span>

              <div className="flex items-center gap-2">
                {selectedArticle.status !== "PUBLISHED" && (
                  <button
                    onClick={() => handleInstantPublish(selectedArticle.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                    title="Instant Publish: Go live immediately on portal without waiting for video generation"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Publish Article Only (Instant)
                  </button>
                )}

                {selectedArticle.status === "DRAFT" && (
                  <button
                    onClick={() => handleAutoPublish(selectedArticle.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs shadow-md transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Generate Video & Publish ({videoFormatMode === "long" ? "16:9 HD" : "Shorts"})
                  </button>
                )}

                {selectedArticle.status === "DRAFT" && (
                  <button
                    onClick={() => handleGenerateVideo(selectedArticle.id)}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-cyan-900/60 hover:bg-cyan-800 text-cyan-300 border border-cyan-500/30 text-xs font-semibold"
                  >
                    <Video className="w-3.5 h-3.5" /> Render Video Only ({videoFormatMode === "long" ? "16:9 HD" : "9:16"})
                  </button>
                )}

                {selectedArticle.status === "VIDEO_READY" && (
                  <button
                    onClick={() => handlePublish(selectedArticle.id)}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Upload to YouTube ({videoFormatMode === "long" ? "16:9 HD" : "Shorts"}) & Publish
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Real-time Audience & Views Analytics Telemetry Modal */}
      <AnalyticsModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        analyticsData={analyticsData}
        isLoading={loadingAnalytics}
        onRefresh={loadAnalytics}
      />
    </div>
  );
}
