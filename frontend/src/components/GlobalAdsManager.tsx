"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ADS_CONFIG } from "../config/adsConfig";
import { useAdSettings } from "../lib/useAdSettings";

declare global {
  interface Window {
    __adsInitialized?: boolean;
  }
}

const EXCLUDED_PREFIXES = [
  "/admin",
  "/dashboard",
  "/privacy-policy",
  "/terms",
  "/contact",
  "/about",
];

/**
 * GlobalAdsManager - High-CPM Global Overlay & Push Script Injector
 * 
 * Injects Monetag MultiTag (popunder), In-Page Push, Vignette Banner, and Adsterra Social Bar
 * ONLY when showAggressiveAds is true and route is not excluded.
 * Uses window.__adsInitialized guard to inject ONCE per session.
 */
export function GlobalAdsManager() {
  const pathname = usePathname();
  const { ready, showAggressiveAds } = useAdSettings();

  const isExcluded = pathname
    ? EXCLUDED_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
      )
    : false;

  useEffect(() => {
    // 1. Strict route exclusion: Never inject on excluded routes
    if (isExcluded || !ADS_CONFIG.ENABLE_ADS) return;

    // 2. Gate on ads mode: aggressive ads must be enabled and settings loaded
    if (!ready || !showAggressiveAds) return;

    // 3. React StrictMode & SPA Navigation guard: Inject ONCE only
    if (typeof window === "undefined" || window.__adsInitialized) {
      return;
    }
    window.__adsInitialized = true;

    // Inject Monetag MultiTag (OnClick Popunder + In-Page Push + Vignette)
    if (ADS_CONFIG.MONETAG_MULTITAG_URL && ADS_CONFIG.MONETAG_MULTITAG_ZONE) {
      try {
        const s1 = document.createElement("script");
        s1.src = ADS_CONFIG.MONETAG_MULTITAG_URL;
        s1.setAttribute("data-zone", ADS_CONFIG.MONETAG_MULTITAG_ZONE);
        s1.async = true;
        document.head.appendChild(s1);
      } catch (err) {
        console.warn("[GlobalAds] Monetag MultiTag error:", err);
      }
    }

    // Inject Monetag In-Page Push
    if (ADS_CONFIG.MONETAG_PUSH_URL && ADS_CONFIG.MONETAG_PUSH_ZONE) {
      try {
        const s2 = document.createElement("script");
        s2.src = ADS_CONFIG.MONETAG_PUSH_URL;
        s2.dataset.zone = ADS_CONFIG.MONETAG_PUSH_ZONE;
        s2.async = true;
        document.head.appendChild(s2);
      } catch (err) {
        console.warn("[GlobalAds] Monetag Push error:", err);
      }
    }

    // Inject Monetag Vignette Banner
    if (ADS_CONFIG.MONETAG_VIGNETTE_URL && ADS_CONFIG.MONETAG_VIGNETTE_ZONE) {
      try {
        const s3 = document.createElement("script");
        s3.src = ADS_CONFIG.MONETAG_VIGNETTE_URL;
        s3.dataset.zone = ADS_CONFIG.MONETAG_VIGNETTE_ZONE;
        s3.async = true;
        document.head.appendChild(s3);
      } catch (err) {
        console.warn("[GlobalAds] Monetag Vignette error:", err);
      }
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
  }, [isExcluded, ready, showAggressiveAds]);

  return null;
}

export default GlobalAdsManager;
