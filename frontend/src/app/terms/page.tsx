import React from "react";
import Link from "next/link";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { ArrowLeft } from "../../components/Icons";

export const metadata = {
  title: "Terms of Service | GlobalPulse AI",
  description:
    "Terms of Service, user agreement, and content usage terms for GlobalPulse AI Media Network.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#e0e5ec] text-[#2d3748] flex flex-col font-sans selection:bg-[#1a8cff] selection:text-white">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 pt-8 pb-24">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl neu-sm text-xs text-[#718096] hover:text-[#1a8cff] font-mono transition active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-[#1a8cff]" /> Back to Intelligence Wire
          </Link>
        </div>

        <div className="mb-10">
          <h1 className="text-4xl font-black font-serif text-[#2d3748] tracking-tight leading-tight">
            Terms of Service
          </h1>
          <p className="text-xs text-[#718096] font-mono mt-3">
            Effective Date: October 2026 • GlobalPulse AI Media Network Inc.
          </p>
        </div>

        <div className="space-y-8 text-[#4a5568] text-sm leading-relaxed neu-flat p-8 sm:p-10 rounded-3xl">
          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-[#2d3748]">1. Acceptance of Terms</h2>
            <p>
              By accessing, browsing, or utilizing <strong>https://globalpulseai.com</strong> (&quot;GlobalPulse AI&quot;), you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service. If you do not agree with any part of these terms, you must refrain from using the platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-[#2d3748]">2. Editorial &amp; Financial Disclaimers</h2>
            <p>
              All dispatches, market summaries, articles, and video scripts published on GlobalPulse AI are intended solely for general informational, educational, and journalistic purposes. 
            </p>
            <p className="text-xs text-[#2d3748] font-mono neu-pressed p-4 rounded-2xl">
              <strong>IMPORTANT:</strong> Nothing published on GlobalPulse AI constitutes financial, investment, legal, or tax advice. Market quotes and geopolitical summaries represent algorithmic syntheses of public news feeds. Always consult a licensed financial advisor before executing capital allocations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-[#2d3748]">3. Intellectual Property Rights</h2>
            <p>
              The original software architecture, brand design, layout, neural video generation outputs, and curated content belong to GlobalPulse AI Media Network Inc. You may quote or cite our dispatches provided you include a clear backlink and attribution to <code>globalpulseai.com</code>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-[#2d3748]">4. User Conduct &amp; Prohibited Activities</h2>
            <p>Users agree not to:</p>
            <ul className="list-disc list-inside space-y-1.5 text-xs pl-2 text-[#4a5568]">
              <li>Engage in automated scraping or denial-of-service attacks that overload our backend or video synthesis pipelines.</li>
              <li>Attempt unauthorized penetration or bypass of administrative security measures.</li>
              <li>Republish entire articles wholesale without proper canonical attribution.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-[#2d3748]">5. Limitation of Liability</h2>
            <p>
              In no event shall GlobalPulse AI, its editors, or its software contributors be liable for any indirect, consequential, or punitive damages arising out of your access to or reliance on information presented on this site.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-[#d1d9e6]">
            <h2 className="text-xl font-bold font-serif text-[#2d3748]">6. Legal &amp; Inquiries</h2>
            <p>
              For legal questions, licensing agreements, or copyright notifications, please reach us at: <span className="text-[#1a8cff] font-mono font-bold">legal@globalpulseai.com</span>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
