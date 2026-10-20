import React from "react";
import Link from "next/link";
import { ShieldCheck, Globe, Sparkles } from "./Icons";

export const Footer: React.FC = () => {
  return (
    <footer className="glass-nav border-t border-white/[0.08] mt-24 text-neutral-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-cyan-500/20">
                GP
              </div>
              <span className="text-xl font-black text-white font-serif tracking-tight">
                GlobalPulse <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-sans">AI</span>
              </span>
            </div>
            <p className="text-neutral-400 text-xs leading-relaxed max-w-md">
              GlobalPulse AI is an autonomous, AI-powered intelligence and video media network delivering real-time geopolitical, financial market, and technological insights for a Tier-1 English audience across North America, Europe, and global financial hubs.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3 text-neutral-500 font-mono text-[11px]">
              <span className="text-neutral-300">EDITIONS: US • UK • EU • GLOBAL</span>
              <span className="text-neutral-700">•</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                NEURAL SYNDICATION ENGINE ACTIVE
              </span>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-bold uppercase text-[11px] font-mono tracking-wider mb-4 pb-1 border-b border-white/5">
              Editorial Coverage
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <Link href="/" className="hover:text-cyan-400 transition-colors">
                  AI & Computing Architecture
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-cyan-400 transition-colors">
                  Global Markets & Macro Liquidity
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-cyan-400 transition-colors">
                  Geopolitics & Defense Telemetry
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-cyan-400 transition-colors">
                  Future Science & Fusion Energy
                </Link>
              </li>
              <li className="pt-2">
                <a
                  href="https://www.youtube.com/@EduHubbySaeed"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-red-400 font-bold hover:text-red-300 font-mono text-[11px]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-red-400" />
                  EduHub Video Intelligence →
                </a>
              </li>
            </ul>
          </div>

          {/* Legal / AI Ethics */}
          <div>
            <h4 className="text-white font-bold uppercase text-[11px] font-mono tracking-wider mb-4 pb-1 border-b border-white/5">
              Verification & Protocol
            </h4>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              All intelligence reports are synthesized from primary wire artifacts (Reuters, BBC, TechCrunch, The Verge), verified via automated neural cross-referencing, and adapted for vertical video syndication.
            </p>
            <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] text-neutral-400 font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>TIER-1 AUDIENCE INTELLIGENCE VERIFIED</span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500 font-mono">
          <div>
            © 2026 GlobalPulse AI Media Network Inc. All Rights Reserved.
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/about" className="hover:text-cyan-400 transition">
              About &amp; Editorial Standards
            </Link>
            <Link href="/privacy-policy" className="hover:text-cyan-400 transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-cyan-400 transition">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-cyan-400 transition">
              Contact Desk
            </Link>
            <a
              href="https://www.youtube.com/@EduHubbySaeed"
              target="_blank"
              rel="noreferrer"
              className="text-red-400/80 hover:text-red-300 transition"
            >
              @EduHubbySaeed
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
