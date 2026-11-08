"use client";

import React from "react";
import Link from "next/link";
import { Article } from "../types/article";
import { Eye, Clock, Video, ChevronRight } from "./Icons";
import { getCategoryTheme } from "../lib/categoryTheme";
import { getHdImageUrl, getPollinationsFallback } from "../lib/imageOptimizer";
import { getCleanExcerpt } from "../lib/excerptHelper";

interface ArticleCardProps {
  article: Article;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const catTheme = getCategoryTheme(article.category);
  const formattedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "Live Wire";

  // Extract clean 110-140 char narrative snippet without boilerplate filler templates
  const bulletSnippet = getCleanExcerpt(article);

  const fallbackUrl = React.useMemo(() => {
    const seed = typeof article.id === "number" ? article.id : 100;
    return getPollinationsFallback(article.title, article.category, seed);
  }, [article.id, article.title, article.category]);

  const hdOriginalUrl = React.useMemo(() => {
    return article.image_url ? getHdImageUrl(article.image_url) : fallbackUrl;
  }, [article.image_url, fallbackUrl]);

  const [imgSrc, setImgSrc] = React.useState<string>(hdOriginalUrl);

  React.useEffect(() => {
    setImgSrc(hdOriginalUrl);
  }, [hdOriginalUrl]);

  return (
    <article className="group neu-flat p-3.5 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] relative overflow-hidden">
      {/* Top subtle category accent bar on hover */}
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${catTheme.accentGradient} opacity-40 group-hover:opacity-100 transition-opacity duration-300`}
      />

      <div>
        {/* Carved Rounded Container for Thumbnail */}
        <Link
          href={`/news/${article.slug}`}
          className="relative h-44 sm:h-52 neu-pressed p-1 sm:p-1.5 overflow-hidden block rounded-xl sm:rounded-2xl group"
        >
          <div className="w-full h-full rounded-lg sm:rounded-xl overflow-hidden relative">
            <img
              src={imgSrc}
              alt={article.title}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={() => {
                if (imgSrc !== fallbackUrl) {
                  setImgSrc(fallbackUrl);
                }
              }}
            />
            {/* Subtle Gradient Shadow */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

            {/* Category Pill Overlay with Unique Chromatic Identity */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 text-[10px] uppercase font-mono font-bold tracking-wider rounded-md border backdrop-blur-md ${catTheme.badge}`}
              >
                {article.category}
              </span>
            </div>

            {/* Video Indicator */}
            {article.youtube_video_id && (
              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-red-950/85 border border-red-500/50 text-red-300 flex items-center gap-1 shadow-[0_0_10px_rgba(239,68,68,0.35)] backdrop-blur-md">
                <Video className="w-3 h-3 text-red-400" />
                <span>Shorts Ready</span>
              </div>
            )}
          </div>
        </Link>

        {/* Article Metadata Row */}
        <div className="flex items-center gap-2 sm:gap-2.5 text-[10px] sm:text-[11px] text-slate-400 font-mono mt-3 sm:mt-4 mb-2">
          <span>{formattedDate}</span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <Eye className="w-3 h-3 text-emerald-400" /> {article.views.toLocaleString()} reads
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3 h-3" /> 3m
          </span>
        </div>

        {/* Title with Category-Matching Hover Glow */}
        <Link href={`/news/${article.slug}`}>
          <h3
            className={`text-base sm:text-lg font-bold text-white font-serif leading-snug transition-colors line-clamp-2 ${catTheme.hoverTextColor}`}
          >
            {article.title}
          </h3>
        </Link>

        {/* Summary Snippet */}
        {bulletSnippet ? (
          <p className="mt-2.5 text-xs text-slate-400 line-clamp-2 leading-relaxed font-sans">
            {bulletSnippet}
          </p>
        ) : null}
      </div>

      {/* Footer Info & Tactile "Read Story" Button */}
      <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs">
        <span className="text-slate-400 font-mono text-[11px] truncate max-w-[140px]">
          {article.source_name || "News Wire"}
        </span>

        <Link
          href={`/news/${article.slug}`}
          className={`neu-sm px-3.5 py-1.5 text-xs font-bold ${catTheme.textColor} hover:brightness-125 flex items-center gap-1 active:scale-95 transition-all`}
        >
          <span>Read Story</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </article>
  );
};
