import { Metadata } from "next";
import { getSportsData } from "@/lib/sports";
import { SportsView } from "@/components/SportsView";
import Link from "next/link";
import { ChevronRight, Trophy } from "@/components/Icons";

export const revalidate = 120;

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  "https://theglobalpulseai.com"
).replace(/\/+$/, "");

export const metadata: Metadata = {
  title: "Live Sports Scores & Schedule | GlobalPulse AI",
  description:
    "Real-time scores, today's match fixtures, and recent results across Cricket, Football, Basketball, Hockey, Tennis, and global sports tournaments.",
  alternates: {
    canonical: `${siteUrl}/sports`,
  },
  openGraph: {
    title: "Live Sports Scores & Schedule | GlobalPulse AI",
    description:
      "Real-time scores, match schedules, and official broadcast guides across all global sports.",
    url: `${siteUrl}/sports`,
    type: "website",
    siteName: "GlobalPulse AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Live Sports Scores & Schedule | GlobalPulse AI",
    description:
      "Real-time scores, match schedules, and official broadcast guides across all global sports.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function SportsPage() {
  const sportsData = await getSportsData();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Live Sports Scores & Schedule - GlobalPulse AI",
    description: "Live scores, match schedules, and results across all major sports.",
    url: `${siteUrl}/sports`,
    inLanguage: "en",
  };

  return (
    <main className="min-h-screen bg-[#070b14] text-slate-100 pb-20 pt-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <Link href="/" className="hover:text-cyan-400 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-amber-400 font-bold">Sports Hub</span>
        </nav>

        {/* Hero Header */}
        <div className="mb-8 pb-6 border-b border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 mb-3">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                GLOBAL SPORTS RADAR
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-serif">
                Live Scores &amp; Match Schedule
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-2xl">
                Real-time scores, upcoming fixtures, and recent results across Cricket, Football, Basketball, Hockey, Tennis, and international leagues.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/live"
                className="neu-sm px-3.5 py-2 rounded-lg text-xs font-bold text-rose-400 hover:text-rose-300 border border-rose-500/30 bg-rose-950/20 transition-all flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span>Live TV Channels</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Interactive Sports Hub Component */}
        <SportsView initialData={sportsData} />
      </div>
    </main>
  );
}
