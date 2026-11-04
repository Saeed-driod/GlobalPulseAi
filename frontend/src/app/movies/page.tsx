"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import {
  Search,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  Share2,
  CheckCircle2,
  Video,
  Play,
  Eye,
  Zap,
} from "../../components/Icons";
import { MovieItem } from "../api/movies/route";

const MOODS = [
  { id: "scifi", label: "Mind-Bending Sci-Fi", icon: "🚀", search: "Dune" },
  { id: "action", label: "High-Octane Action", icon: "💥", search: "Deadpool" },
  { id: "thriller", label: "Crime & Mind Thriller", icon: "🕵️‍♂️", search: "Oppenheimer" },
  { id: "kdrama", label: "K-Drama & Korean Epics", icon: "🇰🇷", search: "Squid Game" },
  { id: "bollywood", label: "Bollywood Mega Hits", icon: "🇮🇳", search: "Jawan" },
  { id: "free", label: "100% Free Full Movies", icon: "🍿", search: "Night of the Living Dead" },
];

export default function MoviesPage() {
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeMovie, setActiveMovie] = useState<MovieItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searching, setSearching] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Fetch initial catalog
  useEffect(() => {
    const loadCatalog = async () => {
      setLoading(true);
      try {
        const url = selectedCategory === "All" ? "/api/movies" : `/api/movies?category=${encodeURIComponent(selectedCategory)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data && data.movies) {
            setMovies(data.movies);
            if (!activeMovie && data.movies.length > 0) {
              setActiveMovie(data.movies[0]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load movie catalog:", err);
      } finally {
        setLoading(false);
      }
    };
    loadCatalog();
  }, [selectedCategory]);

  // Live search debounced
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/movies?action=search&q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.movies && data.movies.length > 0) {
            setMovies(data.movies);
            setActiveMovie(data.movies[0]);
          }
        }
      } catch (err) {
        console.error("Live search failed:", err);
      } finally {
        setSearching(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleShare = (movie: MovieItem) => {
    const text = `Check where to watch ${movie.title} (${movie.year}) worldwide on GlobalPulse Cinema Radar: https://globalpulseai.vercel.app/movies`;
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const categories = ["All", "Hollywood", "Bollywood", "K-Drama", "Anime", "Free Classic"];

  return (
    <div className="min-h-screen bg-[#e0e5ec] text-[#2d3748] flex flex-col font-sans selection:bg-[#1a8cff] selection:text-white">
      {/* 1. Header */}
      <Header />

      {/* 2. Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6">
        {/* Navigation Breadcrumb */}
        <div className="neu-flat p-3 sm:px-5 mb-6 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="neu-sm px-3 py-1 text-xs font-mono font-bold text-[#2d3748] hover:text-[#1a8cff] transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Newsroom
            </Link>
            <span className="text-[#b8bec7]">•</span>
            <span className="font-mono text-[#718096] hidden sm:inline">
              Global Cinema &amp; Streaming Radar
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px] uppercase font-bold text-emerald-700">
              1,000,000+ Titles Indexed
            </span>
          </div>
        </div>

        {/* Hero Banner & Live Search Engine */}
        <div className="neu-flat p-6 sm:p-8 rounded-3xl mb-8 relative overflow-hidden">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-2 font-mono text-xs uppercase font-bold text-[#1a8cff]">
              <Sparkles className="w-4 h-4 text-[#1a8cff]" />
              <span>Worldwide Entertainment Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-serif text-[#1a202c] tracking-tight leading-tight mb-3">
              Where to Watch Any Movie Worldwide
            </h1>
            <p className="text-xs sm:text-sm text-[#718096] leading-relaxed mb-6 font-sans">
              Instant streaming search across Netflix, Amazon Prime, Disney+, Max, Apple TV+, and 100% legal free movie platforms. Play official 4K trailers and explore global cinema.
            </p>

            {/* Live Search Input Bar */}
            <div className="relative group">
              <Search className="w-4 h-4 text-[#718096] group-focus-within:text-[#1a8cff] absolute left-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any movie, show or actor worldwide... (e.g. Interstellar, Jawan, Squid Game, Avatar)"
                className="w-full neu-input text-xs sm:text-sm pl-11 pr-24 py-3.5 rounded-2xl transition-all font-medium"
              />
              {searching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-[#1a8cff] animate-pulse">
                  Scanning IMDb...
                </div>
              )}
            </div>
          </div>

          {/* AI "What to Watch Tonight" Mood Genie */}
          <div className="mt-6 pt-5 border-t border-[#b8bec7]/40">
            <span className="text-[11px] font-mono uppercase font-bold text-[#718096] mb-3 block">
              What to Watch Tonight (AI Mood Genie):
            </span>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
              {MOODS.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => setSearchQuery(mood.search)}
                  className="neu-sm px-3 py-1.5 rounded-xl text-xs font-medium text-[#2d3748] hover:text-[#1a8cff] flex items-center gap-1.5 whitespace-nowrap active:scale-95 transition cursor-pointer"
                >
                  <span>{mood.icon}</span>
                  <span>{mood.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ACTIVE MOVIE THEATER & STREAMING CORRIDOR */}
        {activeMovie && (
          <section className="neu-flat p-6 sm:p-8 rounded-3xl mb-10 border border-white/60">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left: 16:9 HD Embedded YouTube Trailer */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="neu-sm px-2.5 py-0.5 text-[10px] font-mono font-bold text-red-600 uppercase flex items-center gap-1">
                      <Play className="w-3 h-3 text-red-600 fill-red-600" /> OFFICIAL 4K TRAILER
                    </span>
                    <span className="text-xs text-[#718096] font-mono">
                      Release: <strong>{activeMovie.year}</strong>
                    </span>
                  </div>

                  <button
                    onClick={() => handleShare(activeMovie)}
                    className="neu-sm px-3 py-1 text-xs font-mono font-bold text-[#2d3748] hover:text-[#1a8cff] flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{copied ? "✓ Link Copied!" : "Share Movie"}</span>
                  </button>
                </div>

                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl relative">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(
                      activeMovie.title + " official trailer"
                    )}&autoplay=0&rel=0`}
                    title={`${activeMovie.title} Official Trailer`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>

              {/* Right: Movie Metadata & "Where to Stream" Action Corridors */}
              <div className="lg:col-span-5 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="neu-sm px-2.5 py-0.5 text-[10px] font-mono font-bold text-[#1a8cff] uppercase">
                      {activeMovie.category}
                    </span>
                    {activeMovie.rating && (
                      <span className="neu-sm px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-600 uppercase">
                        ⭐ {activeMovie.rating}
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-[#1a202c] leading-tight mb-2">
                    {activeMovie.title}
                  </h2>

                  <p className="text-xs text-[#718096] font-mono mb-3">
                    <strong>Starring:</strong> {activeMovie.stars}
                  </p>

                  {activeMovie.description && (
                    <p className="text-xs sm:text-sm text-[#4a5568] leading-relaxed mb-6 font-sans">
                      {activeMovie.description}
                    </p>
                  )}
                </div>

                {/* Where to Stream Action Matrix */}
                <div className="mt-4 pt-4 border-t border-[#b8bec7]/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase font-black text-[#1a202c] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      WHERE TO STREAM WORLDWIDE:
                    </span>
                    <span className="text-[10px] font-mono text-[#718096]">Verified Corridors</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {activeMovie.watchLinks.netflix && (
                      <a
                        href={activeMovie.watchLinks.netflix}
                        target="_blank"
                        rel="noreferrer"
                        className="neu-sm p-2.5 rounded-xl flex items-center justify-between font-bold text-red-600 hover:text-red-700 transition"
                      >
                        <span>Netflix</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {activeMovie.watchLinks.prime && (
                      <a
                        href={activeMovie.watchLinks.prime}
                        target="_blank"
                        rel="noreferrer"
                        className="neu-sm p-2.5 rounded-xl flex items-center justify-between font-bold text-sky-600 hover:text-sky-700 transition"
                      >
                        <span>Prime Video</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {activeMovie.watchLinks.disney && (
                      <a
                        href={activeMovie.watchLinks.disney}
                        target="_blank"
                        rel="noreferrer"
                        className="neu-sm p-2.5 rounded-xl flex items-center justify-between font-bold text-indigo-600 hover:text-indigo-700 transition"
                      >
                        <span>Disney+</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {activeMovie.watchLinks.max && (
                      <a
                        href={activeMovie.watchLinks.max}
                        target="_blank"
                        rel="noreferrer"
                        className="neu-sm p-2.5 rounded-xl flex items-center justify-between font-bold text-purple-600 hover:text-purple-700 transition"
                      >
                        <span>Max (HBO)</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {activeMovie.watchLinks.apple && (
                      <a
                        href={activeMovie.watchLinks.apple}
                        target="_blank"
                        rel="noreferrer"
                        className="neu-sm p-2.5 rounded-xl flex items-center justify-between font-bold text-slate-700 hover:text-slate-900 transition"
                      >
                        <span>Apple TV</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {activeMovie.watchLinks.tubiFree && (
                      <a
                        href={activeMovie.watchLinks.tubiFree}
                        target="_blank"
                        rel="noreferrer"
                        className="neu-sm p-2.5 rounded-xl flex items-center justify-between font-bold text-amber-600 hover:text-amber-700 transition"
                      >
                        <span>🍿 Tubi (Watch Free)</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {activeMovie.watchLinks.youtubeFree && (
                      <a
                        href={activeMovie.watchLinks.youtubeFree}
                        target="_blank"
                        rel="noreferrer"
                        className="neu-sm p-2.5 rounded-xl flex items-center justify-between font-bold text-red-600 hover:text-red-700 transition"
                      >
                        <span>🍿 YouTube Free Movie</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {/* JustWatch & Google Comprehensive Check */}
                  <div className="pt-2 flex items-center gap-2">
                    <a
                      href={activeMovie.watchLinks.justWatch}
                      target="_blank"
                      rel="noreferrer"
                      className="neu-btn-primary flex-1 py-2.5 text-center text-xs font-bold flex items-center justify-center gap-1.5 uppercase tracking-wider"
                    >
                      <span>Check All Global Options</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Category Pills Selector */}
        <div className="neu-flat p-3 mb-6 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-mono uppercase font-bold text-[#718096] px-2 shrink-0">
            Cinema Region:
          </span>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSearchQuery("");
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-mono whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "neu-pressed text-[#1a8cff] font-extrabold"
                    : "neu-sm text-[#718096] hover:text-[#2d3748]"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Movie Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5 mb-14">
          {movies.map((movie) => {
            const isCurrent = activeMovie?.id === movie.id;
            return (
              <div
                key={movie.id}
                onClick={() => {
                  setActiveMovie(movie);
                  if (typeof window !== "undefined") {
                    window.scrollTo({ top: 180, behavior: "smooth" });
                  }
                }}
                className={`group neu-flat p-2.5 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.03] cursor-pointer ${
                  isCurrent ? "ring-2 ring-[#1a8cff]" : ""
                }`}
              >
                <div>
                  <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-slate-900 mb-2.5">
                    <img
                      src={movie.image}
                      alt={movie.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <span className="neu-btn-primary w-full py-1.5 text-[10px] text-center font-bold flex items-center justify-center gap-1">
                        <Play className="w-3 h-3" /> Watch Trailer
                      </span>
                    </div>

                    <div className="absolute top-2 left-2">
                      <span className="neu-sm px-2 py-0.5 text-[9px] font-mono font-bold uppercase text-[#1a8cff] bg-white/80 backdrop-blur">
                        {movie.year}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-[#1a202c] font-serif leading-snug line-clamp-2 group-hover:text-[#1a8cff] transition-colors">
                    {movie.title}
                  </h3>
                  <p className="text-[10px] text-[#718096] truncate mt-0.5 font-sans">
                    {movie.stars}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#b8bec7]/40 flex items-center justify-between text-[10px] font-mono text-[#718096]">
                  <span>{movie.category}</span>
                  <span className="text-[#1a8cff] font-bold">Stream ▸</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* 3. Footer */}
      <Footer />
    </div>
  );
}
