import os
import re
import json
import asyncio
import subprocess
import traceback
import urllib.request
import urllib.parse
import concurrent.futures
from typing import Optional, Dict, Any, List, Tuple
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import imageio_ffmpeg

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_VIDEOS_DIR = BASE_DIR / "static" / "videos"
STATIC_VIDEOS_DIR.mkdir(parents=True, exist_ok=True)

PUBLIC_SITE_URL = os.getenv("PUBLIC_SITE_URL", os.getenv("FRONTEND_URL", "https://globalpulse.ai")).rstrip("/")

def get_clean_domain(url: str) -> str:
    """Extracts a clean uppercase domain or host for display banners."""
    try:
        parsed = urllib.parse.urlparse(url)
        domain = parsed.netloc or parsed.path
        return domain.strip("/").upper()
    except Exception:
        return url.replace("https://", "").replace("http://", "").split("/")[0].upper()

def run_async_in_isolated_thread(async_func, *args, timeout: float = 45.0) -> bool:
    """
    Safely executes an async coroutine inside an isolated worker thread with its own dedicated event loop.
    Prevents closing or overriding the calling thread's event loop in FastAPI and APScheduler.
    """
    result = False

    def _worker():
        nonlocal result
        isolated_loop = asyncio.new_event_loop()
        try:
            asyncio.set_event_loop(isolated_loop)
            result = isolated_loop.run_until_complete(async_func(*args))
        except Exception as err:
            print(f"[Video Generator] Isolated async worker error: {err}")
            result = False
        finally:
            try:
                pending = asyncio.all_tasks(isolated_loop)
                for t in pending:
                    t.cancel()
                if pending:
                    isolated_loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
            except Exception:
                pass
            try:
                isolated_loop.close()
            except Exception:
                pass
            asyncio.set_event_loop(None)

    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(_worker)
        try:
            future.result(timeout=timeout)
        except Exception as e:
            print(f"[Video Generator] Isolated async execution timeout or error: {e}")
            return False

    return result

# Curated Category Color Accents (RGB)
CATEGORY_ACCENTS: Dict[str, Tuple[int, int, int]] = {
    "AI & Tech": (6, 182, 212),         # Neon Cyan
    "Global Markets": (16, 185, 129),    # Neon Emerald
    "Geopolitics": (245, 158, 11),       # Amber Gold
    "Future Science": (168, 85, 247),    # Neon Purple
    "Global Sports": (239, 68, 68),      # Stadium Crimson Red
}

# Curated High-Definition Topic-Specific Photos (7 distinct scenes per category)
CATEGORY_CURATED_PHOTOS: Dict[str, List[str]] = {
    "Global Sports": [
        "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1280&q=80",  # Floodlit Stadium arena
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1280&q=80",  # Football match action
        "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1280&q=80",  # High intensity duel
        "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1280&q=80",  # Arena court competition
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1280&q=80",  # Championship track victory
        "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1280&q=80",  # Stadium fans celebration
        "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1280&q=80",  # Iconic ground lights
    ],
    "AI & Tech": [
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1280&q=80",  # Neural computing nodes
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1280&q=80",  # Microchip silicon wafer
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1280&q=80",  # Digital cyber network
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1280&q=80",  # Modern cloud data center
        "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1280&q=80",  # AI engineering team briefing
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1280&q=80",  # Robotics hardware laboratory
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1280&q=80",  # High-tech command console
    ],
    "Global Markets": [
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1280&q=80",  # Financial analytics display
        "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1280&q=80",  # Market exchange floor
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1280&q=80",  # Financial center skyline
        "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1280&q=80",  # Capital liquidity reserves
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1280&q=80",  # Institutional asset management
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1280&q=80",  # Enterprise telemetry dashboard
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1280&q=80",  # Interconnected global capital
    ],
    "Geopolitics": [
        "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1280&q=80",  # International summit hall
        "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1280&q=80",  # Capitol government assembly
        "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1280&q=80",  # Diplomatic flags corridor
        "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1280&q=80",  # Geopolitical strategic world map
        "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1280&q=80",  # Press briefing conference podium
        "https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1280&q=80",  # Global metropolis architecture
        "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1280&q=80",  # Strategic intelligence operations
    ],
    "Future Science": [
        "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1280&q=80",  # Deep space telescope view
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1280&q=80",  # Advanced cleanroom laboratory
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1280&q=80",  # Quantum orbital telemetry
        "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1280&q=80",  # Deep cosmic astrophysics
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1280&q=80",  # Nanoscale quantum physics
        "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=1280&q=80",  # Autonomous robotic exploration
        "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1280&q=80",  # Earth orbital telemetry
    ]
}

def get_font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    """Safe font loader for Windows and Linux environments."""
    font_names = (
        ["segoeuib.ttf", "arialbd.ttf", "calibrib.ttf", "DejaVuSans-Bold.ttf"]
        if bold
        else ["segoeui.ttf", "arial.ttf", "calibri.ttf", "DejaVuSans.ttf"]
    )
    for name in font_names:
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            continue
    return ImageFont.load_default()

def wrap_text(text: str, max_chars: int = 24) -> List[str]:
    """Wraps text into a list of lines with a target character width."""
    words = text.split()
    lines = []
    current_line = []
    for word in words:
        candidate = " ".join(current_line + [word])
        if len(candidate) <= max_chars:
            current_line.append(word)
        else:
            if current_line:
                lines.append(" ".join(current_line))
            current_line = [word]
    if current_line:
        lines.append(" ".join(current_line))
    return lines

def clean_script_for_voiceover(youtube_script: str, fallback_title: str = "", fallback_summary: str = "") -> str:
    """
    Cleans raw script by removing director cues, timing brackets, fractions, and markdown artifacts.
    Guarantees pure, natural spoken broadcaster dialogue with ZERO visual instructions read aloud.
    """
    text = youtube_script or ""
    # 1. Remove bracketed and parenthetical notes e.g. [00:00 - 00:05] or [HOOK:] or [VISUAL: ...]
    text = re.sub(r"\[.*?\]", " ", text)
    text = re.sub(r"\(.*?\)", " ", text)

    # 2. Filter line by line: eliminate director cues and visual instructions
    filtered_lines = []
    for raw_line in text.split("\n"):
        line = raw_line.strip()
        if not line:
            continue
        line_lower = line.lower()
        # If line starts with a speaker cue like "HOOK:", "NARRATION:", "CTA:" - keep only the spoken text
        matched = re.match(r"^(?:hook|narration|spoken|speaker|voiceover|presenter|host|cta)\s*:\s*(.+)$", line, re.IGNORECASE)
        if matched:
            line = matched.group(1).strip()
            line_lower = line.lower()

        # If line is or contains director / visual cues, discard entirely
        if any(line_lower.startswith(cue) for cue in [
            "visual:", "visuals:", "graphic:", "stat overlay:", "tactical board", 
            "b-roll:", "camera:", "scene:", "bgm:", "sfx:", "telemetry:"
        ]):
            continue
        if any(bad_phrase in line_lower for bad_phrase in [
            "tactical board displaying", "stadium visuals", "match telemetry", 
            "stat overlay rating", "on-screen graphic", "b-roll showing"
        ]):
            continue

        filtered_lines.append(line)

    cleaned = " ".join(filtered_lines)

    # 3. Strip remaining inline cues
    cleaned = re.sub(r"(?i)\b(hook|visual|narration|on-screen graphic|cta|stats|action|bgm|scene|audio):\s*", " ", cleaned)
    cleaned = cleaned.replace("*", "").replace("•", "").replace("▸", "").replace(">", "").replace("|", " ")

    # 4. Fix fractions e.g. 9.4/10 -> 9.4 out of 10 so TTS never reads it as 'September 4th'
    cleaned = re.sub(r"\b(\d+(?:\.\d+)?)\s*/\s*10\b", r"\1 out of 10", cleaned)
    cleaned = re.sub(r"\b(\d+)\s*/\s*(\d+)\b", r"\1 out of \2", cleaned)

    cleaned = " ".join(cleaned.split()).strip()

    # If the clean script is too brief (< 40 chars), enrich with headline & summary
    if len(cleaned) < 40:
        cleaned = f"{fallback_title}. {fallback_summary}. Follow GlobalPulse AI for breaking developments."

    return cleaned

def prepare_text_for_tts(clean_text: str) -> str:
    """
    Transforms text specifically for speech synthesis engine:
    - Adds a trailing pause buffer so the voiceover never cuts off abruptly at the end.
    """
    t = clean_text
    t = re.sub(r"(?i)\beduhub\s+by\s+saeed\b", "GlobalPulse AI", t)
    t = re.sub(r"(?i)\b@eduhubbysaeed\b", "@GloblePulseAi", t)
    # Trailing 1-second pause buffer
    t = t.rstrip(".!? ") + ". ... Thank you for watching GlobalPulse AI."
    return t

def segment_script_into_sentences(text: str, fallback_title: str = "", count: int = 7) -> List[str]:
    """
    Splits narration text into 6 to 8 punchy spoken sentences for slide synchronization.
    Each sentence is displayed as a large pop-up caption on its own full-bleed cinematic scene.
    """
    raw = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if len(s.strip()) > 8]
    sentences = [s for s in raw if "thank you for watching" not in s.lower()]

    if len(sentences) < 4:
        expanded = []
        for s in sentences:
            if len(s) > 90 and ("," in s or ";" in s):
                parts = [p.strip() for p in re.split(r"[,;]", s) if len(p.strip()) > 15]
                expanded.extend(parts)
            else:
                expanded.append(s)
        sentences = expanded

    if not sentences:
        sentences = [
            fallback_title or "Breaking news dispatch.",
            "Key developments have surfaced altering the competitive posture.",
            "Verified reporting corroborates significant institutional impact.",
            "Analysts highlight crucial strategic and tactical implications.",
            "Stay tuned to GlobalPulse AI for comprehensive live updates."
        ]

    # Target 6 to 8 sentences
    return sentences[:8]

def build_long_form_narration(
    title: str,
    category: str,
    summary: str,
    content: str = "",
    youtube_script: Optional[str] = None
) -> str:
    """
    Constructs an authoritative, broadcast-grade 350-550 word English news documentary narration
    (approx. 2.0 to 3.5 minutes of spoken audio at ~150 wpm) for 16:9 Long-Form YouTube Videos:
      1. Breaking Hook & Headline Introduction
      2. Core Operational Facts & Executive Summary
      3. Deep-Dive Investigation (from full cleaned article content)
      4. Global Market & Strategic Implications
      5. Outro & Call-to-Action for GlobalPulse AI (@GloblePulseAi)
    """
    clean_domain = get_clean_domain(PUBLIC_SITE_URL)
    clean_title = re.sub(r"(?i)\s*#shorts\b", "", title).strip().rstrip(".:,-")

    def _strip_markdown(text: str) -> str:
        t = re.sub(r"#+\s*", "", text)
        t = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", t)
        t = re.sub(r"<[^>]+>", "", t)
        t = re.sub(r"https?://\S+", "", t)
        t = re.sub(r"(?i)\b(hook|visual|narration|cta|on-screen graphic|scene|audio):\s*", " ", t)
        t = t.replace("**", "").replace("*", "").replace("`", "").replace("•", "").replace("▸", "").replace(">", "").replace("|", " ")
        t = re.sub(r"\[.*?\]", " ", t)
        t = re.sub(r"\(.*?\)", " ", t)
        return " ".join(t.split()).strip()

    # Section 1: Breaking Hook & Headline Intro
    if category == "Global Sports":
        intro_lead = f"Breaking sports dispatch in {category}. {clean_title}."
        intro_body = "Welcome to GlobalPulse AI, bringing you high-octane match analytics, tactical breakdowns, and championship reporting."
    else:
        intro_lead = f"Breaking intelligence dispatch in {category}. {clean_title}."
        intro_body = "Welcome to GlobalPulse AI, delivering verified global news reporting, strategic industry intelligence, and deep-dive technical briefings."

    # Section 2: Core Facts & Executive Summary
    summary_bullets = [
        _strip_markdown(line)
        for line in summary.split("\n")
        if len(_strip_markdown(line)) > 15
    ]
    if not summary_bullets:
        summary_sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", summary) if len(s.strip()) > 15]
        summary_bullets = summary_sentences

    exec_summary_text = "Here are the primary operational findings." if category != "Global Sports" else "Examining the key turning points and match dynamics:"
    if summary_bullets:
        bullet_phrases = []
        transitions = ["First", "Second", "Furthermore", "In addition"]
        for i, b in enumerate(summary_bullets[:3]):
            trans = transitions[i] if i < len(transitions) else "Additionally"
            b_clean = b.rstrip(".")
            bullet_phrases.append(f"{trans}, {b_clean}.")
        exec_summary_text += " " + " ".join(bullet_phrases)

    # Section 3: Deep-Dive Investigation / Tactical Breakdown Paragraphs
    content_clean_paras = []
    if content:
        for p in content.split("\n\n"):
            p_clean = _strip_markdown(p)
            if len(p_clean) > 55 and not p.strip().startswith("|") and not p_clean.startswith("###"):
                content_clean_paras.append(p_clean)

    if category == "Global Sports":
        if content_clean_paras:
            deep_dive_text = "Tactical match breakdown: " + " ".join(content_clean_paras[:2])
        else:
            deep_dive_text = "Tactical match breakdown: High-tempo transitional play and clinical finishing separated the sides in this high-stakes contest."
        implications_text = "Championship standings and qualification pathways are directly impacted by this result, setting up high-stakes upcoming fixtures."
    else:
        if len(content_clean_paras) >= 2:
            deep_dive_text = "Diving into the full investigative details: " + " ".join(content_clean_paras[:2])
        else:
            deep_dive_text = (
                f"Diving into the full investigative details: Independent analysts and technical teams have verified "
                f"that this milestone in {category} represents a significant operational transition. Industry benchmarks "
                "indicate that legacy constraints are being rapidly superseded by scalable next-generation architectures."
            )
        implications_text = (
            f"Examining the strategic and global market implications: The developments unfolding in {category} "
            "are actively recalibrating institutional capital flows and long-term enterprise technology roadmaps worldwide."
        )

    # Section 5: Outro & Call-to-Action (GlobalPulse AI)
    outro_text = (
        "For daily technical dispatches, real-world implementations, and cutting-edge intelligence briefings, "
        "make sure to subscribe to our official YouTube channel, GlobalPulse AI, at handle GloblePulseAi. "
        f"And to inspect the complete dossier and verified data, visit GlobalPulse AI at {clean_domain}. Thank you for watching."
    )

    full_narration = f"{intro_lead} {intro_body} {exec_summary_text} {deep_dive_text} {implications_text} {outro_text}"
    return _strip_markdown(full_narration)

async def synthesize_edge_tts(text: str, output_path: Path) -> bool:
    """Generates authentic neural speech audio using Microsoft Edge TTS."""
    try:
        import edge_tts
        voice = "en-US-ChristopherNeural"
        communicator = edge_tts.Communicate(text, voice)
        await communicator.save(str(output_path))
        return output_path.exists() and output_path.stat().st_size > 5000
    except Exception as e:
        print(f"[Video Generator] edge-tts error: {e}")
        return False

def synthesize_gtts(text: str, output_path: Path) -> bool:
    """Bulletproof Google Translate TTS fallback that runs natively on Linux (Render) and Windows."""
    try:
        from gtts import gTTS
        clean_tts_text = re.sub(r"[\*#_`~▸•]+", " ", text)
        clean_tts_text = " ".join(clean_tts_text.split()).strip()
        if not clean_tts_text:
            return False
        tts = gTTS(text=clean_tts_text[:2500], lang="en", slow=False)
        tts.save(str(output_path))
        return output_path.exists() and output_path.stat().st_size > 5000
    except Exception as e:
        print(f"[Video Generator] gTTS fallback error: {e}")
        return False

def synthesize_system_tts(text: str, output_path: Path) -> bool:
    """Generates speech via Windows SAPI SpeechSynthesizer as fallback."""
    try:
        wav_path = output_path.with_suffix(".wav")
        escaped_text = text.replace('"', '""').replace("'", "''")
        ps_cmd = f"""
        Add-Type -AssemblyName System.Speech;
        $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
        $synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Male);
        $synth.SetOutputToWaveFile('{wav_path}');
        $synth.Speak('{escaped_text[:1200]}');
        $synth.Dispose();
        """
        subprocess.run(["powershell", "-Command", ps_cmd], check=True, capture_output=True, timeout=30)
        
        if wav_path.exists() and wav_path.stat().st_size > 5000:
            ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
            subprocess.run(
                [ffmpeg_exe, "-y", "-i", str(wav_path), "-c:a", "libmp3lame", "-b:a", "192k", str(output_path)],
                check=True,
                capture_output=True
            )
            wav_path.unlink(missing_ok=True)
            return output_path.exists() and output_path.stat().st_size > 5000
    except Exception as e:
        print(f"[Video Generator] System TTS fallback error: {e}")
    return False

def probe_media_duration(file_path: Path) -> float:
    """Probes media duration in seconds using bundled FFmpeg."""
    try:
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        cmd = [ffmpeg_exe, "-i", str(file_path)]
        res = subprocess.run(cmd, capture_output=True, text=True, errors="replace")
        match = re.search(r"Duration:\s*(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)", res.stderr)
        if match:
            hours, minutes, seconds = match.groups()
            return float(hours) * 3600 + float(minutes) * 60 + float(seconds)
    except Exception as e:
        print(f"[Video Generator] Probe duration error: {e}")
    return 0.0

def validate_generated_video_file(file_path: Path, is_long: bool = False, min_duration: float = 5.0) -> Dict[str, Any]:
    """
    Validation Gate: Verifies that a generated MP4 video exists, has valid file size and duration,
    and has uncorrupted video and audio streams before being passed to YouTube uploader.
    """
    format_name = "16:9 Long-Form HD" if is_long else "9:16 Shorts"
    p = Path(file_path)
    if not p.exists() or not p.is_file():
        err = f"[Video Generator Validation Gate FAILED] Video file does not exist on disk at: {p}"
        print(f"[Video Generator ERROR] {err}")
        raise FileNotFoundError(err)

    size_bytes = p.stat().st_size
    size_mb = size_bytes / (1024 * 1024)
    min_bytes = 500_000 if is_long else 100_000
    if size_bytes < min_bytes:
        err = (
            f"[Video Generator Validation Gate FAILED] {format_name} video '{p.name}' is too small "
            f"({size_bytes:,} bytes, {size_mb:.3f} MB). Minimum required is {min_bytes:,} bytes."
        )
        print(f"[Video Generator ERROR] {err}")
        raise ValueError(err)

    duration = probe_media_duration(p)
    required_min_duration = 15.0 if is_long else min_duration
    if duration < required_min_duration:
        err = (
            f"[Video Generator Validation Gate FAILED] {format_name} video '{p.name}' duration ({duration:.2f}s) "
            f"is below required threshold of {required_min_duration:.1f}s."
        )
        print(f"[Video Generator ERROR] {err}")
        raise ValueError(err)

    # Stream integrity check via ffmpeg probe
    try:
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        probe_res = subprocess.run([ffmpeg_exe, "-i", str(p)], capture_output=True, text=True, errors="replace")
        has_video = "Video:" in probe_res.stderr
        has_audio = "Audio:" in probe_res.stderr
        if not has_video:
            raise RuntimeError(f"Video stream missing or corrupt in {p.name}")
        if not has_audio:
            raise RuntimeError(f"Audio stream missing or corrupt in {p.name}")
    except Exception as probe_err:
        err = f"[Video Generator Validation Gate FAILED] Stream integrity check failed for '{p.name}': {probe_err}"
        print(f"[Video Generator ERROR] {err}")
        print(traceback.format_exc())
        raise RuntimeError(err) from probe_err

    print(
        f"[Video Generator Validation Gate PASSED] Video '{p.name}' verified for YouTube upload:\n"
        f"  Format: {format_name}\n"
        f"  Size: {size_mb:.2f} MB ({size_bytes:,} bytes)\n"
        f"  Duration: {duration:.2f}s\n"
        f"  Path: {p.resolve()}"
    )
    return {
        "valid": True,
        "format": "long" if is_long else "short",
        "file_size_bytes": size_bytes,
        "file_size_mb": round(size_mb, 2),
        "duration_seconds": round(duration, 2),
        "path": str(p.resolve())
    }

def create_focal_variant(base_img: Image.Image, variant_idx: int, target_w: int, target_h: int) -> Image.Image:
    """Creates a distinct, topic-focused cropped/zoomed variant of the base image."""
    w, h = base_img.size
    if variant_idx == 1:
        # Full center fit
        scale = max(target_w / w, target_h / h)
        nw, nh = int(w * scale), int(h * scale)
        res = base_img.resize((nw, nh), Image.Resampling.LANCZOS)
        x1, y1 = (nw - target_w) // 2, (nh - target_h) // 2
        return res.crop((x1, y1, x1 + target_w, y1 + target_h))
    elif variant_idx == 2:
        # Macro center zoom (1.35x)
        scale = max(target_w / w, target_h / h) * 1.35
        nw, nh = int(w * scale), int(h * scale)
        res = base_img.resize((nw, nh), Image.Resampling.LANCZOS)
        x1, y1 = (nw - target_w) // 2, (nh - target_h) // 2
        return res.crop((x1, y1, x1 + target_w, y1 + target_h))
    elif variant_idx == 3:
        # Upper-left quadrant focus
        cw, ch = int(w * 0.72), int(h * 0.72)
        c = base_img.crop((0, 0, cw, ch))
        return c.resize((target_w, target_h), Image.Resampling.LANCZOS)
    elif variant_idx == 4:
        # Upper-right quadrant focus with contrast enhancement
        cw, ch = int(w * 0.72), int(h * 0.72)
        c = base_img.crop((w - cw, 0, w, ch))
        enh = ImageEnhance.Contrast(c).enhance(1.15)
        return enh.resize((target_w, target_h), Image.Resampling.LANCZOS)
    elif variant_idx == 5:
        # Lower-center quadrant focus with subtle warmth
        cw, ch = int(w * 0.75), int(h * 0.75)
        x1 = (w - cw) // 2
        c = base_img.crop((x1, h - ch, x1 + cw, h))
        return c.resize((target_w, target_h), Image.Resampling.LANCZOS)
    elif variant_idx == 6:
        # Center-left focus with color saturation boost
        cw, ch = int(w * 0.7), int(h * 0.7)
        y1 = (h - ch) // 2
        c = base_img.crop((0, y1, cw, y1 + ch))
        enh = ImageEnhance.Color(c).enhance(1.2)
        return enh.resize((target_w, target_h), Image.Resampling.LANCZOS)
    else:
        # Deep macro detail crop (1.5x zoom)
        scale = max(target_w / w, target_h / h) * 1.5
        nw, nh = int(w * scale), int(h * scale)
        res = base_img.resize((nw, nh), Image.Resampling.LANCZOS)
        x1, y1 = (nw - target_w) // 2, (nh - target_h) // 2
        return res.crop((x1, y1, x1 + target_w, y1 + target_h))

def download_web_image(url: str, output_path: Path, timeout: float = 4.0) -> bool:
    """Safely downloads an image with browser headers and verifies image data integrity."""
    if not url or not url.startswith("http"):
        return False
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
            }
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = resp.read()
            if len(data) > 3000:
                with open(output_path, "wb") as f:
                    f.write(data)
                # Verify image can be parsed by PIL
                with Image.open(output_path) as check_img:
                    check_img.verify()
                return True
    except Exception:
        output_path.unlink(missing_ok=True)
    return False

def get_category_scene_prompts(title: str, category: str, count: int = 7) -> List[str]:
    """Generates distinct, topic-relevant visual scene prompts tailored for each category."""
    clean_kw = re.sub(r"[^a-zA-Z0-9\s]", " ", title).strip()
    words = [w for w in clean_kw.split() if len(w) > 2][:5]
    core_topic = " ".join(words) if words else title[:35]

    if category == "Global Sports":
        return [
            f"{core_topic} stadium floodlights championship crowd opening kickoff 8k",
            f"{core_topic} high intensity football soccer match tactical pitch action 8k",
            f"{core_topic} star player striker dribble shot dramatic sports photography 8k",
            f"{core_topic} tactical analysis board manager coaching intense momentum shift 8k",
            f"{core_topic} championship trophy presentation stadium arena scoreboard 8k",
            f"{core_topic} teammates celebration victory roar crowd waving flags 8k",
            "modern television broadcast sports news desk analyst television studio 8k"
        ][:count]
    elif category == "Global Markets":
        return [
            f"{core_topic} financial trading floor exchange screens global capital 8k",
            f"{core_topic} candlestick market charting telemetry data analytics monitors 8k",
            f"{core_topic} central banking architectural vault bullion gold liquidity 8k",
            f"{core_topic} international container shipping cargo logistics global supply chain 8k",
            f"{core_topic} corporate executive financial portfolio asset management desk 8k",
            f"{core_topic} interconnected world currency global financial network 8k",
            "modern financial television news broadcast intelligence studio 8k"
        ][:count]
    elif category == "Geopolitics":
        return [
            f"{core_topic} international diplomatic summit world leader bilateral assembly 8k",
            f"{core_topic} national parliament hall assembly congress chamber 8k",
            f"{core_topic} diplomatic flags corridor international summit negotiation table 8k",
            f"{core_topic} strategic world geopolitical satellite map corridor telemetry 8k",
            f"{core_topic} governmental press conference briefing podium journalists 8k",
            f"{core_topic} transatlantic security cooperation strategic operations center 8k",
            "international affairs broadcast newsroom world desk studio 8k"
        ][:count]
    elif category == "Future Science":
        return [
            f"{core_topic} deep space astrophysics nebula james webb telescope telemetry 8k",
            f"{core_topic} clean fusion energy tokamak magnetic plasma reactor 8k",
            f"{core_topic} modern cleanroom laboratory biotechnology gene sequencer 8k",
            f"{core_topic} planetary exploration orbital satellite mars mission telemetry 8k",
            f"{core_topic} superconducting particle physics research accelerator tunnel 8k",
            f"{core_topic} advanced quantum computing optical laser laboratory 8k",
            "science documentary television production studio modern broadcast 8k"
        ][:count]
    else:  # AI & Tech
        return [
            f"{core_topic} advanced neural computing processor silicon hardware 8k",
            f"{core_topic} semiconductor microchip wafer cleanroom macro photography 8k",
            f"{core_topic} modern artificial intelligence research laboratory robotics 8k",
            f"{core_topic} enterprise cloud data center servers optical fiber routing 8k",
            f"{core_topic} holographic artificial intelligence telemetry code matrix 8k",
            f"{core_topic} tech engineering team executive architectural demonstration 8k",
            "modern technology broadcast television news digital media room 8k"
        ][:count]

def fetch_scene_images(
    title: str,
    category: str,
    summary_points: List[str],
    main_image_url: Optional[str],
    article_id: int,
    output_dir: Path,
    count: int = 7,
    is_widescreen: bool = True
) -> List[Path]:
    """
    Fetches 5 to 7 distinct, topic-relevant HD photos for video scenes:
    - Scene 1: Primary article photo (or category-curated lead HD photo).
    - Scenes 2..N: Dynamic topic-specific queries via Pollinations AI or category curated pool.
    - Fallback: Multi-focal cropped/zoomed variants from base image.
    Ensures 100% photo-rich dynamic visuals for both Shorts (9:16) and Long-Form (16:9).
    """
    target_w = 1280 if is_widescreen else 720
    target_h = 720 if is_widescreen else 1280
    scene_paths: List[Path] = []
    
    primary_img_path = output_dir / f"scene_1_{article_id}.jpg"
    primary_downloaded = False

    curated_pool = CATEGORY_CURATED_PHOTOS.get(category, CATEGORY_CURATED_PHOTOS.get("AI & Tech", []))
    lead_curated_url = curated_pool[0] if curated_pool else None

    # Step 1: Download Primary Image (if valid and not generic placeholder)
    if main_image_url and main_image_url.startswith("http") and "photo-1618005182384" not in main_image_url:
        primary_downloaded = download_web_image(main_image_url, primary_img_path, timeout=5.0)

    # Step 2: Fallback to Curated Lead Photo for this category
    if not primary_downloaded and lead_curated_url:
        primary_downloaded = download_web_image(lead_curated_url, primary_img_path, timeout=5.0)

    # Step 3: Fallback to Pollinations AI
    if not primary_downloaded:
        clean_kw = urllib.parse.quote(f"{title[:40]} {category} breaking news 8k")
        poll_url = f"https://image.pollinations.ai/prompt/{clean_kw}?width={target_w}&height={target_h}&nologo=true&seed={article_id}"
        primary_downloaded = download_web_image(poll_url, primary_img_path, timeout=4.0)

    # Step 4: Ultimate Fallback: High-contrast styled category backdrop
    if not primary_downloaded or not primary_img_path.exists():
        accent = CATEGORY_ACCENTS.get(category, (6, 182, 212))
        synth = Image.new("RGB", (target_w, target_h), (11, 15, 25))
        s_draw = ImageDraw.Draw(synth)
        s_draw.rectangle([(20, 20), (target_w - 20, target_h - 20)], outline=accent, width=3)
        s_draw.text((60, 60), f"GLOBALPULSE AI // {category.upper()}", fill=accent, font=get_font(26, bold=True))
        synth.save(primary_img_path, "JPEG", quality=85)
        del synth

    scene_paths.append(primary_img_path)

    # Open base image for generating in-memory scene variants if needed
    try:
        base_pil = Image.open(primary_img_path).convert("RGB")
    except Exception:
        base_pil = Image.new("RGB", (target_w, target_h), (15, 23, 42))

    scene_prompts = get_category_scene_prompts(title, category, count=count)

    for idx in range(2, count + 1):
        scene_file = output_dir / f"scene_{idx}_{article_id}.jpg"
        scene_downloaded = False
        p_idx = idx - 1
        p_text = scene_prompts[p_idx] if p_idx < len(scene_prompts) else f"{title[:40]} {category} news photography 8k"

        # A. Try downloading topic-specific photo via Pollinations
        try:
            encoded_p = urllib.parse.quote(p_text)
            p_url = f"https://image.pollinations.ai/prompt/{encoded_p}?width={target_w}&height={target_h}&nologo=true&seed={article_id * 17 + idx * 31}"
            scene_downloaded = download_web_image(p_url, scene_file, timeout=3.5)
        except Exception:
            scene_downloaded = False

        # B. If Pollinations timed out or failed, download category's curated HD photo for this scene index
        if not scene_downloaded and curated_pool and len(curated_pool) >= idx:
            curated_url = curated_pool[idx - 1]
            scene_downloaded = download_web_image(curated_url, scene_file, timeout=4.0)

        # C. If offline, generate distinct multi-focal/contrast variant of base image
        if not scene_downloaded or not scene_file.exists():
            variant = create_focal_variant(base_pil, idx, target_w, target_h)
            variant.save(scene_file, "JPEG", quality=85)
            del variant

        scene_paths.append(scene_file)

    del base_pil
    import gc
    gc.collect()
    return scene_paths

def create_fullbleed_cinematic_frame(
    photo_path: Path,
    target_w: int,
    target_h: int,
    zoom_crop_index: int = 0
) -> Image.Image:
    """
    Creates a full-bleed, high-impact cinematic visual frame:
    - Scales and crops the HD photo to completely fill the canvas (1080x1920 or 1280x720).
    - Applies dynamic focal zoom & pan variations across scenes so each slide feels fresh.
    - Applies a dual gradient vignette: subtle top darkening for badges, and deep dark vignette in lower 50% for high-contrast subtitles.
    """
    try:
        img = Image.open(photo_path).convert("RGB")
    except Exception:
        img = Image.new("RGB", (target_w, target_h), (15, 23, 42))

    # Varied focal zooms & pan alignments across scenes
    zoom_factors = [1.02, 1.12, 1.18, 1.25, 1.15, 1.10, 1.06, 1.22]
    align_modes = ["center", "top", "left", "center", "right", "bottom", "center", "top"]

    zf = zoom_factors[zoom_crop_index % len(zoom_factors)]
    am = align_modes[zoom_crop_index % len(align_modes)]

    scale = max(target_w / img.width, target_h / img.height) * zf
    new_w, new_h = max(target_w, int(img.width * scale)), max(target_h, int(img.height * scale))
    resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    if am == "top":
        x1 = (new_w - target_w) // 2
        y1 = 0
    elif am == "left":
        x1 = 0
        y1 = (new_h - target_h) // 2
    elif am == "right":
        x1 = new_w - target_w
        y1 = (new_h - target_h) // 2
    elif am == "bottom":
        x1 = (new_w - target_w) // 2
        y1 = new_h - target_h
    else:  # center
        x1 = (new_w - target_w) // 2
        y1 = (new_h - target_h) // 2

    x1 = max(0, min(x1, new_w - target_w))
    y1 = max(0, min(y1, new_h - target_h))

    frame = resized.crop((x1, y1, x1 + target_w, y1 + target_h))

    # Dual gradient vignette (top header fade + bottom caption fade)
    vignette = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    v_draw = ImageDraw.Draw(vignette)

    # Top fade for live status badge
    top_limit = int(target_h * 0.18)
    for y in range(top_limit):
        alpha = int(190 * (1.0 - (y / top_limit)))
        v_draw.line([(0, y), (target_w, y)], fill=(3, 7, 18, alpha))

    # Bottom fade for high-impact subtitles (smooth quadratic curve)
    bottom_start = int(target_h * 0.48)
    fade_len = target_h - bottom_start
    for y in range(bottom_start, target_h):
        prog = (y - bottom_start) / float(fade_len)
        alpha = int(245 * (prog ** 1.3))
        v_draw.line([(0, y), (target_w, y)], fill=(3, 7, 18, min(245, alpha)))

    frame.paste(vignette, (0, 0), vignette)
    del vignette
    return frame

def draw_sentence_captions(
    draw: ImageDraw.ImageDraw,
    sentence: str,
    canvas_w: int,
    canvas_h: int,
    font: ImageFont.ImageFont,
    accent_color: Tuple[int, int, int] = (250, 204, 21),
    max_chars: int = 24,
    is_shorts: bool = True
):
    """
    Renders high-impact TikTok/Reels style pop-up subtitles:
    - Bold, large text with thick black outline stroke (4px) for 100% legibility on any background.
    - First 2-3 impact words highlighted in Neon Yellow / Neon Cyan.
    - Remaining words in crisp white.
    """
    words = sentence.split()
    if not words:
        return

    lines = []
    curr = []
    for w in words:
        if len(" ".join(curr + [w])) <= max_chars:
            curr.append(w)
        else:
            if curr:
                lines.append(curr)
            curr = [w]
    if curr:
        lines.append(curr)

    line_height = 68 if is_shorts else 50
    total_height = len(lines) * line_height

    if is_shorts:
        start_y = max(1200, 1550 - (total_height // 2))
    else:
        start_y = max(480, 580 - (total_height // 2))

    word_counter = 0
    highlight_word_count = min(3, len(words))

    for i, line_words in enumerate(lines):
        full_line = " ".join(line_words)
        bbox = draw.textbbox((0, 0), full_line, font=font)
        line_w = bbox[2] - bbox[0]
        x = (canvas_w - line_w) // 2
        y = start_y + (i * line_height)

        for w in line_words:
            w_str = w + " "
            is_accent = (word_counter < highlight_word_count)
            color = accent_color if is_accent else (255, 255, 255)
            draw.text(
                (x, y),
                w_str,
                fill=color,
                font=font,
                stroke_width=4,
                stroke_fill=(0, 0, 0)
            )
            w_box = draw.textbbox((0, 0), w_str, font=font)
            x += (w_box[2] - w_box[0])
            word_counter += 1

def generate_news_slides(
    title: str,
    category: str,
    summary: str,
    output_dir: Path,
    article_id: int,
    scene_images: List[Path],
    spoken_sentences: Optional[List[str]] = None
) -> List[Path]:
    """
    Generates 6 to 8 full-bleed cinematic vertical frames (1080x1920) for 9:16 Shorts mode:
    - 100% photo-rich dynamic visuals (no black screens, no PowerPoint boxes).
    - Dynamic zoom & crop variations per scene.
    - Sleek top-left live badge (🔴 BREAKING • {category.upper()}).
    - TikTok-style large pop-up captions (lower-middle) displaying the exact spoken sentence with neon keyword highlights!
    - Clean bottom bar (@GloblePulseAi • GlobalPulse AI).
    """
    import gc
    width, height = 1080, 1920
    accent = CATEGORY_ACCENTS.get(category, (6, 182, 212))
    slide_paths: List[Path] = []

    if not spoken_sentences:
        spoken_sentences = segment_script_into_sentences(summary, fallback_title=title, count=7)

    font_top_badge = get_font(26, bold=True)
    font_top_channel = get_font(22, bold=True)
    font_caption = get_font(52, bold=True)
    font_bottom = get_font(24, bold=True)

    neon_keywords_color = (250, 204, 21) if category == "Global Sports" else (34, 211, 238)

    for idx, sentence in enumerate(spoken_sentences, 1):
        img_p = scene_images[(idx - 1) % len(scene_images)]
        frame = create_fullbleed_cinematic_frame(img_p, width, height, zoom_crop_index=idx - 1)
        draw = ImageDraw.Draw(frame)

        # 1. Sleek Top-Left Live Badge
        badge_text = f"BREAKING • {category.upper()}"
        b_box = draw.textbbox((0, 0), badge_text, font=font_top_badge)
        bw = b_box[2] - b_box[0]
        bx1, by1 = 50, 75
        bx2, by2 = bx1 + bw + 80, by1 + 64
        draw.rounded_rectangle([(bx1, by1), (bx2, by2)], radius=14, fill=(15, 23, 42, 230), outline=accent, width=2)
        # Red Live Broadcast Circle
        draw.ellipse([(bx1 + 22, by1 + 22), (bx1 + 42, by1 + 42)], fill=(239, 68, 68))
        draw.text((bx1 + 52, by1 + 16), badge_text, fill=(255, 255, 255), font=font_top_badge)

        # Top-Right Watermark
        draw.rounded_rectangle([(width - 360, by1), (width - 50, by2)], radius=14, fill=(15, 23, 42, 200), outline=(51, 65, 85), width=1)
        draw.text((width - 335, by1 + 18), "GLOBALPULSE AI", fill=accent, font=font_top_channel)

        # 2. Large Bold Pop-Up Captions (Lower-Middle: y=1340 to 1640)
        draw_sentence_captions(
            draw=draw,
            sentence=sentence,
            canvas_w=width,
            canvas_h=height,
            font=font_caption,
            accent_color=neon_keywords_color,
            max_chars=24,
            is_shorts=True
        )

        # 3. Clean Bottom Bar (y=1810 to 1860)
        draw.line([(60, 1800), (width - 60, 1800)], fill=(51, 65, 85, 180), width=1)
        bottom_text = "● LIVE WIRE • @GloblePulseAi • GLOBALPULSE AI"
        b_box = draw.textbbox((0, 0), bottom_text, font=font_bottom)
        bw = b_box[2] - b_box[0]
        draw.text(((width - bw) // 2, 1825), bottom_text, fill=(203, 213, 225), font=font_bottom)

        slide_file = output_dir / f"slide_{idx}_{article_id}.png"
        frame.save(slide_file, "PNG")
        slide_paths.append(slide_file)
        del frame, draw
        gc.collect()

    return slide_paths

def generate_widescreen_long_slides(
    title: str,
    category: str,
    summary: str,
    content: str,
    output_dir: Path,
    article_id: int,
    scene_images: List[Path],
    spoken_sentences: Optional[List[str]] = None
) -> List[Path]:
    """
    Generates 6 to 8 full-bleed cinematic widescreen frames (1280x720) for 16:9 Long-Form videos:
    - 100% photo-rich dynamic visuals (no static PowerPoint cards or fake stat boxes).
    - Dynamic zoom & crop variations per scene.
    - Sleek top-left live broadcast badge (🔴 BREAKING • {category.upper()}).
    - Top-right verified channel branding (@GloblePulseAi • YouTube).
    - High-contrast broadcast subtitles in lower third with neon keyword highlights!
    - Clean bottom bar (@GloblePulseAi • GlobalPulse AI).
    """
    import gc
    width, height = 1280, 720
    accent = CATEGORY_ACCENTS.get(category, (6, 182, 212))
    slide_paths: List[Path] = []
    clean_domain = get_clean_domain(PUBLIC_SITE_URL)

    if not spoken_sentences:
        spoken_sentences = segment_script_into_sentences(content or summary, fallback_title=title, count=7)

    font_top_badge = get_font(18, bold=True)
    font_top_channel = get_font(18, bold=True)
    font_caption = get_font(34, bold=True)
    font_bottom = get_font(17, bold=True)

    neon_keywords_color = (250, 204, 21) if category == "Global Sports" else (34, 211, 238)

    for idx, sentence in enumerate(spoken_sentences):
        photo_path = scene_images[idx % len(scene_images)]

        # 1. Full-bleed cinematic background frame with zoom/crop variation + dark gradient vignette
        frame = create_fullbleed_cinematic_frame(
            photo_path=photo_path,
            target_w=width,
            target_h=height,
            zoom_crop_index=idx
        )
        draw = ImageDraw.Draw(frame)

        # 2. Sleek Top-Left Live Badge
        badge_text = f"BREAKING • {category.upper()}"
        b_box = draw.textbbox((0, 0), badge_text, font=font_top_badge)
        bw = b_box[2] - b_box[0]
        bh = b_box[3] - b_box[1]
        draw.rounded_rectangle([(40, 26), (40 + bw + 52, 26 + bh + 18)], radius=8, fill=(15, 23, 42, 220), outline=accent, width=2)
        draw.ellipse([(52, 36), (66, 50)], fill=(239, 68, 68))
        draw.text((74, 34), badge_text, fill=(255, 255, 255), font=font_top_badge)

        # Top-Right Channel Pill
        channel_text = "@GloblePulseAi • YOUTUBE"
        ch_box = draw.textbbox((0, 0), channel_text, font=font_top_channel)
        ch_w = ch_box[2] - ch_box[0]
        ch_h = ch_box[3] - ch_box[1]
        ch_x = width - 40 - ch_w - 28
        draw.rounded_rectangle([(ch_x, 26), (width - 40, 26 + ch_h + 18)], radius=8, fill=(15, 23, 42, 220), outline=(220, 38, 38), width=2)
        draw.text((ch_x + 14, 34), channel_text, fill=(248, 113, 113), font=font_top_channel)

        # 3. High-Contrast Lower-Third Broadcast Subtitles with Neon Accent Keywords
        draw_sentence_captions(
            draw=draw,
            sentence=sentence,
            canvas_w=width,
            canvas_h=height,
            font=font_caption,
            accent_color=neon_keywords_color,
            max_chars=46,
            is_shorts=False
        )

        # 4. Clean Bottom Bar
        draw.line([(40, 672), (width - 40, 672)], fill=(51, 65, 85, 180), width=1)
        bottom_text = f"● LIVE INTELLIGENCE • @GloblePulseAi • GLOBALPULSE AI • WWW.{clean_domain.upper()}"
        bot_box = draw.textbbox((0, 0), bottom_text, font=font_bottom)
        bot_w = bot_box[2] - bot_box[0]
        draw.text(((width - bot_w) // 2, 686), bottom_text, fill=(203, 213, 225), font=font_bottom)

        slide_file = output_dir / f"widescreen_{idx}_{article_id}.png"
        frame.save(slide_file, "PNG")
        slide_paths.append(slide_file)
        del frame, draw
        gc.collect()

    return slide_paths

def compose_video(
    article_id: int,
    title: str,
    category: str,
    youtube_script: str,
    summary: str,
    content: str = "",
    image_url: Optional[str] = None,
    video_format: str = "long"
) -> Dict[str, Any]:
    """
    Renders an authentic, broadcast-grade MP4 video:
    - video_format='long' (Default): 16:9 widescreen 720p HD (1280x720) with cinematic full-bleed frames & captions
    - video_format='short': 9:16 vertical (1080x1920) 60-second YouTube Short with dynamic TikTok-style captions
    Optimized strictly for Render 512MB RAM with single-threaded ultrafast FFmpeg encoding and gTTS fallback.
    """
    import gc
    is_long = (str(video_format).lower() == "long")

    if is_long:
        clean_text = build_long_form_narration(title, category, summary, content, youtube_script)
        video_filename = f"long_article_{article_id}.mp4"
        audio_filename = f"voiceover_long_article_{article_id}.mp3"
    else:
        clean_text = clean_script_for_voiceover(youtube_script, fallback_title=title, fallback_summary=summary)
        video_filename = f"short_article_{article_id}.mp4"
        audio_filename = f"voiceover_article_{article_id}.mp3"

    # Phonetic fix for accurate TTS pronunciation & trailing pause buffer to prevent audio cutoff
    tts_text = prepare_text_for_tts(clean_text)

    output_audio_path = STATIC_VIDEOS_DIR / audio_filename
    output_video_path = STATIC_VIDEOS_DIR / video_filename
    temp_raw_img = STATIC_VIDEOS_DIR / f"raw_img_{article_id}.jpg"
    concat_list_file = STATIC_VIDEOS_DIR / f"concat_{article_id}.txt"

    # Step A: Synthesize Speech Voiceover (edge-tts -> gTTS -> Windows SAPI fallback)
    audio_ok = False
    try:
        audio_ok = run_async_in_isolated_thread(synthesize_edge_tts, tts_text, output_audio_path, timeout=60.0)
    except Exception as e:
        print(f"[Video Generator] Isolated edge-tts execution error: {e}")
        audio_ok = False

    if not audio_ok:
        print("[Video Generator] edge-tts unavailable. Falling back to bulletproof Google TTS (gTTS)...")
        audio_ok = synthesize_gtts(tts_text, output_audio_path)

    if not audio_ok:
        print("[Video Generator] Falling back to Windows SAPI System TTS...")
        audio_ok = synthesize_system_tts(tts_text, output_audio_path)

    if not audio_ok or not output_audio_path.exists() or output_audio_path.stat().st_size < 5000:
        raise RuntimeError(f"Failed to generate valid voiceover audio for article {article_id}")

    audio_duration = probe_media_duration(output_audio_path)
    if audio_duration < 5.0:
        raise RuntimeError(f"Voiceover duration too short ({audio_duration:.2f}s). Must be >= 5.0s.")

    print(f"[Video Generator] Audio voiceover synthesized: {audio_duration:.2f} seconds ({output_audio_path.stat().st_size} bytes)")

    # Step B: Segment Script into 6-8 Punchy Spoken Sentences & Source Visual HD Photos
    spoken_sentences = segment_script_into_sentences(clean_text, fallback_title=title, count=7)
    required_scene_count = max(len(spoken_sentences), 4)

    scene_images = fetch_scene_images(
        title=title,
        category=category,
        summary_points=summary.split("\n"),
        main_image_url=image_url,
        article_id=article_id,
        output_dir=STATIC_VIDEOS_DIR,
        count=required_scene_count,
        is_widescreen=is_long
    )

    # Generate slides: 16:9 widescreen chapters for long-form, or 9:16 vertical cards for shorts
    if is_long:
        slides = generate_widescreen_long_slides(
            title=title,
            category=category,
            summary=summary,
            content=content,
            output_dir=STATIC_VIDEOS_DIR,
            article_id=article_id,
            scene_images=scene_images,
            spoken_sentences=spoken_sentences
        )
        slide_dur = max(audio_duration / float(len(slides)), 3.5)
    else:
        slides = generate_news_slides(
            title=title,
            category=category,
            summary=summary,
            output_dir=STATIC_VIDEOS_DIR,
            article_id=article_id,
            scene_images=scene_images,
            spoken_sentences=spoken_sentences
        )
        slide_dur = max(audio_duration / float(len(slides)), 2.8)

    # Step C & D: Compile Video with Smooth Transitions (xfade motion with concat fallback)
    fade_duration = 0.5 if is_long else 0.4
    fade_out_start = max(audio_duration - fade_duration, 0.0)
    fps_val = "24" if not is_long else "15"
    scale_w, scale_h = (1280, 720) if is_long else (1080, 1920)
    fmt_label = "16:9 Widescreen HD (1280x720)" if is_long else "9:16 Shorts (1080x1920)"
    ffmpeg_timeout = 360 if is_long else 180
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

    compiled_successfully = False

    # Attempt 1: Smooth Crossfade Transitions via FFmpeg xfade filter
    if len(slides) >= 2:
        try:
            trans_dur = 0.5
            clip_dur = slide_dur + trans_dur
            xfade_inputs = []
            for s in slides:
                xfade_inputs.extend(["-loop", "1", "-t", f"{clip_dur:.2f}", "-i", str(s.resolve())])
            xfade_inputs.extend(["-i", str(output_audio_path.resolve())])

            filter_parts = []
            last_label = "0:v"
            curr_offset = slide_dur - trans_dur
            transitions_list = ["fade", "smoothleft", "wipeleft", "fadeblack", "smoothright"]
            for i in range(1, len(slides)):
                next_label = f"v{i}"
                trans_type = transitions_list[(i - 1) % len(transitions_list)]
                filter_parts.append(
                    f"[{last_label}][{i}:v]xfade=transition={trans_type}:duration={trans_dur:.2f}:offset={curr_offset:.2f}[{next_label}]"
                )
                last_label = next_label
                curr_offset += slide_dur - trans_dur

            filter_parts.append(
                f"[{last_label}]scale={scale_w}:{scale_h},fps={fps_val},format=yuv420p,"
                f"fade=t=in:st=0:d={fade_duration},"
                f"fade=t=out:st={fade_out_start:.2f}:d={fade_duration}[vf]"
            )
            filter_str = ";".join(filter_parts)

            xfade_cmd = [
                ffmpeg_exe, "-y",
                "-threads", "1"
            ] + xfade_inputs + [
                "-filter_complex", filter_str,
                "-map", "[vf]",
                "-map", f"{len(slides)}:a",
                "-c:v", "libx264",
                "-preset", "ultrafast",
                "-r", fps_val,
                "-profile:v", "main",
                "-pix_fmt", "yuv420p",
                "-c:a", "aac",
                "-b:a", "128k",
                "-ar", "44100",
                "-ac", "2",
                "-movflags", "+faststart",
                "-shortest",
                str(output_video_path)
            ]

            print(f"[Video Generator] Compiling {fmt_label} MP4 with smooth motion transitions ({len(slides)} slides, {trans_dur}s xfade): {output_video_path.name}...")
            xfade_res = subprocess.run(xfade_cmd, capture_output=True, text=True, cwd=str(STATIC_VIDEOS_DIR), timeout=ffmpeg_timeout)
            if xfade_res.returncode == 0 and output_video_path.exists() and output_video_path.stat().st_size > 100_000:
                compiled_successfully = True
                print(f"[Video Generator] Motion xfade compilation successful for {output_video_path.name}")
            else:
                print(f"[Video Generator Notice] xfade compilation returned code {xfade_res.returncode}; switching to concat demuxer fallback.")
        except Exception as xfade_err:
            print(f"[Video Generator Notice] xfade transition compilation note: {xfade_err}; engaging concat fallback.")

    # Attempt 2 (Fallback): Concat demuxer with fade-in and fade-out
    if not compiled_successfully:
        with open(concat_list_file, "w", encoding="utf-8") as f:
            f.write("ffconcat version 1.0\n")
            for s in slides:
                f.write(f"file '{s.resolve().as_posix()}'\n")
                f.write(f"duration {slide_dur:.2f}\n")
            f.write(f"file '{slides[-1].resolve().as_posix()}'\n")

        scale_filter = f"scale={scale_w}:{scale_h},"
        video_filter = (
            f"{scale_filter}fps={fps_val},format=yuv420p,"
            f"fade=t=in:st=0:d={fade_duration},"
            f"fade=t=out:st={fade_out_start:.2f}:d={fade_duration}"
        )

        cmd = [
            ffmpeg_exe, "-y",
            "-threads", "1",
            "-f", "concat",
            "-safe", "0",
            "-i", str(concat_list_file),
            "-i", str(output_audio_path),
            "-vf", video_filter,
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-r", fps_val,
            "-profile:v", "main",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "128k",
            "-ar", "44100",
            "-ac", "2",
            "-movflags", "+faststart",
            "-shortest",
            str(output_video_path)
        ]

        print(f"[Video Generator] Compiling {fmt_label} MP4 with concat demuxer ({len(slides)} photo scenes): {output_video_path.name}...")
        run_res = subprocess.run(cmd, capture_output=True, text=True, cwd=str(STATIC_VIDEOS_DIR), timeout=ffmpeg_timeout)
        if run_res.returncode != 0:
            print(f"[Video Generator ERROR] FFmpeg encoding failed (code {run_res.returncode}):")
            print(run_res.stderr)
            raise RuntimeError(f"FFmpeg encoding failed for article {article_id}: {run_res.stderr[-400:]}")

    # Step E: Validation Gate
    try:
        val_res = validate_generated_video_file(
            output_video_path,
            is_long=is_long,
            min_duration=15.0 if is_long else 5.0
        )
    except Exception as val_err:
        print(f"[Video Generator Validation Gate FAILED] Generated video {output_video_path.name} failed validation:")
        print(traceback.format_exc())
        raise

    video_size = val_res["file_size_bytes"]
    final_duration = val_res["duration_seconds"]

    print(f"[Video Generator SUCCESS] Verified & saved {output_video_path.name} ({video_size:,} bytes, {final_duration:.2f}s duration)")

    # Clean up temporary concat, slide, and scene image artifacts
    concat_list_file.unlink(missing_ok=True)
    temp_raw_img.unlink(missing_ok=True)
    for s in slides:
        s.unlink(missing_ok=True)
    for sc in scene_images:
        sc.unlink(missing_ok=True)
    gc.collect()

    return {
        "success": True,
        "video_path": f"/static/videos/{output_video_path.name}",
        "audio_path": f"/static/videos/{output_audio_path.name}",
        "runtime_seconds": round(final_duration, 1),
        "file_size_bytes": video_size,
        "aspect_ratio": "16:9 (Horizontal Long-Form HD)" if is_long else "9:16 (Vertical YouTube Shorts)",
        "resolution": "1280x720" if is_long else "1080x1920",
        "format": "long" if is_long else "short"
    }

def compose_long_video(
    article_id: int,
    title: str,
    category: str,
    youtube_script: str,
    summary: str,
    content: str = "",
    image_url: Optional[str] = None
) -> Dict[str, Any]:
    """Helper entry point for 16:9 widescreen long-form HD video compilation."""
    try:
        return compose_video(
            article_id=article_id,
            title=title,
            category=category,
            youtube_script=youtube_script,
            summary=summary,
            content=content,
            image_url=image_url,
            video_format="long"
        )
    except Exception as e:
        print(f"[Video Generator Long Video ERROR] Failed composing long video for article #{article_id} ('{title}'): {e}")
        print(traceback.format_exc())
        raise

def compose_short_video(
    article_id: int,
    title: str,
    category: str,
    youtube_script: str,
    summary: str,
    content: str = "",
    image_url: Optional[str] = None,
    video_format: str = "short"
) -> Dict[str, Any]:
    """
    Dedicated entry point for 9:16 vertical YouTube Shorts video compilation.
    """
    try:
        return compose_video(
            article_id=article_id,
            title=title,
            category=category,
            youtube_script=youtube_script,
            summary=summary,
            content=content,
            image_url=image_url,
            video_format="short" if video_format != "long" else "long"
        )
    except Exception as e:
        print(f"[Video Generator ERROR] Video generation failed for article #{article_id}: {e}")
        print(traceback.format_exc())
        raise
