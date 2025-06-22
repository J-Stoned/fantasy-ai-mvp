-- Fantasy.AI Supabase Schema
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leagues table
CREATE TABLE IF NOT EXISTS "League" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  name TEXT NOT NULL,
  season TEXT NOT NULL,
  sport TEXT NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  settings JSONB,
  "lastSync" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, "providerId")
);

-- Players table
CREATE TABLE IF NOT EXISTS "Player" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "externalId" TEXT NOT NULL,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  team TEXT NOT NULL,
  "leagueId" TEXT NOT NULL REFERENCES "League"(id) ON DELETE CASCADE,
  stats JSONB,
  projections JSONB,
  "injuryStatus" TEXT DEFAULT 'HEALTHY',
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("externalId", "leagueId")
);

-- Teams table
CREATE TABLE IF NOT EXISTS "Team" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "leagueId" TEXT NOT NULL REFERENCES "League"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rank INTEGER DEFAULT 0,
  points DECIMAL(10,2) DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  ties INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- UserSubscriptions table
CREATE TABLE IF NOT EXISTS "UserSubscription" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  status TEXT NOT NULL,
  "billingInterval" TEXT NOT NULL,
  "currentPeriodStart" TIMESTAMP NOT NULL,
  "currentPeriodEnd" TIMESTAMP NOT NULL,
  "cancelAtPeriodEnd" BOOLEAN DEFAULT false,
  "stripeSubscriptionId" TEXT,
  "stripeCustomerId" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Predictions table
CREATE TABLE IF NOT EXISTS "Prediction" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "playerId" TEXT NOT NULL REFERENCES "Player"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  week INTEGER,
  season TEXT NOT NULL,
  prediction JSONB NOT NULL,
  confidence DECIMAL(3,2),
  actual JSONB,
  accuracy DECIMAL(3,2),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_player_league ON "Player"("leagueId");
CREATE INDEX IF NOT EXISTS idx_player_team ON "Player"(team);
CREATE INDEX IF NOT EXISTS idx_player_position ON "Player"(position);
CREATE INDEX IF NOT EXISTS idx_league_sport ON "League"(sport);
CREATE INDEX IF NOT EXISTS idx_league_user ON "League"("userId");
CREATE INDEX IF NOT EXISTS idx_team_user ON "Team"("userId");
CREATE INDEX IF NOT EXISTS idx_team_league ON "Team"("leagueId");

-- Enable Row Level Security
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "League" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Player" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Team" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Prediction" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (users can only see their own data)
CREATE POLICY "Users can view their own profile" ON "User"
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can view their own leagues" ON "League"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Everyone can view players" ON "Player"
  FOR SELECT USING (true);

CREATE POLICY "Users can view their own teams" ON "Team"
  FOR SELECT USING (auth.uid()::text = "userId");

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Success message
SELECT 'Fantasy.AI schema created successfully! Ready for 5,040 players!' as message;