import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchArticles } from "../lib/api";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { BreakingTicker } from "./BreakingTicker";
import { AdUnit } from "./AdUnit";
import { NewsletterBox } from "./NewsletterBox";
import { getHdImageUrl } from "../lib/imageOptimizer";
import { getCategoryTheme } from "../lib/categoryTheme";
import { Eye, Sparkles, ChevronLeft, ChevronRight } from "./Icons";
import { formatPublishedUtc, parseIsoUtc } from "../lib/formatDate";

export const CATEGORY_MAP: Record<string, { name: string; intro: string }> = {
  "ai-tech": {
    name: "AI & Tech",
    intro:
      "Independent reporting and analysis on artificial intelligence, computing architecture, and software breakthroughs. We track how technical advances reshape global industry without hype or corporate jargon.",
  },
  markets: {
    name: "Markets",
    intro:
      "Objective coverage of international financial markets, sovereign debt, central bank policies, and commodities. Every dispatch provides plain-English context on asset flows and global economic trends.",
  },
  "world-politics": {
    name: "World Politics",
    intro:
      "Verified dispatches on international diplomacy, elections, defense policy, and global alliances. Our team presents the facts clearly with balanced context for US and UK readers.",
  },
  science: {
    name: "Science",
    intro:
      "Fact-based reporting on space exploration, energy transitions, climate research, and scientific discoveries. We distill peer-reviewed studies and primary announcements into concise, accessible journalism.",
  },
  sports: {
    name: "Sports",
    intro:
      "Essential results, tactical summaries, and championship coverage from leading global sporting competitions. We focus on confirmed scores, fixture context, and verified player achievements.",
  },
  entertainment: {
    name: "Entertainment",
    intro:
      "Timely news covering cinema, streaming, television productions, and gaming industry developments. We deliver accurate dispatches on releases, box office results, and creative talent.",
  },
};

function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function getCategoryPageCanonical(slug: string, pageNumber: number = 1): string {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://theglobalpulseai.com").replace(/\/$/, "");
  return pageNumber > 1 ? `${siteUrl}/category/${slug}/page/${pageNumber}` : `${siteUrl}/category/${slug}`;
}

export async function getCategoryMetadata(slug: string, pageNumber: number = 1): Promise<Metadata> {
  const cat = CATEGORY_MAP[slug];
  if (!cat) {
    return {
      title: { absolute: "Category Not Found | GlobalPulse AI" },
      robots: { index: false, follow: false },
    };
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://theglobalpulseai.com").replace(/\/$/, "");
  const canonicalUrl = getCategoryPageCanonical(slug, pageNumber);
  const pageTitle =
    pageNumber > 1
      ? `${cat.name} News & Analysis - Page ${pageNumber} | GlobalPulse AI`
      : `${cat.name} News & In-Depth Analysis | GlobalPulse AI`;

  return {
    title: {
      absolute: pageTitle,
    },
    description: cat.intro,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: canonicalUrl,
      title: pageTitle,
      description: cat.intro,
      siteName: "GlobalPulse AI",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: cat.intro,
    },
  };
}

export interface CategoryViewProps {
  slug: string;
  pageNumber: number;
}

export async function CategoryView({ slug, pageNumber }: CategoryViewProps) {
  const cat = CATEGORY_MAP[slug];
  if (!cat || isNaN(pageNumber) || pageNumber < 1) {
    notFound();
  }

  const pageSize = 24;
  const skip = (pageNumber - 1) * pageSize;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://theglobalpulseai.com").replace(/\/$/, "");
  const canonicalUrl = getCategoryPageCanonical(slug, pageNumber);
  const theme = getCategoryTheme(cat.name);

  let categoryArticles: any[] = [];
  let totalArticles = 0;

  try {
    const res = await fetchArticles({
      category: cat.name,
      status: "PUBLISHED",
      skip,
      limit: pageSize,
      revalidate: 60,
    });
    categoryArticles = res.items || [];
    totalArticles = typeof res.total === "number" ? res.total : categoryArticles.length;
  } catch (err) {
    console.error(`[CategoryView] Error loading category ${slug} page ${pageNumber}:`, err);
  }

  const totalPages = Math.max(1, Math.ceil(totalArticles / pageSize));
  if (pageNumber > totalPages && totalArticles > 0) {
    notFound();
  }

  // 1. BreadcrumbList JSON-LD Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: cat.name,
        item: `${siteUrl}/category/${slug}`,
      },
    ],
  };

  // 2. CollectionPage JSON-LD Schema
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${cat.name} News & Analysis | GlobalPulse AI`,
    description: cat.intro,
    url: canonicalUrl,
    inLanguage: "en",
    publisher: {
      "@type": "NewsMediaOrganization",
      name: "GlobalPulse AI",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo_wide_light.png`,
        width: 400,
        height: 50,
      },
    },
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(collectionPageSchema) }}
      />

      <Header />
      <BreakingTicker articles={categoryArticles.slice(0, 5)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 pb-20">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-6">
          <Link href="/" className="hover:text-cyan-300 transition">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-200">Categories</span>
          <span>/</span>
          <Link href={`/category/${slug}`} className="text-cyan-400 font-semibold hover:underline">
            {cat.name}
          </Link>
          {pageNumber > 1 && (
            <>
              <span>/</span>
              <span className="text-slate-400">Page {pageNumber}</span>
            </>
          )}
        </div>

        {/* Category Hero / Header */}
        <header className="neu-flat p-8 sm:p-10 rounded-3xl mb-10 border border-white/10 relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs uppercase font-mono font-bold tracking-wider px-3 py-1 rounded-md border ${theme.badge}`}>
                {cat.name}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {totalArticles} {totalArticles === 1 ? "Story" : "Stories"}
                {totalPages > 1 && ` • Page ${pageNumber} of ${totalPages}`}
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black font-serif text-white tracking-tight leading-tight mb-4">
              {cat.name} {pageNumber > 1 && <span className="text-xl sm:text-2xl text-slate-400 font-sans font-normal">(Page {pageNumber})</span>}
            </h1>
            <p className="text-base sm:text-lg text-slate-300 font-sans leading-relaxed">
              {cat.intro}
            </p>
          </div>
        </header>

        {/* Top Ad Slot (Adsterra 728x90) */}
        <AdUnit type="leaderboard" className="mb-10" />

        {/* Articles Grid */}
        {categoryArticles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryArticles.map((article) => {
                const cleanHeadline = (article.title || "").replace(/\s*\|\s*GlobalPulse AI/gi, "").trim();
                const publishedDate = article.published_at || article.created_at;
                const formattedDate = formatPublishedUtc(publishedDate) || "Recent";
                const isoDateTime = parseIsoUtc(publishedDate)?.toISOString() || "";

                const firstSentence = (article.summary || article.content || "")
                  .replace(/^[•▸*-\s]+/gm, "")
                  .replace(/\s+/g, " ")
                  .split(".")[0]
                  .trim();
                const snippet = firstSentence ? `${firstSentence}.` : "";

                return (
                  <Link
                    key={article.id}
                    href={`/news/${article.slug}`}
                    className="group flex flex-col justify-between rounded-2xl neu-flat p-4 border border-white/5 transition duration-200 hover:-translate-y-1 hover:border-cyan-500/30"
                  >
                    <div>
                      {article.image_url && (
                        <div className="aspect-[16/9] w-full rounded-xl overflow-hidden bg-slate-900 mb-4 relative">
                          <img
                            src={getHdImageUrl(article.image_url)}
                            alt={cleanHeadline}
                            className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                            loading="lazy"
                            decoding="async"
                            width={600}
                            height={338}
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-2 text-[11px] font-mono text-slate-400">
                        <span className="text-cyan-400 font-semibold">{cat.name}</span>
                        <span>•</span>
                        {isoDateTime ? (
                          <time dateTime={isoDateTime}>{formattedDate}</time>
                        ) : (
                          <span>{formattedDate}</span>
                        )}
                      </div>
                      <h2 className="text-base sm:text-lg font-bold font-serif text-white leading-snug line-clamp-2 group-hover:text-cyan-300 transition mb-2">
                        {cleanHeadline}
                      </h2>
                      {snippet && (
                        <p className="text-xs sm:text-sm text-slate-300 font-sans line-clamp-2 leading-relaxed">
                          {snippet}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-emerald-400" /> {(article.views || 0).toLocaleString()} reads
                      </span>
                      <span className="text-cyan-400 font-semibold group-hover:translate-x-1 transition">
                        Read Story →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav aria-label="Category page navigation" className="mt-12 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-2">
                {/* Previous Page Link */}
                {pageNumber > 1 ? (
                  <Link
                    href={pageNumber === 2 ? `/category/${slug}` : `/category/${slug}/page/${pageNumber - 1}`}
                    className="neu-sm px-4 py-2 text-xs font-mono font-bold text-slate-200 hover:text-cyan-300 transition flex items-center gap-1 border border-white/5 rounded-xl"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </Link>
                ) : (
                  <span className="px-4 py-2 text-xs font-mono text-slate-600 border border-white/5 rounded-xl opacity-40 cursor-not-allowed flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </span>
                )}

                {/* Page Number Links */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - pageNumber) <= 2)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && p - prev > 1;
                    const isCurrent = p === pageNumber;
                    const pageHref = p === 1 ? `/category/${slug}` : `/category/${slug}/page/${p}`;

                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && (
                          <span className="px-2 text-slate-600 font-mono text-xs select-none">…</span>
                        )}
                        <Link
                          href={pageHref}
                          className={`w-9 h-9 rounded-xl text-xs font-mono font-bold flex items-center justify-center transition border ${
                            isCurrent
                              ? "neu-pressed text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)] bg-cyan-950/40"
                              : "neu-sm text-slate-300 hover:text-white border-white/5 hover:border-cyan-500/30"
                          }`}
                          aria-current={isCurrent ? "page" : undefined}
                        >
                          {p}
                        </Link>
                      </React.Fragment>
                    );
                  })}

                {/* Next Page Link */}
                {pageNumber < totalPages ? (
                  <Link
                    href={`/category/${slug}/page/${pageNumber + 1}`}
                    className="neu-sm px-4 py-2 text-xs font-mono font-bold text-slate-200 hover:text-cyan-300 transition flex items-center gap-1 border border-white/5 rounded-xl"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <span className="px-4 py-2 text-xs font-mono text-slate-600 border border-white/5 rounded-xl opacity-40 cursor-not-allowed flex items-center gap-1">
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                )}
              </nav>
            )}
          </>
        ) : (
          <div className="neu-flat p-12 rounded-3xl text-center border border-white/5 max-w-lg mx-auto">
            <Sparkles className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white font-serif mb-2">Coverage Updating</h3>
            <p className="text-xs text-slate-400 font-mono mb-6 leading-relaxed">
              New reporting in {cat.name} is currently being verified by the editorial desk.
            </p>
            <Link href="/" className="neu-btn-primary px-5 py-2.5 text-xs font-bold inline-block">
              Return to All Stories
            </Link>
          </div>
        )}

        {/* Newsletter Capture */}
        <div className="mt-12">
          <NewsletterBox />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default CategoryView;
