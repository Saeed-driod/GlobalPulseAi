"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Newspaper, BarChart3, Globe, Zap, Search } from "./Icons";

interface HeaderProps {
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export const CATEGORIES = [
  { name: "All Stories", icon: Newspaper, color: "from-cyan-500 to-blue-500", glow: "hover:shadow-cyan-500/20" },
  { name: "AI & Tech", icon: Sparkles, color: "from-cyan-400 to-blue-500", glow: "hover:shadow-cyan-500/20" },
  { name: "Global Markets", icon: BarChart3, color: "from-emerald-400 to-teal-500", glow: "hover:shadow-emerald-500/20" },
  { name: "Geopolitics", icon: Globe, color: "from-amber-400 to-orange-500", glow: "hover:shadow-amber-500/20" },
  { name: "Future Science", icon: Zap, color: "from-purple-400 to-pink-500", glow: "hover:shadow-purple-500/20" },
];

export const Header: React.FC<HeaderProps> = ({
  selectedCategory = "All Stories",
  onSelectCategory,
  searchQuery = "",
  onSearchChange,
}) => {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-40 glass-nav transition-all duration-300">
      {/* Top High-Tech Edition & Status Ticker */}
      <div className="border-b border-white/[0.06] bg-black/40 px-4 sm:px-6 py-1.5 text-[11px] text-neutral-400 font-mono">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-neutral-500 tracking-wider">EDITION:</span>
            <span className="text-white hover:text-cyan-400 font-semibold cursor-pointer transition">GLOBAL / US</span>
            <span className="text-neutral-700">•</span>
            <span className="text-neutral-400 hover:text-white cursor-pointer transition">UK & EUROPE</span>
            <span className="text-neutral-700">•</span>
            <span className="text-neutral-400 hover:text-white cursor-pointer transition">ASIA-PACIFIC</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 font-semibold tracking-wider text-[10px]">
                AI WIRE ENGINE v3.1 LIVE
              </span>
            </div>

            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 text-cyan-300 border border-cyan-500/40 px-3 py-0.5 rounded-full text-[11px] font-bold shadow-[0_0_12px_rgba(6,182,212,0.15)] transition"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Admin Center
            </Link>
          </div>
        </div>
      </div>

      {/* Main Brand & Intelligence Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <Link href="/" className="flex items-center gap-3.5 group">
            {/* Glowing Brand Icon */}
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:shadow-cyan-500/40 group-hover:scale-105 transition-all duration-300 border border-white/20">
              <span className="text-white font-black text-lg tracking-tighter">GP</span>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-neutral-950 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-white font-serif">
                  GlobalPulse{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 font-sans tracking-tighter font-extrabold">
                    AI
                  </span>
                </span>
                <span className="text-[9px] uppercase font-mono font-bold tracking-widest px-2 py-0.5 rounded-md bg-white/5 text-cyan-300 border border-cyan-500/30 backdrop-blur-md">
                  INTELLIGENCE WIRE
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 tracking-wider font-mono uppercase mt-0.5">
                Autonomous Global Newsroom & Video Intelligence • Tier-1 English Network
              </p>
            </div>
          </Link>
        </div>

        {/* Search Bar with Glassmorphic styling */}
        {!isAdmin && onSearchChange && (
          <div className="w-full md:w-96 relative group">
            <Search className="w-4 h-4 text-neutral-400 group-focus-within:text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search breaking wires, markets, geopolitics..."
              className="w-full bg-slate-900/60 border border-white/10 focus:border-cyan-400 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 rounded-xl pl-10 pr-12 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all duration-200 backdrop-blur-md"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-neutral-400 pointer-events-none">
              ⌘K
            </span>
          </div>
        )}
      </div>

      {/* Futuristic Category Pill Navigation */}
      {!isAdmin && onSelectCategory && (
        <nav className="border-t border-white/[0.06] bg-slate-950/40 px-4 sm:px-6 py-2.5 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => onSelectCategory(cat.name)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/30 scale-105 border border-cyan-300"
                      : "text-neutral-400 hover:text-white hover:bg-white/5 border border-white/5"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-slate-950" : "text-neutral-400"}`} />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
};
