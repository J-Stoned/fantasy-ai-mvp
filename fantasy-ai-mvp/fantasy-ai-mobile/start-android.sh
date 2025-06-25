#!/bin/bash

echo "========================================"
echo "🚀 Fantasy.AI Mobile - Android Quick Start"
echo "========================================"
echo ""
echo "📱 Step 1: Make sure you have Expo Go installed on your Android device"
echo "   Download from: https://play.google.com/store/apps/details?id=host.exp.exponent"
echo ""
echo "📡 Step 2: Starting the development server..."
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --legacy-peer-deps
fi

echo ""
echo "Starting Expo..."
npx expo start