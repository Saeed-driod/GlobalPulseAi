import React from "react";
import Link from "next/link";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { ShieldCheck, ArrowLeft } from "../../components/Icons";

export const metadata = {
  title: "Privacy & Cookie Policy | GlobalPulse AI",
  description:
    "Comprehensive Privacy Policy, Cookie Policy, Google AdSense compliance disclosures, and GDPR/CCPA data protection information for GlobalPulse AI.",
};

export default function PrivacyPolicyPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Legal Compliance & Data Protection</span>
          </div>

          <h1 className="text-4xl font-black font-serif text-white tracking-tight leading-tight">
            Privacy Policy & AdSense Cookie Disclosures
          </h1>

          <p className="text-xs text-neutral-400 font-mono mt-3">
            Last Updated & Verified: October 2026 • Effective Immediately
          </p>
        </div>

        <div className="space-y-8 text-neutral-300 text-sm leading-relaxed glass-panel p-8 sm:p-10 rounded-3xl border border-white/10">
          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-white">1. Introduction</h2>
            <p>
              GlobalPulse AI (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting the privacy and personal data of our global readers. This Privacy Policy details how we collect, process, and safeguard information when you visit <strong>https://globalpulseai.com</strong> (the &quot;Site&quot;).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-white">2. Google AdSense & DoubleClick DART Cookies</h2>
            <p>
              Google is a third-party vendor on our site. Google uses cookies, including the DoubleClick DART cookie, to serve targeted advertisements to our visitors based on their visit to our site and other sites on the internet.
            </p>
            <ul className="list-disc list-inside space-y-2 text-xs pl-2 text-neutral-300">
              <li>
                Third-party vendors, including Google, use cookies to serve ads based on a user&apos;s prior visits to your website or other websites.
              </li>
              <li>
                Google&apos;s use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our sites and/or other sites on the Internet.
              </li>
              <li>
                Users may opt out of personalized advertising by visiting{" "}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 underline hover:text-cyan-300"
                >
                  Google Ads Settings
                </a>{" "}
                or by visiting{" "}
                <a
                  href="https://www.aboutads.info"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 underline hover:text-cyan-300"
                >
                  aboutads.info
                </a>
                .
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-white">3. Information We Collect Automatically</h2>
            <p>
              When you browse our portal, our servers automatically log standard web telemetry data, which may include:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs pl-2">
              <li>Internet Protocol (IP) address (anonymized in EU regions)</li>
              <li>Browser type and version</li>
              <li>Referring website URL and pages visited on GlobalPulse AI</li>
              <li>Time and date of your visit, session duration, and telemetry interactions</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-white">4. Newsletter & Voluntary Submissions</h2>
            <p>
              If you voluntarily subscribe to our &quot;Daily AI &amp; Market Briefing&quot; newsletter, we collect only your email address. We use this information solely to transmit editorial digests and breaking news dispatches. We never sell, rent, or trade your email address with third parties. You may unsubscribe at any moment using the link provided in every newsletter footer.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-white">5. GDPR & CCPA Compliance Rights</h2>
            <p>
              Under the General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA), you enjoy the right to:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs pl-2">
              <li>Request access to the personal data we hold about you.</li>
              <li>Request correction or deletion of your stored information.</li>
              <li>Object to or restrict the processing of your personal data.</li>
              <li>Opt-out of any third-party sale of personal information (we do not sell personal data).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-white">6. Data Security & Encryption</h2>
            <p>
              We implement industry-standard 256-bit TLS encryption, strict role-based access protocols, and cloud firewall architecture to protect against unauthorized access, alteration, disclosure, or destruction of information.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-white/10">
            <h2 className="text-xl font-bold font-serif text-white">7. Contact Our Data Protection Officer</h2>
            <p>
              If you have any questions or requests regarding this Privacy Policy, please contact our Compliance Officer at:
            </p>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 font-mono text-xs text-neutral-300">
              <div>GlobalPulse AI Media Network Inc.</div>
              <div>Attn: Data Privacy &amp; Legal Compliance Bureau</div>
              <div>Email: <span className="text-cyan-400">privacy@globalpulseai.com</span></div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
