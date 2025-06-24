#!/bin/bash

# 🔥 FANTASY.AI BEAST MODE DEPLOYMENT SCRIPT 🔥
# Deploys to Vercel + Sets up AWS infrastructure

set -e  # Exit on any error

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 FANTASY.AI BEAST MODE DEPLOYMENT 🚀${NC}"
echo "====================================="

# Step 1: Clean up for deployment
echo -e "${YELLOW}🧹 Cleaning up for deployment...${NC}"
rm -f *.log scripts/*.log logs/*.log 2>/dev/null || true
rm -rf .next .vercel 2>/dev/null || true

# Step 2: Check environment
echo -e "${YELLOW}🔍 Checking environment...${NC}"
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ Missing .env.production file${NC}"
    exit 1
fi

# Step 3: Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

# Step 4: Run TypeScript check
echo -e "${YELLOW}✅ Running TypeScript checks...${NC}"
if npx tsc --noEmit; then
    echo -e "${GREEN}✅ TypeScript checks passed!${NC}"
else
    echo -e "${RED}❌ TypeScript errors found${NC}"
    exit 1
fi

# Step 5: Build project
echo -e "${YELLOW}🔨 Building for production...${NC}"
if npm run build:production; then
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Step 6: Deploy to Vercel
echo -e "${BLUE}☁️  Deploying to Vercel...${NC}"
echo -e "${YELLOW}Make sure you've set all environment variables in Vercel dashboard!${NC}"
echo ""
echo "Required variables:"
echo "  - DATABASE_URL"
echo "  - OPENAI_API_KEY"
echo "  - STRIPE_SECRET_KEY"
echo "  - CRON_SECRET"
echo "  - All other API keys..."
echo ""
read -p "Have you set all environment variables? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    vercel --prod --yes
    echo -e "${GREEN}✅ Vercel deployment complete!${NC}"
else
    echo -e "${YELLOW}⚠️  Please set environment variables first${NC}"
    exit 1
fi

# Step 7: Set up GitHub Actions (optional)
echo ""
echo -e "${BLUE}📋 Next Steps for 24/7 Operation:${NC}"
echo "1. Push code to GitHub"
echo "2. Enable GitHub Actions"
echo "3. Set repository secrets"
echo "4. Launch AWS EC2 instance (optional)"
echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE! 🎉${NC}"
echo ""
echo "Your app is now live at:"
echo "https://fantasy-ai-mvp.vercel.app"
echo ""
echo -e "${YELLOW}Monitor your deployment:${NC}"
echo "- Vercel Dashboard: https://vercel.com/dashboard"
echo "- Logs: vercel logs --follow"
echo "- Cron Jobs: Check Functions tab in Vercel"
echo ""
echo -e "${GREEN}🦁 THE BEAST IS UNLEASHED! 🦁${NC}"