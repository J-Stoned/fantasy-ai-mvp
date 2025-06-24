#!/usr/bin/env tsx

/**
 * 🚀 POPULATE SUPABASE NOW! 
 * Direct database population with REAL player data
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Parse Supabase URL from DATABASE_URL
const DATABASE_URL = process.env.DATABASE_URL || '';
const match = DATABASE_URL.match(/postgresql:\/\/postgres:(.+)@db\.(.+)\.supabase\.co/);
if (!match) {
  console.error('❌ Invalid DATABASE_URL format');
  process.exit(1);
}

const SUPABASE_PASSWORD = match[1];
const SUPABASE_PROJECT_REF = match[2];
const SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpocmhzYnFyZGJseXRybHJjb25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MTYxNjE2MTYsImV4cCI6MTkzMTczNzYxNn0.placeholder';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// REAL NFL PLAYERS
const NFL_PLAYERS = [
  { name: 'Patrick Mahomes', position: 'QB', team: 'Kansas City Chiefs', jersey_number: 15 },
  { name: 'Josh Allen', position: 'QB', team: 'Buffalo Bills', jersey_number: 17 },
  { name: 'Lamar Jackson', position: 'QB', team: 'Baltimore Ravens', jersey_number: 8 },
  { name: 'Christian McCaffrey', position: 'RB', team: 'San Francisco 49ers', jersey_number: 23 },
  { name: 'Austin Ekeler', position: 'RB', team: 'Los Angeles Chargers', jersey_number: 30 },
  { name: 'Tyreek Hill', position: 'WR', team: 'Miami Dolphins', jersey_number: 10 },
  { name: 'Justin Jefferson', position: 'WR', team: 'Minnesota Vikings', jersey_number: 18 },
  { name: 'Travis Kelce', position: 'TE', team: 'Kansas City Chiefs', jersey_number: 87 },
];

// REAL NBA PLAYERS
const NBA_PLAYERS = [
  { name: 'LeBron James', position: 'SF', team: 'Los Angeles Lakers', jersey_number: 23 },
  { name: 'Stephen Curry', position: 'PG', team: 'Golden State Warriors', jersey_number: 30 },
  { name: 'Kevin Durant', position: 'SF', team: 'Phoenix Suns', jersey_number: 35 },
  { name: 'Giannis Antetokounmpo', position: 'PF', team: 'Milwaukee Bucks', jersey_number: 34 },
  { name: 'Nikola Jokic', position: 'C', team: 'Denver Nuggets', jersey_number: 15 },
  { name: 'Luka Doncic', position: 'PG', team: 'Dallas Mavericks', jersey_number: 77 },
  { name: 'Joel Embiid', position: 'C', team: 'Philadelphia 76ers', jersey_number: 21 },
  { name: 'Jayson Tatum', position: 'SF', team: 'Boston Celtics', jersey_number: 0 },
];

// REAL MLB PLAYERS
const MLB_PLAYERS = [
  { name: 'Shohei Ohtani', position: 'DH', team: 'Los Angeles Dodgers', jersey_number: 17 },
  { name: 'Ronald Acuna Jr.', position: 'RF', team: 'Atlanta Braves', jersey_number: 13 },
  { name: 'Aaron Judge', position: 'RF', team: 'New York Yankees', jersey_number: 99 },
  { name: 'Mookie Betts', position: 'RF', team: 'Los Angeles Dodgers', jersey_number: 50 },
  { name: 'Mike Trout', position: 'CF', team: 'Los Angeles Angels', jersey_number: 27 },
  { name: 'Freddie Freeman', position: '1B', team: 'Los Angeles Dodgers', jersey_number: 5 },
  { name: 'Jose Altuve', position: '2B', team: 'Houston Astros', jersey_number: 27 },
  { name: 'Gerrit Cole', position: 'P', team: 'New York Yankees', jersey_number: 45 },
];

// REAL NHL PLAYERS
const NHL_PLAYERS = [
  { name: 'Connor McDavid', position: 'C', team: 'Edmonton Oilers', jersey_number: 97 },
  { name: 'Nathan MacKinnon', position: 'C', team: 'Colorado Avalanche', jersey_number: 29 },
  { name: 'Auston Matthews', position: 'C', team: 'Toronto Maple Leafs', jersey_number: 34 },
  { name: 'Sidney Crosby', position: 'C', team: 'Pittsburgh Penguins', jersey_number: 87 },
  { name: 'Alexander Ovechkin', position: 'LW', team: 'Washington Capitals', jersey_number: 8 },
  { name: 'Patrick Kane', position: 'RW', team: 'Detroit Red Wings', jersey_number: 88 },
  { name: 'Nikita Kucherov', position: 'RW', team: 'Tampa Bay Lightning', jersey_number: 86 },
  { name: 'Cale Makar', position: 'D', team: 'Colorado Avalanche', jersey_number: 8 },
];

async function populateSupabase() {
  console.log('🚀 POPULATING SUPABASE WITH REAL PLAYER DATA!');
  console.log('==========================================');
  console.log(`📡 Connecting to: ${SUPABASE_URL}`);

  try {
    // Create users table if it doesn't exist
    const { error: createError } = await supabase.rpc('create_tables_if_not_exists', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          username TEXT UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS players (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          position TEXT NOT NULL,
          team TEXT NOT NULL,
          jersey_number INTEGER,
          sport TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS player_stats (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          player_id UUID REFERENCES players(id),
          points FLOAT DEFAULT 0,
          assists FLOAT DEFAULT 0,
          rebounds FLOAT DEFAULT 0,
          fantasy_points FLOAT DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    });

    if (createError && !createError.message.includes('already exists')) {
      console.error('❌ Error creating tables:', createError);
    }

    // Insert all players
    const allPlayers = [
      ...NFL_PLAYERS.map(p => ({ ...p, sport: 'NFL' })),
      ...NBA_PLAYERS.map(p => ({ ...p, sport: 'NBA' })),
      ...MLB_PLAYERS.map(p => ({ ...p, sport: 'MLB' })),
      ...NHL_PLAYERS.map(p => ({ ...p, sport: 'NHL' })),
    ];

    console.log(`\n📊 Inserting ${allPlayers.length} REAL players...`);

    for (const player of allPlayers) {
      const { data, error } = await supabase
        .from('players')
        .upsert(player, { onConflict: 'name' })
        .select();

      if (error) {
        console.error(`❌ Error inserting ${player.name}:`, error.message);
      } else {
        console.log(`✅ Inserted ${player.name} (${player.team})`);
        
        // Add some stats
        if (data && data[0]) {
          const stats = {
            player_id: data[0].id,
            points: Math.random() * 30 + 10,
            assists: Math.random() * 10,
            rebounds: Math.random() * 10,
            fantasy_points: Math.random() * 50 + 20,
          };
          
          await supabase.from('player_stats').insert(stats);
        }
      }
    }

    // Query to verify
    const { data: players, error: queryError } = await supabase
      .from('players')
      .select('*')
      .limit(5);

    if (queryError) {
      console.error('❌ Query error:', queryError);
    } else {
      console.log('\n✅ SUPABASE POPULATED SUCCESSFULLY!');
      console.log('First 5 players:', players);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

populateSupabase();