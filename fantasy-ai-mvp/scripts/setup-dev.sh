#!/bin/bash

# Fantasy.AI MVP Development Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up Fantasy.AI MVP development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found. Copying from template..."
    cp .env.local.template .env.local
    echo "✅ Created .env.local from template"
    echo "📝 Please edit .env.local and add your API keys"
fi

# Start database containers
echo "🐳 Starting database containers..."
docker-compose up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
timeout=60
while ! docker-compose exec postgres pg_isready -U fantasy_user -d fantasy_ai_dev > /dev/null 2>&1; do
    timeout=$((timeout - 1))
    if [ $timeout -le 0 ]; then
        echo "❌ Database failed to start within 60 seconds"
        exit 1
    fi
    sleep 1
done

echo "✅ Database is ready!"

# Install dependencies
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Push database schema
echo "📊 Setting up database schema..."
npm run db:push

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local and add your API keys (OpenAI, Stripe)"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "To stop the database: docker-compose down"
echo "To view database: docker-compose exec postgres psql -U fantasy_user -d fantasy_ai_dev"