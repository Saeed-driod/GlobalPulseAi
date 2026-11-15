"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ADS_CONFIG } from "../config/adsConfig";

declare global {
  interface Window {
    __adsInitialized?: boolean;
  }
}

/**
 * GlobalAdsManager - High-CPM Global Overlay & Push Script Injector
 * 
 * Injects Monetag MultiTag, In-Page Push, Vignette Banner, and Adsterra Social Bar scripts
 * exactly once per session using the window.__adsInitialized guard flag.
 * Prevents duplicate popunders and duplicate script execution across React SPA transitions.
 */
export function GlobalAdsManager() {
  const pathname = usePathname();
  const isExcluded = pathname ? pathname.startsWith("/admin") || pathname.startsWith("/dashboard") : false;

  useEffect(() => {
    // 1. Strict route exclusion: Never inject ads inside /admin or /dashboard
    if (isExcluded || !ADS_CONFIG.ENABLE_ADS) return;

    // 2. React StrictMode & SPA Navigation guard: Inject ONCE only
    if (typeof window === "undefined" || window.__adsInitialized) {
      return;
    }
    window.__adsInitialized = true;

    // Inject Monetag MultiTag (OnClick Popunder + In-Page Push + Vignette - Zone 305177)
    try {
      const s1 = document.createElement("script");
      s1.src = "https://quge5.com/88/tag.min.js";
      s1.setAttribute("data-zone", "305177");
      s1.async = true;
      document.head.appendChild(s1);
    } catch (err) {
      console.warn("[GlobalAds] Monetag MultiTag error:", err);
    }

    // Inject Monetag In-Page Push (Zone 12187520)
    try {
      const s2 = document.createElement("script");
      s2.src = "https://nap5k.com/tag.min.js";
      s2.dataset.zone = "12187520";
      s2.async = true;
      document.head.appendChild(s2);
    } catch (err) {
      console.warn("[GlobalAds] Monetag Push error:", err);
    }

    // Inject Monetag Vignette Banner (Zone 12187525)
    try {
      const s3 = document.createElement("script");
      s3.src = "https://n6wxm.com/vignette.min.js";
      s3.dataset.zone = "12187525";
      s3.async = true;
      document.head.appendChild(s3);
    } catch (err) {
      console.warn("[GlobalAds] Monetag Vignette error:", err);
    }

    // Inject Adsterra Social Bar (if configured)
    const socialBarUrl = ADS_CONFIG.SOCIAL_BAR_SCRIPT_URL?.trim();
    if (socialBarUrl && !socialBarUrl.includes("PASTE_")) {
      try {
        const sSocial = document.createElement("script");
        sSocial.src = socialBarUrl;
        sSocial.async = true;
        sSocial.onload = () => console.log("[AdUnit] Script loaded for Adsterra Social Bar");
        document.head.appendChild(sSocial);
      } catch (err) {
        console.warn("[GlobalAds] Adsterra Social Bar error:", err);
      }
    }
  }, [isExcluded]);

  return null;
}

export default GlobalAdsManager;
