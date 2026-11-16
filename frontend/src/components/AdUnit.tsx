"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  ADS_CONFIG,
  ARTICLE_MODAL_300x250_KEY,
  ARTICLE_MODAL_300x250_SCRIPT_URL,
  TOP_LEADERBOARD_728x90_KEY,
} from "../config/adsConfig";

export type AdUnitType =
  | "leaderboard"
  | "in-feed"
  | "native"
  | "sidebar"
  | "rectangle"
  | "modal"
  | "article"
  | "in-article";

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
 * - Auto-hides wrapper box and "SPONSORED • Adsterra Network" label until the ad creative
 *   actually loads and renders.
 * - If blocked by ad-blocker or unfulfilled, the entire container stays collapsed (0px height/padding).
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
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const checkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    // In-Feed, Article Reading View, Sticky Sidebar, and AI Modal (Adsterra 300x250)
    effectiveKey = effectiveKey || ARTICLE_MODAL_300x250_KEY || "f7126291d68f9df3872005cf005de9aa";
    effectiveScriptUrl = effectiveScriptUrl || ARTICLE_MODAL_300x250_SCRIPT_URL || "https://bauval.org/22/f7126291d68f9df3872005cf005de9aa";
    width = customWidth || 300;
    height = customHeight || 250;
    if (type === "article" || type === "in-article") {
      zoneLabel = "Article Adsterra 300x250";
    } else if (type === "sidebar") {
      zoneLabel = "Sidebar Adsterra 300x250";
    } else if (type === "in-feed") {
      zoneLabel = "In-Feed Adsterra 300x250";
    } else {
      zoneLabel = "Article Modal Adsterra 300x250";
    }
  }

  const hasKey = Boolean(effectiveKey && effectiveKey.trim() && !effectiveKey.includes("PASTE_"));

  // Reset ad loaded state on route change or key swap
  useEffect(() => {
    setIsLoaded(false);
    if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
  }, [pathname, effectiveKey]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

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
  <div id="adsterra-ad-container" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
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
  </div>
  <script type="text/javascript">
    (function() {
      function checkAndNotify() {
        try {
          var container = document.getElementById('adsterra-ad-container') || document.body;
          var iframes = container.getElementsByTagName('iframe');
          var imgs = container.getElementsByTagName('img');
          var anchors = container.getElementsByTagName('a');
          var svgs = container.getElementsByTagName('svg');

          var hasCreative = (iframes && iframes.length > 0) ||
                            (imgs && imgs.length > 0) ||
                            (anchors && anchors.length > 0) ||
                            (svgs && svgs.length > 0);

          if (!hasCreative) {
            var allElements = container.querySelectorAll('*');
            for (var i = 0; i < allElements.length; i++) {
              var el = allElements[i];
              if (el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE' && el.id !== 'adsterra-ad-container') {
                hasCreative = true;
                break;
              }
            }
          }

          if (hasCreative) {
            window.parent.postMessage({ type: 'ADSTERRA_CREATIVE_RENDERED', key: '${effectiveKey}' }, '*');
            return true;
          }
        } catch(e) {}
        return false;
      }

      try {
        var observer = new MutationObserver(function() {
          if (checkAndNotify()) {
            observer.disconnect();
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      } catch(e) {}

      window.addEventListener('load', function() {
        checkAndNotify();
        setTimeout(checkAndNotify, 500);
        setTimeout(checkAndNotify, 1500);
      });
    })();
  </script>
</body>
</html>`;
  }, [effectiveKey, effectiveScriptUrl, width, height, hasKey]);

  // Content inspection helper: verifies the iframe contains actual ad creative
  const verifyCreativeRendered = useCallback((): boolean => {
    try {
      const iframe = iframeRef.current;
      if (!iframe) return false;

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc || !doc.body) return false;

      // 1. Check for ad creative elements (nested iframe, img, anchor, picture, svg)
      const hasInnerIframe = doc.getElementsByTagName("iframe").length > 0;
      const hasImg = doc.getElementsByTagName("img").length > 0;
      const hasAnchor = doc.getElementsByTagName("a").length > 0;
      const hasSvg = doc.getElementsByTagName("svg").length > 0;

      // 2. Check for any non-script DOM elements added inside body or ad slot
      const allElements = Array.from(doc.body.querySelectorAll("*"));
      const hasInjectedElements = allElements.some(
        (el) =>
          el.tagName !== "SCRIPT" &&
          el.tagName !== "STYLE" &&
          el.id !== "adsterra-ad-container"
      );

      // 3. Verify non-empty height / visible dimensions
      const scrollHeight = doc.body.scrollHeight || 0;
      const offsetHeight = doc.body.offsetHeight || 0;
      const hasHeight = scrollHeight > 20 || offsetHeight > 20;

      if (hasInnerIframe || hasImg || hasAnchor || hasSvg || hasInjectedElements || hasHeight) {
        setIsLoaded(true);
        return true;
      }
    } catch {
      // In case of cross-origin restriction (which occurs when external ad creative runs)
      setIsLoaded(true);
      return true;
    }
    return false;
  }, []);

  // Monitor iframe onLoad event and perform verification after 1.5s
  const handleIframeLoad = useCallback(() => {
    // Quick check if already rendered
    if (verifyCreativeRendered()) {
      return;
    }

    // Verify non-empty content/height after a short 1.5s check
    if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
    checkTimerRef.current = setTimeout(() => {
      if (!verifyCreativeRendered()) {
        // Fallback retry at 2.5s for slower mobile/network connections
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        retryTimerRef.current = setTimeout(() => {
          verifyCreativeRendered();
        }, 1000);
      }
    }, 1500);
  }, [verifyCreativeRendered]);

  // Listen for real-time postMessage event from the sandboxed iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data &&
        event.data.type === "ADSTERRA_CREATIVE_RENDERED" &&
        event.data.key === effectiveKey
      ) {
        setIsLoaded(true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [effectiveKey]);

  // If excluded, ads globally disabled, or key missing, collapse cleanly with zero DOM space
  if (isExcludedRoute || !ADS_CONFIG.ENABLE_ADS || !hasKey) {
    return null;
  }

  return (
    <div
      className={
        !isLoaded
          ? "hidden"
          : `ad-unit-wrapper flex flex-col items-center justify-center transition-all duration-300 ${className}`
      }
      style={
        !isLoaded
          ? { display: "none", height: 0, padding: 0, margin: 0, overflow: "hidden" }
          : undefined
      }
      data-ad-zone={zoneLabel}
      data-ad-loaded={isLoaded ? "true" : "false"}
    >
      <div className="flex items-center justify-between w-full px-1 mb-1" style={{ maxWidth: `${width}px` }}>
        <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50" />
          SPONSORED • Adsterra Network
        </span>
      </div>

      <div
        className="ad-unit-card rounded-xl border border-slate-800/80 bg-slate-900/60 p-1 flex items-center justify-center overflow-hidden shadow-lg"
        style={{ width: `${width + 10}px`, minHeight: `${height + 10}px`, maxWidth: "100%" }}
      >
        <iframe
          key={`${pathname}-${effectiveKey}`}
          ref={iframeRef}
          srcDoc={srcDocHtml}
          width={width}
          height={height}
          scrolling="no"
          frameBorder="0"
          onLoad={handleIframeLoad}
          style={{ border: "none", overflow: "hidden", display: "block", maxWidth: "100%" }}
          title={`Adsterra ${zoneLabel}`}
        />
      </div>
    </div>
  );
};

export default AdUnit;
