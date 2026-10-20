import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#020617",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://globalpulseai.com"),
  title: {
    default: "GlobalPulse AI | Tier-1 Global Newsroom & Video Intelligence",
    template: "%s | GlobalPulse AI",
  },
  description:
    "Automated AI-powered global news and video media network delivering real-time geopolitical, financial market, and technological insights for Tier-1 decision makers.",
  keywords: [
    "Global News",
    "AI Technology",
    "Global Markets",
    "Geopolitics",
    "Future Science",
    "Automated Journalism",
    "YouTube Shorts Intelligence",
  ],
  authors: [{ name: "GlobalPulse AI Editorial Bureau", url: "https://globalpulseai.com" }],
  creator: "GlobalPulse AI Media Network Inc.",
  publisher: "GlobalPulse AI",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://globalpulseai.com",
    siteName: "GlobalPulse AI",
    title: "GlobalPulse AI | Tier-1 Global Newsroom & Video Intelligence",
    description: "Automated AI-powered global news, geopolitical telemetry, and 60-second video briefings for decision makers.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
        width: 1200,
        height: 630,
        alt: "GlobalPulse AI Media Network",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GlobalPulse AI | Tier-1 Global Newsroom & Video Intelligence",
    description: "Automated AI-powered global news, geopolitical telemetry, and 60-second video briefings for decision makers.",
    creator: "@GlobalPulseAI",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;0,6..72,700;0,6..72,800;1,6..72,400&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100 font-sans">
        {children}
      </body>
    </html>
  );
}
