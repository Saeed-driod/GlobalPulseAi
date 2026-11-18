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

if exist "%USERPROFILE%\.ssh\oracle_globalpulse.key" (
    echo.
    echo -------------------------------------------------------------------------------
    echo Syncing renewed token to Oracle Cloud VM (150.136.214.192)...
    echo -------------------------------------------------------------------------------
    scp -i "%USERPROFILE%\.ssh\oracle_globalpulse.key" -o StrictHostKeyChecking=no backend\token.json ubuntu@150.136.214.192:/home/ubuntu/globalpulse-ai/backend/token.json
    ssh -i "%USERPROFILE%\.ssh\oracle_globalpulse.key" -o StrictHostKeyChecking=no ubuntu@150.136.214.192 "sudo systemctl restart globalpulse-worker.service"
    echo.
    echo [Oracle VM] Worker service restarted with fresh token! Auto-uploads resumed.
)

echo.
echo You can now restart START_VIDEO_WORKER.bat if running locally as well.
echo.
pause
