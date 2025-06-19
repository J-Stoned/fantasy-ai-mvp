#!/bin/bash

echo "🚀 Setting up Fantasy.AI MVP on WSL Native Filesystem..."

# Move to home directory and copy project
echo "📁 Copying project to WSL native filesystem..."
cd ~
cp -r /mnt/c/Users/st0ne/fantasy.AI-MVP/fantasy-ai-mvp ./fantasy-ai-mvp

# Navigate to new location
echo "📂 Navigating to new project directory..."
cd ~/fantasy-ai-mvp

# Install dependencies
echo "📦 Installing dependencies (this may take a few minutes)..."
npm install

# Copy environment file
echo "🔧 Setting up environment variables..."
cp /mnt/c/Users/st0ne/fantasy.AI-MVP/fantasy-ai-mvp/.env.local.backup ./.env.local

# Start PostgreSQL container
echo "🐘 Starting PostgreSQL..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Set up database
echo "🗄️ Setting up database..."
export DATABASE_URL="postgresql://fantasy_user:fantasy_pass@localhost:5433/fantasy_ai_dev"
npm run db:push

echo "✅ Setup complete! Starting development server..."
echo "🌐 Your app will be available at http://localhost:3000"
echo "🌐 Or try http://172.30.181.222:3000"

# Start the dev server
npm run dev