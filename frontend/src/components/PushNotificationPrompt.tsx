"use client";

import React, { useState, useEffect } from "react";
import { Sparkles } from "./Icons";

export function PushNotificationPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if notification permission is already granted
    if ("Notification" in window && Notification.permission === "granted") {
      setIsSubscribed(true);
      return;
    }

    // Check if user dismissed recently (wait 3 days before showing again)
    const dismissedAt = localStorage.getItem("gp_push_dismissed");
    if (dismissedAt) {
      const days = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (days < 3) return;
    }

    // Show prompt after 6 seconds of engagement
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  const handleSubscribe = async () => {
    setStatusText("Enabling alerts...");

    // Try OneSignal deferred first
    if (typeof window !== "undefined" && (window as any).OneSignalDeferred) {
      try {
        (window as any).OneSignalDeferred.push(async function (OneSignal: any) {
          await OneSignal.User.PushSubscription.optIn();
          setIsSubscribed(true);
          setIsVisible(false);
          setStatusText("Subscribed!");
        });
        return;
      } catch (err) {
        console.warn("[OneSignal OptIn Error]", err);
      }
    }

    // Fallback to native Web Push permission
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        if (perm === "granted") {
          setIsSubscribed(true);
          setIsVisible(false);
          setStatusText("Subscribed!");
        } else {
          setIsVisible(false);
          localStorage.setItem("gp_push_dismissed", Date.now().toString());
        }
      } catch (e) {
        console.warn("[Push Permission Error]", e);
        setIsVisible(false);
      }
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("gp_push_dismissed", Date.now().toString());
    }
  };

  if (isSubscribed || !isVisible) return null;

  return (
    <aside 
      aria-label="Breaking news alerts notification"
      className="fixed bottom-5 right-5 z-50 max-w-sm w-full mx-auto p-4 sm:p-5 rounded-2xl bg-slate-950/95 border border-cyan-500/40 shadow-2xl shadow-cyan-950/60 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-500"
    >
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-cyan-500/30">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
          </svg>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300">
              Breaking Wire Dispatch
            </span>
          </div>
          <h4 className="text-sm font-bold text-white mt-1">
            Get Breaking World & Tech Alerts
          </h4>
          <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
            Instant briefings on World Politics, AI breakthroughs, and market shifts delivered to your device.
          </p>

          <div className="mt-3.5 flex items-center gap-2.5">
            <button
              onClick={handleSubscribe}
              className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold transition shadow-md shadow-cyan-500/25 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
              {statusText || "Enable Alerts (Free)"}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-400 hover:text-white transition"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
