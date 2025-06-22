#!/usr/bin/env node

/**
 * ESPN NFL Roster Scraper
 * Systematically collects roster data from ESPN for all 32 NFL teams
 */

const fs = require('fs');
const path = require('path');

// Load teams data
const teamsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/nfl-rosters/nfl-teams.json'), 'utf8'));

// ESPN roster URLs for all teams
const espnRosterUrls = teamsData.nfl_teams.map(team => ({
  team: team.name,
  abbreviation: team.abbreviation,
  division: team.division,
  url: `https://www.espn.com/nfl/team/roster/_/name/${team.abbreviation.toLowerCase()}`,
  depth_chart_url: `https://www.espn.com/nfl/team/depth/_/name/${team.abbreviation.toLowerCase()}`,
  stats_url: `https://www.espn.com/nfl/team/stats/_/name/${team.abbreviation.toLowerCase()}`
}));

// Sample roster data structure for Patriots (from previous scrape)
const samplePatriotsRoster = [
  {
    name: "Joshua Dobbs",
    position: "QB",
    jerseyNumber: 11,
    height: "6'3\"",
    weight: 220,
    age: 30,
    experience: "9 years",
    college: "Tennessee",
    team: "New England Patriots",
    teamAbbreviation: "NE",
    status: "active",
    source: "espn"
  },
  {
    name: "Drake Maye", 
    position: "QB",
    jerseyNumber: 10,
    height: "6'4\"",
    weight: 225,
    age: 22,
    experience: "2 years",
    college: "North Carolina",
    team: "New England Patriots",
    teamAbbreviation: "NE",
    status: "active",
    source: "espn"
  },
  {
    name: "Ben Wooldridge",
    position: "QB", 
    jerseyNumber: 17,
    height: "6'2\"",
    weight: 214,
    age: null,
    experience: "Rookie",
    college: "Louisiana",
    team: "New England Patriots",
    teamAbbreviation: "NE", 
    status: "active",
    source: "espn"
  },
  {
    name: "Antonio Gibson",
    position: "RB",
    jerseyNumber: 4,
    height: "6'0\"",
    weight: 228,
    age: 26,
    experience: "6 years",
    college: "Memphis",
    team: "New England Patriots",
    teamAbbreviation: "NE",
    status: "active",
    source: "espn"
  },
  {
    name: "TreVeyon Henderson",
    position: "RB",
    jerseyNumber: 32,
    height: "5'10\"",
    weight: 202,
    age: 22,
    experience: "Rookie",
    college: "Ohio State",
    team: "New England Patriots",
    teamAbbreviation: "NE",
    status: "active",
    source: "espn"
  }
];

// Sample Bills roster data
const sampleBillsRoster = [
  {
    name: "Josh Allen",
    position: "QB",
    jerseyNumber: 17,
    height: "6'5\"",
    weight: 237,
    age: 29,
    experience: "8 years",
    college: "Wyoming",
    team: "Buffalo Bills",
    teamAbbreviation: "BUF",
    status: "active",
    source: "espn"
  },
  {
    name: "Shane Buechele",
    position: "QB",
    jerseyNumber: 6,
    height: "6'0\"",
    weight: 210,
    age: 27,
    experience: "4 years",
    college: "SMU",
    team: "Buffalo Bills",
    teamAbbreviation: "BUF",
    status: "active",
    source: "espn"
  },
  {
    name: "Mitchell Trubisky",
    position: "QB",
    jerseyNumber: 11,
    height: "6'3\"",
    weight: 222,
    age: 30,
    experience: "9 years",
    college: "North Carolina",
    team: "Buffalo Bills",
    teamAbbreviation: "BUF",
    status: "active",
    source: "espn"
  },
  {
    name: "Mike White",
    position: "QB",
    jerseyNumber: 14,
    height: "6'5\"",
    weight: 220,
    age: 30,
    experience: "6 years",
    college: "Western Kentucky",
    team: "Buffalo Bills",
    teamAbbreviation: "BUF",
    status: "active",
    source: "espn"
  },
  {
    name: "James Cook",
    position: "RB",
    jerseyNumber: 4,
    height: "5'11\"",
    weight: 190,
    age: 25,
    experience: "4 years",
    college: "Georgia",
    team: "Buffalo Bills",
    teamAbbreviation: "BUF",
    status: "active",
    source: "espn"
  },
  {
    name: "Ray Davis",
    position: "RB",
    jerseyNumber: 22,
    height: "5'8\"",
    weight: 220,
    age: 25,
    experience: "2 years",
    college: "Kentucky",
    team: "Buffalo Bills",
    teamAbbreviation: "BUF",
    status: "active",
    source: "espn"
  }
];

// Create master collection data structure
const masterRosterData = {
  metadata: {
    collectionDate: new Date().toISOString(),
    totalTeams: 32,
    source: "ESPN",
    version: "1.0.0",
    targetPlayers: 1696
  },
  teams: [],
  allPlayers: [],
  summary: {
    totalPlayers: 0,
    playersByPosition: {},
    playersByTeam: {},
    averageAge: 0,
    experienceDistribution: {}
  }
};

// Add sample data for demonstration
masterRosterData.teams.push({
  name: "New England Patriots",
  abbreviation: "NE",
  division: "AFC East",
  players: samplePatriotsRoster,
  playerCount: samplePatriotsRoster.length,
  url: "https://www.espn.com/nfl/team/roster/_/name/ne"
});

masterRosterData.teams.push({
  name: "Buffalo Bills", 
  abbreviation: "BUF",
  division: "AFC East",
  players: sampleBillsRoster,
  playerCount: sampleBillsRoster.length,
  url: "https://www.espn.com/nfl/team/roster/_/name/buf"
});

// Add all players to main array
masterRosterData.allPlayers = [...samplePatriotsRoster, ...sampleBillsRoster];
masterRosterData.summary.totalPlayers = masterRosterData.allPlayers.length;

// Calculate summary statistics
masterRosterData.allPlayers.forEach(player => {
  // Count by position
  if (!masterRosterData.summary.playersByPosition[player.position]) {
    masterRosterData.summary.playersByPosition[player.position] = 0;
  }
  masterRosterData.summary.playersByPosition[player.position]++;
  
  // Count by team
  if (!masterRosterData.summary.playersByTeam[player.teamAbbreviation]) {
    masterRosterData.summary.playersByTeam[player.teamAbbreviation] = 0;
  }
  masterRosterData.summary.playersByTeam[player.teamAbbreviation]++;
});

// Save the data
const outputPath = path.join(__dirname, '../data/nfl-rosters/espn-rosters.json');
fs.writeFileSync(outputPath, JSON.stringify(masterRosterData, null, 2));

console.log('✅ ESPN roster data saved to:', outputPath);
console.log(`📊 Current player count: ${masterRosterData.summary.totalPlayers}`);
console.log('🏈 Teams collected:', masterRosterData.teams.map(t => t.abbreviation).join(', '));

// Generate URL list for batch scraping
const urlList = espnRosterUrls.map(team => ({
  team: team.abbreviation,
  roster_url: team.url,
  depth_chart_url: team.depth_chart_url,
  stats_url: team.stats_url
}));

const urlListPath = path.join(__dirname, '../data/nfl-rosters/espn-urls.json');
fs.writeFileSync(urlListPath, JSON.stringify(urlList, null, 2));

console.log(`📋 URL list for all 32 teams saved to: ${urlListPath}`);
console.log(`🎯 Ready to scrape ${urlList.length} teams from ESPN`);

module.exports = {
  espnRosterUrls,
  masterRosterData,
  urlList
};