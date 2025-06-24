# Quick Environment Variable Setup for Vercel

## 1. Go to your Vercel Dashboard:
https://vercel.com/justinrstone81-gmailcoms-projects/fantasy-ai-mvp/settings/environment-variables

## 2. Add these environment variables:

### Database (REQUIRED)
- `DATABASE_URL` = your Supabase connection string
- `SUPABASE_URL` = your Supabase project URL
- `SUPABASE_ANON_KEY` = your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` = your Supabase service role key

### Authentication (REQUIRED)
- `NEXTAUTH_SECRET` = (generate one at: https://generate-secret.vercel.app/32)
- `NEXTAUTH_URL` = https://fantasy-ai-mvp.vercel.app

### API Keys
- `OPENAI_API_KEY` = sk-proj-... (your OpenAI key)
- `STRIPE_SECRET_KEY` = sk_test_... (your Stripe secret key)
- `STRIPE_PUBLISHABLE_KEY` = pk_test_... (your Stripe publishable key)
- `STRIPE_WEBHOOK_SECRET` = whsec_... (from Stripe dashboard)

### Optional but Recommended
- `ELEVENLABS_API_KEY` = for voice features
- `CRON_SECRET` = (generate a random string for security)

### MCP Servers (Optional)
- `FIRECRAWL_API_KEY` = for advanced web scraping
- `ANTHROPIC_API_KEY` = for Claude integration

## 3. After adding all variables:
- Click "Save"
- Your app will automatically redeploy with the new settings!