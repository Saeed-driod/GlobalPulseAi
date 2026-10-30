"use client";

import React from "react";
import Link from "next/link";
import { Article } from "../types/article";
import { Eye, Clock, Video, Sparkles, ChevronRight } from "./Icons";

interface HeroFeaturedProps {
  articles: Article[];
}

export const HeroFeatured: React.FC<HeroFeaturedProps> = ({ articles }) => {
  if (articles.length === 0) return null;

  const primary = articles[0];
  const secondary = articles.slice(1, 3);

  // Parse TL;DR bullets
  const summaryBullets = primary.summary
    ? primary.summary
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .slice(0, 2)
    : [];

  const primaryFallback = React.useMemo(() => {
    const seed = typeof primary.id === "number" ? primary.id : 99;
    const cleanWords = (primary.title || "global technology")
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .split(" ")
      .filter((w) => w.length > 2)
      .slice(0, 5)
      .join(" ");
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(
      cleanWords || primary.category
    )}%20editorial%20news%20photography%20realistic%208k?width=1200&height=700&nologo=true&seed=${seed}`;
  }, [primary.id, primary.title, primary.category]);

  const [primaryImgSrc, setPrimaryImgSrc] = React.useState<string>(
    primary.image_url || primaryFallback
  );

  React.useEffect(() => {
    setPrimaryImgSrc(primary.image_url || primaryFallback);
  }, [primary.image_url, primaryFallback]);

  return (
    <section className="mb-14">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1a8cff] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#1a8cff]"></span>
          </div>
          <h2 className="text-xs uppercase font-mono font-bold tracking-widest text-[#1a8cff]">
            Lead Global Intelligence • Priority 1 Dispatch
          </h2>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-[#718096] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>SYNTHESIZED REAL-TIME BY TIER-1 AI ENGINE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Hero Card (8 Cols) */}
        <div className="lg:col-span-8 group neu-flat p-6 sm:p-8 flex flex-col justify-between transition-all duration-300">
          <div>
            {/* Top Inset Thumbnail Container */}
            <Link
              href={`/news/${primary.slug}`}
              className="relative h-64 sm:h-80 w-full neu-pressed p-2 overflow-hidden block rounded-2xl mb-6 group/img"
            >
              <div className="w-full h-full rounded-xl overflow-hidden relative">
                <img
                  src={primaryImgSrc}
                  alt={primary.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/img:scale-105"
                  onError={() => {
                    if (primaryImgSrc !== primaryFallback) {
                      setPrimaryImgSrc(primaryFallback);
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2">
                  <span className="neu-sm px-3 py-1 text-xs uppercase font-bold text-[#1a8cff]">
                    {primary.category}
                  </span>
                  {primary.youtube_video_id && (
                    <span className="neu-sm px-2.5 py-1 text-[11px] font-bold text-red-600 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5" />
                      Shorts Ready
                    </span>
                  )}
                </div>
              </div>
            </Link>

            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mb-3 text-xs text-[#718096] font-mono">
              <span className="neu-sm px-2.5 py-1 flex items-center gap-1 text-[#2d3748] font-bold">
                <Clock className="w-3.5 h-3.5 text-[#1a8cff]" /> 3 min read
              </span>
              <span className="neu-sm px-2.5 py-1 flex items-center gap-1 text-emerald-600 font-bold">
                <Eye className="w-3.5 h-3.5 text-emerald-600" /> {primary.views.toLocaleString()} reads
              </span>
            </div>

            {/* Headline */}
            <Link href={`/news/${primary.slug}`}>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#2d3748] font-serif leading-tight tracking-tight hover:text-[#1a8cff] transition-colors">
                {primary.title}
              </h1>
            </Link>

            {/* TL;DR Executive Takeaway Box (Carved Inset) */}
            {summaryBullets.length > 0 && (
              <div className="mt-5 p-4 rounded-xl neu-pressed">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[#1a8cff]" />
                  <span className="text-[11px] font-mono uppercase font-bold text-[#1a8cff] tracking-wider">
                    Executive Key Takeaways (TL;DR)
                  </span>
                </div>
                <div className="space-y-1.5">
                  {summaryBullets.map((bullet, idx) => (
                    <p key={idx} className="text-xs text-[#718096] leading-relaxed font-sans">
                      {bullet.replace(/^[•▸*-\s]+/, "• ")}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Bar & CTA */}
          <div className="mt-6 pt-4 border-t border-[#b8bec7]/40 flex items-center justify-between text-xs">
            <div className="text-[#718096] font-mono flex items-center gap-2">
              <span>Source:</span>
              <span className="text-[#2d3748] font-bold">{primary.source_name || "Global Wire"}</span>
            </div>

            <Link
              href={`/news/${primary.slug}`}
              className="neu-btn-primary px-5 py-2.5 text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <span>Read Full Dossier</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Secondary Stack (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {secondary.map((article) => {
            return (
              <div
                key={article.id}
                className="flex-1 neu-flat p-6 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="neu-sm px-2.5 py-0.5 text-[10px] uppercase font-bold text-[#1a8cff]">
                      {article.category}
                    </span>

                    <span className="text-[11px] text-[#718096] font-mono flex items-center gap-1">
                      <Eye className="w-3 h-3 text-emerald-600" /> {article.views.toLocaleString()}
                    </span>
                  </div>

                  <Link href={`/news/${article.slug}`}>
                    <h3 className="text-lg font-bold text-[#2d3748] font-serif leading-snug hover:text-[#1a8cff] transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                  </Link>

                  <p className="mt-2.5 text-xs text-[#718096] line-clamp-2 leading-relaxed">
                    {article.summary.replace(/•/g, "").split("\n")[0]}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-[#b8bec7]/40 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#718096] font-mono truncate max-w-[130px]">
                    {article.source_name || "Tier-1 Desk"}
                  </span>
                  <Link
                    href={`/news/${article.slug}`}
                    className="neu-sm px-3 py-1 text-xs font-bold text-[#1a8cff] hover:text-[#0066d6] flex items-center gap-1 active:scale-95 transition"
                  >
                    <span>Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
