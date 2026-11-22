"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Video, Play, Pause, Download, X, Shield } from "./Icons";

export interface VideoStudioProps {
  isOpen: boolean;
  onClose: () => void;
  initialArticle?: {
    id?: number;
    title: string;
    summary: string;
    content?: string;
    category?: string;
    image_url?: string | null;
  };
}

export interface ViralScript {
  hook: string;
  coreFacts: string[];
  takeaway: string;
  cta: string;
  fullScript: string;
  wordCount: number;
  estimatedSeconds: number;
}

/**
 * Generates a high-retention 30-35 second news script (75-95 words)
 * following a viral 4-part structure with zero repetition.
 */
export function generateViral35sScript(
  title: string,
  summary: string,
  content?: string,
  category: string = "Global News"
): ViralScript {
  const cleanTitle = (title || "")
    .replace(/#\w+/g, "")
    .replace(/^BREAKING:\s*/i, "")
    .replace(/^EXCLUSIVE:\s*/i, "")
    .trim();

  // 1. Hook (0-3s)
  let hook = cleanTitle;
  if (!hook.endsWith(".") && !hook.endsWith("?") && !hook.endsWith("!")) {
    hook += ".";
  }

  // 2. Extract facts from summary / content (3 short conversational sentences)
  const rawBullets = (summary || "")
    .split("\n")
    .map((s) => s.replace(/^[•▸*#\-]\s*/, "").trim())
    .filter(
      (s) =>
        s.length > 20 &&
        !s.toLowerCase().includes("operational findings") &&
        !s.toLowerCase().includes("breaking intelligence dispatch")
    );

  let coreFacts: string[] = [];

  if (rawBullets.length >= 2) {
    coreFacts = rawBullets.slice(0, 3).map((f) => (f.endsWith(".") ? f : f + "."));
  } else {
    const sentences = (summary || "")
      .replace(/([.?!])\s+/g, "$1|")
      .split("|")
      .map((s) => s.trim())
      .filter((s) => s.length > 25 && !s.toLowerCase().includes("here are the primary"));

    if (sentences.length >= 2) {
      coreFacts = sentences.slice(0, 3);
    } else if (content) {
      const contentParas = content
        .split("\n\n")
        .map((p) => p.replace(/[#*`>|]/g, "").trim())
        .filter((p) => p.length > 40 && !p.startsWith("###"));
      if (contentParas.length > 0) {
        const pSentences = contentParas[0]
          .replace(/([.?!])\s+/g, "$1|")
          .split("|")
          .map((s) => s.trim())
          .filter((s) => s.length > 20);
        coreFacts = pSentences.slice(0, 3);
      }
    }
  }

  if (coreFacts.length === 0) {
    coreFacts = [
      `Key developments are rapidly shifting across ${category} as verified field data confirms significant market momentum.`,
      `Industry leaders and strategic analysts point out that this changes current operational benchmarks worldwide.`,
      `The immediate response from global markets highlights how high the stakes are for all participants.`,
    ];
  }

  // 3. Takeaway / Impact (25-30s)
  let takeaway = `Expect widespread structural adjustments as institutions and investors adapt to this momentum.`;
  if (category.toLowerCase().includes("tech") || category.toLowerCase().includes("ai")) {
    takeaway = `This milestone marks a decisive shift in how next-generation AI capabilities are deployed at scale.`;
  } else if (category.toLowerCase().includes("market") || category.toLowerCase().includes("econom")) {
    takeaway = `Analysts predict these signals will redefine sector valuations over the coming quarter.`;
  } else if (category.toLowerCase().includes("sport")) {
    takeaway = `Championship odds and upcoming tournament seeding are now dramatically altered by this result.`;
  }

  // 4. Fast CTA (30-35s)
  const cta = `Read more on TheGlobalPulseAI.com and follow @GlobalPulseAI for daily alerts.`;

  const scriptParts = [hook, ...coreFacts.slice(0, 3), takeaway, cta];
  const fullScript = scriptParts.join(" ").replace(/\s+/g, " ").trim();
  const words = fullScript.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const estimatedSeconds = Math.round((wordCount / 145) * 60);

  return {
    hook,
    coreFacts,
    takeaway,
    cta,
    fullScript,
    wordCount,
    estimatedSeconds,
  };
}

export function VideoStudio({ isOpen, onClose, initialArticle }: VideoStudioProps) {
  // State: Aspect Ratio
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9">("9:16");

  // State: Script Data
  const [title, setTitle] = useState(
    initialArticle?.title || "OpenAI Unveils Autonomous AI Agents Capable of Real-Time Enterprise Operations"
  );
  const [summary, setSummary] = useState(
    initialArticle?.summary ||
      "New autonomous agent models achieve 94% accuracy in multi-step enterprise workflows.\nMajor tech enterprises are beginning private pilot deployments this week.\nAnalysts predict rapid acceleration of AI-native business processes across 2026."
  );
  const [category, setCategory] = useState(initialArticle?.category || "AI & Tech");
  const [articleImage, setArticleImage] = useState(
    initialArticle?.image_url || "/assets/anchors/newsroom_studio_bg.jpg"
  );

  const [scriptData, setScriptData] = useState<ViralScript>(() =>
    generateViral35sScript(title, summary, initialArticle?.content, category)
  );

  // Playback & Voiceover states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(35);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [activeWordIndex, setActiveWordIndex] = useState<number>(0);
  const [currentCaptionWords, setCurrentCaptionWords] = useState<string[]>([]);
  const [activeWordInCaption, setActiveWordInCaption] = useState<number>(0);

  // Canvas & Audio refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const studioBgImgRef = useRef<HTMLImageElement | null>(null);
  const brollImgRef = useRef<HTMLImageElement | null>(null);

  // Speech & Web Audio refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bgmGainRef = useRef<GainNode | null>(null);
  const destNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isPlayingRef = useRef(false);
  const wordTimestampsRef = useRef<{ word: string; start: number; end: number }[]>([]);

  // Regenerate script when inputs change
  useEffect(() => {
    const s = generateViral35sScript(title, summary, initialArticle?.content, category);
    setScriptData(s);
    setDuration(Math.max(30, s.estimatedSeconds));

    const words = s.fullScript.split(/\s+/).filter(Boolean);
    const estSec = Math.max(30, s.estimatedSeconds);
    const secPerWord = estSec / (words.length || 1);
    wordTimestampsRef.current = words.map((w, i) => ({
      word: w,
      start: i * secPerWord,
      end: (i + 1) * secPerWord,
    }));
  }, [title, summary, category, initialArticle?.content]);

  // Preload Images
  useEffect(() => {
    const bg = new Image();
    bg.crossOrigin = "anonymous";
    bg.src = "/assets/anchors/newsroom_studio_bg.jpg";
    bg.onload = () => {
      studioBgImgRef.current = bg;
    };

    const broll = new Image();
    broll.crossOrigin = "anonymous";
    broll.src = articleImage || "/assets/anchors/newsroom_studio_bg.jpg";
    broll.onload = () => {
      brollImgRef.current = broll;
    };
  }, [articleImage]);

  // Web Audio News Ambient Sound Bed (ducked low under voiceover, 0.12 volume)
  const initWebAudioBGM = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      destNodeRef.current = ctx.createMediaStreamDestination();

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.12, ctx.currentTime);
      bgmGainRef.current = masterGain;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(110, ctx.currentTime);
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(220, ctx.currentTime);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(masterGain);

      masterGain.connect(ctx.destination);
      if (destNodeRef.current) {
        masterGain.connect(destNodeRef.current);
      }

      osc1.start();
      osc2.start();

      return () => {
        try {
          osc1.stop();
          osc2.stop();
          osc1.disconnect();
          osc2.disconnect();
        } catch {
          // ignore
        }
      };
    } catch (e) {
      console.warn("Web Audio BGM note:", e);
    }
  }, []);

  // Canvas Render Loop
  const renderCanvasFrame = useCallback(
    (timeSec: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const isVertical = aspectRatio === "9:16";
      const w = isVertical ? 1080 : 1920;
      const h = isVertical ? 1920 : 1080;

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      const sceneCycleTime = timeSec % 4.0;
      const kenBurnsScale = 1.0 + (sceneCycleTime / 4.0) * 0.08;

      // -------------------------------------------------------------
      // LAYOUT 1: 16:9 Widescreen Broadcast Newsroom Studio
      // -------------------------------------------------------------
      if (!isVertical) {
        // 1. Studio Background
        if (studioBgImgRef.current && studioBgImgRef.current.complete) {
          ctx.drawImage(studioBgImgRef.current, 0, 0, w, h);
        } else {
          const bgGrad = ctx.createLinearGradient(0, 0, w, h);
          bgGrad.addColorStop(0, "#080e1a");
          bgGrad.addColorStop(0.5, "#0b1528");
          bgGrad.addColorStop(1, "#04070d");
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, w, h);
        }

        // Dark ambient vignette
        const grad = ctx.createLinearGradient(0, h * 0.45, 0, h);
        grad.addColorStop(0, "rgba(2, 6, 23, 0)");
        grad.addColorStop(1, "rgba(2, 6, 23, 0.95)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // 2. Cinematic Center B-Roll Visual Screen
        const screenX = 320;
        const screenY = 90;
        const screenW = 1280;
        const screenH = 680;

        ctx.save();
        ctx.shadowColor = "rgba(6, 182, 212, 0.45)";
        ctx.shadowBlur = 30;
        ctx.strokeStyle = "rgba(6, 182, 212, 0.85)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(screenX, screenY, screenW, screenH, 18);
        ctx.stroke();
        ctx.clip();

        if (brollImgRef.current && brollImgRef.current.complete) {
          ctx.save();
          ctx.translate(screenX + screenW / 2, screenY + screenH / 2);
          ctx.scale(kenBurnsScale, kenBurnsScale);
          ctx.drawImage(brollImgRef.current, -screenW / 2, -screenH / 2, screenW, screenH);
          ctx.restore();
        } else {
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(screenX, screenY, screenW, screenH);
        }

        // Screen Top Badge
        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.fillRect(screenX, screenY, screenW, 50);
        ctx.fillStyle = "#facc15";
        ctx.font = "bold 18px 'Inter', sans-serif";
        ctx.fillText(`● LIVE FIELD REPORT • ${category.toUpperCase()}`, screenX + 24, screenY + 32);
        ctx.restore();

        // 3. Studio Lower-Third Breaking News Ticker
        const tickerY = h - 90;
        ctx.fillStyle = "rgba(10, 15, 28, 0.96)";
        ctx.fillRect(0, tickerY, w, 90);
        ctx.strokeStyle = "rgba(239, 68, 68, 0.8)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, tickerY);
        ctx.lineTo(w, tickerY);
        ctx.stroke();

        ctx.fillStyle = "#dc2626";
        ctx.fillRect(0, tickerY, 260, 90);
        ctx.fillStyle = "#ffffff";
        ctx.font = "900 22px 'Inter', sans-serif";
        ctx.fillText("● BREAKING NEWS", 28, tickerY + 52);

        ctx.fillStyle = "#e2e8f0";
        ctx.font = "bold 22px 'Inter', sans-serif";
        const tickerHeadline = `${title.toUpperCase()} • GLOBALPULSE AI • theglobalpulseai.com`;
        ctx.fillText(tickerHeadline, 290, tickerY + 52);

        // 4. Hormozi Captions
        drawHormoziCaptions(ctx, w / 2, 720, 1400);
      }

      // -------------------------------------------------------------
      // LAYOUT 2: 9:16 Vertical News Shorts / Reels (1080x1920)
      // -------------------------------------------------------------
      else {
        // 1. Full-Bleed Top B-Roll Background
        ctx.save();
        ctx.translate(w / 2, h * 0.45);
        ctx.scale(kenBurnsScale, kenBurnsScale);
        if (brollImgRef.current && brollImgRef.current.complete) {
          ctx.drawImage(brollImgRef.current, -w / 2, -h * 0.45, w, h * 0.9);
        } else {
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(-w / 2, -h * 0.45, w, h * 0.9);
        }
        ctx.restore();

        const vGrad = ctx.createLinearGradient(0, h * 0.35, 0, h);
        vGrad.addColorStop(0, "rgba(8, 12, 22, 0.1)");
        vGrad.addColorStop(0.55, "rgba(8, 12, 22, 0.85)");
        vGrad.addColorStop(1, "rgba(4, 7, 13, 0.98)");
        ctx.fillStyle = vGrad;
        ctx.fillRect(0, 0, w, h);

        // Top-Left Live Badge
        ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
        ctx.strokeStyle = "rgba(239, 68, 68, 0.8)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(50, 75, 300, 60, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(80, 105, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "900 20px 'Inter', sans-serif";
        ctx.fillText(`BREAKING • ${category.toUpperCase()}`, 105, 112);

        // Top-Right Verified Watermark
        ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
        ctx.strokeStyle = "rgba(51, 65, 85, 0.8)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(w - 380, 75, 330, 60, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 20px 'Inter', sans-serif";
        ctx.fillText("@GlobalPulseAI", w - 340, 112);

        // 2. Bold Hormozi Captions in Middle Lower-Third (Y=1240)
        drawHormoziCaptions(ctx, w / 2, 1240, 960, true);

        // 3. Bottom Branding Bar (Y=1820)
        ctx.fillStyle = "rgba(10, 15, 28, 0.95)";
        ctx.fillRect(0, h - 80, w, 80);
        ctx.strokeStyle = "rgba(51, 65, 85, 0.8)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, h - 80);
        ctx.lineTo(w, h - 80);
        ctx.stroke();

        ctx.fillStyle = "#cbd5e1";
        ctx.font = "bold 20px 'Inter', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("● LIVE WIRE • GLOBALPULSE AI • theglobalpulseai.com", w / 2, h - 34);
        ctx.textAlign = "start";
      }
    },
    [aspectRatio, category, title]
  );

  // Helper to draw 2-4 word bold uppercase Hormozi subtitles
  const drawHormoziCaptions = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    maxWidth: number,
    isVertical: boolean = false
  ) => {
    if (!currentCaptionWords || currentCaptionWords.length === 0) return;

    ctx.save();
    const fontSize = isVertical ? 64 : 44;
    ctx.font = `900 ${fontSize}px 'Inter', Impact, sans-serif`;
    ctx.textAlign = "center";

    const wordWidths = currentCaptionWords.map((w) => ctx.measureText(w.toUpperCase()).width);
    const spaceWidth = ctx.measureText(" ").width;
    const totalW = wordWidths.reduce((a, b) => a + b, 0) + spaceWidth * (currentCaptionWords.length - 1);

    let startX = centerX - totalW / 2;

    currentCaptionWords.forEach((word, idx) => {
      const wUpper = word.toUpperCase();
      const wW = wordWidths[idx];
      const posX = startX + wW / 2;
      const isActive = idx === activeWordInCaption;

      ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 4;

      ctx.strokeStyle = "#000000";
      ctx.lineWidth = isVertical ? 8 : 6;
      ctx.strokeText(wUpper, posX, centerY);

      ctx.fillStyle = isActive ? "#facc15" : "#ffffff";
      ctx.fillText(wUpper, posX, centerY);

      startX += wW + spaceWidth;
    });

    ctx.restore();
  };

  // Main Animation Loop
  useEffect(() => {
    let animId: number;
    const loop = () => {
      if (isPlayingRef.current) {
        setCurrentTime((prev) => {
          const next = prev + 0.033;
          if (next >= duration) {
            handleStop();
            return duration;
          }

          const currentWordIdx = wordTimestampsRef.current.findIndex(
            (wt) => next >= wt.start && next < wt.end
          );
          if (currentWordIdx !== -1) {
            setActiveWordIndex(currentWordIdx);
            const chunkStart = Math.floor(currentWordIdx / 3) * 3;
            const chunk = wordTimestampsRef.current.slice(chunkStart, chunkStart + 3).map((w) => w.word);
            setCurrentCaptionWords(chunk);
            setActiveWordInCaption(currentWordIdx - chunkStart);
          }

          renderCanvasFrame(next);
          return next;
        });
      } else {
        renderCanvasFrame(currentTime);
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [duration, renderCanvasFrame, currentTime]);

  // Speech Synthesis Control
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
    initWebAudioBGM();

    const utterance = new SpeechSynthesisUtterance(scriptData.fullScript);
    const voices = window.speechSynthesis.getVoices();

    const voice =
      voices.find((v) => v.lang.startsWith("en") && v.name.includes("Natural")) ||
      voices.find((v) => v.lang.startsWith("en") && v.name.includes("Google")) ||
      voices.find((v) => v.lang === "en-US") ||
      voices[0];

    if (voice) utterance.voice = voice;
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onboundary = (e) => {
      if (e.name === "word") {
        const charIdx = e.charIndex;
        const textBefore = scriptData.fullScript.substring(0, charIdx);
        const wordCount = textBefore.split(/\s+/).filter(Boolean).length;
        setActiveWordIndex(wordCount);

        const chunkStart = Math.floor(wordCount / 3) * 3;
        const chunk = wordTimestampsRef.current.slice(chunkStart, chunkStart + 3).map((w) => w.word);
        setCurrentCaptionWords(chunk);
        setActiveWordInCaption(wordCount - chunkStart);
      }
    };

    utterance.onend = () => {
      handleStop();
    };

    utterance.onerror = (e) => {
      if (e.error !== "canceled" && e.error !== "interrupted") {
        console.warn("Speech synthesis note:", e);
      }
      handleStop();
    };

    activeUtteranceRef.current = utterance;
    setIsPlaying(true);
    setIsPaused(false);
    isPlayingRef.current = true;
    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
    }
    setIsPaused(true);
    setIsPlaying(false);
    isPlayingRef.current = false;
  };

  const handleStop = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    isPlayingRef.current = false;
    setCurrentTime(0);
    setCurrentCaptionWords([]);
  };

  // Video Export using MediaRecorder
  const handleExportVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsRecording(true);
    setRecordingProgress(0);
    recordedChunksRef.current = [];

    handleStop();

    const stream = canvas.captureStream(30);

    if (destNodeRef.current && destNodeRef.current.stream.getAudioTracks().length > 0) {
      stream.addTrack(destNodeRef.current.stream.getAudioTracks()[0]);
    }

    let mimeType = "video/webm;codecs=vp9";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/webm";
    }

    try {
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6000000 });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const aspectLabel = aspectRatio === "9:16" ? "Shorts_9x16" : "Broadcast_16x9";
        a.download = `GlobalPulseAI_${aspectLabel}_${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsRecording(false);
        setRecordingProgress(100);
      };

      recorder.start();
      handlePlay();

      const startMs = Date.now();
      const totalMs = duration * 1000;
      const progInt = setInterval(() => {
        const elapsed = Date.now() - startMs;
        const pct = Math.min(99, Math.round((elapsed / totalMs) * 100));
        setRecordingProgress(pct);
        if (elapsed >= totalMs || !isPlayingRef.current) {
          clearInterval(progInt);
          if (recorder.state === "recording") {
            recorder.stop();
          }
        }
      }, 500);
    } catch (err) {
      console.error("Recording error:", err);
      setIsRecording(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-6 max-h-[92vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">AI Video Studio</h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-full">
                  Broadcast Visuals
                </span>
              </div>
              <p className="text-xs text-slate-400">
                35s Viral News Format • Ken Burns Motion • Word-Synced Hormozi Subtitles
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              handleStop();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Studio Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-y-auto">
          {/* Left Column: Interactive Canvas Stage (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-950/60 rounded-2xl border border-slate-800/80 p-4">
            {/* Aspect Ratio Selector */}
            <div className="w-full flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-semibold">
                <button
                  onClick={() => setAspectRatio("9:16")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    aspectRatio === "9:16"
                      ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  📱 9:16 Vertical (Shorts/TikTok)
                </button>
                <button
                  onClick={() => setAspectRatio("16:9")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    aspectRatio === "16:9"
                      ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  📺 16:9 Broadcast (YouTube)
                </button>
              </div>

              <span className="text-xs text-slate-400 font-mono">
                {aspectRatio === "9:16" ? "1080 × 1920" : "1920 × 1080"}
              </span>
            </div>

            {/* Canvas Stage Viewport */}
            <div
              className={`relative rounded-2xl overflow-hidden border border-slate-800 bg-black shadow-2xl flex items-center justify-center transition-all ${
                aspectRatio === "9:16" ? "w-[300px] h-[533px]" : "w-full aspect-video"
              }`}
            >
              <canvas ref={canvasRef} className="w-full h-full object-contain" />

              {/* Live Status Badge */}
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[11px] text-white font-medium">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span>{isPlaying ? "PLAYING" : isPaused ? "PAUSED" : "READY"}</span>
                <span className="text-slate-400">|</span>
                <span className="text-cyan-400">{Math.floor(currentTime)}s / {duration}s</span>
              </div>
            </div>

            {/* Transport Player Controls & Export */}
            <div className="w-full mt-4 flex items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 px-4 py-3 rounded-xl">
              <div className="flex items-center gap-2">
                {!isPlaying ? (
                  <button
                    onClick={handlePlay}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Play Preview</span>
                  </button>
                ) : (
                  <button
                    onClick={handlePause}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold text-sm transition-all cursor-pointer"
                  >
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause</span>
                  </button>
                )}

                <button
                  onClick={handleStop}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                >
                  Reset
                </button>
              </div>

              {/* Timeline Progress */}
              <div className="flex-1 mx-3 hidden sm:flex items-center gap-2">
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-75"
                    style={{ width: `${Math.min(100, (currentTime / duration) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Export Button */}
              <button
                onClick={handleExportVideo}
                disabled={isRecording}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  isRecording
                    ? "bg-slate-800 text-cyan-400 border border-cyan-500/30 animate-pulse"
                    : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20"
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isRecording ? `Exporting (${recordingProgress}%)...` : "Export Video"}</span>
              </button>
            </div>
          </div>

          {/* Right Column: 35s Viral Script & Controls (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Script Breakdown Card */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  <h3 className="font-bold text-white text-base">35-Second Viral Script</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    {scriptData.wordCount} words
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                    ~{duration}s
                  </span>
                </div>
              </div>

              {/* 4-Part Structure Breakdown */}
              <div className="space-y-2.5 text-xs text-slate-300">
                {/* 1. Hook */}
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                  <span className="font-bold text-red-400 block mb-1">0–3s SCROLL-STOPPING HOOK:</span>
                  <p className="text-slate-200 font-medium leading-relaxed">{scriptData.hook}</p>
                </div>

                {/* 2. Core Facts */}
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <span className="font-bold text-cyan-400 block mb-1">3–25s CORE FACTS (3 Short Sentences):</span>
                  <ul className="space-y-1 list-disc list-inside text-slate-200">
                    {scriptData.coreFacts.map((fact, i) => (
                      <li key={i}>{fact}</li>
                    ))}
                  </ul>
                </div>

                {/* 3. Takeaway */}
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <span className="font-bold text-purple-400 block mb-1">25–30s TAKEAWAY / IMPACT:</span>
                  <p className="text-slate-200 leading-relaxed">{scriptData.takeaway}</p>
                </div>

                {/* 4. Fast CTA */}
                <div className="p-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <span className="font-bold text-yellow-400 block mb-1">30–35s FAST CTA:</span>
                  <p className="text-slate-200 font-medium leading-relaxed">{scriptData.cta}</p>
                </div>
              </div>
            </div>

            {/* Video Engine Settings */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>Broadcast Visuals Engine</span>
                </h4>
                <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
                  100% Free & Self-Contained
                </span>
              </div>

              <div className="text-xs text-slate-400 space-y-1.5 leading-relaxed">
                <p>
                  • <strong className="text-slate-200">Dynamic B-Roll:</strong> Smooth Ken Burns camera pan and zoom motion for high viewer retention.
                </p>
                <p>
                  • <strong className="text-slate-200">Hormozi Subtitles:</strong> Word-level synchronized captions with electric yellow highlight and drop shadow.
                </p>
                <p>
                  • <strong className="text-slate-200">Verified Brand Overlay:</strong> Clean watermark (<code className="text-cyan-300">@GlobalPulseAI</code>) and live lower-third ticker.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
