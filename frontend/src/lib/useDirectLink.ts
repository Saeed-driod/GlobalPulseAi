"use client";

import { useCallback } from "react";
import { useAdSettings } from "./useAdSettings";

const COOLDOWN_KEY = "gp_smartlink_last_timestamp";
const COOLDOWN_DURATION_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Triggers a session-capped Direct Link (Smartlink) with guaranteed user destination delivery.
 * 1st click per 30 minutes in a session opens target URL in new tab AND triggers Monetag/Adsterra smartlink.
 * Subsequent clicks within cooldown directly open target URL.
 */
export function triggerDirectLink(targetUrl: string, configuredSmartlink?: string): void {
  if (typeof window === "undefined") return;

  const smartlink = configuredSmartlink?.trim();

  // If no smartlink configured or aggressive ads disabled, open destination cleanly
  if (!smartlink) {
    window.open(targetUrl, "_blank", "noopener,noreferrer");
    return;
  }

  const now = Date.now();
  let lastTimestamp = 0;
  try {
    const stored = sessionStorage.getItem(COOLDOWN_KEY);
    if (stored) lastTimestamp = parseInt(stored, 10);
  } catch {
    // sessionStorage disabled or private mode fallback
  }

  const isCooldownActive = now - lastTimestamp < COOLDOWN_DURATION_MS;

  if (isCooldownActive) {
    // User already triggered monetization in this 30-min window -> deliver destination cleanly
    window.open(targetUrl, "_blank", "noopener,noreferrer");
    return;
  }

  // Session cooldown expired or first time -> record trigger
  try {
    sessionStorage.setItem(COOLDOWN_KEY, now.toString());
  } catch {
    // ignore
  }

  // Open the legitimate destination in a new tab so user gets their content
  window.open(targetUrl, "_blank", "noopener,noreferrer");

  // Trigger Monetag / Adsterra Smartlink in a separate tab cleanly
  try {
    window.open(smartlink, "_blank", "noopener,noreferrer");
  } catch {
    // browser popup blocker safety
  }
}

/**
 * React hook to access active direct link settings and helper trigger.
 * Opens smartlink ONLY when showAggressiveAds is true; otherwise opens destination normally.
 */
export function useDirectLink() {
  const { showAggressiveAds, settings } = useAdSettings();

  const handleActionClick = useCallback(
    (e: React.MouseEvent<any>, targetUrl: string) => {
      e.preventDefault();
      const smartlink = showAggressiveAds ? settings?.direct_link_url : undefined;
      triggerDirectLink(targetUrl, smartlink);
    },
    [showAggressiveAds, settings]
  );

  return {
    smartlinkUrl: settings?.direct_link_url,
    masterEnabled: showAggressiveAds,
    handleActionClick,
  };
}
