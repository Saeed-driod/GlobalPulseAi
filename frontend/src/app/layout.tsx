import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { AnalyticsTracker } from "../components/AnalyticsTracker";
import { PushNotificationPrompt } from "../components/PushNotificationPrompt";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080c14",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://globalpulseai.vercel.app"),
  title: {
    default: "GlobalPulse AI | Daily News Briefs on Tech, Markets, Politics, Science, Sports and Entertainment",
    template: "%s | GlobalPulse AI",
  },
  description:
    "Daily news briefs and plain-English analysis covering AI, tech, markets, world politics, science, sports, and entertainment.",
  authors: [{ name: "GlobalPulse AI Desk", url: process.env.NEXT_PUBLIC_SITE_URL || "https://globalpulseai.vercel.app" }],
  creator: "GlobalPulse AI",
  publisher: "GlobalPulse AI",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://globalpulseai.vercel.app",
    siteName: "GlobalPulse AI",
    title: "GlobalPulse AI | Daily News Briefs on Tech, Markets, Politics, Science, Sports and Entertainment",
    description: "Daily news briefs and plain-English analysis covering AI, tech, markets, world politics, science, sports, and entertainment.",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "GlobalPulse AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GlobalPulse AI | Daily News Briefs on Tech, Markets, Politics, Science, Sports and Entertainment",
    description: "Daily news briefs and plain-English analysis covering AI, tech, markets, world politics, science, sports, and entertainment.",
    creator: "@GlobalPulseAI",
    images: ["/api/og"],
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
      "tiktok-developers-site-verification": "8ZtJ7ileN14xFRdPeEgUday0VvqUf7Zj",
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
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta name="monetag" content="debefa1274cfb3da902e7d4ca24045da" />
        <meta name="tiktok-developers-site-verification" content="8ZtJ7ileN14xFRdPeEgUday0VvqUf7Zj" />
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

        {/* Google AdSense Official Script */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5380114680461998"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        {/* Monetag MultiTag (All-In-One High CPM Ads: OnClick Popunder, In-Page Push, Vignette - Zone 305177) */}
        <Script
          id="monetag-multitag-305177"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(s,u,z,p){s.src=u;s.setAttribute('data-zone',z);p.appendChild(s);})(document.createElement('script'),'https://quge5.com/88/tag.min.js',305177,[document.documentElement, document.body].filter(Boolean).pop());`,
          }}
        />

        {/* Monetag In-Page Push (Zone 12187520) */}
        <Script
          id="monetag-zone-12187520"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(s){s.dataset.zone='12187520',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')));`,
          }}
        />

        {/* Monetag Vignette Interstitial Banner (Zone 12187525) */}
        <Script
          id="monetag-zone-12187525"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(s){s.dataset.zone='12187525',s.src='https://n6wxm.com/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')));`,
          }}
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
      <body className="min-h-full flex flex-col bg-[#080c14] text-slate-100 font-sans relative overflow-x-hidden selection:bg-cyan-500 selection:text-black">
        <div className="relative z-10 flex flex-col flex-1 min-h-screen">
          <AnalyticsTracker />
          <PushNotificationPrompt />
          {children}
        </div>
      </body>
    </html>
  );
}
