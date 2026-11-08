"use client";

import React, { useState, useEffect } from "react";
import { Article } from "../types/article";
import { fetchArticles } from "../lib/api";
import { BreakingTicker } from "./BreakingTicker";
import { AiNewsAnalyst } from "./AiNewsAnalyst";
import { ViralPoll } from "./ViralPoll";
import { Header, CATEGORIES } from "./Header";
import { HeroFeatured } from "./HeroFeatured";
import { ArticleCard } from "./ArticleCard";
import { AdBanner } from "./AdBanner";
import { Footer } from "./Footer";
import { Sparkles, RefreshCw, ShieldCheck } from "./Icons";
import { getCategoryTheme } from "../lib/categoryTheme";

interface HomePageClientProps {
  initialArticles?: Article[];
}

export function HomePageClient({ initialArticles = [] }: HomePageClientProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [selectedCategory, setSelectedCategory] = useState<string>("All Stories");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [newsletterEmail, setNewsletterEmail] = useState<string>("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState<boolean>(false);
  const [initialLoaded, setInitialLoaded] = useState<boolean>(initialArticles.length > 0);

  const loadData = async (cat?: string, search?: string) => {
    setLoading(true);
    const categoryParam = cat && cat !== "All Stories" ? cat : undefined;
    const res = await fetchArticles({
      category: categoryParam,
      search: search || undefined,
      limit: 30,
    });
    if (res && res.items) {
      setArticles(res.items);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Only refetch if category or search query actually changed from initial
    if (initialLoaded && selectedCategory === "All Stories" && !searchQuery) {
      return;
    }
    loadData(selectedCategory, searchQuery);
  }, [selectedCategory, searchQuery, initialLoaded]);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSubscribed(true);
      setTimeout(() => setNewsletterSubscribed(false), 4000);
      setNewsletterEmail("");
    }
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* 1. Header & Breaking News Ticker */}
      <Header
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
        searchQuery={searchQuery}
        onSearchChange={(val) => setSearchQuery(val)}
      />

      <BreakingTicker articles={articles} />

      {/* 2. Main Newsroom Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-6 pt-2 sm:pt-3 pb-16">
        {/* Hero Featured Story (Shown when browsing All Stories without search query) */}
        {!searchQuery && selectedCategory === "All Stories" && !loading && (
          <HeroFeatured articles={articles} />
        )}

        {/* Free AI Intelligence Lab: Interactive Summarizer & Bias Detector */}
        <AiNewsAnalyst />

        {/* Section Heading & Category Filter Controls */}
        <div className="mt-6 mb-6 sm:mt-8 sm:mb-8 neu-flat p-3.5 sm:p-6 flex flex-col gap-3 sm:gap-5 border border-white/10">
          {/* Top Row: Title, Subtext, and Refresh Feed Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse" />
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-tight">
                  {selectedCategory === "All Stories" ? "Latest News" : selectedCategory}
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Displaying {articles.length} news stories and analysis.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => loadData(selectedCategory, searchQuery)}
                disabled={loading}
                className="neu-sm px-4 py-2 flex items-center gap-2 text-xs text-slate-200 hover:text-white font-bold active:scale-95 transition cursor-pointer border border-white/5"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? "animate-spin" : ""}`} />
                <span>{loading ? "Syncing..." : "Refresh Feed"}</span>
              </button>
            </div>
          </div>

          {/* Clean Interactive Chromatic Category Pills Bar */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.name;
              const catTheme = getCategoryTheme(cat.name);
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer border ${
                    isActive
                      ? `${catTheme.pillActive} font-extrabold`
                      : `neu-sm text-slate-300 ${catTheme.pillHover} border-white/5`
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? `${catTheme.textColor} animate-pulse` : "text-slate-400"}`} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Skeleton Loaders during Fetching */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="neu-flat p-5 animate-pulse flex flex-col justify-between h-96">
                <div>
                  <div className="w-full h-44 neu-pressed rounded-xl mb-4" />
                  <div className="h-4 w-24 neu-pressed rounded-full mb-3" />
                  <div className="h-6 w-5/6 neu-pressed rounded mb-2" />
                  <div className="h-4 w-full neu-pressed rounded mb-1" />
                  <div className="h-4 w-2/3 neu-pressed rounded" />
                </div>
                <div className="h-8 w-28 neu-pressed rounded-xl self-end" />
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="py-20 text-center neu-flat p-10">
            <Sparkles className="w-12 h-12 text-[#1a8cff] mx-auto mb-3" />
            <h3 className="text-lg font-bold text-[#2d3748]">No dispatches match your query</h3>
            <p className="text-sm text-[#718096] mt-1">Try clearing your search or selecting another category.</p>
            <button
              onClick={() => {
                setSelectedCategory("All Stories");
                setSearchQuery("");
              }}
              className="mt-5 neu-btn-primary px-6 py-2.5 text-xs uppercase tracking-wider"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}

        {/* Daily Viral Sentiment Poll & Social Share */}
        <ViralPoll />

        {/* Daily Briefing Newsletter Banner */}
        <section className="mt-16 neu-flat p-8 sm:p-10 relative overflow-hidden">
          <div className="max-w-2xl relative z-10">
            <div className="flex items-center gap-2 mb-2.5">
              <ShieldCheck className="w-4 h-4 text-[#1a8cff]" />
              <span className="text-[11px] font-mono uppercase font-bold text-[#1a8cff] tracking-wider">
                Daily News &amp; Analysis Briefing
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black font-serif text-[#2d3748] tracking-tight leading-tight">
              Receive Daily 60-Second AI Video &amp; Audio Briefings
            </h3>
            <p className="text-sm text-[#718096] mt-2.5 leading-relaxed font-sans">
              Sign up for our concise morning dispatch covering global breaking news, financial markets, and technology updates.
            </p>

            <form onSubmit={handleNewsletterSubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address..."
                className="flex-1 neu-input px-4 py-3 text-sm placeholder:text-[#a0aec0]"
              />
              <button
                type="submit"
                className="neu-btn-primary px-6 py-3 text-xs uppercase tracking-wider shrink-0"
              >
                {newsletterSubscribed ? "✓ Subscribed!" : "Subscribe Free"}
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* Sticky Bottom Ad Banner */}
      <AdBanner slot="sticky-footer" />

      {/* Footer */}
      <Footer />
    </div>
  );
}

