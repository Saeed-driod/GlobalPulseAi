@echo off
title GlobalPulse AI - Local Video Worker & YouTube Shorts Uploader
color 0b
cls
echo ===============================================================================
echo     GLOBALPULSE AI - HIGH PERFORMANCE LOCAL VIDEO GENERATION WORKER
echo ===============================================================================
echo  Target Channel  : @GloblePulseAi (YouTube Shorts)
echo  Database Sync   : Neon PostgreSQL Cloud
echo  Rendering Unit  : 100%% Local PC Hardware (FFmpeg 7.1 + Edge-TTS)
echo  Cloud RAM Used  : 0 MB (Completely Offloaded from Render Free Tier)
echo ===============================================================================
echo.
echo  Mission Control: Open https://globalpulseai.vercel.app/admin in your browser.
echo  When you click "Render & Upload Video" in Admin, this worker renders it
echo  and streams real-time progress (%%, ETA, step) directly to your screen!
echo.
echo  Starting worker daemon loop... (Press Ctrl+C to stop)
echo -------------------------------------------------------------------------------
echo.

cd /d "%~dp0"

IF EXIST "backend\venv\Scripts\python.exe" (
    "backend\venv\Scripts\python.exe" local_worker.py --daemon --watch --interval 10
) ELSE (
    python local_worker.py --daemon --watch --interval 10
)

echo.
echo [Worker] Worker exited.
pause
