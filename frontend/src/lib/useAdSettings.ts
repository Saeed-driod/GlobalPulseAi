"use client";

import { useState, useEffect } from "react";
import { fetchAdSettings, AdSettings } from "./api";

export interface AdSettingsState {
  ready: boolean;
  showDisplayAds: boolean;
  showAggressiveAds: boolean;
  settings: AdSettings | null;
}

/**
 * useAdSettings Hook
 * 
 * Rules:
 * - Both false until settings have loaded (ready = false).
 * - master_enabled === false OR ads_mode === "off" => showDisplayAds = false, showAggressiveAds = false.
 * - ads_mode === "review" => showDisplayAds = true, showAggressiveAds = false.
 * - ads_mode === "full" => showDisplayAds = true, showAggressiveAds = true.
 */
export function useAdSettings(): AdSettingsState {
  const [ready, setReady] = useState<boolean>(false);
  const [settings, setSettings] = useState<AdSettings | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchAdSettings()
      .then((data) => {
        if (!isMounted) return;
        setSettings(data);
        setReady(true);
      })
      .catch(() => {
        if (!isMounted) return;
        setReady(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!ready || !settings) {
    return {
      ready: false,
      showDisplayAds: false,
      showAggressiveAds: false,
      settings: null,
    };
  }

  const masterEnabled = settings.master_enabled !== false;
  const mode = settings.ads_mode || "full";

  if (!masterEnabled || mode === "off") {
    return {
      ready: true,
      showDisplayAds: false,
      showAggressiveAds: false,
      settings,
    };
  }

  if (mode === "review") {
    return {
      ready: true,
      showDisplayAds: true,
      showAggressiveAds: false,
      settings,
    };
  }

  // mode === "full"
  return {
    ready: true,
    showDisplayAds: true,
    showAggressiveAds: true,
    settings,
  };
}

export default useAdSettings;
