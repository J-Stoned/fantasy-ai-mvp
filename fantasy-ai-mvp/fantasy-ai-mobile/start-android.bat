@echo off
echo ========================================
echo 🚀 Fantasy.AI Mobile - Android Quick Start
echo ========================================
echo.
echo 📱 Step 1: Make sure you have Expo Go installed on your Android device
echo    Download from: https://play.google.com/store/apps/details?id=host.exp.exponent
echo.
echo 📡 Step 2: Starting the development server...
echo.

cd /d "%~dp0"

echo Checking if dependencies are installed...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install --legacy-peer-deps
)

echo.
echo Starting Expo...
call npx expo start

pause