# 🔧 Vercel Database Fix Guide

## Quick Fix Steps:

### 1. Go to Vercel Dashboard
- https://vercel.com/dashboard
- Click on your `fantasy-ai-mvp` project

### 2. Navigate to Environment Variables
- Click "Settings" tab
- Click "Environment Variables" in sidebar

### 3. Update DATABASE_URL
Find `DATABASE_URL` and change it from the pooler URL to direct connection:

**OLD (Pooler - WRONG):**
```
postgresql://postgres.jhfhsbqrdblytrlrconc:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**NEW (Direct - CORRECT):**
```
postgresql://postgres.jhfhsbqrdblytrlrconc:3O4X69OIECpNNjoW@db.jhfhsbqrdblytrlrconc.supabase.co:5432/postgres
```

### 4. Force Redeploy
- Go to "Deployments" tab
- Click the three dots on latest deployment
- Click "Redeploy"

### 5. Test It Works
After deployment completes (2-3 mins), test:
- https://fantasy-ai-mvp.vercel.app/api/debug/player-count
- Should show player count instead of error!

## Why This Matters:
- Pooler connections don't work well with Prisma
- Direct connection is more stable
- Fixes "prepared statement" errors
- Enables all database features

## Next Steps After Fix:
1. ✅ Database working = populate with real data
2. ✅ Enable AI features
3. ✅ Launch to users!