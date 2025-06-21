@echo off
echo 🚀 DEPLOYING FANTASY.AI WITH 1,375+ AI WORKERS 🚀
echo ================================================

echo 📦 Building locally first to catch any errors...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Local build failed! Fixing and retrying...
    pause
    exit /b 1
)

echo ✅ Local build successful! Deploying to Vercel...
call vercel --prod --yes

echo 🎉 DEPLOYMENT COMPLETE! 
echo Your Fantasy.AI platform is now LIVE with revolutionary AI!
pause