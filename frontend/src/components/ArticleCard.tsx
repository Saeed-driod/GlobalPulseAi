import React from "react";
import Link from "next/link";
import { Article } from "../types/article";
import { Eye, Clock, Video, ChevronRight, Sparkles } from "./Icons";

interface ArticleCardProps {
  article: Article;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case "AI & Tech":
        return {
          badge: "bg-cyan-500/15 text-cyan-300 border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]",
          hoverBorder: "hover:border-cyan-500/40 hover:shadow-cyan-500/10",
          hoverTitle: "group-hover:text-cyan-300",
        };
      case "Global Markets":
        return {
          badge: "bg-emerald-500/15 text-emerald-300 border-emerald-400/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
          hoverBorder: "hover:border-emerald-500/40 hover:shadow-emerald-500/10",
          hoverTitle: "group-hover:text-emerald-300",
        };
      case "Geopolitics":
        return {
          badge: "bg-amber-500/15 text-amber-300 border-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]",
          hoverBorder: "hover:border-amber-500/40 hover:shadow-amber-500/10",
          hoverTitle: "group-hover:text-amber-300",
        };
      case "Future Science":
        return {
          badge: "bg-purple-500/15 text-purple-300 border-purple-400/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]",
          hoverBorder: "hover:border-purple-500/40 hover:shadow-purple-500/10",
          hoverTitle: "group-hover:text-purple-300",
        };
      default:
        return {
          badge: "bg-neutral-800 text-neutral-300 border-neutral-700",
          hoverBorder: "hover:border-neutral-700",
          hoverTitle: "group-hover:text-cyan-300",
        };
    }
  };

  const theme = getCategoryTheme(article.category);

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
    <article
      className={`group flex flex-col glass-panel rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${theme.hoverBorder} relative`}
    >
      {/* Article Image Container */}
      <Link href={`/news/${article.slug}`} className="relative h-48 sm:h-52 overflow-hidden bg-slate-950 block">
        <img
          src={imgSrc}
          alt={article.title}
          className="object-cover w-full h-48 sm:h-52 transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={() => {
            if (imgSrc !== fallbackUrl) {
              setImgSrc(fallbackUrl);
            }
          }}
        />
        {/* Cinematic Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />

        {/* Category Pill Overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span
            className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border backdrop-blur-md ${theme.badge}`}
          >
            {article.category}
          </span>
        </div>

        {/* Video Ready / YouTube Pill */}
        {article.youtube_video_id && (
          <div className="absolute top-3 right-3 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg shadow-red-600/30 border border-red-400/30">
            <Video className="w-3 h-3" />
            <span>Shorts Ready</span>
          </div>
        )}
      </Link>

      {/* Content Container */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata Row */}
          <div className="flex items-center gap-3 text-[11px] text-neutral-400 font-mono mb-2.5">
            <span className="text-neutral-400">{formattedDate}</span>
            <span className="text-neutral-700">•</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Eye className="w-3 h-3" /> {article.views.toLocaleString()} reads
            </span>
            <span className="text-neutral-700">•</span>
            <span className="flex items-center gap-1 text-neutral-400">
              <Clock className="w-3 h-3" /> 3m
            </span>
          </div>

          {/* Title */}
          <Link href={`/news/${article.slug}`}>
            <h3
              className={`text-base sm:text-lg font-bold text-white font-serif leading-snug transition-colors line-clamp-2 ${theme.hoverTitle}`}
            >
              {article.title}
            </h3>
          </Link>

          {/* TL;DR bullet point */}
          <p className="mt-3 text-xs text-neutral-400 line-clamp-2 leading-relaxed">
            {bulletSnippet}
          </p>
        </div>

        {/* Footer info & CTA */}
        <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between text-xs">
          <div className="text-neutral-500 font-mono text-[11px] truncate max-w-[150px]">
            {article.source_name || "Tier-1 Desk"}
          </div>

          <Link
            href={`/news/${article.slug}`}
            className="text-cyan-400 font-bold flex items-center gap-1 hover:text-cyan-300 group-hover:translate-x-0.5 transition"
          >
            Read Dossier <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
};
