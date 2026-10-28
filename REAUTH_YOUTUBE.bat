@echo off
title GlobalPulse AI - Re-Authorize YouTube Channel
color 0a
cls
echo ===============================================================================
echo     GLOBALPULSE AI - YOUTUBE CHANNEL OAUTH RE-AUTHORIZATION
echo ===============================================================================
echo  Channel: @GloblePulseAi
echo  Action : Renewing expired Google OAuth token for YouTube Video & Shorts
echo ===============================================================================
echo.

cd /d "%~dp0"

IF EXIST "backend\venv\Scripts\python.exe" (
    "backend\venv\Scripts\python.exe" local_worker.py --auth
) ELSE (
    python local_worker.py --auth
)

echo.
echo [Done] If successful, your token.json is renewed!
echo You can now restart START_VIDEO_WORKER.bat to continue uploads.
echo.
pause
