# 🚀 Fantasy.AI Production Deployment Guide

## ⚠️ CRITICAL SECURITY NOTICE
All API keys have been removed from `vercel.json` for security. You MUST set up environment variables in Vercel dashboard before deployment.

## 📋 Pre-Deployment Checklist

### 1. ✅ Data Storage Migration Complete
- [x] Database schema updated with data collection tables
- [x] Data collection now saves to database (not JSON files)
- [x] Processing pipeline extracts structured data
- [x] Cleanup job removes old data after 7 days
- [x] All temporary JSON files removed from repository

### 2. 🔐 Environment Variables to Set in Vercel

Go to your Vercel project settings → Environment Variables and add:

#### Required Variables:
```bash
# Authentication
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=[Generate with: openssl rand -base64 32]

# Database (Choose one option)
## Option A: Vercel Postgres (Recommended)
DATABASE_URL=[Your Vercel Postgres connection string]

## Option B: Supabase
DATABASE_URL=[Your Supabase connection string]
SUPABASE_URL=[Your Supabase URL]
SUPABASE_ANON_KEY=[Your Supabase anon key]

# AI Services
OPENAI_API_KEY=[Your OpenAI API key]
ELEVENLABS_API_KEY=[Your ElevenLabs API key] # Optional

# Payments
STRIPE_SECRET_KEY=[Your Stripe secret key]
STRIPE_PUBLISHABLE_KEY=[Your Stripe publishable key]
STRIPE_WEBHOOK_SECRET=[Your Stripe webhook secret]
```

#### Feature Flags (Optional):
```bash
ENABLE_WAGERING=false
ENABLE_LIVE_BETTING=false
ENABLE_CRYPTO=false
ENABLE_PROP_BETTING=false
```

### 3. 🗄️ Database Setup

#### Option A: Vercel Postgres (Easiest)
1. Go to Vercel Dashboard → Storage → Create Database
2. Select Postgres
3. Copy the connection string to `DATABASE_URL`
4. Run migrations: `npm run db:push`

#### Option B: Supabase
1. Create project at supabase.com
2. Copy connection details
3. Update Prisma schema provider to `postgresql`
4. Run migrations: `npm run db:push`

### 4. 🔄 Data Collection Setup

The new database-based data collection system:
- Stores all data in database tables
- No more JSON files cluttering the repository
- Automatic cleanup of old data
- Better performance and scalability

To start data collection in production:
```bash
# Option 1: Manual trigger
npm run data:processor

# Option 2: Set up cron job in Vercel
# Add to vercel.json:
{
  "crons": [{
    "path": "/api/cron/data-collection",
    "schedule": "*/30 * * * *"
  }]
}
```

## 🚀 Deployment Steps

1. **Commit all changes**
   ```bash
   git add .
   git commit -m "🔒 Secure production deployment - API keys removed, data in DB"
   git push origin main
   ```

2. **Connect to Vercel**
   ```bash
   vercel
   ```

3. **Set environment variables in Vercel dashboard**

4. **Deploy**
   ```bash
   vercel --prod
   ```

5. **Run database migrations**
   ```bash
   vercel env pull .env.production.local
   DATABASE_URL=[prod-url] npm run db:push
   ```

6. **Verify deployment**
   - Check all API endpoints
   - Test authentication flow
   - Verify database connections
   - Test payment integration

## 📊 Post-Deployment Monitoring

1. **Database Health**
   - Monitor table sizes
   - Check processing queue
   - Verify cleanup job

2. **Error Tracking**
   - Set up Sentry or similar
   - Monitor API errors
   - Track failed data collections

3. **Performance**
   - API response times
   - Database query performance
   - Data processing speed

## 🆘 Troubleshooting

### Common Issues:

1. **"Environment variable not found"**
   - Ensure all variables are set in Vercel dashboard
   - Check for typos in variable names

2. **Database connection errors**
   - Verify connection string format
   - Check IP whitelisting (if applicable)
   - Ensure database is accessible

3. **Build failures**
   - Check Node version compatibility
   - Verify all dependencies installed
   - Review build logs for specific errors

## 🎉 Success Indicators

Your deployment is successful when:
- ✅ Website loads without errors
- ✅ Users can sign up/login
- ✅ Database queries work
- ✅ API endpoints respond
- ✅ Data collection runs without creating JSON files
- ✅ No exposed secrets in repository

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review database connection settings
3. Verify all environment variables
4. Check browser console for client-side errors

---

**Remember**: NEVER commit API keys to the repository. Always use environment variables!