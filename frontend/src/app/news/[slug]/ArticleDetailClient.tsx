"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Article } from "../../../types/article";
import { fetchArticleBySlug, fetchArticles, FALLBACK_ARTICLES } from "../../../lib/api";
import { Header } from "../../../components/Header";
import { BreakingTicker } from "../../../components/BreakingTicker";
import { AdBanner } from "../../../components/AdBanner";
import { NewsletterBox } from "../../../components/NewsletterBox";
import { Footer } from "../../../components/Footer";
import {
  ArrowLeft,
  Share2,
  Eye,
  Clock,
  Sparkles,
  CheckCircle2,
  Video,
  ExternalLink,
} from "../../../components/Icons";

interface ArticleDetailClientProps {
  initialArticle?: Article | null;
  slug: string;
}

export function ArticleDetailClient({ initialArticle, slug }: ArticleDetailClientProps) {
  const [article, setArticle] = useState<Article | null>(initialArticle || null);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(!initialArticle);

  useEffect(() => {
    if (!initialArticle && slug) {
      setLoading(true);
      fetchArticleBySlug(slug).then((res) => {
        setArticle(res);
        setLoading(false);
      });
    }

    fetchArticles({ limit: 12 }).then((res) => {
      setAllArticles(res.items);
    });
  }, [slug, initialArticle]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case "AI & Tech":
        return {
          badge: "bg-cyan-500/15 text-cyan-300 border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]",
          accent: "text-cyan-400",
        };
      case "Global Markets":
        return {
          badge: "bg-emerald-500/15 text-emerald-300 border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]",
          accent: "text-emerald-400",
        };
      case "Geopolitics":
        return {
          badge: "bg-amber-500/15 text-amber-300 border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]",
          accent: "text-amber-400",
        };
      case "Future Science":
        return {
          badge: "bg-purple-500/15 text-purple-300 border-purple-400/40 shadow-[0_0_12px_rgba(168,85,247,0.25)]",
          accent: "text-purple-400",
        };
      default:
        return {
          badge: "bg-neutral-800 text-neutral-300 border-neutral-700",
          accent: "text-cyan-400",
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center font-mono">
        <Sparkles className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
        <p className="text-sm text-neutral-400 tracking-wider uppercase font-semibold">
          Retrieving GlobalPulse Intelligence Dossier...
        </p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center">
        <h2 className="text-3xl font-bold font-serif mb-2">Dossier Not Found</h2>
        <p className="text-neutral-400 mb-6 text-sm font-mono">The requested story could not be retrieved from the wire.</p>
        <Link
          href="/"
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold rounded-xl text-xs"
        >
          Return to Wire Feed
        </Link>
      </div>
    );
  }

  const categoryTheme = getCategoryTheme(article.category);

  // Related contextual articles in the same category for internal linking & crawl depth
  const sameCategoryArticles = allArticles.filter(
    (a) => a.id !== article.id && a.category === article.category
  );
  const otherCategoryArticles = allArticles.filter(
    (a) => a.id !== article.id && a.category !== article.category
  );
  const contextualRelated = [...sameCategoryArticles, ...otherCategoryArticles].slice(0, 3);
  const sidebarTrending = allArticles.filter((a) => a.id !== article.id).slice(0, 4);

  // Render markdown comparison or impact tables
  const renderMarkdownTable = (tableText: string, key: number | string) => {
    const rawLines = tableText.split("\n").map((l) => l.trim()).filter((l) => l.startsWith("|"));
    if (rawLines.length < 2) return null;

    const parseRow = (rowStr: string) => {
      return rowStr
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
    };

    const headerCells = parseRow(rawLines[0]);
    // Skip separator row like |---|---|
    const bodyRows = rawLines.slice(1).filter((l) => !/^\s*\|(?:\s*:?-+:?\s*\|)+\s*$/.test(l));

    return (
      <div key={key} className="my-8 overflow-x-auto rounded-2xl border border-cyan-500/30 glass-panel shadow-lg shadow-cyan-950/20">
        <div className="px-5 py-3 bg-gradient-to-r from-cyan-950/60 via-slate-900/80 to-slate-900/40 border-b border-white/10 flex items-center justify-between text-xs font-mono text-cyan-400">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            STRATEGIC IMPACT & COMPARATIVE MATRIX
          </span>
          <span className="text-[11px] text-neutral-400">GlobalPulse Intelligence Desk</span>
        </div>
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.04]">
              {headerCells.map((h, i) => (
                <th key={i} className="px-5 py-3.5 font-mono text-xs uppercase tracking-wider text-cyan-300 font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06] text-neutral-200">
            {bodyRows.map((row, rIdx) => {
              const cells = parseRow(row);
              return (
                <tr key={rIdx} className="hover:bg-cyan-500/[0.04] transition">
                  {cells.map((c, cIdx) => (
                    <td
                      key={cIdx}
                      className={`px-5 py-3.5 text-xs sm:text-sm ${
                        cIdx === 0 ? "font-semibold text-white" : "text-neutral-300"
                      }`}
                    >
                      {c}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderContentParagraphs = (content: string) => {
    const sections = content.split("\n\n");
    return sections.map((section, idx) => {
      const trimmed = section.trim();

      // Check if section is a Markdown Table
      if (trimmed.startsWith("|") && trimmed.includes("\n|")) {
        return renderMarkdownTable(trimmed, idx);
      }

      if (trimmed.startsWith("### ")) {
        return (
          <h2
            key={idx}
            className="text-2xl sm:text-3xl font-bold font-serif text-white mt-10 mb-4 pb-2 border-b border-white/[0.08]"
          >
            {trimmed.replace("### ", "")}
          </h2>
        );
      }
      if (trimmed.startsWith("#### ")) {
        return (
          <h3 key={idx} className="text-xl sm:text-2xl font-bold font-serif text-cyan-300 mt-8 mb-3">
            {trimmed.replace("#### ", "")}
          </h3>
        );
      }
      if (trimmed.startsWith("> ")) {
        return (
          <blockquote
            key={idx}
            className="my-8 pl-5 border-l-4 border-cyan-400 text-neutral-200 italic glass-panel p-5 rounded-r-2xl font-serif text-lg leading-relaxed shadow-lg shadow-cyan-950/20"
          >
            {trimmed.replace(/^>\s*/gm, "")}
          </blockquote>
        );
      }
      if (trimmed.startsWith("```")) {
        const clean = trimmed.replace(/```[a-z]*\n?/g, "");
        return (
          <pre
            key={idx}
            className="my-6 p-5 rounded-xl bg-slate-900/90 border border-white/10 text-cyan-300 font-mono text-xs overflow-x-auto leading-relaxed shadow-inner"
          >
            <code>{clean}</code>
          </pre>
        );
      }
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("1. ")) {
        const items = trimmed.split("\n");
        return (
          <ul key={idx} className="my-5 space-y-2.5 text-neutral-300 text-base leading-relaxed list-disc list-inside">
            {items.map((item, i) => (
              <li key={i} className="pl-1">
                <span className="text-neutral-200">{item.replace(/^(\*|-|\d+\.)\s*/, "")}</span>
              </li>
            ))}
          </ul>
        );
      }

      // Check for FAQ Questions like **Q: ...?**
      if (trimmed.startsWith("**Q:") || trimmed.startsWith("**Question:")) {
        return (
          <div
            key={idx}
            className="my-4 p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-neutral-200"
          >
            <div className="text-sm sm:text-base font-bold text-cyan-300 mb-1">
              {trimmed.split("\n")[0].replace(/\*\*/g, "")}
            </div>
            {trimmed.split("\n").slice(1).join("\n") && (
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mt-2 font-light">
                {trimmed.split("\n").slice(1).join("\n").replace(/^\*\*A:\*\*\s*/i, "")}
              </p>
            )}
          </div>
        );
      }

      return (
        <p key={idx} className="text-base sm:text-lg text-neutral-300 leading-relaxed my-5 font-light">
          {section}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-neutral-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <Header />
      <BreakingTicker articles={allArticles} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 pb-20">
        {/* Top Leaderboard Ad */}
        <AdBanner slot="header" />

        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white font-mono transition"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" /> Back to Global Intelligence Wire
          </Link>
        </div>

        {/* Article Header */}
        <header className="max-w-4xl mx-auto mb-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span
              className={`text-xs uppercase font-bold tracking-wider px-3.5 py-1 rounded-full border backdrop-blur-md ${categoryTheme.badge}`}
            >
              {article.category}
            </span>
            <span className="text-xs text-neutral-400 font-mono flex items-center gap-1 bg-white/5 px-2.5 py-0.5 rounded-md border border-white/5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" /> 4 min read
            </span>
            <span className="text-xs text-neutral-400 font-mono flex items-center gap-1 bg-white/5 px-2.5 py-0.5 rounded-md border border-white/5">
              <Eye className="w-3.5 h-3.5 text-emerald-400" /> {article.views.toLocaleString()} reads
            </span>
            {article.youtube_video_id && (
              <span className="bg-gradient-to-r from-red-600 to-rose-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1.5 shadow-[0_0_12px_rgba(239,68,68,0.4)]">
                <Video className="w-3.5 h-3.5" /> HD Video Briefing Included
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white font-serif tracking-tight leading-[1.12]">
            {article.title}
          </h1>

          {/* Metadata & Social Share Row */}
          <div className="mt-8 pt-5 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-cyan-500/20">
                MS
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{article.author_name || "Muhammad Saeed (Chief Editor, GlobalPulse AI)"}</span>
                  <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-normal">
                    VERIFIED
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                  Source: <span className="text-neutral-200">{article.source_name || "Tier-1 Global Wire"}</span> • Published{" "}
                  {article.published_at
                    ? new Date(article.published_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Just now"}
                </div>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(
                      window.location.href
                    )}`,
                    "_blank"
                  );
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 font-semibold transition"
              >
                X / Twitter
              </button>
              <button
                onClick={() => {
                  window.open(
                    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
                    "_blank"
                  );
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 font-semibold transition"
              >
                LinkedIn
              </button>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-xs text-cyan-300 font-bold transition shadow"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                {copied ? "Dossier Copied!" : "Share Dossier"}
              </button>
            </div>
          </div>

          {/* E-E-A-T Verified Editorial Author & Fact-Check Trust Banner */}
          <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900/80 to-blue-950/40 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-neutral-200">
                <strong className="text-white">Edited & Verified by Muhammad Saeed</strong> • Founder of EduHub by Saeed (
                <a
                  href="https://www.youtube.com/@EduHubbySaeed"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline font-mono"
                >
                  @EduHubbySaeed
                </a>
                ) | Primary Wire Sources Checked
              </span>
            </div>
            <span className="shrink-0 text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
              E-E-A-T Verified
            </span>
          </div>
        </header>

        {/* 2-Column Editorial Grid: Article Body (Left 8 Cols) + Sidebar (Right 4 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Article Content */}
          <div className="lg:col-span-8">
            {/* Featured Image */}
            {article.image_url && (
              <div className="rounded-2xl overflow-hidden glass-panel mb-8 aspect-video relative">
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const seed = typeof article.id === "number" ? article.id : 100;
                    const cleanWords = (article.title || "tech news")
                      .replace(/[^a-zA-Z0-9\s]/g, " ")
                      .split(" ")
                      .filter((w) => w.length > 2)
                      .slice(0, 5)
                      .join(" ");
                    const fallback = `https://image.pollinations.ai/prompt/${encodeURIComponent(
                      cleanWords || article.category
                    )}%20editorial%20news%20photography%20realistic%208k?width=1200&height=700&nologo=true&seed=${seed}`;
                    (e.target as HTMLImageElement).src = fallback;
                  }}
                />
                <div className="absolute bottom-3 right-3 text-[10px] text-white/80 bg-black/70 px-2.5 py-1 rounded-md backdrop-blur font-mono border border-white/10">
                  GlobalPulse AI Imagery Archive • High Resolution
                </div>
              </div>
            )}

            {/* KEY TAKEAWAYS (TL;DR) EXECUTIVE BOX */}
            <div className="p-7 rounded-2xl glass-panel-glow border-2 border-cyan-500/40 mb-10 shadow-[0_0_25px_rgba(6,182,212,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center gap-2 mb-3.5 relative z-10">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs uppercase font-mono font-bold tracking-widest text-cyan-300">
                  Executive Intelligence Takeaways (TL;DR Summary)
                </h3>
              </div>

              <div className="space-y-2.5 text-sm text-neutral-200 leading-relaxed font-sans relative z-10">
                {article.summary.split("\n").map((line, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-cyan-400 font-bold shrink-0 mt-0.5">▸</span>
                    <span>{line.replace(/^•\s*/, "")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* EMBEDDED YOUTUBE VIDEO PLAYER */}
            {article.youtube_video_id && (
              <div className="mb-10 p-5 rounded-2xl glass-panel border border-red-500/30 shadow-[0_0_25px_rgba(239,68,68,0.15)]">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-400">
                    <Video className="w-4 h-4 text-red-500" />
                    <span>HD Video Intelligence Broadcast (EduHub by Saeed)</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono bg-white/5 px-2 py-0.5 rounded">
                    PRODUCED FOR TIER-1 AUDIENCE
                  </span>
                </div>
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-2xl border border-white/10">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube-nocookie.com/embed/${article.youtube_video_id}?autoplay=0&rel=0`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Article Content */}
            <div className="prose prose-invert max-w-none text-neutral-300 font-sans leading-relaxed">
              {renderContentParagraphs(article.content)}
            </div>

            {/* CONTEXTUAL INTERNAL LINKING MODULE: Read Next / Related Intelligence */}
            {contextualRelated.length > 0 && (
              <div className="my-10 p-6 rounded-2xl glass-panel border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <h3 className="text-xs font-mono uppercase font-bold tracking-widest text-cyan-300">
                      Related Intelligence & Continuous Coverage ({article.category})
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">Google Crawl & Deep Dive</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {contextualRelated.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/news/${rel.slug}`}
                      className="group flex flex-col justify-between p-4 rounded-xl bg-white/[0.03] hover:bg-cyan-500/[0.08] border border-white/[0.06] hover:border-cyan-500/40 transition-all duration-200"
                    >
                      <div>
                        <span className="text-[10px] uppercase font-mono font-bold text-cyan-400">
                          {rel.category}
                        </span>
                        <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-cyan-300 transition line-clamp-2 mt-1 mb-2 leading-snug">
                          {rel.title}
                        </h4>
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono flex items-center justify-between pt-2 border-t border-white/[0.05]">
                        <span>{rel.views.toLocaleString()} reads</span>
                        <span className="text-cyan-400 group-hover:translate-x-1 transition font-bold">
                          Read Dossier →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* In-Article Ad Banner */}
            <AdBanner slot="in-article" />

            {/* In-Article Newsletter Capture Box */}
            <NewsletterBox />

            {/* Source Verification Citation */}
            <div className="mt-8 p-5 rounded-xl glass-panel flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-400 font-mono">
              <div>
                Primary Reporting Wire / Document:{" "}
                <span className="text-neutral-200 font-semibold">{article.source_name || "Official Wire"}</span>
              </div>
              {article.source_url && (
                <a
                  href={article.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-bold"
                >
                  Verify Source Artifact <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* AUTHOR BIO & E-E-A-T EDITORIAL TRANSPARENCY CARD */}
            <div className="mt-8 p-6 rounded-2xl glass-panel border border-white/10 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center font-black text-slate-950 text-xl shrink-0 shadow-lg shadow-cyan-500/20">
                  MS
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm sm:text-base font-bold text-white">Muhammad Saeed</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      Chief Editor & AI Analyst
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Tier-1 Corroborated
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                    Founder of{" "}
                    <a
                      href="https://www.youtube.com/@EduHubbySaeed"
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline font-semibold"
                    >
                      EduHub by Saeed (@EduHubbySaeed)
                    </a>
                    . Leading high-gain automated news intelligence, technological foresight, and macroeconomic analysis. Every dispatch is synthesized strictly from tier-1 wires and official filings under rigorous E-E-A-T editorial standards.
                  </p>
                </div>
                <a
                  href="https://www.youtube.com/@EduHubbySaeed"
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-600/30 transition"
                >
                  <Video className="w-3.5 h-3.5" /> EduHub on YouTube
                </a>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            {/* 300x600 Skyscraper AdSense / House Ad */}
            <AdBanner slot="sidebar" />

            {/* Most Read Trending Intelligence */}
            <div className="p-6 rounded-2xl glass-panel">
              <h4 className="text-xs uppercase font-mono font-bold tracking-widest text-neutral-400 mb-4 pb-2 border-b border-white/[0.08]">
                Most Read Intelligence Dossiers
              </h4>
              <div className="space-y-4">
                {sidebarTrending.map((rel, idx) => (
                  <Link
                    key={rel.id}
                    href={`/news/${rel.slug}`}
                    className="group block pb-3.5 border-b border-white/[0.06] last:border-0 last:pb-0 transition-transform duration-200 hover:translate-x-1"
                  >
                    <div className="flex items-start gap-3.5">
                      <span className="text-xl font-serif font-black text-neutral-600 group-hover:text-cyan-400 transition">
                        0{idx + 1}
                      </span>
                      <div>
                        <span className="text-[10px] text-cyan-400 font-mono uppercase font-bold">
                          {rel.category}
                        </span>
                        <h5 className="text-xs font-bold text-neutral-200 group-hover:text-white transition leading-snug">
                          {rel.title}
                        </h5>
                        <div className="text-[10px] text-neutral-500 font-mono mt-1 flex items-center gap-2">
                          <span>{rel.views.toLocaleString()} reads</span>
                          <span>•</span>
                          <span>4m read</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Sticky Bottom Ad Banner */}
      <AdBanner slot="sticky-footer" />

      <Footer />
    </div>
  );
}
