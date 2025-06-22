# 🚀 SUPABASE SETUP FOR FANTASY.AI

## Quick Setup Guide

### 1. Create Supabase Project
Go to https://supabase.com and create a new project (free tier is fine!)

### 2. Get Your Database URL
Once created, go to Settings → Database and copy the connection string:
```
postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT].supabase.co:5432/postgres
```

### 3. Update .env.local
Add to your `.env.local` file:
```
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT].supabase.co:5432/postgres"
SUPABASE_DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT].supabase.co:5432/postgres"
```

### 4. Push Schema to Supabase
```bash
# Generate Prisma client for PostgreSQL
npm run db:generate

# Push schema to Supabase
npm run db:push
```

### 5. Migrate Your 5,040 Players
```bash
# Run the migration script
npx tsx scripts/migrate-to-supabase.ts
```

### 6. Update Vercel Environment Variables
In Vercel dashboard, add:
- `DATABASE_URL` = Your Supabase connection string

### 7. Deploy!
```bash
vercel --prod
```

## Benefits of Supabase
- ✅ Real PostgreSQL database (not SQLite)
- ✅ Works perfectly with Vercel serverless
- ✅ Built-in auth, real-time, and storage
- ✅ Free tier includes 500MB database
- ✅ Automatic backups
- ✅ Row Level Security (RLS)
- ✅ No more "database file not found" errors!

## Your 5,040 Players Will Be:
- Instantly accessible from anywhere
- Super fast with PostgreSQL indexes
- Ready for real-time updates
- Scalable to millions of players

## MCP Server Integration
We're using the Supabase MCP server which gives us:
- Direct database operations
- Real-time subscriptions
- Auth management
- File storage
- All through MCP commands!