#!/bin/bash

echo "🚀 FORCE CLEAN DEPLOYMENT TO VERCEL"
echo "==================================="
echo ""
echo "This script will:"
echo "1. Clean all build artifacts"
echo "2. Regenerate Prisma client"
echo "3. Push to trigger deployment"
echo ""

# Clean local artifacts
echo "🧹 Cleaning build artifacts..."
rm -rf .next
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client
rm -rf .vercel

# Regenerate Prisma client
echo "🔧 Regenerating Prisma client..."
npx prisma generate

# Create deployment marker
echo "📝 Creating deployment marker..."
echo "DEPLOYMENT_TIMESTAMP=$(date -u +%Y%m%d_%H%M%S)" > .deployment

# Commit and push
echo "📤 Committing and pushing..."
git add -A
git commit -m "🚀 FORCE CLEAN DEPLOYMENT - Database fix + ML activation

- Force Prisma client regeneration
- Enable all ML models and AI features
- Fix database connection for production
- Clear all caches for fresh build

Deployment ID: $(date -u +%Y%m%d_%H%M%S)"
git push

echo ""
echo "✅ Deployment triggered!"
echo ""
echo "Next steps:"
echo "1. Go to: https://vercel.com/your-project"
echo "2. Watch the deployment progress"
echo "3. Once deployed, run: npm run verify:production"
echo ""
echo "🎯 The deployment should take 2-3 minutes."