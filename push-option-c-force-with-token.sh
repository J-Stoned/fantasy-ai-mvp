#!/bin/bash
# Option C: Configure GitHub token and force push

echo "=== OPTION C: Force Push with Token ==="
echo
echo "Setting up GitHub token authentication..."

# Set the remote URL with token
git remote set-url origin https://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@github.com/J-Stoned/fantasy-ai-mvp.git

echo "Remote URL updated with token!"
echo
echo "Current remotes:"
git remote -v
echo

echo "Now you have two choices:"
echo
echo "1. Try regular push (might still be blocked by push protection):"
echo "   git push -u origin master-clean"
echo
echo "2. If blocked, use the bypass URLs from Option A, then push"
echo
echo "The token is now configured for authentication!"