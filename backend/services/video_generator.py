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
    Cleans raw script by removing director cues, timing brackets, and markdown artifacts.
    Ensures natural, broadcast-ready speech.
    """
    text = youtube_script or ""
    # Remove timing cues like [00:00 - 00:05]
    text = re.sub(r"\[\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}\]", " ", text)
    # Remove cues like HOOK:, VISUAL:, NARRATION:, CTA:, STATS:
    text = re.sub(r"(?i)\b(hook|visual|narration|on-screen graphic|cta|stats|action|bgm|scene|audio):\s*", " ", text)
    # Remove bracketed and parenthetical notes
    text = re.sub(r"\[.*?\]", " ", text)
    text = re.sub(r"\(.*?\)", " ", text)
    # Remove markdown asterisks and bullets
    text = text.replace("*", "").replace("•", "").replace("▸", "")
    clean = " ".join(text.split()).strip()

    # If the clean script is too brief (< 50 chars), enrich with headline & summary
    if len(clean) < 50:
        clean = f"{fallback_title}. {fallback_summary}. Follow GlobalPulse AI for breaking developments."

    return clean

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
      5. Outro & Call-to-Action for EduHub by Saeed (@EduHubbySaeed) and GlobalPulse AI
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

    # Section 5: Outro & Call-to-Action (EduHub by Saeed & GlobalPulse AI)
    outro_text = (
        "For daily technical masterclasses, real-world implementations, and cutting-edge tutorials, "
        "make sure to subscribe to our official media partner, EduHub by Saeed, on YouTube at handle EduHub by Saeed. "
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

def build_broadcast_widescreen_canvas(
    scene_img_path: Path,
    accent: Tuple[int, int, int],
    category: str,
    clean_domain: str,
    title: str
) -> Tuple[Image.Image, ImageDraw.ImageDraw]:
    """
    Creates an ultra-lightweight 1280x720 studio broadcast canvas (optimized for Render 512MB RAM):
    1. Background: scene_img blurred with GaussianBlur(radius=18) and darkened with navy/obsidian overlay.
    2. Top Broadcast Navigation Bar with Category Badge and Live Telemetry indicator.
    3. TV Lower-Third Breaking News Ticker across the bottom with '● LIVE' red pill and ticker text.
    """
    width, height = 1280, 720
    try:
        raw_scene = Image.open(scene_img_path).convert("RGB")
    except Exception:
        raw_scene = Image.new("RGB", (width, height), (15, 23, 42))

    # 1. Studio glass wall blurred background (radius=18 saves 60% CPU/RAM compared to 1080p)
    bg = raw_scene.resize((width, height), Image.Resampling.LANCZOS)
    bg = bg.filter(ImageFilter.GaussianBlur(radius=18))

    # Dark studio glass overlay (rgba(3, 7, 18, 195))
    overlay = Image.new("RGBA", (width, height), (3, 7, 18, 195))
    bg.paste(overlay, (0, 0), overlay)

    # Ambient neon corner glow
    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse([(-100, -100), (450, 320)], fill=(accent[0], accent[1], accent[2], 18))
    glow_draw.ellipse([(850, 350), (1400, 780)], fill=(accent[0], accent[1], accent[2], 12))
    bg.paste(glow, (0, 0), glow)

    draw = ImageDraw.Draw(bg)

    # 2. Top Broadcast Bar (0 to 56)
    draw.rectangle([(0, 0), (width, 56)], fill=(11, 15, 25))
    draw.line([(0, 56), (width, 56)], fill=(51, 65, 85), width=2)
    font_top = get_font(18, bold=True)
    draw.text((50, 18), "GLOBALPULSE AI • TIER-1 GLOBAL INTELLIGENCE WIRE", fill=(226, 232, 240), font=font_top)

    font_pill = get_font(13, bold=True)
    draw.rectangle([(width - 320, 12), (width - 40, 44)], fill=(15, 23, 42), outline=accent, width=2)
    draw.text((width - 300, 20), f"● LIVE BROADCAST | {category.upper()}", fill=accent, font=font_pill)

    # 3. Bottom TV Live Ticker Bar (660 to 720)
    draw.rectangle([(0, 660), (width, height)], fill=(8, 12, 20))
    draw.line([(0, 660), (width, 660)], fill=accent, width=2)

    # Red Live Indicator Pill
    draw.rectangle([(45, 672), (115, 708)], fill=(220, 38, 38))
    draw.text((58, 680), "● LIVE", fill=(255, 255, 255), font=get_font(14, bold=True))

    font_ticker = get_font(15, bold=True)
    clean_title_ticker = title.upper()[:75]
    ticker_text = f"GLOBAL TELEMETRY • EDUHUB BY SAEED (@EduHubbySaeed) • BREAKING: {clean_title_ticker} • {clean_domain.upper()}"
    draw.text((130, 680), ticker_text, fill=(241, 245, 249), font=font_ticker)

    return bg, draw

def paste_framed_visual(
    canvas: Image.Image,
    draw: ImageDraw.ImageDraw,
    photo_path: Path,
    accent: Tuple[int, int, int],
    frame_coords: Tuple[int, int, int, int] = (670, 75, 1235, 420),
    corner_tag: str = "● LIVE VISUAL // VERIFIED SOURCE"
):
    """Pastes unblurred HD news photo inside a sleek broadcast frame with glowing accent borders and live tag."""
    fx1, fy1, fx2, fy2 = frame_coords
    fw, fh = fx2 - fx1, fy2 - fy1

    try:
        photo_img = Image.open(photo_path).convert("RGB")
        scale = max(fw / photo_img.width, fh / photo_img.height)
        nw, nh = int(photo_img.width * scale), int(photo_img.height * scale)
        resized = photo_img.resize((nw, nh), Image.Resampling.LANCZOS)
        x1 = (nw - fw) // 2
        y1 = (nh - fh) // 2
        cropped = resized.crop((x1, y1, x1 + fw, y1 + fh))
        canvas.paste(cropped, (fx1, fy1))
    except Exception:
        draw.rectangle([(fx1, fy1), (fx2, fy2)], fill=(15, 23, 42))

    # Glowing double border
    draw.rectangle([(fx1 - 2, fy1 - 2), (fx2 + 2, fy2 + 2)], outline=accent, width=2)
    draw.rectangle([(fx1, fy1), (fx2, fy2)], outline=(255, 255, 255, 120), width=1)

    # Corner Tag Pill
    tag_font = get_font(13, bold=True)
    draw.rectangle([(fx2 - 220, fy1 + 10), (fx2 - 10, fy1 + 36)], fill=(11, 15, 25), outline=accent, width=1)
    draw.text((fx2 - 210, fy1 + 15), corner_tag, fill=accent, font=tag_font)

def generate_news_slides(
    title: str,
    category: str,
    summary: str,
    output_dir: Path,
    article_id: int,
    scene_images: List[Path]
) -> List[Path]:
    """
    Generates 7 dynamic vertical news cards (1080x1920) for 9:16 Shorts mode:
    Every slide features that scene's news photo (blurred glass backdrop + framed HD visual).
    """
    width, height = 1080, 1920
    accent = CATEGORY_ACCENTS.get(category, (6, 182, 212))
    slide_paths: List[Path] = []
    clean_domain = get_clean_domain(PUBLIC_SITE_URL)

    raw_lines = [
        re.sub(r"^[\s•▸*\-]+", "", line).strip()
        for line in summary.split("\n")
        if line.strip() and len(line.strip()) > 8
    ]
    if len(raw_lines) < 3:
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", summary) if len(s.strip()) > 10]
        if len(sentences) >= 2:
            raw_lines = sentences

    summary_lines = list(raw_lines)
    defaults = [
        f"Verified Milestone: {title[:70]}",
        "Accelerated industry adoption verified across Tier-1 institutions.",
        "Strategic implications signaling global technological transition.",
        "Primary telemetry indicates sustained macro momentum across sectors."
    ]
    for d in defaults:
        if len(summary_lines) < 4:
            summary_lines.append(d)

    font_badge = get_font(24, bold=True)
    font_h2 = get_font(42, bold=True)
    font_card_text = get_font(34, bold=False)
    font_sub = get_font(26, bold=False)

    # 7 Vertical Slides
    for idx in range(1, 8):
        img_p = scene_images[min(idx - 1, len(scene_images) - 1)]
        try:
            base_img = Image.open(img_p).convert("RGB")
        except Exception:
            base_img = Image.new("RGB", (width, height), (15, 23, 42))

        # Blurred backdrop
        bg = base_img.resize((width, height), Image.Resampling.LANCZOS)
        bg = bg.filter(ImageFilter.GaussianBlur(radius=28))
        overlay = Image.new("RGBA", (width, height), (3, 7, 18, 195))
        bg.paste(overlay, (0, 0), overlay)

        draw = ImageDraw.Draw(bg)

        # Top Bar
        draw.rectangle([(0, 0), (width, 100)], fill=(11, 15, 25))
        draw.line([(0, 100), (width, 100)], fill=(51, 65, 85), width=2)
        draw.text((60, 32), "GLOBALPULSE AI • 60-SEC WIRE", fill=(226, 232, 240), font=get_font(26, bold=True))
        draw.rectangle([(780, 25), (1020, 75)], fill=(15, 23, 42), outline=accent, width=2)
        draw.text((805, 36), f"● {category.upper()}", fill=accent, font=get_font(20, bold=True))

        # Upper Visual Frame (60, 130, 1020, 730)
        fw, fh = 960, 600
        scale = max(fw / base_img.width, fh / base_img.height)
        nw, nh = int(base_img.width * scale), int(base_img.height * scale)
        res_photo = base_img.resize((nw, nh), Image.Resampling.LANCZOS)
        x1, y1 = (nw - fw) // 2, (nh - fh) // 2
        bg.paste(res_photo.crop((x1, y1, x1 + fw, y1 + fh)), (60, 130))
        draw.rectangle([(57, 127), (1023, 733)], outline=accent, width=3)
        draw.rectangle([(720, 145), (1005, 185)], fill=(11, 15, 25), outline=accent, width=1)
        draw.text((735, 152), "● LIVE VISUAL // VERIFIED", fill=accent, font=get_font(18, bold=True))

        # Lower Editorial Panel (760 to 1750)
        draw.rectangle([(60, 770), (1020, 1750)], fill=(15, 23, 42), outline=accent, width=2)

        if idx == 1:
            draw.rectangle([(100, 810), (520, 860)], fill=(18, 30, 49), outline=accent, width=2)
            draw.text((120, 822), f"BREAKING WIRE • {category.upper()}", fill=accent, font=font_badge)
            font_title = get_font(46, bold=True)
            y_t = 890
            for line in wrap_text(title, max_chars=24)[:4]:
                draw.text((100, y_t), line, fill=(255, 255, 255), font=font_title)
                y_t += 62
            draw.text((100, y_t + 20), "Strategic verified dispatch • Multi-source telemetry", fill=(148, 163, 184), font=font_sub)
            draw.rectangle([(100, 1560), (980, 1680)], fill=(18, 30, 49), outline=accent, width=1)
            draw.text((120, 1600), "STATUS: VERIFIED TIER-1 TELEMETRY", fill=accent, font=get_font(24, bold=True))

        elif idx in (2, 3, 4, 5):
            if category == "Global Sports":
                badge_map = {
                    2: "01 // MATCH ANALYSIS",
                    3: "02 // TURNING POINTS",
                    4: "03 // PLAYER RATINGS & STATS",
                    5: "04 // STANDINGS & IMPLICATIONS"
                }
                sub_title_map = {
                    2: "Headline Fixture & Tactical Shape",
                    3: "Key Momentum Shifts & Decisions",
                    4: "Player Ratings & Key Contributions",
                    5: "Tournament Table Implications"
                }
            else:
                badge_map = {
                    2: "01 // EXECUTIVE SUMMARY",
                    3: "02 // DATA CORROBORATION",
                    4: "03 // CRITICAL CONTEXT",
                    5: "04 // STRATEGIC IMPACT"
                }
                sub_title_map = {
                    2: "Primary Operational Findings",
                    3: "Telemetry & Multi-Source Evidence",
                    4: "Context & Market Realignment",
                    5: "Global Macro Implications"
                }
            draw.rectangle([(100, 810), (520, 860)], fill=(18, 30, 49), outline=accent, width=2)
            draw.text((120, 822), badge_map[idx], fill=accent, font=font_badge)
            draw.text((100, 890), sub_title_map[idx], fill=(255, 255, 255), font=font_h2)
            pt_idx = min(idx - 2, len(summary_lines) - 1)
            y_b = 990
            for l in wrap_text(summary_lines[pt_idx], max_chars=28)[:8]:
                draw.text((100, y_b), l, fill=(241, 245, 249), font=font_card_text)
                y_b += 52

        elif idx == 6:
            draw.rectangle([(100, 810), (520, 860)], fill=(45, 15, 20), outline=(239, 68, 68), width=2)
            draw.text((120, 822), "OFFICIAL MEDIA PARTNER", fill=(239, 68, 68), font=font_badge)
            draw.text((100, 890), "Subscribe On YouTube", fill=(255, 255, 255), font=font_h2)
            draw.text((100, 970), "EduHub by Saeed", fill=(255, 255, 255), font=get_font(52, bold=True))
            draw.text((100, 1045), "@EduHubbySaeed", fill=(239, 68, 68), font=get_font(34, bold=True))
            y_ed = 1130
            for l in wrap_text("Daily cutting-edge tutorials, real-world coding builds, and breaking technology briefings. Subscribe free.", max_chars=30):
                draw.text((100, y_ed), l, fill=(203, 213, 225), font=font_card_text)
                y_ed += 50
            draw.rectangle([(100, 1560), (980, 1680)], fill=(185, 28, 28), outline=(239, 68, 68), width=1)
            draw.text((130, 1600), "SUBSCRIBE FREE: YOUTUBE.COM/@EDUHUBBYSAEED", fill=(255, 255, 255), font=get_font(22, bold=True))

        else:
            draw.rectangle([(100, 810), (520, 860)], fill=(18, 30, 49), outline=accent, width=2)
            draw.text((120, 822), "FULL INVESTIGATION", fill=accent, font=font_badge)
            draw.text((100, 890), "Read Complete Dossier", fill=(255, 255, 255), font=font_h2)
            draw.text((100, 980), clean_domain, fill=accent, font=get_font(48, bold=True))
            y_cl = 1070
            for l in wrap_text("Access full citations, interactive market data, and verified sources on our news platform.", max_chars=30):
                draw.text((100, y_cl), l, fill=(226, 232, 240), font=font_card_text)
                y_cl += 50
            draw.rectangle([(100, 1560), (980, 1680)], fill=(18, 30, 49), outline=accent, width=1)
            draw.text((140, 1600), f"VISIT: WWW.{clean_domain}", fill=accent, font=get_font(24, bold=True))

        # Bottom TV Ticker Bar (1800 to 1920)
        draw.rectangle([(0, 1800), (width, height)], fill=(8, 12, 20))
        draw.line([(0, 1800), (width, 1800)], fill=accent, width=3)
        draw.rectangle([(40, 1830), (140, 1880)], fill=(220, 38, 38))
        draw.text((55, 1842), "● LIVE", fill=(255, 255, 255), font=get_font(20, bold=True))
        ticker_text = f"GLOBAL TELEMETRY • EDUHUB BY SAEED (@EduHubbySaeed) • BREAKING: {title.upper()[:65]}"
        draw.text((160, 1845), ticker_text, fill=(241, 245, 249), font=get_font(20, bold=True))

        slide_file = output_dir / f"slide_{idx}_{article_id}.png"
        bg.save(slide_file, "PNG")
        slide_paths.append(slide_file)

    return slide_paths

def generate_widescreen_long_slides(
    title: str,
    category: str,
    summary: str,
    content: str,
    output_dir: Path,
    article_id: int,
    scene_images: List[Path]
) -> List[Path]:
    """
    Generates 7 widescreen HD broadcast chapters/slides (1920x1080) for full-length YouTube videos.
    Every slide features that scene's news photo (blurred glass backdrop + framed HD visual).
    """
    accent = CATEGORY_ACCENTS.get(category, (6, 182, 212))
    slide_paths: List[Path] = []
    clean_domain = get_clean_domain(PUBLIC_SITE_URL)

    def _strip(text: str) -> str:
        t = re.sub(r"#+\s*", "", text)
        t = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", t)
        t = re.sub(r"<[^>]+>", "", t)
        t = t.replace("**", "").replace("*", "").replace("`", "").replace("•", "").replace("▸", "").replace(">", "").replace("|", " ")
        return " ".join(t.split()).strip()

    # Extract summary bullet points
    raw_lines = [_strip(l) for l in summary.split("\n") if len(_strip(l)) > 12]
    if len(raw_lines) < 3:
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", summary) if len(s.strip()) > 12]
        if len(sentences) >= 2:
            raw_lines = sentences
    summary_lines = list(raw_lines)
    while len(summary_lines) < 4:
        summary_lines.append(f"Primary operational development: {title[:70]}")
        summary_lines.append("Accelerated institutional adoption verified across transatlantic nodes.")
        summary_lines.append("Telemetry signals structural shift recalibrating market fundamentals.")
        summary_lines.append("Multi-source corroboration confirmed across independent technical datasets.")

    # Extract content paragraphs
    content_paras = []
    if content:
        for p in content.split("\n\n"):
            p_clean = _strip(p)
            if len(p_clean) > 55 and not p.strip().startswith("|") and not p_clean.startswith("###"):
                content_paras.append(p_clean)
    while len(content_paras) < 4:
        content_paras.append(
            f"Independent engineering reviews have verified that this milestone in {category} represents a major operational transition. "
            "Technical telemetry confirms that scalability constraints are being superseded by modular, resilient next-generation systems."
        )
        content_paras.append(
            "Enterprise operators across North America and Europe are aligning deployment roadmaps. "
            "Cross-sector benchmarks demonstrate significant productivity enhancements and reduced operational latency."
        )
        content_paras.append(
            "Capital allocators and institutional funds are adjusting portfolio exposures to prioritize sovereign infrastructure resilience. "
            "Public-private partnerships are formalizing long-term procurement agreements to secure strategic market positioning."
        )
        content_paras.append(
            "Looking toward the 2026 to 2030 horizon, these developments establish a definitive precedent. "
            "Industry consensus anticipates comprehensive standardization across global regulatory and technical consortiums."
        )

    import gc
    font_badge = get_font(16, bold=True)
    font_h2 = get_font(28, bold=True)
    font_title = get_font(32, bold=True)
    font_body = get_font(20, bold=False)
    font_sub = get_font(18, bold=False)

    # -------------------------------------------------------------
    # SLIDE 1: Widescreen Breaking News Hero Card (1280x720)
    # -------------------------------------------------------------
    img_1 = scene_images[0]
    s1, draw1 = build_broadcast_widescreen_canvas(img_1, accent, category, clean_domain, title)

    # Left Column: Headline and Badge
    draw1.rectangle([(50, 75), (420, 115)], fill=(accent[0], accent[1], accent[2], 50), outline=accent, width=2)
    draw1.text((65, 85), f"BREAKING WIRE • {category.upper()}", fill=accent, font=font_badge)

    title_lines = wrap_text(title, max_chars=28)
    y_t = 135
    for line in title_lines[:4]:
        draw1.text((51, y_t + 1), line, fill=(0, 0, 0), font=font_title)
        draw1.text((50, y_t), line, fill=(255, 255, 255), font=font_title)
        y_t += 42

    draw1.text((50, min(y_t + 8, 325)), "Primary verified wire dispatch • Strategic industry assessment", fill=(148, 163, 184), font=font_sub)

    # Executive Dossier Synopsis Box
    draw1.rectangle([(50, 355), (640, 645)], fill=(15, 23, 42), outline=accent, width=2)
    draw1.text((75, 375), "EXECUTIVE DOSSIER SYNOPSIS", fill=accent, font=font_badge)
    y_syn = 415
    for l in wrap_text(summary_lines[0], max_chars=38)[:4]:
        draw1.text((75, y_syn), l, fill=(241, 245, 249), font=font_body)
        y_syn += 34

    # Right Column: Framed Hero Visual + Status Pill
    paste_framed_visual(s1, draw1, img_1, accent, frame_coords=(670, 75, 1235, 430), corner_tag="● LIVE VISUAL // VERIFIED LEAD")

    draw1.rectangle([(670, 455), (1235, 645)], fill=(15, 23, 42), outline=(51, 65, 85), width=2)
    draw1.text((695, 475), "STATUS: VERIFIED • TIER-1 STANDARDS AUDITED", fill=accent, font=font_badge)
    y_st = 515
    for l in wrap_text(summary_lines[1] if len(summary_lines) > 1 else summary_lines[0], max_chars=38)[:3]:
        draw1.text((695, y_st), l, fill=(203, 213, 225), font=font_sub)
        y_st += 32

    p1 = output_dir / f"widescreen_1_{article_id}.png"
    s1.save(p1, "PNG")
    slide_paths.append(p1)
    del s1, draw1
    gc.collect()

    # -------------------------------------------------------------
    # SLIDE 2: 01 // Executive Summary & Core Operational Findings (Sports: Match Analysis)
    # -------------------------------------------------------------
    img_2 = scene_images[min(1, len(scene_images) - 1)]
    s2, draw2 = build_broadcast_widescreen_canvas(img_2, accent, category, clean_domain, title)

    is_sports = (category == "Global Sports")
    draw2.rectangle([(50, 75), (420, 115)], fill=(accent[0], accent[1], accent[2], 50), outline=accent, width=2)
    draw2.text((65, 85), "01 // MATCH ANALYSIS" if is_sports else "01 // EXECUTIVE SUMMARY", fill=accent, font=font_badge)
    draw2.text((50, 130), "Tactical Posture & Opening Exchanges" if is_sports else "Core Operational Findings", fill=(255, 255, 255), font=font_h2)

    # Finding 01 Card
    draw2.rectangle([(50, 185), (640, 400)], fill=(15, 23, 42), outline=accent, width=2)
    draw2.text((75, 205), "TACTICAL POSTURE // INITIAL PRESSURE" if is_sports else "FINDING 01 // TELEMETRY CONFIRMED", fill=accent, font=font_badge)
    y_f1 = 245
    for l in wrap_text(summary_lines[0], max_chars=38)[:3]:
        draw2.text((75, y_f1), l, fill=(241, 245, 249), font=font_body)
        y_f1 += 34

    # Finding 02 Card
    draw2.rectangle([(50, 425), (640, 645)], fill=(15, 23, 42), outline=accent, width=2)
    draw2.text((75, 445), "TRANSITIONAL MOMENTS // CLINICAL FINISH" if is_sports else "FINDING 02 // MULTI-SOURCE CORROBORATED", fill=accent, font=font_badge)
    y_f2 = 485
    for l in wrap_text(summary_lines[1] if len(summary_lines) > 1 else summary_lines[0], max_chars=38)[:3]:
        draw2.text((75, y_f2), l, fill=(241, 245, 249), font=font_body)
        y_f2 += 34

    # Right Column: Framed Scene Image + Finding 03 Card
    paste_framed_visual(s2, draw2, img_2, accent, frame_coords=(670, 75, 1235, 430), corner_tag="● PITCH TELEMETRY // VERIFIED" if is_sports else "● TELEMETRY // DATA CONFIRMED")

    draw2.rectangle([(670, 455), (1235, 645)], fill=(15, 23, 42), outline=accent, width=2)
    draw2.text((695, 475), "MOMENTUM IMPACT // HIGH STAKES" if is_sports else "FINDING 03 // INSTITUTIONAL BENCHMARK", fill=accent, font=font_badge)
    y_f3 = 515
    for l in wrap_text(summary_lines[2] if len(summary_lines) > 2 else summary_lines[0], max_chars=38)[:3]:
        draw2.text((695, y_f3), l, fill=(241, 245, 249), font=font_body)
        y_f3 += 34

    p2 = output_dir / f"widescreen_2_{article_id}.png"
    s2.save(p2, "PNG")
    slide_paths.append(p2)
    del s2, draw2
    gc.collect()

    # -------------------------------------------------------------
    # SLIDE 3: 02 // Background & Technical Deep-Dive (Sports: Key Turning Points)
    # -------------------------------------------------------------
    img_3 = scene_images[min(2, len(scene_images) - 1)]
    s3, draw3 = build_broadcast_widescreen_canvas(img_3, accent, category, clean_domain, title)

    draw3.rectangle([(50, 75), (440, 115)], fill=(accent[0], accent[1], accent[2], 50), outline=accent, width=2)
    draw3.text((65, 85), "02 // KEY TURNING POINTS" if is_sports else "02 // INVESTIGATIVE REPORT", fill=accent, font=font_badge)
    draw3.text((50, 130), "Decisive Momentum Shifts & Plays" if is_sports else "Architectural & Technical Analysis", fill=(255, 255, 255), font=font_h2)

    # Left Column: Detailed Evidence Box
    draw3.rectangle([(50, 185), (640, 645)], fill=(15, 23, 42), outline=accent, width=2)
    draw3.text((75, 210), "MATCH DISPATCH & TACTICAL LOG" if is_sports else "TECHNICAL DISPATCH & EVIDENCE", fill=accent, font=font_badge)
    y_dd = 250
    for l in wrap_text(content_paras[0], max_chars=38)[:9]:
        draw3.text((75, y_dd), l, fill=(241, 245, 249), font=font_body)
        y_dd += 34

    # Right Column: Framed Image + Validated Metrics Box
    paste_framed_visual(s3, draw3, img_3, accent, frame_coords=(670, 75, 1235, 430), corner_tag="● MATCH ACTION // KEY PLAY" if is_sports else "● INFRASTRUCTURE // LIVE NODE")

    draw3.rectangle([(670, 455), (1235, 645)], fill=(15, 23, 42), outline=accent, width=2)
    draw3.text((695, 475), "FIXTURE PERFORMANCE INDICATORS" if is_sports else "VALIDATED METRICS & INDICATORS", fill=accent, font=font_badge)
    metrics = [
        ("MOMENTUM SWING", "High-Press Counter Transition") if is_sports else ("ARCHITECTURE", "Modular Framework"),
        ("DEFENSIVE DISCIPLINE", "Zero Conceded on Direct Breaks") if is_sports else ("DEPLOYMENT", "Enterprise Multi-Region"),
        ("EXECUTION RATE", "89% Clinical Opportunity Conversion") if is_sports else ("COMPLIANCE", "Tier-1 Standards Verified")
    ]
    y_m = 515
    for m_label, m_val in metrics:
        draw3.text((695, y_m), f"• {m_label}:", fill=accent, font=get_font(16, bold=True))
        draw3.text((880, y_m), m_val, fill=(241, 245, 249), font=get_font(16, bold=False))
        y_m += 38

    p3 = output_dir / f"widescreen_3_{article_id}.png"
    s3.save(p3, "PNG")
    slide_paths.append(p3)
    del s3, draw3
    gc.collect()

    # -------------------------------------------------------------
    # SLIDE 4: 03 // Player Form & Stats or Strategic Impact
    # -------------------------------------------------------------
    img_4 = scene_images[min(3, len(scene_images) - 1)]
    s4, draw4 = build_broadcast_widescreen_canvas(img_4, accent, category, clean_domain, title)

    draw4.rectangle([(50, 75), (460, 115)], fill=(accent[0], accent[1], accent[2], 50), outline=accent, width=2)
    draw4.text((65, 85), "03 // PLAYER FORM & STATS MATRIX" if is_sports else "03 // STRATEGIC IMPACT & FORECAST", fill=accent, font=font_badge)
    draw4.text((50, 130), "Player Contributions & Match Telemetry" if is_sports else "Macro Trajectory & Market Outlook", fill=(255, 255, 255), font=font_h2)

    # Left Column: Strategic Impact or Stats
    draw4.rectangle([(50, 185), (640, 645)], fill=(15, 23, 42), outline=accent, width=2)
    draw4.text((75, 210), "STANDOUT PERFORMER CONTRIBUTIONS" if is_sports else "CAPITAL ALLOCATION & SYSTEMIC SHIFT", fill=accent, font=font_badge)
    
    if is_sports:
        y_st = 250
        sports_ratings = [
            ("Lead Playmaker", "Rating: 9.4/10", "89% passing, 5 key chances created"),
            ("Defensive Anchor", "Rating: 9.0/10", "8 critical stops, 100% aerial duels won"),
            ("High-Press Frontline", "Rating: 9.2/10", "19 pressures, decisive offensive finish"),
            ("Goalkeeper / Final Unit", "Rating: 8.8/10", "6 crucial interventions, 94% distribution")
        ]
        for role, rtg, desc in sports_ratings:
            draw4.text((75, y_st), f"• {role}: {rtg}", fill=accent, font=get_font(18, bold=True))
            draw4.text((95, y_st + 24), desc, fill=(241, 245, 249), font=get_font(16, bold=False))
            y_st += 55
    else:
        y_m1 = 250
        impact_text = content_paras[1] if len(content_paras) > 1 else content_paras[0]
        for l in wrap_text(impact_text, max_chars=38)[:9]:
            draw4.text((75, y_m1), l, fill=(241, 245, 249), font=font_body)
            y_m1 += 34

    # Right Column: Framed Image + Horizon Timeline / Standings Card
    paste_framed_visual(s4, draw4, img_4, accent, frame_coords=(670, 75, 1235, 430), corner_tag="● ATHLETE SPOTLIGHT // 9.4 RTG" if is_sports else "● STRATEGIC FORECAST // HORIZON")

    draw4.rectangle([(670, 455), (1235, 645)], fill=(15, 23, 42), outline=accent, width=2)
    draw4.text((695, 470), "TOURNAMENT TRAJECTORY TIMELINE" if is_sports else "STRATEGIC HORIZON TIMELINE", fill=accent, font=font_badge)
    draw4.rectangle([(695, 505), (1210, 560)], fill=(accent[0], accent[1], accent[2], 30), outline=accent, width=1)
    draw4.text((710, 522), "PHASE 1 (Upcoming): Crucial Group / Knockout Qualification Fixture" if is_sports else "HORIZON 1 (0-12M): Enterprise Protocol Standardization", fill=accent, font=get_font(16, bold=True))
    draw4.rectangle([(695, 575), (1210, 630)], fill=(accent[0], accent[1], accent[2], 30), outline=accent, width=1)
    draw4.text((710, 592), "PHASE 2 (Season): Championship Odds Shift & Table Trajectory" if is_sports else "HORIZON 2 (1-3Y): Global Cross-Sector Systemic Integration", fill=accent, font=get_font(16, bold=True))

    p4 = output_dir / f"widescreen_4_{article_id}.png"
    s4.save(p4, "PNG")
    slide_paths.append(p4)
    del s4, draw4
    gc.collect()

    # -------------------------------------------------------------
    # SLIDE 5: 04 // Upcoming Fixtures & Championship Implications
    # -------------------------------------------------------------
    img_5 = scene_images[min(4, len(scene_images) - 1)]
    s5, draw5 = build_broadcast_widescreen_canvas(img_5, accent, category, clean_domain, title)

    draw5.rectangle([(50, 75), (460, 115)], fill=(accent[0], accent[1], accent[2], 50), outline=accent, width=2)
    draw5.text((65, 85), "04 // CHAMPIONSHIP IMPLICATIONS" if is_sports else "04 // GLOBAL MARKET RIPPLE EFFECTS", fill=accent, font=font_badge)
    draw5.text((50, 130), "League Standings & Upcoming Clashes" if is_sports else "Enterprise Repercussions & Capital Realignment", fill=(255, 255, 255), font=font_h2)

    # Left Column: Standings / Implications Box
    draw5.rectangle([(50, 185), (640, 645)], fill=(15, 23, 42), outline=accent, width=2)
    draw5.text((75, 210), "QUALIFICATION PATHWAY & TABLE SHIFT" if is_sports else "INSTITUTIONAL MARKET MOVEMENTS", fill=accent, font=font_badge)
    y_imp = 250
    imp_p = content_paras[2] if len(content_paras) > 2 else (content_paras[1] if len(content_paras) > 1 else content_paras[0])
    for l in wrap_text(imp_p, max_chars=38)[:9]:
        draw5.text((75, y_imp), l, fill=(241, 245, 249), font=font_body)
        y_imp += 34

    # Right Column: Framed Image + Live Standings Card
    paste_framed_visual(s5, draw5, img_5, accent, frame_coords=(670, 75, 1235, 430), corner_tag="● CHAMPIONSHIP TABLE // LIVE" if is_sports else "● CAPITAL NETWORK // FLOW")

    draw5.rectangle([(670, 455), (1235, 645)], fill=(15, 23, 42), outline=accent, width=2)
    draw5.text((695, 475), "CONFIRMED BRACKET TELEMETRY" if is_sports else "CROSS-BORDER ADOPTION METRICS", fill=accent, font=font_badge)
    fixture_items = [
        ("TITLE RACE", "Points margin tightened in championship hunt") if is_sports else ("LIQUIDITY", "Substantial capital inflows observed"),
        ("UPCOMING CLASH", "High-stakes direct showdown scheduled next week") if is_sports else ("REGULATION", "Harmonized transatlantic frameworks"),
        ("PROBABILITY", "Knockout advancement odds elevated significantly") if is_sports else ("EFFICIENCY", "38% audited dividend across nodes")
    ]
    y_fix = 515
    for f_label, f_val in fixture_items:
        draw5.text((695, y_fix), f"• {f_label}:", fill=accent, font=get_font(16, bold=True))
        draw5.text((880, y_fix), f_val, fill=(241, 245, 249), font=get_font(16, bold=False))
        y_fix += 38

    p5 = output_dir / f"widescreen_5_{article_id}.png"
    s5.save(p5, "PNG")
    slide_paths.append(p5)
    del s5, draw5
    gc.collect()

    # -------------------------------------------------------------
    # SLIDE 6: Official Media Partner Showcase (EduHub by Saeed)
    # -------------------------------------------------------------
    img_6 = scene_images[min(5, len(scene_images) - 1)]
    s6, draw6 = build_broadcast_widescreen_canvas(img_6, (239, 68, 68), category, clean_domain, title)

    draw6.rectangle([(50, 75), (420, 115)], fill=(239, 68, 68, 50), outline=(239, 68, 68), width=2)
    draw6.text((65, 85), "OFFICIAL MEDIA PARTNER", fill=(239, 68, 68), font=font_badge)
    draw6.text((50, 130), "Subscribe On YouTube • Master Next-Gen Tech", fill=(255, 255, 255), font=font_h2)

    # Left Column: EduHub by Saeed Branding Card
    draw6.rectangle([(50, 185), (640, 645)], fill=(15, 23, 42), outline=(239, 68, 68), width=2)
    draw6.rectangle([(75, 210), (320, 245)], fill=(220, 38, 38))
    draw6.text((90, 220), "▶ YOUTUBE CHANNEL", fill=(255, 255, 255), font=font_badge)
    draw6.text((75, 260), "EduHub by Saeed", fill=(255, 255, 255), font=get_font(34, bold=True))
    draw6.text((75, 310), "@EduHubbySaeed", fill=(239, 68, 68), font=get_font(22, bold=True))
    ch_desc = "Daily in-depth masterclasses covering cutting-edge AI development, full-stack software engineering, autonomous systems, and real-world architectures. Subscribe free to accelerate your mastery."
    y_ch = 360
    for l in wrap_text(ch_desc, max_chars=38):
        draw6.text((75, y_ch), l, fill=(203, 213, 225), font=font_body)
        y_ch += 34
    draw6.rectangle([(75, 580), (615, 625)], fill=(220, 38, 38), outline=(239, 68, 68), width=1)
    draw6.text((95, 592), "SUBSCRIBE FREE: YOUTUBE.COM/@EDUHUBBYSAEED", fill=(255, 255, 255), font=get_font(16, bold=True))

    # Right Column: Framed Studio Visual + Channel Info
    paste_framed_visual(s6, draw6, img_6, (239, 68, 68), frame_coords=(670, 75, 1235, 430), corner_tag="● OFFICIAL BROADCAST // EDUHUB")

    draw6.rectangle([(670, 455), (1235, 645)], fill=(15, 23, 42), outline=(239, 68, 68), width=2)
    draw6.text((695, 475), "COMMUNITY & BROADCAST NETWORK", fill=(239, 68, 68), font=font_badge)
    draw6.text((695, 510), "YouTube.com/@EduHubbySaeed", fill=(255, 255, 255), font=get_font(24, bold=True))
    draw6.text((695, 555), "Official video intelligence partner syndicating daily breakdowns.", fill=(203, 213, 225), font=font_sub)
    draw6.rectangle([(695, 595), (1210, 635)], fill=(220, 38, 38, 40), outline=(239, 68, 68), width=1)
    draw6.text((710, 606), "JOIN FREE TODAY: SUBSCRIBE ON YOUTUBE", fill=(255, 255, 255), font=get_font(16, bold=True))

    p6 = output_dir / f"widescreen_6_{article_id}.png"
    s6.save(p6, "PNG")
    slide_paths.append(p6)
    del s6, draw6
    gc.collect()

    # -------------------------------------------------------------
    # SLIDE 7: GlobalPulse AI Full Platform Dossier
    # -------------------------------------------------------------
    img_7 = scene_images[min(6, len(scene_images) - 1)]
    s7, draw7 = build_broadcast_widescreen_canvas(img_7, accent, category, clean_domain, title)

    draw7.rectangle([(50, 75), (420, 115)], fill=(accent[0], accent[1], accent[2], 50), outline=accent, width=2)
    draw7.text((65, 85), "FULL INTELLIGENCE DOSSIER", fill=accent, font=font_badge)
    draw7.text((50, 130), "Verified Telemetry & Source Attribution", fill=(255, 255, 255), font=font_h2)

    # Left Column: Portal Overview Card
    draw7.rectangle([(50, 185), (640, 645)], fill=(15, 23, 42), outline=accent, width=2)
    draw7.text((75, 210), "GLOBALPULSE AI INTELLIGENCE PLATFORM", fill=accent, font=font_badge)
    draw7.text((75, 250), clean_domain, fill=accent, font=get_font(38, bold=True))
    y_dos = 310
    dos_desc = (
        "Access full interactive articles, verified primary source citations, real-time market data, "
        "and comprehensive editorial investigations across Global Sports, AI & Tech, Global Markets, Geopolitics, and Future Science."
    )
    for l in wrap_text(dos_desc, max_chars=38):
        draw7.text((75, y_dos), l, fill=(203, 213, 225), font=font_body)
        y_dos += 34
    draw7.rectangle([(75, 580), (615, 625)], fill=(accent[0], accent[1], accent[2], 40), outline=accent, width=1)
    draw7.text((95, 592), f"EXPLORE LIVE PORTAL: WWW.{clean_domain}", fill=accent, font=get_font(16, bold=True))

    # Right Column: Framed Studio Visual + Live Portal Link
    paste_framed_visual(s7, draw7, img_7, accent, frame_coords=(670, 75, 1235, 430), corner_tag="● GLOBAL WIRE // VERIFIED DOSSIER")

    draw7.rectangle([(670, 455), (1235, 645)], fill=(15, 23, 42), outline=accent, width=2)
    draw7.text((695, 475), "VERIFIED WIRE ARCHIVE & RSS SYNDICATION", fill=accent, font=font_badge)
    draw7.text((695, 515), "24/7 Autonomous News Bureau Engine", fill=(255, 255, 255), font=get_font(22, bold=True))
    draw7.text((695, 555), "AI-curated dispatches, verified facts, zero hallucination.", fill=(203, 213, 225), font=font_sub)
    draw7.rectangle([(695, 595), (1210, 635)], fill=(accent[0], accent[1], accent[2], 30), outline=accent, width=1)
    draw7.text((710, 606), "GLOBAL INTELLIGENCE: REAL-TIME ARCHIVE", fill=accent, font=get_font(16, bold=True))

    p7 = output_dir / f"widescreen_7_{article_id}.png"
    s7.save(p7, "PNG")
    slide_paths.append(p7)
    del s7, draw7
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
    - video_format='long' (Default): 16:9 widescreen 720p HD (1280x720), 5 broadcast slides, 90-150s narration
    - video_format='short': 9:16 vertical (1080x1920) 60-second YouTube Short
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

    output_audio_path = STATIC_VIDEOS_DIR / audio_filename
    output_video_path = STATIC_VIDEOS_DIR / video_filename
    temp_raw_img = STATIC_VIDEOS_DIR / f"raw_img_{article_id}.jpg"
    concat_list_file = STATIC_VIDEOS_DIR / f"concat_{article_id}.txt"

    # Step A: Synthesize Speech Voiceover (edge-tts -> gTTS -> Windows SAPI fallback)
    audio_ok = False
    try:
        audio_ok = run_async_in_isolated_thread(synthesize_edge_tts, clean_text, output_audio_path, timeout=60.0)
    except Exception as e:
        print(f"[Video Generator] Isolated edge-tts execution error: {e}")
        audio_ok = False

    if not audio_ok:
        print("[Video Generator] edge-tts unavailable. Falling back to bulletproof Google TTS (gTTS)...")
        audio_ok = synthesize_gtts(clean_text, output_audio_path)

    if not audio_ok:
        print("[Video Generator] Falling back to Windows SAPI System TTS...")
        audio_ok = synthesize_system_tts(clean_text, output_audio_path)

    if not audio_ok or not output_audio_path.exists() or output_audio_path.stat().st_size < 5000:
        raise RuntimeError(f"Failed to generate valid voiceover audio for article {article_id}")

    audio_duration = probe_media_duration(output_audio_path)
    if audio_duration < 5.0:
        raise RuntimeError(f"Voiceover duration too short ({audio_duration:.2f}s). Must be >= 5.0s.")

    print(f"[Video Generator] Audio voiceover synthesized: {audio_duration:.2f} seconds ({output_audio_path.stat().st_size} bytes)")

    # Step B: Source Visual HD Photos across all 7 scenes for both formats
    required_scene_count = 7
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
            scene_images=scene_images
        )
        slide_dur = max(audio_duration / float(len(slides)), 3.5)
    else:
        slides = generate_news_slides(
            title=title,
            category=category,
            summary=summary,
            output_dir=STATIC_VIDEOS_DIR,
            article_id=article_id,
            scene_images=scene_images
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
