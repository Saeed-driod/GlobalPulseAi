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
    "backend\venv\Scripts\python.exe" -c "import local_worker; local_worker.send_worker_heartbeat(status='IDLE'); local_worker.sync_token_to_render()"
) ELSE (
    python local_worker.py --auth
    python -c "import local_worker; local_worker.send_worker_heartbeat(status='IDLE'); local_worker.sync_token_to_render()"
)

echo.
echo [Done] If successful, your token.json is renewed!
echo You can now restart START_VIDEO_WORKER.bat to continue uploads.
echo.
pause
