import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { AnalyticsTracker } from "../components/AnalyticsTracker";
import { PushNotificationPrompt } from "../components/PushNotificationPrompt";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e0e5ec",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://globalpulseai.vercel.app"),
  title: {
    default: "GlobalPulse AI | Tier-1 Global Newsroom & Video Intelligence",
    template: "%s | GlobalPulse AI",
  },
  description:
    "Automated AI-powered global news and video media network delivering real-time geopolitical, financial market, technological, and global sports intelligence for Tier-1 decision makers.",
  keywords: [
    "Global News",
    "AI Technology",
    "Global Markets",
    "World Politics",
    "Geopolitics",
    "Future Science",
    "Global Sports",
    "Sports Analytics",
    "Automated Journalism",
    "YouTube Shorts Intelligence",
  ],
  authors: [{ name: "GlobalPulse AI Editorial Bureau", url: process.env.NEXT_PUBLIC_SITE_URL || "https://globalpulseai.vercel.app" }],
  creator: "GlobalPulse AI Media Network Inc.",
  publisher: "GlobalPulse AI",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://globalpulseai.vercel.app",
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
  verification: {
    google: [
      "x3HpLj-DySsEL2GAdHiXkhfmTrh_jXkRHKR5vk71dW8",
      "HzE1M4G8b8r0fI4mYFJ1mlcRpIuXTtlLYKJlWqfrVZw",
    ],
    other: {
      "tiktok-developers-site-verification": "qtGjolrbl9OJ5MgmnT9xzAyWXy8bM0Kh",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <meta name="tiktok-developers-site-verification" content="qtGjolrbl9OJ5MgmnT9xzAyWXy8bM0Kh" />
        <meta name="tiktok-developers-site-verification" content="QFp2awRN7qTwaTOTSh824lhTKoK2Q9tO" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;0,6..72,700;0,6..72,800;1,6..72,400&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="GlobalPulse AI RSS Feed"
          href="/rss.xml"
        />
        {/* Bauval / Adsterra Global Social Bar */}
        <Script
          src="https://bauval.org/14/2f3481f5b47a88883b7506a69ee08e50"
          strategy="afterInteractive"
          data-cfasync="false"
        />

        {/* Adsterra High-CPM Popunder / OnClick */}
        <Script
          src="https://abscloud.org/1/b6de09199dd702d82a7aea2cab99fa04"
          strategy="afterInteractive"
          data-cfasync="false"
        />

        {/* OneSignal Web Push Notifications (Free Global Audience Retention) */}
        <Script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          strategy="afterInteractive"
          defer
        />
        <Script
          id="onesignal-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.OneSignalDeferred = window.OneSignalDeferred || [];
              OneSignalDeferred.push(async function(OneSignal) {
                await OneSignal.init({
                  appId: "${process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || 'b848c2ec-c840-4e20-9dc4-1b0b5be8ef9b'}",
                  notifyButton: {
                    enable: true,
                    position: 'bottom-left',
                    size: 'medium',
                    theme: 'dark',
                    text: {
                      'tip.state.unsubscribed': 'Subscribe to Breaking News Alerts',
                      'tip.state.subscribed': "You're subscribed to Breaking Alerts",
                      'tip.state.blocked': "Notifications blocked",
                      'message.prenotify': 'Click to subscribe to GlobalPulse AI breaking intelligence',
                      'message.action.subscribed': "Thanks for subscribing!",
                      'message.action.resubscribed': "You're subscribed to breaking alerts",
                      'message.action.unsubscribed': "You won't receive breaking alerts",
                      'dialog.main.title': 'Manage Breaking News Alerts',
                      'dialog.main.button.subscribe': 'SUBSCRIBE',
                      'dialog.main.button.unsubscribe': 'UNSUBSCRIBE',
                      'dialog.blocked.title': 'Unblock Notifications',
                      'dialog.blocked.message': "Follow instructions to allow notifications:"
                    }
                  },
                  allowLocalhostAsSecureOrigin: true,
                });
              });
            `,
          }}
        />

        {/* Google Reader Revenue Manager (Subscribe with Google) */}
        <Script
          src="https://news.google.com/swg/js/v1/swg-basic.js"
          strategy="afterInteractive"
        />
        <Script
          id="google-rrm-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (self.SWG_BASIC = self.SWG_BASIC || []).push( basicSubscriptions => {
                basicSubscriptions.init({
                  type: "NewsArticle",
                  isPartOfType: ["Product"],
                  isPartOfProductId: "CAowgpHiCw:openaccess",
                  clientOptions: { theme: "light", lang: "en" },
                });
              });
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#e0e5ec] text-[#2d3748] font-sans relative overflow-x-hidden selection:bg-[#1a8cff] selection:text-white">
        {/* Subtle Decorative Floating Neumorphic 3D Spheres */}
        <div className="bg-circle w-72 sm:w-96 h-72 sm:h-96 -top-20 -left-20 opacity-70" />
        <div className="bg-circle w-60 sm:w-80 h-60 sm:h-80 top-[35%] -right-24 opacity-60" />
        <div className="bg-circle w-56 sm:w-72 h-56 sm:h-72 top-[70%] -left-16 opacity-50" />
        <div className="bg-circle w-48 sm:w-64 h-48 sm:h-64 bottom-24 right-10 opacity-60" />

        <div className="relative z-10 flex flex-col flex-1 min-h-screen">
          <AnalyticsTracker />
          <PushNotificationPrompt />
          {children}
        </div>
      </body>
    </html>
  );
}
