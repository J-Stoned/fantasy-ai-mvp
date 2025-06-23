#!/usr/bin/env tsx

/**
 * 🚀 FANTASY.AI REAL DATA ENGINE
 * The ultimate data collection system combining:
 * - Real ESPN APIs
 * - Player stats collection
 * - MCP web scraping
 * - Database updates
 * - Continuous monitoring
 * 
 * THIS IS THE MASTER SCRIPT!
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const prisma = new PrismaClient();
const DATA_DIR = path.join(__dirname, '../data/ultimate-free');

// Ensure all directories exist
['api', 'news', 'stats', 'scraped', 'processed'].forEach(dir => {
  const fullPath = path.join(DATA_DIR, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Configuration for all data sources
const DATA_SOURCES = {
  // Working APIs (no key needed)
  FREE_APIS: {
    ESPN: {
      scoreboard: (sport: string) => `https://site.api.espn.com/apis/site/v2/sports/${sport}/scoreboard`,
      news: (sport: string) => `https://site.api.espn.com/apis/site/v2/sports/${sport}/news`,
      teams: (sport: string) => `https://site.api.espn.com/apis/site/v2/sports/${sport}/teams`,
      leaders: (sport: string, category: string) => `https://site.api.espn.com/apis/site/v2/sports/${sport}/leaders?category=${category}`
    }
  },
  
  // APIs that need keys (check .env)
  KEY_APIS: {
    weather: process.env.OPENWEATHER_API_KEY ? {
      // One Call API 3.0 - Much better for game weather!
      oneCall: (lat: number, lon: number) => `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=imperial`,
      // Fallback to current weather by city
      current: (city: string) => `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPENWEATHER_API_KEY}&units=imperial`
    } : null,
    odds: process.env.ODDS_API_KEY ? {
      sports: `https://api.the-odds-api.com/v4/sports?apiKey=${process.env.ODDS_API_KEY}`,
      odds: (sport: string) => `https://api.the-odds-api.com/v4/sports/${sport}/odds?apiKey=${process.env.ODDS_API_KEY}`
    } : null,
    news: process.env.NEWS_API_KEY ? {
      sports: `https://newsapi.org/v2/everything?q=NFL+NBA+MLB+NHL&apiKey=${process.env.NEWS_API_KEY}`
    } : null
  },
  
  // Scraping targets (for MCP servers)
  SCRAPING_TARGETS: {
    stats: [
      'https://www.pro-football-reference.com/years/2024/leaders.htm',
      'https://www.basketball-reference.com/leagues/NBA_2024_leaders.html'
    ],
    news: [
      'https://www.espn.com/nfl/',
      'https://www.cbssports.com/nfl/'
    ]
  }
};

// Sports configuration
const SPORTS = {
  football: { code: 'nfl', name: 'NFL' },
  basketball: { code: 'nba', name: 'NBA' },
  baseball: { code: 'mlb', name: 'MLB' },
  hockey: { code: 'nhl', name: 'NHL' }
};

// Master data engine
class FantasyAIRealDataEngine {
  private stats = {
    apisQueried: 0,
    dataPointsCollected: 0,
    playersUpdated: 0,
    errors: 0,
    startTime: Date.now()
  };
  
  async runFullDataCollection() {
    console.log('🚀 FANTASY.AI REAL DATA ENGINE STARTING!');
    console.log('========================================');
    console.log(`📅 ${new Date().toLocaleString()}\n`);
    
    // Check API keys
    this.checkAPIKeys();
    
    // Collect from all sources
    await Promise.allSettled([
      this.collectESPNData(),
      this.collectPlayerStats(),
      this.collectWeatherData(),
      this.collectOddsData(),
      this.collectNewsData()
    ]);
    
    // Update database with collected data
    await this.updateDatabase();
    
    // Generate report
    await this.generateReport();
    
    console.log('\n✅ DATA COLLECTION COMPLETE!');
    this.displayStats();
  }
  
  checkAPIKeys() {
    console.log('🔑 API Key Status:');
    console.log(`  Weather: ${process.env.OPENWEATHER_API_KEY ? '✅ Found' : '❌ Missing'}`);
    console.log(`  Odds: ${process.env.ODDS_API_KEY ? '✅ Found' : '❌ Missing'}`);
    console.log(`  News: ${process.env.NEWS_API_KEY ? '✅ Found' : '❌ Missing'}`);
    console.log();
  }
  
  async collectESPNData() {
    console.log('📡 Collecting ESPN Data...');
    
    for (const [sportName, sport] of Object.entries(SPORTS)) {
      try {
        // Get scoreboard
        const scoreboardUrl = DATA_SOURCES.FREE_APIS.ESPN.scoreboard(`${sportName}/${sport.code}`);
        const scoreboardData = await this.fetchData(scoreboardUrl, `${sport.name} Scoreboard`);
        
        if (scoreboardData) {
          const games = scoreboardData.events || [];
          this.dataPointsCollected += games.length;
          
          // Save data
          this.saveData('api', `ESPN_${sport.name}_Scoreboard`, {
            sport: sport.name,
            games: games.map((game: any) => ({
              id: game.id,
              name: game.name,
              date: game.date,
              status: game.status?.type?.name,
              competitors: game.competitions?.[0]?.competitors?.map((team: any) => ({
                name: team.team?.displayName,
                score: team.score,
                winner: team.winner
              }))
            }))
          });
        }
        
        // Get news
        const newsUrl = DATA_SOURCES.FREE_APIS.ESPN.news(`${sportName}/${sport.code}`);
        const newsData = await this.fetchData(newsUrl, `${sport.name} News`);
        
        if (newsData && newsData.articles) {
          this.dataPointsCollected += newsData.articles.length;
          
          this.saveData('news', `ESPN_${sport.name}_News`, {
            sport: sport.name,
            articles: newsData.articles.slice(0, 10).map((article: any) => ({
              headline: article.headline,
              description: article.description,
              published: article.published
            }))
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        this.stats.errors++;
      }
    }
  }
  
  async collectPlayerStats() {
    console.log('\n📊 Collecting Player Stats...');
    
    // Get NFL passing leaders
    try {
      const leadersUrl = DATA_SOURCES.FREE_APIS.ESPN.leaders('football/nfl', 'passing');
      const leadersData = await this.fetchData(leadersUrl, 'NFL Passing Leaders');
      
      if (leadersData && leadersData.leaders) {
        const leaders = leadersData.leaders.slice(0, 10);
        this.dataPointsCollected += leaders.length;
        
        // Update database with real stats
        for (const leader of leaders) {
          if (leader.athlete) {
            await this.updatePlayerStats(
              leader.athlete.displayName,
              {
                espnId: leader.athlete.id,
                position: leader.athlete.position?.abbreviation,
                team: leader.athlete.team?.abbreviation,
                passingYards: leader.value,
                rank: leader.rank
              }
            );
          }
        }
      }
    } catch (error) {
      this.stats.errors++;
    }
  }
  
  async collectWeatherData() {
    if (!DATA_SOURCES.KEY_APIS.weather) {
      console.log('\n⏭️ Skipping weather (no API key)');
      return;
    }
    
    console.log('\n☁️ Collecting Weather Data...');
    
    // Stadium coordinates for accurate game weather
    const stadiums = [
      { name: 'Arrowhead Stadium', city: 'Kansas City', lat: 39.0489, lon: -94.4839 },
      { name: 'Highmark Stadium', city: 'Buffalo', lat: 42.7738, lon: -78.7870 },
      { name: 'Lincoln Financial Field', city: 'Philadelphia', lat: 39.9012, lon: -75.1675 },
      { name: 'AT&T Stadium', city: 'Dallas', lat: 32.7473, lon: -97.0945 },
      { name: 'Hard Rock Stadium', city: 'Miami', lat: 25.9580, lon: -80.2389 }
    ];
    
    for (const stadium of stadiums) {
      try {
        // Use One Call API 3.0 for comprehensive weather data
        const weatherUrl = DATA_SOURCES.KEY_APIS.weather.oneCall(stadium.lat, stadium.lon);
        const weatherData = await this.fetchData(weatherUrl, `Weather ${stadium.name}`);
        
        if (weatherData) {
          this.dataPointsCollected++;
          
          // One Call API provides much richer data!
          this.saveData('api', `Weather_${stadium.city}`, {
            stadium: stadium.name,
            city: stadium.city,
            coordinates: { lat: stadium.lat, lon: stadium.lon },
            current: {
              temperature: weatherData.current?.temp,
              feelsLike: weatherData.current?.feels_like,
              description: weatherData.current?.weather?.[0]?.description,
              windSpeed: weatherData.current?.wind_speed,
              windGust: weatherData.current?.wind_gust,
              humidity: weatherData.current?.humidity,
              visibility: weatherData.current?.visibility,
              uvi: weatherData.current?.uvi
            },
            gameTime: weatherData.hourly?.[0], // Next hour forecast
            alerts: weatherData.alerts || []
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        this.stats.errors++;
      }
    }
  }
  
  async collectOddsData() {
    if (!DATA_SOURCES.KEY_APIS.odds) {
      console.log('\n⏭️ Skipping odds (no API key)');
      return;
    }
    
    console.log('\n🎲 Collecting Odds Data...');
    
    try {
      const oddsUrl = DATA_SOURCES.KEY_APIS.odds.odds('americanfootball_nfl');
      const oddsData = await this.fetchData(oddsUrl, 'NFL Odds');
      
      if (oddsData && Array.isArray(oddsData)) {
        this.dataPointsCollected += oddsData.length;
        
        this.saveData('api', 'NFL_Odds', {
          games: oddsData.slice(0, 5).map((game: any) => ({
            homeTeam: game.home_team,
            awayTeam: game.away_team,
            commenceTime: game.commence_time,
            bookmakers: game.bookmakers?.slice(0, 2)
          }))
        });
      }
    } catch (error) {
      this.stats.errors++;
    }
  }
  
  async collectNewsData() {
    if (!DATA_SOURCES.KEY_APIS.news) {
      console.log('\n⏭️ Skipping news API (no key)');
      return;
    }
    
    console.log('\n📰 Collecting News Data...');
    
    try {
      const newsUrl = DATA_SOURCES.KEY_APIS.news.sports;
      const newsData = await this.fetchData(newsUrl, 'Sports News');
      
      if (newsData && newsData.articles) {
        this.dataPointsCollected += newsData.articles.length;
        
        this.saveData('news', 'NewsAPI_Sports', {
          totalResults: newsData.totalResults,
          articles: newsData.articles.slice(0, 10).map((article: any) => ({
            title: article.title,
            description: article.description,
            source: article.source?.name,
            publishedAt: article.publishedAt
          }))
        });
      }
    } catch (error) {
      this.stats.errors++;
    }
  }
  
  async fetchData(url: string, label: string): Promise<any> {
    try {
      console.log(`  📡 ${label}...`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      this.stats.apisQueried++;
      const data = await response.json();
      console.log(`  ✅ ${label}: Success`);
      return data;
      
    } catch (error) {
      console.error(`  ❌ ${label}: Failed`);
      this.stats.errors++;
      return null;
    }
  }
  
  saveData(directory: string, filename: string, data: any) {
    const timestamp = Date.now();
    const fullPath = path.join(DATA_DIR, directory, `${filename}_${timestamp}.json`);
    
    fs.writeFileSync(fullPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      source: 'Fantasy.AI Real Data Engine',
      ...data
    }, null, 2));
  }
  
  async updatePlayerStats(playerName: string, stats: any) {
    try {
      const player = await prisma.player.findFirst({
        where: {
          name: {
            contains: playerName.split(' ')[1] // Last name
          }
        }
      });
      
      if (player) {
        await prisma.player.update({
          where: { id: player.id },
          data: {
            name: playerName, // Update to full real name
            team: stats.team || player.team,
            position: stats.position || player.position,
            stats: JSON.stringify({
              ...JSON.parse(player.stats || '{}'),
              ...stats,
              realData: true,
              lastUpdated: new Date().toISOString()
            })
          }
        });
        
        this.stats.playersUpdated++;
      }
    } catch (error) {
      // Continue on error
    }
  }
  
  async updateDatabase() {
    console.log('\n💾 Updating Database...');
    console.log(`  ✅ Updated ${this.stats.playersUpdated} players with real data`);
  }
  
  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.stats.startTime,
      stats: this.stats,
      apiStatus: {
        espn: 'Active',
        weather: process.env.OPENWEATHER_API_KEY ? 'Active' : 'No Key',
        odds: process.env.ODDS_API_KEY ? 'Active' : 'No Key',
        news: process.env.NEWS_API_KEY ? 'Active' : 'No Key'
      }
    };
    
    const reportPath = path.join(DATA_DIR, 'processed', `Engine_Report_${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  }
  
  displayStats() {
    console.log('\n📊 ENGINE STATISTICS:');
    console.log('====================');
    console.log(`⚡ APIs Queried: ${this.stats.apisQueried}`);
    console.log(`📈 Data Points: ${this.stats.dataPointsCollected}`);
    console.log(`👥 Players Updated: ${this.stats.playersUpdated}`);
    console.log(`❌ Errors: ${this.stats.errors}`);
    console.log(`⏱️ Duration: ${((Date.now() - this.stats.startTime) / 1000).toFixed(2)}s`);
  }
}

// Continuous mode runner
async function runContinuousMode() {
  console.log('♾️ CONTINUOUS MODE ACTIVATED');
  console.log('Collecting data every 5 minutes...\n');
  
  const engine = new FantasyAIRealDataEngine();
  
  // Initial run
  await engine.runFullDataCollection();
  
  // Schedule runs
  const interval = setInterval(async () => {
    console.log(`\n\n🔄 [${new Date().toLocaleTimeString()}] Starting new collection cycle...`);
    await engine.runFullDataCollection();
  }, 5 * 60 * 1000); // 5 minutes
  
  // Handle shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n👋 Shutting down data engine...');
    clearInterval(interval);
    await prisma.$disconnect();
    console.log('✅ Engine stopped');
    process.exit(0);
  });
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--continuous')) {
    await runContinuousMode();
  } else {
    // Single run
    const engine = new FantasyAIRealDataEngine();
    await engine.runFullDataCollection();
    await prisma.$disconnect();
  }
}

// Execute
if (require.main === module) {
  main().catch(console.error);
}

export { FantasyAIRealDataEngine };