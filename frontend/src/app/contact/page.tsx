"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { ArrowLeft, Sparkles, CheckCircle2, Youtube, ExternalLink } from "../../components/Icons";

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
    <div className="min-h-screen bg-[#e0e5ec] text-[#2d3748] flex flex-col font-sans selection:bg-[#1a8cff] selection:text-white">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-8 pb-24">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl neu-sm text-xs text-[#718096] hover:text-[#1a8cff] font-mono transition active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-[#1a8cff]" /> Back to Intelligence Wire
          </Link>
        </div>

        <div className="max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full neu-pressed text-[#1a8cff] text-xs font-mono font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#1a8cff]" />
            <span>Editorial Bureau &amp; Press Desk</span>
          </div>

          <h1 className="text-4xl font-black font-serif text-[#2d3748] tracking-tight leading-tight">
            Contact GlobalPulse AI
          </h1>

          <p className="text-sm text-[#718096] mt-3 leading-relaxed">
            Have a breaking story lead, partnership proposal, or editorial correction? Contact our 24/7 global intelligence newsroom below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Contact Form */}
          <div className="lg:col-span-7 neu-flat p-8 sm:p-10 rounded-3xl relative overflow-hidden">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl neu-pressed text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold font-serif text-[#2d3748]">Dispatch Transmitted</h3>
                <p className="text-xs text-[#718096] max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out. Our editorial desk has logged your transmission and will review it promptly.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: "", email: "", subject: "Editorial Inquiry", message: "" });
                  }}
                  className="mt-4 px-6 py-2.5 neu-sm text-[#2d3748] hover:text-[#1a8cff] font-bold rounded-xl text-xs font-mono transition active:scale-95"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-mono text-[#2d3748] font-bold mb-2 uppercase tracking-wider">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-4 py-3 rounded-xl neu-input text-[#2d3748] text-sm placeholder:text-[#a0aec0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#2d3748] font-bold mb-2 uppercase tracking-wider">
                    Executive / Business Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@organization.com"
                    className="w-full px-4 py-3 rounded-xl neu-input text-[#2d3748] text-sm placeholder:text-[#a0aec0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#2d3748] font-bold mb-2 uppercase tracking-wider">
                    Inquiry Category
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl neu-input text-[#2d3748] text-sm font-mono cursor-pointer"
                  >
                    <option value="Editorial Inquiry">Editorial &amp; Story Lead</option>
                    <option value="Partnership / Sponsorship">Brand Sponsorship &amp; Ad Space</option>
                    <option value="Correction Desk">Factual Correction / Clarification</option>
                    <option value="API & Tech Ingestion">API Integration &amp; Syndication</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#2d3748] font-bold mb-2 uppercase tracking-wider">
                    Transmission Message
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Provide details regarding your inquiry, story lead, or partnership..."
                    className="w-full px-4 py-3 rounded-xl neu-input text-[#2d3748] text-sm placeholder:text-[#a0aec0]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-3.5 neu-btn-primary font-bold text-sm rounded-xl transition flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-white" />
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
            <div className="neu-flat p-7 rounded-3xl space-y-4">
              <h3 className="text-xs uppercase font-mono font-bold tracking-widest text-[#1a8cff]">
                Direct Newsroom Contacts
              </h3>

              <div className="space-y-3.5 text-xs font-mono">
                <div>
                  <div className="text-[#718096]">General Editorial Bureau:</div>
                  <div className="text-[#2d3748] font-bold">editorial@globalpulseai.com</div>
                </div>
                <div>
                  <div className="text-[#718096]">Advertising &amp; Sponsorships:</div>
                  <div className="text-[#2d3748] font-bold">ads@globalpulseai.com</div>
                </div>
                <div>
                  <div className="text-[#718096]">Legal &amp; Privacy Desk:</div>
                  <div className="text-[#2d3748] font-bold">privacy@globalpulseai.com</div>
                </div>
              </div>
            </div>

            {/* Featured Channel Card */}
            <div className="neu-flat p-7 rounded-3xl space-y-3">
              <div className="flex items-center gap-2 text-red-600 text-xs font-mono font-bold">
                <Youtube className="w-4 h-4 text-red-600" />
                <span>OFFICIAL YOUTUBE MEDIA PARTNER</span>
              </div>
              <h4 className="text-base font-bold text-[#2d3748] font-serif">
                GlobalPulse AI on YouTube
              </h4>
              <p className="text-xs text-[#718096] leading-relaxed">
                Connect directly with our primary broadcast channel for video dispatches, technology intelligence, and global market coverage.
              </p>
              <a
                href="https://www.youtube.com/@GloblePulseAi"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition shadow-md shadow-red-600/20 active:scale-95"
              >
                <span>Visit YouTube Channel (@GloblePulseAi)</span>
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
