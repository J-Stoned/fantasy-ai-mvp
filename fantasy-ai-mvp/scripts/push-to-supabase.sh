#!/bin/bash

echo "🚀 Pushing schema to Supabase..."

# Export the database URL
export DATABASE_URL="postgresql://postgres.jhfhsbqrdblytrlrconc:rfoYfhORq9Y8fkLo@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

# Push the schema
npx prisma db push --skip-generate

echo "✅ Schema pushed to Supabase!"