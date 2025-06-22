#!/usr/bin/env node

/**
 * NFL Roster Data Collection Script
 * Collects complete roster data for all 32 NFL teams from multiple sources
 * Target: 1,696+ NFL players (53 active + practice squad per team)
 */

const fs = require('fs');
const path = require('path');

// NFL Teams data
const teamsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/nfl-rosters/nfl-teams.json'), 'utf8'));

// Data collection URLs for each source
const dataSources = {
  espn: {
    baseUrl: 'https://www.espn.com/nfl/team/roster/_/name/',
    urlPattern: (team) => `https://www.espn.com/nfl/team/roster/_/name/${team.abbreviation.toLowerCase()}`
  },
  nfl: {
    baseUrl: 'https://www.nfl.com/teams/',
    urlPattern: (team) => `https://www.nfl.com/teams/${team.abbreviation.toLowerCase()}/roster/`
  },
  yahoo: {
    baseUrl: 'https://sports.yahoo.com/nfl/teams/',
    urlPattern: (team) => `https://sports.yahoo.com/nfl/teams/${team.abbreviation.toLowerCase()}/roster/`
  },
  cbs: {
    baseUrl: 'https://www.cbssports.com/nfl/teams/',
    urlPattern: (team) => `https://www.cbssports.com/nfl/teams/${team.abbreviation}/roster/`
  },
  official: {
    urlPattern: (team) => `https://www.${team.official_site}/team/players-roster/`
  }
};

// Player data structure
const createPlayerRecord = (playerData) => ({
  name: playerData.name || '',
  position: playerData.position || '',
  jerseyNumber: playerData.jerseyNumber || null,
  height: playerData.height || '',
  weight: playerData.weight || null,
  age: playerData.age || null,
  experience: playerData.experience || '',
  college: playerData.college || '',
  team: playerData.team || '',
  teamAbbreviation: playerData.teamAbbreviation || '',
  status: playerData.status || 'active', // active, practice_squad, injured_reserve
  stats: playerData.stats || {},
  source: playerData.source || '',
  lastUpdated: new Date().toISOString()
});

// Data collection functions
const collectTeamData = async (team) => {
  console.log(`\n🏈 Collecting data for ${team.name} (${team.abbreviation})...`);
  
  const teamData = {
    team: team.name,
    abbreviation: team.abbreviation,
    division: team.division,
    players: [],
    sources: {},
    metadata: {
      totalPlayers: 0,
      activePlayers: 0,
      practiceSquad: 0,
      collectionDate: new Date().toISOString()
    }
  };

  // URLs to scrape for this team
  const urls = {
    espn: dataSources.espn.urlPattern(team),
    nfl: dataSources.nfl.urlPattern(team),
    yahoo: dataSources.yahoo.urlPattern(team),
    cbs: dataSources.cbs.urlPattern(team),
    official: dataSources.official.urlPattern(team)
  };

  console.log('📊 Data sources:');
  Object.entries(urls).forEach(([source, url]) => {
    console.log(`  ${source.toUpperCase()}: ${url}`);
  });

  return { teamData, urls };
};

// Main collection function
const main = async () => {
  console.log('🚀 Starting NFL Roster Data Collection');
  console.log(`📋 Target: Collect rosters for all ${teamsData.nfl_teams.length} NFL teams`);
  console.log('🎯 Goal: 1,696+ total NFL players\n');

  const allRosterData = {
    metadata: {
      collectionStart: new Date().toISOString(),
      totalTeams: teamsData.nfl_teams.length,
      targetPlayers: 1696,
      sources: Object.keys(dataSources),
      version: '1.0.0'
    },
    teams: [],
    summary: {
      totalPlayers: 0,
      totalActivePlayers: 0,
      totalPracticeSquad: 0,
      teamsCovered: 0,
      sourcesSuccessful: {}
    }
  };

  // Generate collection plan for each team
  for (const team of teamsData.nfl_teams) {
    const { teamData, urls } = await collectTeamData(team);
    
    // Store URLs for external scraping tools
    teamData.sources = urls;
    allRosterData.teams.push(teamData);
  }

  // Save the collection plan
  const outputPath = path.join(__dirname, '../data/nfl-rosters/collection-plan.json');
  fs.writeFileSync(outputPath, JSON.stringify(allRosterData, null, 2));
  
  console.log(`\n✅ Collection plan saved to: ${outputPath}`);
  console.log(`📊 Ready to scrape ${allRosterData.teams.length} teams from ${Object.keys(dataSources).length} sources`);
  
  return allRosterData;
};

// Export for use with MCP servers
module.exports = {
  teamsData,
  dataSources,
  createPlayerRecord,
  collectTeamData,
  main
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}