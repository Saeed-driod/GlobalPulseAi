"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { fetchAdSettings } from "../lib/api";

/**
 * Injects Monetag Global Verification Meta & Floating Vignette / In-Page Push scripts safely.
 * - Deduplicates injection to prevent duplicate popunders/scripts.
 * - Suppressed completely on /admin and /dashboard routes.
 * - Respects master_enabled toggle.
 */
export function MonetagGlobalScript() {
  const pathname = usePathname();

  useEffect(() => {
    // 1. Strict Exclusion: Never inject ads inside /admin or /dashboard
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) {
      return;
    }

    let isCancelled = false;

    fetchAdSettings().then((settings) => {
      if (isCancelled || !settings || !settings.master_enabled) return;

      const rawCode = settings.monetag_global_script?.trim();
      if (!rawCode) return;

      // 2. Prevent duplicate injection across client transitions
      if (document.querySelector("[data-monetag-injected='true']")) {
        return;
      }

      try {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = rawCode;

        // Process <meta> tags
        const metaTags = tempDiv.querySelectorAll("meta");
        metaTags.forEach((meta) => {
          const name = meta.getAttribute("name");
          const content = meta.getAttribute("content");
          if (name && !document.querySelector(`meta[name="${name}"]`)) {
            const newMeta = document.createElement("meta");
            newMeta.setAttribute("name", name);
            if (content) newMeta.setAttribute("content", content);
            newMeta.setAttribute("data-monetag-injected", "true");
            document.head.appendChild(newMeta);
          }
        });

        // Process <script> tags
        const scriptTags = tempDiv.querySelectorAll("script");
        scriptTags.forEach((script) => {
          const newScript = document.createElement("script");
          newScript.setAttribute("data-monetag-injected", "true");
          newScript.async = true;

          // Copy all attributes (src, type, etc.)
          for (let i = 0; i < script.attributes.length; i++) {
            const attr = script.attributes[i];
            newScript.setAttribute(attr.name, attr.value);
          }

          if (script.innerHTML) {
            newScript.innerHTML = script.innerHTML;
          }

          document.body.appendChild(newScript);
        });
      } catch (err) {
        console.warn("[Monetag Global Script Injection Error]:", err);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [pathname]);

  return null;
}
