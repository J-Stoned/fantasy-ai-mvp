#!/usr/bin/env node

/**
 * Fantasy.AI MVP - NFL Player Data Collector
 * 
 * Comprehensive script to collect real NFL player data from multiple sources:
 * - All 32 NFL team official websites 
 * - ESPN complete player database
 * - NFL.com full roster listings
 * - Yahoo Sports complete player listings
 * - CBS Sports full team rosters
 * - Practice squad players, injured reserve, free agents
 * 
 * Target: 2,000+ real NFL players with complete stats and information
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// NFL Teams data
const NFL_TEAMS = [
  { name: 'Arizona Cardinals', abbr: 'ARI', city: 'Arizona' },
  { name: 'Atlanta Falcons', abbr: 'ATL', city: 'Atlanta' },
  { name: 'Baltimore Ravens', abbr: 'BAL', city: 'Baltimore' },
  { name: 'Buffalo Bills', abbr: 'BUF', city: 'Buffalo' },
  { name: 'Carolina Panthers', abbr: 'CAR', city: 'Carolina' },
  { name: 'Chicago Bears', abbr: 'CHI', city: 'Chicago' },
  { name: 'Cincinnati Bengals', abbr: 'CIN', city: 'Cincinnati' },
  { name: 'Cleveland Browns', abbr: 'CLE', city: 'Cleveland' },
  { name: 'Dallas Cowboys', abbr: 'DAL', city: 'Dallas' },
  { name: 'Denver Broncos', abbr: 'DEN', city: 'Denver' },
  { name: 'Detroit Lions', abbr: 'DET', city: 'Detroit' },
  { name: 'Green Bay Packers', abbr: 'GB', city: 'Green Bay' },
  { name: 'Houston Texans', abbr: 'HOU', city: 'Houston' },
  { name: 'Indianapolis Colts', abbr: 'IND', city: 'Indianapolis' },
  { name: 'Jacksonville Jaguars', abbr: 'JAX', city: 'Jacksonville' },
  { name: 'Kansas City Chiefs', abbr: 'KC', city: 'Kansas City' },
  { name: 'Las Vegas Raiders', abbr: 'LV', city: 'Las Vegas' },
  { name: 'Los Angeles Chargers', abbr: 'LAC', city: 'Los Angeles' },
  { name: 'Los Angeles Rams', abbr: 'LAR', city: 'Los Angeles' },
  { name: 'Miami Dolphins', abbr: 'MIA', city: 'Miami' },
  { name: 'Minnesota Vikings', abbr: 'MIN', city: 'Minnesota' },
  { name: 'New England Patriots', abbr: 'NE', city: 'New England' },
  { name: 'New Orleans Saints', abbr: 'NO', city: 'New Orleans' },
  { name: 'New York Giants', abbr: 'NYG', city: 'New York' },
  { name: 'New York Jets', abbr: 'NYJ', city: 'New York' },
  { name: 'Philadelphia Eagles', abbr: 'PHI', city: 'Philadelphia' },
  { name: 'Pittsburgh Steelers', abbr: 'PIT', city: 'Pittsburgh' },
  { name: 'San Francisco 49ers', abbr: 'SF', city: 'San Francisco' },
  { name: 'Seattle Seahawks', abbr: 'SEA', city: 'Seattle' },
  { name: 'Tampa Bay Buccaneers', abbr: 'TB', city: 'Tampa Bay' },
  { name: 'Tennessee Titans', abbr: 'TEN', city: 'Tennessee' },
  { name: 'Washington Commanders', abbr: 'WAS', city: 'Washington' }
];

// Data collection configuration
const COLLECTION_CONFIG = {
  maxRetries: 3,
  retryDelay: 2000,
  requestDelay: 1000,
  timeout: 30000,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
};

class NFLPlayerCollector {
  constructor() {
    this.players = new Map(); // Use Map to avoid duplicates
    this.stats = {
      total: 0,
      byTeam: {},
      byPosition: {},
      bySource: {},
      errors: []
    };
  }

  // Utility function to add delay between requests
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility function to safely make HTTP requests
  async makeRequest(url, options = {}) {
    const config = {
      timeout: COLLECTION_CONFIG.timeout,
      headers: {
        'User-Agent': COLLECTION_CONFIG.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        ...options.headers
      },
      ...options
    };

    for (let attempt = 1; attempt <= COLLECTION_CONFIG.maxRetries; attempt++) {
      try {
        console.log(`🌐 Fetching: ${url} (attempt ${attempt})`);
        const response = await axios.get(url, config);
        await this.delay(COLLECTION_CONFIG.requestDelay);
        return response;
      } catch (error) {
        console.error(`❌ Request failed (attempt ${attempt}): ${error.message}`);
        if (attempt === COLLECTION_CONFIG.maxRetries) {
          this.stats.errors.push({ url, error: error.message });
          throw error;
        }
        await this.delay(COLLECTION_CONFIG.retryDelay * attempt);
      }
    }
  }

  // Add player to collection with deduplication
  addPlayer(player, source) {
    const key = `${player.name}_${player.team}_${player.position}`.toLowerCase().replace(/\s+/g, '_');
    
    if (this.players.has(key)) {
      // Update existing player with new data
      const existing = this.players.get(key);
      this.players.set(key, { ...existing, ...player, sources: [...(existing.sources || []), source] });
    } else {
      // Add new player
      this.players.set(key, { ...player, sources: [source] });
      this.stats.total++;
    }

    // Update statistics
    this.stats.byTeam[player.team] = (this.stats.byTeam[player.team] || 0) + 1;
    this.stats.byPosition[player.position] = (this.stats.byPosition[player.position] || 0) + 1;
    this.stats.bySource[source] = (this.stats.bySource[source] || 0) + 1;
  }

  // Collect players from ESPN
  async collectFromESPN() {
    console.log('🏈 Collecting players from ESPN...');
    
    for (const team of NFL_TEAMS) {
      try {
        // ESPN roster URL
        const url = `https://www.espn.com/nfl/team/roster/_/name/${team.abbr.toLowerCase()}`;
        const response = await this.makeRequest(url);
        const $ = cheerio.load(response.data);

        // Parse ESPN roster table
        $('.Table__TR').each((index, element) => {
          const $row = $(element);
          const cells = $row.find('td');
          
          if (cells.length >= 6) {
            const name = $(cells[1]).text().trim();
            const position = $(cells[2]).text().trim();
            const age = $(cells[3]).text().trim();
            const height = $(cells[4]).text().trim();
            const weight = $(cells[5]).text().trim();
            
            if (name && position && name !== 'Name') {
              this.addPlayer({
                name,
                position,
                team: team.abbr,
                teamName: team.name,
                age: age ? parseInt(age) : null,
                height,
                weight: weight ? parseInt(weight) : null,
                source: 'ESPN'
              }, 'ESPN');
            }
          }
        });

        console.log(`✅ ESPN ${team.name}: ${this.stats.byTeam[team.abbr] || 0} players`);
      } catch (error) {
        console.error(`❌ Failed to collect from ESPN for ${team.name}: ${error.message}`);
      }
    }
  }

  // Collect players from NFL.com
  async collectFromNFL() {
    console.log('🏈 Collecting players from NFL.com...');
    
    for (const team of NFL_TEAMS) {
      try {
        // NFL.com roster API
        const url = `https://www.nfl.com/teams/${team.abbr.toLowerCase()}/roster`;
        const response = await this.makeRequest(url);
        const $ = cheerio.load(response.data);

        // Parse NFL.com roster
        $('.nfl-c-roster__row').each((index, element) => {
          const $row = $(element);
          const name = $row.find('.nfl-c-roster__player-name').text().trim();
          const position = $row.find('.nfl-c-roster__player-position').text().trim();
          const number = $row.find('.nfl-c-roster__player-number').text().trim();
          const height = $row.find('.nfl-c-roster__player-height').text().trim();
          const weight = $row.find('.nfl-c-roster__player-weight').text().trim();
          const age = $row.find('.nfl-c-roster__player-age').text().trim();
          const experience = $row.find('.nfl-c-roster__player-experience').text().trim();
          const college = $row.find('.nfl-c-roster__player-college').text().trim();

          if (name && position) {
            this.addPlayer({
              name,
              position,
              team: team.abbr,
              teamName: team.name,
              number: number ? parseInt(number) : null,
              height,
              weight: weight ? parseInt(weight) : null,
              age: age ? parseInt(age) : null,
              experience: experience || null,
              college: college || null,
              source: 'NFL.com'
            }, 'NFL.com');
          }
        });

        console.log(`✅ NFL.com ${team.name}: ${this.stats.byTeam[team.abbr] || 0} players`);
      } catch (error) {
        console.error(`❌ Failed to collect from NFL.com for ${team.name}: ${error.message}`);
      }
    }
  }

  // Collect players from Yahoo Sports
  async collectFromYahoo() {
    console.log('🏈 Collecting players from Yahoo Sports...');
    
    for (const team of NFL_TEAMS) {
      try {
        // Yahoo Sports roster URL
        const url = `https://sports.yahoo.com/nfl/teams/${team.abbr.toLowerCase()}/roster/`;
        const response = await this.makeRequest(url);
        const $ = cheerio.load(response.data);

        // Parse Yahoo roster table
        $('table tbody tr').each((index, element) => {
          const $row = $(element);
          const cells = $row.find('td');
          
          if (cells.length >= 5) {
            const nameCell = $(cells[0]).text().trim();
            const position = $(cells[1]).text().trim();
            const height = $(cells[2]).text().trim();
            const weight = $(cells[3]).text().trim();
            const age = $(cells[4]).text().trim();
            const college = $(cells[5]) ? $(cells[5]).text().trim() : null;

            // Extract name from Yahoo format
            const name = nameCell.split('\n')[0].trim();

            if (name && position && name !== 'Player') {
              this.addPlayer({
                name,
                position,
                team: team.abbr,
                teamName: team.name,
                height,
                weight: weight ? parseInt(weight) : null,
                age: age ? parseInt(age) : null,
                college: college || null,
                source: 'Yahoo Sports'
              }, 'Yahoo Sports');
            }
          }
        });

        console.log(`✅ Yahoo Sports ${team.name}: ${this.stats.byTeam[team.abbr] || 0} players`);
      } catch (error) {
        console.error(`❌ Failed to collect from Yahoo Sports for ${team.name}: ${error.message}`);
      }
    }
  }

  // Collect players from CBS Sports
  async collectFromCBS() {
    console.log('🏈 Collecting players from CBS Sports...');
    
    for (const team of NFL_TEAMS) {
      try {
        // CBS Sports roster URL
        const url = `https://www.cbssports.com/nfl/teams/${team.abbr}/roster/`;
        const response = await this.makeRequest(url);
        const $ = cheerio.load(response.data);

        // Parse CBS roster table
        $('.TableBase-table tbody tr').each((index, element) => {
          const $row = $(element);
          const cells = $row.find('td');
          
          if (cells.length >= 6) {
            const name = $(cells[0]).text().trim();
            const position = $(cells[1]).text().trim();
            const number = $(cells[2]).text().trim();
            const height = $(cells[3]).text().trim();
            const weight = $(cells[4]).text().trim();
            const age = $(cells[5]).text().trim();
            const experience = $(cells[6]) ? $(cells[6]).text().trim() : null;
            const college = $(cells[7]) ? $(cells[7]).text().trim() : null;

            if (name && position && name !== 'Player') {
              this.addPlayer({
                name,
                position,
                team: team.abbr,
                teamName: team.name,
                number: number ? parseInt(number) : null,
                height,
                weight: weight ? parseInt(weight) : null,
                age: age ? parseInt(age) : null,
                experience: experience || null,
                college: college || null,
                source: 'CBS Sports'
              }, 'CBS Sports');
            }
          }
        });

        console.log(`✅ CBS Sports ${team.name}: ${this.stats.byTeam[team.abbr] || 0} players`);
      } catch (error) {
        console.error(`❌ Failed to collect from CBS Sports for ${team.name}: ${error.message}`);
      }
    }
  }

  // Collect additional players from free agent lists and practice squads
  async collectFreeAgentsAndPracticeSquad() {
    console.log('🏈 Collecting free agents and practice squad players...');
    
    try {
      // ESPN Free Agents
      const freeAgentsUrl = 'https://www.espn.com/nfl/freeagents';
      const response = await this.makeRequest(freeAgentsUrl);
      const $ = cheerio.load(response.data);

      $('.Table__TR').each((index, element) => {
        const $row = $(element);
        const cells = $row.find('td');
        
        if (cells.length >= 4) {
          const name = $(cells[0]).text().trim();
          const position = $(cells[1]).text().trim();
          const age = $(cells[2]).text().trim();
          const lastTeam = $(cells[3]).text().trim();

          if (name && position && name !== 'Player') {
            this.addPlayer({
              name,
              position,
              team: 'FA', // Free Agent
              teamName: 'Free Agent',
              lastTeam,
              age: age ? parseInt(age) : null,
              status: 'Free Agent',
              source: 'ESPN Free Agents'
            }, 'ESPN Free Agents');
          }
        }
      });

      console.log(`✅ Free Agents collected: ${this.stats.bySource['ESPN Free Agents'] || 0} players`);
    } catch (error) {
      console.error(`❌ Failed to collect free agents: ${error.message}`);
    }
  }

  // Generate comprehensive SQL insert statements for PostgreSQL
  generateSQLInserts() {
    const players = Array.from(this.players.values());
    const sqlStatements = [];

    // Create a sample league for the data
    sqlStatements.push(`
-- Insert sample league for NFL data
INSERT INTO "League" (id, "userId", provider, "providerId", name, season, sport, "isActive", settings, "createdAt", "updatedAt")
VALUES ('nfl-2024-league', 'system-user', 'ESPN', 'nfl-2024', 'NFL 2024 Season', '2024', 'FOOTBALL', true, '{}', NOW(), NOW())
ON CONFLICT (provider, "providerId") DO NOTHING;
`);

    // Generate player inserts
    players.forEach((player, index) => {
      const playerId = `nfl-player-${index + 1}`;
      const externalId = `${player.name.replace(/\s+/g, '-').toLowerCase()}-${player.team.toLowerCase()}`;
      
      const playerData = {
        id: playerId,
        externalId: externalId,
        name: player.name.replace(/'/g, "''"), // Escape single quotes
        position: player.position || 'Unknown',
        team: player.team || 'Unknown',
        leagueId: 'nfl-2024-league',
        stats: JSON.stringify({
          height: player.height || null,
          weight: player.weight || null,
          age: player.age || null,
          number: player.number || null,
          experience: player.experience || null,
          college: player.college || null,
          status: player.status || 'Active',
          lastTeam: player.lastTeam || null
        }).replace(/'/g, "''"),
        injuryStatus: player.status === 'Free Agent' ? 'Available' : null,
        createdAt: 'NOW()',
        updatedAt: 'NOW()'
      };

      sqlStatements.push(`
INSERT INTO "Player" (id, "externalId", name, position, team, "leagueId", stats, "injuryStatus", "createdAt", "updatedAt")
VALUES ('${playerData.id}', '${playerData.externalId}', '${playerData.name}', '${playerData.position}', '${playerData.team}', '${playerData.leagueId}', '${playerData.stats}', ${playerData.injuryStatus ? `'${playerData.injuryStatus}'` : 'NULL'}, ${playerData.createdAt}, ${playerData.updatedAt})
ON CONFLICT ("externalId", "leagueId") DO UPDATE SET
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  team = EXCLUDED.team,
  stats = EXCLUDED.stats,
  "injuryStatus" = EXCLUDED."injuryStatus",
  "updatedAt" = NOW();
`);
    });

    return sqlStatements.join('\n');
  }

  // Generate JSON export
  generateJSONExport() {
    const players = Array.from(this.players.values());
    return {
      metadata: {
        collectionDate: new Date().toISOString(),
        totalPlayers: this.stats.total,
        sources: Object.keys(this.stats.bySource),
        statistics: this.stats
      },
      players: players.map((player, index) => ({
        id: `nfl-player-${index + 1}`,
        externalId: `${player.name.replace(/\s+/g, '-').toLowerCase()}-${player.team.toLowerCase()}`,
        ...player
      }))
    };
  }

  // Main collection method
  async collectAllPlayers() {
    console.log('🚀 Starting comprehensive NFL player data collection...');
    console.log(`📊 Target: 2,000+ players from all 32 NFL teams\n`);

    const startTime = Date.now();

    try {
      // Collect from all sources
      await this.collectFromESPN();
      await this.collectFromNFL();
      await this.collectFromYahoo();
      await this.collectFromCBS();
      await this.collectFreeAgentsAndPracticeSquad();

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      // Generate final statistics
      console.log('\n🎉 Collection completed!');
      console.log(`⏱️  Total time: ${duration.toFixed(2)} seconds`);
      console.log(`👥 Total players collected: ${this.stats.total}`);
      console.log(`📈 Average per team: ${(this.stats.total / 32).toFixed(1)}`);
      console.log(`🔄 Sources used: ${Object.keys(this.stats.bySource).length}`);
      console.log(`❌ Errors encountered: ${this.stats.errors.length}`);

      // Display statistics by team
      console.log('\n📊 Players by team:');
      Object.entries(this.stats.byTeam)
        .sort(([,a], [,b]) => b - a)
        .forEach(([team, count]) => {
          console.log(`   ${team}: ${count} players`);
        });

      // Display statistics by position
      console.log('\n🏈 Players by position:');
      Object.entries(this.stats.byPosition)
        .sort(([,a], [,b]) => b - a)
        .forEach(([position, count]) => {
          console.log(`   ${position}: ${count} players`);
        });

      // Display statistics by source
      console.log('\n🌐 Players by source:');
      Object.entries(this.stats.bySource).forEach(([source, count]) => {
        console.log(`   ${source}: ${count} players`);
      });

      return {
        success: true,
        stats: this.stats,
        players: Array.from(this.players.values())
      };

    } catch (error) {
      console.error('💥 Collection failed:', error.message);
      return {
        success: false,
        error: error.message,
        stats: this.stats
      };
    }
  }

  // Save data to files
  async saveData() {
    const outputDir = path.join(__dirname, '..', 'data', 'nfl-players');
    
    try {
      // Create output directory
      await fs.mkdir(outputDir, { recursive: true });

      // Save JSON export
      const jsonData = this.generateJSONExport();
      await fs.writeFile(
        path.join(outputDir, 'nfl-players-complete.json'),
        JSON.stringify(jsonData, null, 2)
      );

      // Save SQL insert statements
      const sqlData = this.generateSQLInserts();
      await fs.writeFile(
        path.join(outputDir, 'nfl-players-insert.sql'),
        sqlData
      );

      // Save CSV for easy import
      const csvData = this.generateCSVExport();
      await fs.writeFile(
        path.join(outputDir, 'nfl-players.csv'),
        csvData
      );

      // Save statistics
      await fs.writeFile(
        path.join(outputDir, 'collection-stats.json'),
        JSON.stringify(this.stats, null, 2)
      );

      console.log('\n💾 Data saved to:');
      console.log(`   📄 JSON: ${path.join(outputDir, 'nfl-players-complete.json')}`);
      console.log(`   🗄️  SQL: ${path.join(outputDir, 'nfl-players-insert.sql')}`);
      console.log(`   📊 CSV: ${path.join(outputDir, 'nfl-players.csv')}`);
      console.log(`   📈 Stats: ${path.join(outputDir, 'collection-stats.json')}`);

    } catch (error) {
      console.error('💥 Failed to save data:', error.message);
    }
  }

  // Generate CSV export
  generateCSVExport() {
    const players = Array.from(this.players.values());
    const headers = [
      'id', 'externalId', 'name', 'position', 'team', 'teamName',
      'number', 'height', 'weight', 'age', 'experience', 'college',
      'status', 'lastTeam', 'sources'
    ];

    const csvRows = [headers.join(',')];
    
    players.forEach((player, index) => {
      const row = [
        `nfl-player-${index + 1}`,
        `${player.name.replace(/\s+/g, '-').toLowerCase()}-${player.team.toLowerCase()}`,
        `"${player.name || ''}"`,
        `"${player.position || ''}"`,
        `"${player.team || ''}"`,
        `"${player.teamName || ''}"`,
        player.number || '',
        `"${player.height || ''}"`,
        player.weight || '',
        player.age || '',
        `"${player.experience || ''}"`,
        `"${player.college || ''}"`,
        `"${player.status || ''}"`,
        `"${player.lastTeam || ''}"`,
        `"${(player.sources || []).join(', ')}"`
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }
}

// Command line interface
async function main() {
  const collector = new NFLPlayerCollector();
  
  console.log('🏈 Fantasy.AI MVP - NFL Player Data Collector');
  console.log('=' .repeat(50));
  
  // Collect all player data
  const result = await collector.collectAllPlayers();
  
  if (result.success) {
    // Save the collected data
    await collector.saveData();
    
    console.log('\n✅ Collection completed successfully!');
    console.log(`📊 Final count: ${result.stats.total} players`);
    
    if (result.stats.total >= 2000) {
      console.log('🎯 Target achieved: 2,000+ players collected!');
    } else {
      console.log(`🎯 Progress: ${result.stats.total}/2000 players (${((result.stats.total/2000)*100).toFixed(1)}%)`);
    }
  } else {
    console.error('❌ Collection failed:', result.error);
    process.exit(1);
  }
}

// Export for use as module
module.exports = NFLPlayerCollector;

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}