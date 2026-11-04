"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Newspaper, BarChart3, Globe, Zap, Search, Trophy, Video, Youtube } from "./Icons";
import { getCategoryTheme } from "../lib/categoryTheme";

interface HeaderProps {
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export const CATEGORIES = [
  { name: "All Stories", icon: Newspaper },
  { name: "AI & Tech", icon: Sparkles },
  { name: "Global Markets", icon: BarChart3 },
  { name: "World Politics", icon: Globe },
  { name: "Future Science", icon: Zap },
  { name: "Global Sports", icon: Trophy },
  { name: "Entertainment", icon: Video },
];

export const Header: React.FC<HeaderProps> = ({
  selectedCategory = "All Stories",
  onSelectCategory,
  searchQuery = "",
  onSearchChange,
}) => {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState<boolean>(Boolean(searchQuery));

  return (
    <header className="sticky top-0 z-40 px-2 sm:px-6 pt-1.5 sm:pt-2 pb-1 sm:pb-1.5 transition-all duration-200">
      <div className="max-w-7xl mx-auto neu-flat overflow-hidden">
        {/* Row 1: Brand Logo + Edition + Search + Live TV Button */}
        <div className="px-2.5 sm:px-5 py-2 flex items-center justify-between gap-2 sm:gap-3">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
              <div className="w-7 h-7 sm:w-8 sm:h-8 neu-circle flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-all shadow-[0_0_14px_rgba(6,182,212,0.35)]">
                <span className="font-black text-[11px] sm:text-xs tracking-tighter bg-gradient-to-br from-cyan-300 via-blue-400 to-indigo-500 bg-clip-text text-transparent">
                  GP
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-sm sm:text-lg font-black tracking-tight text-white font-serif whitespace-nowrap">
                  GlobalPulse <span className="text-cyan-400 font-sans font-extrabold drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]">AI</span>
                </span>
                <span className="text-[9px] uppercase font-mono font-bold tracking-widest px-1.5 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hidden md:inline-block">
                  WIRE
                </span>
              </div>
            </Link>

            <span className="text-[#b8bec7] hidden lg:inline">•</span>
            <span className="text-[10px] font-mono text-[#718096] font-bold hidden lg:inline">
              GLOBAL / US
            </span>
          </div>

          {/* Desktop Controls (Hidden on Mobile) */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-3 flex-1 justify-end max-w-xl">
            {/* Search Input */}
            {!isAdmin && onSearchChange && (
              <div className="w-48 md:w-80 relative group">
                <Search className="w-3.5 h-3.5 text-[#718096] group-focus-within:text-[#1a8cff] absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search breaking wires..."
                  className="w-full neu-input text-xs pl-8 pr-3 py-1.5 transition-all"
                />
              </div>
            )}

            {/* Cinema & Streaming Radar Button */}
            <Link
              href="/movies"
              className="inline-flex items-center gap-1 neu-sm px-2.5 py-1 text-xs font-bold text-pink-300 hover:text-pink-200 border border-purple-500/40 bg-purple-950/40 shadow-[0_0_12px_rgba(236,72,153,0.25)] hover:border-pink-400 transition shrink-0"
              title="Global Cinema & Streaming Radar"
            >
              <span>🎬</span>
              <span className="font-mono text-[11px] font-bold">MOVIES</span>
            </Link>

            {/* Live TV Button */}
            <Link
              href="/live"
              className="inline-flex items-center gap-1.5 neu-sm px-2.5 py-1 text-xs font-black text-rose-300 hover:text-rose-200 border border-rose-500/40 bg-rose-950/40 shadow-[0_0_12px_rgba(244,63,94,0.3)] transition shrink-0"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span className="font-mono text-[11px]">LIVE TV</span>
            </Link>

            {/* YouTube Channel Link */}
            <a
              href="https://www.youtube.com/@GloblePulseAi"
              target="_blank"
              rel="noreferrer"
              title="Official YouTube Channel @GloblePulseAi"
              className="neu-sm p-1.5 text-rose-400 hover:text-rose-300 border border-red-500/30 bg-red-950/30 shadow-[0_0_10px_rgba(239,68,68,0.25)] transition shrink-0 inline-flex items-center justify-center"
            >
              <Youtube className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Mobile Sleek Controls (Visible ONLY on Mobile) */}
          <div className="flex sm:hidden items-center gap-1.5 shrink-0">
            {!isAdmin && onSearchChange && (
              <button
                type="button"
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className={`neu-sm p-1.5 transition active:scale-95 ${
                  mobileSearchOpen ? "neu-pressed text-cyan-400 border-cyan-400/50" : "text-slate-400"
                }`}
                aria-label="Toggle Search"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            )}

            <Link
              href="/movies"
              className="inline-flex items-center gap-1 neu-sm px-2 py-1 text-[11px] font-bold text-pink-300 border border-purple-500/40 bg-purple-950/40 shadow-[0_0_10px_rgba(236,72,153,0.2)] shrink-0"
            >
              <span>🎬</span>
              <span className="font-mono text-[10px]">MOVIES</span>
            </Link>

            <Link
              href="/live"
              className="inline-flex items-center gap-1 neu-sm px-2 py-1 text-[11px] font-bold text-rose-300 border border-rose-500/40 bg-rose-950/40 shadow-[0_0_10px_rgba(244,63,94,0.25)] shrink-0"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-mono text-[10px]">LIVE</span>
            </Link>
          </div>
        </div>

        {/* Mobile Search Expandable Bar */}
        {mobileSearchOpen && !isAdmin && onSearchChange && (
          <div className="px-2.5 pb-2 pt-0.5 sm:hidden border-t border-[#b8bec7]/20">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#718096] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search wires, tech, sports, world news..."
                autoFocus
                className="w-full neu-input text-xs pl-8 pr-8 py-1.5"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#718096] hover:text-[#2d3748]"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Row 2: Smooth Horizontal Scroll Category Pills Bar */}
        {!isAdmin && onSelectCategory && (
          <nav className="border-t border-white/10 bg-slate-950/70 backdrop-blur-md px-2 sm:px-5 py-1.5 overflow-x-auto scrollbar-none touch-pan-x">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.name;
                const theme = getCategoryTheme(cat.name);
                return (
                  <button
                    key={cat.name}
                    onClick={() => onSelectCategory(cat.name)}
                    className={`flex items-center gap-1.5 px-3 py-1 text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer rounded-xl border ${
                      isActive
                        ? `${theme.pillActive} font-extrabold`
                        : `neu-sm text-slate-300 ${theme.pillHover} border-white/5`
                    }`}
                  >
                    <Icon className={`w-3 h-3 ${isActive ? `${theme.textColor} animate-pulse` : "text-slate-400"}`} />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
