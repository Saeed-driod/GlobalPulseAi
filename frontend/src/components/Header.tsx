"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Newspaper, BarChart3, Globe, Zap, Search, Trophy } from "./Icons";

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
    <header className="sticky top-0 z-40 px-3 sm:px-6 pt-3 pb-2 transition-all duration-300">
      <div className="max-w-7xl mx-auto neu-flat overflow-hidden">
        {/* Top Edition & Live Status Strip */}
        <div className="border-b border-[#b8bec7]/40 bg-[#e0e5ec] px-4 sm:px-6 py-2 text-[11px] text-[#718096] font-mono flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[#2d3748] tracking-wider">EDITION:</span>
            <span className="text-[#2d3748] hover:text-[#1a8cff] font-semibold cursor-pointer transition">GLOBAL / US</span>
            <span className="text-[#b8bec7]">•</span>
            <span className="text-[#718096] hover:text-[#2d3748] cursor-pointer transition">UK & EUROPE</span>
            <span className="text-[#b8bec7]">•</span>
            <span className="text-[#718096] hover:text-[#2d3748] cursor-pointer transition">ASIA-PACIFIC</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-600 font-semibold tracking-wider text-[10px]">
                AI WIRE ENGINE v3.1 LIVE
              </span>
            </div>

            <a
              href="https://www.youtube.com/@GloblePulseAi"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 neu-sm px-3 py-1 text-[11px] font-bold text-red-600 hover:text-red-700 transition"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              GlobalPulse AI on YouTube
            </a>
          </div>
        </div>

        {/* Main Brand & Neumorphic Search Bar */}
        <div className="px-4 sm:px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Circular Extruded Brand Badge & Title */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <Link href="/" className="flex items-center gap-3.5 group">
              <div className="w-12 h-12 neu-circle flex items-center justify-center text-[#1a8cff] group-hover:scale-105 transition-all duration-300">
                <span className="font-black text-lg tracking-tighter bg-gradient-to-br from-[#1a8cff] to-[#0052cc] bg-clip-text text-transparent">
                  GP
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black tracking-tight text-[#2d3748] font-serif">
                    GlobalPulse{" "}
                    <span className="text-[#1a8cff] font-sans tracking-tighter font-extrabold">
                      AI
                    </span>
                  </span>
                  <span className="text-[9px] uppercase font-mono font-bold tracking-widest px-2 py-0.5 neu-sm text-[#1a8cff]">
                    INTELLIGENCE WIRE
                  </span>
                </div>
                <p className="text-[10px] text-[#718096] tracking-wider font-mono uppercase mt-0.5">
                  Autonomous Global Newsroom & Video Intelligence • Tier-1 English Network
                </p>
              </div>
            </Link>
          </div>

          {/* Carved-In Neumorphic Search Bar */}
          {!isAdmin && onSearchChange && (
            <div className="w-full md:w-96 relative group">
              <Search className="w-4 h-4 text-[#718096] group-focus-within:text-[#1a8cff] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search breaking wires, markets, world politics..."
                className="w-full neu-input text-xs sm:text-sm pl-10 pr-12 py-2.5 transition-all duration-200"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono neu-pressed-sm px-1.5 py-0.5 text-[#718096] pointer-events-none">
                ⌘K
              </span>
            </div>
          )}
        </div>

        {/* Tactile Category Pill Navigation */}
        {!isAdmin && onSelectCategory && (
          <nav className="border-t border-[#b8bec7]/30 bg-[#e0e5ec] px-4 sm:px-6 py-2.5 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2 sm:gap-3">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => onSelectCategory(cat.name)}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "neu-pressed text-[#1a8cff] font-extrabold shadow-[inset_4px_4px_8px_#b8bec7,inset_-4px_-4px_8px_#ffffff]"
                        : "neu-sm text-[#718096] hover:text-[#2d3748]"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#1a8cff]" : "text-[#718096]"}`} />
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
