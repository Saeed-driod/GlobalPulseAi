#!/usr/bin/env python
"""
========================================================================================
GlobalPulse AI - Automated TikTok / Shorts Movie Promo Generator
========================================================================================
Generates a viral 9:16 vertical promo video (1080x1920) showcasing top trending movies,
their ratings, streaming platforms (Netflix, Max, Prime, Disney+), and a call-to-action
directing viewers to https://globalpulseai.vercel.app/movies (Link in Bio)!
========================================================================================
"""

import os
import sys
import asyncio
import subprocess
import urllib.request
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import edge_tts
import imageio_ffmpeg

ROOT_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = ROOT_DIR / "exports" / "tiktok"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

TEMP_DIR = ROOT_DIR / "backend" / "static" / "temp_promo"
TEMP_DIR.mkdir(parents=True, exist_ok=True)

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

# Voice configuration (Energetic modern male voice)
VOICE_NAME = "en-US-AndrewNeural"

VOICEOVER_SCRIPT = (
    "Wondering what to watch tonight? Here are three massive movies streaming right now! "
    "Number one: Dune Part Two! The visually stunning sci-fi masterpiece is now streaming on Max and Prime Video. "
    "Number two: Deadpool and Wolverine! Marvel's record-breaking action comedy is streaming worldwide on Disney Plus. "
    "Number three: Jawan! The high-octane action blockbuster starring Shah Rukh Khan, streaming on Netflix. "
    "Want to find where ANY movie or show is streaming worldwide? "
    "Visit the GlobalPulse AI Cinema Radar at globalpulseai.vercel.app/movies! Link in bio!"
)

# Movie cards metadata
SLIDES_DATA = [
    {
        "type": "intro",
        "title": "WHAT TO WATCH TONIGHT? 🍿",
        "subtitle": "Top 3 Global Trending Movies Streaming Now",
        "badge": "CINEMA RADAR • TIKTOK PICK",
        "bg_color": (15, 23, 42),
        "duration": 4.5,
    },
    {
        "type": "movie",
        "title": "DUNE: PART TWO",
        "year": "2024",
        "rating": "⭐ 8.5 / 10",
        "stream_badge": "STREAMING ON: MAX & PRIME",
        "badge_color": (37, 99, 235),
        "stars": "Timothée Chalamet, Zendaya",
        "genre": "Sci-Fi / Epic Adventure",
        "image_url": "https://m.media-amazon.com/images/M/MV5BNTc0YmQxMjEtODI5MC00NjFiLTlkMWUtOGQ5NjFmYWUyZGJhXkEyXkFqcGc@._V1_.jpg",
        "duration": 7.5,
    },
    {
        "type": "movie",
        "title": "DEADPOOL & WOLVERINE",
        "year": "2024",
        "rating": "⭐ 7.8 / 10",
        "stream_badge": "STREAMING ON: DISNEY+",
        "badge_color": (220, 38, 38),
        "stars": "Ryan Reynolds, Hugh Jackman",
        "genre": "Action / Marvel Comedy",
        "image_url": "https://m.media-amazon.com/images/M/MV5BZTk5ODY0MmQtMzA3Ni00NGY1LThiYzItZThiNjFiNDM4MTM3XkEyXkFqcGc@._V1_.jpg",
        "duration": 7.5,
    },
    {
        "type": "movie",
        "title": "JAWAN",
        "year": "2023",
        "rating": "⭐ 7.0 / 10",
        "stream_badge": "STREAMING ON: NETFLIX",
        "badge_color": (220, 38, 38),
        "stars": "Shah Rukh Khan, Nayanthara",
        "genre": "Action Thriller Blockbuster",
        "image_url": "https://m.media-amazon.com/images/M/MV5BMGExNGI1NDktOWI2Mi00NDM3LWIxMmQtNTQxYTgzMzI0MTA1XkEyXkFqcGc@._V1_.jpg",
        "duration": 7.0,
    },
    {
        "type": "outro",
        "title": "FIND WHERE ANY MOVIE IS STREAMING!",
        "subtitle": "Search 1,000,000+ Titles Worldwide",
        "cta": "👉 LINK IN BIO: globalpulseai.vercel.app/movies",
        "badge": "GLOBALPULSE AI CINEMA RADAR",
        "bg_color": (26, 140, 255),
        "duration": 5.5,
    },
]

def generate_speech(text: str, output_path: Path):
    # Try edge-tts first
    try:
        async def _edge():
            communicate = edge_tts.Communicate(text, "en-US-ChristopherNeural")
            await communicate.save(str(output_path))
        asyncio.run(_edge())
        if output_path.exists() and output_path.stat().st_size > 5000:
            return True
    except Exception as e:
        print(f"[TTS] edge-tts note: {e}")

    # Robust fallback to Google TTS (gTTS)
    try:
        from gtts import gTTS
        print("[TTS] Using Google TTS (gTTS) for crystal-clear voiceover...")
        tts = gTTS(text=text, lang="en", slow=False)
        tts.save(str(output_path))
        return output_path.exists() and output_path.stat().st_size > 5000
    except Exception as e:
        print(f"[TTS] gTTS error: {e}")
        return False

def download_image(url: str, local_path: Path):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp, open(local_path, "wb") as f:
            f.write(resp.read())
        return True
    except Exception as e:
        print(f"Failed to download image {url}: {e}")
        return False

def render_slide_image(slide: dict, index: int) -> Path:
    width, height = 1080, 1920
    img = Image.new("RGBA", (width, height), (15, 23, 42, 255))
    draw = ImageDraw.Draw(img)

    # Base font sizes
    try:
        font_large = ImageFont.truetype("arialbd.ttf", 64)
        font_med = ImageFont.truetype("arialbd.ttf", 44)
        font_sub = ImageFont.truetype("arial.ttf", 36)
        font_badge = ImageFont.truetype("arialbd.ttf", 32)
    except Exception:
        font_large = font_med = font_sub = font_badge = ImageFont.load_default()

    stype = slide["type"]

    if stype == "intro":
        # Draw gradient background
        for y in range(height):
            ratio = y / height
            r = int(15 * (1 - ratio) + 26 * ratio)
            g = int(23 * (1 - ratio) + 140 * ratio)
            b = int(42 * (1 - ratio) + 255 * ratio)
            draw.line([(0, y), (width, y)], fill=(r, g, b))

        # Brand header badge
        draw.rectangle([(200, 400), (880, 470)], fill=(255, 255, 255, 230))
        draw.text((540, 435), "🎬 GLOBALPULSE CINEMA RADAR", font=font_badge, fill=(26, 140, 255), anchor="mm")

        # Big Hook Title
        draw.text((540, 800), "WHAT TO WATCH\nTONIGHT? 🍿", font=font_large, fill=(255, 255, 255), anchor="mm", align="center")

        # Subtitle
        draw.text((540, 1050), "3 Massive Movies Streaming Right Now", font=font_sub, fill=(226, 232, 240), anchor="mm")

        # Swipe indicator
        draw.rectangle([(300, 1400), (780, 1480)], fill=(255, 255, 255, 30), outline=(255, 255, 255, 100), width=3)
        draw.text((540, 1440), "SWIPE UP TO DISCOVER ▸", font=font_badge, fill=(255, 255, 255), anchor="mm")

    elif stype == "movie":
        # Download and place poster
        poster_path = TEMP_DIR / f"poster_{index}.jpg"
        downloaded = download_image(slide["image_url"], poster_path)

        if downloaded and poster_path.exists():
            try:
                poster = Image.open(poster_path).convert("RGBA")
                # Create blurred background from poster
                bg = poster.resize((width, height)).filter(ImageFilter.GaussianBlur(radius=40))
                # Dark overlay for readability
                darkener = Image.new("RGBA", (width, height), (0, 0, 0, 160))
                bg.paste(darkener, (0, 0), darkener)
                img = bg
                draw = ImageDraw.Draw(img)

                # Paste sharp centered poster
                pw, ph = 700, 1000
                poster_resized = poster.resize((pw, ph), Image.Resampling.LANCZOS)
                img.paste(poster_resized, ((width - pw) // 2, 350))
            except Exception as e:
                print(f"Error drawing poster: {e}")

        # Top Badge
        draw.rectangle([(180, 180), (900, 260)], fill=(0, 0, 0, 200), outline=(255, 255, 255, 80), width=2)
        draw.text((540, 220), f"TRENDING #{index} • {slide['genre'].upper()}", font=font_badge, fill=(255, 255, 255), anchor="mm")

        # Title Card Bottom Box
        draw.rectangle([(80, 1420), (1000, 1780)], fill=(15, 23, 42, 235), outline=(255, 255, 255, 40), width=2)

        # Title & Year
        draw.text((540, 1480), f"{slide['title']} ({slide['year']})", font=font_med, fill=(255, 255, 255), anchor="mm")
        draw.text((540, 1540), slide["stars"], font=font_sub, fill=(203, 213, 225), anchor="mm")

        # Streaming availability button badge
        bcol = slide.get("badge_color", (37, 99, 235))
        draw.rectangle([(160, 1600), (920, 1690)], fill=bcol)
        draw.text((540, 1645), slide["stream_badge"], font=font_badge, fill=(255, 255, 255), anchor="mm")

        # Rating
        draw.text((540, 1735), slide["rating"], font=font_badge, fill=(251, 191, 36), anchor="mm")

    elif stype == "outro":
        # Call to Action screen
        for y in range(height):
            ratio = y / height
            r = int(10 * (1 - ratio) + 26 * ratio)
            g = int(20 * (1 - ratio) + 80 * ratio)
            b = int(40 * (1 - ratio) + 180 * ratio)
            draw.line([(0, y), (width, y)], fill=(r, g, b))

        draw.rectangle([(150, 400), (930, 480)], fill=(255, 255, 255, 230))
        draw.text((540, 440), "WHERE TO WATCH WORLDWIDE", font=font_badge, fill=(26, 140, 255), anchor="mm")

        draw.text((540, 750), "FIND ANY MOVIE\nOR SERIES!", font=font_large, fill=(255, 255, 255), anchor="mm", align="center")

        draw.text((540, 980), "Streaming links across Netflix, Prime,\nDisney+, Tubi & YouTube Free Movies", font=font_sub, fill=(226, 232, 240), anchor="mm", align="center")

        # Big CTA Box
        draw.rectangle([(100, 1250), (980, 1450)], fill=(255, 255, 255), outline=(26, 140, 255), width=4)
        draw.text((540, 1310), "👉 VISIT CINEMA RADAR", font=font_med, fill=(26, 140, 255), anchor="mm")
        draw.text((540, 1390), "globalpulseai.vercel.app/movies", font=font_sub, fill=(15, 23, 42), anchor="mm")

        draw.text((540, 1560), "🔗 LINK IN BIO!", font=font_large, fill=(251, 191, 36), anchor="mm")

    out_file = TEMP_DIR / f"slide_{index}.png"
    img.save(out_file, "PNG")
    return out_file

def main():
    print("=" * 70)
    print("🎬 GlobalPulse AI - Viral TikTok Movie Promo Video Generator")
    print("=" * 70)

    # 1. Generate Voiceover
    audio_path = TEMP_DIR / "promo_voiceover.mp3"
    print("\n[1/4] Generating natural AI voiceover...")
    generate_speech(VOICEOVER_SCRIPT, audio_path)
    print(f"✓ Voiceover generated: {audio_path}")

    # 2. Render Slide Images
    print("\n[2/4] Rendering 9:16 vertical high-definition slide graphics...")
    slide_files = []
    for idx, slide in enumerate(SLIDES_DATA):
        slide_img = render_slide_image(slide, idx)
        slide_files.append((slide_img, slide["duration"]))
        print(f"✓ Slide {idx+1}/{len(SLIDES_DATA)} ready: {slide_img.name}")

    # 3. Create Concat File for FFmpeg
    concat_file = TEMP_DIR / "slides.txt"
    with open(concat_file, "w", encoding="utf-8") as f:
        for s_file, dur in slide_files:
            # Format: file 'path' \n duration X
            clean_path = str(s_file).replace("\\", "/")
            f.write(f"file '{clean_path}'\n")
            f.write(f"duration {dur}\n")
        # Repeat last slide to ensure smooth tail
        last_path = str(slide_files[-1][0]).replace("\\", "/")
        f.write(f"file '{last_path}'\n")

    # 4. Render Final Video via FFmpeg
    output_mp4 = OUTPUT_DIR / f"trending_movies_promo_{int(os.times().system * 100)}.mp4"
    print(f"\n[3/4] Encoding vertical video with FFmpeg...")

    cmd = [
        FFMPEG_EXE,
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_file),
        "-i", str(audio_path),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "fast",
        "-crf", "22",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        str(output_mp4),
    ]

    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if res.returncode == 0 and output_mp4.exists():
        size_mb = output_mp4.stat().st_size / (1024 * 1024)
        print(f"\n[4/4] ✨ SUCCESS! Promo video is ready!")
        print(f"📍 File Path: {output_mp4}")
        print(f"📦 Size: {size_mb:.2f} MB")
        print("\nReady to upload to TikTok / YouTube Shorts / Instagram Reels!")
    else:
        print(f"FFmpeg error: {res.stderr.decode('utf-8', errors='ignore')}")

if __name__ == "__main__":
    main()
