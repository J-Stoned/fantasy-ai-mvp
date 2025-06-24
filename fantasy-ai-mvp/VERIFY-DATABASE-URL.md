# 🔍 VERIFY YOUR DATABASE URL IS CORRECT

## The Problem:
Your app is STILL trying to connect to:
```
aws-0-us-east-1.pooler.supabase.com:6543
```

But it SHOULD be connecting to:
```
db.jhfhsbqrdblytrlrconc.supabase.co:5432
```

## Step 1: Double-Check Vercel Environment Variables

1. Go to: https://vercel.com/justinrstone81-gmailcoms-projects/fantasy-ai-mvp/settings/environment-variables
2. Find `DATABASE_URL`
3. Make sure it looks like this:

```
postgresql://postgres.jhfhsbqrdblytrlrconc:[YOUR-PASSWORD]@db.jhfhsbqrdblytrlrconc.supabase.co:5432/postgres
```

**NOT** like this:
```
postgresql://postgres.jhfhsbqrdblytrlrconc:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

## Step 2: If You Need the Correct URL

1. Go to: https://supabase.com/dashboard/project/jhfhsbqrdblytrlrconc/settings/database
2. Scroll to **Connection string**
3. Select **URI** tab
4. **IMPORTANT**: Make sure **Connection pooling** is UNCHECKED ❌
5. Copy the connection string

## Step 3: Update and Save

1. Edit the DATABASE_URL in Vercel
2. Paste the DIRECT connection (without pooler)
3. Click **Save**
4. Make sure it's enabled for all environments (Production, Preview, Development)

## Step 4: Force New Deployment

After saving, the deployment will auto-trigger. Check the new deployment at:
https://vercel.com/justinrstone81-gmailcoms-projects/fantasy-ai-mvp

## What the Direct URL Should Look Like:
```
postgresql://postgres.jhfhsbqrdblytrlrconc:3O4X69OIECpNNjoW@db.jhfhsbqrdblytrlrconc.supabase.co:5432/postgres
```

Notice:
- ✅ Uses `db.jhfhsbqrdblytrlrconc.supabase.co`
- ✅ Port `5432` (not 6543)
- ✅ NO `pgbouncer=true`
- ✅ NO `pooler` in the URL

Once this is fixed, your Fantasy.AI will have FULL DATABASE ACCESS to all 5,040 players!