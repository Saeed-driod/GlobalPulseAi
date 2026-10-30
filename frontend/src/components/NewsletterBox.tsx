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
    <div className={`my-12 p-8 sm:p-10 rounded-3xl neu-flat relative overflow-hidden text-center ${className}`}>
      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full neu-pressed text-[#1a8cff] text-xs font-mono font-bold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5 text-[#1a8cff]" />
          <span>Daily Executive Intelligence</span>
        </div>

        <h3 className="text-2xl sm:text-3xl font-black font-serif text-[#2d3748] tracking-tight leading-snug">
          Subscribe to Our Daily AI &amp; Market Briefing
        </h3>

        <p className="text-sm text-[#718096] mt-3 leading-relaxed">
          Join 45,000+ senior engineers, hedge fund analysts, and founders receiving our zero-noise morning intelligence, breaking geopolitical alerts, and 60-second video briefings.
        </p>

        {submitted ? (
          <div className="mt-6 p-4 rounded-2xl neu-pressed text-emerald-600 flex items-center justify-center gap-2.5 text-sm font-mono font-semibold animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
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
              className="flex-1 px-4 py-3 rounded-xl neu-input text-[#2d3748] text-sm font-mono placeholder:text-[#a0aec0]"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl neu-btn-primary font-bold text-sm font-mono transition disabled:opacity-50 shrink-0"
            >
              {loading ? "Subscribing..." : "Subscribe Free"}
            </button>
          </form>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] text-[#718096] font-mono">
          <span className="flex items-center gap-1.5 text-[#718096]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> No spam • Unsubscribe anytime
          </span>
          <span>•</span>
          <span>Delivered 06:00 EST Daily</span>
        </div>
      </div>
    </div>
  );
};
