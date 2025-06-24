#!/bin/bash

echo "🚀 QUICK DEPLOY TO VERCEL! 🚀"
echo "============================="

# Stop any running processes to free memory
echo "🛑 Stopping background processes..."
pkill -f "ML-CONTINUOUS-LEARNING-ENGINE" || true
pkill -f "REAL-API-DATA-COLLECTOR" || true
pkill -f "npm run dev" || true
sleep 2

# Create a minimal .vercelignore to skip large files
cat > .vercelignore << EOF
# Ignore large files and directories
node_modules
.next
scripts/ml-engine.log
scripts/api-collector.log
data/
*.log
*.mp3
voice-demos/
.git
.env
.env.local
prisma/dev.db
prisma/prisma/dev.db
EOF

echo "📦 Deploying to Vercel..."
echo ""
echo "NOTE: Set these environment variables in Vercel dashboard:"
echo "- DATABASE_URL (Supabase connection string)"
echo "- OPENAI_API_KEY"
echo "- STRIPE_SECRET_KEY"
echo "- STRIPE_PUBLISHABLE_KEY"
echo "- NEXTAUTH_SECRET"
echo "- NEXTAUTH_URL"
echo ""

# Deploy with Vercel
vercel --prod --yes

echo ""
echo "🎉 Deployment initiated!"
echo "Check the Vercel dashboard for status."