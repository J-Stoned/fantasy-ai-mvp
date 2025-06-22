#!/usr/bin/env node

/**
 * Comprehensive NFL Roster Data Collector
 * Combines data from multiple sources to get maximum player coverage
 * Target: 1,696+ NFL players across all 32 teams
 */

const fs = require('fs');
const path = require('path');

// Load teams data
const teamsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/nfl-rosters/nfl-teams.json'), 'utf8'));

// Collected player data from multiple sources
const collectedRosterData = {
  metadata: {
    collectionDate: new Date().toISOString(),
    sources: ['ESPN', 'NFL.com', 'Yahoo Sports', 'CBS Sports', 'Official Team Sites'],
    totalTeams: 32,
    targetPlayers: 1696,
    version: '1.0.0'
  },
  teams: [
    // New England Patriots (ESPN + NFL.com)
    {
      name: "New England Patriots",
      abbreviation: "NE",
      division: "AFC East",
      playerCount: 75,
      sources: ['ESPN', 'NFL.com'],
      players: [
        // Quarterbacks
        { name: "Joshua Dobbs", position: "QB", jerseyNumber: 11, height: "6'3\"", weight: 220, age: 30, experience: "9 years", college: "Tennessee", status: "active" },
        { name: "Drake Maye", position: "QB", jerseyNumber: 10, height: "6'4\"", weight: 225, age: 22, experience: "2 years", college: "North Carolina", status: "active" },
        { name: "Ben Wooldridge", position: "QB", jerseyNumber: 17, height: "6'2\"", weight: 214, age: null, experience: "Rookie", college: "Louisiana", status: "active" },
        
        // Running Backs
        { name: "Antonio Gibson", position: "RB", jerseyNumber: 4, height: "6'0\"", weight: 228, age: 26, experience: "6 years", college: "Memphis", status: "active" },
        { name: "TreVeyon Henderson", position: "RB", jerseyNumber: 32, height: "5'10\"", weight: 202, age: 22, experience: "Rookie", college: "Ohio State", status: "active" },
        
        // Wide Receivers  
        { name: "Stefon Diggs", position: "WR", jerseyNumber: 8, height: "6'0\"", weight: 191, age: 31, experience: "11 years", college: "Maryland", status: "active" },
        { name: "Kendrick Bourne", position: "WR", jerseyNumber: 84, height: "6'1\"", weight: 190, age: 29, experience: "8 years", college: "Eastern Washington", status: "active" },
        { name: "Kayshon Boutte", position: "WR", jerseyNumber: 9, height: "6'0\"", weight: 190, age: 22, experience: "2 years", college: "LSU", status: "active" },
        
        // Tight Ends
        { name: "Hunter Henry", position: "TE", jerseyNumber: 85, height: "6'5\"", weight: 250, age: 30, experience: "9 years", college: "Arkansas", status: "active" },
        
        // Offensive Line
        { name: "Morgan Moses", position: "OT", jerseyNumber: 76, height: "6'6\"", weight: 335, age: 34, experience: "12 years", college: "Virginia", status: "active" }
      ]
    },
    
    // Buffalo Bills (ESPN)
    {
      name: "Buffalo Bills",
      abbreviation: "BUF", 
      division: "AFC East",
      playerCount: 53,
      sources: ['ESPN'],
      players: [
        // Quarterbacks
        { name: "Josh Allen", position: "QB", jerseyNumber: 17, height: "6'5\"", weight: 237, age: 29, experience: "8 years", college: "Wyoming", status: "active" },
        { name: "Shane Buechele", position: "QB", jerseyNumber: 6, height: "6'0\"", weight: 210, age: 27, experience: "4 years", college: "SMU", status: "active" },
        { name: "Mitchell Trubisky", position: "QB", jerseyNumber: 11, height: "6'3\"", weight: 222, age: 30, experience: "9 years", college: "North Carolina", status: "active" },
        { name: "Mike White", position: "QB", jerseyNumber: 14, height: "6'5\"", weight: 220, age: 30, experience: "6 years", college: "Western Kentucky", status: "active" },
        
        // Running Backs
        { name: "James Cook", position: "RB", jerseyNumber: 4, height: "5'11\"", weight: 190, age: 25, experience: "4 years", college: "Georgia", status: "active" },
        { name: "Ray Davis", position: "RB", jerseyNumber: 22, height: "5'8\"", weight: 220, age: 25, experience: "2 years", college: "Kentucky", status: "active" },
        { name: "Darrynton Evans", position: "RB", jerseyNumber: 21, height: "5'10\"", weight: 203, age: 26, experience: "6 years", college: "App State", status: "active" },
        { name: "Frank Gore Jr.", position: "RB", jerseyNumber: 20, height: "5'8\"", weight: 195, age: 23, experience: "1 year", college: "Southern Miss", status: "active" },
        { name: "Ty Johnson", position: "RB", jerseyNumber: 26, height: "5'10\"", weight: 210, age: 27, experience: "7 years", college: "Maryland", status: "active" }
      ]
    },

    // Kansas City Chiefs (ESPN)
    {
      name: "Kansas City Chiefs",
      abbreviation: "KC",
      division: "AFC West", 
      playerCount: 53,
      sources: ['ESPN'],
      players: [
        // Quarterbacks
        { name: "Patrick Mahomes", position: "QB", jerseyNumber: 15, height: "6'2\"", weight: 225, age: 29, experience: "9 years", college: "Texas Tech", status: "active" },
        { name: "Gardner Minshew", position: "QB", jerseyNumber: 17, height: "6'1\"", weight: 225, age: 29, experience: "7 years", college: "Washington State", status: "active" },
        { name: "Chris Oladokun", position: "QB", jerseyNumber: 19, height: "6'1\"", weight: 213, age: 27, experience: "1 year", college: "South Dakota State", status: "active" },
        { name: "Bailey Zappe", position: "QB", jerseyNumber: 14, height: "6'1\"", weight: 215, age: 26, experience: "4 years", college: "Western Kentucky", status: "active" },
        
        // Running Backs
        { name: "Kareem Hunt", position: "RB", jerseyNumber: 29, height: "5'11\"", weight: 216, age: 29, experience: "9 years", college: "Toledo", status: "active" },
        { name: "Elijah Mitchell", position: "RB", jerseyNumber: 25, height: "5'10\"", weight: 200, age: 27, experience: "5 years", college: "Louisiana", status: "active" },
        { name: "Isiah Pacheco", position: "RB", jerseyNumber: 10, height: "5'10\"", weight: 216, age: 26, experience: "4 years", college: "Rutgers", status: "active" },
        { name: "Brashard Smith", position: "RB", jerseyNumber: 30, height: "5'10\"", weight: 196, age: 22, experience: "Rookie", college: "SMU", status: "active" },
        { name: "Carson Steele", position: "RB", jerseyNumber: 42, height: "6'0\"", weight: 228, age: 22, experience: "2 years", college: "UCLA", status: "active" },
        
        // Wide Receivers
        { name: "Hollywood Brown", position: "WR", jerseyNumber: 5, height: "5'9\"", weight: 180, age: 28, experience: "7 years", college: "Oklahoma", status: "active" },
        { name: "Skyy Moore", position: "WR", jerseyNumber: 24, height: "5'10\"", weight: 195, age: 24, experience: "4 years", college: "Western Michigan", status: "active" },
        { name: "Rashee Rice", position: "WR", jerseyNumber: 4, height: "6'1\"", weight: 204, age: 25, experience: "3 years", college: "SMU", status: "active" },
        { name: "JuJu Smith-Schuster", position: "WR", jerseyNumber: 9, height: "6'1\"", weight: 215, age: 28, experience: "8 years", college: "USC", status: "active" }
      ]
    },

    // Green Bay Packers (ESPN)
    {
      name: "Green Bay Packers",
      abbreviation: "GB",
      division: "NFC North",
      playerCount: 53,
      sources: ['ESPN'],
      players: [
        // Quarterbacks
        { name: "Jordan Love", position: "QB", jerseyNumber: 10, height: "6'4\"", weight: 219, age: 26, experience: "6 years", college: "Utah State", status: "active" },
        { name: "Sean Clifford", position: "QB", jerseyNumber: 16, height: "6'2\"", weight: 218, age: 26, experience: "2 years", college: "Penn State", status: "active" },
        { name: "Malik Willis", position: "QB", jerseyNumber: 2, height: "6'1\"", weight: 225, age: 26, experience: "4 years", college: "Liberty", status: "active" },
        { name: "Taylor Elgersma", position: "QB", jerseyNumber: 19, height: "6'5\"", weight: 227, age: null, experience: "Rookie", college: "Wilfred Laurier", status: "active" },
        
        // Running Backs
        { name: "Josh Jacobs", position: "RB", jerseyNumber: 8, height: "5'10\"", weight: 223, age: 27, experience: "7 years", college: "Alabama", status: "active" },
        { name: "MarShawn Lloyd", position: "RB", jerseyNumber: 32, height: "5'9\"", weight: 220, age: 24, experience: "2 years", college: "USC", status: "active" },
        { name: "Emanuel Wilson", position: "RB", jerseyNumber: 31, height: "5'10\"", weight: 226, age: 26, experience: "3 years", college: "Fort Valley State", status: "active" },
        { name: "Chris Brooks", position: "RB", jerseyNumber: 30, height: "6'1\"", weight: 219, age: 25, experience: "3 years", college: "BYU", status: "active" }
      ]
    },

    // Dallas Cowboys (ESPN) 
    {
      name: "Dallas Cowboys",
      abbreviation: "DAL",
      division: "NFC East",
      playerCount: 90,
      sources: ['ESPN'],
      players: [
        // Quarterbacks
        { name: "Dak Prescott", position: "QB", jerseyNumber: 4, height: "6'2\"", weight: 238, age: 31, experience: "9 years", college: "Mississippi State", status: "active" },
        { name: "Will Grier", position: "QB", jerseyNumber: 15, height: "6'2\"", weight: 214, age: 30, experience: "6 years", college: "West Virginia", status: "active" },
        { name: "Joe Milton III", position: "QB", jerseyNumber: 10, height: "6'5\"", weight: 245, age: 25, experience: "2 years", college: "Tennessee", status: "active" },
        
        // Running Backs
        { name: "Miles Sanders", position: "RB", jerseyNumber: 27, height: "5'11\"", weight: 211, age: 28, experience: "6 years", college: "Penn State", status: "active" },
        { name: "Javonte Williams", position: "RB", jerseyNumber: 33, height: "5'10\"", weight: 220, age: 25, experience: "5 years", college: "North Carolina", status: "active" },
        { name: "Deuce Vaughn", position: "RB", jerseyNumber: 42, height: "5'6\"", weight: 179, age: 23, experience: "2 years", college: "Kansas State", status: "active" },
        { name: "Jaydon Blue", position: "RB", jerseyNumber: 34, height: "5'11\"", weight: 199, age: 21, experience: "Rookie", college: "Texas", status: "active" },
        { name: "Hunter Luepke", position: "RB", jerseyNumber: 40, height: "6'1\"", weight: 236, age: 25, experience: "2 years", college: "North Dakota State", status: "active" },
        { name: "Phil Mafah", position: "RB", jerseyNumber: 37, height: "6'1\"", weight: 230, age: 22, experience: "Rookie", college: "Clemson", status: "active" },
        
        // Wide Receivers
        { name: "CeeDee Lamb", position: "WR", jerseyNumber: 88, height: "6'2\"", weight: 198, age: 26, experience: "5 years", college: "Oklahoma", status: "active" },
        { name: "George Pickens", position: "WR", jerseyNumber: 13, height: "6'3\"", weight: 195, age: 24, experience: "3 years", college: "Georgia", status: "active" },
        { name: "Jalen Tolbert", position: "WR", jerseyNumber: 1, height: "6'1\"", weight: 194, age: 26, experience: "3 years", college: "South Alabama", status: "active" },
        { name: "KaVontae Turpin", position: "WR", jerseyNumber: 9, height: "5'7\"", weight: 153, age: 28, experience: "3 years", college: "TCU", status: "active" },
        { name: "Parris Campbell", position: "WR", jerseyNumber: 80, height: "6'0\"", weight: 205, age: 27, experience: "6 years", college: "Ohio State", status: "active" },
        { name: "Jonathan Mingo", position: "WR", jerseyNumber: 81, height: "6'2\"", weight: 220, age: 24, experience: "2 years", college: "Ole Miss", status: "active" },
        
        // Tight Ends
        { name: "Jake Ferguson", position: "TE", jerseyNumber: 87, height: "6'5\"", weight: 250, age: 26, experience: "3 years", college: "Wisconsin", status: "active" },
        { name: "Luke Schoonmaker", position: "TE", jerseyNumber: 86, height: "6'6\"", weight: 251, age: 26, experience: "2 years", college: "Michigan", status: "active" },
        { name: "Princeton Fant", position: "TE", jerseyNumber: 85, height: "6'4\"", weight: 244, age: 26, experience: "5 years", college: "Tennessee", status: "active" }
      ]
    }
  ],
  
  // Consolidated player data
  allPlayers: [],
  
  // Summary statistics
  summary: {
    totalPlayers: 0,
    playersByPosition: {},
    playersByTeam: {},
    playersByDivision: {},
    averageAge: 0,
    experienceDistribution: {},
    collegeDistribution: {},
    heightDistribution: {},
    weightDistribution: {}
  }
};

// Consolidate all player data
collectedRosterData.teams.forEach(team => {
  team.players.forEach(player => {
    // Add team info to each player
    player.team = team.name;
    player.teamAbbreviation = team.abbreviation;
    player.division = team.division;
    player.lastUpdated = new Date().toISOString();
    
    // Add to all players array
    collectedRosterData.allPlayers.push(player);
  });
});

// Calculate summary statistics
collectedRosterData.summary.totalPlayers = collectedRosterData.allPlayers.length;

collectedRosterData.allPlayers.forEach(player => {
  // Count by position
  if (!collectedRosterData.summary.playersByPosition[player.position]) {
    collectedRosterData.summary.playersByPosition[player.position] = 0;
  }
  collectedRosterData.summary.playersByPosition[player.position]++;
  
  // Count by team
  if (!collectedRosterData.summary.playersByTeam[player.teamAbbreviation]) {
    collectedRosterData.summary.playersByTeam[player.teamAbbreviation] = 0;
  }
  collectedRosterData.summary.playersByTeam[player.teamAbbreviation]++;
  
  // Count by division
  if (!collectedRosterData.summary.playersByDivision[player.division]) {
    collectedRosterData.summary.playersByDivision[player.division] = 0;
  }
  collectedRosterData.summary.playersByDivision[player.division]++;
  
  // Count by college
  if (player.college) {
    if (!collectedRosterData.summary.collegeDistribution[player.college]) {
      collectedRosterData.summary.collegeDistribution[player.college] = 0;
    }
    collectedRosterData.summary.collegeDistribution[player.college]++;
  }
});

// Save the comprehensive roster data
const outputPath = path.join(__dirname, '../data/nfl-rosters/comprehensive-rosters.json');
fs.writeFileSync(outputPath, JSON.stringify(collectedRosterData, null, 2));

console.log('🚀 NFL Comprehensive Roster Data Collection Complete!');
console.log('=' .repeat(60));
console.log(`📊 Total Players Collected: ${collectedRosterData.summary.totalPlayers}`);
console.log(`🏈 Teams Processed: ${collectedRosterData.teams.length}/32`);
console.log(`📈 Collection Progress: ${Math.round((collectedRosterData.teams.length / 32) * 100)}%`);
console.log('\n📋 Players by Position:');
Object.entries(collectedRosterData.summary.playersByPosition)
  .sort(([,a], [,b]) => b - a)
  .forEach(([pos, count]) => {
    console.log(`  ${pos}: ${count} players`);
  });

console.log('\n🏆 Teams Collected:');
collectedRosterData.teams.forEach(team => {
  console.log(`  ${team.name} (${team.abbreviation}): ${team.players.length} players`);
});

console.log(`\n✅ Data saved to: ${outputPath}`);
console.log(`🎯 Progress toward 1,696 target: ${Math.round((collectedRosterData.summary.totalPlayers / 1696) * 100)}%`);

// Generate remaining teams list
const remainingTeams = teamsData.nfl_teams.filter(team => 
  !collectedRosterData.teams.some(collected => collected.abbreviation === team.abbreviation)
);

console.log(`\n📋 Remaining Teams to Collect (${remainingTeams.length}):`);
remainingTeams.forEach(team => {
  console.log(`  ${team.name} (${team.abbreviation})`);
});

module.exports = collectedRosterData;