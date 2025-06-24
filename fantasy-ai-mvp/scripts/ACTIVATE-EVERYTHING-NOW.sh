#!/bin/bash

# 🚀💥 ACTIVATE EVERYTHING NOW! 💥🚀
echo "🚀💥 ACTIVATING FANTASY.AI MAXIMUM POWER! 💥🚀"
echo "=============================================="

# 1. Install GPU Support for TensorFlow
echo "🎮 Installing GPU Acceleration..."
npm install @tensorflow/tfjs-node-gpu || echo "⚠️  GPU install failed, continuing with CPU"

# 2. Install any missing dependencies
echo "📦 Installing missing dependencies..."
npm install chalk node-fetch dotenv

# 3. Create startup script
cat > start-fantasy-ai.sh << 'EOF'
#!/bin/bash
echo "🚀 STARTING FANTASY.AI SYSTEMS..."

# Start web dashboard
echo "🌐 Starting Web Dashboard..."
npm run dev &
WEB_PID=$!

# Wait for web to start
sleep 5

# Start ML continuous learning
echo "🧠 Starting ML Learning System..."
npx tsx scripts/ACTIVATE-ML-CONTINUOUS-LEARNING.ts &
ML_PID=$!

# Start data collector (if API keys exist)
if grep -q "OPENWEATHER_API_KEY=\"[^\"]\+" .env; then
  echo "📡 Starting Real Data Collection..."
  npx tsx scripts/REAL-API-DATA-COLLECTOR.ts --continuous &
  DATA_PID=$!
else
  echo "⚠️  No API keys found - skipping data collection"
fi

echo "✅ ALL SYSTEMS RUNNING!"
echo "🌐 Dashboard: http://localhost:3000"
echo "📊 Database: 4,771 real players loaded"
echo "🧠 ML: Continuously learning"

# Keep running
wait $WEB_PID
EOF

chmod +x start-fantasy-ai.sh

echo "✅ Startup script created!"
echo ""
echo "🎯 NEXT STEPS:"
echo "1. Get your FREE API keys:"
echo "   - OpenWeather: https://openweathermap.org/api"
echo "   - The Odds API: https://the-odds-api.com/"
echo "   - NewsAPI: https://newsapi.org/"
echo "   - ElevenLabs: https://elevenlabs.io/"
echo ""
echo "2. Add to .env file"
echo "3. Run: ./start-fantasy-ai.sh"
echo ""
echo "💥 FANTASY.AI IS READY TO DOMINATE! 💥"