-- 🏀⚾🏁 MULTI-SPORT DATABASE SCHEMA ENHANCEMENT
-- Mission: "Either we know it or we don't... yet!"
-- Adding NBA, MLB, and NASCAR tables for complete sports dominance!

-- ===============================================
-- 🏀 NBA TABLES
-- ===============================================

CREATE TABLE IF NOT EXISTS nba_players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  team TEXT NOT NULL,
  position TEXT NOT NULL,
  jersey_number INTEGER,
  height TEXT,
  weight TEXT,
  age INTEGER,
  college TEXT,
  years_pro INTEGER,
  stats JSONB DEFAULT '{}',
  projections JSONB DEFAULT '{}',
  injury_status TEXT DEFAULT 'healthy',
  salary JSONB DEFAULT '{}',
  sport TEXT DEFAULT 'basketball',
  league TEXT DEFAULT 'NBA',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  data_source TEXT DEFAULT 'real_mcp_scraping'
);

CREATE TABLE IF NOT EXISTS nba_games (
  id TEXT PRIMARY KEY,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  game_date TEXT NOT NULL,
  game_time TEXT,
  arena TEXT,
  total NUMERIC DEFAULT 0,
  spread NUMERIC DEFAULT 0,
  home_score INTEGER,
  away_score INTEGER,
  quarter INTEGER DEFAULT 0,
  time_remaining TEXT,
  status TEXT DEFAULT 'scheduled',
  sport TEXT DEFAULT 'basketball',
  league TEXT DEFAULT 'NBA',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  data_source TEXT DEFAULT 'real_mcp_scraping'
);

CREATE TABLE IF NOT EXISTS nba_injuries (
  id TEXT PRIMARY KEY,
  player_id TEXT,
  player_name TEXT NOT NULL,
  team TEXT,
  injury_type TEXT,
  status TEXT,
  description TEXT,
  estimated_return TEXT,
  report_date TIMESTAMPTZ DEFAULT NOW(),
  source TEXT,
  sport TEXT DEFAULT 'basketball',
  league TEXT DEFAULT 'NBA',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  data_source TEXT DEFAULT 'real_mcp_scraping'
);

CREATE TABLE IF NOT EXISTS nba_trades (
  id TEXT PRIMARY KEY,
  players_involved JSONB DEFAULT '[]',
  teams_involved JSONB DEFAULT '[]',
  trade_date TIMESTAMPTZ,
  description TEXT,
  trade_type TEXT DEFAULT 'trade',
  sport TEXT DEFAULT 'basketball',
  league TEXT DEFAULT 'NBA',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  data_source TEXT DEFAULT 'real_mcp_scraping'
);

CREATE TABLE IF NOT EXISTS nba_dfs_salaries (
  id TEXT PRIMARY KEY,
  player_id TEXT,
  player_name TEXT NOT NULL,
  team TEXT,
  position TEXT,
  platform TEXT NOT NULL,
  salary INTEGER DEFAULT 0,
  projected_points NUMERIC DEFAULT 0,
  value NUMERIC DEFAULT 0,
  ownership NUMERIC DEFAULT 0,
  slate_date TEXT,
  sport TEXT DEFAULT 'basketball',
  league TEXT DEFAULT 'NBA',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  data_source TEXT DEFAULT 'real_mcp_scraping'
);

-- ===============================================
-- ⚾ MLB TABLES
-- ===============================================

CREATE TABLE IF NOT EXISTS mlb_players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  team TEXT NOT NULL,
  position TEXT NOT NULL,
  jersey_number INTEGER,
  age INTEGER,
  height TEXT,
  weight TEXT,
  bats TEXT, -- L, R, S
  throws TEXT, -- L, R
  stats JSONB DEFAULT '{}',
  projections JSONB DEFAULT '{}',
  injury_status TEXT DEFAULT 'healthy',
  salary JSONB DEFAULT '{}',
  sport TEXT DEFAULT 'baseball',
  league TEXT DEFAULT 'MLB',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  data_source TEXT DEFAULT 'real_mcp_scraping'
);

CREATE TABLE IF NOT EXISTS mlb_games (
  id TEXT PRIMARY KEY,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  game_date TEXT NOT NULL,
  game_time TEXT,
  ballpark TEXT,
  total NUMERIC DEFAULT 0, -- Over/under runs
  run_line NUMERIC DEFAULT 0, -- Spread
  home_pitcher TEXT,
  away_pitcher TEXT,
  weather JSONB DEFAULT '{}',
  home_score INTEGER,
  away_score INTEGER,
  inning INTEGER DEFAULT 0,
  status TEXT DEFAULT 'scheduled',
  sport TEXT DEFAULT 'baseball',
  league TEXT DEFAULT 'MLB',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  data_source TEXT DEFAULT 'real_mcp_scraping'
);

CREATE TABLE IF NOT EXISTS mlb_injuries (
  id TEXT PRIMARY KEY,
  player_id TEXT,
  player_name TEXT NOT NULL,
  team TEXT,
  injury_type TEXT,
  status TEXT,
  description TEXT,
  estimated_return TEXT,
  report_date TIMESTAMPTZ DEFAULT NOW(),
  source TEXT,
  sport TEXT DEFAULT 'baseball',
  league TEXT DEFAULT 'MLB',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  data_source TEXT DEFAULT 'real_mcp_scraping'
);

CREATE TABLE IF NOT EXISTS mlb_pitchers (
  id TEXT PRIMARY KEY,
  player_id TEXT,
  player_name TEXT NOT NULL,
  team TEXT,
  role TEXT, -- starter, closer, setup, etc.
  rotation_spot INTEGER,
  probable_date TEXT,
  last_start TEXT,
  next_start TEXT,
  sport TEXT DEFAULT 'baseball',
  league TEXT DEFAULT 'MLB',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  data_source TEXT DEFAULT 'real_mcp_scraping'
);

CREATE TABLE IF NOT EXISTS mlb_weather (
  id TEXT PRIMARY KEY,
  game_id TEXT,
  ballpark TEXT,
  temperature NUMERIC,
  wind_speed NUMERIC,
  wind_direction TEXT,
  humidity NUMERIC,
  conditions TEXT,
  forecast_time TIMESTAMPTZ DEFAULT NOW(),
  sport TEXT DEFAULT 'baseball',
  league TEXT DEFAULT 'MLB',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  data_source TEXT DEFAULT 'real_mcp_scraping'
);

-- ===============================================
-- 🏁 NASCAR TABLES
-- ===============================================

CREATE TABLE IF NOT EXISTS nascar_drivers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  team TEXT,
  manufacturer TEXT, -- Chevrolet, Ford, Toyota
  car_number INTEGER,
  age INTEGER,
  hometown TEXT,
  years_experience INTEGER,
  crew_chief TEXT,
  sponsors JSONB DEFAULT '[]',
  stats JSONB DEFAULT '{}',
  track_performance JSONB DEFAULT '{}',
  analytics JSONB DEFAULT '{}',
  biometrics JSONB DEFAULT '{}',
  equipment JSONB DEFAULT '{}',
  projections JSONB DEFAULT '{}', -- 5-year projections!
  salary JSONB DEFAULT '{}',
  sport TEXT DEFAULT 'motorsports',
  league TEXT DEFAULT 'NASCAR',
  future_analytics BOOLEAN DEFAULT true,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  data_source TEXT DEFAULT 'real_mcp_scraping'
);

CREATE TABLE IF NOT EXISTS nascar_races (
  id TEXT PRIMARY KEY,
  race_name TEXT NOT NULL,
  track TEXT NOT NULL,
  track_type TEXT, -- oval, road_course, superspeedway, etc.
  track_length NUMERIC,
  banking NUMERIC,
  surface TEXT, -- asphalt, concrete, dirt
  race_date TEXT NOT NULL,
  race_time TEXT,
  laps INTEGER,
  distance NUMERIC,
  weather JSONB DEFAULT '{}',
  dynamics JSONB DEFAULT '{}',
  historical JSONB DEFAULT '{}',
  betting JSONB DEFAULT '{}',
  live_data JSONB DEFAULT '{}',
  sport TEXT DEFAULT 'motorsports',
  league TEXT DEFAULT 'NASCAR',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  data_source TEXT DEFAULT 'real_mcp_scraping'
);

CREATE TABLE IF NOT EXISTS nascar_teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner TEXT,
  manufacturer TEXT,
  headquarters TEXT,
  founded INTEGER,
  stats JSONB DEFAULT '{}',
  resources JSONB DEFAULT '{}',
  strategy JSONB DEFAULT '{}',
  drivers JSONB DEFAULT '[]',
  sport TEXT DEFAULT 'motorsports',
  league TEXT DEFAULT 'NASCAR',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  data_source TEXT DEFAULT 'real_mcp_scraping'
);

-- ===============================================
-- 🔄 MULTI-SPORT UNIFIED TABLES
-- ===============================================

CREATE TABLE IF NOT EXISTS multi_sport_players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sport TEXT NOT NULL, -- basketball, baseball, motorsports, football
  league TEXT NOT NULL, -- NBA, MLB, NASCAR, NFL
  team TEXT,
  position TEXT,
  stats JSONB DEFAULT '{}',
  projections JSONB DEFAULT '{}',
  injury_status TEXT DEFAULT 'healthy',
  salary JSONB DEFAULT '{}',
  advanced_analytics JSONB DEFAULT '{}',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  data_source TEXT DEFAULT 'real_mcp_scraping'
);

CREATE TABLE IF NOT EXISTS multi_sport_games (
  id TEXT PRIMARY KEY,
  sport TEXT NOT NULL,
  league TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  game_date TEXT NOT NULL,
  game_time TEXT,
  venue TEXT,
  betting_lines JSONB DEFAULT '{}',
  weather JSONB DEFAULT '{}',
  live_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'scheduled',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  data_source TEXT DEFAULT 'real_mcp_scraping'
);

CREATE TABLE IF NOT EXISTS multi_sport_injuries (
  id TEXT PRIMARY KEY,
  sport TEXT NOT NULL,
  league TEXT NOT NULL,
  player_id TEXT,
  player_name TEXT NOT NULL,
  team TEXT,
  injury_type TEXT,
  status TEXT,
  description TEXT,
  estimated_return TEXT,
  report_date TIMESTAMPTZ DEFAULT NOW(),
  source TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  data_source TEXT DEFAULT 'real_mcp_scraping'
);

CREATE TABLE IF NOT EXISTS multi_sport_analytics (
  id TEXT PRIMARY KEY,
  sport TEXT NOT NULL,
  league TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- player, team, game
  entity_id TEXT NOT NULL,
  analytics_type TEXT NOT NULL, -- performance, prediction, trend
  data JSONB NOT NULL,
  confidence_score NUMERIC DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  data_source TEXT DEFAULT 'real_mcp_analysis'
);

-- ===============================================
-- 📊 INDEXES FOR PERFORMANCE
-- ===============================================

-- NBA Indexes
CREATE INDEX IF NOT EXISTS idx_nba_players_team ON nba_players(team);
CREATE INDEX IF NOT EXISTS idx_nba_players_position ON nba_players(position);
CREATE INDEX IF NOT EXISTS idx_nba_games_date ON nba_games(game_date);
CREATE INDEX IF NOT EXISTS idx_nba_injuries_player ON nba_injuries(player_name);

-- MLB Indexes
CREATE INDEX IF NOT EXISTS idx_mlb_players_team ON mlb_players(team);
CREATE INDEX IF NOT EXISTS idx_mlb_players_position ON mlb_players(position);
CREATE INDEX IF NOT EXISTS idx_mlb_games_date ON mlb_games(game_date);
CREATE INDEX IF NOT EXISTS idx_mlb_pitchers_team ON mlb_pitchers(team);

-- NASCAR Indexes
CREATE INDEX IF NOT EXISTS idx_nascar_drivers_team ON nascar_drivers(team);
CREATE INDEX IF NOT EXISTS idx_nascar_drivers_manufacturer ON nascar_drivers(manufacturer);
CREATE INDEX IF NOT EXISTS idx_nascar_races_date ON nascar_races(race_date);
CREATE INDEX IF NOT EXISTS idx_nascar_races_track ON nascar_races(track);

-- Multi-Sport Indexes
CREATE INDEX IF NOT EXISTS idx_multi_sport_players_sport_league ON multi_sport_players(sport, league);
CREATE INDEX IF NOT EXISTS idx_multi_sport_games_sport_date ON multi_sport_games(sport, game_date);
CREATE INDEX IF NOT EXISTS idx_multi_sport_injuries_sport_player ON multi_sport_injuries(sport, player_name);
CREATE INDEX IF NOT EXISTS idx_multi_sport_analytics_entity ON multi_sport_analytics(entity_type, entity_id);

-- ===============================================
-- 🚀 SUCCESS MESSAGE
-- ===============================================

-- This schema supports:
-- 🏀 NBA: Complete basketball analytics
-- ⚾ MLB: Full baseball with weather/pitching
-- 🏁 NASCAR: Revolutionary motorsports with 5-year projections
-- 🔄 Multi-Sport: Unified analytics across all sports
-- 
-- Mission: "Either we know it or we don't... yet!"
-- Total Tables Added: 16 new sport-specific tables
-- Future-Ready: Built for 5+ years of expansion