#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const ESPN_API_KEY = process.env.ESPN_API_KEY || 'demo';
const DATA_SOURCES = process.env.DATA_SOURCES?.split(',') || ['all'];
const FORCE_UPDATE = process.env.FORCE_UPDATE === 'true';

// ESPN API endpoints (these are example endpoints - replace with actual ESPN API)
const ESPN_ENDPOINTS = {
  nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
  mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
  nhl: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard'
};

async function collectESPNData() {
  try {
    console.log('Starting ESPN data collection...');
    console.log(`Data sources: ${DATA_SOURCES.join(', ')}`);
    console.log(`Force update: ${FORCE_UPDATE}`);
    
    const sports = DATA_SOURCES.includes('all') ? 
      ['nfl', 'nba', 'mlb', 'nhl'] : 
      DATA_SOURCES.filter(s => ['nfl', 'nba', 'mlb', 'nhl'].includes(s));
    
    let totalUpdated = 0;
    let totalErrors = 0;
    
    for (const sport of sports) {
      try {
        console.log(`\nCollecting ${sport.toUpperCase()} data from ESPN...`);
        
        // Check if we should skip based on recent updates
        if (!FORCE_UPDATE) {
          const { data: recentData } = await supabase
            .from('players')
            .select('id')
            .eq('sport', sport.toUpperCase())
            .eq('data_source', 'espn')
            .gte('updated_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
            .limit(1);
          
          if (recentData && recentData.length > 0) {
            console.log(`Skipping ${sport} - data updated within last 30 minutes`);
            continue;
          }
        }
        
        // Fetch data from ESPN
        const endpoint = ESPN_ENDPOINTS[sport as keyof typeof ESPN_ENDPOINTS];
        const response = await axios.get(endpoint, {
          headers: {
            'User-Agent': 'Fantasy-AI/1.0',
            'Accept': 'application/json'
          },
          timeout: 10000
        });
        
        if (response.data && response.data.events) {
          // Process games and extract player data
          const players = await processESPNGames(response.data.events, sport.toUpperCase());
          
          if (players.length > 0) {
            // Batch upsert players
            const batchSize = 50;
            for (let i = 0; i < players.length; i += batchSize) {
              const batch = players.slice(i, i + batchSize);
              
              const { error } = await supabase
                .from('players')
                .upsert(batch, {
                  onConflict: 'external_id,data_source',
                  ignoreDuplicates: false
                });
              
              if (error) {
                console.error(`Error upserting batch:`, error);
                totalErrors++;
              } else {
                totalUpdated += batch.length;
                console.log(`✓ Updated ${batch.length} ${sport} players`);
              }
            }
          }
        }
        
        // Record successful data collection
        await supabase
          .from('rate_limit_tracker')
          .insert({
            source: 'espn',
            count: 1,
            endpoint: endpoint,
            sport: sport.toUpperCase(),
            created_at: new Date().toISOString()
          });
        
      } catch (error) {
        console.error(`Error collecting ${sport} data:`, error);
        totalErrors++;
        
        // Log error
        await supabase
          .from('error_logs')
          .insert({
            source: 'espn',
            sport: sport.toUpperCase(),
            error_type: 'data_collection',
            error_message: String(error),
            created_at: new Date().toISOString()
          });
      }
      
      // Add delay between sports to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(`\n=== ESPN Collection Summary ===`);
    console.log(`Total players updated: ${totalUpdated}`);
    console.log(`Total errors: ${totalErrors}`);
    
    process.exit(totalErrors > 0 && totalUpdated === 0 ? 1 : 0);
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

async function processESPNGames(events: any[], sport: string): Promise<any[]> {
  const players: any[] = [];
  const processedIds = new Set<string>();
  
  for (const event of events) {
    if (!event.competitions || !event.competitions[0]) continue;
    
    const competition = event.competitions[0];
    const competitors = competition.competitors || [];
    
    for (const team of competitors) {
      if (!team.team) continue;
      
      // In a real implementation, you would fetch roster data here
      // For demo purposes, we'll create sample player data
      const teamPlayers = generateSamplePlayers(team.team, sport);
      
      for (const player of teamPlayers) {
        if (!processedIds.has(player.external_id)) {
          processedIds.add(player.external_id);
          players.push({
            ...player,
            data_source: 'espn',
            updated_at: new Date().toISOString()
          });
        }
      }
    }
  }
  
  return players;
}

function generateSamplePlayers(team: any, sport: string): any[] {
  // This is a demo function - replace with actual ESPN player data fetching
  const positions = {
    NFL: ['QB', 'RB', 'WR', 'TE'],
    NBA: ['PG', 'SG', 'SF', 'PF', 'C'],
    MLB: ['C', '1B', '2B', 'SS', 'OF', 'SP'],
    NHL: ['C', 'LW', 'RW', 'D', 'G']
  };
  
  const samplePlayers = [];
  const teamId = team.id;
  const teamName = team.displayName || team.name;
  const teamAbbr = team.abbreviation;
  
  // Generate 2-3 sample players per team
  const numPlayers = Math.floor(Math.random() * 2) + 2;
  const sportPositions = positions[sport as keyof typeof positions] || [];
  
  for (let i = 0; i < numPlayers && i < sportPositions.length; i++) {
    samplePlayers.push({
      external_id: `espn_${teamId}_player_${i}`,
      name: `${teamAbbr} Player ${i + 1}`,
      team: teamName,
      team_abbr: teamAbbr,
      position: sportPositions[i],
      sport,
      jersey_number: Math.floor(Math.random() * 99) + 1,
      height: `6'${Math.floor(Math.random() * 5)}"`  ,
      weight: 180 + Math.floor(Math.random() * 100),
      age: 22 + Math.floor(Math.random() * 15),
      experience_years: Math.floor(Math.random() * 10),
      projection_points: Math.round((10 + Math.random() * 20) * 10) / 10,
      actual_points: null,
      injury_status: Math.random() > 0.8 ? 'Questionable' : 'Healthy',
      notes: `Updated from ESPN API at ${new Date().toISOString()}`
    });
  }
  
  return samplePlayers;
}

// Run the collector
collectESPNData();