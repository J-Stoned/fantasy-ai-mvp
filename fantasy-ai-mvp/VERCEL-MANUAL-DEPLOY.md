# 🚀 Vercel Manual Deployment Guide

If automatic deployments aren't working, follow these steps:

## Option 1: Fix GitHub Integration (Recommended)

1. **Go to Vercel Dashboard**
   - https://vercel.com/dashboard

2. **Check Project Settings**
   - Click on `fantasy-ai-mvp` project
   - Go to "Settings" → "Git"
   - Verify:
     - GitHub repository: `J-Stoned/fantasy-ai-mvp`
     - Production branch: `master` (not `main` or `master-clean`)
     - Auto-deploy: Enabled

3. **Reconnect GitHub if needed**
   - Click "Disconnect" then "Connect" again
   - Grant permissions to the repository

## Option 2: Manual Deploy via Vercel Dashboard

1. Go to your project: https://vercel.com/dashboard
2. Click on `fantasy-ai-mvp`
3. Go to "Deployments" tab
4. Click "Redeploy" on the latest deployment
5. OR click "Create Deployment" → Select `master` branch

## Option 3: Deploy via Vercel CLI

```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Deploy directly
vercel --prod

# Or link and deploy
vercel link
vercel --prod
```

## Option 4: Force Deployment via Git

```bash
# Make a small change
git commit --allow-empty -m "Force deployment"
git push origin master
```

## Verify Deployment Success

After deployment, check these endpoints:

1. **New test endpoint** (should return 200):
   ```
   https://fantasy-ai-mvp.vercel.app/api/test-direct-db
   ```

2. **Player count** (should NOT mention pooler):
   ```
   https://fantasy-ai-mvp.vercel.app/api/debug/player-count
   ```

3. **Dashboard**:
   ```
   https://fantasy-ai-mvp.vercel.app/dashboard-simple
   ```

## Environment Variables to Verify

Make sure these are set in Vercel (without quotes!):
- `DATABASE_URL` - Direct connection (not pooler)
- `DIRECT_URL` - Same as DATABASE_URL
- `NEXT_PUBLIC_SUPABASE_URL` - No quotes around the URL!
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your anon key

## If Build Fails

Check build logs for:
1. "Invalid URL" errors → Remove quotes from env vars
2. "Module not found" → Missing dependencies
3. TypeScript errors → Check recent code changes