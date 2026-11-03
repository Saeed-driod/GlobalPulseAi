"use client";

import React, { useState } from "react";
import { Sparkles, ShieldCheck, Zap, RefreshCw, CheckCircle2, Share2 } from "./Icons";

type AnalysisMode = "executive" | "bias" | "eli5" | "market";

interface AnalysisResult {
  headline: string;
  credibility_score: number;
  credibility_label: string;
  bias_score: string;
  bullets: string[];
  entities: string[];
  reading_time_saved: string;
}

export const AiNewsAnalyst: React.FC = () => {
  const [inputText, setInputText] = useState<string>("");
  const [mode, setMode] = useState<AnalysisMode>("executive");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const sampleArticles = {
    tech: "OpenAI and Anthropic have announced a new standardized safety evaluation protocol for frontier AI models. The framework provides automated red-teaming benchmarks, cryptographic weights auditing, and a shared threat telemetry exchange between leading US research labs and government defense bodies.",
    crypto: "Bitcoin surged past $69,000 as spot ETF net inflows hit a 3-month high of $870 million in 24 hours. Major asset managers including BlackRock and Fidelity reported institutional accumulation from sovereign wealth funds, leading to a massive short squeeze across major derivatives exchanges.",
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() || inputText.trim().length < 20) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/ai-analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, mode }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data);
      }
    } catch (err) {
      console.error("AI Analysis error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const textToCopy = `🤖 GlobalPulse AI Intelligence Synthesis:\n\n${result.headline}\n\nKey Takeaways:\n${result.bullets.map((b) => `• ${b}`).join("\n")}\n\nCredibility: ${result.credibility_score}/100 | Bias: ${result.bias_score}\n\nAnalyzed free on: https://globalpulseai.vercel.app`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section className="my-10 neu-flat p-6 sm:p-8 relative overflow-hidden">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#1a8cff]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1a8cff] shadow-[0_0_8px_rgba(26,140,255,0.7)] animate-pulse" />
            <span className="text-[11px] font-mono uppercase font-black text-[#1a8cff] tracking-widest">
              FREE AI INTELLIGENCE LAB • NEURAL ANALYZER
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#2d3748] tracking-tight">
            Instant News Summarizer &amp; Bias Detector
          </h3>
          <p className="text-xs text-[#718096] mt-1 font-mono">
            Paste any article, headline, or claim to generate an instant 30-second executive breakdown, credibility audit, and bias rating.
          </p>
        </div>

        {/* Quick Example Triggers */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono text-[#718096] uppercase font-bold hidden md:inline">
            Try Sample:
          </span>
          <button
            type="button"
            onClick={() => setInputText(sampleArticles.tech)}
            className="neu-sm px-2.5 py-1 text-[11px] font-mono font-bold text-[#2d3748] hover:text-[#1a8cff] transition cursor-pointer"
          >
            ⚡ Frontier AI
          </button>
          <button
            type="button"
            onClick={() => setInputText(sampleArticles.crypto)}
            className="neu-sm px-2.5 py-1 text-[11px] font-mono font-bold text-[#2d3748] hover:text-emerald-600 transition cursor-pointer"
          >
            📈 Crypto Surge
          </button>
        </div>
      </div>

      {/* Input Area */}
      <div className="space-y-4">
        <textarea
          rows={3}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste news text, headline, or article excerpt here to synthesize with AI (min 20 characters)..."
          className="w-full neu-input p-4 text-xs sm:text-sm font-sans placeholder:text-[#a0aec0] resize-y focus:outline-none"
        />

        {/* Controls: Mode Selector + Action Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Analysis Lens Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none neu-pressed p-1 rounded-xl">
            {(
              [
                { id: "executive", label: "⚡ 30s Executive Brief" },
                { id: "bias", label: "🛡️ Bias & Credibility" },
                { id: "eli5", label: "🧒 ELI5 (Simple Terms)" },
                { id: "market", label: "📈 Market Impact" },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all duration-150 cursor-pointer whitespace-nowrap ${
                  mode === m.id
                    ? "neu-sm text-[#1a8cff]"
                    : "text-[#718096] hover:text-[#2d3748]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading || inputText.trim().length < 20}
            className="neu-btn-primary px-6 py-2.5 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Analyze with AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Output Result Card */}
      {result && (
        <div className="mt-6 neu-pressed p-5 sm:p-6 rounded-2xl border border-[#b8bec7]/40 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Top Score Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#b8bec7]/40">
            <div className="flex items-center gap-2">
              <span className="neu-sm px-2.5 py-1 text-[11px] font-mono font-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Credibility: {result.credibility_score}/100 ({result.credibility_label})
              </span>
              <span className="neu-sm px-2.5 py-1 text-[11px] font-mono font-bold text-[#1a8cff]">
                Bias: {result.bias_score}
              </span>
            </div>

            <span className="text-[11px] font-mono text-[#718096]">
              ⚡ Time Saved: <strong className="text-[#2d3748]">{result.reading_time_saved}</strong>
            </span>
          </div>

          {/* Headline Takeaway */}
          <h4 className="text-base sm:text-lg font-bold font-serif text-[#2d3748] leading-snug">
            {result.headline}
          </h4>

          {/* Bullet Points */}
          <div className="space-y-2">
            {result.bullets.map((bullet, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#4a5568] leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1a8cff] mt-2 shrink-0" />
                <span>{bullet}</span>
              </div>
            ))}
          </div>

          {/* Detected Entities & Share Button */}
          <div className="pt-3 border-t border-[#b8bec7]/40 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono text-[#718096] uppercase font-bold">Key Vectors:</span>
              {result.entities.map((entity, i) => (
                <span key={i} className="neu-sm px-2 py-0.5 text-[10px] font-mono font-bold text-[#2d3748]">
                  #{entity}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="neu-sm px-3 py-1.5 text-xs font-mono font-bold text-[#2d3748] hover:text-[#1a8cff] transition flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copied ? "✓ Copied to Clipboard!" : "Share / Copy"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

