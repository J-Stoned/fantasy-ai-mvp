#!/bin/bash
# 🚀💥 FANTASY.AI MAXIMUM POWER STARTUP WITH TESTING 💥🚀
# This script launches ALL systems for the ultimate fantasy sports platform!

echo "🔥🔥🔥 ACTIVATING FANTASY.AI MAXIMUM POWER MODE! 🔥🔥🔥"
echo "=================================================="
echo "Starting at: $(date)"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"
if ! command_exists npm; then
    echo -e "${RED}ERROR: npm not found! Please install Node.js${NC}"
    exit 1
fi

if ! command_exists npx; then
    echo -e "${RED}ERROR: npx not found! Please install Node.js${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites OK${NC}"

# Kill any existing processes on port 3000/3001
echo -e "${YELLOW}Clearing ports...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Start dev server
echo -e "${GREEN}🌐 Starting development server...${NC}"
PORT=3001 npm run dev &
DEV_PID=$!

# Wait for server startup
echo "Waiting for server to start..."
sleep 8

# Check if server is running
if ! curl -s http://localhost:3001 > /dev/null; then
    echo -e "${YELLOW}Server might be starting slowly, waiting more...${NC}"
    sleep 5
fi

# Launch all systems in parallel
echo -e "${GREEN}🚀 LAUNCHING ALL SYSTEMS!${NC}"
echo ""

# GPU Acceleration
echo -e "${GREEN}⚡ Launching GPU Acceleration (15.7 TFLOPS)...${NC}"
npx tsx scripts/ACTIVATE-GPU-ACCELERATION.ts > logs/gpu-acceleration.log 2>&1 &
GPU_PID=$!

# 500-Worker Orchestrator
echo -e "${GREEN}💪 Activating 500-Worker Orchestrator...${NC}"
npx tsx scripts/ACTIVATE-HYPERSCALED-ORCHESTRATOR.ts > logs/orchestrator.log 2>&1 &
ORCHESTRATOR_PID=$!

# ML Continuous Learning
echo -e "${GREEN}🧠 Starting ML Continuous Learning Engine...${NC}"
npx tsx scripts/ML-CONTINUOUS-LEARNING-ENGINE.ts > logs/ml-learning.log 2>&1 &
ML_PID=$!

# Real-time Data Collection
echo -e "${GREEN}📊 Beginning Real-Time API Data Collection...${NC}"
npx tsx scripts/REAL-API-DATA-COLLECTOR.ts --continuous > logs/data-collector.log 2>&1 &
DATA_PID=$!

# Turbo Player Updates
echo -e "${GREEN}⚡ Turbo Player Updates Active (4,771 players)...${NC}"
npx tsx scripts/TURBO-PLAYER-COLLECTOR-5000.ts --continuous > logs/player-updates.log 2>&1 &
PLAYER_PID=$!

# All ML Systems
echo -e "${GREEN}🤖 Activating All ML Systems (4 Neural Networks)...${NC}"
npx tsx scripts/ACTIVATE-ALL-ML-SYSTEMS.ts > logs/ml-systems.log 2>&1 &
ML_SYSTEMS_PID=$!

# Create logs directory if it doesn't exist
mkdir -p logs

# Wait a moment for systems to initialize
sleep 5

# Launch Playwright Testing (if installed)
if command_exists playwright; then
    echo -e "${GREEN}🎭 Launching Playwright Continuous Testing...${NC}"
    npx playwright test --repeat-each=10 --workers=4 --reporter=html > logs/playwright.log 2>&1 &
    PLAYWRIGHT_PID=$!
else
    echo -e "${YELLOW}⚠️  Playwright not installed yet, skipping tests${NC}"
fi

echo ""
echo -e "${GREEN}✅ ALL SYSTEMS LAUNCHED!${NC}"
echo ""
echo "=============================================="
echo -e "${GREEN}🎉 FANTASY.AI IS NOW AT MAXIMUM POWER! 🎉${NC}"
echo "=============================================="
echo ""
echo "📊 MONITORING DASHBOARDS:"
echo "  - Main App: http://localhost:3001"
echo "  - Simple Dashboard: http://localhost:3001/dashboard-simple"
echo "  - Admin Monitoring: http://localhost:3001/admin/monitoring"
echo "  - Test Results: http://localhost:3001/playwright-report"
echo ""
echo "📁 LOG FILES:"
echo "  - GPU: logs/gpu-acceleration.log"
echo "  - Orchestrator: logs/orchestrator.log"
echo "  - ML Learning: logs/ml-learning.log"
echo "  - Data Collection: logs/data-collector.log"
echo "  - Player Updates: logs/player-updates.log"
echo "  - ML Systems: logs/ml-systems.log"
echo ""
echo "🔧 PROCESS IDS:"
echo "  - Dev Server: $DEV_PID"
echo "  - GPU: $GPU_PID"
echo "  - Orchestrator: $ORCHESTRATOR_PID"
echo "  - ML Learning: $ML_PID"
echo "  - Data Collection: $DATA_PID"
echo "  - Player Updates: $PLAYER_PID"
echo "  - ML Systems: $ML_SYSTEMS_PID"
[ ! -z "$PLAYWRIGHT_PID" ] && echo "  - Playwright: $PLAYWRIGHT_PID"
echo ""
echo "💡 TIPS:"
echo "  - Use 'tail -f logs/*.log' to monitor all logs"
echo "  - Press Ctrl+C to stop all processes"
echo "  - Run './STATUS-CHECK.sh' to verify system health"
echo ""
echo -e "${GREEN}🚀 FANTASY.AI IS READY TO DOMINATE! 🚀${NC}"

# Keep script running and handle cleanup
trap cleanup EXIT

cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down Fantasy.AI systems...${NC}"
    kill $DEV_PID $GPU_PID $ORCHESTRATOR_PID $ML_PID $DATA_PID $PLAYER_PID $ML_SYSTEMS_PID $PLAYWRIGHT_PID 2>/dev/null
    echo -e "${GREEN}Shutdown complete!${NC}"
}

# Wait for user to press Ctrl+C
while true; do
    sleep 1
done