"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { AdBanner } from "../../components/AdBanner";
import {
  Video,
  ArrowLeft,
  Sparkles,
  Share2,
  CheckCircle2,
  Eye,
  ExternalLink,
  Youtube,
  Zap,
} from "../../components/Icons";
import { Article } from "../../types/article";
import { fetchArticles } from "../../lib/api";

interface Channel {
  id: string;
  name: string;
  category: string;
  youtubeId: string;
  badge: string;
  description: string;
}

const CHANNELS: Channel[] = [
  {
    id: "sky-news",
    name: "Sky News International Live",
    category: "Global Breaking News",
    youtubeId: "WUTDiO_fXdE",
    badge: "24/7 GLOBAL WIRE",
    description: "Official 24/7 continuous international news stream delivering verified breaking telemetry across world politics and global capitals.",
  },
  {
    id: "abc-news",
    name: "ABC News Live (US)",
    category: "US & World Headlines",
    youtubeId: "wF8X-K_l5kY",
    badge: "US TIER-1 WIRE",
    description: "24/7 continuous live news coverage, breaking dispatches, and in-depth investigative reports from ABC News headquarters.",
  },
  {
    id: "al-jazeera",
    name: "Al Jazeera English Live Wire",
    category: "World Politics & Affairs",
    youtubeId: "gCNeDWCI0vo",
    badge: "GLOBAL BROADCAST",
    description: "Award-winning live international journalism and geopolitical analysis broadcast 24/7 from Doha, London, and Washington.",
  },
  {
    id: "dw-news",
    name: "DW News Live (Global)",
    category: "European & World Wire",
    youtubeId: "LuKwFajn37U",
    badge: "EUROPEAN WIRE",
    description: "Germany's international broadcaster delivering real-time geopolitical updates, European policy dispatches, and global analysis.",
  },
  {
    id: "nasa-live",
    name: "NASA Live: Earth & Deep Space",
    category: "Space & Science",
    youtubeId: "ROboUHfPUrU",
    badge: "ORBITAL CAM",
    description: "Real-time High-Definition telemetry and live video broadcasts from the International Space Station and NASA deep space tracking networks.",
  },
  {
    id: "official-studio",
    name: "GlobalPulse AI Studio Channel",
    category: "Official AI Broadcast",
    youtubeId: "WUTDiO_fXdE",
    badge: "OFFICIAL STREAM",
    description: "Automated neural AI broadcast studio syndicating synthesized 60-second video dispatches and daily executive intelligence summaries.",
  },
];

interface ChatMessage {
  id: string;
  author: string;
  location: string;
  text: string;
  time: string;
}

export default function LiveStreamPage() {
  const [channels, setChannels] = useState<Channel[]>(CHANNELS);
  const [selectedChannel, setSelectedChannel] = useState<Channel>(CHANNELS[0]);
  const [viewerCount, setViewerCount] = useState<number>(1842);
  const [reactions, setReactions] = useState<{ [key: string]: number }>({
    fire: 1420,
    rocket: 2180,
    clap: 890,
    mindblown: 1150,
  });
  const [userComment, setUserComment] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      author: "Marcus Vance",
      location: "New York, USA",
      text: "Tracking the tech rally from Manhattan. The AI telemetry ticker is super sharp.",
      time: "Just now",
    },
    {
      id: "2",
      author: "Elena Rostova",
      location: "London, UK",
      text: "Sky News reporting transatlantic policy updates live. Great streaming quality here.",
      time: "1m ago",
    },
    {
      id: "3",
      author: "Dr. Kenji Sato",
      location: "Tokyo, Japan",
      text: "The NASA orbital feed is incredible. Love the multi-channel toggle.",
      time: "3m ago",
    },
  ]);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  // Auto-heal live stream IDs dynamically via Next.js API
  useEffect(() => {
    const syncLiveStreams = async () => {
      try {
        const res = await fetch("/api/live-streams");
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.streams) {
          setChannels((prev) =>
            prev.map((ch) => {
              const liveId = data.streams[ch.id];
              return liveId ? { ...ch, youtubeId: liveId } : ch;
            })
          );
          setSelectedChannel((current) => {
            const updatedId = data.streams[current.id];
            return updatedId ? { ...current, youtubeId: updatedId } : current;
          });
        }
      } catch (err) {
        console.error("Live stream sync error:", err);
      }
    };
    syncLiveStreams();
  }, []);

  // Load custom live stream ID from localStorage if configured by Admin
  useEffect(() => {
    if (typeof window !== "undefined") {
      const customId = localStorage.getItem("gp_custom_live_id");
      if (customId) {
        setChannels((prev) =>
          prev.map((ch) =>
            ch.id === "official-studio" ? { ...ch, youtubeId: customId } : ch
          )
        );
      }
    }
  }, []);

  // Fetch recent video articles for sidebar
  useEffect(() => {
    const loadVideos = async () => {
      const res = await fetchArticles({ limit: 6 });
      if (res && res.items) {
        setRecentArticles(res.items);
      }
    };
    loadVideos();
  }, []);

  // Realistic dynamic viewer count oscillator
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount((prev) => prev + Math.floor(Math.random() * 9) - 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleReaction = (key: string) => {
    setReactions((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userComment.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      author: "Verified Visitor",
      location: "Global Pulse",
      text: userComment.trim(),
      time: "Just now",
    };
    setChatMessages((prev) => [newMsg, ...prev.slice(0, 15)]);
    setUserComment("");
  };

  const handleShare = () => {
    const shareText = `Watching live 24/7 global broadcast on GlobalPulse AI: https://globalpulseai.vercel.app/live`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Resolve active YouTube embed URL
  const embedUrl = `https://www.youtube-nocookie.com/embed/${selectedChannel.youtubeId}?autoplay=1&mute=0&rel=0`;

  return (
    <div className="min-h-screen bg-[#e0e5ec] text-[#2d3748] flex flex-col font-sans selection:bg-[#1a8cff] selection:text-white">
      {/* 1. Header */}
      <Header />

      {/* 2. Main Live Streaming Theater */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6">
        {/* Navigation Breadcrumb & Status Bar */}
        <div className="neu-flat p-3 sm:px-5 mb-5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="neu-sm px-3 py-1 text-xs font-mono font-bold text-[#2d3748] hover:text-[#1a8cff] transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Newsroom
            </Link>
            <span className="text-[#b8bec7]">•</span>
            <span className="font-mono text-[#718096] hidden sm:inline">
              GlobalPulse Broadcast Hub
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Indicator */}
            <div className="neu-sm px-3 py-1 flex items-center gap-2 font-mono text-[11px] font-black uppercase text-red-600">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
              <span>ON AIR</span>
            </div>

            {/* Live Viewers Count */}
            <div className="neu-sm px-3 py-1 flex items-center gap-1.5 font-mono text-xs font-bold text-[#2d3748]">
              <Eye className="w-3.5 h-3.5 text-[#1a8cff]" />
              <span>{viewerCount.toLocaleString()} watching live</span>
            </div>

            {/* Share Stream Button */}
            <button
              onClick={handleShare}
              className="neu-sm px-3 py-1 text-xs font-mono font-bold text-[#2d3748] hover:text-[#1a8cff] transition flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? "✓ Copied Link!" : "Share Stream"}</span>
            </button>
          </div>
        </div>

        {/* Channel Selector Pills Bar */}
        <div className="neu-flat p-3 mb-6 flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-mono uppercase font-bold text-[#718096] px-2 shrink-0 hidden md:inline">
            Select Live Feed:
          </span>
          {channels.map((ch) => {
            const isActive = selectedChannel.id === ch.id;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => setSelectedChannel(ch)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold font-mono whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "neu-pressed text-red-600 font-extrabold"
                    : "neu-sm text-[#718096] hover:text-[#2d3748]"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isActive ? "bg-red-600 animate-pulse" : "bg-[#b8bec7]"
                  }`}
                />
                <span>{ch.name}</span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded neu-pressed-sm text-[#718096]">
                  {ch.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* 2-Column Grid: Video Theater (Left) + Live Wire & Dispatches (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Theater Column (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-5">
            {/* 16:9 HD Embedded Player Container */}
            <div className="neu-flat p-2 sm:p-3 rounded-2xl overflow-hidden shadow-2xl relative">
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-inner">
                <iframe
                  src={embedUrl}
                  title={selectedChannel.name}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              {/* Broadcast Meta Strip */}
              <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#b8bec7]/40 mt-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="neu-sm px-2 py-0.5 text-[10px] font-mono font-bold text-red-600">
                      LIVE BROADCAST
                    </span>
                    <span className="text-xs text-[#718096] font-mono">
                      Category: <strong>{selectedChannel.category}</strong>
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold font-serif text-[#2d3748] mt-1">
                    {selectedChannel.name}
                  </h2>
                  <p className="text-xs text-[#718096] mt-0.5 leading-relaxed font-sans max-w-xl">
                    {selectedChannel.description}
                  </p>
                </div>

                {/* Official YouTube Channel CTA */}
                <a
                  href="https://www.youtube.com/@GloblePulseAi"
                  target="_blank"
                  rel="noreferrer"
                  className="neu-btn-primary px-4 py-2 text-xs uppercase tracking-wider flex items-center gap-2 shrink-0 cursor-pointer self-start sm:self-center"
                >
                  <Youtube className="w-4 h-4 text-white" />
                  <span>Subscribe @GloblePulseAi</span>
                </a>
              </div>
            </div>

            {/* Interactive Audience Reaction Bar */}
            <div className="neu-flat p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#718096]">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>Live Audience Reactions:</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { key: "fire", emoji: "🔥", label: "Breaking", count: reactions.fire },
                  { key: "rocket", emoji: "🚀", label: "High Yield", count: reactions.rocket },
                  { key: "mindblown", emoji: "🤯", label: "Monumental", count: reactions.mindblown },
                  { key: "clap", emoji: "👏", label: "Verified", count: reactions.clap },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleReaction(item.key)}
                    className="neu-sm px-3 py-1.5 flex items-center gap-1.5 text-xs font-mono font-bold text-[#2d3748] hover:text-[#1a8cff] active:scale-90 transition cursor-pointer"
                  >
                    <span>{item.emoji}</span>
                    <span className="text-[11px] text-[#718096] font-semibold">{item.label}</span>
                    <span className="text-[#1a8cff]">({item.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Monetag / Sponsor Banner Slot below stream */}
            <div className="neu-flat p-4">
              <AdBanner slot="header" />
            </div>
          </div>

          {/* Right Column: Live Community Wire & Recent Video Dispatches */}
          <div className="space-y-6">
            {/* Live Community Discussion Box */}
            <div className="neu-flat p-5 flex flex-col h-[480px]">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#b8bec7]/40 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="font-serif font-bold text-sm text-[#2d3748]">
                    Live Community Wire
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#718096]">
                  Real-time Global
                </span>
              </div>

              {/* Scrollable Message List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="neu-sm p-3 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#718096]">
                      <span className="font-bold text-[#2d3748]">{msg.author}</span>
                      <span>{msg.location}</span>
                    </div>
                    <p className="text-[#4a5568] leading-relaxed font-sans">{msg.text}</p>
                    <div className="text-[9px] text-[#a0aec0] font-mono text-right">{msg.time}</div>
                  </div>
                ))}
              </div>

              {/* Comment Input */}
              <form onSubmit={handlePostComment} className="pt-3 border-t border-[#b8bec7]/40 mt-3 flex gap-2">
                <input
                  type="text"
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  placeholder="Share your live dispatch..."
                  className="flex-1 neu-input px-3 py-2 text-xs placeholder:text-[#a0aec0] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!userComment.trim()}
                  className="neu-btn-primary px-3 py-2 text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                >
                  Send
                </button>
              </form>
            </div>

            {/* Recent Video Dispatches Reel */}
            <div className="neu-flat p-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#b8bec7]/40 mb-4">
                <h3 className="font-serif font-bold text-sm text-[#2d3748]">
                  Recent Video Reports
                </h3>
                <span className="text-[10px] font-mono text-[#1a8cff] font-bold">
                  On-Demand
                </span>
              </div>

              <div className="space-y-3">
                {recentArticles.slice(0, 4).map((art) => (
                  <Link
                    key={art.id}
                    href={`/news/${art.slug}`}
                    className="neu-sm p-2.5 rounded-xl flex items-center gap-3 group hover:border-[#1a8cff] transition block"
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 neu-pressed relative bg-neutral-900">
                      {art.image_url ? (
                        <img
                          src={art.image_url}
                          alt={art.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white">
                          <Video className="w-5 h-5 text-red-500" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <span className="w-5 h-5 rounded-full bg-red-600/90 flex items-center justify-center text-white text-[9px] shadow">
                          ▶
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-mono uppercase font-bold text-[#1a8cff]">
                        {art.category}
                      </span>
                      <h4 className="text-xs font-bold text-[#2d3748] truncate group-hover:text-[#1a8cff] transition">
                        {art.title}
                      </h4>
                      <span className="text-[10px] text-[#718096] font-mono">
                        {art.views} reads
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Footer */}
      <Footer />
    </div>
  );
}

