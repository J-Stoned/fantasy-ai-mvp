#!/bin/bash

echo "🧹 Cleaning Prisma client..."

# Remove generated Prisma client
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

# Clear Next.js cache
rm -rf .next

echo "✅ Prisma client cleaned!"
echo "🔧 Run 'npm install' to regenerate"