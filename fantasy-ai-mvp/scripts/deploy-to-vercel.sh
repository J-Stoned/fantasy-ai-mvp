#!/bin/bash

echo "🚀 DEPLOYING FANTASY.AI TO VERCEL PRODUCTION! 🚀"
echo "==========================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Vercel is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm i -g vercel
fi

# Kill any running ML processes to free up resources
echo -e "${BLUE}🛑 Stopping ML processes to free up resources...${NC}"
pkill -f "ML-CONTINUOUS-LEARNING-ENGINE" || true
pkill -f "REAL-API-DATA-COLLECTOR" || true
pkill -f "ACTIVATE-GPU-ACCELERATION" || true
pkill -f "ACTIVATE-HYPERSCALED-ORCHESTRATOR" || true

# Wait a moment for processes to stop
sleep 2

# Run TypeScript check first
echo -e "${BLUE}📝 Running TypeScript checks...${NC}"
if npx tsc --noEmit; then
    echo -e "${GREEN}✅ TypeScript checks passed!${NC}"
else
    echo -e "${RED}❌ TypeScript errors found. Please fix them first.${NC}"
    exit 1
fi

# Build the project
echo -e "${BLUE}🔨 Building the project...${NC}"
if npm run build; then
    echo -e "${GREEN}✅ Build completed successfully!${NC}"
else
    echo -e "${RED}❌ Build failed. Please fix the errors.${NC}"
    exit 1
fi

# Deploy to Vercel
echo -e "${BLUE}🌐 Deploying to Vercel...${NC}"
echo -e "${YELLOW}NOTE: Make sure you have set all environment variables in Vercel dashboard:${NC}"
echo "  - DATABASE_URL (use Vercel Postgres)"
echo "  - OPENAI_API_KEY"
echo "  - STRIPE_SECRET_KEY"
echo "  - STRIPE_PUBLISHABLE_KEY"
echo "  - NEXTAUTH_SECRET"
echo "  - NEXTAUTH_URL"
echo ""
echo -e "${BLUE}Deploying to production...${NC}"

# Deploy with production flag
vercel --prod

echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo "==========================================="
echo -e "${GREEN}Your Fantasy.AI app should now be live!${NC}"
echo -e "${BLUE}Check your Vercel dashboard for the deployment URL.${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Verify all features are working on production"
echo "2. Test the ML systems with real data"
echo "3. Monitor the logs for any issues"
echo "4. Share with users for feedback!"