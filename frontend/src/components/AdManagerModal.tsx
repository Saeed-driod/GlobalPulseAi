"use client";

import React, { useState, useEffect } from "react";
import { fetchAdSettings, updateAdSettings, AdSettings, AdsMode } from "../lib/api";
import { Sparkles, ShieldCheck, CheckCircle2 } from "./Icons";

interface AdManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

const ADS_MODE_OPTIONS: { id: AdsMode; title: string; badge: string; desc: string }[] = [
  {
    id: "full",
    title: "Full",
    badge: "Maximum Revenue",
    desc: "Full: all ads (display banners, popunders, vignette, in-page push, social bar, and smartlink).",
  },
  {
    id: "review",
    title: "AdSense review",
    badge: "Review Safe",
    desc: "AdSense review: banners only, no popunders/vignette/push/social bar/smartlink.",
  },
  {
    id: "off",
    title: "Off",
    badge: "AdSense Only",
    desc: "Off: no third-party ads (AdSense only).",
  },
];

export function AdManagerModal({ isOpen, onClose, onSuccessToast }: AdManagerModalProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [adsMode, setAdsMode] = useState<AdsMode>("full");
  const [directLinkUrl, setDirectLinkUrl] = useState<string>("");
  const [adsterraHeaderBanner, setAdsterraHeaderBanner] = useState<string>("");
  const [adsterraInfeedBanner, setAdsterraInfeedBanner] = useState<string>("");
  const [adsterraSidebarBanner, setAdsterraSidebarBanner] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setSaveStatus(null);
    fetchAdSettings(true)
      .then((settings) => {
        const mode: AdsMode = (!settings.master_enabled || settings.ads_mode === "off")
          ? "off"
          : (settings.ads_mode === "review" ? "review" : "full");
        setAdsMode(mode);
        setDirectLinkUrl(settings.direct_link_url || "");
        setAdsterraHeaderBanner(settings.adsterra_header_banner || "");
        setAdsterraInfeedBanner(settings.adsterra_infeed_banner || "");
        setAdsterraSidebarBanner(settings.adsterra_sidebar_banner || "");
      })
      .catch((err) => {
        console.error("Failed to load ad settings:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus(null);

    const payload: Partial<AdSettings> = {
      master_enabled: adsMode !== "off",
      ads_mode: adsMode,
      direct_link_url: directLinkUrl.trim(),
      adsterra_header_banner: adsterraHeaderBanner.trim(),
      adsterra_infeed_banner: adsterraInfeedBanner.trim(),
      adsterra_sidebar_banner: adsterraSidebarBanner.trim(),
    };

    const res = await updateAdSettings(payload);
    setSaving(false);

    if (res.success) {
      setSaveStatus("success");
      if (onSuccessToast) {
        onSuccessToast(`Ad configuration saved: ${adsMode.toUpperCase()} mode active.`);
      }
      setTimeout(() => setSaveStatus(null), 3500);
    } else {
      setSaveStatus(res.message || "Failed to update ad settings.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-[#121824] border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 text-slate-100 font-sans relative my-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-xl font-bold font-serif text-white tracking-tight flex items-center gap-2">
                💰 Ad Monetization Manager
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Multi-Network Ad Controls • Google AdSense Compliance • Zero Layout Shift (CLS Safe)
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-mono text-sm transition"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Sparkles className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-mono">Loading active ad network settings...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6 mt-6">
            {/* 3-Choice Ads Mode Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                  Ads Mode (Single Master Control)
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  Current: <strong className="text-cyan-300 uppercase">{adsMode}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ADS_MODE_OPTIONS.map((opt) => {
                  const isSelected = adsMode === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setAdsMode(opt.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-cyan-950/40 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500"
                          : "bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-bold ${isSelected ? "text-cyan-300 font-serif" : "text-slate-200"}`}>
                            {opt.title}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                              opt.id === "full"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : opt.id === "review"
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-red-500/20 text-red-400 border border-red-500/30"
                            }`}
                          >
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-sans">
                          {opt.desc}
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px] font-mono">
                        <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-cyan-400 animate-pulse" : "bg-slate-600"}`} />
                        <span className={isSelected ? "text-cyan-300 font-bold" : "text-slate-500"}>
                          {isSelected ? "Active" : "Select"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Field 1: Smart Direct Link / Smartlink URL */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>1. Direct Link (Smartlink) URL</span>
                </label>
                <span className="text-[10px] font-mono text-emerald-400">Full Mode Only</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Smart trigger on user actions (&quot;Read original&quot; on News). Active only in &quot;Full&quot; mode.
              </p>
              <input
                type="url"
                value={directLinkUrl}
                onChange={(e) => setDirectLinkUrl(e.target.value)}
                placeholder="https://otieu.com/4/89... or https://monetag.com/direct/..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            {/* Field 2: Adsterra Header Banner Script */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>2. Adsterra Top Leaderboard Banner (728x90 / 320x50)</span>
                </label>
                <span className="text-[10px] font-mono text-slate-500">Desktop & Mobile Responsive</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Placed below top navigation. Active in &quot;Full&quot; and &quot;AdSense review&quot; modes.
              </p>
              <textarea
                value={adsterraHeaderBanner}
                onChange={(e) => setAdsterraHeaderBanner(e.target.value)}
                placeholder='<script type="text/javascript">&#10;  atOptions = { "key" : "...", "format" : "iframe", "height" : 90, "width" : 728 };&#10;</script>&#10;<script type="text/javascript" src="//www.topcreativeformat.com/.../invoke.js"></script>'
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500 transition resize-y"
              />
            </div>

            {/* Field 3: Adsterra In-Feed Native Banner Script */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>3. Adsterra In-Feed Native Banner Script</span>
                </label>
                <span className="text-[10px] font-mono text-slate-500">Every 6th Card In-Stream</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Injected after every 6th news article card inside a matching card container. Active in &quot;Full&quot; and &quot;AdSense review&quot; modes.
              </p>
              <textarea
                value={adsterraInfeedBanner}
                onChange={(e) => setAdsterraInfeedBanner(e.target.value)}
                placeholder='<script async="async" data-cfasync="false" src="//pl...js"></script>&#10;<div id="container-..."></div>'
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500 transition resize-y"
              />
            </div>

            {/* Field 4: Adsterra Sidebar Banner Script */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>4. Adsterra Sticky Sidebar Banner (300x250)</span>
                </label>
                <span className="text-[10px] font-mono text-slate-500">Desktop Reading Sidebar</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sticky 300x250 medium rectangle placed alongside full news dispatches. Active in &quot;Full&quot; and &quot;AdSense review&quot; modes.
              </p>
              <textarea
                value={adsterraSidebarBanner}
                onChange={(e) => setAdsterraSidebarBanner(e.target.value)}
                placeholder='<script type="text/javascript">&#10;  atOptions = { "key" : "...", "format" : "iframe", "height" : 250, "width" : 300 };&#10;</script>'
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500 transition resize-y"
              />
            </div>

            {/* Feedback Alert */}
            {saveStatus === "success" && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Ad monetization configuration saved successfully and applied instantly!</span>
              </div>
            )}
            {saveStatus && saveStatus !== "success" && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
                {saveStatus}
              </div>
            )}

            {/* Bottom Controls */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Google Search Console & SEO Safe
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-cyan-600/30 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to DB...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save & Apply Instantly</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default AdManagerModal;
