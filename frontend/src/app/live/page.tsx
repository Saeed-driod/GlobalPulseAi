import { Metadata } from "next";
import LiveClient from "./LiveClient";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  "https://theglobalpulseai.com"
).replace(/\/+$/, "");

export const metadata: Metadata = {
  title: "Live News Wire & Video Feeds | GlobalPulse AI",
  description: "24/7 continuous international live video news streams and real-time updates.",
  alternates: {
    canonical: `${siteUrl}/live`,
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function LivePage() {
  return <LiveClient />;
}
