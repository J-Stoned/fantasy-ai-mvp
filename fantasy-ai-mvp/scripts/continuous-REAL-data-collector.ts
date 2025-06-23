#!/usr/bin/env tsx

/**
 * 🔄 CONTINUOUS REAL DATA COLLECTOR
 * Collects 100% REAL sports data every 30 seconds!
 * No more mock data!
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const DATA_DIR = path.join(__dirname, '../data/ultimate-free');

// Ensure data directories exist
['api', 'news', 'official'].forEach(dir => {
  const fullPath = path.join(DATA_DIR, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// REAL API ENDPOINTS
const REAL_ENDPOINTS = {
  ESPN: {
    NFL: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
    NBA: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
    MLB: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
    NHL: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard'
  },
  NEWS: {
    ESPN: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news',
    NBA: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news'
  },
  TEAMS: {
    NFL: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams',
    NBA: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams',
    MLB: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams',
    NHL: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams'
  }
};

// Weather API (if key is available)
const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const WEATHER_CITIES = ['New York', 'Los Angeles', 'Chicago', 'Dallas', 'Miami', 'Seattle', 'Boston', 'Denver'];

// Stats tracking
let totalCollections = 0;
let totalDataPoints = 0;

async function fetchRealData(url: string, source: string): Promise<any> {
  try {
    console.log(`📡 Fetching: ${source}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ ${source}: Success`);
    return data;
    
  } catch (error) {
    console.error(`❌ ${source}: Failed`);
    return null;
  }
}

async function collectRealData() {
  const timestamp = Date.now();
  console.log(`\n[${new Date().toLocaleTimeString()}] 🚀 Starting REAL data collection...`);
  
  let collectedData = 0;
  
  // Collect ESPN Scoreboards
  for (const [league, url] of Object.entries(REAL_ENDPOINTS.ESPN)) {
    const data = await fetchRealData(url, `ESPN ${league}`);
    
    if (data) {
      const filename = `ESPN_${league}_REAL_${timestamp}.json`;
      const filepath = path.join(DATA_DIR, 'api', filename);
      
      const processedData = {
        source: 'ESPN Real API',
        league,
        timestamp: new Date().toISOString(),
        games: data.events?.map((event: any) => ({
          id: event.id,
          name: event.name,
          date: event.date,
          status: event.status?.type?.name,
          homeTeam: {
            name: event.competitions?.[0]?.competitors?.[0]?.team?.name,
            score: event.competitions?.[0]?.competitors?.[0]?.score
          },
          awayTeam: {
            name: event.competitions?.[0]?.competitors?.[1]?.team?.name,
            score: event.competitions?.[0]?.competitors?.[1]?.score
          }
        })) || []
      };
      
      fs.writeFileSync(filepath, JSON.stringify(processedData, null, 2));
      collectedData += processedData.games.length;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
  }
  
  // Collect News
  for (const [source, url] of Object.entries(REAL_ENDPOINTS.NEWS)) {
    const data = await fetchRealData(url, `${source} News`);
    
    if (data && data.articles) {
      const filename = `${source}_News_REAL_${timestamp}.json`;
      const filepath = path.join(DATA_DIR, 'news', filename);
      
      const processedNews = {
        source: `${source} Real News`,
        timestamp: new Date().toISOString(),
        articles: data.articles.map((article: any) => ({
          headline: article.headline,
          description: article.description,
          published: article.published,
          url: article.links?.web?.href
        }))
      };
      
      fs.writeFileSync(filepath, JSON.stringify(processedNews, null, 2));
      collectedData += processedNews.articles.length;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Collect Teams
  for (const [league, url] of Object.entries(REAL_ENDPOINTS.TEAMS)) {
    const data = await fetchRealData(url, `${league} Teams`);
    
    if (data && data.sports?.[0]?.leagues?.[0]?.teams) {
      const filename = `${league}_Teams_REAL_${timestamp}.json`;
      const filepath = path.join(DATA_DIR, 'official', filename);
      
      const teams = data.sports[0].leagues[0].teams.map((team: any) => ({
        id: team.team.id,
        name: team.team.displayName,
        abbreviation: team.team.abbreviation,
        location: team.team.location,
        logo: team.team.logos?.[0]?.href
      }));
      
      fs.writeFileSync(filepath, JSON.stringify({
        source: `${league} Official Teams`,
        timestamp: new Date().toISOString(),
        teams
      }, null, 2));
      
      collectedData += teams.length;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Collect Weather (if API key available)
  if (WEATHER_API_KEY) {
    for (const city of WEATHER_CITIES.slice(0, 3)) { // Limit to 3 cities
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}`;
      const data = await fetchRealData(weatherUrl, `Weather ${city}`);
      
      if (data) {
        const filename = `Weather_${city}_REAL_${timestamp}.json`;
        const filepath = path.join(DATA_DIR, 'api', filename);
        
        fs.writeFileSync(filepath, JSON.stringify({
          source: 'OpenWeatherMap',
          city,
          timestamp: new Date().toISOString(),
          weather: data
        }, null, 2));
        
        collectedData++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  totalCollections++;
  totalDataPoints += collectedData;
  
  console.log(`📊 Collected ${collectedData} REAL data points`);
  console.log(`📈 Total collections: ${totalCollections}, Total data points: ${totalDataPoints}`);
  
  // Generate performance report
  generateReport(timestamp, collectedData);
}

function generateReport(timestamp: number, dataPoints: number) {
  const report = {
    timestamp: new Date(timestamp).toISOString(),
    collection: {
      startTime: new Date(timestamp).toISOString(),
      endTime: new Date().toISOString(),
      duration: Date.now() - timestamp,
      dataPoints,
      totalCollections,
      totalDataPoints,
      sources: [
        'ESPN Real API',
        'ESPN News API',
        'ESPN Teams API',
        WEATHER_API_KEY ? 'OpenWeatherMap API' : null
      ].filter(Boolean)
    },
    status: 'success',
    dataType: 'REAL'
  };
  
  const reportPath = path.join(DATA_DIR, 'reports', 'real-data-report.json');
  const reportsDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
}

// Stop the old mock data collector if running
async function stopMockCollector() {
  try {
    const { execSync } = require('child_process');
    
    // Find and kill the mock data collector process
    const result = execSync('ps aux | grep continuous-data-collector | grep -v grep | grep -v REAL', { encoding: 'utf-8' });
    
    if (result) {
      console.log('🛑 Stopping old mock data collector...');
      const lines = result.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const pid = line.split(/\s+/)[1];
        if (pid) {
          try {
            process.kill(parseInt(pid), 'SIGTERM');
            console.log(`✅ Stopped mock collector (PID: ${pid})`);
          } catch (e) {
            // Process might have already stopped
          }
        }
      }
    }
  } catch (error) {
    // No mock collector running
  }
}

// Main execution
async function main() {
  console.log('🚀 CONTINUOUS REAL DATA COLLECTOR');
  console.log('=================================');
  console.log('Collecting 100% REAL sports data every 30 seconds...');
  console.log('No more mock data!\n');
  
  // Stop mock collector if running
  await stopMockCollector();
  
  // Check for API keys
  if (WEATHER_API_KEY) {
    console.log('✅ Weather API key found');
  } else {
    console.log('⚠️  No weather API key - get one at https://openweathermap.org/api');
  }
  
  console.log('\nPress Ctrl+C to stop\n');
  
  // Initial collection
  await collectRealData();
  
  // Schedule collections every 30 seconds
  const interval = setInterval(collectRealData, 30000);
  
  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Stopping REAL data collection...');
    clearInterval(interval);
    
    // Final report
    const finalReport = {
      timestamp: new Date().toISOString(),
      status: 'stopped',
      totalCollections,
      totalDataPoints,
      averageDataPointsPerCollection: Math.round(totalDataPoints / totalCollections)
    };
    
    fs.writeFileSync(
      path.join(DATA_DIR, 'reports', 'final-real-collection-report.json'),
      JSON.stringify(finalReport, null, 2)
    );
    
    console.log('✅ REAL data collection stopped');
    console.log(`📊 Collected ${totalDataPoints} real data points in ${totalCollections} collections`);
    process.exit(0);
  });
}

// Start the collector
if (require.main === module) {
  main().catch(console.error);
}

export { collectRealData };