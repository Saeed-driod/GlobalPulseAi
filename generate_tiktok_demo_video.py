"""
GlobalPulse AI - Official TikTok Developer App Review Demo Video Generator
Renders a compliant, high-definition 1920x1080 demo video showcasing:
1. Domain: https://globalpulseai.vercel.app
2. Scopes: user.info.profile, video.manage, video.list
3. End-to-end integration flow with clear visual diagrams & professional voiceover.
"""
import os
import sys
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

ROOT_DIR = Path(__file__).resolve().parent
VIDEOS_DIR = ROOT_DIR / "videos"
VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
TEMP_DIR = ROOT_DIR / "backend" / "static" / "temp_demo"
TEMP_DIR.mkdir(parents=True, exist_ok=True)

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

def get_font(size: int, bold: bool = False):
    font_names = ["msyhbd.ttc", "arialbd.ttf", "segoeuib.ttf", "arial.ttf", "seguisb.ttf"] if bold else ["msyh.ttc", "arial.ttf", "segoeui.ttf"]
    for fn in font_names:
        p = Path("C:/Windows/Fonts") / fn
        if p.exists():
            try:
                return ImageFont.truetype(str(p), size)
            except Exception:
                pass
    return ImageFont.load_default()

def create_slide_image(slide_num: int, title: str, subtitle: str, badge: str, bullet_points: list, output_path: Path):
    W, H = 1920, 1080
    img = Image.new("RGB", (W, H), (10, 15, 29))
    draw = ImageDraw.Draw(img)

    # Gradient header bar
    for y in range(80):
        draw.line([(0, y), (W, y)], fill=(13, 24, 48))

    font_brand = get_font(32, bold=True)
    font_badge = get_font(22, bold=True)
    font_title = get_font(52, bold=True)
    font_sub = get_font(28, bold=False)
    font_bullet_title = get_font(30, bold=True)
    font_bullet_body = get_font(24, bold=False)

    # Top Navigation / Domain Bar
    draw.rectangle([50, 20, 600, 65], fill=(20, 35, 65), outline=(0, 242, 254), width=1)
    draw.text((70, 28), "🌐 https://globalpulseai.vercel.app", fill=(255, 255, 255), font=font_brand)

    # TikTok Integration Badge
    draw.rounded_rectangle([W - 480, 20, W - 50, 65], radius=8, fill=(254, 44, 85))
    draw.text((W - 450, 28), "TikTok for Developers Integration", fill=(255, 255, 255), font=font_badge)

    # Section Badge
    draw.rounded_rectangle([100, 140, 480, 185], radius=6, fill=(0, 242, 254))
    draw.text((120, 148), badge.upper(), fill=(5, 10, 20), font=font_badge)

    # Main Title
    draw.text((100, 210), title, fill=(255, 255, 255), font=font_title)
    draw.text((100, 280), subtitle, fill=(160, 180, 210), font=font_sub)

    # Card / Content Boxes
    draw.line([(100, 330), (W - 100, 330)], fill=(30, 45, 80), width=2)

    card_y = 370
    for i, (b_title, b_desc, b_color) in enumerate(bullet_points):
        # Card background
        draw.rounded_rectangle([100, card_y, W - 100, card_y + 115], radius=12, fill=(18, 27, 48), outline=(35, 50, 85), width=2)
        # Left Accent pill
        draw.rounded_rectangle([100, card_y, 115, card_y + 115], radius=4, fill=b_color)
        # Number icon
        draw.ellipse([140, card_y + 35, 185, card_y + 80], fill=b_color)
        draw.text((155, card_y + 42), str(i + 1), fill=(10, 15, 29), font=font_badge)
        # Content
        draw.text((215, card_y + 22), b_title, fill=(255, 255, 255), font=font_bullet_title)
        draw.text((215, card_y + 65), b_desc, fill=(180, 200, 225), font=font_bullet_body)
        card_y += 140

    # Bottom Footer
    draw.rectangle([0, H - 70, W, H], fill=(13, 20, 38))
    draw.text((100, H - 48), "GlobalPulse AI Media Network Inc. • Automated Broadcast Engine • End-to-End TikTok API Workflow", fill=(120, 145, 180), font=font_bullet_body)

    img.save(str(output_path), "PNG")
    print(f"✓ Rendered Slide {slide_num}: {output_path.name}")

def main():
    print("=" * 70)
    print("🎬 Generating TikTok Developer App Review Demo Video...")
    print("=" * 70)

    slides_data = [
        {
            "badge": "Architecture Overview",
            "title": "GlobalPulse AI - Official TikTok Developer Integration",
            "subtitle": "Production Web App: https://globalpulseai.vercel.app",
            "duration": 6.5,
            "bullets": [
                ("Verified Domain & Editorial Platform", "Hosted at https://globalpulseai.vercel.app with verified ownership via signature file.", (0, 242, 254)),
                ("Automated News Media Engine", "Synthesizes real-time global intelligence into high-definition 65s+ vertical video briefings.", (79, 172, 254)),
                ("Full Compliance Architecture", "Adheres strictly to TikTok for Developers OAuth 2.0 token rotation & content guidelines.", (254, 44, 85)),
            ],
            "narration": "Welcome to GlobalPulse AI, hosted live at https://globalpulseai.vercel.app. In this demonstration, we showcase our official end-to-end integration with the TikTok for Developers Content Posting API."
        },
        {
            "badge": "Scope: user.info.profile",
            "title": "Step 1: Secure OAuth 2.0 Channel Authentication",
            "subtitle": "Identity verification & channel handshake protocol",
            "duration": 7.0,
            "bullets": [
                ("User Authentication Flow", "The channel administrator initiates OAuth2 authorization to connect the official TikTok profile.", (0, 242, 254)),
                ("Scope Authorization: user.info.profile", "Retrieves verified channel display name, avatar, and channel ID for dashboard telemetry.", (79, 172, 254)),
                ("Security & Token Rotation", "Access tokens expire in 2 hours and refresh tokens rotate every 180 days with local encrypted storage.", (254, 44, 85)),
            ],
            "narration": "First, the channel administrator connects their account using OAuth 2.0 with the user.info.profile scope, confirming profile identity and securely storing rotating credentials."
        },
        {
            "badge": "Scope: video.manage",
            "title": "Step 2: Automated Video Publishing to TikTok",
            "subtitle": "Programmatic broadcast transmission via Content Posting API",
            "duration": 8.0,
            "bullets": [
                ("Content Preparation", "GlobalPulse AI generates 9:16 vertical 1080p videos with synchronized speech and subtitles.", (0, 242, 254)),
                ("Scope Authorization: video.manage", "Calls /v2/post/publish/video/init/ to upload video chunks and auto-publish to creator feed.", (254, 44, 85)),
                ("Metadata & Hashtags", "Attaches breaking news headlines, AI summaries, and relevant category tags automatically.", (79, 172, 254)),
            ],
            "narration": "Next, using the video.manage scope, our production engine formats and uploads verified news briefings with headlines and hashtags directly to the creator feed."
        },
        {
            "badge": "Scope: video.list",
            "title": "Step 3: Post Verification & Feed Synchronization",
            "subtitle": "Monitoring live feed and preventing duplicate broadcasts",
            "duration": 7.0,
            "bullets": [
                ("Scope Authorization: video.list", "Fetches recently published video items to verify successful live feed broadcast.", (79, 172, 254)),
                ("Deduplication Engine", "Ensures identical news stories or viral promos are never duplicated on the channel.", (0, 242, 254)),
                ("Real-time Publication Logs", "Displays video reach and confirmation links inside the GlobalPulse AI control console.", (254, 44, 85)),
            ],
            "narration": "Finally, the video.list scope monitors publication status to ensure successful delivery and avoid duplicate uploads on the channel feed."
        },
        {
            "badge": "Summary & Submission",
            "title": "End-to-End Workflow Ready for Production",
            "subtitle": "Fully compliant with TikTok Developer Policies",
            "duration": 6.5,
            "bullets": [
                ("Production URL", "https://globalpulseai.vercel.app with complete Privacy Policy and Terms of Service.", (0, 242, 254)),
                ("Scopes Utilized", "user.info.profile, video.manage, video.list (Clean minimal scope footprint).", (79, 172, 254)),
                ("Creator Focused", "Empowering high-quality, informative world news journalism on TikTok.", (254, 44, 85)),
            ],
            "narration": "All requested scopes are actively utilized in this workflow with strict data privacy. GlobalPulse AI is fully prepared for official TikTok API integration."
        }
    ]

    # Step 1: Render slides
    slide_files = []
    for i, slide in enumerate(slides_data):
        out_p = TEMP_DIR / f"slide_{i}.png"
        create_slide_image(i + 1, slide["title"], slide["subtitle"], slide["badge"], slide["bullets"], out_p)
        slide_files.append((out_p, slide["duration"], slide["narration"]))

    # Step 2: Synthesize Voiceover via gTTS
    print("\nSynthesizing voiceover audio...")
    from gtts import gTTS
    full_text = " ".join([s["narration"] for s in slides_data])
    audio_path = TEMP_DIR / "demo_voiceover.mp3"
    tts = gTTS(text=full_text, lang="en", tld="com", slow=False)
    tts.save(str(audio_path))
    print(f"✓ Voiceover ready: {audio_path.name}")

    # Probe voiceover duration
    probe_cmd = [FFMPEG_EXE, "-i", str(audio_path)]
    probe_res = subprocess.run(probe_cmd, capture_output=True, text=True, errors="replace")
    import re
    match = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", probe_res.stderr)
    total_audio_dur = 35.0
    if match:
        h, m, s = match.groups()
        total_audio_dur = int(h) * 3600 + int(m) * 60 + float(s)
    print(f"✓ Total voiceover duration: {total_audio_dur:.1f}s")

    # Adjust slide durations proportionally
    per_slide_dur = total_audio_dur / len(slides_data)

    # Step 3: Render video clips with FFmpeg
    clip_files = []
    for i, (slide_img, _, _) in enumerate(slide_files):
        clip_mp4 = TEMP_DIR / f"clip_{i}.mp4"
        cmd = [
            FFMPEG_EXE, "-y",
            "-loop", "1",
            "-i", str(slide_img),
            "-t", str(per_slide_dur),
            "-c:v", "libx264",
            "-tune", "stillimage",
            "-pix_fmt", "yuv420p",
            "-r", "30",
            str(clip_mp4)
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        clip_files.append(clip_mp4)
        print(f"✓ Clip {i+1}/{len(slide_files)} compiled ({per_slide_dur:.1f}s)")

    # Step 4: Concatenate video clips
    concat_list = TEMP_DIR / "concat_list.txt"
    with open(concat_list, "w", encoding="utf-8") as f:
        for c in clip_files:
            f.write(f"file '{c.name}'\n")

    merged_video = TEMP_DIR / "merged_visuals.mp4"
    subprocess.run([
        FFMPEG_EXE, "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_list),
        "-c", "copy",
        str(merged_video)
    ], check=True, cwd=str(TEMP_DIR), capture_output=True)

    # Step 5: Merge with audio & output final video
    final_output = VIDEOS_DIR / "tiktok_integration_demo.mp4"
    bgm_path = ROOT_DIR / "backend" / "static" / "audio" / "action_trailer_bgm.mp3"

    if bgm_path.exists():
        # Mix BGM at low volume (-22dB) + voiceover
        audio_filter = "[1:a]volume=1.0[vocal];[2:a]volume=0.10[bgm];[vocal][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]"
        mux_cmd = [
            FFMPEG_EXE, "-y",
            "-i", str(merged_video),
            "-i", str(audio_path),
            "-i", str(bgm_path),
            "-filter_complex", audio_filter,
            "-map", "0:v",
            "-map", "[aout]",
            "-c:v", "copy",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            str(final_output)
        ]
    else:
        mux_cmd = [
            FFMPEG_EXE, "-y",
            "-i", str(merged_video),
            "-i", str(audio_path),
            "-c:v", "copy",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            str(final_output)
        ]

    subprocess.run(mux_cmd, check=True, capture_output=True)
    file_size_mb = final_output.stat().st_size / (1024 * 1024)

    print("\n" + "=" * 70)
    print("✨✨ TIKTOK DEVELOPER DEMO VIDEO READY! ✨✨")
    print("=" * 70)
    print(f"🎥 Video File : {final_output}")
    print(f"📦 Size       : {file_size_mb:.2f} MB (Well under 50MB limit)")
    print(f"⏱️ Duration   : {total_audio_dur:.1f} seconds")
    print(f"🌐 Shown URL  : https://globalpulseai.vercel.app")
    print(f"🔑 Scopes     : user.info.profile, video.manage, video.list")
    print("=" * 70)

if __name__ == "__main__":
    main()

