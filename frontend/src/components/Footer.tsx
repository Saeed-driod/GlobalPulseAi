import React from "react";
import Link from "next/link";
import { ShieldCheck, Sparkles, Briefcase } from "./Icons";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-white/10 bg-slate-950/80 backdrop-blur-xl text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl neu-circle flex items-center justify-center font-black text-cyan-400 text-sm shadow-[0_0_14px_rgba(6,182,212,0.3)]">
                GP
              </div>
              <span className="text-xl font-black text-white font-serif tracking-tight">
                GlobalPulse <span className="text-cyan-400 font-sans">AI</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              GlobalPulse AI is an independent digital news and video media network delivering fact-grounded reporting on technology, financial markets, world politics, science, sports, and entertainment for readers across the US, UK, and global English audiences.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3 text-slate-400 font-mono text-[11px]">
              <span className="text-slate-200 font-semibold">EDITIONS: US • UK • GLOBAL</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                GLOBAL NEWS WIRE ACTIVE
              </span>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-bold uppercase text-[11px] font-mono tracking-wider mb-4 pb-1 border-b border-white/10">
              Editorial Coverage
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <Link href="/category/ai-tech" className="hover:text-cyan-300 transition-colors">
                  AI &amp; Tech
                </Link>
              </li>
              <li>
                <Link href="/category/markets" className="hover:text-emerald-300 transition-colors">
                  Markets
                </Link>
              </li>
              <li>
                <Link href="/category/world-politics" className="hover:text-indigo-300 transition-colors">
                  World Politics
                </Link>
              </li>
              <li>
                <Link href="/category/science" className="hover:text-purple-300 transition-colors">
                  Science
                </Link>
              </li>
              <li>
                <Link href="/category/sports" className="hover:text-amber-300 transition-colors">
                  Sports
                </Link>
              </li>
              <li>
                <Link href="/category/entertainment" className="hover:text-pink-300 transition-colors">
                  Entertainment
                </Link>
              </li>
              <li>
                <Link href="/live" className="text-rose-400 hover:text-rose-300 font-bold transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  🔴 24/7 Live Stream Broadcast Hub
                </Link>
              </li>
              <li>
                <Link href="/movies" className="text-pink-300 hover:text-pink-200 font-bold transition-colors flex items-center gap-1.5">
                  <span>🎬</span>
                  Cinema &amp; Streaming Radar
                </Link>
              </li>
              <li>
                <a
                  href="https://globalhireai.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors flex items-center gap-1.5"
                  title="GlobalHire AI — 400+ Worldwide Remote Jobs"
                >
                  <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                  <span>💼 GlobalHire AI (400+ Remote Jobs)</span>
                </a>
              </li>
              <li className="pt-2">
                <a
                  href="https://www.youtube.com/@GloblePulseAi"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-red-400 font-bold hover:text-red-300 font-mono text-[11px]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-red-400" />
                  GlobalPulse AI on YouTube →
                </a>
              </li>
            </ul>
          </div>

          {/* Legal / AI Ethics */}
          <div>
            <h4 className="text-white font-bold uppercase text-[11px] font-mono tracking-wider mb-4 pb-1 border-b border-white/10">
              Editorial Standards
            </h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Articles are written with AI assistance using verified primary sources and official dispatches. We adhere to factual reporting, independent attribution, and strict editorial guidelines.
            </p>
            <div className="mt-4 p-3.5 rounded-2xl neu-pressed text-[10px] text-slate-300 font-mono flex items-center gap-2 font-semibold border border-white/5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>INDEPENDENT EDITORIAL OVERSIGHT</span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 font-mono">
          <div>
            © 2026 GlobalPulse AI. All Rights Reserved.
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/about" className="hover:text-cyan-300 transition">
              About &amp; Editorial Standards
            </Link>
            <Link href="/privacy-policy" className="hover:text-cyan-300 transition">
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
