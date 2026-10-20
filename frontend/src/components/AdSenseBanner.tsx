import React from "react";
import { AdBanner, AdSlot } from "./AdBanner";

interface AdSenseBannerProps {
  format: "leaderboard" | "in-article" | "sidebar";
  className?: string;
}

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({ format, className = "" }) => {
  const slotMap: Record<string, AdSlot> = {
    leaderboard: "header",
    "in-article": "in-article",
    sidebar: "sidebar",
  };

  return <AdBanner slot={slotMap[format] || "header"} className={className} />;
};
