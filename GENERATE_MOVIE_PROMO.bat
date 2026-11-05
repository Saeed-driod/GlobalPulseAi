@echo off
title GlobalPulse AI - Viral TikTok & Reels Movie Promo Generator
color 0b

echo ======================================================================
echo    🎬 GlobalPulse AI - Viral TikTok & Reels Movie Promo Generator
echo ======================================================================
echo  Output Location : All videos saved in ONE folder: "videos\"
echo ======================================================================
echo.

cd /d "%~dp0"

if exist "backend\venv\Scripts\python.exe" (
    echo [*] Starting automated promo generation pipeline...
    "backend\venv\Scripts\python.exe" local_worker.py --movie-promo
) else (
    echo [!] backend\venv not found. Falling back to system python...
    python local_worker.py --movie-promo
)

echo.
echo ======================================================================
echo [OK] Done! Check your video and caption in: videos\
echo ======================================================================
pause

