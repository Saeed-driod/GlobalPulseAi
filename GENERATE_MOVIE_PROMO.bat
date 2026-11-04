@echo off
title GlobalPulse AI - Viral TikTok Movie Promo Generator
color 0b

echo ======================================================================
echo    🎬 GlobalPulse AI - Viral TikTok & Shorts Movie Promo Generator
echo ======================================================================
echo.

cd /d "%~dp0"

if exist "backend\venv\Scripts\python.exe" (
    echo [*] Starting automated promo generation pipeline...
    "backend\venv\Scripts\python.exe" generate_movie_promo.py
) else (
    echo [!] backend\venv not found. Falling back to system python...
    python generate_movie_promo.py
)

echo.
echo ======================================================================
echo [OK] Done! Check your video in: exports\tiktok\
echo ======================================================================
pause
