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
  fetchWorkerStatus,
  fetchActiveVideoJobs,
  fetchAnalyticsSummary,
  publishArticle,
  publishInstantArticle,
  autoPublishArticle,
  runMasterPipeline,
  getSchedulerStatus,
  SchedulerStatusResponse,
  setAdminSecret,
  clearAdminSecret,
  verifyAdminSecret,
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
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadDashboardData = async () => {
    try {
      const [statsData, articlesData, schedulerData] = await Promise.all([
        fetchAdminStats(),
        fetchArticles({ limit: 100 }),
        getSchedulerStatus(),
      ]);
      setStats(statsData);
      setArticles(articlesData.items || []);
      setSchedulerInfo(schedulerData);
    } catch (err) {
      console.error("Failed loading admin dashboard data:", err);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const savedSecret = typeof window !== "undefined" ? localStorage.getItem("gp_admin_secret") : null;
      if (savedSecret) {
        const res = await verifyAdminSecret(savedSecret);
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
    const interval = setInterval(pollWorkerAndJobs, 3000);
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 neu-sm text-[11px] font-bold text-amber-600 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            DRAFT PENDING
          </span>
        );
      case "VIDEO_READY":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 neu-sm text-[11px] font-bold text-[#1a8cff] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1a8cff]" />
            VIDEO READY
          </span>
        );
      case "PUBLISHED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 neu-sm text-[11px] font-bold text-emerald-600 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            PUBLISHED LIVE
          </span>
        );
      default:
        return null;
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#e0e5ec] text-[#2d3748] flex flex-col items-center justify-center font-mono">
        <div className="w-16 h-16 neu-circle flex items-center justify-center mb-4">
          <Sparkles className="w-7 h-7 text-[#1a8cff] animate-spin" />
        </div>
        <p className="text-xs text-[#718096] uppercase tracking-widest font-bold">
          Verifying Admin Security Clearance...
        </p>
      </div>
    );
  }

  // =========================================================================
  // 1. NEUMORPHIC 3D ADMIN LOGIN SCREEN
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#e0e5ec] text-[#2d3748] flex flex-col justify-center items-center px-4 font-sans relative overflow-hidden">
        {/* Subtle Decorative Floating 3D Spheres */}
        <div className="bg-circle w-80 h-80 -top-20 -left-20 opacity-60" />
        <div className="bg-circle w-72 h-72 bottom-10 -right-16 opacity-60" />

        <div className="w-full max-w-md neu-flat p-8 sm:p-10 relative z-10">
          {/* Circular Raised Lock Icon Box at Top */}
          <div className="w-16 h-16 neu-circle flex items-center justify-center mx-auto mb-5 text-[#1a8cff]">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-bold font-serif text-center text-[#2d3748]">
            Mission Control Authentication
          </h2>
          <p className="text-xs text-[#718096] font-mono text-center mt-1.5">
            GlobalPulse AI Restricted Operational Surface
          </p>

          <form onSubmit={handlePasskeySubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-mono text-[#718096] mb-2 uppercase tracking-wider font-bold">
                Admin Secret Key / Passkey
              </label>
              <input
                type="password"
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                placeholder="Enter master admin secret..."
                className="w-full neu-input px-4 py-3 text-sm font-mono placeholder:text-[#a0aec0]"
                autoFocus
              />
              <p className="text-[11px] text-[#718096] font-mono mt-2">
                Default Dev Key: <code className="text-[#1a8cff] font-bold">saeed-admin-2026</code>
              </p>
            </div>

            {authError && (
              <div className="p-3 neu-pressed text-red-600 text-xs font-mono font-bold">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={verifyingKey || !passkeyInput.trim()}
              className="w-full py-3.5 neu-btn-primary flex items-center justify-center gap-2 text-sm uppercase tracking-wider disabled:opacity-50"
            >
              {verifyingKey ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Verifying Passkey...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Authenticate & Enter</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#b8bec7]/40 flex items-center justify-between text-xs text-[#718096] font-mono">
            <Link href="/" className="hover:text-[#1a8cff] transition flex items-center gap-1 font-bold">
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Portal
            </Link>
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit TLS Secured
            </span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. NEUMORPHIC 3D MISSION CONTROL DASHBOARD
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#e0e5ec] text-[#2d3748] flex flex-col font-sans selection:bg-[#1a8cff] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 neu-flat bg-[#e0e5ec] text-[#2d3748] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-mono border-2 border-[#1a8cff]">
          <Sparkles className="w-4 h-4 text-[#1a8cff]" />
          <span className="font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Admin Top Navigation */}
      <header className="px-4 sm:px-6 pt-4 pb-2">
        <div className="max-w-7xl mx-auto neu-flat p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="neu-sm px-3.5 py-1.5 flex items-center gap-1.5 text-xs text-[#2d3748] font-mono font-bold hover:text-[#1a8cff] transition"
            >
              <ArrowLeft className="w-4 h-4" /> Public Portal
            </Link>
            <div className="h-5 w-px bg-[#b8bec7]" />
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-[#1a8cff] shadow-[0_0_8px_rgba(26,140,255,0.8)]" />
              <h1 className="text-lg font-bold text-[#2d3748] font-serif tracking-tight">
                GlobalPulse <span className="text-[#1a8cff] font-mono text-xs">ADMIN AUTOMATION CENTER</span>
              </h1>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Video Format Selector */}
            <div className="flex items-center neu-pressed p-1 rounded-xl text-xs font-mono">
              <button
                type="button"
                onClick={() => setVideoFormatMode("long")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  videoFormatMode === "long"
                    ? "neu-sm text-[#1a8cff]"
                    : "text-[#718096] hover:text-[#2d3748]"
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>16:9 Long-Form HD</span>
              </button>
              <button
                type="button"
                onClick={() => setVideoFormatMode("short")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  videoFormatMode === "short"
                    ? "neu-sm text-[#1a8cff]"
                    : "text-[#718096] hover:text-[#2d3748]"
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>9:16 Shorts</span>
              </button>
            </div>

            {/* Run Full Master Pipeline */}
            <button
              onClick={handleRunMasterPipeline}
              disabled={runningPipeline}
              className="neu-btn-primary px-4 py-2 text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              <span>{runningPipeline ? "Running Master Pipeline..." : `Run Full Auto (${videoFormatMode === "long" ? "16:9 HD" : "Shorts"})`}</span>
            </button>

            {/* YouTube Authorization Status */}
            {(ytAuthStatus?.authenticated || workerStatus?.online) ? (
              <div className="neu-sm px-4 py-2 text-emerald-600 font-bold text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Youtube className="w-4 h-4 text-red-600" />
                <span>Connected: {ytAuthStatus?.channel || workerStatus?.channel_name || "@GloblePulseAi"}</span>
              </div>
            ) : (
              <button
                onClick={handleAuthYouTube}
                disabled={authorizingYouTube}
                className="neu-sm px-4 py-2 text-red-600 hover:text-red-700 font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <Youtube className="w-4 h-4 text-red-600" />
                <span>{authorizingYouTube ? "Authenticating..." : "Authorize YouTube"}</span>
              </button>
            )}

            {/* Fetch Latest News Button */}
            <button
              onClick={handleFetchNow}
              disabled={fetchingNews}
              className="neu-sm px-4 py-2 text-[#2d3748] hover:text-[#1a8cff] font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#1a8cff] ${fetchingNews ? "animate-spin" : ""}`} />
              <span>{fetchingNews ? "Scraping Wires..." : "Fetch Latest News"}</span>
            </button>

            {/* Views & Audience Analysis Button */}
            <button
              onClick={() => {
                setShowAnalyticsModal(true);
                loadAnalytics();
              }}
              className="neu-sm px-4 py-2 text-emerald-600 hover:text-emerald-700 font-bold text-xs flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>📊 Views & Audience</span>
            </button>

            {/* Lock Session */}
            <button
              onClick={handleLogout}
              className="neu-sm px-3.5 py-2 text-[#718096] hover:text-red-600 font-mono text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Session</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1">
        {/* LIVE VIDEO PROCESSING & TELEMETRY CENTER */}
        <section className="neu-flat p-6 sm:p-8 mb-8 rounded-3xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#b8bec7]/40">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 neu-circle flex items-center justify-center text-[#1a8cff] shrink-0">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-[#2d3748] font-serif tracking-tight">
                    LIVE VIDEO PROCESSING & YOUTUBE SHORTS CENTER
                  </h2>
                  <span className="neu-sm px-2.5 py-0.5 text-[10px] font-bold text-[#1a8cff] font-mono">
                    LIVE TELEMETRY
                  </span>
                </div>
                <p className="text-xs text-[#718096] font-mono mt-0.5">
                  Real-time Neural Voiceover • High-Definition Frames • FFmpeg Hardware MP4 Render • YouTube Channel @GloblePulseAi
                </p>
              </div>
            </div>

            {/* Auto-Pilot Indicator */}
            <div className="neu-sm px-3 py-1.5 flex items-center gap-2 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[#718096]">Auto-Pilot:</span>
              <span className="font-bold text-[#1a8cff]">Every {schedulerInfo?.interval_minutes || 15}m</span>
            </div>
          </div>

          {/* Real-time Video Render Progress Cards */}
          {activeJobs && activeJobs.length > 0 ? (
            <div className="space-y-4 mt-6">
              {activeJobs.map((job) => (
                <div key={job.article_id} className="neu-pressed p-5 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="font-bold text-sm text-[#2d3748]">
                      Article #{job.article_id}: {job.title}
                    </div>
                    <span className="neu-sm px-2.5 py-0.5 text-xs font-mono font-bold text-[#1a8cff]">
                      {job.video_eta || "~40s remaining"}
                    </span>
                  </div>

                  {/* Neumorphic Carved Progress Bar Track */}
                  <div className="neu-progress-track w-full h-4 p-0.5">
                    <div
                      className="neu-progress-fill h-full"
                      style={{ width: `${Math.max(job.video_progress || 5, 5)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-[#718096]">
                    <span className="font-bold text-[#1a8cff]">{job.video_stage_text || "Processing..."}</span>
                    <span className="font-black text-[#2d3748]">{job.video_progress || 5}% Completed</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 neu-pressed p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 neu-circle flex items-center justify-center text-[#1a8cff] shrink-0">
                  <Play className="w-4 h-4 text-[#1a8cff]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#2d3748] font-mono">
                    Ready to Generate & Upload Videos
                  </div>
                  <p className="text-[11px] text-[#718096] font-mono mt-0.5">
                    Click the <strong className="text-[#1a8cff]">"🎬 Render & Upload Video"</strong> button on any article below. Your local PC will render the video with FFmpeg and auto-upload to YouTube Shorts.
                  </p>
                </div>
              </div>

              {!workerStatus?.online && (
                <div className="neu-sm px-3.5 py-2 text-amber-700 text-[11px] font-mono shrink-0">
                  ⚡ <strong>Step:</strong> Run <code className="neu-pressed-sm px-1.5 py-0.5 text-amber-800 font-bold">START_VIDEO_WORKER.bat</code> on your PC.
                </div>
              )}
            </div>
          )}

          {/* Recently Uploaded Shorts Bar */}
          {recentCompleted && recentCompleted.length > 0 && (
            <div className="mt-6 pt-4 border-t border-[#b8bec7]/40">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#718096] font-bold mb-3 flex items-center gap-2">
                <Youtube className="w-3.5 h-3.5 text-red-600" />
                <span>Recently Uploaded to YouTube Shorts:</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {recentCompleted.map((rc) => (
                  <div
                    key={rc.article_id}
                    className="neu-sm p-3 flex items-center justify-between gap-2"
                  >
                    <div className="truncate pr-2">
                      <div className="text-[10px] text-[#1a8cff] font-mono font-bold">
                        #{rc.article_id} • {rc.category}
                      </div>
                      <div className="text-xs text-[#2d3748] font-medium truncate mt-0.5">
                        {rc.title}
                      </div>
                    </div>
                    {rc.youtube_video_id && rc.youtube_video_id !== "dQw4w9WgXcQ" ? (
                      <a
                        href={`https://www.youtube.com/shorts/${rc.youtube_video_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="neu-btn-primary px-2.5 py-1 text-[11px] font-mono shrink-0 flex items-center gap-1"
                      >
                        <Youtube className="w-3 h-3 text-white" />
                        Watch ↗
                      </a>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-mono font-bold shrink-0">
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
        <div className="neu-flat p-5 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 neu-circle flex items-center justify-center text-[#1a8cff] shrink-0">
              <Clock className="w-5 h-5 text-[#1a8cff]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-[#2d3748]">
                  24/7 Background Automation Engine (APScheduler)
                </h2>
                <span className="neu-sm px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
                  {schedulerInfo?.is_running ? "ACTIVE & RUNNING" : "STANDBY (ACTIVE ON STARTUP)"}
                </span>
              </div>
              <p className="text-[11px] text-[#718096] font-mono mt-1">
                Autonomous cycle: Scrapes wires → Synthesizes via Gemini AI → Renders vertical MP4 video → Uploads to YouTube every {schedulerInfo?.interval_hours || 6} hours.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-[#718096] w-full md:w-auto justify-between md:justify-end">
            <div className="neu-sm px-3 py-1.5">
              <span className="text-[#718096]">Target Channel:</span>{" "}
              <span className="text-red-600 font-bold">GloblePulseAi</span>
            </div>
            <button
              onClick={handleRunMasterPipeline}
              disabled={runningPipeline}
              className="neu-btn-primary px-3.5 py-1.5 text-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>{runningPipeline ? "Running..." : "Trigger Master Now"}</span>
            </button>
          </div>
        </div>

        {/* =====================================================================
            3. LIVE AUDIENCE & VIEWS TELEMETRY METRIC BOXES (.neu-flat)
           ===================================================================== */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
          <div className="neu-flat p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-[#718096] font-bold tracking-wider">
                Total Dispatches
              </span>
              <div className="w-9 h-9 neu-circle flex items-center justify-center text-[#1a8cff]">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-[#2d3748] mt-3 font-mono">
              {stats.total_articles}
            </div>
            <div className="text-[10px] text-[#718096] mt-1 font-mono">Monitored Across 5 Categories</div>
          </div>

          <div className="neu-flat p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-amber-600 font-bold tracking-wider">
                Drafts Pending
              </span>
              <div className="w-9 h-9 neu-circle flex items-center justify-center text-amber-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-amber-600 mt-3 font-mono">
              {stats.drafts_count}
            </div>
            <div className="text-[10px] text-[#718096] mt-1 font-mono">Ready for Video Generation</div>
          </div>

          <div className="neu-flat p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-[#1a8cff] font-bold tracking-wider">
                Videos Generated
              </span>
              <div className="w-9 h-9 neu-circle flex items-center justify-center text-[#1a8cff]">
                <Video className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-[#1a8cff] mt-3 font-mono">
              {stats.video_ready_count}
            </div>
            <div className="text-[10px] text-[#718096] mt-1 font-mono">60s Shorts Pipeline</div>
          </div>

          <div
            onClick={() => {
              setShowAnalyticsModal(true);
              loadAnalytics();
            }}
            className="neu-flat p-6 flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-transform"
            title="Click to view full audience & views analysis"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-emerald-600 font-bold tracking-wider">
                Total Reads
              </span>
              <div className="w-9 h-9 neu-circle flex items-center justify-center text-emerald-600">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-600 mt-3 font-mono flex items-baseline justify-between">
              <span>{stats.total_views.toLocaleString()}</span>
              <span className="text-[11px] text-[#1a8cff] font-mono font-bold hover:underline">Analyse →</span>
            </div>
            <div className="text-[10px] text-[#718096] mt-1 font-mono flex items-center justify-between">
              <span>Tier-1 Global Audience</span>
              <span className="text-emerald-600 font-semibold">Live Telemetry</span>
            </div>
          </div>
        </section>

        {/* WORKFLOW QUEUE & TABLE */}
        <section className="neu-flat rounded-2xl overflow-hidden mb-12">
          {/* Table Header & Tabs */}
          <div className="p-5 sm:p-6 border-b border-[#b8bec7]/40 bg-[#e0e5ec] flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-[#2d3748] font-serif">
                  Autonomous Editorial & Video Queue
                </h2>
                <p className="text-xs text-[#718096] font-mono mt-0.5">
                  Review synthesized articles, generate 16:9 Long or 9:16 Shorts videos, and syndicate.
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 neu-pressed p-1 rounded-xl text-xs font-mono">
                {["ALL", "DRAFT", "VIDEO_READY", "PUBLISHED"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilterStatus(tab)}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      filterStatus === tab
                        ? "neu-sm text-[#1a8cff] font-bold"
                        : "text-[#718096] hover:text-[#2d3748]"
                    }`}
                  >
                    {tab === "ALL" ? "All Statuses" : tab.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter Tabs Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-[#b8bec7]/30 pt-3">
              <span className="text-[10px] font-mono text-[#718096] uppercase tracking-wider mr-1 font-bold">Category:</span>
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
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono whitespace-nowrap transition cursor-pointer ${
                      isSelected
                        ? "neu-pressed text-[#1a8cff] font-bold"
                        : "neu-sm text-[#718096] hover:text-[#2d3748]"
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5 text-red-600" />}
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Queue Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#e0e5ec] text-[#718096] uppercase font-mono text-[10px] tracking-wider border-b border-[#b8bec7]/40">
                <tr>
                  <th className="py-3 px-5">Headline & Source</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Views</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#b8bec7]/30">
                {filteredArticles.map((art) => {
                  const isLoading = actionLoadingId === art.id;
                  return (
                    <tr
                      key={art.id}
                      className="hover:bg-[#d5dbe4]/40 transition duration-150 group"
                    >
                      {/* Title & Slug */}
                      <td className="py-4 px-5 max-w-md">
                        <div className="font-bold text-[#2d3748] group-hover:text-[#1a8cff] transition text-sm leading-snug">
                          {art.title}
                        </div>
                        <div className="text-[11px] text-[#718096] font-mono mt-1 flex items-center gap-2">
                          <span>{art.source_name || "Reuters Wire"}</span>
                          <span>•</span>
                          <span className="truncate max-w-[200px]">{art.slug}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="neu-sm px-2.5 py-1 text-[10px] font-bold font-mono text-[#1a8cff]">
                          {art.category === "Global Sports" && "🏆 "}
                          {art.category}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          {getStatusBadge(art.status)}
                          {art.youtube_video_id && art.youtube_video_id !== "dQw4w9WgXcQ" ? (
                            <span className="neu-sm inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-red-600 font-mono">
                              <Youtube className="w-2.5 h-2.5 text-red-600" /> YouTube Live
                            </span>
                          ) : art.video_status && ["QUEUED", "VOICEOVER", "COMPOSING_FRAMES", "RENDERING_FFMPEG", "UPLOADING_YOUTUBE"].includes(art.video_status) ? (
                            <span className="neu-pressed inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-[#1a8cff] font-mono">
                              ⚡ {art.video_progress || 5}% ({art.video_eta || "Rendering"})
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Views */}
                      <td className="py-4 px-4 whitespace-nowrap font-mono text-[#718096] font-bold">
                        {art.views.toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedArticle(art);
                              setPreviewTab("article");
                            }}
                            className="neu-sm px-2.5 py-1.5 text-[#2d3748] font-bold text-xs hover:text-[#1a8cff] transition cursor-pointer"
                          >
                            Article
                          </button>

                          <button
                            onClick={() => {
                              setSelectedArticle(art);
                              setPreviewTab("script");
                            }}
                            className="neu-sm flex items-center gap-1 px-2.5 py-1.5 text-purple-700 font-bold text-xs hover:text-purple-800 transition cursor-pointer"
                          >
                            <Video className="w-3.5 h-3.5 text-purple-600" />
                            Script
                          </button>

                          {/* YouTube / Video Action Button */}
                          {art.youtube_video_id && art.youtube_video_id !== "dQw4w9WgXcQ" ? (
                            <div className="inline-flex items-center gap-1.5">
                              <a
                                href={`https://www.youtube.com/shorts/${art.youtube_video_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="neu-btn-primary px-3 py-1.5 text-xs flex items-center gap-1"
                              >
                                <Youtube className="w-3.5 h-3.5 text-white" />
                                <span>Watch ↗</span>
                              </a>
                              <button
                                onClick={() => handleQueueVideo(art.id)}
                                disabled={isLoading}
                                className="neu-sm px-2 py-1.5 text-[#718096] hover:text-[#2d3748] text-xs cursor-pointer"
                              >
                                🔄
                              </button>
                            </div>
                          ) : art.video_status && ["QUEUED", "VOICEOVER", "COMPOSING_FRAMES", "RENDERING_FFMPEG", "UPLOADING_YOUTUBE"].includes(art.video_status) ? (
                            <div className="neu-pressed px-3 py-1.5 text-[#1a8cff] text-xs font-mono font-bold">
                              <span>Rendering: {art.video_progress || 5}%</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleQueueVideo(art.id)}
                              disabled={isLoading}
                              className="neu-btn-primary px-3.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <Play className="w-3.5 h-3.5 text-yellow-300" />
                              <span>🎬 Render & Upload</span>
                            </button>
                          )}

                          {art.status !== "PUBLISHED" && (
                            <button
                              onClick={() => handleInstantPublish(art.id)}
                              disabled={isLoading}
                              className="neu-sm px-2.5 py-1.5 text-emerald-600 hover:text-emerald-700 font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Publish</span>
                            </button>
                          )}

                          {art.status === "PUBLISHED" && (
                            <Link
                              href={`/news/${art.slug}`}
                              target="_blank"
                              className="neu-sm px-2.5 py-1.5 text-[#1a8cff] hover:text-[#0066d6] font-bold text-xs inline-flex items-center gap-1"
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

      {/* NEUMORPHIC PREVIEW MODAL */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="neu-flat bg-[#e0e5ec] text-[#2d3748] w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden rounded-3xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#b8bec7]/40 flex items-center justify-between">
              <div>
                <span className="neu-sm px-2.5 py-0.5 text-[10px] font-mono uppercase font-bold text-[#1a8cff]">
                  {selectedArticle.category} • {selectedArticle.status}
                </span>
                <h3 className="text-lg font-bold text-[#2d3748] font-serif mt-1.5 line-clamp-1">
                  {selectedArticle.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="w-8 h-8 neu-circle flex items-center justify-center text-sm font-bold text-[#718096] hover:text-[#2d3748] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center border-b border-[#b8bec7]/30 px-5 pt-3 gap-3 text-xs font-mono">
              <button
                onClick={() => setPreviewTab("article")}
                className={`pb-2 px-3 font-bold transition cursor-pointer ${
                  previewTab === "article"
                    ? "neu-pressed text-[#1a8cff] rounded-t-lg"
                    : "text-[#718096] hover:text-[#2d3748]"
                }`}
              >
                Full AI Article & TL;DR
              </button>
              <button
                onClick={() => setPreviewTab("script")}
                className={`pb-2 px-3 font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  previewTab === "script"
                    ? "neu-pressed text-[#1a8cff] rounded-t-lg"
                    : "text-[#718096] hover:text-[#2d3748]"
                }`}
              >
                <Video className="w-3.5 h-3.5" /> 60-Sec Shorts Script
              </button>
              <button
                onClick={() => setPreviewTab("metadata")}
                className={`pb-2 px-3 font-bold transition cursor-pointer ${
                  previewTab === "metadata"
                    ? "neu-pressed text-[#1a8cff] rounded-t-lg"
                    : "text-[#718096] hover:text-[#2d3748]"
                }`}
              >
                Metadata & Video Assets
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm text-[#2d3748] leading-relaxed font-sans">
              {previewTab === "article" && (
                <div>
                  <div className="p-4 rounded-xl neu-pressed mb-4">
                    <h5 className="text-xs font-mono font-bold text-[#1a8cff] uppercase mb-2">
                      Key Takeaways (TL;DR):
                    </h5>
                    <p className="whitespace-pre-line text-xs text-[#718096] font-sans">
                      {selectedArticle.summary}
                    </p>
                  </div>
                  <h4 className="text-base font-bold text-[#2d3748] mb-2 font-serif">Article Body</h4>
                  <pre className="p-4 rounded-xl neu-pressed text-[#2d3748] text-xs whitespace-pre-wrap font-sans leading-relaxed">
                    {selectedArticle.content}
                  </pre>
                </div>
              )}

              {previewTab === "script" && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-[#2d3748] font-serif">
                        Automated 60-Second Vertical Shorts Script
                      </h4>
                      <p className="text-[11px] text-[#718096] font-mono">
                        Formatted with hooks, visual prompts, sound effects & CTA
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (selectedArticle.youtube_script) {
                          navigator.clipboard.writeText(selectedArticle.youtube_script);
                          showToast("YouTube Shorts Script copied to clipboard!");
                        }
                      }}
                      className="neu-sm px-3 py-1 text-[#1a8cff] text-xs font-mono font-bold cursor-pointer"
                    >
                      Copy Script
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl neu-pressed text-[#1a8cff] font-mono text-xs whitespace-pre-wrap leading-loose">
                    {selectedArticle.youtube_script || "No YouTube Shorts script generated yet."}
                  </pre>
                </div>
              )}

              {previewTab === "metadata" && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 neu-pressed rounded-xl">
                    <span className="text-[#718096]">SEO Slug:</span>{" "}
                    <span className="text-[#2d3748] font-bold">{selectedArticle.slug}</span>
                  </div>
                  <div className="p-3 neu-pressed rounded-xl">
                    <span className="text-[#718096]">Source Wire:</span>{" "}
                    <span className="text-[#2d3748] font-bold">{selectedArticle.source_name || "Reuters"}</span>
                  </div>
                  <div className="p-3 neu-pressed rounded-xl">
                    <span className="text-[#718096]">YouTube Video ID:</span>{" "}
                    <span className="text-red-600 font-bold font-mono">
                      {selectedArticle.youtube_video_id || "None (Assigned upon upload)"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-[#b8bec7]/40 bg-[#e0e5ec] flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-[#718096] font-mono font-bold">
                Article ID: #{selectedArticle.id}
              </span>

              <div className="flex items-center gap-2">
                {selectedArticle.status !== "PUBLISHED" && (
                  <button
                    onClick={() => handleInstantPublish(selectedArticle.id)}
                    className="neu-btn-primary px-4 py-2 text-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Publish Article
                  </button>
                )}

                {selectedArticle.status === "DRAFT" && (
                  <button
                    onClick={() => handleAutoPublish(selectedArticle.id)}
                    className="neu-btn-primary px-4 py-2 text-xs flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Generate & Publish
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
