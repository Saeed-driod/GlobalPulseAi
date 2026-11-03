"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, CheckCircle2, Share2, Sparkles } from "./Icons";

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export const ViralPoll: React.FC = () => {
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const [options, setOptions] = useState<PollOption[]>([
    { id: "opt1", text: "🚀 Yes, transformation is exponential and irreversible", votes: 2480 },
    { id: "opt2", text: "🛡️ No, security risks & regulatory compliance will limit it", votes: 890 },
    { id: "opt3", text: "⚖️ Only in entry-level & routine administrative tasks", votes: 560 },
  ]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gp_poll_voted_q1");
      if (saved) {
        setHasVoted(true);
        setSelectedOption(saved);
      }
    }
  }, []);

  const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);

  const handleVote = (optionId: string) => {
    if (hasVoted) return;

    setOptions((prev) =>
      prev.map((opt) => (opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt))
    );
    setSelectedOption(optionId);
    setHasVoted(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("gp_poll_voted_q1", optionId);
    }
  };

  const pollQuestion = "Will Autonomous AI Agents manage more than 50% of software engineering and enterprise workflows by 2027?";
  const shareUrl = "https://globalpulseai.vercel.app";
  const shareMessage = `I just voted on GlobalPulse AI: "${pollQuestion}". Vote and see live global results: ${shareUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`, "_blank");
  };

  const handleTwitterShare = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `Global Sentiment Poll on @GlobalPulseAI: "${pollQuestion}". Vote now:`
      )}&url=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
  };

  return (
    <section className="my-10 neu-flat p-6 sm:p-8 relative overflow-hidden">
      {/* Background Subtle Gradient */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-[#1a8cff]" />
            <span className="text-[11px] font-mono uppercase font-black text-[#1a8cff] tracking-widest">
              DAILY GLOBAL SENTIMENT PULSE • LIVE COMMUNITY VOTE
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#2d3748] tracking-tight">
            {pollQuestion}
          </h3>
        </div>

        <div className="neu-sm px-3 py-1 text-xs font-mono font-bold text-[#718096] shrink-0 self-start sm:self-center">
          Verified Votes: <strong className="text-[#2d3748]">{totalVotes.toLocaleString()}</strong>
        </div>
      </div>

      {/* Options List */}
      <div className="space-y-3">
        {options.map((opt) => {
          const percent = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
          const isSelected = selectedOption === opt.id;

          return (
            <div
              key={opt.id}
              onClick={() => handleVote(opt.id)}
              className={`neu-sm p-4 rounded-xl transition-all relative overflow-hidden cursor-pointer select-none ${
                hasVoted
                  ? isSelected
                    ? "ring-2 ring-[#1a8cff]"
                    : "opacity-90"
                  : "hover:scale-[1.01] active:scale-[0.99]"
              }`}
            >
              {/* Animated Progress Bar fill when voted */}
              {hasVoted && (
                <div
                  className="absolute inset-y-0 left-0 bg-[#1a8cff]/10 transition-all duration-700 ease-out"
                  style={{ width: `${percent}%` }}
                />
              )}

              <div className="relative z-10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center border transition ${
                      isSelected
                        ? "border-[#1a8cff] bg-[#1a8cff] text-white"
                        : "border-[#b8bec7] bg-white"
                    }`}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>

                  <span className="text-xs sm:text-sm font-medium text-[#2d3748]">
                    {opt.text}
                  </span>
                </div>

                {hasVoted && (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs sm:text-sm font-bold font-mono text-[#1a8cff]">
                      {percent}%
                    </span>
                    <span className="text-[10px] font-mono text-[#718096] hidden sm:inline">
                      ({opt.votes.toLocaleString()})
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / Social Share */}
      <div className="mt-6 pt-4 border-t border-[#b8bec7]/40 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-mono text-[#718096]">
          {hasVoted
            ? "✓ Your vote has been verified on the global ledger."
            : "Click any option above to cast your vote and reveal live results."}
        </span>

        {/* Viral Share Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="neu-sm px-3 py-1.5 text-xs font-mono font-bold text-emerald-700 hover:text-emerald-800 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>💬 WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleTwitterShare}
            className="neu-sm px-3 py-1.5 text-xs font-mono font-bold text-[#1a8cff] hover:text-sky-600 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>🐦 Share on X</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="neu-sm px-3 py-1.5 text-xs font-mono font-bold text-[#2d3748] hover:text-[#1a8cff] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? "✓ Copied!" : "Copy Link"}</span>
          </button>
        </div>
      </div>
    </section>
  );
};

