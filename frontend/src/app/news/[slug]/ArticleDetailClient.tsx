"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Article } from "../../../types/article";
import { fetchArticleBySlug, fetchArticles } from "../../../lib/api";
import { Header } from "../../../components/Header";
import { BreakingTicker } from "../../../components/BreakingTicker";
import { AdBanner } from "../../../components/AdBanner";
import { NewsletterBox } from "../../../components/NewsletterBox";
import { Footer } from "../../../components/Footer";
import { AudioArticlePlayer } from "../../../components/AudioArticlePlayer";
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

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case "AI & Tech":
        return "text-[#1a8cff]";
      case "Global Markets":
        return "text-emerald-600";
      case "World Politics":
      case "Geopolitics":
        return "text-amber-600";
      case "Future Science":
        return "text-purple-600";
      case "Global Sports":
        return "text-red-500";
      default:
        return "text-[#1a8cff]";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e0e5ec] text-[#2d3748] flex flex-col justify-center items-center font-mono">
        <Sparkles className="w-10 h-10 text-[#1a8cff] animate-spin mb-4" />
        <p className="text-sm text-[#718096] tracking-wider uppercase font-semibold">
          Retrieving GlobalPulse Intelligence Dossier...
        </p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#e0e5ec] text-[#2d3748] flex flex-col justify-center items-center p-6 text-center">
        <div className="p-8 rounded-3xl neu-flat max-w-md">
          <h2 className="text-3xl font-bold font-serif mb-2 text-[#2d3748]">Dossier Not Found</h2>
          <p className="text-[#718096] mb-6 text-sm font-mono">The requested story could not be retrieved from the wire.</p>
          <Link
            href="/"
            className="px-6 py-3 neu-btn-primary font-bold text-xs inline-block"
          >
            Return to Wire Feed
          </Link>
        </div>
      </div>
    );
  }

  // Related contextual articles in the same category for internal linking & crawl depth
  const sameCategoryArticles = allArticles.filter(
    (a) => a.id !== article.id && a.category === article.category
  );
  const otherCategoryArticles = allArticles.filter(
    (a) => a.id !== article.id && a.category !== article.category
  );
  const contextualRelated = [...sameCategoryArticles, ...otherCategoryArticles].slice(0, 3);
  const sidebarTrending = allArticles.filter((a) => a.id !== article.id).slice(0, 4);

  // Rich inline markdown formatter: parses **bold**, *italic*, `code`, and [links] cleanly
  const renderFormattedText = (rawText: string): React.ReactNode => {
    if (!rawText) return null;

    // Pattern to match markdown tokens
    const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
    const parts = rawText.split(pattern);

    return parts.map((part, index) => {
      if (!part) return null;

      // Bold: **text**
      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        const inner = part.slice(2, -2).trim();
        return (
          <strong
            key={index}
            className="font-bold text-[#1a202c] tracking-tight bg-gradient-to-r from-[#1a8cff]/10 via-[#1a8cff]/5 to-transparent px-1.5 py-0.5 rounded border-b-2 border-[#1a8cff]/40"
          >
            {inner}
          </strong>
        );
      }

      // Italic: *text*
      if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
        const inner = part.slice(1, -1);
        return (
          <em key={index} className="italic text-[#2d3748] font-serif">
            {inner}
          </em>
        );
      }

      // Inline code: `text`
      if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
        const inner = part.slice(1, -1);
        return (
          <code
            key={index}
            className="font-mono text-xs px-2 py-0.5 rounded neu-pressed text-[#1a8cff] font-semibold"
          >
            {inner}
          </code>
        );
      }

      // Markdown Link: [text](url)
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const [, linkTitle, linkUrl] = linkMatch;
        return (
          <a
            key={index}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1a8cff] font-semibold underline underline-offset-4 decoration-[#1a8cff]/40 hover:decoration-[#1a8cff] transition-all"
          >
            {linkTitle}
          </a>
        );
      }

      // If standalone stray asterisks exist, strip them for a clean read
      const sanitized = part.replace(/\*\*/g, "");
      return <React.Fragment key={index}>{sanitized}</React.Fragment>;
    });
  };

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
    const bodyRows = rawLines.slice(1).filter((l) => !/^\s*\|(?:\s*:?-+:?\s*\|)+\s*$/.test(l));

    return (
      <div key={key} className="my-10 overflow-x-auto rounded-3xl neu-flat p-5 border border-white/60">
        <div className="px-4 py-2.5 border-b border-[#b8bec7]/50 flex items-center justify-between text-xs font-mono text-[#1a8cff]">
          <span className="flex items-center gap-2 font-bold tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#1a8cff] animate-pulse" />
            STRATEGIC IMPACT &amp; COMPARATIVE MATRIX
          </span>
          <span className="text-[11px] text-[#718096] uppercase font-semibold">Tier-1 Intelligence Model</span>
        </div>
        <table className="w-full text-left text-sm border-collapse mt-3">
          <thead>
            <tr className="border-b border-[#b8bec7]/40">
              {headerCells.map((h, i) => (
                <th key={i} className="px-4 py-3.5 font-mono text-xs uppercase tracking-wider text-[#1a202c] font-black">
                  {renderFormattedText(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#b8bec7]/30 text-[#4a5568]">
            {bodyRows.map((row, rIdx) => {
              const cells = parseRow(row);
              return (
                <tr key={rIdx} className="hover:bg-white/40 transition">
                  {cells.map((c, cIdx) => (
                    <td
                      key={cIdx}
                      className={`px-4 py-3.5 text-xs sm:text-sm ${
                        cIdx === 0 ? "font-bold text-[#1a202c]" : "text-[#4a5568]"
                      }`}
                    >
                      {renderFormattedText(c)}
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
      if (!trimmed) return null;

      // Check if section is a Markdown Table
      if (trimmed.startsWith("|") && trimmed.includes("\n|")) {
        return renderMarkdownTable(trimmed, idx);
      }

      // Executive Level 3 Heading: ### What Happened, ### Why It Matters, etc.
      if (trimmed.startsWith("### ")) {
        const rawHeading = trimmed.replace("### ", "").trim();
        const cleanHeading = rawHeading.replace(/\*\*/g, "");

        let badgeLabel = "Verified Dispatch";
        let badgeStyle = "text-[#1a8cff] bg-[#1a8cff]/10 border-[#1a8cff]/30";
        const lower = cleanHeading.toLowerCase();

        if (lower.includes("what happened") || lower.includes("headline")) {
          badgeLabel = "Core Facts & Chronology";
          badgeStyle = "text-[#1a8cff] bg-[#1a8cff]/10 border-[#1a8cff]/30";
        } else if (lower.includes("why it matters") || lower.includes("strategic") || lower.includes("financial")) {
          badgeLabel = "Executive Impact & Capex";
          badgeStyle = "text-emerald-700 bg-emerald-500/10 border-emerald-500/30";
        } else if (lower.includes("comparison") || lower.includes("matrix") || lower.includes("statistics")) {
          badgeLabel = "Comparative Intelligence";
          badgeStyle = "text-purple-700 bg-purple-500/10 border-purple-500/30";
        } else if (lower.includes("ripple") || lower.includes("market") || lower.includes("implications")) {
          badgeLabel = "Macro & Supply Chain Telemetry";
          badgeStyle = "text-amber-700 bg-amber-500/10 border-amber-500/30";
        } else if (lower.includes("faq") || lower.includes("questions")) {
          badgeLabel = "Key Analyst Q&A";
          badgeStyle = "text-blue-700 bg-blue-500/10 border-blue-500/30";
        }

        return (
          <div key={idx} className="mt-12 mb-6 pt-6 border-t border-[#b8bec7]/50 first:mt-2 first:pt-0 first:border-0">
            <div className="flex items-center gap-2 mb-2.5">
              <span className={`px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase tracking-wider border ${badgeStyle}`}>
                {badgeLabel}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-[#1a202c] tracking-tight leading-snug">
              {cleanHeading}
            </h2>
          </div>
        );
      }

      // Level 4 Sub-heading: ####
      if (trimmed.startsWith("#### ")) {
        const cleanSub = trimmed.replace("#### ", "").trim();
        return (
          <h3 key={idx} className="text-xl sm:text-2xl font-bold font-serif text-[#1a8cff] mt-8 mb-3 tracking-tight">
            {renderFormattedText(cleanSub)}
          </h3>
        );
      }

      // Blockquotes: >
      if (trimmed.startsWith("> ")) {
        const quoteContent = trimmed.replace(/^>\s*/gm, "");
        return (
          <blockquote
            key={idx}
            className="my-8 pl-6 border-l-4 border-[#1a8cff] text-[#1a202c] neu-flat p-6 rounded-r-3xl font-serif text-lg sm:text-xl italic leading-relaxed"
          >
            {renderFormattedText(quoteContent)}
          </blockquote>
        );
      }

      // Code blocks
      if (trimmed.startsWith("```")) {
        const clean = trimmed.replace(/```[a-z]*\n?/g, "");
        return (
          <pre
            key={idx}
            className="my-6 p-5 rounded-2xl neu-pressed text-[#1a8cff] font-mono text-xs overflow-x-auto leading-relaxed border border-black/5"
          >
            <code>{clean}</code>
          </pre>
        );
      }

      // Bullet lists & numbered lists
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || /^\d+\.\s/.test(trimmed)) {
        const items = trimmed.split("\n").filter((l) => l.trim().length > 0);
        return (
          <ul key={idx} className="my-6 space-y-3 pl-1">
            {items.map((item, i) => {
              const cleanedItem = item.replace(/^(\*|-|\d+\.)\s*/, "");
              return (
                <li key={i} className="flex items-start gap-3 text-base sm:text-lg text-[#2d3748] leading-relaxed">
                  <span className="w-2 h-2 rounded-full bg-[#1a8cff] mt-2.5 shrink-0 shadow-[0_0_6px_rgba(26,140,255,0.4)]" />
                  <span className="flex-1 font-sans">{renderFormattedText(cleanedItem)}</span>
                </li>
              );
            })}
          </ul>
        );
      }

      // FAQ Questions & Answers: **Q: ...?** or Q:
      if (trimmed.startsWith("**Q:") || trimmed.startsWith("**Question:") || trimmed.startsWith("Q:")) {
        const lines = trimmed.split("\n");
        const questionLine = lines[0].replace(/\*\*/g, "").replace(/^Q:\s*/i, "").trim();
        const answerLine = lines.slice(1).join(" ").replace(/\*\*/g, "").replace(/^A:\s*/i, "").trim();

        return (
          <div
            key={idx}
            className="my-6 p-6 sm:p-7 rounded-3xl neu-flat border-l-4 border-[#1a8cff] transition-all hover:shadow-lg"
          >
            <div className="flex items-center gap-2 mb-2 font-mono text-xs font-bold text-[#1a8cff] uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#1a8cff]" />
              Strategic Question &amp; Authoritative Answer
            </div>
            <h4 className="text-base sm:text-lg font-bold text-[#1a202c] font-serif mb-2 leading-snug">
              {questionLine}
            </h4>
            {answerLine && (
              <p className="text-sm sm:text-base text-[#4a5568] leading-relaxed font-sans mt-2">
                {renderFormattedText(answerLine)}
              </p>
            )}
          </div>
        );
      }

      // Standard Article Paragraph: Lead styling for opening, elegant typography for body
      const isLead = idx === 0 || (idx === 1 && sections[0].startsWith("###"));

      return (
        <p
          key={idx}
          className={`my-5 leading-relaxed sm:leading-8 ${
            isLead
              ? "text-lg sm:text-xl text-[#1a202c] font-serif font-normal"
              : "text-base sm:text-lg text-[#374151] font-sans font-light"
          }`}
        >
          {renderFormattedText(trimmed)}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#e0e5ec] text-[#2d3748] flex flex-col font-sans selection:bg-[#1a8cff] selection:text-white">
      <Header />
      <BreakingTicker articles={allArticles} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 pb-20">
        {/* Top Leaderboard Ad */}
        <div className="neu-flat p-4 mb-6">
          <AdBanner slot="header" />
        </div>

        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl neu-sm text-xs text-[#718096] hover:text-[#1a8cff] font-mono transition active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-[#1a8cff]" /> Back to Global Intelligence Wire
          </Link>
        </div>

        {/* Article Header */}
        <header className="max-w-4xl mx-auto mb-10">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span
              className={`text-xs uppercase font-bold tracking-wider px-3.5 py-1.5 rounded-xl neu-sm ${getCategoryBadgeClass(
                article.category
              )}`}
            >
              {article.category}
            </span>
            <span className="text-xs text-[#718096] font-mono flex items-center gap-1.5 neu-sm px-3 py-1.5 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-[#1a8cff]" /> 4 min read
            </span>
            <span className="text-xs text-[#718096] font-mono flex items-center gap-1.5 neu-sm px-3 py-1.5 rounded-xl">
              <Eye className="w-3.5 h-3.5 text-emerald-600" /> {article.views.toLocaleString()} reads
            </span>
            {article.youtube_video_id && (
              <span className="bg-gradient-to-r from-red-600 to-rose-600 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-red-500/20">
                <Video className="w-3.5 h-3.5" /> HD Video Briefing Included
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#2d3748] font-serif tracking-tight leading-[1.12]">
            {article.title}
          </h1>

          {/* Metadata & Social Share Row */}
          <div className="mt-8 pt-5 border-t border-[#d1d9e6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl neu-sm flex items-center justify-center font-black text-[#1a8cff] text-sm">
                MS
              </div>
              <div>
                <div className="text-xs font-bold text-[#2d3748] flex items-center gap-2">
                  <span>{article.author_name || "Muhammad Saeed (Chief Editor, GlobalPulse AI)"}</span>
                  <span className="px-2 py-0.5 rounded-md neu-pressed text-[#1a8cff] text-[10px] font-mono font-bold">
                    VERIFIED
                  </span>
                </div>
                <div className="text-[11px] text-[#718096] font-mono mt-0.5">
                  Source: <span className="text-[#2d3748] font-semibold">{article.source_name || "Tier-1 Global Wire"}</span> • Published{" "}
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
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(
                      window.location.href
                    )}`,
                    "_blank"
                  );
                }}
                className="px-3.5 py-2 rounded-xl neu-sm text-xs text-[#2d3748] hover:text-[#1a8cff] font-semibold transition active:scale-95"
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
                className="px-3.5 py-2 rounded-xl neu-sm text-xs text-[#2d3748] hover:text-[#1a8cff] font-semibold transition active:scale-95"
              >
                LinkedIn
              </button>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl neu-btn-primary text-xs font-bold transition active:scale-95"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Share2 className="w-3.5 h-3.5" />}
                {copied ? "Dossier Copied!" : "Share Dossier"}
              </button>
            </div>
          </div>

          {/* E-E-A-T Verified Editorial Author & Fact-Check Trust Banner */}
          <div className="mt-5 p-4 rounded-2xl neu-flat flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
              <span className="text-[#4a5568]">
                <strong className="text-[#2d3748]">Edited &amp; Verified by Muhammad Saeed</strong> • Lead Analyst at GlobalPulse AI (
                <a
                  href="https://www.youtube.com/@GloblePulseAi"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#1a8cff] hover:underline font-mono font-semibold"
                >
                  @GloblePulseAi
                </a>
                ) | Primary Wire Sources Checked
              </span>
            </div>
            <span className="shrink-0 text-[10px] font-mono uppercase tracking-wider text-emerald-600 neu-pressed px-3 py-1 rounded-lg font-bold">
              E-E-A-T Verified
            </span>
          </div>

          {/* AI Audio Story Briefing Player */}
          <AudioArticlePlayer
            title={article.title}
            content={article.content}
            category={article.category}
            author={article.author_name}
          />
        </header>



        {/* 2-Column Editorial Grid: Article Body (Left 8 Cols) + Sidebar (Right 4 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Article Content */}
          <div className="lg:col-span-8">
            {/* Featured Image */}
            {article.image_url && (
              <div className="rounded-3xl overflow-hidden neu-flat p-3 mb-8 aspect-video relative">
                <div className="w-full h-full rounded-2xl overflow-hidden relative">
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
                  <div className="absolute bottom-3 right-3 text-[10px] text-white/90 bg-slate-900/80 px-2.5 py-1 rounded-lg backdrop-blur font-mono">
                    GlobalPulse AI Imagery Archive
                  </div>
                </div>
              </div>
            )}

            {/* KEY TAKEAWAYS (TL;DR) EXECUTIVE BOX */}
            <div className="p-7 sm:p-8 rounded-3xl neu-flat mb-10 relative overflow-hidden border border-white/60">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[#1a8cff]" />
                <h3 className="text-xs uppercase font-mono font-bold tracking-widest text-[#1a8cff]">
                  Executive Intelligence Takeaways (TL;DR Summary)
                </h3>
              </div>

              <div className="space-y-3 text-sm sm:text-base text-[#2d3748] leading-relaxed font-sans">
                {article.summary.split("\n").map((line, i) => {
                  const cleaned = line.replace(/^•\s*/, "").trim();
                  if (!cleaned) return null;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-[#1a8cff] font-bold shrink-0 mt-1">▸</span>
                      <span className="font-medium text-[#2d3748] flex-1">{renderFormattedText(cleaned)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* EMBEDDED YOUTUBE VIDEO PLAYER */}
            {article.youtube_video_id && (
              <div className="mb-10 p-6 rounded-3xl neu-flat">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-600">
                    <Video className="w-4 h-4 text-red-500" />
                    <span>HD Video Intelligence Broadcast (GlobalPulse AI)</span>
                  </div>
                  <span className="text-[10px] text-[#718096] font-mono neu-pressed px-2.5 py-1 rounded-lg">
                    PRODUCED FOR TIER-1 AUDIENCE
                  </span>
                </div>
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-inner">
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
            <div className="prose max-w-none text-[#4a5568] font-sans leading-relaxed">
              {renderContentParagraphs(article.content)}
            </div>

            {/* CONTEXTUAL INTERNAL LINKING MODULE: Read Next / Related Intelligence */}
            {contextualRelated.length > 0 && (
              <div className="my-10 p-7 rounded-3xl neu-flat">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#d1d9e6]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#1a8cff]" />
                    <h3 className="text-xs font-mono uppercase font-bold tracking-widest text-[#1a8cff]">
                      Related Intelligence &amp; Continuous Coverage ({article.category})
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-[#718096]">Google Crawl &amp; Deep Dive</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {contextualRelated.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/news/${rel.slug}`}
                      className="group flex flex-col justify-between rounded-2xl neu-sm p-3 transition-transform duration-200 hover:-translate-y-1 overflow-hidden"
                    >
                      {rel.image_url && (
                        <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-[#d1d9e6] mb-3">
                          <img
                            src={rel.image_url}
                            alt={rel.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-mono font-bold text-[#1a8cff]">
                            {rel.category}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-[#2d3748] group-hover:text-[#1a8cff] transition line-clamp-2 mt-1 mb-2 leading-snug">
                            {rel.title}
                          </h4>
                        </div>
                        <div className="text-[10px] text-[#718096] font-mono flex items-center justify-between pt-2 border-t border-[#d1d9e6]">
                          <span>{rel.views.toLocaleString()} reads</span>
                          <span className="text-[#1a8cff] font-bold group-hover:translate-x-1 transition">
                            Read Story →
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* In-Article Ad Banner */}
            <div className="neu-flat p-4 my-8">
              <AdBanner slot="in-article" />
            </div>

            {/* In-Article Newsletter Capture Box */}
            <NewsletterBox />

            {/* Source Verification Citation */}
            <div className="mt-8 p-5 rounded-2xl neu-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#718096] font-mono">
              <div>
                Primary Reporting Wire / Document:{" "}
                <span className="text-[#2d3748] font-bold">{article.source_name || "Official Wire"}</span>
              </div>
              {article.source_url && (
                <a
                  href={article.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-[#1a8cff] hover:underline font-bold"
                >
                  Verify Source Artifact <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* AUTHOR BIO & E-E-A-T EDITORIAL TRANSPARENCY CARD */}
            <div className="mt-8 p-6 sm:p-7 rounded-3xl neu-flat relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl neu-sm flex items-center justify-center font-black text-[#1a8cff] text-xl shrink-0">
                  MS
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm sm:text-base font-bold text-[#2d3748]">Muhammad Saeed</h4>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-lg neu-pressed text-[#1a8cff] font-bold">
                      Chief Editor &amp; AI Analyst
                    </span>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-lg neu-pressed text-emerald-600 font-bold">
                      Tier-1 Corroborated
                    </span>
                  </div>
                  <p className="text-xs text-[#718096] mt-1.5 leading-relaxed">
                    Lead analyst at{" "}
                    <a
                      href="https://www.youtube.com/@GloblePulseAi"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#1a8cff] hover:underline font-semibold"
                    >
                      GlobalPulse AI (@GloblePulseAi)
                    </a>
                    . Leading high-gain automated news intelligence, technological foresight, and macroeconomic analysis. Every dispatch is synthesized strictly from tier-1 wires and official filings under rigorous E-E-A-T editorial standards.
                  </p>
                </div>
                <a
                  href="https://www.youtube.com/@GloblePulseAi"
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-600/20 transition active:scale-95"
                >
                  <Video className="w-3.5 h-3.5" /> Watch on YouTube
                </a>
              </div>
            </div>

            {/* Article Detail Page In-Article Ad Slot */}
            <div className="neu-flat p-4 my-8">
              <AdBanner slot="in-article" />
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            {/* 300x600 Skyscraper AdSense / House Ad */}
            <div className="neu-flat p-4">
              <AdBanner slot="sidebar" />
            </div>

            {/* Most Read Trending Intelligence */}
            <div className="p-6 rounded-3xl neu-flat">
              <h4 className="text-xs uppercase font-mono font-bold tracking-widest text-[#2d3748] mb-5 pb-2 border-b border-[#d1d9e6]">
                Most Read Intelligence Dossiers
              </h4>
              <div className="space-y-4">
                {sidebarTrending.map((rel, idx) => (
                  <Link
                    key={rel.id}
                    href={`/news/${rel.slug}`}
                    className="group block pb-3.5 border-b border-[#d1d9e6] last:border-0 last:pb-0 transition-transform duration-200 hover:translate-x-1"
                  >
                    <div className="flex items-start gap-3.5">
                      <span className="text-xl font-serif font-black text-[#a0aec0] group-hover:text-[#1a8cff] transition">
                        0{idx + 1}
                      </span>
                      <div>
                        <span className="text-[10px] text-[#1a8cff] font-mono uppercase font-bold">
                          {rel.category}
                        </span>
                        <h5 className="text-xs font-bold text-[#2d3748] group-hover:text-[#1a8cff] transition leading-snug">
                          {rel.title}
                        </h5>
                        <div className="text-[10px] text-[#718096] font-mono mt-1 flex items-center gap-2">
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

        {/* Full-Width Continuous Wire & Recommended Stories Grid */}
        {allArticles.filter((a) => a.id !== article.id).length > 0 && (
          <section className="mt-16 pt-12 border-t border-[#d1d9e6]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
              <div>
                <span className="text-[11px] font-mono uppercase font-bold tracking-widest text-[#1a8cff] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#1a8cff] animate-pulse" />
                  Live Wire Radar
                </span>
                <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#2d3748] mt-1">
                  Trending Stories You May Like
                </h3>
              </div>
              <Link
                href="/"
                className="text-xs font-mono text-[#1a8cff] hover:underline font-bold flex items-center gap-1.5 group"
              >
                <span>Browse All Intelligence Dossiers</span>
                <span className="group-hover:translate-x-1 transition font-mono">→</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {allArticles
                .filter((a) => a.id !== article.id)
                .slice(0, 4)
                .map((item) => (
                  <Link
                    key={item.id}
                    href={`/news/${item.slug}`}
                    className="group flex flex-col justify-between rounded-3xl neu-flat p-4 transition-transform duration-300 hover:-translate-y-1 overflow-hidden"
                  >
                    <div>
                      {item.image_url ? (
                        <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-[#d1d9e6] mb-3.5">
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                          <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-lg bg-slate-900/80 backdrop-blur-md text-[10px] font-mono font-bold uppercase text-white">
                            {item.category}
                          </span>
                        </div>
                      ) : (
                        <div className="mb-2">
                          <span className="px-2.5 py-0.5 rounded-lg neu-pressed text-[10px] font-mono font-bold uppercase text-[#1a8cff]">
                            {item.category}
                          </span>
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-[#2d3748] group-hover:text-[#1a8cff] transition line-clamp-2 leading-snug">
                          {item.title}
                        </h4>
                        <p className="text-xs text-[#718096] line-clamp-2 mt-2 leading-relaxed">
                          {item.summary.replace(/^[•▸*-\s]+/gm, " ").trim()}
                        </p>
                      </div>
                    </div>
                    <div className="pt-3 mt-3 border-t border-[#d1d9e6] flex items-center justify-between text-[11px] font-mono text-[#718096]">
                      <span>{item.views.toLocaleString()} reads</span>
                      <span className="text-[#1a8cff] font-bold group-hover:translate-x-1 transition">
                        Read Story →
                      </span>
                    </div>
                  </Link>
                ))}
            </div>
          </section>
        )}
      </main>

      {/* Sticky Bottom Ad Banner */}
      <AdBanner slot="sticky-footer" />

      <Footer />
    </div>
  );
}
