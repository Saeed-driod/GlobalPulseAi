"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { ArrowLeft, Sparkles, CheckCircle2, Youtube, ExternalLink, Globe } from "../../components/Icons";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "Editorial Inquiry",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.message) return;
    setSending(true);

    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-neutral-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-8 pb-24">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white font-mono transition"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" /> Back to Intelligence Wire
          </Link>
        </div>

        <div className="max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Editorial Bureau &amp; Press Desk</span>
          </div>

          <h1 className="text-4xl font-black font-serif text-white tracking-tight leading-tight">
            Contact GlobalPulse AI
          </h1>

          <p className="text-sm text-neutral-300 mt-3 leading-relaxed">
            Have a breaking story lead, partnership proposal, or editorial correction? Contact our 24/7 global intelligence newsroom below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Contact Form */}
          <div className="lg:col-span-7 glass-panel p-8 sm:p-10 rounded-3xl border border-white/10 relative overflow-hidden">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold font-serif text-white">Dispatch Transmitted</h3>
                <p className="text-xs text-neutral-300 max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out. Our editorial desk has logged your transmission and will review it promptly.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: "", email: "", subject: "Editorial Inquiry", message: "" });
                  }}
                  className="mt-4 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-mono transition"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-mono text-neutral-300 mb-1.5 uppercase tracking-wider">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-neutral-800 text-white text-sm focus:outline-none focus:border-cyan-400 transition placeholder:text-neutral-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-300 mb-1.5 uppercase tracking-wider">
                    Executive / Business Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@organization.com"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-neutral-800 text-white text-sm focus:outline-none focus:border-cyan-400 transition placeholder:text-neutral-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-300 mb-1.5 uppercase tracking-wider">
                    Inquiry Category
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-neutral-800 text-white text-sm focus:outline-none focus:border-cyan-400 transition font-mono"
                  >
                    <option value="Editorial Inquiry">Editorial &amp; Story Lead</option>
                    <option value="Partnership / Sponsorship">Brand Sponsorship &amp; Ad Space</option>
                    <option value="Correction Desk">Factual Correction / Clarification</option>
                    <option value="API & Tech Ingestion">API Integration &amp; Syndication</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-300 mb-1.5 uppercase tracking-wider">
                    Transmission Message
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Provide details regarding your inquiry, story lead, or partnership..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-neutral-800 text-white text-sm focus:outline-none focus:border-cyan-400 transition placeholder:text-neutral-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 hover:from-cyan-300 hover:to-purple-500 text-slate-950 font-black text-sm rounded-xl transition shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Transmitting Dossier...</span>
                    </>
                  ) : (
                    <span>Transmit Message to Newsroom</span>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Bureau Info & Direct Channels */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
              <h3 className="text-xs uppercase font-mono font-bold tracking-widest text-cyan-400">
                Direct Newsroom Contacts
              </h3>

              <div className="space-y-3 text-xs font-mono">
                <div>
                  <div className="text-neutral-400">General Editorial Bureau:</div>
                  <div className="text-white font-semibold">editorial@globalpulseai.com</div>
                </div>
                <div>
                  <div className="text-neutral-400">Advertising &amp; Sponsorships:</div>
                  <div className="text-white font-semibold">ads@globalpulseai.com</div>
                </div>
                <div>
                  <div className="text-neutral-400">Legal &amp; Privacy Desk:</div>
                  <div className="text-white font-semibold">privacy@globalpulseai.com</div>
                </div>
              </div>
            </div>

            {/* Featured Channel Card */}
            <div className="glass-panel p-6 rounded-2xl border border-red-500/30 bg-gradient-to-br from-neutral-900 to-red-950/20 space-y-3">
              <div className="flex items-center gap-2 text-red-400 text-xs font-mono font-bold">
                <Youtube className="w-4 h-4 text-red-500" />
                <span>OFFICIAL YOUTUBE MEDIA PARTNER</span>
              </div>
              <h4 className="text-base font-bold text-white font-serif">
                EduHub by Saeed
              </h4>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Connect directly with our primary broadcast partner for video sponsorships, coding tutorials, and tech reviews.
              </p>
              <a
                href="https://www.youtube.com/@EduHubbySaeed"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition shadow-md shadow-red-600/30"
              >
                <span>Visit YouTube Channel</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
