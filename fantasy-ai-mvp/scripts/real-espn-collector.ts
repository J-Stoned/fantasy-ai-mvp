#!/usr/bin/env tsx

/**
 * 🏈 REAL ESPN API DATA COLLECTOR
 * Collects ACTUAL live data from ESPN's free public APIs
 * No API key required!
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

// REAL ESPN API ENDPOINTS (100% FREE, NO KEY NEEDED!)
const ESPN_ENDPOINTS = {
  NFL: {
    scoreboard: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
    news: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news',
    teams: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams',
    standings: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/standings',
  },
  NBA: {
    scoreboard: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
    news: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news',
    teams: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams',
    standings: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/standings',
  },
  MLB: {
    scoreboard: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
    news: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/news',
    teams: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams',
    standings: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/standings',
  },
  NHL: {
    scoreboard: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
    news: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/news',
    teams: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams',
    standings: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/standings',
  }
};

interface ESPNData {
  league: string;
  dataType: string;
  timestamp: string;
  data: any;
}

async function fetchESPNData(league: string, dataType: string, url: string): Promise<ESPNData | null> {
  try {
    console.log(`📡 Fetching ${league} ${dataType} from ESPN...`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ Error fetching ${league} ${dataType}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    console.log(`✅ Successfully fetched ${league} ${dataType}`);
    
    return {
      league,
      dataType,
      timestamp: new Date().toISOString(),
      data
    };
    
  } catch (error) {
    console.error(`❌ Error fetching ${league} ${dataType}:`, error);
    return null;
  }
}

async function processESPNData(data: ESPNData): Promise<any> {
  const processed: any = {
    source: 'ESPN',
    league: data.league,
    dataType: data.dataType,
    timestamp: data.timestamp,
    stats: {}
  };
  
  // Process based on data type
  switch (data.dataType) {
    case 'scoreboard':
      if (data.data.events) {
        processed.games = data.data.events.map((event: any) => ({
          id: event.id,
          name: event.name,
          date: event.date,
          status: event.status?.type?.name,
          homeTeam: {
            id: event.competitions?.[0]?.competitors?.[0]?.id,
            name: event.competitions?.[0]?.competitors?.[0]?.team?.name,
            abbreviation: event.competitions?.[0]?.competitors?.[0]?.team?.abbreviation,
            score: event.competitions?.[0]?.competitors?.[0]?.score,
            record: event.competitions?.[0]?.competitors?.[0]?.records?.[0]?.summary
          },
          awayTeam: {
            id: event.competitions?.[0]?.competitors?.[1]?.id,
            name: event.competitions?.[0]?.competitors?.[1]?.team?.name,
            abbreviation: event.competitions?.[0]?.competitors?.[1]?.team?.abbreviation,
            score: event.competitions?.[0]?.competitors?.[1]?.score,
            record: event.competitions?.[0]?.competitors?.[1]?.records?.[0]?.summary
          }
        }));
        processed.stats.totalGames = data.data.events.length;
      }
      break;
      
    case 'news':
      if (data.data.articles) {
        processed.articles = data.data.articles.map((article: any) => ({
          headline: article.headline,
          description: article.description,
          published: article.published,
          images: article.images,
          links: article.links?.web?.href,
          categories: article.categories?.map((cat: any) => cat.description)
        }));
        processed.stats.totalArticles = data.data.articles.length;
      }
      break;
      
    case 'teams':
      if (data.data.sports?.[0]?.leagues?.[0]?.teams) {
        processed.teams = data.data.sports[0].leagues[0].teams.map((team: any) => ({
          id: team.team.id,
          name: team.team.name,
          abbreviation: team.team.abbreviation,
          displayName: team.team.displayName,
          location: team.team.location,
          logo: team.team.logos?.[0]?.href
        }));
        processed.stats.totalTeams = processed.teams.length;
      }
      break;
      
    case 'standings':
      if (data.data.children) {
        processed.standings = data.data.children.map((group: any) => ({
          name: group.name,
          teams: group.standings?.entries?.map((entry: any) => ({
            team: entry.team.displayName,
            abbreviation: entry.team.abbreviation,
            logo: entry.team.logos?.[0]?.href,
            stats: entry.stats?.map((stat: any) => ({
              name: stat.name,
              displayName: stat.displayName,
              value: stat.displayValue
            }))
          }))
        }));
      }
      break;
  }
  
  return processed;
}

async function collectAllESPNData() {
  console.log('🏈 Starting REAL ESPN Data Collection!');
  console.log('=====================================\n');
  
  const timestamp = Date.now();
  const allData: any[] = [];
  
  // Collect data for all leagues
  for (const [league, endpoints] of Object.entries(ESPN_ENDPOINTS)) {
    console.log(`\n📊 Collecting ${league} data...`);
    
    for (const [dataType, url] of Object.entries(endpoints)) {
      const data = await fetchESPNData(league, dataType, url);
      
      if (data) {
        const processed = await processESPNData(data);
        allData.push(processed);
        
        // Save individual file
        const filename = `ESPN_${league}_${dataType}_REAL_${timestamp}.json`;
        const filepath = path.join(DATA_DIR, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(processed, null, 2));
        console.log(`💾 Saved: ${filename}`);
      }
      
      // Be nice to ESPN's servers
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Save combined data
  const combinedFilename = `ESPN_ALL_REAL_DATA_${timestamp}.json`;
  const combinedPath = path.join(DATA_DIR, combinedFilename);
  
  const combined = {
    source: 'ESPN Real API',
    timestamp: new Date().toISOString(),
    totalDataPoints: allData.length,
    data: allData,
    stats: {
      totalGames: allData.reduce((sum, d) => sum + (d.stats?.totalGames || 0), 0),
      totalArticles: allData.reduce((sum, d) => sum + (d.stats?.totalArticles || 0), 0),
      totalTeams: allData.reduce((sum, d) => sum + (d.stats?.totalTeams || 0), 0),
      leagues: ['NFL', 'NBA', 'MLB', 'NHL']
    }
  };
  
  fs.writeFileSync(combinedPath, JSON.stringify(combined, null, 2));
  
  console.log('\n✅ ESPN REAL DATA COLLECTION COMPLETE!');
  console.log('=====================================');
  console.log(`📊 Total data points: ${combined.stats.totalGames} games`);
  console.log(`📰 Total articles: ${combined.stats.totalArticles}`);
  console.log(`👥 Total teams: ${combined.stats.totalTeams}`);
  console.log(`💾 Files saved: ${allData.length + 1}`);
  
  return combined;
}

// Continuous collection mode
async function startContinuousCollection() {
  console.log('♾️ Starting Continuous ESPN Real Data Collection');
  console.log('Collecting every 5 minutes...\n');
  
  // Initial collection
  await collectAllESPNData();
  
  // Schedule every 5 minutes (ESPN data doesn't change that fast)
  const interval = setInterval(async () => {
    console.log(`\n🔄 [${new Date().toLocaleTimeString()}] Running collection cycle...`);
    await collectAllESPNData();
  }, 5 * 60 * 1000); // 5 minutes
  
  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Stopping ESPN data collection...');
    clearInterval(interval);
    console.log('✅ ESPN collector stopped');
    process.exit(0);
  });
}

// Execute based on command line args
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--continuous')) {
    startContinuousCollection().catch(console.error);
  } else {
    // Single run
    collectAllESPNData()
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

export { collectAllESPNData, startContinuousCollection };