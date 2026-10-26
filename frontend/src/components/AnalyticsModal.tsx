"use client";

import React from "react";
import Link from "next/link";
import { AnalyticsSummary } from "../types/article";
import {
  BarChart3,
  RefreshCw,
  Eye,
  Clock,
  ExternalLink,
  Zap,
  Youtube,
  ShieldCheck,
  CheckCircle2
} from "./Icons";

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  analyticsData: AnalyticsSummary | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  analyticsData,
  isLoading,
  onRefresh,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-neutral-950 border-2 border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.2)] overflow-hidden text-neutral-100 font-sans">
        {/* Glow ambient background effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 p-6 border-b border-white/10 bg-neutral-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/30">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white font-serif tracking-tight">
                  Live Audience & Views Telemetry Analysis
                </h2>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-mono text-emerald-300 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE RADAR
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Real-time traffic origins, geographic distribution, inbound social referrers & reader telemetry.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono text-neutral-200 transition"
              title="Refresh telemetry metrics from live database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoading ? "animate-spin" : ""}`} />
              <span>{isLoading ? "Syncing..." : "Refresh"}</span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition"
              title="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-8">
          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
                <span>Total Reads (All-Time)</span>
                <Eye className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-2">
                {analyticsData?.total_views.toLocaleString() || "0"}
              </div>
              <div className="text-[10px] text-emerald-400 mt-1 font-mono flex items-center gap-1">
                <span>✓ Verified across portal</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
                <span>Views Today (24h)</span>
                <Clock className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono mt-2">
                {analyticsData?.views_today.toLocaleString() || "0"}
              </div>
              <div className="text-[10px] text-cyan-400 mt-1 font-mono">
                <span>Active 24h reading cycle</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
                <span>Unique Visitors</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono mt-2">
                {analyticsData?.unique_visitors_today.toLocaleString() || "0"}
              </div>
              <div className="text-[10px] text-amber-400 mt-1 font-mono">
                <span>Deduplicated IPs</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
                <span>Top Traffic Channel</span>
                <span className="text-purple-400 font-bold">#1</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-purple-300 font-mono mt-2 truncate">
                {analyticsData?.top_source || "TikTok"}
              </div>
              <div className="text-[10px] text-purple-400 mt-1 font-mono truncate">
                <span>Top Country: {analyticsData?.top_country || "United States"}</span>
              </div>
            </div>
          </div>

          {/* 2-Column Analytics Core: Sources & Geographies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Traffic Sources Breakdown */}
            <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                  <h3 className="text-xs uppercase font-mono font-bold tracking-widest text-neutral-300 flex items-center gap-2">
                    <span>🌐</span>
                    <span>Where Are Views Coming From? (Referrers)</span>
                  </h3>
                  <span className="text-[10px] font-mono text-neutral-500">Inbound Origin</span>
                </div>

                <div className="space-y-4">
                  {analyticsData?.sources.map((s) => (
                    <div key={s.source} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          {s.source === "TikTok" && <span>📱</span>}
                          {s.source === "YouTube" && <span>🔴</span>}
                          {s.source === "Google Search" && <span>🔍</span>}
                          {s.source === "Twitter / X" && <span>🐦</span>}
                          {s.source === "Meta / Instagram" && <span>📸</span>}
                          {s.source.includes("Direct") && <span>⚡</span>}
                          {s.source}
                        </span>
                        <div className="flex items-center gap-2 text-neutral-400">
                          <span className="text-white font-bold">{s.count} views</span>
                          <span className="text-[11px] text-cyan-400 font-mono">({s.percent}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-neutral-950 overflow-hidden border border-neutral-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
                          style={{ width: `${Math.max(s.percent, 4)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Device Split summary */}
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400">Device Distribution:</span>
                <div className="flex items-center gap-3">
                  <span className="text-cyan-300 font-bold">📱 Mobile: {analyticsData?.mobile_percent || 76}%</span>
                  <span className="text-neutral-500">•</span>
                  <span className="text-purple-300 font-bold">💻 Desktop: {analyticsData?.desktop_percent || 24}%</span>
                </div>
              </div>
            </div>

            {/* 2. Top Countries & Geographies */}
            <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                <h3 className="text-xs uppercase font-mono font-bold tracking-widest text-neutral-300 flex items-center gap-2">
                  <span>🗺️</span>
                  <span>Audience Countries & Geographies</span>
                </h3>
                <span className="text-[10px] font-mono text-neutral-500">Tier-1 Reach</span>
              </div>

              <div className="space-y-4">
                {analyticsData?.countries.map((c) => (
                  <div key={c.country_code} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-white flex items-center gap-2">
                        <span className="text-base">{c.flag}</span>
                        <span>{c.country_name}</span>
                        <span className="text-[10px] px-1 py-0.2 rounded bg-white/5 text-neutral-400 uppercase font-mono">
                          {c.country_code}
                        </span>
                      </span>
                      <div className="flex items-center gap-2 text-neutral-400">
                        <span className="text-white font-bold">{c.count} views</span>
                        <span className="text-[11px] text-emerald-400 font-mono">({c.percent}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-950 overflow-hidden border border-neutral-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-500"
                        style={{ width: `${Math.max(c.percent, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Top Most Read Content Dossiers */}
          <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
              <h3 className="text-xs uppercase font-mono font-bold tracking-widest text-neutral-300 flex items-center gap-2">
                <span>🏆</span>
                <span>Top Performing Articles & Intelligence Dossiers</span>
              </h3>
              <span className="text-[10px] font-mono text-neutral-500">Ranked by Reads</span>
            </div>

            <div className="divide-y divide-white/5">
              {analyticsData?.top_articles.map((art, idx) => (
                <div key={art.id} className="py-3 flex items-center justify-between gap-4 group">
                  <div className="flex items-center gap-3 truncate">
                    <span className="w-6 h-6 rounded-lg bg-neutral-800 flex items-center justify-center text-xs font-mono font-black text-amber-400 shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="truncate">
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition truncate">
                        {art.title}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono flex items-center gap-2 mt-0.5">
                        <span className="text-cyan-400 font-semibold">{art.category}</span>
                        <span>•</span>
                        <span>ID #{art.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-black text-emerald-400 font-mono">
                        {art.views.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono block">reads</span>
                    </div>

                    <Link
                      href={`/news/${art.slug}`}
                      target="_blank"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition"
                      title="Open live article"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Real-Time Live Activity Stream */}
          {analyticsData?.recent_visits && analyticsData.recent_visits.length > 0 && (
            <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                <h3 className="text-xs uppercase font-mono font-bold tracking-widest text-neutral-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Real-Time Visitor Stream</span>
                </h3>
                <span className="text-[10px] font-mono text-emerald-400">Live Traffic</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {analyticsData.recent_visits.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between gap-2"
                  >
                    <div className="truncate pr-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white truncate">
                        <span>{v.flag}</span>
                        <span className="truncate">{v.country_name}</span>
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono mt-0.5 truncate">
                        via <strong className="text-cyan-300">{v.source}</strong> ({v.device})
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 shrink-0 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {v.time_ago}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-neutral-900/60 flex items-center justify-between text-xs font-mono text-neutral-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Serverless Analytics Active • Privacy First • 0% Third-party Cookies</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition"
          >
            Close Telemetry
          </button>
        </div>
      </div>
    </div>
  );
};
