"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sparkles } from "./Icons";

interface AudioArticlePlayerProps {
  title: string;
  content: string;
  category?: string;
  author?: string | null;
}

export function AudioArticlePlayer({ title, content, category, author }: AudioArticlePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supported, setSupported] = useState(true);
  const [rate, setRate] = useState<number>(1.0);
  const [progress, setProgress] = useState<number>(0);
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0);
  const [totalChunks, setTotalChunks] = useState<number>(0);
  const [estimatedDuration, setEstimatedDuration] = useState<string>("2:30");
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  const utteranceQueueRef = useRef<string[]>([]);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isPlayingRef = useRef(false);

  // Clean raw markdown/HTML to plain spoken speech
  const cleanSpeechText = (rawTitle: string, rawContent: string): string[] => {
    const combined = `${rawTitle}. ${rawContent}`;
    const cleaned = combined
      .replace(/\|[^\n]+\|/g, " ") // Remove markdown tables
      .replace(/!\[.*?\]\(.*?\)/g, " ") // Remove images
      .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Keep link text, strip URL
      .replace(/#{1,6}\s+/g, ". ") // Headings to sentence breaks
      .replace(/[*_~`>]/g, " ") // Markdown symbols
      .replace(/https?:\/\/\S+/g, " ") // Raw URLs
      .replace(/\s+/g, " ") // Collapse whitespace
      .trim();

    // Split text into digestible sentences (speechSynthesis has 15-second cutoff bug if text is too long)
    const sentences = cleaned.match(/[^.!?]+[.!?]+(\s|$)/g) || [cleaned];
    return sentences.map((s) => s.trim()).filter((s) => s.length > 2);
  };

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }

    const chunks = cleanSpeechText(title, content);
    utteranceQueueRef.current = chunks;
    setTotalChunks(chunks.length);

    // Estimate duration based on avg 140 words per minute
    const totalWords = chunks.reduce((acc, c) => acc + c.split(" ").length, 0);
    const totalSeconds = Math.max(30, Math.round((totalWords / 140) * 60));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    setEstimatedDuration(`${mins}:${secs < 10 ? "0" : ""}${secs}`);

    // Load voices
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      // Prefer high-quality US or UK English voices
      const preferred =
        voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            (v.name.includes("Natural") ||
              v.name.includes("Google") ||
              v.name.includes("Samantha") ||
              v.name.includes("Guy") ||
              v.name.includes("Aria"))
        ) ||
        voices.find((v) => v.lang === "en-US") ||
        voices.find((v) => v.lang.startsWith("en"));

      if (preferred) setSelectedVoice(preferred);
    };

    pickVoice();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = pickVoice;
    }

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [title, content]);

  const speakChunk = (index: number) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const chunks = utteranceQueueRef.current;

    if (index >= chunks.length || !isPlayingRef.current) {
      setIsPlaying(false);
      setIsPaused(false);
      isPlayingRef.current = false;
      setProgress(100);
      setCurrentChunkIndex(0);
      return;
    }

    setCurrentChunkIndex(index);
    const pct = Math.round(((index + 1) / chunks.length) * 100);
    setProgress(pct);

    const chunkText = chunks[index];
    const utterance = new SpeechSynthesisUtterance(chunkText);
    utterance.rate = rate;
    utterance.pitch = 1.0;
    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.onend = () => {
      if (isPlayingRef.current) {
        speakChunk(index + 1);
      }
    };

    utterance.onerror = (e) => {
      console.warn("[SpeechSynthesis Error]", e);
      if (isPlayingRef.current) {
        speakChunk(index + 1);
      }
    };

    activeUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePlay = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      isPlayingRef.current = true;
      return;
    }

    window.speechSynthesis.cancel();
    setIsPlaying(true);
    setIsPaused(false);
    isPlayingRef.current = true;
    speakChunk(currentChunkIndex);
  };

  const handlePause = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
    isPlayingRef.current = false;
  };

  const handleStop = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    isPlayingRef.current = false;
    setCurrentChunkIndex(0);
    setProgress(0);
  };

  const toggleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(rate) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setRate(newSpeed);

    if (isPlaying && activeUtteranceRef.current) {
      // Re-trigger current chunk with new speed
      window.speechSynthesis.cancel();
      speakChunk(currentChunkIndex);
    }
  };

  if (!supported) return null;

  return (
    <div className="my-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-cyan-950/40 border border-cyan-500/30 shadow-xl shadow-cyan-950/20 backdrop-blur-md transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Side: Badge & Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 shrink-0">
            {isPlaying ? (
              <span className="flex items-center gap-0.5 h-4">
                <span className="w-1 bg-white rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-full" />
                <span className="w-1 bg-white rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-2/3" />
                <span className="w-1 bg-white rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-5/6" />
              </span>
            ) : (
              <svg className="w-5 h-5 ml-0.5 fill-current" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 text-[10px] font-mono font-bold uppercase tracking-wider border border-cyan-400/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                AI Audio Briefing
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">
                ~{estimatedDuration} min listen
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-white mt-1">
              {isPlaying
                ? "Playing intelligence briefing..."
                : isPaused
                ? "Briefing paused"
                : "Listen to this story (Audio synthesized for Tier-1 readers)"}
            </p>
          </div>
        </div>

        {/* Right Side: Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {isPlaying ? (
            <button
              onClick={handlePause}
              className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="Pause audio briefing"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
              Pause
            </button>
          ) : (
            <button
              onClick={handlePlay}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-cyan-500/25"
              title="Play audio briefing"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              {isPaused ? "Resume" : "Play Story"}
            </button>
          )}

          {(isPlaying || isPaused) && (
            <button
              onClick={handleStop}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition"
              title="Stop playback"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z" />
              </svg>
            </button>
          )}

          <button
            onClick={toggleSpeed}
            className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold text-neutral-300 transition"
            title="Adjust reading speed"
          >
            {rate}x
          </button>
        </div>
      </div>

      {/* Progress Bar & Equalizer Animation when playing */}
      <div className="mt-3.5 pt-3 border-t border-white/[0.06] flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-neutral-400 shrink-0">
          {progress}% completed
        </span>
      </div>
    </div>
  );
}
