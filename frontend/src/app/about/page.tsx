import React from "react";
import Link from "next/link";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { ShieldCheck, Sparkles, ArrowLeft, CheckCircle2 } from "../../components/Icons";

export const metadata = {
  title: "About Us & Editorial Standards",
  description:
    "Learn about GlobalPulse AI, our editorial standards, fact-checking process, and independent global news coverage.",
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
            <ArrowLeft className="w-4 h-4 text-[#1a8cff]" /> Back to Homepage
          </Link>
        </div>

        {/* Hero Section */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full neu-pressed text-[#1a8cff] text-xs font-mono font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#1a8cff]" />
            <span>Mission &amp; Editorial Standards</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black font-serif text-[#2d3748] tracking-tight leading-tight">
            Accurate, Fact-Grounded News for Global Readers
          </h1>

          <p className="text-base sm:text-lg text-[#718096] mt-4 leading-relaxed font-light">
            GlobalPulse AI delivers clear, plain-English news coverage covering technology, markets, world politics, science, sports, and entertainment. Every article is strictly grounded in facts reported by verified primary sources.
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
              We ingest breaking reports directly from accredited international news services and official publishers (including BBC, Reuters, TechCrunch, CNBC, and ScienceDaily).
            </p>
          </div>

          <div className="p-7 rounded-3xl neu-flat">
            <div className="w-11 h-11 rounded-2xl neu-sm flex items-center justify-center text-emerald-600 font-bold mb-4 font-mono">
              02
            </div>
            <h3 className="text-lg font-bold text-[#2d3748] font-serif mb-2">Strict Fact Grounding</h3>
            <p className="text-xs text-[#718096] leading-relaxed">
              Our automated editorial pipelines use only confirmed facts from the source text. We never invent names, scores, statistics, quotes, or numbers.
            </p>
          </div>

          <div className="p-7 rounded-3xl neu-flat">
            <div className="w-11 h-11 rounded-2xl neu-sm flex items-center justify-center text-purple-600 font-bold mb-4 font-mono">
              03
            </div>
            <h3 className="text-lg font-bold text-[#2d3748] font-serif mb-2">Concise Audio &amp; Video</h3>
            <p className="text-xs text-[#718096] leading-relaxed">
              Essential news stories are adapted into clear, accessible audio briefings and short video summaries for readers on mobile and social platforms.
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
              In accordance with Google Search Central and Google News Quality Guidelines, GlobalPulse AI adheres to transparent journalistic practices:
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#1a8cff] shrink-0 mt-1" />
                <div>
                  <strong className="text-[#2d3748]">Cited Source Verification:</strong> Every article is synthesized from a single, accredited primary wire report or official release, with explicit attribution and a direct link to read the original story.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#1a8cff] shrink-0 mt-1" />
                <div>
                  <strong className="text-[#2d3748]">Zero Hallucination Guarantee:</strong> Every number, score, date, and statistic is validated against the source text before publication. If source information is insufficient, publication is withheld.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#1a8cff] shrink-0 mt-1" />
                <div>
                  <strong className="text-[#2d3748]">Non-Partisan Objectivity:</strong> Content is written in plain, clear English without clickbait, hyperbole, or speculative claims. Analysis is clearly labelled as separate from reporting.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#1a8cff] shrink-0 mt-1" />
                <div>
                  <strong className="text-[#2d3748]">Corrections &amp; Updates:</strong> If a cited publisher updates or clarifies an article, our editorial pipeline updates the corresponding story with a timestamped note.
                </div>
              </div>
            </div>
          </div>

          {/* Bureau Info */}
          <div className="mt-8 pt-6 border-t border-[#d1d9e6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono text-[#718096]">
            <div>
              Publisher: <span className="text-[#2d3748] font-bold">GlobalPulse AI</span>
            </div>
            <div>
              Editorial Byline: <span className="text-[#2d3748] font-semibold">GlobalPulse AI Desk</span>
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
