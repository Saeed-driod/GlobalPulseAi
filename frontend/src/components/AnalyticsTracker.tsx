"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === lastTrackedPath.current) return;
    lastTrackedPath.current = pathname;

    // Do not track admin editing sessions
    if (pathname.startsWith("/admin")) return;

    let slug: string | undefined = undefined;
    const match = pathname.match(/^\/news\/([^\/]+)$/);
    if (match) {
      slug = match[1];
    }

    const isMobile = typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const isTablet = typeof navigator !== "undefined" && /iPad|Tablet/i.test(navigator.userAgent);
    const device = isTablet ? "Tablet" : isMobile ? "Mobile" : "Desktop";

    let browser = "Chrome";
    if (typeof navigator !== "undefined") {
      if (/Firefox/i.test(navigator.userAgent)) browser = "Firefox";
      else if (/Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent)) browser = "Safari";
      else if (/Edg/i.test(navigator.userAgent)) browser = "Edge";
    }

    const payload = {
      path: pathname,
      article_slug: slug,
      referrer: typeof document !== "undefined" ? document.referrer : "",
      device,
      browser,
    };

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://globlepulseai.onrender.com";
    try {
      fetch(`${apiUrl}/api/analytics/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {
        // Silent fallback for uninterrupted UX
      });
    } catch {
      // Ignore network errors
    }
  }, [pathname]);

  return null;
}
