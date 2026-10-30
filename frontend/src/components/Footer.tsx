import React from "react";
import Link from "next/link";
import { ShieldCheck, Sparkles } from "./Icons";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-24 border-t border-[#d1d9e6] bg-[#e0e5ec] text-[#718096] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl neu-sm flex items-center justify-center font-black text-[#1a8cff] text-sm">
                GP
              </div>
              <span className="text-xl font-black text-[#2d3748] font-serif tracking-tight">
                GlobalPulse <span className="text-[#1a8cff] font-sans">AI</span>
              </span>
            </div>
            <p className="text-[#718096] text-xs leading-relaxed max-w-md">
              GlobalPulse AI is an autonomous, AI-powered intelligence and video media network delivering real-time geopolitical, financial market, and technological insights for a Tier-1 English audience across North America, Europe, and global financial hubs.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3 text-[#718096] font-mono text-[11px]">
              <span className="text-[#2d3748] font-semibold">EDITIONS: US • UK • EU • GLOBAL</span>
              <span>•</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                NEURAL SYNDICATION ENGINE ACTIVE
              </span>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-[#2d3748] font-bold uppercase text-[11px] font-mono tracking-wider mb-4 pb-1 border-b border-[#d1d9e6]">
              Editorial Coverage
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <Link href="/" className="hover:text-[#1a8cff] transition-colors">
                  AI &amp; Computing Architecture
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-[#1a8cff] transition-colors">
                  Global Markets &amp; Macro Liquidity
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-[#1a8cff] transition-colors">
                  World Politics &amp; Global Diplomacy
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-[#1a8cff] transition-colors">
                  Future Science &amp; Fusion Energy
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-[#1a8cff] transition-colors">
                  Global Sports &amp; Championship Telemetry
                </Link>
              </li>
              <li className="pt-2">
                <a
                  href="https://www.youtube.com/@GloblePulseAi"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-red-600 font-bold hover:text-red-700 font-mono text-[11px]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-red-500" />
                  GlobalPulse AI on YouTube →
                </a>
              </li>
            </ul>
          </div>

          {/* Legal / AI Ethics */}
          <div>
            <h4 className="text-[#2d3748] font-bold uppercase text-[11px] font-mono tracking-wider mb-4 pb-1 border-b border-[#d1d9e6]">
              Verification &amp; Protocol
            </h4>
            <p className="text-[#718096] text-[11px] leading-relaxed">
              All intelligence reports are synthesized from primary wire artifacts (Reuters, BBC, TechCrunch, The Verge), verified via automated neural cross-referencing, and adapted for vertical video syndication.
            </p>
            <div className="mt-4 p-3.5 rounded-2xl neu-pressed text-[10px] text-[#718096] font-mono flex items-center gap-2 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>TIER-1 AUDIENCE INTELLIGENCE VERIFIED</span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-[#d1d9e6] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#718096] font-mono">
          <div>
            © 2026 GlobalPulse AI Media Network Inc. All Rights Reserved.
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/about" className="hover:text-[#1a8cff] transition">
              About &amp; Editorial Standards
            </Link>
            <Link href="/privacy-policy" className="hover:text-[#1a8cff] transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[#1a8cff] transition">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-[#1a8cff] transition">
              Contact Desk
            </Link>
            <a
              href="https://www.youtube.com/@GloblePulseAi"
              target="_blank"
              rel="noreferrer"
              className="text-red-500 hover:text-red-600 transition font-bold"
            >
              @GloblePulseAi
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
