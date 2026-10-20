"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Article, AdminStats } from "../../types/article";
import {
  fetchArticles,
  fetchAdminStats,
  triggerFetchNow,
  generateVideo,
  publishArticle,
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
  const [videoFormatMode, setVideoFormatMode] = useState<"long" | "short">("long");

  const handleAuthYouTube = () => {
    showToast("Launching Google YouTube sign-in window...");
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
      showToast("YouTube Channel EduHubbySaeed successfully connected!");
    }
  }, []);

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
    const res = await triggerFetchNow();
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

  const handleAutoPublish = async (id: number) => {
    setActionLoadingId(id);
    const res = await autoPublishArticle(id, videoFormatMode);
    setActionLoadingId(null);
    if (res.success) {
      showToast(res.message);
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
    const matchesCategory = filterCategory === "ALL" || a.category === filterCategory;
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
                title="Channel EduHubbySaeed is connected and authorized for automated Shorts publishing"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <Youtube className="w-4 h-4 text-red-500" />
                <span>Connected: {ytAuthStatus.channel || "EduHubbySaeed"}</span>
              </div>
            ) : (
              <button
                onClick={handleAuthYouTube}
                disabled={authorizingYouTube}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-bold text-xs shadow-lg transition duration-150"
                title="Test interactive OAuth2 login and connect YouTube channel (EduHubbySaeed)"
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
              <span className="text-red-400 font-semibold">EduHubbySaeed</span>
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

          <div className="p-6 rounded-2xl glass-panel hover:border-emerald-500/30 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-emerald-400 font-semibold tracking-wider">
                Total Platform Reads
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-300 mt-2 font-mono">
              {stats.total_views.toLocaleString()}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1 font-mono">Tier-1 Global Audience</div>
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
                { name: "Geopolitics", label: "Geopolitics" },
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
                            : art.category === "Geopolitics"
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
                        {getStatusBadge(art.status)}
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
                            Shorts Script
                          </button>


                          {/* 1-Click Automated Pipeline: Generate Video & Publish to YouTube */}
                          {art.status === "DRAFT" && (
                            <button
                              onClick={() => handleAutoPublish(art.id)}
                              disabled={isLoading}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs shadow-md shadow-red-600/20 transition disabled:opacity-50"
                              title={`Automated Pipeline: 1. Generate ${videoFormatMode === "long" ? "16:9 1080p Video" : "9:16 Shorts"} -> 2. Upload to YouTube -> 3. Mark as Published`}
                            >
                              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                              {isLoading ? "Running Pipeline..." : `Generate Video & Publish (${videoFormatMode === "long" ? "16:9 HD" : "Shorts"})`}
                            </button>
                          )}

                          {/* Separate Generate Video Action */}
                          {art.status === "DRAFT" && (
                            <button
                              onClick={() => handleGenerateVideo(art.id)}
                              disabled={isLoading}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-900/60 hover:bg-cyan-800 text-cyan-300 border border-cyan-500/30 font-semibold text-xs transition disabled:opacity-50"
                              title={`Render ${videoFormatMode === "long" ? "16:9 Widescreen HD Video" : "9:16 Vertical Short"}`}
                            >
                              <Video className="w-3 h-3" />
                              {isLoading ? "..." : `Video (${videoFormatMode === "long" ? "16:9" : "9:16"})`}
                            </button>
                          )}

                          {/* Approve & Publish Action for Video Ready */}
                          {art.status === "VIDEO_READY" && (
                            <button
                              onClick={() => handlePublish(art.id)}
                              disabled={isLoading}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {isLoading ? "Publishing..." : `Publish to YouTube (${videoFormatMode === "long" ? "16:9 HD" : "Shorts"}) & Portal`}
                            </button>
                          )}


                          {art.status === "PUBLISHED" && (
                            <Link
                              href={`/news/${art.slug}`}
                              target="_blank"
                              className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-400 font-semibold text-xs border border-neutral-700 transition inline-flex items-center gap-1"
                            >
                              View Live <ExternalLink className="w-3 h-3" />
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
    </div>
  );
}
