#!/usr/bin/env tsx

/**
 * 🏀 BALL DON'T LIE - REAL NBA DATA COLLECTOR
 * 100% FREE NBA API - No key required!
 * https://www.balldontlie.io/
 */

import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const DATA_DIR = path.join(__dirname, '../data/ultimate-free/api');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// BALL DON'T LIE API ENDPOINTS (100% FREE!)
const BDL_BASE_URL = 'https://www.balldontlie.io/api/v1';

const BDL_ENDPOINTS = {
  players: `${BDL_BASE_URL}/players`,
  teams: `${BDL_BASE_URL}/teams`,
  games: `${BDL_BASE_URL}/games`,
  stats: `${BDL_BASE_URL}/stats`,
  season_averages: `${BDL_BASE_URL}/season_averages`
};

interface BDLData {
  endpoint: string;
  timestamp: string;
  data: any;
  meta?: any;
}

async function fetchBDLData(endpoint: string, params: Record<string, any> = {}): Promise<BDLData | null> {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const url = queryParams ? `${endpoint}?${queryParams}` : endpoint;
    
    console.log(`🏀 Fetching from Ball Don't Lie: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Fantasy.AI NBA Data Collector'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`✅ Success! Retrieved ${data.data?.length || 0} records`);
    
    return {
      endpoint,
      timestamp: new Date().toISOString(),
      data: data.data,
      meta: data.meta
    };
    
  } catch (error) {
    console.error(`❌ Error fetching data:`, error);
    return null;
  }
}

async function collectNBAPlayers() {
  console.log('\n👥 Collecting NBA Players...');
  
  const allPlayers: any[] = [];
  let page = 1;
  let hasMore = true;
  
  // Collect multiple pages of players
  while (hasMore && page <= 5) { // Limit to 5 pages for now
    const result = await fetchBDLData(BDL_ENDPOINTS.players, { 
      page, 
      per_page: 100 
    });
    
    if (result && result.data) {
      allPlayers.push(...result.data);
      
      // Check if there are more pages
      if (result.meta && result.meta.next_page) {
        page++;
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit
      } else {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }
  
  // Process player data
  const processedPlayers = allPlayers.map(player => ({
    id: player.id,
    name: `${player.first_name} ${player.last_name}`,
    firstName: player.first_name,
    lastName: player.last_name,
    position: player.position,
    height: `${player.height_feet}'${player.height_inches}"`,
    weight: player.weight_pounds,
    team: {
      id: player.team?.id,
      name: player.team?.full_name,
      abbreviation: player.team?.abbreviation,
      city: player.team?.city,
      conference: player.team?.conference,
      division: player.team?.division
    }
  }));
  
  console.log(`✅ Collected ${processedPlayers.length} NBA players`);
  return processedPlayers;
}

async function collectNBATeams() {
  console.log('\n🏢 Collecting NBA Teams...');
  
  const result = await fetchBDLData(BDL_ENDPOINTS.teams);
  
  if (!result || !result.data) {
    return [];
  }
  
  const processedTeams = result.data.map((team: any) => ({
    id: team.id,
    name: team.full_name,
    abbreviation: team.abbreviation,
    city: team.city,
    conference: team.conference,
    division: team.division
  }));
  
  console.log(`✅ Collected ${processedTeams.length} NBA teams`);
  return processedTeams;
}

async function collectRecentGames() {
  console.log('\n🏀 Collecting Recent NBA Games...');
  
  // Get games from the last 7 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  
  const result = await fetchBDLData(BDL_ENDPOINTS.games, {
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    per_page: 100
  });
  
  if (!result || !result.data) {
    return [];
  }
  
  const processedGames = result.data.map((game: any) => ({
    id: game.id,
    date: game.date,
    season: game.season,
    status: game.status,
    period: game.period,
    time: game.time,
    postseason: game.postseason,
    homeTeam: {
      id: game.home_team?.id,
      name: game.home_team?.full_name,
      abbreviation: game.home_team?.abbreviation,
      score: game.home_team_score
    },
    visitorTeam: {
      id: game.visitor_team?.id,
      name: game.visitor_team?.full_name,
      abbreviation: game.visitor_team?.abbreviation,
      score: game.visitor_team_score
    }
  }));
  
  console.log(`✅ Collected ${processedGames.length} recent NBA games`);
  return processedGames;
}

async function collectPlayerStats() {
  console.log('\n📊 Collecting Recent Player Stats...');
  
  // Get stats from recent games
  const result = await fetchBDLData(BDL_ENDPOINTS.stats, {
    per_page: 100,
    seasons: [new Date().getFullYear() - 1] // Last season
  });
  
  if (!result || !result.data) {
    return [];
  }
  
  const processedStats = result.data.map((stat: any) => ({
    id: stat.id,
    player: {
      id: stat.player?.id,
      name: `${stat.player?.first_name} ${stat.player?.last_name}`,
      position: stat.player?.position,
      team: stat.team?.abbreviation
    },
    game: {
      id: stat.game?.id,
      date: stat.game?.date,
      homeTeam: stat.game?.home_team?.abbreviation,
      visitorTeam: stat.game?.visitor_team?.abbreviation
    },
    stats: {
      points: stat.pts,
      assists: stat.ast,
      rebounds: stat.reb,
      steals: stat.stl,
      blocks: stat.blk,
      turnovers: stat.turnover,
      fieldGoalsMade: stat.fgm,
      fieldGoalsAttempted: stat.fga,
      fieldGoalPercentage: stat.fg_pct,
      threePointersMade: stat.fg3m,
      threePointersAttempted: stat.fg3a,
      threePointPercentage: stat.fg3_pct,
      freeThrowsMade: stat.ftm,
      freeThrowsAttempted: stat.fta,
      freeThrowPercentage: stat.ft_pct,
      minutesPlayed: stat.min
    }
  }));
  
  console.log(`✅ Collected ${processedStats.length} player stat lines`);
  return processedStats;
}

async function collectSeasonAverages() {
  console.log('\n📈 Collecting Season Averages for Top Players...');
  
  // Get some star player IDs (LeBron, Giannis, Curry, etc.)
  const starPlayerIds = [237, 15, 115, 145, 192, 246, 274, 278, 434, 472]; // Top NBA stars
  
  const result = await fetchBDLData(BDL_ENDPOINTS.season_averages, {
    season: new Date().getFullYear() - 1,
    player_ids: starPlayerIds
  });
  
  if (!result || !result.data) {
    return [];
  }
  
  const processedAverages = result.data.map((avg: any) => ({
    playerId: avg.player_id,
    season: avg.season,
    gamesPlayed: avg.games_played,
    averages: {
      points: avg.pts,
      assists: avg.ast,
      rebounds: avg.reb,
      steals: avg.stl,
      blocks: avg.blk,
      turnovers: avg.turnover,
      fieldGoalPercentage: avg.fg_pct,
      threePointPercentage: avg.fg3_pct,
      freeThrowPercentage: avg.ft_pct,
      minutesPlayed: avg.min
    }
  }));
  
  console.log(`✅ Collected season averages for ${processedAverages.length} star players`);
  return processedAverages;
}

async function collectAllBallDontLieData() {
  console.log('🏀 BALL DON\'T LIE - REAL NBA DATA COLLECTION');
  console.log('=============================================\n');
  
  const timestamp = Date.now();
  
  // Collect all data types
  const [players, teams, games, stats, seasonAverages] = await Promise.all([
    collectNBAPlayers(),
    collectNBATeams(),
    collectRecentGames(),
    collectPlayerStats(),
    collectSeasonAverages()
  ]);
  
  // Combine all data
  const allData = {
    source: 'Ball Don\'t Lie API',
    timestamp: new Date().toISOString(),
    description: '100% Real NBA Data - No Mock Data!',
    data: {
      players,
      teams,
      games,
      stats,
      seasonAverages
    },
    summary: {
      totalPlayers: players.length,
      totalTeams: teams.length,
      totalGames: games.length,
      totalStats: stats.length,
      totalSeasonAverages: seasonAverages.length,
      totalDataPoints: players.length + teams.length + games.length + stats.length + seasonAverages.length
    }
  };
  
  // Save to file
  const filename = `BallDontLie_NBA_REAL_DATA_${timestamp}.json`;
  const filepath = path.join(DATA_DIR, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(allData, null, 2));
  
  console.log('\n✅ BALL DON\'T LIE DATA COLLECTION COMPLETE!');
  console.log('==========================================');
  console.log(`🏀 Total players: ${allData.summary.totalPlayers}`);
  console.log(`🏢 Total teams: ${allData.summary.totalTeams}`);
  console.log(`📅 Recent games: ${allData.summary.totalGames}`);
  console.log(`📊 Player stats: ${allData.summary.totalStats}`);
  console.log(`📈 Season averages: ${allData.summary.totalSeasonAverages}`);
  console.log(`💾 Total data points: ${allData.summary.totalDataPoints}`);
  console.log(`📁 Saved to: ${filename}`);
  
  return allData;
}

// Continuous collection mode
async function startContinuousCollection() {
  console.log('♾️ Starting Continuous Ball Don\'t Lie Data Collection');
  console.log('Collecting every 10 minutes...\n');
  
  // Initial collection
  await collectAllBallDontLieData();
  
  // Schedule every 10 minutes
  const interval = setInterval(async () => {
    console.log(`\n🔄 [${new Date().toLocaleTimeString()}] Running collection cycle...`);
    await collectAllBallDontLieData();
  }, 10 * 60 * 1000); // 10 minutes
  
  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Stopping Ball Don\'t Lie collection...');
    clearInterval(interval);
    console.log('✅ Collector stopped');
    process.exit(0);
  });
}

// Execute
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--continuous')) {
    startContinuousCollection().catch(console.error);
  } else {
    collectAllBallDontLieData()
      .then(() => {
        console.log('\n✅ Collection complete!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n❌ Collection failed:', error);
        process.exit(1);
      });
  }
}

export { collectAllBallDontLieData, startContinuousCollection };