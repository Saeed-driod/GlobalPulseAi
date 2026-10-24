"use client";

import React, { useEffect, useState } from "react";
import { Youtube, ExternalLink, Sparkles } from "./Icons";
import { AdsterraBanner } from "./AdsterraBanner";

export { AdsterraBanner };

export type AdSlot = "header" | "in-article" | "sidebar" | "sticky-footer";

interface AdBannerProps {
  slot: AdSlot;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ slot, className = "" }) => {
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const channelUrl = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL || "https://www.youtube.com/@GloblePulseAi";
  const channelName = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_NAME || "GlobalPulse AI";

  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    if (adsenseClientId && typeof window !== "undefined") {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (err) {
        console.warn("AdSense push error:", err);
      }
    }
  }, [adsenseClientId]);

  // If real AdSense client ID is configured, render real Google AdSense unit
  if (adsenseClientId) {
    const slotMap: Record<AdSlot, string> = {
      header: "1234567890",
      "in-article": "2345678901",
      sidebar: "3456789012",
      "sticky-footer": "4567890123",
    };

    return (
      <div className={`ad-container my-6 flex flex-col items-center overflow-hidden ${className}`}>
        <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase mb-1">
          Advertisement
        </span>
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={adsenseClientId}
          data-ad-slot={slotMap[slot]}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // HOUSE AD FALLBACK: Promoting "GlobalPulse AI" YouTube Channel
  // -------------------------------------------------------------

  if (slot === "header") {
    return (
      <div className={`w-full my-6 flex flex-col items-center ${className}`}>
        {/* Adsterra 728x90 Leaderboard Unit */}
        <AdsterraBanner size="728x90" label="Sponsored Leaderboard" />
      </div>
    );
  }

  if (slot === "in-article") {
    return (
      <div className={`my-8 flex flex-col items-center ${className}`}>
        <AdsterraBanner label="Sponsored Intelligence" />
      </div>
    );
  }

  if (slot === "sidebar") {
    return (
      <div className={`flex flex-col items-center space-y-6 ${className}`}>
        {/* Adsterra 300x250 Medium Rectangle Unit */}
        <AdsterraBanner label="Sponsored Partner" />

        <div className="w-full max-w-[340px] bg-gradient-to-b from-neutral-900 via-neutral-900 to-red-950/30 border border-neutral-800 hover:border-red-500/30 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group shadow-xl transition">
          <div className="absolute top-0 right-0 w-28 h-28 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-red-600/30 group-hover:rotate-3 transition">
              <Youtube className="w-7 h-7" />
            </div>

            <span className="text-[11px] font-bold text-red-400 uppercase tracking-widest font-mono">
              YouTube Masterclasses
            </span>
            <h3 className="text-xl font-black text-white mt-2 leading-tight font-serif">
              {channelName}
            </h3>
            <p className="text-xs text-neutral-300 mt-3 leading-relaxed">
              Accelerate your engineering and AI skills with high-yield tutorials, project breakdowns, and tech news summaries.
            </p>

            <div className="mt-5 space-y-2.5 text-xs text-neutral-300 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Modern Web & Next.js Architecture</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span>Gemini & AI Agent Pipelines</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Python & FastAPI Automation</span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-neutral-800">
            <a
              href={channelUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-red-600/30"
            >
              <Youtube className="w-4 h-4" />
              <span>Join Channel On YouTube</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // slot === "sticky-footer"
  if (dismissed) return null;

  return (
    <aside
      aria-label="Sponsored Announcement"
      className={`fixed bottom-0 inset-x-0 z-40 bg-neutral-900/95 border-t border-neutral-800 backdrop-blur-md px-4 py-3 shadow-2xl ${className}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shrink-0">
            <Youtube className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="text-neutral-400">Sponsored Channel: </span>
            <span className="text-white font-bold">{channelName}</span>
            <span className="text-neutral-400 hidden sm:inline">
              {" "}
              — Subscribe for daily AI development masterclasses & tech insights!
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href={channelUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow"
          >
            <span>Subscribe Free</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={() => setDismissed(true)}
            className="text-neutral-400 hover:text-white text-xs font-mono px-2 py-1 transition"
            title="Dismiss banner"
          >
            ✕
          </button>
        </div>
      </div>
    </aside>
  );
};

// Re-export alias for backward compatibility with AdSenseBanner
export const AdSenseBanner: React.FC<{
  format: "leaderboard" | "in-article" | "sidebar";
  className?: string;
}> = ({ format, className = "" }) => {
  const slotMap: Record<string, AdSlot> = {
    leaderboard: "header",
    "in-article": "in-article",
    sidebar: "sidebar",
  };
  return <AdBanner slot={slotMap[format] || "header"} className={className} />;
};
