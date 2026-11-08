import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchArticles } from "../../../lib/api";
import { Header } from "../../../components/Header";
import { Footer } from "../../../components/Footer";
import { BreakingTicker } from "../../../components/BreakingTicker";
import { AdBanner } from "../../../components/AdBanner";
import { NewsletterBox } from "../../../components/NewsletterBox";
import { getHdImageUrl, getPollinationsFallback } from "../../../lib/imageOptimizer";
import { getCategoryTheme } from "../../../lib/categoryTheme";
import { ArrowLeft, Clock, Eye, Sparkles } from "../../../components/Icons";

export const dynamic = "force-dynamic";

interface CategoryMeta {
  name: string;
  intro: string;
}

const CATEGORY_MAP: Record<string, CategoryMeta> = {
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

interface PageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

function matchesCategory(articleCat: string, targetCategory: string): boolean {
  const normArt = (articleCat || "").toLowerCase();
  const normTarget = targetCategory.toLowerCase();
  if (normArt === normTarget) return true;
  if (normTarget === "markets" && (normArt.includes("market") || normArt.includes("econom"))) return true;
  if (normTarget === "sports" && normArt.includes("sport")) return true;
  if (normTarget === "science" && normArt.includes("science")) return true;
  if (normTarget === "world politics" && (normArt.includes("politic") || normArt.includes("geopolitic"))) return true;
  if (normTarget === "ai & tech" && (normArt.includes("tech") || normArt.includes("ai"))) return true;
  if (normTarget === "entertainment" && (normArt.includes("entertain") || normArt.includes("movie") || normArt.includes("cinema"))) return true;
  return false;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const cat = CATEGORY_MAP[resolvedParams.slug];

  if (!cat) {
    return {
      title: { absolute: "Category Not Found | GlobalPulse AI" },
      robots: { index: false, follow: false },
    };
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://globalpulseai.vercel.app").replace(/\/$/, "");
  const pageUrl = `${siteUrl}/category/${resolvedParams.slug}`;

  return {
    title: {
      absolute: `${cat.name} News & Analysis | GlobalPulse AI`,
    },
    description: cat.intro,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: pageUrl,
      title: `${cat.name} News & Analysis | GlobalPulse AI`,
      description: cat.intro,
      siteName: "GlobalPulse AI",
    },
    twitter: {
      card: "summary_large_image",
      title: `${cat.name} News & Analysis | GlobalPulse AI`,
      description: cat.intro,
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const resolvedParams = await params;
  const cat = CATEGORY_MAP[resolvedParams.slug];

  if (!cat) {
    notFound();
  }

  const theme = getCategoryTheme(cat.name);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://globalpulseai.vercel.app").replace(/\/$/, "");

  // Fetch articles and filter for this category
  let categoryArticles: any[] = [];
  try {
    const res = await fetchArticles({ limit: 60 });
    const all = res.items || [];
    categoryArticles = all.filter((a) => matchesCategory(a.category, cat.name));
  } catch (err) {
    console.error("[CategoryPage] Error loading articles:", err);
  }

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
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
          <span className="text-cyan-400 font-semibold">{cat.name}</span>
        </div>

        {/* Category Hero / Header */}
        <header className="neu-flat p-8 sm:p-10 rounded-3xl mb-10 border border-white/10 relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs uppercase font-mono font-bold tracking-wider px-3 py-1 rounded-md border ${theme.badge}`}>
                {cat.name}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {categoryArticles.length} {categoryArticles.length === 1 ? "Story" : "Stories"}
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black font-serif text-white tracking-tight leading-tight mb-4">
              {cat.name}
            </h1>
            <p className="text-base sm:text-lg text-slate-300 font-sans leading-relaxed">
              {cat.intro}
            </p>
          </div>
        </header>

        {/* Top Ad Slot */}
        <div className="neu-flat p-2 sm:p-4 mb-10">
          <AdBanner slot="header" />
        </div>

        {/* Articles Grid */}
        {categoryArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryArticles.map((article) => {
              const cleanHeadline = (article.title || "").replace(/\s*\|\s*GlobalPulse AI/gi, "").trim();
              const publishedDate = article.published_at || article.created_at;
              const formattedDate = publishedDate
                ? new Date(publishedDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Recent";

              // Clean first sentence for snippet
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
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2 text-[11px] font-mono text-slate-400">
                      <span className="text-cyan-400 font-semibold">{cat.name}</span>
                      <span>•</span>
                      <span>{formattedDate}</span>
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

