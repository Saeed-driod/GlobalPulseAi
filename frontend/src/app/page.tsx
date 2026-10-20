"use client";

import React, { useState, useEffect } from "react";
import { Article } from "../types/article";
import { fetchArticles, FALLBACK_ARTICLES } from "../lib/api";
import { BreakingTicker } from "../components/BreakingTicker";
import { Header, CATEGORIES } from "../components/Header";
import { HeroFeatured } from "../components/HeroFeatured";
import { ArticleCard } from "../components/ArticleCard";
import { AdBanner } from "../components/AdBanner";
import { Footer } from "../components/Footer";
import { Sparkles, TrendingUp, RefreshCw, Zap, Clock, ShieldCheck } from "../components/Icons";

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All Stories");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [newsletterEmail, setNewsletterEmail] = useState<string>("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState<boolean>(false);

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
    loadData(selectedCategory, searchQuery);
  }, [selectedCategory, searchQuery]);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSubscribed(true);
      setTimeout(() => setNewsletterSubscribed(false), 4000);
      setNewsletterEmail("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-neutral-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* 1. Breaking News Ticker (Right Below Header) */}
      <Header
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
        onSearchChange={(val) => setSearchQuery(val)}
      />

      <BreakingTicker articles={articles} />

      {/* 2. Main Newsroom Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 pb-20">
        {/* Top Leaderboard Ad Slot */}
        <AdBanner slot="header" />

        {/* Hero Featured Story (Shown when browsing All Stories without search query) */}
        {!searchQuery && selectedCategory === "All Stories" && !loading && (
          <HeroFeatured articles={articles} />
        )}

        {/* Section Heading & Category Filter Controls with Clean Stacking */}
        <div className="mt-8 mb-6 pt-6 border-t border-white/[0.08] flex flex-col gap-5">
          {/* Top Row: Title, Subtext, and Refresh Feed Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-tr from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-tight">
                  {selectedCategory === "All Stories" ? "Latest Verified Dispatches" : selectedCategory}
                </h2>
              </div>
              <p className="text-xs text-neutral-400 mt-1 font-mono">
                Displaying {articles.length} verified intelligence reports synthesized for Tier-1 decision makers.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => loadData(selectedCategory, searchQuery)}
                disabled={loading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 font-mono transition shadow"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
                {loading ? "Syncing Wire..." : "Refresh Feed"}
              </button>
            </div>
          </div>

          {/* Clean Interactive Category Pills Bar - Stacked cleanly below the heading */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/30 scale-105 border border-cyan-300 font-extrabold"
                      : "text-neutral-400 hover:text-white hover:bg-white/5 bg-slate-900/60 border border-white/10 hover:border-white/20"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-slate-950" : "text-neutral-400"}`} />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Skeleton Loaders during Fetching */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-panel rounded-2xl overflow-hidden p-6 animate-pulse">
                <div className="w-full h-44 bg-white/5 rounded-xl mb-4" />
                <div className="h-4 w-24 bg-white/5 rounded-full mb-3" />
                <div className="h-6 w-5/6 bg-white/10 rounded mb-2" />
                <div className="h-4 w-full bg-white/5 rounded mb-1" />
                <div className="h-4 w-2/3 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="py-24 text-center glass-panel rounded-2xl">
            <Sparkles className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-neutral-300">No dispatches match your query</h3>
            <p className="text-sm text-neutral-500 mt-1">Try clearing your search or selecting another category.</p>
            <button
              onClick={() => {
                setSelectedCategory("All Stories");
                setSearchQuery("");
              }}
              className="mt-5 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs transition"
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

        {/* Tier-1 Executive Dossier Newsletter Banner */}
        <section className="mt-20 rounded-3xl p-8 sm:p-10 glass-panel-glow relative overflow-hidden border border-cyan-500/20">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -top-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span className="text-[11px] font-mono uppercase font-bold text-cyan-400 tracking-wider">
                Priority Global Intelligence Dossier
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black font-serif text-white tracking-tight leading-tight">
              Receive Daily 60-Second AI Video & Audio Briefings
            </h3>
            <p className="text-sm text-neutral-300 mt-2.5 leading-relaxed font-sans">
              Join 85,000+ institutional allocators, Silicon Valley founders, and policymakers receiving our confidential 06:00 EST executive intelligence dispatch.
            </p>

            <form onSubmit={handleNewsletterSubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your executive or enterprise email..."
                className="flex-1 px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 backdrop-blur-md"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition duration-150 shrink-0"
              >
                {newsletterSubscribed ? "✓ Subscribed!" : "Subscribe Dossier"}
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
