#!/bin/bash

echo "🔧 Fixing Fantasy.AI Dashboard..."

# Create the correct page.tsx content
cat > /tmp/page.tsx << 'EOF'
import { Dashboard } from "@/components/dashboard/Dashboard";

export default function Home() {
  return <Dashboard />;
}
EOF

echo "✅ Created updated page.tsx file"
echo ""
echo "📋 Now run these commands in your terminal:"
echo ""
echo "1. Press Ctrl+C to stop the current server"
echo ""
echo "2. Copy and paste these commands:"
echo "   cd ~/fantasy-ai-mvp"
echo "   cp /tmp/page.tsx ./src/app/page.tsx"
echo "   cat src/app/page.tsx"
echo "   npm run dev"
echo ""
echo "🎯 Your Dashboard should appear after the server restarts!"