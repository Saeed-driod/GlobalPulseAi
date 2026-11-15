"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ADS_CONFIG, SOCIAL_BAR_SCRIPT_URL } from "../config/adsConfig";

/**
 * SocialBarAd - Globally Injected High-CPM Adsterra Social Bar / In-Page Push
 * Injected once across client-side pages; cleanly excluded on /admin and /dashboard.
 */
export function SocialBarAd() {
  const pathname = usePathname();
  const isExcluded = pathname ? pathname.startsWith("/admin") || pathname.startsWith("/dashboard") : false;

  useEffect(() => {
    if (isExcluded || !ADS_CONFIG.ENABLE_ADS) return;

    const url = SOCIAL_BAR_SCRIPT_URL ? SOCIAL_BAR_SCRIPT_URL.trim() : "";
    if (!url || url.includes("PASTE_")) return;

    // Check if already injected
    const existing = document.querySelector(`script[data-adsterra="social-bar"]`);
    if (existing) return;

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.setAttribute("data-adsterra", "social-bar");
    script.src = url;

    script.onload = () => {
      console.log("[AdUnit] Script loaded for Adsterra Social Bar");
    };

    script.onerror = (e) => {
      console.warn("[AdUnit] Script load failed or ad blocked for Adsterra Social Bar", e);
    };

    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [isExcluded]);

  return null;
}

export default SocialBarAd;

