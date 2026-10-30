import React from "react";
import Link from "next/link";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { ShieldCheck, Sparkles, ArrowLeft, CheckCircle2 } from "../../components/Icons";

export const metadata = {
  title: "About Us & Editorial Standards | GlobalPulse AI",
  description:
    "Learn about GlobalPulse AI, our neural intelligence journalism engine, editorial fact-checking standards, and Tier-1 global news coverage.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#e0e5ec] text-[#2d3748] flex flex-col font-sans selection:bg-[#1a8cff] selection:text-white">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-8 pb-24">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl neu-sm text-xs text-[#718096] hover:text-[#1a8cff] font-mono transition active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-[#1a8cff]" /> Back to Intelligence Wire
          </Link>
        </div>

        {/* Hero Section */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full neu-pressed text-[#1a8cff] text-xs font-mono font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#1a8cff]" />
            <span>Mission &amp; Editorial Manifesto</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black font-serif text-[#2d3748] tracking-tight leading-tight">
            Next-Generation Neural Journalism for Global Decision-Makers
          </h1>

          <p className="text-base sm:text-lg text-[#718096] mt-4 leading-relaxed font-light">
            GlobalPulse AI was founded to eliminate noise and deliver actionable, verified geopolitical, financial, and technological intelligence at the speed of modern breaking events.
          </p>
        </div>

        {/* Core Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="p-7 rounded-3xl neu-flat">
            <div className="w-11 h-11 rounded-2xl neu-sm flex items-center justify-center text-[#1a8cff] font-bold mb-4 font-mono">
              01
            </div>
            <h3 className="text-lg font-bold text-[#2d3748] font-serif mb-2">Primary-Wire Ingestion</h3>
            <p className="text-xs text-[#718096] leading-relaxed">
              We ingest real-time reports directly from primary diplomatic dispatches, central bank releases, and accredited wire feeds (Reuters, BBC, TechCrunch, Hacker News).
            </p>
          </div>

          <div className="p-7 rounded-3xl neu-flat">
            <div className="w-11 h-11 rounded-2xl neu-sm flex items-center justify-center text-emerald-600 font-bold mb-4 font-mono">
              02
            </div>
            <h3 className="text-lg font-bold text-[#2d3748] font-serif mb-2">Neural Synthesis Engine</h3>
            <p className="text-xs text-[#718096] leading-relaxed">
              Our proprietary Gemini AI reasoning pipelines synthesize dense 3,000-word releases into crystal-clear executive takeaways, full analytical dossiers, and 60-second video briefings.
            </p>
          </div>

          <div className="p-7 rounded-3xl neu-flat">
            <div className="w-11 h-11 rounded-2xl neu-sm flex items-center justify-center text-purple-600 font-bold mb-4 font-mono">
              03
            </div>
            <h3 className="text-lg font-bold text-[#2d3748] font-serif mb-2">Zero-Click Video Syndication</h3>
            <p className="text-xs text-[#718096] leading-relaxed">
              Every major intelligence briefing is automatically translated into high-retention 9:16 vertical video with neural audio voiceovers and broadcast across YouTube Shorts and global feeds.
            </p>
          </div>
        </div>

        {/* Editorial Standards & Fact Checking */}
        <div className="p-8 sm:p-10 rounded-3xl neu-flat space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl neu-sm flex items-center justify-center text-emerald-600 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold font-serif text-[#2d3748]">
              Editorial Standards &amp; AI Transparency Policy
            </h2>
          </div>

          <div className="space-y-4 text-sm text-[#4a5568] leading-relaxed">
            <p>
              In accordance with Google Search Central and Google News Quality Guidelines, GlobalPulse AI operates under strict editorial and journalistic integrity standards:
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#1a8cff] shrink-0 mt-1" />
                <div>
                  <strong className="text-[#2d3748]">Multi-Source Verification:</strong> Stories are only published after correlation across accredited international wires or official regulatory filings.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#1a8cff] shrink-0 mt-1" />
                <div>
                  <strong className="text-[#2d3748]">Full Source Transparency:</strong> Every article published on GlobalPulse AI features an explicit citation link to the original primary wire document and raw source artifact.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#1a8cff] shrink-0 mt-1" />
                <div>
                  <strong className="text-[#2d3748]">Non-Partisan Objectivity:</strong> Our automated rewrites strip out partisan editorial bias and sensationalist clickbait, presenting objective facts, market metrics, and strategic implications.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#1a8cff] shrink-0 mt-1" />
                <div>
                  <strong className="text-[#2d3748]">Corrections &amp; Updates:</strong> If any primary wire issues a retraction or clarification, our database automatically updates the corresponding dossier with a timestamped correction note.
                </div>
              </div>
            </div>
          </div>

          {/* Bureau Info */}
          <div className="mt-8 pt-6 border-t border-[#d1d9e6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono text-[#718096]">
            <div>
              Publisher: <span className="text-[#2d3748] font-bold">GlobalPulse AI Media Network Inc.</span>
            </div>
            <div>
              Headquarters: <span className="text-[#2d3748]">Global Tech &amp; Financial Corridor</span>
            </div>
            <div>
              Editorial Contact: <span className="text-[#1a8cff] font-semibold">editorial@globalpulseai.com</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
