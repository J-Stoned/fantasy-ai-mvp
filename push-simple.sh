#!/bin/bash

echo "🚀 Pushing Fantasy.AI to GitHub..."
echo ""
echo "Git will prompt for your GitHub username and password/token"
echo "For password, use your Personal Access Token (not your GitHub password)"
echo ""

# This will use git's built-in credential manager
git push origin master-clean

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Fantasy.AI has been pushed to GitHub!"
    echo ""
    echo "🎯 Check your GitHub Actions at:"
    echo "https://github.com/J-Stoned/fantasy-ai-mvp/actions"
    echo ""
    echo "🔗 Your live app: https://fantasy-ai-mvp.vercel.app"
else
    echo ""
    echo "❌ Push failed. Please check your credentials and try again."
fi