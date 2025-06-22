#!/usr/bin/env node

/**
 * ESPN Player Data Collector
 * Comprehensive script to collect 1000+ players from ESPN APIs
 * Covers NFL, NBA, MLB, and NHL
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Team IDs for each league
const TEAMS = {
  nfl: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 33, 34],
  nba: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
  mlb: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
  nhl: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 25, 26, 27, 28, 29, 30, 37, 124292, 129764]
};

// API Endpoints
const ENDPOINTS = {
  nfl: {
    allPlayers: 'https://sports.core.api.espn.com/v3/sports/football/nfl/athletes?limit=20000&active=true',
    teams: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams',
    roster: (teamId) => `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/roster`,
    player: (playerId) => `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${playerId}/overview`
  },
  nba: {
    allPlayers: 'https://sports.core.api.espn.com/v3/sports/basketball/nba/athletes?limit=20000&active=true',
    teams: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams',
    roster: (teamId) => `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}/roster`,
    player: (playerId) => `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${playerId}/overview`
  },
  mlb: {
    allPlayers: 'https://sports.core.api.espn.com/v3/sports/baseball/mlb/athletes?limit=20000&active=true',
    teams: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams',
    roster: (teamId) => `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams/${teamId}/roster`,
    player: (playerId) => `https://site.web.api.espn.com/apis/common/v3/sports/baseball/mlb/athletes/${playerId}/overview`
  },
  nhl: {
    allPlayers: 'https://sports.core.api.espn.com/v3/sports/hockey/nhl/athletes?limit=20000&active=true',
    teams: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams',
    roster: (teamId) => `https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams/${teamId}/roster`,
    player: (playerId) => `https://site.web.api.espn.com/apis/common/v3/sports/hockey/nhl/athletes/${playerId}/overview`
  }
};

class ESPNPlayerCollector {
  constructor() {
    this.players = {
      nfl: [],
      nba: [],
      mlb: [],
      nhl: []
    };
    this.totalPlayers = 0;
    this.requestDelay = 100; // Delay between requests to avoid rate limiting
  }

  // Make HTTP request with promise
  makeRequest(url) {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error(`Failed to parse JSON from ${url}: ${error.message}`));
          }
        });
      }).on('error', reject);
    });
  }

  // Add delay between requests
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Collect all players for a specific league
  async collectLeaguePlayers(league) {
    console.log(`\n🏈 Collecting ${league.toUpperCase()} players...`);
    
    try {
      // Get all players directly
      console.log(`Fetching all ${league} active players...`);
      const allPlayersData = await this.makeRequest(ENDPOINTS[league].allPlayers);
      
      if (allPlayersData.items) {
        for (const player of allPlayersData.items) {
          const playerData = this.extractPlayerData(player, league);
          this.players[league].push(playerData);
        }
      }

      await this.delay(this.requestDelay);

      // Also get roster data for team affiliations and positions
      console.log(`Fetching ${league} team rosters for position data...`);
      for (const teamId of TEAMS[league]) {
        try {
          const rosterData = await this.makeRequest(ENDPOINTS[league].roster(teamId));
          if (rosterData.athletes) {
            this.processRosterData(rosterData, league);
          }
          await this.delay(this.requestDelay);
        } catch (error) {
          console.log(`  Warning: Could not fetch roster for team ${teamId}: ${error.message}`);
        }
      }

      console.log(`✅ Collected ${this.players[league].length} ${league.toUpperCase()} players`);
      
    } catch (error) {
      console.error(`❌ Error collecting ${league} players:`, error.message);
    }
  }

  // Extract relevant player data
  extractPlayerData(player, league) {
    const data = {
      id: player.id,
      name: player.displayName || player.fullName,
      firstName: player.firstName,
      lastName: player.lastName,
      age: player.age,
      height: player.displayHeight,
      weight: player.displayWeight,
      jersey: player.jersey,
      position: player.position?.displayName || player.position?.name,
      positionAbbr: player.position?.abbreviation,
      experience: player.experience?.years,
      college: player.college?.name,
      birthPlace: player.birthPlace?.displayText,
      citizenship: player.citizenship,
      league: league.toUpperCase(),
      active: player.active,
      // League-specific data
      ...(league === 'nfl' && {
        hand: player.hand?.displayValue,
      }),
      ...(league === 'nba' && {
        hand: player.hand?.displayValue,
      }),
      ...(league === 'mlb' && {
        bats: player.hand?.displayValue,
        throws: player.throws?.displayValue,
      }),
      ...(league === 'nhl' && {
        hand: player.hand?.displayValue,
        shoots: player.hand?.displayValue,
      }),
      // Fantasy relevant
      team: player.team?.displayName,
      teamAbbr: player.team?.abbreviation,
      injuries: player.injuries || [],
      lastUpdated: new Date().toISOString()
    };

    return data;
  }

  // Process roster data to enhance player information
  processRosterData(rosterData, league) {
    if (!rosterData.athletes) return;

    for (const group of rosterData.athletes) {
      if (group.items) {
        for (const player of group.items) {
          // Find existing player and enhance with roster data
          const existingPlayer = this.players[league].find(p => p.id === player.id);
          if (existingPlayer) {
            existingPlayer.position = existingPlayer.position || group.position?.displayName;
            existingPlayer.positionAbbr = existingPlayer.positionAbbr || group.position?.abbreviation;
            existingPlayer.team = existingPlayer.team || rosterData.team?.displayName;
            existingPlayer.teamAbbr = existingPlayer.teamAbbr || rosterData.team?.abbreviation;
          } else {
            // Add new player from roster if not in main list
            const playerData = this.extractPlayerData(player, league);
            playerData.position = group.position?.displayName;
            playerData.positionAbbr = group.position?.abbreviation;
            playerData.team = rosterData.team?.displayName;
            playerData.teamAbbr = rosterData.team?.abbreviation;
            this.players[league].push(playerData);
          }
        }
      }
    }
  }

  // Collect all players from all leagues
  async collectAllPlayers() {
    console.log('🚀 Starting comprehensive ESPN player data collection...\n');
    
    const leagues = ['nfl', 'nba', 'mlb', 'nhl'];
    
    for (const league of leagues) {
      await this.collectLeaguePlayers(league);
      await this.delay(this.requestDelay * 2); // Extra delay between leagues
    }

    // Calculate totals
    this.totalPlayers = Object.values(this.players).reduce((sum, players) => sum + players.length, 0);
    
    console.log('\n📊 Collection Summary:');
    console.log(`NFL Players: ${this.players.nfl.length}`);
    console.log(`NBA Players: ${this.players.nba.length}`);
    console.log(`MLB Players: ${this.players.mlb.length}`);
    console.log(`NHL Players: ${this.players.nhl.length}`);
    console.log(`🎯 Total Players: ${this.totalPlayers}`);
  }

  // Save data to files
  async saveData() {
    const outputDir = path.join(__dirname, '../data/espn-players');
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save individual league files
    for (const [league, players] of Object.entries(this.players)) {
      const filename = path.join(outputDir, `${league}_players.json`);
      fs.writeFileSync(filename, JSON.stringify(players, null, 2));
      console.log(`💾 Saved ${players.length} ${league.toUpperCase()} players to ${filename}`);
    }

    // Save combined file
    const allPlayersFile = path.join(outputDir, 'all_espn_players.json');
    fs.writeFileSync(allPlayersFile, JSON.stringify(this.players, null, 2));
    console.log(`💾 Saved all ${this.totalPlayers} players to ${allPlayersFile}`);

    // Save summary statistics
    const summary = {
      totalPlayers: this.totalPlayers,
      byLeague: {
        nfl: this.players.nfl.length,
        nba: this.players.nba.length,
        mlb: this.players.mlb.length,
        nhl: this.players.nhl.length
      },
      collectionDate: new Date().toISOString(),
      endpoints: ENDPOINTS
    };

    const summaryFile = path.join(outputDir, 'collection_summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    console.log(`📈 Saved collection summary to ${summaryFile}`);
  }

  // Main execution method
  async run() {
    try {
      await this.collectAllPlayers();
      await this.saveData();
      
      console.log(`\n🎉 Successfully collected ${this.totalPlayers} players from ESPN!`);
      console.log('✅ Data collection complete!');
      
    } catch (error) {
      console.error('❌ Collection failed:', error);
      process.exit(1);
    }
  }
}

// Run the collector if this file is executed directly
if (require.main === module) {
  const collector = new ESPNPlayerCollector();
  collector.run();
}

module.exports = ESPNPlayerCollector;