#!/bin/bash
# Option B: Remove sensitive data from git history

echo "=== OPTION B: Clean Git History ==="
echo
echo "This will remove the sensitive vercel.json from git history"
echo "WARNING: This will rewrite git history!"
echo
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Create a backup branch
git branch backup-master-clean

# Remove the file from history
echo "Removing sensitive vercel.json from history..."
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch fantasy-ai-mvp/vercel.json' \
  --prune-empty --tag-name-filter cat -- --all

# Clean up
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo
echo "History cleaned! Now push with:"
echo "git push --force -u origin master-clean"
echo
echo "Note: You'll need to set up the GitHub token:"
echo "git remote set-url origin https://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@github.com/J-Stoned/fantasy-ai-mvp.git"