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
    <div
      className={`my-12 p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-neutral-900 to-cyan-950/30 border border-cyan-500/30 shadow-2xl shadow-cyan-950/20 relative overflow-hidden ${className}`}
    >
      {/* Background neon ambient blur */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Daily Executive Intelligence</span>
        </div>

        <h3 className="text-2xl sm:text-3xl font-black font-serif text-white tracking-tight leading-snug">
          Subscribe to Our Daily AI & Market Briefing
        </h3>

        <p className="text-sm text-neutral-300 mt-3 leading-relaxed">
          Join 45,000+ senior engineers, hedge fund analysts, and founders receiving our zero-noise morning intelligence, breaking geopolitical alerts, and 60-second video briefings.
        </p>

        {submitted ? (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-center gap-2.5 text-sm font-mono animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Welcome to the GlobalPulse Inner Circle. Check your inbox for today's briefing dossier!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your executive email..."
              required
              className="flex-1 px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm font-mono focus:outline-none focus:border-cyan-400 transition placeholder:text-neutral-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-sm font-mono transition shadow-lg shadow-cyan-400/20 disabled:opacity-50 shrink-0"
            >
              {loading ? "Subscribing..." : "Subscribe Free"}
            </button>
          </form>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-[11px] text-neutral-500 font-mono">
          <span className="flex items-center gap-1 text-neutral-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> No spam • Unsubscribe anytime
          </span>
          <span>•</span>
          <span>Delivered 06:00 EST Daily</span>
        </div>
      </div>
    </div>
  );
};
