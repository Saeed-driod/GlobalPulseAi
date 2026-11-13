"use client";

import React, { useState, useEffect } from "react";
import { fetchAdSettings, updateAdSettings, AdSettings } from "../lib/api";
import { Sparkles, ShieldCheck, CheckCircle2, Lock, ExternalLink } from "./Icons";

interface AdManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

export function AdManagerModal({ isOpen, onClose, onSuccessToast }: AdManagerModalProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [masterEnabled, setMasterEnabled] = useState<boolean>(true);
  const [monetagGlobalScript, setMonetagGlobalScript] = useState<string>("");
  const [directLinkUrl, setDirectLinkUrl] = useState<string>("");
  const [adsterraHeaderBanner, setAdsterraHeaderBanner] = useState<string>("");
  const [adsterraInfeedBanner, setAdsterraInfeedBanner] = useState<string>("");
  const [adsterraSidebarBanner, setAdsterraSidebarBanner] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setSaveStatus(null);
    fetchAdSettings()
      .then((settings) => {
        setMasterEnabled(settings.master_enabled ?? true);
        setMonetagGlobalScript(settings.monetag_global_script || "");
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
      master_enabled: masterEnabled,
      monetag_global_script: monetagGlobalScript.trim(),
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
        onSuccessToast("Ad settings saved and applied instantly across all slots!");
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
              Dual-Network Architecture (Monetag + Adsterra Golden Combo) • Zero Layout Shift (CLS Safe) • Real-time DB Sync
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
            {/* Master Switch */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div>
                <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <span>Enable All Ads (Master Switch)</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                      masterEnabled
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {masterEnabled ? "Active & Serving" : "Paused / Disabled"}
                  </span>
                </label>
                <p className="text-xs text-slate-400 mt-0.5">
                  Turn off instantly to pause all ad units and scripts without removing code. Ads are automatically hidden on /admin and /dashboard routes.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMasterEnabled(!masterEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  masterEnabled ? "bg-cyan-500" : "bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    masterEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Field 1: Monetag Meta Verification & Global Floating Script */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>1. Monetag Global Meta & Floating Script</span>
                </label>
                <span className="text-[10px] font-mono text-slate-500">In-Page Push & Vignette</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Paste Monetag domain verification <code>&lt;meta&gt;</code> tags and global SDK scripts. Automatically injected once into <code>&lt;head&gt;</code> / <code>&lt;body&gt;</code> with strict duplicate popunder prevention.
              </p>
              <textarea
                value={monetagGlobalScript}
                onChange={(e) => setMonetagGlobalScript(e.target.value)}
                placeholder='<meta name="monetag" content="..."/>&#10;<script src="https://alwingulla.com/..." async></script>'
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500 transition resize-y"
              />
            </div>

            {/* Field 2: Smart Direct Link / Smartlink URL */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>2. Monetag / Adsterra Direct Link (Smartlink) URL</span>
                </label>
                <span className="text-[10px] font-mono text-emerald-400">Session-Capped (1 click / 30m)</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Smart trigger on primary actions (&quot;Apply Now&quot; on Job Portal, &quot;Read the original&quot; on News). The real destination URL is always delivered to the user; smartlink activates once per session to maximize CPM without annoying visitors.
              </p>
              <input
                type="url"
                value={directLinkUrl}
                onChange={(e) => setDirectLinkUrl(e.target.value)}
                placeholder="https://otieu.com/4/89... or https://monetag.com/direct/..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            {/* Field 3: Adsterra Header Banner Script */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>3. Adsterra Top Leaderboard Banner (728x90 / 320x50)</span>
                </label>
                <span className="text-[10px] font-mono text-slate-500">Desktop & Mobile Responsive</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Placed cleanly below the top navigation bar with a reserved fixed min-height container to ensure zero Cumulative Layout Shift (CLS).
              </p>
              <textarea
                value={adsterraHeaderBanner}
                onChange={(e) => setAdsterraHeaderBanner(e.target.value)}
                placeholder='<script type="text/javascript">&#10;  atOptions = { "key" : "...", "format" : "iframe", "height" : 90, "width" : 728 };&#10;</script>&#10;<script type="text/javascript" src="//www.topcreativeformat.com/.../invoke.js"></script>'
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500 transition resize-y"
              />
            </div>

            {/* Field 4: Adsterra In-Feed Native Banner Script */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>4. Adsterra In-Feed Native Banner Script</span>
                </label>
                <span className="text-[10px] font-mono text-slate-500">Every 4th/5th Card In-Stream</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Injected after every 4th news article (GlobalPulse AI) and every 5th job card (GlobalHire AI) inside a matching native card container with a &quot;Sponsored&quot; badge for high CTR.
              </p>
              <textarea
                value={adsterraInfeedBanner}
                onChange={(e) => setAdsterraInfeedBanner(e.target.value)}
                placeholder='<script async="async" data-cfasync="false" src="//pl...js"></script>&#10;<div id="container-..."></div>'
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500 transition resize-y"
              />
            </div>

            {/* Field 5: Adsterra Sidebar Banner Script */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>5. Adsterra Sticky Sidebar Banner (300x250)</span>
                </label>
                <span className="text-[10px] font-mono text-slate-500">Desktop Reading Sidebar</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sticky 300x250 medium rectangle placed alongside full news dispatches and job application briefs.
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
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-cyan-600/30 disabled:opacity-50"
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

