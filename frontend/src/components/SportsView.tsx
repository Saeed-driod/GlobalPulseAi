"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { NormalizedMatch, SportCategory, SportsData } from "@/lib/sports";
import { ExternalLink, Calendar, Clock, Trophy, Search, AlertCircle } from "@/components/Icons";

interface SportsViewProps {
  initialData: SportsData;
}

const SPORT_TABS: { id: "All" | SportCategory; label: string; icon: string }[] = [
  { id: "All", label: "All Sports", icon: "🏆" },
  { id: "Cricket", label: "Cricket", icon: "🏏" },
  { id: "Football", label: "Football", icon: "⚽" },
  { id: "Basketball", label: "Basketball", icon: "🏀" },
  { id: "Hockey", label: "Hockey", icon: "🏒" },
  { id: "Tennis", label: "Tennis", icon: "🎾" },
  { id: "Other", label: "Other", icon: "🏅" },
];

function formatMatchTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return isoString;
  }
}

function formatMatchDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function MatchCard({ match }: { match: NormalizedMatch }) {
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";

  return (
    <div
      className={`neu-flat p-4 sm:p-5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
        isLive
          ? "border-rose-500/50 bg-gradient-to-b from-rose-950/20 via-slate-900/60 to-slate-900/80 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
          : "border-slate-800/80 hover:border-slate-700/80 bg-slate-900/40"
      }`}
    >
      <div>
        {/* Card Header: Sport, League, Status Badge */}
        <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-800/60">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
              {match.sport}
            </span>
            <span className="text-xs text-slate-400 truncate font-medium">
              {match.league}
            </span>
          </div>

          <div className="shrink-0">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                LIVE
              </span>
            ) : isFinished ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                FINAL
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40">
                <Clock className="w-3 h-3" />
                {formatMatchTime(match.startTime)}
              </span>
            )}
          </div>
        </div>

        {/* Teams and Score Presentation */}
        <div className="space-y-2.5 my-3">
          {/* Home Team */}
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold text-slate-100 text-sm sm:text-base truncate">
              {match.homeTeam}
            </span>
            {match.scoreText ? (
              <span className="font-mono text-base sm:text-lg font-bold text-amber-300 shrink-0">
                {match.scoreText.includes("-")
                  ? match.scoreText.split("-")[0].trim()
                  : match.scoreText}
              </span>
            ) : null}
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold text-slate-100 text-sm sm:text-base truncate">
              {match.awayTeam}
            </span>
            {match.scoreText && match.scoreText.includes("-") ? (
              <span className="font-mono text-base sm:text-lg font-bold text-amber-300 shrink-0">
                {match.scoreText.split("-")[1].trim()}
              </span>
            ) : null}
          </div>
        </div>

        {/* Match Context / Status Note */}
        {match.statusText && (
          <p className="text-xs text-slate-400 italic mt-2 line-clamp-1">
            {match.statusText}
          </p>
        )}

        {/* Venue / Timing Context */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 mt-2 font-mono">
          {match.startTime && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatMatchDate(match.startTime)}
            </span>
          )}
          {match.venue && (
            <span className="truncate max-w-[200px]" title={match.venue}>
              📍 {match.venue}
            </span>
          )}
        </div>
      </div>

      {/* Official Where to Watch Link */}
      {match.officialWatchUrl && (
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Where to watch:
          </span>
          <a
            href={match.officialWatchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors group"
          >
            <span>{match.broadcasterName || "Official Broadcast Guide"}</span>
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      )}
    </div>
  );
}

function EmptySectionState({ message, icon = "🏆" }: { message: string; icon?: string }) {
  return (
    <div className="neu-flat p-8 rounded-xl border border-slate-800/70 text-center bg-slate-900/30 flex flex-col items-center justify-center my-2">
      <span className="text-3xl mb-2">{icon}</span>
      <p className="text-sm text-slate-400 font-medium">{message}</p>
      <p className="text-xs text-slate-400 mt-1">
        Check back soon or filter by other sports categories above.
      </p>
    </div>
  );
}

export function SportsView({ initialData }: SportsViewProps) {
  const [selectedSport, setSelectedSport] = useState<"All" | SportCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filterMatches = (matches: NormalizedMatch[]) => {
    return matches.filter((m) => {
      const matchSport = selectedSport === "All" || m.sport === selectedSport;
      if (!matchSport) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        m.homeTeam.toLowerCase().includes(q) ||
        m.awayTeam.toLowerCase().includes(q) ||
        m.league.toLowerCase().includes(q) ||
        m.sport.toLowerCase().includes(q)
      );
    });
  };

  const filteredLive = useMemo(() => filterMatches(initialData.liveMatches), [initialData.liveMatches, selectedSport, searchQuery]);
  const filteredUpcoming = useMemo(() => filterMatches(initialData.upcomingMatches), [initialData.upcomingMatches, selectedSport, searchQuery]);
  const filteredRecent = useMemo(() => filterMatches(initialData.recentMatches), [initialData.recentMatches, selectedSport, searchQuery]);

  const totalMatchesCount = initialData.liveMatches.length + initialData.upcomingMatches.length + initialData.recentMatches.length;

  return (
    <div className="space-y-8">
      {/* Disclaimer Banner: Prominently displayed notice as requested */}
      <div className="neu-sm p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-200">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Live Scores Notice:</strong> Scores may be delayed by a few minutes. All match times shown in UTC / local broadcast time.
          </span>
        </div>
        <div className="text-[11px] text-amber-300/80 font-mono shrink-0">
          Refreshed automatically every 120s
        </div>
      </div>

      {/* Filter Chips / Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Filter by Sport
          </h2>
          {/* Quick Search */}
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search team or league..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {SPORT_TABS.map((tab) => {
            const isSelected = selectedSport === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedSport(tab.id)}
                className={`neu-sm px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? "neu-pressed bg-cyan-950/60 text-cyan-300 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                    : "text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700 bg-slate-900/40"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 1: Live Now */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              Live Now
              <span className="text-xs font-mono font-normal text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                {filteredLive.length} {filteredLive.length === 1 ? "match" : "matches"}
              </span>
            </h2>
          </div>
        </div>

        {filteredLive.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLive.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        ) : (
          <EmptySectionState
            message="No matches right now in this category"
            icon="⚡"
          />
        )}
      </section>

      {/* SECTION 2: Today's Fixtures & Upcoming */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              Today&apos;s Fixtures &amp; Upcoming
              <span className="text-xs font-mono font-normal text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                {filteredUpcoming.length}
              </span>
            </h2>
          </div>
        </div>

        {filteredUpcoming.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUpcoming.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        ) : (
          <EmptySectionState
            message="No matches right now in upcoming fixtures"
            icon="📅"
          />
        )}
      </section>

      {/* SECTION 3: Recent Results */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              Recent Results
              <span className="text-xs font-mono font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {filteredRecent.length}
              </span>
            </h2>
          </div>
        </div>

        {filteredRecent.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecent.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        ) : (
          <EmptySectionState
            message="No matches right now in recent results"
            icon="🏁"
          />
        )}
      </section>

      {/* Footer Outbound Guide Notice */}
      <div className="neu-flat p-4 rounded-xl border border-slate-800/60 bg-slate-900/30 text-center text-xs text-slate-400">
        <p>
          GlobalPulse Sports provides live scores and official broadcast directories.
          We do not host or embed third-party video streams. Click &quot;Where to watch&quot; on any match card to open the verified official broadcaster or tournament portal.
        </p>
      </div>
    </div>
  );
}
