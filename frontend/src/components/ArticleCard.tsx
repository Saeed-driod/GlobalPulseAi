"use client";

import React from "react";
import Link from "next/link";
import { Article } from "../types/article";
import { Eye, Clock, Video, ChevronRight } from "./Icons";

interface ArticleCardProps {
  article: Article;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const formattedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "Live Wire";

  // Extract clean bullet snippet
  const bulletSnippet = article.summary
    ? article.summary
        .replace(/•/g, "")
        .split("\n")
        .filter((l) => l.trim().length > 0)[0] || ""
    : "";

  const fallbackUrl = React.useMemo(() => {
    const seed = typeof article.id === "number" ? article.id : 100;
    const cleanWords = (article.title || "tech news")
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .split(" ")
      .filter((w) => w.length > 2)
      .slice(0, 5)
      .join(" ");
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(
      cleanWords || article.category
    )}%20editorial%20news%20photography%20realistic%208k?width=800&height=450&nologo=true&seed=${seed}`;
  }, [article.id, article.title, article.category]);

  const [imgSrc, setImgSrc] = React.useState<string>(
    article.image_url || fallbackUrl
  );

  React.useEffect(() => {
    setImgSrc(article.image_url || fallbackUrl);
  }, [article.image_url, fallbackUrl]);

  return (
    <article className="group neu-flat p-5 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] relative">
      <div>
        {/* Carved Rounded Container for Thumbnail */}
        <Link
          href={`/news/${article.slug}`}
          className="relative h-48 sm:h-52 neu-pressed p-1.5 overflow-hidden block rounded-2xl group"
        >
          <div className="w-full h-full rounded-xl overflow-hidden relative">
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

            {/* Category Pill Overlay */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-2">
              <span className="neu-sm px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider text-[#1a8cff]">
                {article.category}
              </span>
            </div>

            {/* Video Indicator */}
            {article.youtube_video_id && (
              <div className="absolute top-2.5 right-2.5 neu-sm px-2 py-0.5 text-[10px] font-bold text-red-600 flex items-center gap-1">
                <Video className="w-3 h-3 text-red-600" />
                <span>Shorts Ready</span>
              </div>
            )}
          </div>
        </Link>

        {/* Article Metadata Row */}
        <div className="flex items-center gap-2.5 text-[11px] text-[#718096] font-mono mt-4 mb-2">
          <span>{formattedDate}</span>
          <span className="text-[#b8bec7]">•</span>
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
            <Eye className="w-3 h-3" /> {article.views.toLocaleString()} reads
          </span>
          <span className="text-[#b8bec7]">•</span>
          <span className="flex items-center gap-1 text-[#718096]">
            <Clock className="w-3 h-3" /> 3m
          </span>
        </div>

        {/* Title */}
        <Link href={`/news/${article.slug}`}>
          <h3 className="text-base sm:text-lg font-bold text-[#2d3748] font-serif leading-snug transition-colors line-clamp-2 group-hover:text-[#1a8cff]">
            {article.title}
          </h3>
        </Link>

        {/* Summary Snippet */}
        <p className="mt-2.5 text-xs text-[#718096] line-clamp-2 leading-relaxed">
          {bulletSnippet}
        </p>
      </div>

      {/* Footer Info & Tactile "Read Dispatch" Button */}
      <div className="mt-5 pt-3.5 border-t border-[#b8bec7]/40 flex items-center justify-between text-xs">
        <span className="text-[#718096] font-mono text-[11px] truncate max-w-[140px]">
          {article.source_name || "Tier-1 Desk"}
        </span>

        <Link
          href={`/news/${article.slug}`}
          className="neu-sm px-3.5 py-1.5 text-xs font-bold text-[#1a8cff] hover:text-[#0066d6] flex items-center gap-1 active:scale-95 transition-all"
        >
          <span>Read Dispatch</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </article>
  );
};
