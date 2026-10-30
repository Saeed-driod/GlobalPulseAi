"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Article } from "../types/article";
import { ChevronRight } from "./Icons";

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
    }, 4500);
    return () => clearInterval(interval);
  }, [displayArticles.length]);

  if (displayArticles.length === 0) return null;

  const current = displayArticles[currentIndex];

  return (
    <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 mt-3">
      <div className="neu-flat p-2.5 sm:px-5 flex items-center justify-between gap-4 text-xs">
        {/* Breaking Wire Label & Story Title */}
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Live Tactile Badge */}
          <div className="neu-sm px-3 py-1 flex items-center gap-1.5 text-red-600 font-black tracking-widest text-[10px] uppercase shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
            </span>
            BREAKING WIRE
          </div>

          <span className="text-[#718096] font-mono font-bold tracking-wider text-[11px] shrink-0 hidden md:inline-block">
            06:00 EST:
          </span>

          {/* Current Story Link */}
          <Link
            href={`/news/${current.slug}`}
            className="truncate text-[#2d3748] hover:text-[#1a8cff] font-medium transition-colors duration-200 flex items-center gap-1.5 group"
          >
            <span className="font-semibold text-xs sm:text-sm group-hover:underline underline-offset-2 truncate">
              {current.title}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-[#718096] group-hover:text-[#1a8cff] group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        </div>

        {/* Global Financial Ticker Bar */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono shrink-0 pl-4 border-l border-[#b8bec7]/40">
          <div className="neu-sm px-2.5 py-1 flex items-center gap-1.5">
            <span className="text-[#718096]">S&P 500</span>
            <span className="text-emerald-600 font-bold">▲ 5,864.20 (+1.4%)</span>
          </div>

          <div className="neu-sm px-2.5 py-1 flex items-center gap-1.5">
            <span className="text-[#718096]">NASDAQ</span>
            <span className="text-emerald-600 font-bold">▲ 18,375.40 (+1.9%)</span>
          </div>

          <div className="neu-sm px-2.5 py-1 flex items-center gap-1.5">
            <span className="text-[#718096]">BTC/USD</span>
            <span className="text-[#1a8cff] font-bold">$68,450</span>
          </div>

          <div className="neu-sm px-2.5 py-1 flex items-center gap-1.5">
            <span className="text-[#718096]">BRENT</span>
            <span className="text-amber-600 font-bold">$82.40</span>
          </div>
        </div>
      </div>
    </div>
  );
};
