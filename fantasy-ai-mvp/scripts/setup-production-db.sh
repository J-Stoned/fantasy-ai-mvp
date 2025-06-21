#!/bin/bash

# Fantasy.AI Production Database Setup Script
# This script helps you set up your production database on Supabase

echo "🚀 Fantasy.AI Production Database Setup"
echo "======================================"
echo ""

# Check if .env.production exists
if [ -f .env.production ]; then
    echo "⚠️  .env.production already exists. Backing up to .env.production.backup"
    cp .env.production .env.production.backup
fi

# Prompt for database URL
echo "📋 After creating your Supabase project:"
echo "1. Go to Settings → Database"
echo "2. Find 'Connection string' → 'URI'"
echo "3. Copy the connection string"
echo ""
read -p "Paste your Supabase DATABASE_URL here: " DB_URL

# Create .env.production
cat > .env.production << EOF
# Production Environment Variables for Fantasy.AI

# Database (Supabase)
DATABASE_URL="$DB_URL"

# Copy these from your .env.local file:
NEXTAUTH_URL=https://fantasy-ai-mvp.vercel.app
NEXTAUTH_SECRET=fantasy-ai-development-secret-change-in-production

# OpenAI (You should regenerate this key for security)
OPENAI_API_KEY=your-openai-api-key-here

# Stripe (Test keys are fine for now)
STRIPE_SECRET_KEY=sk_test_51Rb5oIFvsEr7ne6FQ364dJn34yJo8XEECZxjwLBVmom7BxhjnzdlVyZoHYvo8qvChlziKUNaMJUuImG3KOXK1oOQ00WqRCsjmP
STRIPE_PUBLISHABLE_KEY=pk_test_51Rb5oIFvsEr7ne6FNld3LUfVXFRTdqkdVemnFJKHlYal39fIgFb9AFrOlekjr81e7SLKR9ExPTq4gBPvdRzW3C5N00pTzEDKli

# Feature Flags (Safe for production)
ENABLE_WAGERING=false
ENABLE_LIVE_BETTING=false
ENABLE_CRYPTO=false
ENABLE_PROP_BETTING=false

# Production Settings
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
EOF

echo "✅ Created .env.production file"
echo ""

# Run Prisma migrations
echo "🔄 Running database migrations..."
npx prisma db push --accept-data-loss

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy each variable from .env.production to Vercel:"
echo "   https://vercel.com/justinrstone81-gmailcoms-projects/fantasy-ai-mvp/settings/environment-variables"
echo "2. Click 'Add New' for each variable"
echo "3. Paste the name and value"
echo "4. Make sure to select 'Production' environment"
echo "5. After adding all variables, redeploy your app"
echo ""
echo "🔐 Security reminder: Generate a new NEXTAUTH_SECRET for production:"
echo "   openssl rand -base64 32"