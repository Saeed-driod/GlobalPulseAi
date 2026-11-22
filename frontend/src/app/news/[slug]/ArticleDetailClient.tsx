"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Article } from "../../../types/article";
import { fetchArticleBySlug, fetchArticles } from "../../../lib/api";
import { Header } from "../../../components/Header";
import { BreakingTicker } from "../../../components/BreakingTicker";
import { AdBanner } from "../../../components/AdBanner";
import { AdSlot } from "../../../components/AdSlot";
import { AdUnit } from "../../../components/AdUnit";
import { useDirectLink } from "../../../lib/useDirectLink";
import { NewsletterBox } from "../../../components/NewsletterBox";
import { Footer } from "../../../components/Footer";
import { AudioArticlePlayer } from "../../../components/AudioArticlePlayer";
import { VideoStudio } from "../../../components/VideoStudio";
import {
  ArrowLeft,
  Share2,
  Eye,
  Clock,
  Sparkles,
  CheckCircle2,
  Video,
  ExternalLink,
  Briefcase,
} from "../../../components/Icons";
import { getCategoryTheme } from "../../../lib/categoryTheme";
import { getHdImageUrl, getPollinationsFallback } from "../../../lib/imageOptimizer";
import { formatPublishedUtc, parseIsoUtc } from "../../../lib/formatDate";

interface ArticleDetailClientProps {
  initialArticle?: Article | null;
  slug: string;
  initialRelatedArticles?: Article[];
}

function getCategorySlug(categoryName?: string | null): string {
  const norm = (categoryName || "").toLowerCase();
  if (norm.includes("ai") || norm.includes("tech")) return "ai-tech";
  if (norm.includes("market") || norm.includes("econom")) return "markets";
  if (norm.includes("politic") || norm.includes("geopolitic")) return "world-politics";
  if (norm.includes("science")) return "science";
  if (norm.includes("sport")) return "sports";
  if (norm.includes("entertainment") || norm.includes("movie") || norm.includes("cinema")) return "entertainment";
  return "ai-tech";
}

export function ArticleDetailClient({ initialArticle, slug, initialRelatedArticles }: ArticleDetailClientProps) {
  const [article, setArticle] = useState<Article | null>(initialArticle || null);
  const [allArticles, setAllArticles] = useState<Article[]>(initialRelatedArticles || []);
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(!initialArticle);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isStudioOpen, setIsStudioOpen] = useState<boolean>(false);
  const { handleActionClick } = useDirectLink();

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100)));
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!initialArticle && slug) {
      setLoading(true);
      fetchArticleBySlug(slug).then((res) => {
        setArticle(res);
        setLoading(false);
      });
    }

    fetchArticles({ limit: 12 }).then((res) => {
      setAllArticles(res.items || []);
    });
  }, [slug, initialArticle]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col justify-center items-center font-mono">
        <Sparkles className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
        <p className="text-xs text-slate-400 tracking-wider uppercase font-semibold">
          Loading article...
        </p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col justify-center items-center p-6 text-center">
        <div className="p-8 rounded-3xl neu-flat max-w-md border border-white/10">
          <h2 className="text-2xl font-bold font-serif mb-2 text-white">Article Not Found</h2>
          <p className="text-slate-400 mb-6 text-xs font-mono">The requested article could not be retrieved from the wire.</p>
          <Link
            href="/"
            className="px-6 py-3 neu-btn-primary font-bold text-xs inline-block"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // 6 related articles prioritized by same category first
  const sameCategoryArticles = allArticles.filter(
    (a) => a.id !== article.id && a.category === article.category
  );
  const otherCategoryArticles = allArticles.filter(
    (a) => a.id !== article.id && a.category !== article.category
  );
  const relatedArticles = initialRelatedArticles && initialRelatedArticles.length > 0
    ? initialRelatedArticles
    : [...sameCategoryArticles, ...otherCategoryArticles].slice(0, 6);
  const sidebarTrending = allArticles.filter((a) => a.id !== article.id).slice(0, 4);

  // Extract Key Points (3 bullets) from summary
  const keyPoints = article.summary
    .split("\n")
    .map((line) => line.replace(/^[•▸*-\s]+/, "").trim())
    .filter((line) => line.length > 0)
    .slice(0, 3);

  // Decompose article content into Body and Why It Matters (Analysis)
  // Strictly filter out any legacy fabricated tables and FAQ blocks
  let rawBody = article.content || "";
  let whyItMattersText = "";

  // Check for "Why It Matters" heading
  const whyItMattersRegex = /###\s*(?:Why It Matters|Why it matters)(?:[^\n]*)\n+([\s\S]*?)(?=(?:\n###|$))/i;
  const whyMatch = rawBody.match(whyItMattersRegex);
  if (whyMatch) {
    whyItMattersText = whyMatch[1].trim();
    rawBody = rawBody.replace(whyItMattersRegex, "").trim();
  }

  // Filter out any legacy tables or FAQs
  const cleanBodyText = rawBody
    .split("\n\n")
    .filter((section) => {
      const trimmed = section.trim();
      if (!trimmed) return false;
      // Strip markdown tables
      if (trimmed.startsWith("|") && trimmed.includes("\n|")) return false;
      // Strip FAQs
      if (/###\s*Frequently Asked Questions/i.test(trimmed)) return false;
      if (trimmed.startsWith("**Q:") || trimmed.startsWith("Q:")) return false;
      // Strip generic comparison headers
      if (/###\s*Player Performance & Match Statistics/i.test(trimmed)) return false;
      if (/###\s*Strategic Market Comparison/i.test(trimmed)) return false;
      return true;
    })
    .join("\n\n");

  // Inline markdown formatter: bold, italic, code, links
  const renderFormattedText = (rawText: string): React.ReactNode => {
    if (!rawText) return null;
    const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
    const parts = rawText.split(pattern);

    return parts.map((part, index) => {
      if (!part) return null;
      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        return (
          <strong key={index} className="font-semibold text-white">
            {part.slice(2, -2).trim()}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
        return (
          <em key={index} className="italic text-slate-300">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
        return (
          <code key={index} className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
            {part.slice(1, -1)}
          </code>
        );
      }
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const [, linkTitle, linkUrl] = linkMatch;
        const isInternal = linkUrl.startsWith("/") || linkUrl.startsWith("#");
        if (isInternal) {
          return (
            <Link
              key={index}
              href={linkUrl}
              className="text-cyan-400 font-medium underline underline-offset-4 decoration-cyan-400/40 hover:text-cyan-300"
            >
              {linkTitle}
            </Link>
          );
        }
        return (
          <a
            key={index}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 font-medium underline underline-offset-4 decoration-cyan-400/40 hover:text-cyan-300"
          >
            {linkTitle}
          </a>
        );
      }
      return <React.Fragment key={index}>{part.replace(/\*\*/g, "")}</React.Fragment>;
    });
  };

  const renderParagraphs = (content: string) => {
    return content.split("\n\n").map((section, idx) => {
      const trimmed = section.trim();
      if (!trimmed) return null;

      const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
      if (headingMatch) {
        const headingText = headingMatch[2].replace(/\*\*/g, "").trim();
        return (
          <h2 key={idx} className="text-xl sm:text-2xl font-bold font-serif text-white mt-8 mb-4 tracking-tight">
            {headingText}
          </h2>
        );
      }

      if (trimmed.startsWith("> ")) {
        return (
          <blockquote
            key={idx}
            className="my-6 pl-5 border-l-4 border-cyan-400/80 text-slate-200 italic font-serif text-base sm:text-lg leading-relaxed bg-slate-900/40 p-4 rounded-r-xl"
          >
            {renderFormattedText(trimmed.replace(/^>\s*/gm, ""))}
          </blockquote>
        );
      }

      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        const items = trimmed.split("\n").filter((l) => l.trim().length > 0);
        return (
          <ul key={idx} className="my-4 space-y-2 pl-2">
            {items.map((it, i) => (
              <li key={i} className="flex items-start gap-2.5 text-slate-200 leading-relaxed text-base">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                <span>{renderFormattedText(it.replace(/^(\*|-)\s*/, ""))}</span>
              </li>
            ))}
          </ul>
        );
      }

      return (
        <p key={idx} className="my-4 text-base sm:text-lg text-slate-200 font-sans font-normal leading-relaxed sm:leading-8">
          {renderFormattedText(trimmed)}
        </p>
      );
    });
  };

  const publishedDate = article.published_at || article.created_at;
  const formattedPublished = formatPublishedUtc(publishedDate) || "Recently published";
  const isoPublished = parseIsoUtc(publishedDate)?.toISOString() || "";

  // Show "Updated: ..." only when updated_at is more than 1 hour after published_at
  const showUpdated = React.useMemo(() => {
    if (!article.updated_at || !publishedDate) return false;
    const pubD = parseIsoUtc(publishedDate);
    const updD = parseIsoUtc(article.updated_at);
    if (!pubD || !updD) return false;
    const ONE_HOUR_MS = 60 * 60 * 1000;
    return updD.getTime() - pubD.getTime() > ONE_HOUR_MS;
  }, [article.updated_at, publishedDate]);

  const formattedUpdated = showUpdated ? formatPublishedUtc(article.updated_at) : "";
  const isoUpdated = showUpdated ? parseIsoUtc(article.updated_at)?.toISOString() || "" : "";

  const cleanHeadline = article.title.replace(/\s*\|\s*GlobalPulse AI/gi, "").trim();

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Reading Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-900/60 z-50 pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-cyan-300 transition-all duration-100"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <Header />
      <BreakingTicker articles={allArticles} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-20">
        {/* Top Leaderboard Ad (Adsterra 728x90) */}
        <AdUnit type="leaderboard" className="mb-6 max-w-5xl mx-auto" />

        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl neu-sm text-xs text-slate-400 hover:text-cyan-300 font-mono transition border border-white/5"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" /> Back to News
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Article Container */}
          <article className="lg:col-span-8">
            {/* 1. Headline */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={`text-[11px] uppercase font-mono font-bold tracking-wider px-2.5 py-1 rounded-md border ${
                  getCategoryTheme(article.category).badge
                }`}
              >
                {article.category}
              </span>
              <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" /> 3 min read
              </span>
              {article.views > 0 && (
                <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <Eye className="w-3 h-3 text-emerald-400" /> {article.views.toLocaleString()} reads
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-[2.65rem] font-bold text-white font-serif tracking-tight leading-tight sm:leading-[1.2] mb-3">
              {cleanHeadline}
            </h1>

            {/* AI Disclosure near top */}
            <p className="text-xs text-slate-400 font-mono mb-4 flex flex-wrap items-center gap-1">
              <span>AI-assisted summary based on reporting from</span>
              {article.source_url ? (
                <a
                  href={article.source_url}
                  target="_blank"
                  rel="nofollow noopener sponsored"
                  className="text-cyan-400 hover:text-cyan-300 hover:underline font-medium inline-flex items-center gap-0.5"
                >
                  {article.source_name || "original source"}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-slate-300 font-medium">
                  {article.source_name || "original source"}
                </span>
              )}
              <span>.</span>
              <Link
                href="/about"
                className="text-slate-400 hover:text-cyan-300 underline underline-offset-2 ml-1"
              >
                About our reporting
              </Link>
            </p>

            {/* 2. Byline + Published/Updated Date */}
            <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-y border-white/10 mb-6 text-xs text-slate-300 font-mono">
              <div className="flex flex-wrap items-center gap-2">
                <span>By <strong className="text-white">GlobalPulse AI Desk</strong></span>
                <span>•</span>
                <span>
                  Published{" "}
                  {isoPublished ? (
                    <time dateTime={isoPublished}>{formattedPublished}</time>
                  ) : (
                    formattedPublished
                  )}
                </span>
                {showUpdated && (
                  <>
                    <span>•</span>
                    <span>
                      Updated{" "}
                      {isoUpdated ? (
                        <time dateTime={isoUpdated}>{formattedUpdated}</time>
                      ) : (
                        formattedUpdated
                      )}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md neu-sm text-slate-300 hover:text-white transition"
                >
                  {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
                  {copied ? "Link Copied" : "Share"}
                </button>
              </div>
            </div>

            {/* Featured Image */}
            {article.image_url && (
              <div className="rounded-2xl overflow-hidden neu-flat p-2 mb-8 aspect-video relative">
                <div className="w-full h-full rounded-xl overflow-hidden relative bg-slate-900">
                  <img
                    src={getHdImageUrl(article.image_url, cleanHeadline, article.category)}
                    alt={cleanHeadline}
                    className="w-full h-full object-cover"
                    width={1200}
                    height={675}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    onError={(e) => {
                      const seed = typeof article.id === "number" ? article.id : 100;
                      (e.target as HTMLImageElement).src = getPollinationsFallback(cleanHeadline, article.category, seed);
                    }}
                  />
                </div>
              </div>
            )}

            {/* 3. Key Points (3 concrete facts from source) */}
            {keyPoints.length > 0 && (
              <div className="p-6 sm:p-7 rounded-2xl neu-flat mb-8 border border-cyan-500/30 bg-slate-950/60">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-cyan-300">
                    Key Points
                  </h3>
                </div>
                <ul className="space-y-2.5">
                  {keyPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm sm:text-base text-slate-200 leading-relaxed font-sans">
                      <span className="text-cyan-400 font-bold mt-1 text-sm">•</span>
                      <span className="flex-1">{renderFormattedText(point)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Audio Article Briefing */}
            <AudioArticlePlayer
              title={cleanHeadline}
              content={cleanBodyText}
              category={article.category}
              author="GlobalPulse AI Desk"
            />

            {/* AI Video Studio Briefing */}
            <div className="my-6">
              <button
                type="button"
                onClick={() => setIsStudioOpen(true)}
                className="w-full neu-flat p-4 rounded-2xl flex items-center justify-between group hover:border-cyan-500/50 transition-all cursor-pointer bg-gradient-to-r from-slate-900/60 via-cyan-950/20 to-slate-900/60"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
                    <Video className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">
                        Watch AI Video Briefing (35s)
                      </span>
                      <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                        Studio Mode
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Watch fast-paced video briefing with dynamic news B-roll & synced captions
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition-transform">
                  <span>Open Studio</span>
                  <span>→</span>
                </div>
              </button>
            </div>

            {/* Video broadcast embed if available */}
            {article.youtube_video_id && (
              <div className="my-8 p-4 rounded-2xl neu-flat">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-500 mb-3">
                  <Video className="w-4 h-4" />
                  <span>Video Briefing</span>
                </div>
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube-nocookie.com/embed/${article.youtube_video_id}?autoplay=0&rel=0`}
                    title={cleanHeadline}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* 4. Body (Inverted pyramid: who/what/when/where first, then context) */}
            <div className="prose max-w-none text-slate-200 font-sans my-6">
              {renderParagraphs(cleanBodyText)}
            </div>

            {/* 5. "Why it matters" (Labelled Analysis) */}
            {whyItMattersText && (
              <div className="my-8 p-6 sm:p-7 rounded-2xl neu-flat border-l-4 border-indigo-400 bg-slate-950/70">
                <div className="flex items-center gap-2 mb-2 font-mono text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  Analysis: Why It Matters
                </div>
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans">
                  {renderFormattedText(whyItMattersText)}
                </p>
              </div>
            )}

            {/* 6. Source: {name} - read the original (link) */}
            <div className="my-6 p-4 rounded-xl neu-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 font-mono border border-white/5">
              <div>
                Source: <span className="text-white font-semibold">{article.source_name || "Official Wire"}</span>
              </div>
              {article.source_url && (
                <a
                  href={article.source_url}
                  onClick={(e) => handleActionClick(e, article.source_url!)}
                  target="_blank"
                  rel="nofollow noopener sponsored"
                  className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 hover:underline font-semibold cursor-pointer"
                >
                  Read the original <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Editorial Disclosure */}
            <div className="my-6 text-xs text-slate-400 font-mono italic">
              Written with AI assistance from the cited source.{" "}
              <Link href="/about" className="text-cyan-400 hover:underline not-italic">
                See our editorial policy
              </Link>
              .
            </div>

            {/* 7. 6 Related Articles from the Same Category (Server-Rendered Links) */}
            {relatedArticles.length > 0 && (
              <div className="my-10 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-cyan-300">
                    Related Stories in {article.category}
                  </h3>
                  <Link
                    href={`/category/${getCategorySlug(article.category)}`}
                    className="text-xs text-slate-400 hover:text-cyan-300 font-mono transition"
                  >
                    More in {article.category} →
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {relatedArticles.map((rel) => {
                    const cleanRelTitle = rel.title.replace(/\s*\|\s*GlobalPulse AI/gi, "").trim();
                    const cleanExcerpt = (rel.summary || rel.content || "")
                      .replace(/^[•▸*-\s]+/gm, "")
                      .replace(/\s+/g, " ")
                      .split(".")[0]
                      .trim();
                    const excerptText = cleanExcerpt ? `${cleanExcerpt}.` : "";

                    return (
                      <Link
                        key={rel.id}
                        href={`/news/${rel.slug}`}
                        className="group flex flex-col justify-between rounded-xl neu-sm p-3.5 border border-white/5 transition hover:-translate-y-0.5"
                      >
                        <div>
                          {rel.image_url && (
                            <div className="aspect-[16/9] w-full rounded-lg overflow-hidden bg-slate-900 mb-2.5 relative">
                              <img
                                src={getHdImageUrl(rel.image_url, cleanRelTitle, rel.category)}
                                alt={cleanRelTitle}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                width={400}
                                height={225}
                                loading="lazy"
                                decoding="async"
                              />
                            </div>
                          )}
                          <span className="text-[10px] uppercase font-mono text-cyan-400 font-semibold">
                            {rel.category}
                          </span>
                          <h4 className="text-xs sm:text-sm font-semibold text-white line-clamp-2 mt-1 leading-snug group-hover:text-cyan-300 transition">
                            {cleanRelTitle}
                          </h4>
                          {excerptText && (
                            <p className="text-xs text-slate-400 font-sans line-clamp-2 mt-1.5 leading-relaxed">
                              {excerptText}
                            </p>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                          <span className="text-cyan-400 font-semibold group-hover:translate-x-0.5 transition">
                            Read story →
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-6 text-center">
                  <Link
                    href={`/category/${getCategorySlug(article.category)}`}
                    className="neu-sm inline-flex items-center gap-2 px-5 py-2.5 text-xs font-mono font-bold text-cyan-300 hover:text-white transition rounded-xl border border-white/5"
                  >
                    <span>More in {article.category} →</span>
                  </Link>
                </div>
              </div>
            )}

            {/* In-Article Ad Banner (Adsterra 300x250 Isolated Execution) */}
            <AdUnit type="article" className="w-full my-8" />

            {/* Exclusive High-Impact GlobalHire Remote Career Spotlight */}
            <div className="my-8 p-6 rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/80 via-slate-900/90 to-teal-950/70 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-start justify-between gap-4 relative z-10">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      GLOBAL CAREER RADAR
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">$80,000 – $190,000 / Year</span>
                    <span className="text-[11px] font-mono text-slate-400">Powered by GlobalHire AI</span>
                  </div>
                  <h4 className="text-base sm:text-xl font-bold text-white tracking-tight leading-snug">
                    Want to Work Remotely for US &amp; Global Tech Companies?
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl font-sans">
                    400+ verified remote positions in AI engineering, cloud development, design, and executive leadership are hiring now worldwide. Fast-track direct application with guaranteed employer delivery.
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 relative z-10">
                <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-mono text-slate-300">
                  <span className="text-emerald-400 font-bold">✓ 100% Remote</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">✓ USD Salary</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">✓ Zero Middlemen</span>
                </div>
                <a
                  href="https://globalhireai.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs font-mono tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <span>BROWSE 400+ REMOTE ROLES</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Newsletter Box */}
            <NewsletterBox />
          </article>

          {/* Right Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Sticky Sidebar Banner (Adsterra 300x250) */}
            <AdUnit type="sidebar" className="sticky top-24" />

            {/* Trending News */}
            <div className="p-5 rounded-2xl neu-flat border border-white/5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-white">
                  Trending Dispatches
                </h3>
              </div>

              <div className="space-y-3.5">
                {sidebarTrending.map((trend) => (
                  <Link
                    key={trend.id}
                    href={`/news/${trend.slug}`}
                    className="block group"
                  >
                    <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold">
                      {trend.category}
                    </span>
                    <h4 className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 transition line-clamp-2 leading-snug mt-0.5">
                      {trend.title.replace(/\s*\|\s*GlobalPulse AI/gi, "")}
                    </h4>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* AI Video Studio Modal */}
      <VideoStudio
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        initialArticle={{
          title: cleanHeadline,
          summary: article.summary,
          content: cleanBodyText,
          category: article.category,
          image_url: article.image_url,
        }}
      />

      <Footer />
    </div>
  );
}
