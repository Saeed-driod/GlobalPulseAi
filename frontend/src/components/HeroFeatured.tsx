import React from "react";
import Link from "next/link";
import { Article } from "../types/article";
import { Eye, Clock, Video, Sparkles, ChevronRight, Zap } from "./Icons";

interface HeroFeaturedProps {
  articles: Article[];
}

export const HeroFeatured: React.FC<HeroFeaturedProps> = ({ articles }) => {
  if (articles.length === 0) return null;

  const primary = articles[0];
  const secondary = articles.slice(1, 3);

  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case "AI & Tech":
        return {
          badge: "bg-cyan-500/15 text-cyan-300 border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]",
          glow: "from-cyan-500/20 via-transparent to-transparent",
          hoverText: "group-hover:text-cyan-300",
        };
      case "Global Markets":
        return {
          badge: "bg-emerald-500/15 text-emerald-300 border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]",
          glow: "from-emerald-500/20 via-transparent to-transparent",
          hoverText: "group-hover:text-emerald-300",
        };
      case "Geopolitics":
        return {
          badge: "bg-amber-500/15 text-amber-300 border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]",
          glow: "from-amber-500/20 via-transparent to-transparent",
          hoverText: "group-hover:text-amber-300",
        };
      case "Future Science":
        return {
          badge: "bg-purple-500/15 text-purple-300 border-purple-400/40 shadow-[0_0_12px_rgba(168,85,247,0.25)]",
          glow: "from-purple-500/20 via-transparent to-transparent",
          hoverText: "group-hover:text-purple-300",
        };
      case "Global Sports":
        return {
          badge: "bg-red-500/15 text-red-300 border-red-400/40 shadow-[0_0_12px_rgba(239,68,68,0.25)]",
          glow: "from-red-500/20 via-transparent to-transparent",
          hoverText: "group-hover:text-red-300",
        };
      default:
        return {
          badge: "bg-neutral-800 text-neutral-300 border-neutral-700",
          glow: "from-blue-500/20 via-transparent to-transparent",
          hoverText: "group-hover:text-cyan-300",
        };
    }
  };

  const primaryTheme = getCategoryTheme(primary.category);

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
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </div>
          <h2 className="text-xs uppercase font-mono font-bold tracking-widest text-cyan-300">
            Lead Global Intelligence • Priority 1 Dispatch
          </h2>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>SYNTHESIZED REAL-TIME BY TIER-1 AI ENGINE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Hero Card (8 Cols) */}
        <div className="lg:col-span-8 group relative rounded-2xl overflow-hidden glass-panel-glow hover:border-cyan-500/40 transition-all duration-500 flex flex-col justify-end min-h-[480px] sm:min-h-[540px] hover:shadow-[0_0_35px_rgba(6,182,212,0.18)]">
          {/* Background Image with Zoom */}
          <img
            src={primaryImgSrc}
            alt={primary.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            onError={() => {
              if (primaryImgSrc !== primaryFallback) {
                setPrimaryImgSrc(primaryFallback);
              }
            }}
          />

          {/* Deep Obsidian Overlay with subtle bottom-up vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />

          {/* Hero Content */}
          <div className="relative p-6 sm:p-9 z-10">
            {/* Meta tags */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mb-4">
              <span
                className={`text-[11px] uppercase font-bold tracking-wider px-3 py-1 rounded-full border backdrop-blur-md ${primaryTheme.badge}`}
              >
                {primary.category}
              </span>

              {primary.youtube_video_id && (
                <span className="flex items-center gap-1.5 text-[11px] font-bold bg-gradient-to-r from-red-600 to-rose-600 text-white px-3 py-0.5 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.4)]">
                  <Video className="w-3.5 h-3.5" />
                  Shorts Video Ready
                </span>
              )}

              <span className="text-xs text-neutral-400 font-mono flex items-center gap-1.5 bg-black/40 px-2.5 py-0.5 rounded-md border border-white/5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" /> 3 min read
              </span>

              <span className="text-xs text-neutral-400 font-mono flex items-center gap-1.5 bg-black/40 px-2.5 py-0.5 rounded-md border border-white/5">
                <Eye className="w-3.5 h-3.5 text-emerald-400" /> {primary.views.toLocaleString()} reads
              </span>
            </div>

            {/* Headline */}
            <Link href={`/news/${primary.slug}`}>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white font-serif leading-tight tracking-tight group-hover:text-cyan-200 transition-colors duration-200">
                {primary.title}
              </h1>
            </Link>

            {/* TL;DR Executive Takeaway Box */}
            {summaryBullets.length > 0 && (
              <div className="mt-4 p-4 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md max-w-3xl">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px] font-mono uppercase font-bold text-cyan-300 tracking-wider">
                    Executive Key Takeaways (TL;DR)
                  </span>
                </div>
                <div className="space-y-1">
                  {summaryBullets.map((bullet, idx) => (
                    <p key={idx} className="text-xs text-neutral-300 leading-relaxed font-sans">
                      {bullet}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Bar */}
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/10 text-xs">
              <div className="text-neutral-400 font-mono flex items-center gap-2">
                <span className="text-neutral-500">Source:</span>
                <span className="text-cyan-300 font-semibold">{primary.source_name || "Global Wire"}</span>
              </div>

              <Link
                href={`/news/${primary.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all duration-150 transform group-hover:translate-x-1"
              >
                Read Full Investigation
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Secondary Stack (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {secondary.map((article) => {
            const theme = getCategoryTheme(article.category);
            return (
              <div
                key={article.id}
                className="flex-1 group rounded-2xl p-6 glass-panel hover:border-cyan-500/30 transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:shadow-black/60 relative overflow-hidden"
              >
                {/* Subtle corner light */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${theme.badge}`}
                    >
                      {article.category}
                    </span>

                    <span className="text-[11px] text-neutral-400 font-mono flex items-center gap-1">
                      <Eye className="w-3 h-3 text-neutral-500" /> {article.views.toLocaleString()}
                    </span>
                  </div>

                  <Link href={`/news/${article.slug}`}>
                    <h3 className="text-lg font-bold text-white font-serif leading-snug group-hover:text-cyan-300 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                  </Link>

                  <p className="mt-2.5 text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                    {article.summary.replace(/•/g, "").split("\n")[0]}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-neutral-500 font-mono">
                    {article.source_name || "Tier-1 Desk"}
                  </span>
                  <Link
                    href={`/news/${article.slug}`}
                    className="text-cyan-400 font-bold hover:text-cyan-300 flex items-center gap-1 group-hover:translate-x-0.5 transition"
                  >
                    Details <ChevronRight className="w-3.5 h-3.5" />
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
