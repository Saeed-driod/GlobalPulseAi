"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { fetchAdSettings, AdSettings } from "../lib/api";
import { Sparkles, Youtube, ExternalLink, ShieldCheck } from "./Icons";

export type AdSlotType = "leaderboard" | "in-feed" | "sidebar";

interface AdSlotProps {
  type: AdSlotType;
  className?: string;
  fallbackTitle?: string;
}

export function AdSlot({ type, className = "", fallbackTitle }: AdSlotProps) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [adSettings, setAdSettings] = useState<AdSettings | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [scriptRendered, setScriptRendered] = useState<boolean>(false);

  // 1. Strict Exclusion: Never render ads inside /admin or /dashboard
  const isExcludedRoute = pathname ? pathname.startsWith("/admin") || pathname.startsWith("/dashboard") : false;

  // 2. Fetch Ad Settings once
  useEffect(() => {
    if (isExcludedRoute) return;
    let isMounted = true;
    fetchAdSettings().then((settings) => {
      if (isMounted) setAdSettings(settings);
    });
    return () => {
      isMounted = false;
    };
  }, [isExcludedRoute]);

  // 3. Lazy-loading with IntersectionObserver for PageSpeed 90+ & Zero CLS
  useEffect(() => {
    if (isExcludedRoute) return;
    const element = containerRef.current;
    if (!element) return;

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "300px 0px", // Preload slightly before viewport
        threshold: 0.01,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [isExcludedRoute]);

  // 4. Safely inject & execute ad script when visible
  useEffect(() => {
    if (!isVisible || scriptRendered || isExcludedRoute || !adSettings) return;
    if (!adSettings.master_enabled) return;

    let targetScriptCode = "";
    if (type === "leaderboard") targetScriptCode = adSettings.adsterra_header_banner || "";
    else if (type === "in-feed") targetScriptCode = adSettings.adsterra_infeed_banner || "";
    else if (type === "sidebar") targetScriptCode = adSettings.adsterra_sidebar_banner || "";

    const raw = targetScriptCode.trim();
    if (!raw) return;

    const container = containerRef.current;
    if (!container) return;

    // Clear placeholder content
    const adTargetBox = container.querySelector(".ad-script-mount");
    if (!adTargetBox) return;

    adTargetBox.innerHTML = "";

    try {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = raw;

      // Extract non-script nodes
      const nonScripts = Array.from(tempDiv.childNodes).filter((n) => n.nodeName !== "SCRIPT");
      nonScripts.forEach((n) => {
        adTargetBox.appendChild(n.cloneNode(true));
      });

      // Extract and safely execute <script> nodes
      const scripts = tempDiv.querySelectorAll("script");
      scripts.forEach((oldScript) => {
        const newScript = document.createElement("script");
        newScript.async = true;
        for (let i = 0; i < oldScript.attributes.length; i++) {
          const attr = oldScript.attributes[i];
          newScript.setAttribute(attr.name, attr.value);
        }
        if (oldScript.innerHTML) {
          newScript.innerHTML = oldScript.innerHTML;
        }
        adTargetBox.appendChild(newScript);
      });

      setScriptRendered(true);
    } catch (err) {
      console.warn(`[AdSlot ${type} Injection Error]:`, err);
    }
  }, [isVisible, scriptRendered, isExcludedRoute, adSettings, type]);

  if (isExcludedRoute) return null;
  if (adSettings && !adSettings.master_enabled) return null;

  const hasConfiguredScript = Boolean(
    adSettings &&
      ((type === "leaderboard" && adSettings.adsterra_header_banner?.trim()) ||
        (type === "in-feed" && adSettings.adsterra_infeed_banner?.trim()) ||
        (type === "sidebar" && adSettings.adsterra_sidebar_banner?.trim()))
  );

  // =========================================================================
  // TYPE 1: TOP LEADERBOARD BANNER (728x90 Desktop / 320x50 Mobile)
  // =========================================================================
  if (type === "leaderboard") {
    return (
      <aside
        ref={containerRef}
        aria-label="Advertisement Banner"
        className={`w-full max-w-5xl mx-auto px-4 my-4 flex flex-col items-center justify-center ${className}`}
      >
        <div className="w-full flex items-center justify-between max-w-[728px] mb-1 px-1">
          <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50" />
            Sponsored Display
          </span>
          <span className="text-[9px] font-mono text-slate-600">Adsterra Golden Network</span>
        </div>

        <div className="w-full min-h-[50px] md:min-h-[90px] max-w-[728px] rounded-xl border border-slate-800/80 bg-slate-900/60 flex items-center justify-center overflow-hidden relative shadow-lg">
          <div className="ad-script-mount w-full flex items-center justify-center">
            {!hasConfiguredScript && (
              <div className="py-3 px-4 flex flex-col md:flex-row items-center justify-between w-full gap-3 text-center md:text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
                    <Youtube className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">Watch GlobalPulse AI Breaking News Shorts</p>
                    <p className="text-[11px] text-slate-400">Streamed 24/7 with neural analysis & high-impact summaries</p>
                  </div>
                </div>
                <a
                  href="https://www.youtube.com/@GloblePulseAi?sub_confirmation=1"
                  target="_blank"
                  rel="nofollow noopener sponsored"
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-red-600/20"
                >
                  <span>Subscribe Channel</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      </aside>
    );
  }

  // =========================================================================
  // TYPE 2: IN-FEED NATIVE AD CARD (Every 4th/5th item, site theme styled)
  // =========================================================================
  if (type === "in-feed") {
    return (
      <article
        ref={containerRef}
        aria-label="Sponsored In-Feed Content"
        className={`col-span-full w-full rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-900/95 p-5 md:p-6 shadow-2xl relative overflow-hidden backdrop-blur-sm my-4 transition hover:border-cyan-500/50 ${className}`}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              Sponsored
            </span>
            <span className="text-xs text-slate-400 font-mono">Recommended by Network</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Verified Partner</span>
        </div>

        <div className="ad-script-mount min-h-[140px] flex items-center justify-center">
          {!hasConfiguredScript && (
            <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4 py-2">
              <div className="space-y-1">
                <h4 className="text-sm md:text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>{fallbackTitle || "Explore Global Opportunities with GlobalHire AI"}</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </h4>
                <p className="text-xs text-slate-400 max-w-xl">
                  Connect with worldwide remote roles, AI engineering, and tech leadership opportunities with fast-track direct application.
                </p>
              </div>
              <a
                href="https://globalhireai.vercel.app"
                target="_blank"
                rel="nofollow noopener sponsored"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold transition flex items-center gap-2 whitespace-nowrap shadow-lg shadow-cyan-600/30"
              >
                <span>Browse Remote Jobs</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </article>
    );
  }

  // =========================================================================
  // TYPE 3: STICKY SIDEBAR AD (300x250 / 160x600 Desktop Detail Pages)
  // =========================================================================
  return (
    <aside
      ref={containerRef}
      aria-label="Sidebar Advertisement"
      className={`w-full max-w-[300px] mx-auto sticky top-24 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 shadow-xl backdrop-blur-sm ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/40" />
          Sponsored Desk
        </span>
        <span className="text-[9px] font-mono text-slate-600">300x250</span>
      </div>

      <div className="w-[300px] min-h-[250px] mx-auto rounded-xl border border-slate-800/60 bg-slate-950/60 flex items-center justify-center overflow-hidden">
        <div className="ad-script-mount w-full flex items-center justify-center p-2">
          {!hasConfiguredScript && (
            <div className="text-center p-4 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h5 className="text-xs font-bold text-slate-200">GlobalPulse AI Daily Intelligence</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Stay ahead of global market shifts and AI breakthroughs with instant alerts.
              </p>
              <a
                href="https://www.youtube.com/@GloblePulseAi?sub_confirmation=1"
                target="_blank"
                rel="nofollow noopener sponsored"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition w-full shadow-md shadow-cyan-600/20"
              >
                <span>Join Global Network</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
