"use client";

import React from "react";
import { AdUnit, AdUnitType } from "./AdUnit";

export type AdSlotType = "leaderboard" | "in-feed" | "sidebar";

interface AdSlotProps {
  type: AdSlotType;
  className?: string;
  fallbackTitle?: string;
}

/**
 * AdSlot - Backwards-compatible adapter routing directly to SPA-safe <AdUnit />
 * Fake dummy cards and static mock banners are completely eliminated.
 */
export function AdSlot({ type, className = "" }: AdSlotProps) {
  let mappedType: AdUnitType = "leaderboard";
  if (type === "in-feed") mappedType = "in-feed";
  if (type === "sidebar") mappedType = "sidebar";

  return <AdUnit type={mappedType} className={className} />;
}

export default AdSlot;
