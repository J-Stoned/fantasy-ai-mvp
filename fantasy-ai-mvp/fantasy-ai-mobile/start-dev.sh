#!/bin/bash

# Fantasy.AI Mobile Development Quick Start Script

echo "🚀 Starting Fantasy.AI Mobile Development Environment..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚙️ Creating .env.local file..."
    cat > .env.local << EOL
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_WS_URL=ws://localhost:3000
EOL
    echo "✅ Created .env.local with default values"
fi

echo "🎯 Clearing cache and starting Expo..."
npm run start:clear