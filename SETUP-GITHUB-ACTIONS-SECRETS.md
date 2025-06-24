# GitHub Actions Secrets Setup

After pushing to GitHub, set up these secrets for GitHub Actions:

## Required Secrets

1. Go to: https://github.com/J-Stoned/fantasy-ai-mvp/settings/secrets/actions

2. Add these secrets:

### Database
- `DATABASE_URL`: Your Supabase connection string
- `DIRECT_DATABASE_URL`: Your Supabase direct connection string

### Authentication
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: https://fantasy-ai-mvp.vercel.app

### API Keys
- `OPENAI_API_KEY`: Your production OpenAI key
- `STRIPE_SECRET_KEY`: Your production Stripe key
- `STRIPE_PUBLISHABLE_KEY`: Your production Stripe publishable key
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret

### Sports APIs (for data collection)
- `ESPN_API_KEY`: (if you have one)
- `YAHOO_CLIENT_ID`: Your Yahoo Fantasy API client ID
- `YAHOO_CLIENT_SECRET`: Your Yahoo Fantasy API client secret

### Optional
- `ELEVENLABS_API_KEY`: For voice features
- `SENTRY_DSN`: For error tracking
- `VERCEL_TOKEN`: For automated deployments

## GitHub Actions will run every 5 minutes for:
- Real-time data collection
- Player statistics updates
- ML model training
- Performance optimization

## Quick Commands After Setup:

```bash
# Check workflow runs
https://github.com/J-Stoned/fantasy-ai-mvp/actions

# Monitor data collection
https://github.com/J-Stoned/fantasy-ai-mvp/actions/workflows/continuous-data-collection.yml

# View ML training progress  
https://github.com/J-Stoned/fantasy-ai-mvp/actions/workflows/ml-training.yml
```