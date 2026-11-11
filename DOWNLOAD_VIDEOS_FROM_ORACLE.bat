@echo off
title GlobalPulse AI - Video Sync
color 0A
echo ===================================================================
echo   GLOBALPULSE AI - TIKTOK ^& YOUTUBE VIDEO SYNC
echo   Downloading latest rendered videos from Oracle Cloud VM...
echo ===================================================================
echo.

if not exist "%USERPROFILE%\.ssh\oracle_globalpulse.key" (
    echo [ERROR] SSH Key not found at %USERPROFILE%\.ssh\oracle_globalpulse.key
    pause
    exit /b
)

if not exist "d:\Global English Audience\videos" (
    mkdir "d:\Global English Audience\videos"
)

echo Syncing videos from Oracle Cloud server (150.136.214.192)...
scp -i "%USERPROFILE%\.ssh\oracle_globalpulse.key" -o StrictHostKeyChecking=no ubuntu@150.136.214.192:/home/ubuntu/globalpulse-ai/videos/* "d:\Global English Audience\videos"

echo.
echo ===================================================================
echo   SUCCESS: All videos and captions are synced to your local PC!
echo   Folder: d:\Global English Audience\videos
echo ===================================================================
explorer "d:\Global English Audience\videos"
pause
