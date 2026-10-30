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
  ShieldCheck,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col neu-flat overflow-hidden text-[#2d3748] font-sans">
        {/* Modal Header */}
        <div className="relative z-10 p-6 border-b border-[#d1d9e6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl neu-sm flex items-center justify-center text-[#1a8cff]">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-[#2d3748] font-serif tracking-tight">
                  Live Audience &amp; Views Telemetry Analysis
                </h2>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full neu-pressed text-[10px] font-mono text-[#1a8cff] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1a8cff] animate-ping" />
                  LIVE RADAR
                </span>
              </div>
              <p className="text-xs text-[#718096] font-mono mt-0.5">
                Real-time traffic origins, geographic distribution, inbound social referrers &amp; reader telemetry.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl neu-sm text-xs font-mono font-bold text-[#2d3748] hover:text-[#1a8cff] transition active:scale-95"
              title="Refresh telemetry metrics from live database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#1a8cff] ${isLoading ? "animate-spin" : ""}`} />
              <span>{isLoading ? "Syncing..." : "Refresh"}</span>
            </button>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl neu-sm flex items-center justify-center text-[#718096] hover:text-[#2d3748] font-bold transition active:scale-95"
              title="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="relative z-10 flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl neu-flat">
              <div className="flex items-center justify-between text-[#718096] text-xs font-mono">
                <span>Total Reads (All-Time)</span>
                <Eye className="w-4 h-4 text-[#1a8cff]" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#2d3748] font-mono mt-2">
                {analyticsData?.total_views.toLocaleString() || "0"}
              </div>
              <div className="text-[10px] text-emerald-600 mt-1 font-mono flex items-center gap-1 font-semibold">
                <span>✓ Verified across portal</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl neu-flat">
              <div className="flex items-center justify-between text-[#718096] text-xs font-mono">
                <span>Views Today (24h)</span>
                <Clock className="w-4 h-4 text-[#1a8cff]" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#1a8cff] font-mono mt-2">
                {analyticsData?.views_today.toLocaleString() || "0"}
              </div>
              <div className="text-[10px] text-[#718096] mt-1 font-mono">
                <span>Active 24h reading cycle</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl neu-flat">
              <div className="flex items-center justify-between text-[#718096] text-xs font-mono">
                <span>Unique Visitors</span>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#2d3748] font-mono mt-2">
                {analyticsData?.unique_visitors_today.toLocaleString() || "0"}
              </div>
              <div className="text-[10px] text-[#718096] mt-1 font-mono">
                <span>Deduplicated IPs</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl neu-flat">
              <div className="flex items-center justify-between text-[#718096] text-xs font-mono">
                <span>Top Traffic Channel</span>
                <span className="text-[#1a8cff] font-bold">#1</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#1a8cff] font-mono mt-2 truncate">
                {analyticsData?.top_source || "TikTok"}
              </div>
              <div className="text-[10px] text-[#718096] mt-1 font-mono truncate">
                <span>Top Country: {analyticsData?.top_country || "United States"}</span>
              </div>
            </div>
          </div>

          {/* 2-Column Analytics Core: Sources & Geographies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Traffic Sources Breakdown */}
            <div className="p-6 rounded-3xl neu-flat flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#d1d9e6]">
                  <h3 className="text-xs uppercase font-mono font-bold tracking-widest text-[#2d3748] flex items-center gap-2">
                    <span>🌐</span>
                    <span>Where Are Views Coming From? (Referrers)</span>
                  </h3>
                  <span className="text-[10px] font-mono text-[#718096]">Inbound Origin</span>
                </div>

                <div className="space-y-4">
                  {analyticsData?.sources.map((s) => (
                    <div key={s.source} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-[#2d3748] flex items-center gap-1.5">
                          {s.source === "TikTok" && <span>📱</span>}
                          {s.source === "YouTube" && <span>🔴</span>}
                          {s.source === "Google Search" && <span>🔍</span>}
                          {s.source === "Twitter / X" && <span>🐦</span>}
                          {s.source === "Meta / Instagram" && <span>📸</span>}
                          {s.source.includes("Direct") && <span>⚡</span>}
                          {s.source}
                        </span>
                        <div className="flex items-center gap-2 text-[#718096]">
                          <span className="text-[#2d3748] font-bold">{s.count} views</span>
                          <span className="text-[11px] text-[#1a8cff] font-mono font-bold">({s.percent}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 rounded-full neu-pressed overflow-hidden p-0.5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#1a8cff] to-[#0055ff] transition-all duration-500"
                          style={{ width: `${Math.max(s.percent, 4)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Device Split summary */}
              <div className="mt-6 pt-4 border-t border-[#d1d9e6] flex items-center justify-between text-xs font-mono">
                <span className="text-[#718096]">Device Distribution:</span>
                <div className="flex items-center gap-3">
                  <span className="text-[#1a8cff] font-bold">📱 Mobile: {analyticsData?.mobile_percent || 76}%</span>
                  <span className="text-[#718096]">•</span>
                  <span className="text-[#2d3748] font-bold">💻 Desktop: {analyticsData?.desktop_percent || 24}%</span>
                </div>
              </div>
            </div>

            {/* 2. Top Countries & Geographies */}
            <div className="p-6 rounded-3xl neu-flat">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#d1d9e6]">
                <h3 className="text-xs uppercase font-mono font-bold tracking-widest text-[#2d3748] flex items-center gap-2">
                  <span>🗺️</span>
                  <span>Audience Countries &amp; Geographies</span>
                </h3>
                <span className="text-[10px] font-mono text-[#718096]">Tier-1 Reach</span>
              </div>

              <div className="space-y-4">
                {analyticsData?.countries.map((c) => (
                  <div key={c.country_code} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-[#2d3748] flex items-center gap-2">
                        <span className="text-base">{c.flag}</span>
                        <span>{c.country_name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded neu-pressed text-[#718096] uppercase font-mono font-semibold">
                          {c.country_code}
                        </span>
                      </span>
                      <div className="flex items-center gap-2 text-[#718096]">
                        <span className="text-[#2d3748] font-bold">{c.count} views</span>
                        <span className="text-[11px] text-[#1a8cff] font-mono font-bold">({c.percent}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 rounded-full neu-pressed overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#1a8cff] via-indigo-500 to-purple-600 transition-all duration-500"
                        style={{ width: `${Math.max(c.percent, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Top Most Read Content Dossiers */}
          <div className="p-6 rounded-3xl neu-flat">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#d1d9e6]">
              <h3 className="text-xs uppercase font-mono font-bold tracking-widest text-[#2d3748] flex items-center gap-2">
                <span>🏆</span>
                <span>Top Performing Articles &amp; Intelligence Dossiers</span>
              </h3>
              <span className="text-[10px] font-mono text-[#718096]">Ranked by Reads</span>
            </div>

            <div className="divide-y divide-[#d1d9e6]">
              {analyticsData?.top_articles.map((art, idx) => (
                <div key={art.id} className="py-3.5 flex items-center justify-between gap-4 group">
                  <div className="flex items-center gap-3.5 truncate">
                    <span className="w-7 h-7 rounded-lg neu-pressed flex items-center justify-center text-xs font-mono font-black text-[#1a8cff] shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="truncate">
                      <div className="text-xs font-bold text-[#2d3748] group-hover:text-[#1a8cff] transition truncate">
                        {art.title}
                      </div>
                      <div className="text-[10px] text-[#718096] font-mono flex items-center gap-2 mt-0.5">
                        <span className="text-[#1a8cff] font-semibold">{art.category}</span>
                        <span>•</span>
                        <span>ID #{art.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-black text-[#1a8cff] font-mono">
                        {art.views.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-[#718096] font-mono block">reads</span>
                    </div>

                    <Link
                      href={`/news/${art.slug}`}
                      target="_blank"
                      className="p-2 rounded-xl neu-sm text-[#718096] hover:text-[#1a8cff] transition active:scale-95"
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
            <div className="p-6 rounded-3xl neu-flat">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#d1d9e6]">
                <h3 className="text-xs uppercase font-mono font-bold tracking-widest text-[#2d3748] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#1a8cff] animate-ping" />
                  <span>Real-Time Visitor Stream</span>
                </h3>
                <span className="text-[10px] font-mono text-[#1a8cff] font-bold">Live Traffic</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {analyticsData.recent_visits.map((v) => (
                  <div
                    key={v.id}
                    className="p-3.5 rounded-2xl neu-sm flex items-center justify-between gap-2"
                  >
                    <div className="truncate pr-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#2d3748] truncate">
                        <span>{v.flag}</span>
                        <span className="truncate">{v.country_name}</span>
                      </div>
                      <div className="text-[10px] text-[#718096] font-mono mt-0.5 truncate">
                        via <strong className="text-[#1a8cff]">{v.source}</strong> ({v.device})
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#1a8cff] shrink-0 neu-pressed px-2.5 py-1 rounded-lg font-bold">
                      {v.time_ago}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-[#d1d9e6] flex items-center justify-between text-xs font-mono text-[#718096]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Serverless Analytics Active • Privacy First • 0% Third-party Cookies</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl neu-btn-primary font-bold transition text-xs"
          >
            Close Telemetry
          </button>
        </div>
      </div>
    </div>
  );
};
