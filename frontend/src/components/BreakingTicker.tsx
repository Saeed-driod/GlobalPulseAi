"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Article } from "../types/article";
import { Zap, ChevronRight, TrendingUp } from "./Icons";

interface BreakingTickerProps {
  articles: Article[];
}

export const BreakingTicker: React.FC<BreakingTickerProps> = ({ articles }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const displayArticles = articles.length > 0 ? articles : [];

  useEffect(() => {
    if (displayArticles.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayArticles.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [displayArticles.length]);

  if (displayArticles.length === 0) return null;

  const current = displayArticles[currentIndex];

  return (
    <div className="bg-gradient-to-r from-red-950/40 via-slate-950/90 to-purple-950/30 border-b border-red-500/20 backdrop-blur-md text-xs text-neutral-300 py-2 px-4 sm:px-6 relative overflow-hidden">
      {/* Subtle background ambient pulse */}
      <div className="absolute -left-20 top-0 w-40 h-full bg-red-600/10 blur-xl pointer-events-none" />

      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Breaking Wire Label & Story Title */}
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Live Pulsating Badge */}
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 text-white font-black tracking-widest px-2.5 py-0.5 rounded-full text-[10px] uppercase shrink-0 shadow-[0_0_12px_rgba(239,68,68,0.5)] border border-red-400/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            BREAKING WIRE
          </div>

          <span className="text-red-400/90 font-mono font-bold tracking-wider text-[11px] shrink-0 hidden md:inline-block">
            06:00 EST BRIEF:
          </span>

          {/* Current Story Link with Smooth fade */}
          <Link
            href={`/news/${current.slug}`}
            className="truncate text-neutral-200 hover:text-cyan-300 font-medium transition-colors duration-200 flex items-center gap-1.5 group"
          >
            <span className="text-white font-semibold group-hover:underline underline-offset-2">
              {current.title}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        </div>

        {/* Global Financial Ticker Bar (Bloomberg style) */}
        <div className="hidden lg:flex items-center gap-4 text-[11px] font-mono shrink-0 pl-4 border-l border-white/10">
          <div className="flex items-center gap-1.5 bg-white/[0.03] px-2.5 py-0.5 rounded-md border border-white/5">
            <span className="text-neutral-400">S&P 500</span>
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              ▲ 5,864.20 (+1.4%)
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-white/[0.03] px-2.5 py-0.5 rounded-md border border-white/5">
            <span className="text-neutral-400">NASDAQ</span>
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              ▲ 18,375.40 (+1.9%)
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-white/[0.03] px-2.5 py-0.5 rounded-md border border-white/5">
            <span className="text-neutral-400">BTC/USD</span>
            <span className="text-cyan-400 font-bold">
              $68,450
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-white/[0.03] px-2.5 py-0.5 rounded-md border border-white/5">
            <span className="text-neutral-400">BRENT</span>
            <span className="text-amber-400 font-bold">
              $82.40
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
