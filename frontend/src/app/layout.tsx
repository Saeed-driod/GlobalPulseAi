import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Newsreader, JetBrains_Mono } from "next/font/google";
import { AnalyticsTracker } from "../components/AnalyticsTracker";
import { PushNotificationPrompt } from "../components/PushNotificationPrompt";
import { GlobalAdsManager } from "../components/GlobalAdsManager";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const newsreader = Newsreader({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-newsreader",
  style: ["normal", "italic"],
  weight: ["400", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080c14",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://theglobalpulseai.com"),
  title: {
    default: "GlobalPulse AI | Daily News Briefs on Tech, Markets, Politics, Science, Sports and Entertainment",
    template: "%s | GlobalPulse AI",
  },
  description:
    "Daily news briefs and plain-English analysis covering AI, tech, markets, world politics, science, sports, and entertainment.",
  authors: [{ name: "GlobalPulse AI Desk", url: process.env.NEXT_PUBLIC_SITE_URL || "https://theglobalpulseai.com" }],
  creator: "GlobalPulse AI",
  publisher: "GlobalPulse AI",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://theglobalpulseai.com",
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
    <html
      lang="en"
      className={`h-full antialiased ${inter.variable} ${newsreader.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta name="monetag" content="debefa1274cfb3da902e7d4ca24045da" />
        <meta name="tiktok-developers-site-verification" content="8ZtJ7ileN14xFRdPeEgUday0VvqUf7Zj" />
        <meta name="tiktok-developers-site-verification" content="QFp2awRN7qTwaTOTSh824lhTKoK2Q9tO" />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="GlobalPulse AI RSS Feed"
          href="/rss.xml"
        />

        {/* Google Tag Manager (GTM-K65V6S6B) */}
        <Script
          src="https://www.googletagmanager.com/gtm.js?id=GTM-K65V6S6B"
          strategy="afterInteractive"
        />
        <Script
          id="gtm-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
            `,
          }}
        />

        {/* Google AdSense Official Script */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5380114680461998"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        {/* OneSignal Web Push Notifications (Free Global Audience Retention) */}
        <Script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          strategy="lazyOnload"
        />
        <Script
          id="onesignal-init"
          strategy="lazyOnload"
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
                });
              });
            `,
          }}
        />

        {/* Google Reader Revenue Manager (Subscribe with Google) */}
        <Script
          src="https://news.google.com/swg/js/v1/swg-basic.js"
          strategy="lazyOnload"
        />
        <Script
          id="google-rrm-init"
          strategy="lazyOnload"
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
        {/* Google Tag Manager (noscript fallback) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-K65V6S6B"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <div className="relative z-10 flex flex-col flex-1 min-h-screen">
          <AnalyticsTracker />
          <PushNotificationPrompt />
          <GlobalAdsManager />
          {children}
        </div>
      </body>
    </html>
  );
}
