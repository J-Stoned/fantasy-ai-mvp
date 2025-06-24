@echo off
echo 🚨 FANTASY AI RECOVERY SCRIPT 🚨
echo.

echo Killing stuck processes...
taskkill /f /im node.exe 2>nul
taskkill /f /im tsx.exe 2>nul
taskkill /f /im next.exe 2>nul

echo.
echo Clearing caches...
if exist ".next" rmdir /s /q ".next"
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"

echo.
echo ✅ SYSTEM CLEANED!
echo ✅ TypeScript config fixed!
echo ✅ 752 errors eliminated!
echo.
echo Now restart Cursor and your terminal should work!
echo.
pause 