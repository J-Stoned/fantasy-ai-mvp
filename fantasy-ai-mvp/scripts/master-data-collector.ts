#!/usr/bin/env tsx

/**
 * 🚀 FANTASY.AI MASTER DATA COLLECTOR
 * Orchestrates massive data collection across all sports leagues
 * Target: 15,000+ players from every major league globally
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

interface SportConfig {
  sport: string;
  leagues: string[];
  expectedPlayers: number;
  sources: DataSource[];
}

interface DataSource {
  type: 'mcp' | 'puppeteer' | 'firecrawl' | 'api';
  name: string;
  endpoint?: string;
  selectors?: Record<string, string>;
}

interface CollectionResult {
  sport: string;
  league: string;
  playersCollected: number;
  source: string;
  timestamp: Date;
  errors?: string[];
}

class MasterDataCollector {
  private results: CollectionResult[] = [];
  private startTime = Date.now();
  
  // Define all sports and their data sources
  private sportsConfig: SportConfig[] = [
    {
      sport: 'NFL',
      leagues: ['NFL'],
      expectedPlayers: 2000,
      sources: [
        { type: 'mcp', name: 'espn-fantasy', endpoint: 'nfl/players' },
        { type: 'puppeteer', name: 'nfl.com', endpoint: 'https://www.nfl.com/players/' },
        { type: 'firecrawl', name: 'fantasypros', endpoint: 'https://www.fantasypros.com/nfl/players/' },
        { type: 'api', name: 'yahoo-fantasy', endpoint: 'nfl/players' }
      ]
    },
    {
      sport: 'NBA', 
      leagues: ['NBA', 'G-League'],
      expectedPlayers: 600,
      sources: [
        { type: 'mcp', name: 'espn-fantasy', endpoint: 'nba/players' },
        { type: 'puppeteer', name: 'basketball-reference', endpoint: 'https://www.basketball-reference.com/players/' },
        { type: 'firecrawl', name: 'yahoo-sports', endpoint: 'https://sports.yahoo.com/nba/players/' }
      ]
    },
    {
      sport: 'MLB',
      leagues: ['MLB', 'AAA', 'AA'],
      expectedPlayers: 1500,
      sources: [
        { type: 'mcp', name: 'espn-fantasy', endpoint: 'mlb/players' },
        { type: 'puppeteer', name: 'baseball-reference', endpoint: 'https://www.baseball-reference.com/players/' },
        { type: 'firecrawl', name: 'fangraphs', endpoint: 'https://www.fangraphs.com/players' }
      ]
    },
    {
      sport: 'NHL',
      leagues: ['NHL', 'AHL'],
      expectedPlayers: 1000,
      sources: [
        { type: 'puppeteer', name: 'nhl.com', endpoint: 'https://www.nhl.com/players/' },
        { type: 'firecrawl', name: 'tsn.ca', endpoint: 'https://www.tsn.ca/nhl/players' },
        { type: 'api', name: 'yahoo-fantasy', endpoint: 'nhl/players' }
      ]
    },
    {
      sport: 'Soccer',
      leagues: ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'MLS'],
      expectedPlayers: 5000,
      sources: [
        { type: 'firecrawl', name: 'fantasy.premierleague', endpoint: 'https://fantasy.premierleague.com/api/bootstrap-static/' },
        { type: 'puppeteer', name: 'transfermarkt', endpoint: 'https://www.transfermarkt.com/players' },
        { type: 'api', name: 'football-data', endpoint: 'competitions/players' }
      ]
    },
    {
      sport: 'NASCAR',
      leagues: ['Cup Series', 'Xfinity', 'Truck Series'],
      expectedPlayers: 200,
      sources: [
        { type: 'puppeteer', name: 'nascar.com', endpoint: 'https://www.nascar.com/drivers/' },
        { type: 'firecrawl', name: 'racing-reference', endpoint: 'https://www.racing-reference.info/drivers/' }
      ]
    },
    {
      sport: 'F1',
      leagues: ['Formula 1', 'Formula 2'],
      expectedPlayers: 50,
      sources: [
        { type: 'puppeteer', name: 'formula1.com', endpoint: 'https://www.formula1.com/en/drivers.html' },
        { type: 'api', name: 'ergast-f1', endpoint: 'http://ergast.com/api/f1/drivers.json' }
      ]
    },
    {
      sport: 'Golf',
      leagues: ['PGA Tour', 'European Tour', 'LPGA'],
      expectedPlayers: 500,
      sources: [
        { type: 'puppeteer', name: 'pgatour.com', endpoint: 'https://www.pgatour.com/players.html' },
        { type: 'firecrawl', name: 'espn-golf', endpoint: 'https://www.espn.com/golf/players' }
      ]
    },
    {
      sport: 'Tennis',
      leagues: ['ATP', 'WTA'],
      expectedPlayers: 1000,
      sources: [
        { type: 'puppeteer', name: 'atptour.com', endpoint: 'https://www.atptour.com/en/players' },
        { type: 'firecrawl', name: 'wtatennis.com', endpoint: 'https://www.wtatennis.com/players' }
      ]
    },
    {
      sport: 'Cricket',
      leagues: ['IPL', 'BBL', 'CPL', 'PSL'],
      expectedPlayers: 800,
      sources: [
        { type: 'puppeteer', name: 'espncricinfo', endpoint: 'https://www.espncricinfo.com/players' },
        { type: 'firecrawl', name: 'iplt20.com', endpoint: 'https://www.iplt20.com/players' }
      ]
    }
  ];

  async collectAllData(): Promise<void> {
    console.log('🚀 FANTASY.AI MASTER DATA COLLECTOR INITIATED');
    console.log('📊 Target: 15,000+ players across all major sports leagues\n');

    try {
      // Create data directory structure
      await this.setupDataDirectories();

      // Collect data for each sport in parallel batches
      const batchSize = 3; // Process 3 sports at a time to avoid overwhelming
      for (let i = 0; i < this.sportsConfig.length; i += batchSize) {
        const batch = this.sportsConfig.slice(i, i + batchSize);
        await Promise.all(batch.map(sport => this.collectSportData(sport)));
      }

      // Process and store all collected data
      await this.processAndStoreData();

      // Generate comprehensive report
      await this.generateReport();

      console.log('\n✅ DATA COLLECTION COMPLETE!');
      console.log(`⏱️  Total time: ${Math.round((Date.now() - this.startTime) / 1000)}s`);

    } catch (error) {
      console.error('❌ Master collection failed:', error);
      throw error;
    }
  }

  private async setupDataDirectories(): Promise<void> {
    const dirs = [
      'data/collected',
      'data/processed',
      'data/reports',
      ...this.sportsConfig.map(s => `data/collected/${s.sport.toLowerCase()}`)
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(process.cwd(), dir), { recursive: true });
    }
  }

  private async collectSportData(config: SportConfig): Promise<void> {
    console.log(`\n🏆 Collecting ${config.sport} data (Target: ${config.expectedPlayers} players)`);

    for (const source of config.sources) {
      try {
        let playersCollected = 0;

        switch (source.type) {
          case 'mcp':
            playersCollected = await this.collectViaMCP(config.sport, source);
            break;
          case 'puppeteer':
            playersCollected = await this.collectViaPuppeteer(config.sport, source);
            break;
          case 'firecrawl':
            playersCollected = await this.collectViaFirecrawl(config.sport, source);
            break;
          case 'api':
            playersCollected = await this.collectViaAPI(config.sport, source);
            break;
        }

        this.results.push({
          sport: config.sport,
          league: config.leagues[0],
          playersCollected,
          source: source.name,
          timestamp: new Date()
        });

        console.log(`  ✅ ${source.name}: ${playersCollected} players collected`);

      } catch (error) {
        console.error(`  ❌ ${source.name} failed:`, error);
        this.results.push({
          sport: config.sport,
          league: config.leagues[0],
          playersCollected: 0,
          source: source.name,
          timestamp: new Date(),
          errors: [error.message]
        });
      }
    }
  }

  private async collectViaMCP(sport: string, source: DataSource): Promise<number> {
    // Use ESPN MCP server for supported sports
    const espnScript = `
      const espnData = await fetch('${source.endpoint}');
      return espnData.json();
    `;

    try {
      const { stdout } = await execAsync(`npm run mcp:espn -- --collect ${sport.toLowerCase()}`);
      const data = JSON.parse(stdout);
      
      // Save raw data
      await fs.writeFile(
        path.join(process.cwd(), `data/collected/${sport.toLowerCase()}/${source.name}-${Date.now()}.json`),
        JSON.stringify(data, null, 2)
      );

      return Array.isArray(data) ? data.length : data.players?.length || 0;
    } catch (error) {
      console.error(`MCP collection error for ${sport}:`, error);
      return 0;
    }
  }

  private async collectViaPuppeteer(sport: string, source: DataSource): Promise<number> {
    // Use Puppeteer MCP for web scraping
    const puppeteerScript = `
import puppeteer from 'puppeteer';

async function scrapePlayerData() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.goto('${source.endpoint}', { waitUntil: 'networkidle2' });
  
  // Generic player extraction logic
  const players = await page.evaluate(() => {
    const playerElements = document.querySelectorAll('.player-row, .player-card, tr[data-player], [class*="player"]');
    return Array.from(playerElements).map(el => ({
      name: el.querySelector('[class*="name"], .player-name, td:nth-child(1)')?.textContent?.trim(),
      team: el.querySelector('[class*="team"], .team-name, td:nth-child(2)')?.textContent?.trim(),
      position: el.querySelector('[class*="position"], .player-position, td:nth-child(3)')?.textContent?.trim(),
    })).filter(p => p.name);
  });
  
  await browser.close();
  return players;
}

scrapePlayerData().then(console.log).catch(console.error);
    `;

    try {
      const scriptPath = path.join(process.cwd(), `data/temp-puppeteer-${Date.now()}.js`);
      await fs.writeFile(scriptPath, puppeteerScript);
      
      const { stdout } = await execAsync(`node ${scriptPath}`);
      await fs.unlink(scriptPath);
      
      const players = JSON.parse(stdout);
      
      // Save collected data
      await fs.writeFile(
        path.join(process.cwd(), `data/collected/${sport.toLowerCase()}/${source.name}-${Date.now()}.json`),
        JSON.stringify(players, null, 2)
      );

      return players.length;
    } catch (error) {
      console.error(`Puppeteer collection error for ${sport}:`, error);
      return 0;
    }
  }

  private async collectViaFirecrawl(sport: string, source: DataSource): Promise<number> {
    // Use Firecrawl MCP for comprehensive web crawling
    try {
      const { stdout } = await execAsync(`
        curl -X POST http://localhost:3002/v0/crawl \\
          -H "Content-Type: application/json" \\
          -d '{"url": "${source.endpoint}", "maxDepth": 2, "includeSubdomains": true}'
      `);

      const crawlData = JSON.parse(stdout);
      const players = this.extractPlayersFromCrawl(crawlData);

      await fs.writeFile(
        path.join(process.cwd(), `data/collected/${sport.toLowerCase()}/${source.name}-${Date.now()}.json`),
        JSON.stringify(players, null, 2)
      );

      return players.length;
    } catch (error) {
      console.error(`Firecrawl collection error for ${sport}:`, error);
      return 0;
    }
  }

  private async collectViaAPI(sport: string, source: DataSource): Promise<number> {
    // Direct API calls for supported endpoints
    try {
      const response = await fetch(source.endpoint);
      const data = await response.json();

      await fs.writeFile(
        path.join(process.cwd(), `data/collected/${sport.toLowerCase()}/${source.name}-${Date.now()}.json`),
        JSON.stringify(data, null, 2)
      );

      return Array.isArray(data) ? data.length : data.players?.length || 0;
    } catch (error) {
      console.error(`API collection error for ${sport}:`, error);
      return 0;
    }
  }

  private extractPlayersFromCrawl(crawlData: any): any[] {
    // Extract player data from crawled content
    const players = [];
    
    if (crawlData.documents) {
      for (const doc of crawlData.documents) {
        // Parse HTML content for player information
        const playerMatches = doc.content.match(/player-name"?>([^<]+)</g) || [];
        playerMatches.forEach(match => {
          const name = match.replace(/.*?>/, '');
          if (name && name.length > 2) {
            players.push({ name, source: doc.url });
          }
        });
      }
    }

    return players;
  }

  private async processAndStoreData(): Promise<void> {
    console.log('\n🔄 Processing and storing collected data...');

    // Read all collected files
    const collectedDir = path.join(process.cwd(), 'data/collected');
    const sports = await fs.readdir(collectedDir);

    let totalPlayersStored = 0;

    for (const sport of sports) {
      const sportDir = path.join(collectedDir, sport);
      const files = await fs.readdir(sportDir);

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        try {
          const data = JSON.parse(await fs.readFile(path.join(sportDir, file), 'utf8'));
          const players = Array.isArray(data) ? data : data.players || data.data || [];

          // Store in database
          for (const player of players) {
            if (!player.name) continue;

            await prisma.player.upsert({
              where: { 
                id: `${sport}_${player.id || player.name.replace(/\s+/g, '_').toLowerCase()}`
              },
              update: {
                name: player.name,
                position: player.position || 'Unknown',
                team: player.team || 'Free Agent',
                stats: player.stats || {},
                projections: player.projections || {},
                lastUpdated: new Date()
              },
              create: {
                id: `${sport}_${player.id || player.name.replace(/\s+/g, '_').toLowerCase()}`,
                externalId: player.id?.toString() || player.name.replace(/\s+/g, '_').toLowerCase(),
                name: player.name,
                position: player.position || 'Unknown',
                team: player.team || 'Free Agent',
                leagueId: 'global_league',
                stats: player.stats || {},
                projections: player.projections || {},
                isActive: true,
                sport: sport.toUpperCase()
              }
            });

            totalPlayersStored++;
          }

        } catch (error) {
          console.error(`Error processing ${file}:`, error);
        }
      }
    }

    console.log(`✅ Stored ${totalPlayersStored} players in database`);
  }

  private async generateReport(): Promise<void> {
    const report = {
      summary: {
        totalPlayersCollected: this.results.reduce((sum, r) => sum + r.playersCollected, 0),
        totalSports: new Set(this.results.map(r => r.sport)).size,
        collectionDuration: Math.round((Date.now() - this.startTime) / 1000),
        timestamp: new Date()
      },
      sportBreakdown: this.sportsConfig.map(config => ({
        sport: config.sport,
        targetPlayers: config.expectedPlayers,
        actualPlayers: this.results
          .filter(r => r.sport === config.sport)
          .reduce((sum, r) => sum + r.playersCollected, 0),
        sources: this.results.filter(r => r.sport === config.sport)
      })),
      errors: this.results.filter(r => r.errors && r.errors.length > 0)
    };

    await fs.writeFile(
      path.join(process.cwd(), 'data/reports/master-collection-report.json'),
      JSON.stringify(report, null, 2)
    );

    // Print summary
    console.log('\n📊 COLLECTION SUMMARY');
    console.log('====================');
    console.log(`Total Players: ${report.summary.totalPlayersCollected.toLocaleString()}`);
    console.log(`Sports Covered: ${report.summary.totalSports}`);
    console.log(`Time Taken: ${report.summary.collectionDuration}s\n`);

    // Sport breakdown
    report.sportBreakdown.forEach(sport => {
      const percentage = Math.round((sport.actualPlayers / sport.targetPlayers) * 100);
      console.log(`${sport.sport}: ${sport.actualPlayers}/${sport.targetPlayers} (${percentage}%)`);
    });
  }
}

// Main execution
async function main() {
  const collector = new MasterDataCollector();
  
  try {
    await collector.collectAllData();
    
    // Verify final count
    const totalPlayers = await prisma.player.count();
    console.log(`\n🎉 FINAL DATABASE COUNT: ${totalPlayers.toLocaleString()} players!`);
    
    if (totalPlayers >= 15000) {
      console.log('🏆 TARGET ACHIEVED: 15,000+ players collected!');
    } else {
      console.log(`📈 Progress: ${Math.round((totalPlayers / 15000) * 100)}% of target`);
    }

  } catch (error) {
    console.error('❌ Master collection failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { MasterDataCollector };