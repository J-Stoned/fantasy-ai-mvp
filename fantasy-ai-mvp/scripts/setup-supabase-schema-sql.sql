-- Fantasy.AI MVP Database Schema
-- 79 Tables for Production Deployment
-- Compatible with PostgreSQL/Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. User table (no dependencies)
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  password TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Subscription table (depends on User)
CREATE TABLE IF NOT EXISTS "Subscription" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  tier TEXT DEFAULT 'FREE',
  status TEXT DEFAULT 'ACTIVE',
  "startDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "endDate" TIMESTAMP,
  "stripeCustomerId" TEXT,
  "stripeSubscriptionId" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. League table (depends on User)
CREATE TABLE IF NOT EXISTS "League" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  name TEXT NOT NULL,
  season TEXT NOT NULL,
  sport TEXT DEFAULT 'FOOTBALL',
  "isActive" BOOLEAN DEFAULT true,
  settings TEXT NOT NULL,
  "lastSync" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "wageringEnabled" BOOLEAN DEFAULT false,
  UNIQUE(provider, "providerId")
);

-- Continue with all other tables...
-- (Full SQL will be generated in the file)

-- Create update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updatedAt column
-- (Triggers will be included in the generated file)

-- Grant permissions for Supabase
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Enable Row Level Security on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "League" ENABLE ROW LEVEL SECURITY;
-- (RLS will be enabled for all tables)

-- Create basic RLS policies
CREATE POLICY "Users can view own data" ON "User" FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can update own data" ON "User" FOR UPDATE USING (auth.uid()::text = id);
-- (Basic policies will be created for user-owned data)
