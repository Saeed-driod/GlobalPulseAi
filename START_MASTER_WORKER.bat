@echo off
title GlobalPulse AI - ALL-IN-ONE MASTER AUTONOMOUS WORKER
color 0b
cls
echo ===============================================================================
echo     GLOBALPULSE AI - ALL-IN-ONE MASTER AUTONOMOUS WORKER & MEDIA HUB
echo ===============================================================================
echo  Target YouTube     : @GloblePulseAi (YouTube Shorts & Longs)
echo  Facebook Page      : Pari Hoor / GlobalPulse AI (Feed Posts & Reels Auto-Upload)
echo  Viral Movie Promos : Auto-renders 9:16 vertical TikTok/Reel trailers into videos/
echo  Search Engines     : IndexNow Protocol (Bing, Yahoo, Yandex, Naver Instant Index)
echo  Unified Storage    : ALL videos saved in ONE folder -> "videos\"
echo  Cloud RAM Used     : 0 MB (100%% Hardware Accelerated on your Local PC)
echo ===============================================================================
echo.
echo  Mission Control: Open https://globalpulseai.vercel.app/admin in your browser.
echo  All generated videos (News, Shorts, Longs, Movie Promos) go directly into:
echo    ==^> D:\Global English Audience\videos\
echo.
echo  Starting Master Autonomous Daemon Loop... (Press Ctrl+C to stop)
echo -------------------------------------------------------------------------------
echo.

cd /d "%~dp0"

IF EXIST "backend\venv\Scripts\python.exe" (
    "backend\venv\Scripts\python.exe" -u local_worker.py --daemon --watch --format auto --interval 15 --upload
) ELSE (
    python -u local_worker.py --daemon --watch --format auto --interval 15 --upload
)

echo.
echo [Master Worker] Worker exited.
pause
