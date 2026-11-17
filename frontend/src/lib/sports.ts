export type SportCategory = "Cricket" | "Football" | "Hockey" | "Tennis" | "Basketball" | "Other";

export type MatchStatus = "live" | "upcoming" | "finished";

export interface NormalizedMatch {
  id: string;
  sport: SportCategory;
  league: string;
  homeTeam: string;
  awayTeam: string;
  status: MatchStatus;
  statusText: string;
  scoreText?: string;
  startTime: string;
  venue?: string;
  officialWatchUrl?: string;
  broadcasterName?: string;
}

export interface SportsData {
  liveMatches: NormalizedMatch[];
  upcomingMatches: NormalizedMatch[];
  recentMatches: NormalizedMatch[];
  updatedAt: string;
}

interface TheSportsDbEvent {
  idEvent: string;
  strEvent: string;
  strLeague: string;
  strSport: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strStatus: string | null;
  dateEvent: string | null;
  strTime: string | null;
  strTimestamp: string | null;
  strVenue: string | null;
}

interface CricketDataMatch {
  id: string;
  name?: string;
  matchType?: string;
  status?: string;
  venue?: string;
  date?: string;
  dateTimeGMT?: string;
  teams?: string[];
  teamInfo?: { name?: string; shortname?: string }[];
  score?: { r: number; w: number; o: number; inning?: string }[];
  matchStarted?: boolean;
  matchEnded?: boolean;
}

const LEAGUES_CONFIG = [
  { sport: "Football" as SportCategory, id: "4328", name: "Premier League", watchUrl: "https://www.premierleague.com/broadcast-schedules", broadcaster: "Premier League / Official" },
  { sport: "Football" as SportCategory, id: "4480", name: "UEFA Champions League", watchUrl: "https://www.uefa.com/uefachampionsleague/where-to-watch/", broadcaster: "UEFA / Official" },
  { sport: "Football" as SportCategory, id: "4335", name: "La Liga", watchUrl: "https://www.laliga.com/en-GB/where-to-watch-laliga-easports", broadcaster: "La Liga Official" },
  { sport: "Basketball" as SportCategory, id: "4387", name: "NBA", watchUrl: "https://www.nba.com/watch", broadcaster: "NBA League Pass / Official" },
  { sport: "Hockey" as SportCategory, id: "4380", name: "NHL", watchUrl: "https://www.nhl.com/watch", broadcaster: "NHL Official / ESPN+" },
  { sport: "Tennis" as SportCategory, id: "4464", name: "ATP Tennis", watchUrl: "https://www.atptour.com/en/scores/current", broadcaster: "ATP Tour Official" },
];

/**
 * Fetch matches from TheSportsDB (Football, Basketball, Hockey, Tennis).
 * Caches server-side with Next.js fetch revalidation (120s) and timeout protection.
 */
async function fetchTheSportsDb(): Promise<NormalizedMatch[]> {
  const apiKey = (process.env.SPORTS_API_KEY || "123").trim();
  const matches: NormalizedMatch[] = [];

  const promises = LEAGUES_CONFIG.flatMap((lg) => {
    const nextUrl = `https://www.thesportsdb.com/api/v1/json/${apiKey}/eventsnextleague.php?id=${lg.id}`;
    const pastUrl = `https://www.thesportsdb.com/api/v1/json/${apiKey}/eventspastleague.php?id=${lg.id}`;

    return [
      fetch(nextUrl, {
        next: { revalidate: 120 },
        signal: AbortSignal.timeout(6000),
      })
        .then(async (res) => {
          if (!res.ok) return [];
          const data = await res.json().catch(() => ({}));
          return (data?.events || []) as TheSportsDbEvent[];
        })
        .catch(() => [] as TheSportsDbEvent[]),

      fetch(pastUrl, {
        next: { revalidate: 120 },
        signal: AbortSignal.timeout(6000),
      })
        .then(async (res) => {
          if (!res.ok) return [];
          const data = await res.json().catch(() => ({}));
          return (data?.events || []) as TheSportsDbEvent[];
        })
        .catch(() => [] as TheSportsDbEvent[]),
    ];
  });

  try {
    const results = await Promise.all(promises);
    for (let i = 0; i < results.length; i++) {
      const leagueIndex = Math.floor(i / 2);
      const lgConfig = LEAGUES_CONFIG[leagueIndex];
      const events = results[i];

      for (const ev of events) {
        if (!ev || !ev.idEvent || !ev.strHomeTeam || !ev.strAwayTeam) continue;

        const hasScore = ev.intHomeScore !== null && ev.intAwayScore !== null && ev.intHomeScore !== "" && ev.intAwayScore !== "";
        const rawStatus = (ev.strStatus || "").trim().toUpperCase();

        let status: MatchStatus = "upcoming";
        if (hasScore || ["FT", "AET", "FINISHED", "FINAL", "POSTPONED", "CANCELLED"].includes(rawStatus)) {
          status = "finished";
        } else if (["1H", "2H", "HT", "LIVE", "IN PROGRESS", "Q1", "Q2", "Q3", "Q4", "OT"].includes(rawStatus)) {
          status = "live";
        }

        const scoreText = hasScore ? `${ev.intHomeScore} - ${ev.intAwayScore}` : undefined;
        let statusText = ev.strStatus || (status === "finished" ? "Full Time" : "Scheduled");
        if (rawStatus === "FT") statusText = "Full Time";

        const startTime = ev.strTimestamp || (ev.dateEvent ? `${ev.dateEvent}T${ev.strTime || "12:00:00"}` : new Date().toISOString());

        matches.push({
          id: `tsdb-${ev.idEvent}`,
          sport: lgConfig.sport,
          league: ev.strLeague || lgConfig.name,
          homeTeam: ev.strHomeTeam,
          awayTeam: ev.strAwayTeam,
          status,
          statusText,
          scoreText,
          startTime,
          venue: ev.strVenue || undefined,
          officialWatchUrl: lgConfig.watchUrl,
          broadcasterName: lgConfig.broadcaster,
        });
      }
    }
  } catch (err) {
    console.warn("[Sports Data] TheSportsDB fetch error:", err);
  }

  return matches;
}

/**
 * Fetch matches from CricketData (api.cricapi.com).
 * Uses process.env.CRICKET_API_KEY.
 * Free tier: 100 hits/day, so server-side caching (120s) keeps consumption negligible.
 */
async function fetchCricketData(): Promise<NormalizedMatch[]> {
  const apiKey = (process.env.CRICKET_API_KEY || "").trim();
  if (!apiKey) {
    return [];
  }

  try {
    const url = `https://api.cricapi.com/v1/currentMatches?apikey=${apiKey}&offset=0`;
    const res = await fetch(url, {
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      console.warn(`[Sports Data] CricketData API status ${res.status}`);
      return [];
    }

    const json = await res.json().catch(() => ({}));
    if (json.status !== "success" || !Array.isArray(json.data)) {
      return [];
    }

    const matches: NormalizedMatch[] = [];
    const items = json.data as CricketDataMatch[];

    for (let i = 0; i < items.length; i++) {
      const m = items[i];
      if (!m || !m.id) continue;

      const home = m.teams?.[0] || m.teamInfo?.[0]?.name || "Team A";
      const away = m.teams?.[1] || m.teamInfo?.[1]?.name || "Team B";

      let status: MatchStatus = "upcoming";
      if (m.matchStarted && !m.matchEnded) {
        status = "live";
      } else if (m.matchEnded) {
        status = "finished";
      }

      let scoreText: string | undefined;
      if (Array.isArray(m.score) && m.score.length > 0) {
        scoreText = m.score
          .map((s) => `${s.inning ? s.inning.replace(/Inning \d+/i, "").trim() : ""}: ${s.r}/${s.w} (${s.o} ov)`.trim())
          .filter(Boolean)
          .join(" vs ");
      }

      const matchTypeUpper = (m.matchType || "").toUpperCase();
      const leagueLabel = matchTypeUpper ? `${matchTypeUpper} International` : "Cricket Series";

      matches.push({
        id: `cric-${m.id}`,
        sport: "Cricket",
        league: leagueLabel,
        homeTeam: home,
        awayTeam: away,
        status,
        statusText: m.status || (m.matchEnded ? "Match Finished" : m.matchStarted ? "In Progress" : "Scheduled"),
        scoreText,
        startTime: m.dateTimeGMT || m.date || new Date().toISOString(),
        venue: m.venue || undefined,
        officialWatchUrl: "https://www.icc-cricket.com/matches",
        broadcasterName: "ICC Official / Star / Sky",
      });
    }

    return matches;
  } catch (err) {
    console.warn("[Sports Data] CricketData fetch error:", err);
    return [];
  }
}

/**
 * Main server-side aggregator for all sports data.
 * Merges CricketData + TheSportsDB, deduplicates, and splits into Live, Upcoming, and Recent.
 */
export async function getSportsData(): Promise<SportsData> {
  const [theSportsDbMatches, cricketMatches] = await Promise.all([
    fetchTheSportsDb().catch(() => [] as NormalizedMatch[]),
    fetchCricketData().catch(() => [] as NormalizedMatch[]),
  ]);

  const allMatches = [...cricketMatches, ...theSportsDbMatches];

  // Deduplicate by ID
  const seen = new Set<string>();
  const uniqueMatches: NormalizedMatch[] = [];
  for (const m of allMatches) {
    if (!seen.has(m.id)) {
      seen.add(m.id);
      uniqueMatches.push(m);
    }
  }

  const liveMatches = uniqueMatches.filter((m) => m.status === "live");
  const upcomingMatches = uniqueMatches.filter((m) => m.status === "upcoming");
  const recentMatches = uniqueMatches.filter((m) => m.status === "finished");

  return {
    liveMatches,
    upcomingMatches,
    recentMatches,
    updatedAt: new Date().toISOString(),
  };
}
