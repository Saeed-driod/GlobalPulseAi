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
    <div className="min-h-screen bg-slate-950 text-neutral-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 pt-8 pb-24">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white font-mono transition"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" /> Back to Intelligence Wire
          </Link>
        </div>

        <div className="mb-10">
          <h1 className="text-4xl font-black font-serif text-white tracking-tight leading-tight">
            Terms of Service
          </h1>
          <p className="text-xs text-neutral-400 font-mono mt-3">
            Effective Date: October 2026 • GlobalPulse AI Media Network Inc.
          </p>
        </div>

        <div className="space-y-8 text-neutral-300 text-sm leading-relaxed glass-panel p-8 sm:p-10 rounded-3xl border border-white/10">
          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing, browsing, or utilizing <strong>https://globalpulseai.com</strong> (&quot;GlobalPulse AI&quot;), you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service. If you do not agree with any part of these terms, you must refrain from using the platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-white">2. Editorial &amp; Financial Disclaimers</h2>
            <p>
              All dispatches, market summaries, articles, and video scripts published on GlobalPulse AI are intended solely for general informational, educational, and journalistic purposes. 
            </p>
            <p className="text-xs text-neutral-400 font-mono bg-white/5 p-4 rounded-xl border border-white/5">
              IMPORTANT: Nothing published on GlobalPulse AI constitutes financial, investment, legal, or tax advice. Market quotes and geopolitical summaries represent algorithmic syntheses of public news feeds. Always consult a licensed financial advisor before executing capital allocations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-white">3. Intellectual Property Rights</h2>
            <p>
              The original software architecture, brand design, layout, neural video generation outputs, and curated content belong to GlobalPulse AI Media Network Inc. You may quote or cite our dispatches provided you include a clear backlink and attribution to <code>globalpulseai.com</code>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-white">4. User Conduct &amp; Prohibited Activities</h2>
            <p>Users agree not to:</p>
            <ul className="list-disc list-inside space-y-1.5 text-xs pl-2">
              <li>Engage in automated scraping or denial-of-service attacks that overload our backend or video synthesis pipelines.</li>
              <li>Attempt unauthorized penetration or bypass of administrative security measures.</li>
              <li>Republish entire articles wholesale without proper canonical attribution.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-white">5. Limitation of Liability</h2>
            <p>
              In no event shall GlobalPulse AI, its editors, or its software contributors be liable for any indirect, consequential, or punitive damages arising out of your access to or reliance on information presented on this site.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-white/10">
            <h2 className="text-xl font-bold font-serif text-white">6. Legal &amp; Inquiries</h2>
            <p>
              For legal questions, licensing agreements, or copyright notifications, please reach us at: <span className="text-cyan-400 font-mono">legal@globalpulseai.com</span>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
