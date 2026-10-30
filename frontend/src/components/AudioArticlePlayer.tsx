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

    // Split text into digestible sentences
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
    window.speechSynthesis.onvoiceschanged = pickVoice;

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [title, content]);

  const speakChunk = (index: number) => {
    if (!utteranceQueueRef.current || index >= utteranceQueueRef.current.length) {
      setIsPlaying(false);
      setIsPaused(false);
      isPlayingRef.current = false;
      setProgress(100);
      setCurrentChunkIndex(0);
      return;
    }

    const text = utteranceQueueRef.current[index];
    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = rate;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      if (!isPlayingRef.current) return;
      const nextIdx = index + 1;
      setCurrentChunkIndex(nextIdx);
      const pct = Math.round((nextIdx / utteranceQueueRef.current.length) * 100);
      setProgress(pct);
      speakChunk(nextIdx);
    };

    utterance.onerror = (e) => {
      console.warn("Audio synthesis note:", e);
      if (e.error === "interrupted" || e.error === "canceled") return;
      const nextIdx = index + 1;
      setCurrentChunkIndex(nextIdx);
      speakChunk(nextIdx);
    };

    activeUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePlay = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      isPlayingRef.current = true;
    } else {
      window.speechSynthesis.cancel();
      setIsPlaying(true);
      setIsPaused(false);
      isPlayingRef.current = true;
      speakChunk(currentChunkIndex);
    }
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
    isPlayingRef.current = false;
  };

  const handleStop = () => {
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
      window.speechSynthesis.cancel();
      speakChunk(currentChunkIndex);
    }
  };

  if (!supported) return null;

  return (
    <div className="my-6 p-5 sm:p-6 rounded-3xl neu-flat transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Side: Badge & Title */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl neu-sm text-[#1a8cff] shrink-0">
            {isPlaying ? (
              <span className="flex items-center gap-0.5 h-4">
                <span className="w-1 bg-[#1a8cff] rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-full" />
                <span className="w-1 bg-[#1a8cff] rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-2/3" />
                <span className="w-1 bg-[#1a8cff] rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-5/6" />
              </span>
            ) : (
              <svg className="w-5 h-5 ml-0.5 fill-current" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg neu-pressed text-[#1a8cff] text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-[#1a8cff]" />
                AI Audio Briefing
              </span>
              <span className="text-[11px] text-[#718096] font-mono">
                ~{estimatedDuration} min listen
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-[#2d3748] mt-1">
              {isPlaying
                ? "Playing intelligence briefing..."
                : isPaused
                ? "Briefing paused"
                : "Listen to this story (Audio synthesized for Tier-1 readers)"}
            </p>
          </div>
        </div>

        {/* Right Side: Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {isPlaying ? (
            <button
              onClick={handlePause}
              className="px-4 py-2.5 rounded-xl neu-sm text-amber-600 text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
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
              className="px-5 py-2.5 rounded-xl neu-btn-primary text-xs font-bold transition flex items-center gap-1.5"
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
              className="p-2.5 rounded-xl neu-sm text-[#718096] hover:text-[#2d3748] transition active:scale-95"
              title="Stop playback"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z" />
              </svg>
            </button>
          )}

          <button
            onClick={toggleSpeed}
            className="px-3 py-2 rounded-xl neu-sm text-xs font-mono font-bold text-[#2d3748] hover:text-[#1a8cff] transition active:scale-95"
            title="Adjust reading speed"
          >
            {rate}x
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 pt-3.5 border-t border-[#d1d9e6] flex items-center gap-3">
        <div className="flex-1 h-2 neu-progress-track">
          <div
            className="neu-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-[#718096] shrink-0 font-semibold">
          {progress}% completed
        </span>
      </div>
    </div>
  );
}
