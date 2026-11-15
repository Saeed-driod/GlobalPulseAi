"use client";

import React, { useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  ADS_CONFIG,
  ARTICLE_MODAL_300x250_KEY,
  ARTICLE_MODAL_300x250_SCRIPT_URL,
  TOP_LEADERBOARD_728x90_KEY,
} from "../config/adsConfig";

export type AdUnitType = "leaderboard" | "in-feed" | "native" | "sidebar" | "rectangle" | "modal";

export interface AdUnitProps {
  type: AdUnitType;
  className?: string;
  zoneKey?: string;
  scriptUrl?: string;
  width?: number;
  height?: number;
}

/**
 * AdUnit - Sandboxed srcDoc iframe Component for Adsterra & Multi-Network Banners
 * 
 * - Eliminates window.atOptions variable overwrite collisions by giving each ad slot its own
 *   isolated window execution context inside a sandboxed srcDoc iframe.
 * - Completely immune to React StrictMode double-rendering and client-side SPA routing.
 * - Automatically collapses to 0px if ads are disabled or keys are unconfigured.
 * - Excluded on /admin and /dashboard.
 */
export const AdUnit: React.FC<AdUnitProps> = ({
  type,
  className = "",
  zoneKey: customZoneKey,
  scriptUrl: customScriptUrl,
  width: customWidth,
  height: customHeight,
}) => {
  const pathname = usePathname();

  // Strict route exclusion: Never show ads on administrative routes
  const isExcludedRoute = pathname ? pathname.startsWith("/admin") || pathname.startsWith("/dashboard") : false;

  // Resolve dimensions, keys, and script sources based on ad slot type
  let effectiveKey = customZoneKey || "";
  let effectiveScriptUrl = customScriptUrl || "";
  let width = customWidth || 300;
  let height = customHeight || 250;
  let zoneLabel = "Adsterra 300x250";

  if (type === "leaderboard") {
    effectiveKey = effectiveKey || TOP_LEADERBOARD_728x90_KEY;
    width = customWidth || 728;
    height = customHeight || 90;
    zoneLabel = "Top Leaderboard 728x90";
    if (!effectiveScriptUrl && effectiveKey) {
      effectiveScriptUrl = `https://www.highperformanceformat.com/${effectiveKey}/invoke.js`;
    }
  } else {
    // In-Feed (every 6th news card), Article Reading View, Sticky Sidebar, and AI Modal
    effectiveKey = effectiveKey || ARTICLE_MODAL_300x250_KEY || "f7126291d68f9df3872005cf005de9aa";
    effectiveScriptUrl = effectiveScriptUrl || ARTICLE_MODAL_300x250_SCRIPT_URL || "https://bauval.org/22/f7126291d68f9df3872005cf005de9aa";
    width = customWidth || 300;
    height = customHeight || 250;
    zoneLabel = type === "in-feed" ? "In-Feed Adsterra 300x250" : "Article Modal Adsterra 300x250";
  }

  const hasKey = Boolean(effectiveKey && effectiveKey.trim() && !effectiveKey.includes("PASTE_"));

  // Build isolated sandboxed srcDoc document for conflict-free script execution
  const srcDocHtml = useMemo(() => {
    if (!hasKey || !effectiveScriptUrl) return "";

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base target="_blank">
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: transparent;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  <script type="text/javascript">
    atOptions = {
      'key' : '${effectiveKey}',
      'format' : 'iframe',
      'height' : ${height},
      'width' : ${width},
      'params' : {}
    };
  </script>
  <script type="text/javascript" src="${effectiveScriptUrl}"></script>
</body>
</html>`;
  }, [effectiveKey, effectiveScriptUrl, width, height, hasKey]);

  // If excluded, ads globally disabled, or key missing, collapse cleanly with zero DOM space
  if (isExcludedRoute || !ADS_CONFIG.ENABLE_ADS || !hasKey) {
    return null;
  }

  return (
    <div
      className={`ad-unit-wrapper flex flex-col items-center justify-center my-4 transition-all duration-300 ${className}`}
      data-ad-zone={zoneLabel}
    >
      <div className="flex items-center justify-between w-full px-1 mb-1" style={{ maxWidth: `${width}px` }}>
        <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50" />
          Sponsored
        </span>
        <span className="text-[9px] font-mono text-slate-600">Adsterra Network</span>
      </div>

      <div
        className="ad-unit-card rounded-xl border border-slate-800/80 bg-slate-900/60 p-1 flex items-center justify-center overflow-hidden shadow-lg"
        style={{ width: `${width + 10}px`, minHeight: `${height + 10}px`, maxWidth: "100%" }}
      >
        <iframe
          srcDoc={srcDocHtml}
          width={width}
          height={height}
          scrolling="no"
          frameBorder="0"
          style={{ border: "none", overflow: "hidden", display: "block", maxWidth: "100%" }}
          title={`Adsterra ${zoneLabel}`}
        />
      </div>
    </div>
  );
};

export default AdUnit;
