#!/bin/bash

echo "🚀 Updating Vercel environment variables..."

# Add DATABASE_URL
echo "postgresql://postgres.jhfhsbqrdblytrlrconc:rfoYfhORq9Y8fkLo@aws-0-us-east-1.pooler.supabase.com:6543/postgres" | vercel env add DATABASE_URL production

# Add Supabase URLs
echo "https://jhfhsbqrdblytrlrconc.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZmhzYnFyZGJseXRybHJjb25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0Mjc0MzAsImV4cCI6MjA2NjAwMzQzMH0.bcbBLozJ9MNjaUc8BRLXNmoD0TfNKXNCZUxPs3oomxY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

echo "✅ Environment variables updated!"