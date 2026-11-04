"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Newspaper, BarChart3, Globe, Zap, Search, Trophy, Video, Youtube } from "./Icons";

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

  return (
    <header className="sticky top-0 z-40 px-3 sm:px-6 pt-2 pb-1.5 transition-all duration-200">
      <div className="max-w-7xl mx-auto neu-flat overflow-hidden">
        {/* Row 1: Brand Logo + Edition + Search + Live TV Button */}
        <div className="px-3 sm:px-5 py-2 flex items-center justify-between gap-3">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 neu-circle flex items-center justify-center text-[#1a8cff] group-hover:scale-105 transition-all">
                <span className="font-black text-xs tracking-tighter bg-gradient-to-br from-[#1a8cff] to-[#0052cc] bg-clip-text text-transparent">
                  GP
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-[#2d3748] font-serif">
                  GlobalPulse <span className="text-[#1a8cff] font-sans font-extrabold">AI</span>
                </span>
                <span className="text-[9px] uppercase font-mono font-bold tracking-widest px-1.5 py-0.5 neu-sm text-[#1a8cff] hidden sm:inline-block">
                  WIRE
                </span>
              </div>
            </Link>

            <span className="text-[#b8bec7] hidden md:inline">•</span>
            <span className="text-[10px] font-mono text-[#718096] font-bold hidden md:inline">
              GLOBAL / US
            </span>
          </div>

          {/* Right Controls: Search + Live TV Pill + YouTube Link */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end max-w-xl">
            {/* Search Input */}
            {!isAdmin && onSearchChange && (
              <div className="w-36 sm:w-64 md:w-80 relative group">
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

            {/* Live TV Button */}
            <Link
              href="/live"
              className="inline-flex items-center gap-1.5 neu-sm px-2.5 py-1 text-xs font-black text-red-600 hover:text-red-700 transition shrink-0"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
              <span className="font-mono text-[11px]">LIVE TV</span>
            </Link>

            {/* YouTube Channel Link */}
            <a
              href="https://www.youtube.com/@GloblePulseAi"
              target="_blank"
              rel="noreferrer"
              title="Official YouTube Channel @GloblePulseAi"
              className="neu-sm p-1.5 text-red-600 hover:text-red-700 transition shrink-0 hidden sm:inline-flex items-center justify-center"
            >
              <Youtube className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Row 2: Compact Category Pills Navigation */}
        {!isAdmin && onSelectCategory && (
          <nav className="border-t border-[#b8bec7]/30 bg-[#e0e5ec] px-3 sm:px-5 py-1 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => onSelectCategory(cat.name)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer rounded-lg ${
                      isActive
                        ? "neu-pressed text-[#1a8cff] font-extrabold"
                        : "neu-sm text-[#718096] hover:text-[#2d3748]"
                    }`}
                  >
                    <Icon className={`w-3 h-3 ${isActive ? "text-[#1a8cff]" : "text-[#718096]"}`} />
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
