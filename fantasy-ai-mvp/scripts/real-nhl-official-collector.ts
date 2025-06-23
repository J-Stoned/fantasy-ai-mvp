#!/usr/bin/env tsx

/**
 * 🏒 NHL OFFICIAL API - REAL HOCKEY DATA COLLECTOR
 * 100% FREE Official NHL API - No key required!
 * https://statsapi.web.nhl.com/api/v1/
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

// NHL OFFICIAL API ENDPOINTS (100% FREE!)
const NHL_BASE_URL = 'https://statsapi.web.nhl.com/api/v1';

const NHL_ENDPOINTS = {
  teams: `${NHL_BASE_URL}/teams`,
  schedule: `${NHL_BASE_URL}/schedule`,
  standings: `${NHL_BASE_URL}/standings`,
  conferences: `${NHL_BASE_URL}/conferences`,
  divisions: `${NHL_BASE_URL}/divisions`,
  seasons: `${NHL_BASE_URL}/seasons/current`,
  gameTypes: `${NHL_BASE_URL}/gameTypes`
};

// Dynamic endpoints that need IDs
const NHL_DYNAMIC = {
  team: (id: number) => `${NHL_BASE_URL}/teams/${id}?expand=team.roster`,
  player: (id: number) => `${NHL_BASE_URL}/people/${id}`,
  playerStats: (id: number) => `${NHL_BASE_URL}/people/${id}/stats?stats=statsSingleSeason&season=20232024`,
  game: (id: number) => `${NHL_BASE_URL}/game/${id}/feed/live`
};

async function fetchNHLData(url: string): Promise<any | null> {
  try {
    console.log(`🏒 Fetching: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Fantasy.AI NHL Data Collector'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`✅ Success!`);
    
    return data;
    
  } catch (error) {
    console.error(`❌ Error fetching data:`, error);
    return null;
  }
}

async function collectNHLTeams() {
  console.log('\n🏢 Collecting NHL Teams with Rosters...');
  
  const teamsData = await fetchNHLData(NHL_ENDPOINTS.teams);
  
  if (!teamsData || !teamsData.teams) {
    return [];
  }
  
  const teamsWithRosters = [];
  
  // Get detailed info for each team including roster
  for (const team of teamsData.teams) {
    const detailedTeam = await fetchNHLData(NHL_DYNAMIC.team(team.id));
    
    if (detailedTeam && detailedTeam.teams && detailedTeam.teams[0]) {
      const teamInfo = detailedTeam.teams[0];
      
      const processedTeam = {
        id: teamInfo.id,
        name: teamInfo.name,
        abbreviation: teamInfo.abbreviation,
        teamName: teamInfo.teamName,
        locationName: teamInfo.locationName,
        conference: teamInfo.conference?.name,
        division: teamInfo.division?.name,
        venue: {
          name: teamInfo.venue?.name,
          city: teamInfo.venue?.city,
          timeZone: teamInfo.venue?.timeZone?.id
        },
        roster: teamInfo.roster?.roster?.map((player: any) => ({
          id: player.person?.id,
          fullName: player.person?.fullName,
          jerseyNumber: player.jerseyNumber,
          position: {
            code: player.position?.code,
            name: player.position?.name,
            type: player.position?.type
          }
        })) || []
      };
      
      teamsWithRosters.push(processedTeam);
      console.log(`✅ ${teamInfo.name} - ${processedTeam.roster.length} players`);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`✅ Collected ${teamsWithRosters.length} NHL teams with rosters`);
  return teamsWithRosters;
}

async function collectNHLSchedule() {
  console.log('\n📅 Collecting NHL Schedule...');
  
  // Get games for the next 7 days
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const scheduleUrl = `${NHL_ENDPOINTS.schedule}?startDate=${today.toISOString().split('T')[0]}&endDate=${nextWeek.toISOString().split('T')[0]}`;
  const scheduleData = await fetchNHLData(scheduleUrl);
  
  if (!scheduleData || !scheduleData.dates) {
    return [];
  }
  
  const allGames = [];
  
  for (const date of scheduleData.dates) {
    for (const game of date.games) {
      allGames.push({
        id: game.gamePk,
        date: game.gameDate,
        gameType: game.gameType,
        season: game.season,
        status: game.status?.detailedState,
        venue: game.venue?.name,
        teams: {
          away: {
            id: game.teams?.away?.team?.id,
            name: game.teams?.away?.team?.name,
            score: game.teams?.away?.score,
            leagueRecord: game.teams?.away?.leagueRecord
          },
          home: {
            id: game.teams?.home?.team?.id,
            name: game.teams?.home?.team?.name,
            score: game.teams?.home?.score,
            leagueRecord: game.teams?.home?.leagueRecord
          }
        }
      });
    }
  }
  
  console.log(`✅ Collected ${allGames.length} NHL games`);
  return allGames;
}

async function collectNHLStandings() {
  console.log('\n📊 Collecting NHL Standings...');
  
  const standingsData = await fetchNHLData(NHL_ENDPOINTS.standings);
  
  if (!standingsData || !standingsData.records) {
    return [];
  }
  
  const processedStandings = standingsData.records.map((division: any) => ({
    division: division.division?.name,
    conference: division.conference?.name,
    teams: division.teamRecords?.map((team: any) => ({
      id: team.team?.id,
      name: team.team?.name,
      points: team.points,
      gamesPlayed: team.gamesPlayed,
      wins: team.leagueRecord?.wins,
      losses: team.leagueRecord?.losses,
      ot: team.leagueRecord?.ot,
      goalsFor: team.goalsScored,
      goalsAgainst: team.goalsAgainst,
      streak: team.streak?.streakCode,
      divisionRank: team.divisionRank,
      conferenceRank: team.conferenceRank,
      leagueRank: team.leagueRank,
      wildCardRank: team.wildCardRank
    })) || []
  }));
  
  const totalTeams = processedStandings.reduce((sum, div) => sum + div.teams.length, 0);
  console.log(`✅ Collected standings for ${totalTeams} teams in ${processedStandings.length} divisions`);
  
  return processedStandings;
}

async function collectTopPlayerStats() {
  console.log('\n🌟 Collecting Top NHL Player Stats...');
  
  // Some top NHL player IDs (McDavid, Matthews, MacKinnon, etc.)
  const topPlayerIds = [8478402, 8479318, 8477492, 8476453, 8471675, 8478483, 8477474, 8476456];
  const playerStats = [];
  
  for (const playerId of topPlayerIds) {
    // Get player info
    const playerData = await fetchNHLData(NHL_DYNAMIC.player(playerId));
    
    if (playerData && playerData.people && playerData.people[0]) {
      const player = playerData.people[0];
      
      // Get player stats
      const statsData = await fetchNHLData(NHL_DYNAMIC.playerStats(playerId));
      
      let seasonStats = null;
      if (statsData && statsData.stats && statsData.stats[0]?.splits?.[0]?.stat) {
        seasonStats = statsData.stats[0].splits[0].stat;
      }
      
      playerStats.push({
        id: player.id,
        fullName: player.fullName,
        firstName: player.firstName,
        lastName: player.lastName,
        primaryNumber: player.primaryNumber,
        currentAge: player.currentAge,
        nationality: player.nationality,
        height: player.height,
        weight: player.weight,
        position: {
          code: player.primaryPosition?.code,
          name: player.primaryPosition?.name,
          type: player.primaryPosition?.type
        },
        currentTeam: {
          id: player.currentTeam?.id,
          name: player.currentTeam?.name
        },
        stats: seasonStats ? {
          games: seasonStats.games,
          goals: seasonStats.goals,
          assists: seasonStats.assists,
          points: seasonStats.points,
          plusMinus: seasonStats.plusMinus,
          pim: seasonStats.pim,
          powerPlayGoals: seasonStats.powerPlayGoals,
          powerPlayPoints: seasonStats.powerPlayPoints,
          shots: seasonStats.shots,
          shotPct: seasonStats.shotPct,
          hits: seasonStats.hits,
          blocks: seasonStats.blocked,
          timeOnIce: seasonStats.timeOnIce,
          faceOffPct: seasonStats.faceOffPct
        } : null
      });
      
      console.log(`✅ ${player.fullName} - ${seasonStats?.points || 0} points`);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`✅ Collected stats for ${playerStats.length} top NHL players`);
  return playerStats;
}

async function collectRecentGameDetails() {
  console.log('\n🏒 Collecting Recent Game Details...');
  
  // Get yesterday's games
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const scheduleUrl = `${NHL_ENDPOINTS.schedule}?date=${yesterday.toISOString().split('T')[0]}`;
  const scheduleData = await fetchNHLData(scheduleUrl);
  
  if (!scheduleData || !scheduleData.dates?.[0]?.games) {
    return [];
  }
  
  const gameDetails = [];
  const games = scheduleData.dates[0].games.slice(0, 3); // Limit to 3 games for demo
  
  for (const game of games) {
    const liveData = await fetchNHLData(NHL_DYNAMIC.game(game.gamePk));
    
    if (liveData) {
      gameDetails.push({
        id: game.gamePk,
        timestamp: liveData.gameData?.datetime?.dateTime,
        venue: liveData.gameData?.venue?.name,
        status: liveData.gameData?.status?.detailedState,
        teams: {
          away: liveData.gameData?.teams?.away,
          home: liveData.gameData?.teams?.home
        },
        score: {
          away: liveData.liveData?.linescore?.teams?.away?.goals,
          home: liveData.liveData?.linescore?.teams?.home?.goals
        },
        periods: liveData.liveData?.linescore?.periods,
        shootout: liveData.liveData?.linescore?.shootoutInfo,
        stars: liveData.liveData?.decisions
      });
      
      console.log(`✅ ${liveData.gameData?.teams?.away?.name} @ ${liveData.gameData?.teams?.home?.name}`);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`✅ Collected details for ${gameDetails.length} recent games`);
  return gameDetails;
}

async function collectAllNHLData() {
  console.log('🏒 NHL OFFICIAL API - REAL HOCKEY DATA COLLECTION');
  console.log('================================================\n');
  
  const timestamp = Date.now();
  
  // Collect all data types
  const [teams, schedule, standings, playerStats, gameDetails] = await Promise.all([
    collectNHLTeams(),
    collectNHLSchedule(),
    collectNHLStandings(),
    collectTopPlayerStats(),
    collectRecentGameDetails()
  ]);
  
  // Calculate total players from all team rosters
  const totalPlayers = teams.reduce((sum, team) => sum + team.roster.length, 0);
  
  // Combine all data
  const allData = {
    source: 'NHL Official API',
    timestamp: new Date().toISOString(),
    description: '100% Real NHL Data - Direct from NHL.com!',
    data: {
      teams,
      schedule,
      standings,
      playerStats,
      gameDetails
    },
    summary: {
      totalTeams: teams.length,
      totalPlayers,
      totalGames: schedule.length,
      totalDivisions: standings.length,
      topPlayersTracked: playerStats.length,
      recentGamesDetailed: gameDetails.length,
      totalDataPoints: teams.length + totalPlayers + schedule.length + standings.length + playerStats.length + gameDetails.length
    }
  };
  
  // Save to file
  const filename = `NHL_Official_REAL_DATA_${timestamp}.json`;
  const filepath = path.join(DATA_DIR, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(allData, null, 2));
  
  console.log('\n✅ NHL OFFICIAL DATA COLLECTION COMPLETE!');
  console.log('========================================');
  console.log(`🏒 Total teams: ${allData.summary.totalTeams}`);
  console.log(`👥 Total players: ${allData.summary.totalPlayers}`);
  console.log(`📅 Scheduled games: ${allData.summary.totalGames}`);
  console.log(`📊 Divisions tracked: ${allData.summary.totalDivisions}`);
  console.log(`🌟 Top players tracked: ${allData.summary.topPlayersTracked}`);
  console.log(`🎯 Recent games detailed: ${allData.summary.recentGamesDetailed}`);
  console.log(`💾 Total data points: ${allData.summary.totalDataPoints}`);
  console.log(`📁 Saved to: ${filename}`);
  
  return allData;
}

// Continuous collection mode
async function startContinuousCollection() {
  console.log('♾️ Starting Continuous NHL Official Data Collection');
  console.log('Collecting every 15 minutes...\n');
  
  // Initial collection
  await collectAllNHLData();
  
  // Schedule every 15 minutes
  const interval = setInterval(async () => {
    console.log(`\n🔄 [${new Date().toLocaleTimeString()}] Running collection cycle...`);
    await collectAllNHLData();
  }, 15 * 60 * 1000); // 15 minutes
  
  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Stopping NHL data collection...');
    clearInterval(interval);
    console.log('✅ NHL collector stopped');
    process.exit(0);
  });
}

// Execute
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--continuous')) {
    startContinuousCollection().catch(console.error);
  } else {
    collectAllNHLData()
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

export { collectAllNHLData, startContinuousCollection };