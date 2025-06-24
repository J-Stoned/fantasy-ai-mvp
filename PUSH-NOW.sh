#!/bin/bash

echo "🚀 Pushing Fantasy.AI to GitHub..."
echo ""
echo "This will activate:"
echo "✅ Data collection every 5 minutes"
echo "✅ ML training every 6 hours" 
echo "✅ 24/7 automated updates"
echo ""
echo "Please enter your GitHub personal access token:"
echo "(Get one at: https://github.com/settings/tokens)"
echo ""
read -s GITHUB_TOKEN

echo ""
echo "Pushing to GitHub..."
git push https://J-Stoned:$GITHUB_TOKEN@github.com/J-Stoned/fantasy-ai-mvp.git master-clean

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Fantasy.AI has been pushed to GitHub!"
    echo ""
    echo "🎯 What happens next:"
    echo "1. GitHub Actions starts immediately"
    echo "2. Data collection begins in ~5 minutes"
    echo "3. Check progress at: https://github.com/J-Stoned/fantasy-ai-mvp/actions"
    echo ""
    echo "🔗 Your live app: https://fantasy-ai-mvp.vercel.app"
else
    echo ""
    echo "❌ Push failed. Please check your token and try again."
fi