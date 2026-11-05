#!/usr/bin/env python
"""
========================================================================================
GlobalPulse AI - High-Octane Viral TikTok & Shorts Movie Promo Generator
========================================================================================
Generates an electrifying 9:16 vertical promo video (1080x1920) with:
- Punchy, fast-paced cinematic AI voiceover
- Action-trailer background music with audio ducking and bass beats
- High-definition 3-poster intro hook collage (Stop Scrolling!)
- Glassmorphic neon movie cards with glowing borders and platform badges
- Ken Burns dynamic camera zoom motion on every scene
- Automatic 100% Community Guidelines-compliant TikTok caption (.txt) file!
========================================================================================
"""

import os
import sys
import asyncio
import subprocess
import urllib.request
from typing import Optional, Dict, Any, List
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import edge_tts
import imageio_ffmpeg

ROOT_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = ROOT_DIR / "videos"  # Unified Single Videos Folder
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

TEMP_DIR = ROOT_DIR / "backend" / "static" / "temp_promo"
TEMP_DIR.mkdir(parents=True, exist_ok=True)

BGM_PATH = ROOT_DIR / "backend" / "static" / "audio" / "action_trailer_bgm.mp3"

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

VOICEOVER_SCRIPT = (
    "Stop scrolling! If you need a movie to watch tonight, these three blockbusters will blow your mind! "
    "Number one: Dune Part Two! The greatest sci-fi masterpiece of our generation, streaming now on Max and Prime Video. "
    "Number two: Deadpool and Wolverine! Marvel's record-breaking action comedy, officially streaming on Disney Plus. "
    "Number three: Jawan! Unstoppable high-octane action starring Shah Rukh Khan, streaming worldwide on Netflix. "
    "Want to find where ANY movie or show is streaming worldwide for free? "
    "Tap the link in our bio right now! Don't miss out!"
)

# Movie Cards Metadata
SLIDES_DATA = [
    {
        "type": "intro",
        "title": "STOP SCROLLING! 🔥",
        "subtitle": "3 BLOCKBUSTERS STREAMING TONIGHT",
        "badge": "CINEMA RADAR • TOP 3 PICKS",
        "duration": 4.0,
    },
    {
        "type": "movie",
        "rank": "#1",
        "title": "DUNE: PART TWO",
        "year": "2024",
        "rating": "⭐ 8.5 / 10 • MASTERPIECE",
        "stream_badge": "▶ STREAMING ON: MAX & PRIME",
        "badge_color": (37, 99, 235),
        "neon_color": (6, 182, 212),
        "stars": "Timothée Chalamet, Zendaya",
        "genre": "SCI-FI / EPIC ADVENTURE",
        "image_url": "https://m.media-amazon.com/images/M/MV5BNTc0YmQxMjEtODI5MC00NjFiLTlkMWUtOGQ5NjFmYWUyZGJhXkEyXkFqcGc@._V1_.jpg",
        "duration": 6.5,
    },
    {
        "type": "movie",
        "rank": "#2",
        "title": "DEADPOOL & WOLVERINE",
        "year": "2024",
        "rating": "⭐ 7.8 / 10 • MARVEL RECORD-BREAKER",
        "stream_badge": "▶ STREAMING ON: DISNEY+",
        "badge_color": (147, 51, 234),
        "neon_color": (239, 68, 68),
        "stars": "Ryan Reynolds, Hugh Jackman",
        "genre": "ACTION / MARVEL COMEDY",
        "image_url": "https://m.media-amazon.com/images/M/MV5BZTk5ODY0MmQtMzA3Ni00NGY1LThiYzItZThiNjFiNDM4MTM3XkEyXkFqcGc@._V1_.jpg",
        "duration": 6.5,
    },
    {
        "type": "movie",
        "rank": "#3",
        "title": "JAWAN",
        "year": "2023",
        "rating": "⭐ 7.0 / 10 • GLOBAL ACTION BLOCKBUSTER",
        "stream_badge": "▶ STREAMING ON: NETFLIX",
        "badge_color": (220, 38, 38),
        "neon_color": (245, 158, 11),
        "stars": "Shah Rukh Khan, Nayanthara",
        "genre": "HIGH-OCTANE ACTION THRILLER",
        "image_url": "https://m.media-amazon.com/images/M/MV5BMGExNGI1NDktOWI2Mi00NDM3LWIxMmQtNTQxYTgzMzI0MTA1XkEyXkFqcGc@._V1_.jpg",
        "duration": 6.5,
    },
    {
        "type": "outro",
        "title": "WHERE TO STREAM ANY MOVIE!",
        "subtitle": "Search 1,000,000+ Movies Worldwide",
        "cta": "👉 TAP LINK IN BIO RIGHT NOW!",
        "badge": "GLOBALPULSE AI CINEMA RADAR",
        "duration": 5.0,
    },
]

def generate_speech(text: str, output_path: Path):
    """Generates punchy, energetic voiceover with speed-up for trailer intensity."""
    raw_path = TEMP_DIR / "raw_voiceover.mp3"
    
    # 1. Try Edge-TTS first (ChristopherNeural with rate +12%)
    try:
        async def _edge():
            communicate = edge_tts.Communicate(text, "en-US-ChristopherNeural", rate="+12%")
            await asyncio.wait_for(communicate.save(str(raw_path)), timeout=8.0)
        asyncio.run(_edge())
        if raw_path.exists() and raw_path.stat().st_size > 5000:
            # Copy to output
            import shutil
            shutil.copy2(raw_path, output_path)
            return True
    except Exception as e:
        print(f"[TTS] Edge-TTS notice: {e}, falling back to Google TTS...")

    # 2. Resilient Google TTS with FFmpeg atempo=1.15 speedup
    try:
        from gtts import gTTS
        print("[TTS] Synthesizing high-energy voiceover via Google TTS...")
        tts = gTTS(text=text, lang="en", tld="com")
        tts.save(str(raw_path))
        
        # Speed up slightly for TikTok energetic pacing
        cmd = [
            FFMPEG_EXE, "-y",
            "-i", str(raw_path),
            "-filter:a", "atempo=1.15",
            str(output_path)
        ]
        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return output_path.exists() and output_path.stat().st_size > 5000
    except Exception as e:
        print(f"[TTS] gTTS error: {e}")
        return False

def download_image(url: str, local_path: Path):
    """Downloads poster image safely with headers and timeout."""
    if local_path.exists() and local_path.stat().st_size > 10000:
        return True
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=12) as resp, open(local_path, "wb") as f:
            f.write(resp.read())
        return True
    except Exception as e:
        print(f"Failed to download image {url}: {e}")
        return False

def get_fonts():
    """Loads clear bold fonts with fallback to system defaults."""
    try:
        font_huge = ImageFont.truetype("arialbd.ttf", 76)
        font_large = ImageFont.truetype("arialbd.ttf", 54)
        font_med = ImageFont.truetype("arialbd.ttf", 40)
        font_sub = ImageFont.truetype("arial.ttf", 32)
        font_badge = ImageFont.truetype("arialbd.ttf", 28)
    except Exception:
        font_huge = font_large = font_med = font_sub = font_badge = ImageFont.load_default()
    return font_huge, font_large, font_med, font_sub, font_badge

def render_slide_image(slide: dict, index: int) -> Path:
    """Renders high-octane 9:16 vertical slide with glowing badges, posters, and cinematic layout."""
    width, height = 1080, 1920
    img = Image.new("RGBA", (width, height), (10, 15, 29, 255))
    draw = ImageDraw.Draw(img)
    font_huge, font_large, font_med, font_sub, font_badge = get_fonts()

    stype = slide["type"]

    if stype == "intro":
        # 1. Dark fiery cinematic backdrop
        for y in range(height):
            ratio = y / height
            r = int(15 * (1 - ratio) + 80 * ratio)
            g = int(10 * (1 - ratio) + 20 * ratio)
            b = int(25 * (1 - ratio) + 40 * ratio)
            draw.line([(0, y), (width, y)], fill=(r, g, b))

        # 2. Glowing Header Pill
        draw.rectangle([(160, 140), (920, 220)], fill=(0, 0, 0, 220), outline=(239, 68, 68), width=3)
        draw.text((540, 180), "🔥 CINEMA RADAR • TOP 3 PICKS", font=font_badge, fill=(255, 255, 255), anchor="mm")

        # 3. Giant Electric Hook
        draw.text((540, 310), "STOP SCROLLING! 🛑", font=font_huge, fill=(250, 204, 21), anchor="mm")
        draw.text((540, 390), "3 Blockbusters Streaming Tonight", font=font_med, fill=(255, 255, 255), anchor="mm")

        # 4. Triple Poster Collage in Center (Dune 2, Deadpool, Jawan side-by-side)
        p1 = TEMP_DIR / "poster_1.jpg"
        p2 = TEMP_DIR / "poster_2.jpg"
        p3 = TEMP_DIR / "poster_3.jpg"

        posters_info = [
            (p1, SLIDES_DATA[1]["image_url"], 80, 520, (6, 182, 212)),
            (p2, SLIDES_DATA[2]["image_url"], 370, 480, (239, 68, 68)), # Centered and slightly higher
            (p3, SLIDES_DATA[3]["image_url"], 660, 520, (245, 158, 11)),
        ]

        for p_path, p_url, x, y, border_col in posters_info:
            download_image(p_url, p_path)
            if p_path.exists():
                try:
                    p_img = Image.open(p_path).convert("RGBA")
                    pw, ph = 340, 510
                    p_res = p_img.resize((pw, ph), Image.Resampling.LANCZOS)
                    # Outer glow outline
                    draw.rectangle([(x - 6, y - 6), (x + pw + 6, y + ph + 6)], fill=(0, 0, 0, 180), outline=border_col, width=4)
                    img.paste(p_res, (x, y))
                except Exception as e:
                    print(f"Collage poster error: {e}")

        # 5. Streaming Corridor Pills in middle-bottom
        draw.rectangle([(100, 1120), (980, 1420)], fill=(15, 23, 42, 240), outline=(255, 255, 255, 40), width=2)
        draw.text((540, 1170), "STREAMING TONIGHT ON:", font=font_badge, fill=(148, 163, 184), anchor="mm")

        # Logos pills
        pills = [
            ("MAX", (37, 99, 235), 140),
            ("PRIME", (2, 132, 199), 360),
            ("DISNEY+", (99, 102, 241), 580),
            ("NETFLIX", (220, 38, 38), 800),
        ]
        for name, col, px in pills:
            draw.rectangle([(px, 1220), (px + 140, 1285)], fill=col)
            draw.text((px + 70, 1252), name, font=font_badge, fill=(255, 255, 255), anchor="mm")

        draw.text((540, 1360), "100% Free Links & Corridors", font=font_sub, fill=(226, 232, 240), anchor="mm")

        # 6. Big Call to Action at Bottom
        draw.rectangle([(120, 1540), (960, 1720)], fill=(220, 38, 38), outline=(255, 255, 255), width=3)
        draw.text((540, 1600), "👉 WATCH WHERE TO STREAM", font=font_large, fill=(255, 255, 255), anchor="mm")
        draw.text((540, 1665), "🔗 LINK IN BIO! 🍿", font=font_huge, fill=(250, 204, 21), anchor="mm")

    elif stype == "movie":
        poster_path = TEMP_DIR / f"poster_{index}.jpg"
        download_image(slide["image_url"], poster_path)

        # 1. Full-bleed blurred poster background
        if poster_path.exists():
            try:
                poster = Image.open(poster_path).convert("RGBA")
                bg = poster.resize((width, height)).filter(ImageFilter.GaussianBlur(radius=35))
                # Enhance saturation & contrast for pop
                enhancer = ImageEnhance.Color(bg)
                bg = enhancer.enhance(1.4)
                # Darken overlay
                dark = Image.new("RGBA", (width, height), (0, 0, 0, 150))
                bg.paste(dark, (0, 0), dark)
                img = bg
                draw = ImageDraw.Draw(img)

                # 2. Large High-Def Poster in Center
                pw, ph = 740, 1060
                poster_main = poster.resize((pw, ph), Image.Resampling.LANCZOS)
                px = (width - pw) // 2
                py = 280

                # Glowing neon border around the poster
                neon = slide.get("neon_color", (6, 182, 212))
                draw.rectangle([(px - 8, py - 8), (px + pw + 8, py + ph + 8)], fill=(0, 0, 0, 200), outline=neon, width=6)
                img.paste(poster_main, (px, py))
            except Exception as e:
                print(f"Error drawing movie poster: {e}")

        # 3. Top Floating Rank Badge
        draw.rectangle([(180, 130), (900, 220)], fill=(0, 0, 0, 230), outline=(255, 255, 255, 90), width=3)
        draw.text((540, 175), f"🔥 {slide['rank']} {slide['genre']}", font=font_badge, fill=(255, 255, 255), anchor="mm")

        # 4. Bottom Glassmorphic Info Card
        card_y = 1380
        draw.rectangle([(60, card_y), (1020, 1820)], fill=(15, 23, 42, 240), outline=(255, 255, 255, 50), width=3)

        # Movie Title & Year
        draw.text((540, card_y + 60), f"{slide['title']} ({slide['year']})", font=font_large, fill=(255, 255, 255), anchor="mm")
        draw.text((540, card_y + 115), slide["stars"], font=font_sub, fill=(203, 213, 225), anchor="mm")

        # Streaming availability button badge (Giant vibrant pill)
        bcol = slide.get("badge_color", (37, 99, 235))
        draw.rectangle([(120, card_y + 160), (960, card_y + 260)], fill=bcol, outline=(255, 255, 255, 80), width=2)
        draw.text((540, card_y + 210), slide["stream_badge"], font=font_large, fill=(255, 255, 255), anchor="mm")

        # Rating Badge
        draw.text((540, card_y + 320), slide["rating"], font=font_med, fill=(250, 204, 21), anchor="mm")
        draw.text((540, card_y + 380), "👉 Full streaming guide: Link in bio 🍿", font=font_sub, fill=(226, 232, 240), anchor="mm")

    elif stype == "outro":
        # 1. Radiant Blue/Cyan Radar Background
        for y in range(height):
            ratio = y / height
            r = int(10 * (1 - ratio) + 20 * ratio)
            g = int(20 * (1 - ratio) + 60 * ratio)
            b = int(45 * (1 - ratio) + 160 * ratio)
            draw.line([(0, y), (width, y)], fill=(r, g, b))

        # Brand header badge
        draw.rectangle([(180, 260), (900, 350)], fill=(255, 255, 255, 240))
        draw.text((540, 305), "🎬 GLOBALPULSE CINEMA RADAR", font=font_large, fill=(26, 140, 255), anchor="mm")

        # Main Headline
        draw.text((540, 560), "FIND WHERE ANY\nMOVIE IS STREAMING!", font=font_huge, fill=(255, 255, 255), anchor="mm", align="center")

        draw.text((540, 780), "Search 1,000,000+ Movies & TV Shows", font=font_med, fill=(226, 232, 240), anchor="mm")

        # Service badges box
        draw.rectangle([(100, 880), (980, 1140)], fill=(15, 23, 42, 220), outline=(255, 255, 255, 40), width=2)
        draw.text((540, 940), "VERIFIED FREE & SUBSCRIPTION LINKS:", font=font_badge, fill=(148, 163, 184), anchor="mm")
        draw.text((540, 1020), "Netflix • Max • Prime Video • Disney+\nTubi Free • YouTube Free Movies", font=font_med, fill=(255, 255, 255), anchor="mm", align="center")

        # Giant Golden CTA Button
        draw.rectangle([(80, 1260), (1000, 1540)], fill=(250, 204, 21), outline=(255, 255, 255), width=5)
        draw.text((540, 1340), "👉 TAP LINK IN BIO NOW!", font=font_huge, fill=(15, 23, 42), anchor="mm")
        draw.text((540, 1430), "globalpulseai.vercel.app/movies", font=font_med, fill=(30, 41, 59), anchor="mm")
        draw.text((540, 1490), "🍿 100% Free Global Search", font=font_sub, fill=(15, 23, 42), anchor="mm")

        # Arrow down
        draw.text((540, 1660), "👇 👇 👇", font=font_huge, fill=(255, 255, 255), anchor="mm")
        draw.text((540, 1740), "CHECK PROFILE BIO TO STREAM", font=font_med, fill=(250, 204, 21), anchor="mm")

    out_file = TEMP_DIR / f"slide_{index}.png"
    img.save(out_file, "PNG")
    return out_file

def generate_movie_promo(output_dir: Optional[Path] = None, auto_post_facebook: bool = False) -> Dict[str, Any]:
    target_out_dir = output_dir or OUTPUT_DIR
    target_out_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 75)
    print("🎬 GlobalPulse AI - High-Octane Viral TikTok & Reels Movie Promo Generator")
    print(f"📁 Target Video Output Directory: {target_out_dir}")
    print("===========================================================================")

    # 1. Generate Voiceover
    vox_path = TEMP_DIR / "promo_voiceover_fast.mp3"
    print("\n[1/5] Synthesizing high-energy trailer voiceover...")
    speech_ok = generate_speech(VOICEOVER_SCRIPT, vox_path)
    if not speech_ok:
        print("[!] Voiceover generation failed.")
        return {"success": False, "error": "Voiceover generation failed"}
    print(f"✓ Voiceover ready: {vox_path.name}")

    # 2. Render Slide Graphics
    print("\n[2/5] Rendering high-definition 9:16 visual cards with posters & neon badges...")
    slide_clips = []
    for idx, slide in enumerate(SLIDES_DATA):
        slide_img = render_slide_image(slide, idx)
        dur = slide["duration"]
        clip_mp4 = TEMP_DIR / f"clip_{idx}.mp4"

        # Apply smooth Ken Burns Motion Zoom via FFmpeg zoompan
        # Alternating zoom directions (zoom in on even, zoom out on odd)
        fps = 30
        frames = int(dur * fps)
        if idx % 2 == 0:
            vf = f"scale=8000:-1,zoompan=z='min(zoom+0.0012,1.14)':d={frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps={fps}"
        else:
            vf = f"scale=8000:-1,zoompan=z='if(lte(on,1),1.14,max(1.0,zoom-0.0012))':d={frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps={fps}"

        cmd_zoom = [
            FFMPEG_EXE, "-y",
            "-loop", "1",
            "-i", str(slide_img),
            "-vf", vf,
            "-t", str(dur),
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-preset", "ultrafast",
            str(clip_mp4),
        ]
        res = subprocess.run(cmd_zoom, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if res.returncode == 0 and clip_mp4.exists():
            slide_clips.append(clip_mp4)
            print(f"✓ Scene {idx+1}/{len(SLIDES_DATA)} with Ken Burns Motion ready: {clip_mp4.name} ({dur}s)")
        else:
            print(f"Zoom error on slide {idx}: {res.stderr.decode('utf-8', errors='ignore')}")

    # 3. Concatenate Scene Clips
    print("\n[3/5] Merging dynamic camera scenes...")
    concat_list = TEMP_DIR / "clips_list.txt"
    with open(concat_list, "w", encoding="utf-8") as f:
        for c in slide_clips:
            f.write(f"file '{str(c).replace('\\', '/')}'\n")

    merged_video = TEMP_DIR / "merged_video.mp4"
    cmd_merge = [
        FFMPEG_EXE, "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_list),
        "-c", "copy",
        str(merged_video),
    ]
    subprocess.run(cmd_merge, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    print(f"✓ Visual montage merged: {merged_video.name}")

    # 4. Master Audio: Mix Voiceover + Action Trailer Background Music
    print("\n[4/5] Mastering audio: Action Trailer BGM + Voiceover ducking...")
    mastered_audio = TEMP_DIR / "mastered_audio.mp3"
    
    if BGM_PATH.exists():
        # Mix voiceover with action music (BGM ducked at 0.22, voiceover at 1.25)
        cmd_audio = [
            FFMPEG_EXE, "-y",
            "-i", str(vox_path),
            "-i", str(BGM_PATH),
            "-filter_complex",
            "[1:a]volume=0.22,afade=t=in:st=0:d=1,afade=t=out:st=27:d=2[bgm];[0:a]volume=1.25[vox];[vox][bgm]amix=inputs=2:duration=first[aout]",
            "-map", "[aout]",
            "-c:a", "libmp3lame",
            "-b:a", "192k",
            str(mastered_audio),
        ]
        subprocess.run(cmd_audio, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        final_audio = mastered_audio if mastered_audio.exists() else vox_path
    else:
        final_audio = vox_path

    # 5. Final Encode: Video + Mastered Soundtrack
    promo_id = int(os.times().system * 100)
    output_mp4 = target_out_dir / f"trending_movies_promo_{promo_id}.mp4"
    output_caption = target_out_dir / f"trending_movies_promo_{promo_id}_caption.txt"

    print(f"\n[5/5] Finalizing viral 9:16 vertical video package...")
    cmd_final = [
        FFMPEG_EXE, "-y",
        "-i", str(merged_video),
        "-i", str(final_audio),
        "-c:v", "libx264",
        "-crf", "22",
        "-preset", "fast",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        str(output_mp4),
    ]
    res_final = subprocess.run(cmd_final, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    if res_final.returncode == 0 and output_mp4.exists():
        size_mb = output_mp4.stat().st_size / (1024 * 1024)

        # Also copy to backend/static/videos so web player can stream it
        try:
            import shutil
            static_dir = ROOT_DIR / "backend" / "static" / "videos"
            static_dir.mkdir(parents=True, exist_ok=True)
            shutil.copy2(str(output_mp4), str(static_dir / output_mp4.name))
        except Exception:
            pass

        # Generate Safe Ready-to-Copy Caption
        caption_text = (
            "================================================================================\n"
            "🎬 TIKTOK READY-TO-POST CAPTION (100% COMMUNITY GUIDELINES COMPLIANT)\n"
            "================================================================================\n"
            "NOTE: No external URLs in caption! This prevents automated TikTok shadowbans\n"
            "and guidelines strikes. All traffic is directed to your profile bio!\n"
            "--------------------------------------------------------------------------------\n\n"
            "🍿 Weekend movie night sorted! Which one are you streaming tonight? (1, 2, or 3?)\n\n"
            "1️⃣ Dune: Part Two (Max & Prime Video)\n"
            "2️⃣ Deadpool & Wolverine (Disney+)\n"
            "3️⃣ Jawan (Netflix)\n\n"
            "👉 Want to find where ANY movie or show is streaming worldwide? Link in bio! 🍿✨\n\n"
            "#whattowatch #movierecommendation #dune2 #deadpool #deadpoolandwolverine #jawan #netflix #primevideo #disneyplus #movienight #cinema #fyp #foryou #foryoupage #viral\n\n"
            "--------------------------------------------------------------------------------\n"
            "💬 RECOMMENDED PINNED FIRST COMMENT (Post immediately after uploading):\n"
            "--------------------------------------------------------------------------------\n"
            "Drop your movie recommendation below! 👇 Full global streaming guide in our bio link 🍿\n"
            "================================================================================\n"
        )
        with open(output_caption, "w", encoding="utf-8") as cf:
            cf.write(caption_text)

        print("\n" + "=" * 75)
        print("✨✨ VIRAL MOVIE PROMO VIDEO & CAPTION READY! ✨✨")
        print("=" * 75)
        print(f"🎥 Video File   : {output_mp4}")
        print(f"📝 Caption File : {output_caption}")
        print(f"📦 File Size    : {size_mb:.2f} MB")
        print(f"🎵 Audio Track  : Epic Action Trailer Music + Voiceover Ducking")
        print(f"🎬 Motion       : Dynamic Ken Burns Camera Zoom on all scenes")
        print("=" * 75)

        # Optional Auto-Post to Facebook Reels
        if auto_post_facebook:
            try:
                from backend.services.facebook_poster import post_video_to_facebook
                print(f"[Facebook Reels] Uploading movie promo to Facebook Reels...")
                fb_res = post_video_to_facebook(
                    video_path=str(output_mp4),
                    title="Weekend Movie Night | Top 3 Streaming Blockbusters",
                    description="🍿 Stop scrolling! 3 Blockbusters streaming tonight: Dune 2, Deadpool & Wolverine, and Jawan! Check globalpulseai.vercel.app/movies for verified streaming links #MovieNight #WhatToWatch"
                )
                if fb_res.get("success"):
                    print(f"✔ [Facebook Reels] Movie promo published to Reels: https://www.facebook.com/reel/{fb_res.get('video_id')}")
            except Exception as fb_err:
                print(f"[Facebook Reels Notice] {fb_err}")

        return {
            "success": True,
            "video_path": str(output_mp4),
            "caption_path": str(output_caption),
            "promo_id": promo_id
        }
    else:
        err = res_final.stderr.decode('utf-8', errors='ignore')
        print(f"Final encode error: {err}")
        return {"success": False, "error": err}

if __name__ == "__main__":
    generate_movie_promo()
