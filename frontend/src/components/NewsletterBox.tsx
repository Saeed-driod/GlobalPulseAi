"use client";

import React, { useState } from "react";
import { Sparkles, CheckCircle2, ShieldCheck } from "./Icons";

export const NewsletterBox: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("gp_newsletter_subscribed", "true");
        } catch {}
      }
    }, 700);
  };

  return (
    <div className={`my-12 p-8 sm:p-10 rounded-3xl neu-flat relative overflow-hidden text-center border border-white/10 ${className}`}>
      {/* Top Chromatic Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]" />

      {/* Ambient Radial Lighting */}
      <div className="absolute inset-0 bg-radial-gradient from-cyan-500/5 via-purple-500/5 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full neu-pressed text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider mb-4 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.25)]">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Daily Executive Intelligence</span>
        </div>

        <h3 className="text-2xl sm:text-3xl font-black font-serif text-white tracking-tight leading-snug">
          Subscribe to Our Daily AI &amp; Market Briefing
        </h3>

        <p className="text-sm text-slate-300 mt-3 leading-relaxed">
          Join 45,000+ senior engineers, hedge fund analysts, and founders receiving our zero-noise morning intelligence, breaking geopolitical alerts, and 60-second video briefings.
        </p>

        {submitted ? (
          <div className="mt-6 p-4 rounded-2xl neu-pressed text-emerald-300 flex items-center justify-center gap-2.5 text-sm font-mono font-semibold border border-emerald-500/40 bg-emerald-950/50 shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Welcome to the GlobalPulse Inner Circle. Check your inbox for today&apos;s briefing dossier!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your executive email..."
              required
              className="flex-1 px-4 py-3 rounded-xl neu-input text-white text-sm font-mono placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl neu-btn-primary font-bold text-sm font-mono transition disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {loading ? "Subscribing..." : "Subscribe Free"}
            </button>
          </form>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1.5 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> No spam • Unsubscribe anytime
          </span>
          <span>•</span>
          <span>Delivered 06:00 EST Daily</span>
        </div>
      </div>
    </div>
  );
};
