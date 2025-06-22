#!/usr/bin/env node

/**
 * NFL Roster Database Import Script
 * Converts collected roster data into database-ready format
 * Creates SQL, CSV, and JSON import files
 */

const fs = require('fs');
const path = require('path');

// Load the collected roster data
const rosterData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/nfl-rosters/batch-collection-results.json'), 'utf8'));

// Create database schema for NFL players
const createPlayersTableSQL = `
CREATE TABLE IF NOT EXISTS nfl_players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(10) NOT NULL,
    jersey_number INTEGER,
    height VARCHAR(10),
    weight INTEGER,
    age INTEGER,
    experience VARCHAR(20),
    college VARCHAR(255),
    team_name VARCHAR(255) NOT NULL,
    team_abbreviation VARCHAR(5) NOT NULL,
    division VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    source VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_players_team ON nfl_players(team_abbreviation);
CREATE INDEX IF NOT EXISTS idx_players_position ON nfl_players(position);
CREATE INDEX IF NOT EXISTS idx_players_name ON nfl_players(name);
`;

// Create teams table SQL
const createTeamsTableSQL = `
CREATE TABLE IF NOT EXISTS nfl_teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(5) NOT NULL UNIQUE,
    division VARCHAR(20) NOT NULL,
    conference VARCHAR(5) NOT NULL,
    player_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

// Generate SQL INSERT statements
let playersInsertSQL = 'INSERT INTO nfl_players (name, position, jersey_number, height, weight, age, experience, college, team_name, team_abbreviation, division, status, source) VALUES\n';
const playerValues = [];

rosterData.teams.forEach(team => {
    team.players.forEach(player => {
        const values = [
            `'${player.name.replace(/'/g, "''")}'`, // Escape single quotes
            `'${player.position}'`,
            player.jerseyNumber || 'NULL',
            player.height ? `'${player.height}'` : 'NULL',
            player.weight || 'NULL',
            player.age || 'NULL',
            `'${player.experience}'`,
            player.college ? `'${player.college.replace(/'/g, "''")}'` : 'NULL',
            `'${team.name.replace(/'/g, "''")}'`,
            `'${team.abbreviation}'`,
            `'${team.division}'`,
            `'${player.status}'`,
            `'ESPN'`
        ];
        playerValues.push(`(${values.join(', ')})`);
    });
});

playersInsertSQL += playerValues.join(',\n') + ';';

// Generate teams INSERT statements
let teamsInsertSQL = 'INSERT INTO nfl_teams (name, abbreviation, division, conference, player_count) VALUES\n';
const teamValues = rosterData.teams.map(team => {
    const conference = team.division.startsWith('AFC') ? 'AFC' : 'NFC';
    return `('${team.name.replace(/'/g, "''")}', '${team.abbreviation}', '${team.division}', '${conference}', ${team.playerCount})`;
});

teamsInsertSQL += teamValues.join(',\n') + ';';

// Create complete SQL file
const completeSQL = `
-- NFL Roster Database Schema and Data
-- Generated: ${new Date().toISOString()}
-- Total Players: ${rosterData.summary.totalPlayers}
-- Total Teams: ${rosterData.teamsCollected}

${createTeamsTableSQL}

${createPlayersTableSQL}

-- Insert team data
${teamsInsertSQL}

-- Insert player data
${playersInsertSQL}

-- Create additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_players_team_position ON nfl_players(team_abbreviation, position);
CREATE INDEX IF NOT EXISTS idx_players_experience ON nfl_players(experience);
CREATE INDEX IF NOT EXISTS idx_players_college ON nfl_players(college);

-- Update team player counts
UPDATE nfl_teams SET player_count = (
    SELECT COUNT(*) FROM nfl_players WHERE nfl_players.team_abbreviation = nfl_teams.abbreviation
);

-- Query examples:
-- SELECT * FROM nfl_players WHERE position = 'QB' ORDER BY team_abbreviation;
-- SELECT team_name, COUNT(*) as player_count FROM nfl_players GROUP BY team_name ORDER BY player_count DESC;
-- SELECT position, COUNT(*) as count FROM nfl_players GROUP BY position ORDER BY count DESC;
`;

// Save SQL file
const sqlFilePath = path.join(__dirname, '../data/nfl-rosters/nfl-roster-import.sql');
fs.writeFileSync(sqlFilePath, completeSQL);

// Create CSV export for players
const csvHeader = 'name,position,jersey_number,height,weight,age,experience,college,team_name,team_abbreviation,division,status\n';
let csvContent = csvHeader;

rosterData.teams.forEach(team => {
    team.players.forEach(player => {
        const csvRow = [
            `"${player.name}"`,
            player.position,
            player.jerseyNumber || '',
            `"${player.height || ''}"`,
            player.weight || '',
            player.age || '',
            `"${player.experience}"`,
            `"${player.college || ''}"`,
            `"${team.name}"`,
            team.abbreviation,
            `"${team.division}"`,
            player.status
        ].join(',');
        csvContent += csvRow + '\n';
    });
});

const csvFilePath = path.join(__dirname, '../data/nfl-rosters/nfl-players.csv');
fs.writeFileSync(csvFilePath, csvContent);

// Create simplified JSON export for API use
const apiExport = {
    metadata: {
        exportDate: new Date().toISOString(),
        totalPlayers: rosterData.summary.totalPlayers,
        totalTeams: rosterData.teamsCollected,
        version: '1.0.0'
    },
    teams: rosterData.teams.map(team => ({
        name: team.name,
        abbreviation: team.abbreviation,
        division: team.division,
        conference: team.division.startsWith('AFC') ? 'AFC' : 'NFC',
        playerCount: team.playerCount
    })),
    players: []
};

// Flatten all players for API export
rosterData.teams.forEach(team => {
    team.players.forEach(player => {
        apiExport.players.push({
            id: `${team.abbreviation}-${player.jerseyNumber || Math.random().toString(36).substr(2, 9)}`,
            name: player.name,
            position: player.position,
            jerseyNumber: player.jerseyNumber,
            height: player.height,
            weight: player.weight,
            age: player.age,
            experience: player.experience,
            college: player.college,
            team: {
                name: team.name,
                abbreviation: team.abbreviation,
                division: team.division,
                conference: team.division.startsWith('AFC') ? 'AFC' : 'NFC'
            },
            status: player.status,
            lastUpdated: new Date().toISOString()
        });
    });
});

const apiFilePath = path.join(__dirname, '../data/nfl-rosters/nfl-api-export.json');
fs.writeFileSync(apiFilePath, JSON.stringify(apiExport, null, 2));

// Create Prisma seed file
const prismaSeed = `
// Prisma seed file for NFL roster data
// Run with: npx prisma db seed

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const teamsData = ${JSON.stringify(rosterData.teams.map(team => ({
    name: team.name,
    abbreviation: team.abbreviation,
    division: team.division,
    conference: team.division.startsWith('AFC') ? 'AFC' : 'NFC',
    playerCount: team.playerCount
})), null, 2)};

const playersData = [
${rosterData.teams.map(team => 
    team.players.map(player => `  {
    name: "${player.name.replace(/"/g, '\\"')}",
    position: "${player.position}",
    jerseyNumber: ${player.jerseyNumber || 'null'},
    height: ${player.height ? `"${player.height}"` : 'null'},
    weight: ${player.weight || 'null'},
    age: ${player.age || 'null'},
    experience: "${player.experience}",
    college: ${player.college ? `"${player.college.replace(/"/g, '\\"')}"` : 'null'},
    teamAbbreviation: "${team.abbreviation}",
    status: "${player.status}"
  }`).join(',\n')
).join(',\n')}
];

async function main() {
  console.log('🚀 Seeding NFL roster data...');
  
  // Create teams
  for (const team of teamsData) {
    await prisma.nflTeam.create({
      data: team
    });
  }
  
  // Create players
  for (const player of playersData) {
    await prisma.nflPlayer.create({
      data: player
    });
  }
  
  console.log('✅ NFL roster data seeded successfully!');
  console.log(\`📊 Created \${teamsData.length} teams and \${playersData.length} players\`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;

const seedFilePath = path.join(__dirname, '../prisma/seed-nfl-rosters.ts');
fs.writeFileSync(seedFilePath, prismaSeed);

// Generate statistics and summary
const teamsCollected = rosterData.teams.length;
const totalPlayers = rosterData.summary.totalPlayers;

const statistics = {
    collectionSummary: {
        totalPlayers: totalPlayers,
        totalTeams: teamsCollected,
        targetProgress: Math.round((totalPlayers / 1696) * 100),
        averagePlayersPerTeam: Math.round(totalPlayers / teamsCollected)
    },
    playersByPosition: rosterData.summary.playersByPosition,
    playersByDivision: rosterData.summary.playersByDivision,
    topColleges: {},
    experienceDistribution: {},
    filenames: {
        sql: 'nfl-roster-import.sql',
        csv: 'nfl-players.csv',
        apiJson: 'nfl-api-export.json',
        prismaSeed: '../prisma/seed-nfl-rosters.ts'
    }
};

// Calculate top colleges
const collegeCount = {};
rosterData.teams.forEach(team => {
    team.players.forEach(player => {
        if (player.college) {
            collegeCount[player.college] = (collegeCount[player.college] || 0) + 1;
        }
    });
});

statistics.topColleges = Object.entries(collegeCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .reduce((obj, [college, count]) => {
        obj[college] = count;
        return obj;
    }, {});

// Calculate experience distribution
const expCount = {};
rosterData.teams.forEach(team => {
    team.players.forEach(player => {
        const exp = player.experience;
        expCount[exp] = (expCount[exp] || 0) + 1;
    });
});

statistics.experienceDistribution = expCount;

const statsFilePath = path.join(__dirname, '../data/nfl-rosters/collection-statistics.json');
fs.writeFileSync(statsFilePath, JSON.stringify(statistics, null, 2));

console.log('🚀 NFL Roster Database Import Files Created!');
console.log('='.repeat(60));
console.log(`📊 Total Players: ${rosterData.summary.totalPlayers}`);
console.log(`🏈 Total Teams: ${teamsCollected}/32`);
console.log(`📈 Progress: ${Math.round((totalPlayers / 1696) * 100)}% toward 1,696 target`);
console.log(`⚖️  Average Players/Team: ${Math.round(totalPlayers / teamsCollected)}`);

console.log('\n📋 Players by Position:');
Object.entries(rosterData.summary.playersByPosition)
    .sort(([,a], [,b]) => b - a)
    .forEach(([pos, count]) => {
        console.log(`  ${pos}: ${count} players`);
    });

console.log('\n🏆 Top Colleges:');
Object.entries(statistics.topColleges)
    .slice(0, 5)
    .forEach(([college, count]) => {
        console.log(`  ${college}: ${count} players`);
    });

console.log('\n📁 Files Created:');
console.log(`  SQL Import: ${sqlFilePath}`);
console.log(`  CSV Export: ${csvFilePath}`);
console.log(`  API JSON: ${apiFilePath}`);
console.log(`  Prisma Seed: ${seedFilePath}`);
console.log(`  Statistics: ${statsFilePath}`);

console.log('\n🎯 Next Steps:');
console.log('  1. Import SQL file into PostgreSQL database');
console.log('  2. Use CSV file for spreadsheet analysis');
console.log('  3. Use API JSON for frontend integration');
console.log('  4. Run Prisma seed for development database');
console.log(`  5. Continue collecting remaining ${32 - teamsCollected} teams`);

module.exports = {
    statistics,
    rosterData,
    createPlayersTableSQL,
    createTeamsTableSQL
};