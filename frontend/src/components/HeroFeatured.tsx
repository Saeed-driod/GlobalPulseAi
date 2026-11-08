"use client";

import React from "react";
import Link from "next/link";
import { Article } from "../types/article";
import { Eye, Clock, Video, Sparkles, ChevronRight } from "./Icons";
import { getCategoryTheme } from "../lib/categoryTheme";
import { getHdImageUrl, getPollinationsFallback } from "../lib/imageOptimizer";
import { getCleanExcerpt } from "../lib/excerptHelper";

interface HeroFeaturedProps {
  articles: Article[];
}

export const HeroFeatured: React.FC<HeroFeaturedProps> = ({ articles }) => {
  if (articles.length === 0) return null;

  // Select qualified lead story: confidence "full", >= 3 key points, >= 120 words, skip "how to watch" / thin briefs
  const leadIndex = articles.findIndex((a) => {
    if (a.is_noindex) return false;
    const bodyWords = (a.content || "").trim().split(/\s+/).filter(Boolean).length;
    const keyPoints = (a.summary || "").split("\n").filter((l) => l.trim().length > 15).length;
    const titleLower = (a.title || "").toLowerCase();
    const isHowToWatch =
      titleLower.includes("how to watch") ||
      titleLower.includes("viewing guide") ||
      titleLower.includes("where to watch") ||
      titleLower.includes("where to stream");
    const isThin = a.confidence && a.confidence.toLowerCase() === "thin";
    return !isHowToWatch && !isThin && bodyWords >= 120 && keyPoints >= 3;
  });

  const validLeadIndex = leadIndex !== -1 ? leadIndex : 0;
  const primary = articles[validLeadIndex];
  const secondary = articles.filter((_, idx) => idx !== validLeadIndex).slice(0, 2);

  // Parse TL;DR bullets
  const summaryBullets = primary.summary
    ? primary.summary
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .slice(0, 2)
    : [];

  const primaryFallback = React.useMemo(() => {
    const seed = typeof primary.id === "number" ? primary.id : 99;
    return getPollinationsFallback(primary.title, primary.category, seed);
  }, [primary.id, primary.title, primary.category]);

  const hdPrimaryUrl = React.useMemo(() => {
    return primary.image_url ? getHdImageUrl(primary.image_url) : primaryFallback;
  }, [primary.image_url, primaryFallback]);

  const [primaryImgSrc, setPrimaryImgSrc] = React.useState<string>(hdPrimaryUrl);

  React.useEffect(() => {
    setPrimaryImgSrc(hdPrimaryUrl);
  }, [hdPrimaryUrl]);

  const primaryTheme = getCategoryTheme(primary.category);

  return (
    <section className="mb-8 sm:mb-14">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
          </div>
          <h2 className="text-[10px] sm:text-xs uppercase font-mono font-bold tracking-wider sm:tracking-widest text-cyan-400 truncate">
            Top Story • Wire Dispatch
          </h2>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>VERIFIED WIRE REPORTING</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Main Hero Card (8 Cols) */}
        <div className="lg:col-span-8 group neu-flat p-3.5 sm:p-8 flex flex-col justify-between transition-all duration-300 relative overflow-hidden">
          {/* Chromatic Spectral Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-400 via-purple-500 via-pink-500 to-amber-400 shadow-[0_0_12px_rgba(6,182,212,0.6)]" />

          <div>
            {/* Top Inset Thumbnail Container */}
            <Link
              href={`/news/${primary.slug}`}
              className="relative h-48 sm:h-80 w-full neu-pressed p-1 sm:p-2 overflow-hidden block rounded-xl sm:rounded-2xl mb-4 sm:mb-6 group/img"
            >
              <div className="w-full h-full rounded-lg sm:rounded-xl overflow-hidden relative">
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

                <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs uppercase font-mono font-bold rounded-lg border backdrop-blur-md ${primaryTheme.badge}`}
                  >
                    {primary.category}
                  </span>
                  {primary.youtube_video_id && (
                    <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-mono font-bold rounded-lg bg-red-950/85 border border-red-500/50 text-red-300 flex items-center gap-1.5 shadow-[0_0_10px_rgba(239,68,68,0.35)] backdrop-blur-md">
                      <Video className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400" />
                      Shorts Ready
                    </span>
                  )}
                </div>
              </div>
            </Link>

            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2.5 sm:mb-3 text-[11px] sm:text-xs text-slate-400 font-mono">
              <span className="neu-sm px-2 py-0.5 sm:px-2.5 sm:py-1 flex items-center gap-1 text-slate-200 font-bold">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" /> 3 min read
              </span>
              <span className="neu-sm px-2 py-0.5 sm:px-2.5 sm:py-1 flex items-center gap-1 text-emerald-400 font-bold">
                <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" /> {primary.views.toLocaleString()} reads
              </span>
            </div>

            {/* Headline */}
            <Link href={`/news/${primary.slug}`}>
              <h1 className={`text-xl sm:text-3xl lg:text-4xl font-black text-white font-serif leading-snug sm:leading-tight tracking-tight transition-colors ${primaryTheme.hoverTextColor}`}>
                {primary.title}
              </h1>
            </Link>

            {/* TL;DR Executive Takeaway Box (Frosted Neon Inset) */}
            {summaryBullets.length > 0 && (
              <div className="mt-5 p-4 rounded-xl bg-slate-950/70 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="text-[11px] font-mono uppercase font-bold text-cyan-300 tracking-wider">
                    Executive Key Takeaways (TL;DR)
                  </span>
                </div>
                <div className="space-y-1.5">
                  {summaryBullets.map((bullet, idx) => (
                    <p key={idx} className="text-xs text-slate-300 leading-relaxed font-sans">
                      {bullet.replace(/^[•▸*-\s]+/, "• ").replace(/\*\*/g, "")}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Bar & CTA */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
            <div className="text-slate-400 font-mono flex items-center gap-2">
              <span>Source:</span>
              <span className="text-slate-200 font-bold">{primary.source_name || "Global Wire"}</span>
            </div>

            <Link
              href={`/news/${primary.slug}`}
              className="neu-btn-primary px-5 py-2.5 text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <span>Read Full Story</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Secondary Stack (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {secondary.map((article) => {
            const secTheme = getCategoryTheme(article.category);
            return (
              <div
                key={article.id}
                className="flex-1 neu-flat p-6 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] relative overflow-hidden group"
              >
                {/* Secondary card chromatic top edge on hover */}
                <div
                  className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${secTheme.accentGradient} opacity-40 group-hover:opacity-100 transition-opacity`}
                />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-2.5 py-0.5 text-[10px] uppercase font-mono font-bold tracking-wider rounded-md border backdrop-blur-md ${secTheme.badge}`}
                    >
                      {article.category}
                    </span>

                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Eye className="w-3 h-3 text-emerald-400" /> {article.views.toLocaleString()}
                    </span>
                  </div>

                  <Link href={`/news/${article.slug}`}>
                    <h3 className={`text-lg font-bold text-white font-serif leading-snug transition-colors line-clamp-2 ${secTheme.hoverTextColor}`}>
                      {article.title}
                    </h3>
                  </Link>

                  {(() => {
                    const snippet = getCleanExcerpt(article);
                    return snippet ? (
                      <p className="mt-2.5 text-xs text-slate-400 line-clamp-2 leading-relaxed font-sans">
                        {snippet}
                      </p>
                    ) : null;
                  })()}
                </div>

                <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-mono truncate max-w-[130px]">
                    {article.source_name || "News Wire"}
                  </span>
                  <Link
                    href={`/news/${article.slug}`}
                    className={`neu-sm px-3 py-1 text-xs font-bold ${secTheme.textColor} hover:brightness-125 flex items-center gap-1 active:scale-95 transition`}
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
