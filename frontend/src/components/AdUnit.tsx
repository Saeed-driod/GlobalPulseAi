"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ADS_CONFIG,
  TOP_LEADERBOARD_728x90_KEY,
  IN_FEED_NATIVE_KEY,
  IN_FEED_NATIVE_CONTAINER_ID,
  ARTICLE_MODAL_300x250_KEY,
} from "../config/adsConfig";

export type AdUnitType = "leaderboard" | "in-feed" | "native" | "sidebar" | "rectangle" | "modal";

export interface AdUnitProps {
  type: AdUnitType;
  className?: string;
  zoneKey?: string;
  containerId?: string;
}

/**
 * AdUnit - SPA-optimized React Adsterra & Multi-Network Ad Component
 * 
 * - Cleans DOM on mount/update to prevent duplicate scripts in React StrictMode / route changes.
 * - Injects executable scripts via document.createElement('script') with async execution.
 * - Stays 100% collapsed/invisible if key is empty or if an ad blocker prevents iframe rendering.
 * - Automatically excluded on /admin and /dashboard routes.
 */
export const AdUnit: React.FC<AdUnitProps> = ({
  type,
  className = "",
  zoneKey: customZoneKey,
  containerId: customContainerId,
}) => {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState<boolean>(false);

  // 1. Strict route exclusion: Never show ads on administrative routes
  const isExcludedRoute = pathname ? pathname.startsWith("/admin") || pathname.startsWith("/dashboard") : false;

  // 2. Resolve target ad keys from centralized config or props
  let effectiveKey = customZoneKey || "";
  let effectiveContainerId = customContainerId || "";
  let width = 728;
  let height = 90;
  let zoneName = "Leaderboard Banner";

  if (type === "leaderboard") {
    effectiveKey = effectiveKey || TOP_LEADERBOARD_728x90_KEY;
    width = 728;
    height = 90;
    zoneName = "Top Leaderboard 728x90";
  } else if (type === "in-feed" || type === "native") {
    effectiveKey = effectiveKey || IN_FEED_NATIVE_KEY;
    effectiveContainerId = effectiveContainerId || IN_FEED_NATIVE_CONTAINER_ID;
    zoneName = "In-Feed Native Banner";
  } else if (type === "sidebar" || type === "rectangle" || type === "modal") {
    effectiveKey = effectiveKey || ARTICLE_MODAL_300x250_KEY;
    width = 300;
    height = 250;
    zoneName = "Article / Sidebar 300x250";
  }

  const hasKey = Boolean(effectiveKey && effectiveKey.trim() && !effectiveKey.includes("PASTE_"));
  const isNative = type === "in-feed" || type === "native";

  useEffect(() => {
    // If route is excluded, master switch disabled, or no valid key configured, abort cleanly
    if (isExcludedRoute || !ADS_CONFIG.ENABLE_ADS || !hasKey) {
      setIsActive(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // React StrictMode & SPA Navigation guard: Wipe container before fresh injection
    container.innerHTML = "";
    setIsActive(false);

    let isMounted = true;

    try {
      if (isNative) {
        // Native Banner Injection: Requires container div matching the zone ID
        const resolvedContainerId = effectiveContainerId || `container-${effectiveKey}`;
        const targetDiv = document.createElement("div");
        targetDiv.id = resolvedContainerId;
        container.appendChild(targetDiv);

        const nativeScript = document.createElement("script");
        nativeScript.type = "text/javascript";
        nativeScript.async = true;
        nativeScript.setAttribute("data-cfasync", "false");
        nativeScript.src = `//www.highperformanceformat.com/${effectiveKey}/invoke.js`;

        nativeScript.onload = () => {
          if (!isMounted) return;
          console.log(`[AdUnit] Script loaded for ${zoneName}`);
          // Wait briefly for the native widget elements to populate
          setTimeout(() => {
            if (!isMounted) return;
            if (targetDiv.childNodes.length > 0 || container.querySelector("iframe")) {
              setIsActive(true);
            }
          }, 400);
        };

        nativeScript.onerror = () => {
          if (!isMounted) return;
          console.warn(`[AdUnit] Script load failed or ad blocked for ${zoneName}`);
          setIsActive(false);
        };

        container.appendChild(nativeScript);
      } else {
        // Display Banner Injection (728x90, 300x250): Uses window.atOptions + invoke.js
        const confScript = document.createElement("script");
        confScript.type = "text/javascript";
        confScript.innerHTML = `
          atOptions = {
            'key' : '${effectiveKey}',
            'format' : 'iframe',
            'height' : ${height},
            'width' : ${width},
            'params' : {}
          };
        `;
        container.appendChild(confScript);

        const invokeScript = document.createElement("script");
        invokeScript.type = "text/javascript";
        invokeScript.async = true;
        invokeScript.src = `//www.highperformanceformat.com/${effectiveKey}/invoke.js`;

        invokeScript.onload = () => {
          if (!isMounted) return;
          console.log(`[AdUnit] Script loaded for ${zoneName}`);
          // Verify iframe existence to prevent showing blank unpopulated space
          setTimeout(() => {
            if (!isMounted) return;
            const iframe = container.querySelector("iframe");
            if (iframe) {
              setIsActive(true);
            }
          }, 350);
        };

        invokeScript.onerror = () => {
          if (!isMounted) return;
          console.warn(`[AdUnit] Script load failed or ad blocked for ${zoneName}`);
          setIsActive(false);
        };

        container.appendChild(invokeScript);
      }
    } catch (err) {
      console.warn(`[AdUnit] Injection error on ${zoneName}:`, err);
      setIsActive(false);
    }

    // Unmount cleanup: Remove injected scripts and iframes cleanly
    return () => {
      isMounted = false;
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [effectiveKey, effectiveContainerId, hasKey, isExcludedRoute, isNative, width, height, zoneName]);

  // If no key configured or excluded route, collapse completely with zero DOM footprint
  if (isExcludedRoute || !ADS_CONFIG.ENABLE_ADS || !hasKey) {
    return null;
  }

  return (
    <div
      className={`ad-unit-wrapper transition-all duration-300 ${
        isActive ? "opacity-100 my-4" : "opacity-0 h-0 overflow-hidden pointer-events-none"
      } ${className}`}
    >
      <div className="w-full flex items-center justify-between max-w-full px-1 mb-1">
        <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50" />
          Sponsored
        </span>
        <span className="text-[9px] font-mono text-slate-600">Adsterra Network</span>
      </div>

      <div
        ref={containerRef}
        className="ad-unit-container w-full flex items-center justify-center overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/40 p-1"
        style={{ minHeight: isActive ? (height ? `${height}px` : "auto") : "0px" }}
      />
    </div>
  );
};

export default AdUnit;

