#!/bin/bash

# This script ensures the SQLite database is properly included in Vercel build

echo "🚀 Starting Vercel build process..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Ensure database file exists
if [ -f "prisma/dev.db" ]; then
    echo "✅ Database file found at prisma/dev.db"
    ls -lah prisma/dev.db
else
    echo "❌ ERROR: Database file not found!"
    exit 1
fi

# Build Next.js application
echo "🏗️ Building Next.js application..."
next build

echo "✅ Build complete!"