@echo off
title GlobalPulse AI - TikTok One-Click OAuth Authenticator
color 0d
cls
echo ===============================================================================
echo     GLOBALPULSE AI - TIKTOK FOR DEVELOPERS OAUTH AUTHENTICATOR
echo ===============================================================================
echo  Connects your verified TikTok Account to the Master Autonomous Video Worker.
echo ===============================================================================
echo.

cd /d "%~dp0"

IF EXIST "backend\venv\Scripts\python.exe" (
    "backend\venv\Scripts\python.exe" auth_tiktok.py
) ELSE (
    python auth_tiktok.py
)

echo.
pause
