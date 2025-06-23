#!/usr/bin/env tsx

/**
 * 📊 FANTASY.AI SYSTEM MONITOR
 * Real-time monitoring of all system components
 */

import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';

const DATA_DIR = path.join(__dirname, '../data/ultimate-free');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

async function monitorSystem() {
  console.clear();
  
  console.log(`${colors.bright}${colors.cyan}📊 FANTASY.AI SYSTEM MONITOR${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}`);
  console.log(`⏱️  ${new Date().toLocaleTimeString()}\n`);
  
  // Check data collection
  const dataStats = getDataCollectionStats();
  console.log(`${colors.bright}📡 DATA COLLECTION:${colors.reset}`);
  console.log(`   API Files: ${colors.green}${dataStats.api}${colors.reset}`);
  console.log(`   News Files: ${colors.green}${dataStats.news}${colors.reset}`);
  console.log(`   Official Files: ${colors.green}${dataStats.official}${colors.reset}`);
  console.log(`   Total: ${colors.bright}${colors.green}${dataStats.total}${colors.reset}\n`);
  
  // Check processing status
  const processingReport = getProcessingReport();
  if (processingReport) {
    console.log(`${colors.bright}🧠 DATA PROCESSING:${colors.reset}`);
    console.log(`   Players Updated: ${colors.green}${processingReport.playersUpdated}${colors.reset}`);
    console.log(`   News Saved: ${colors.green}${processingReport.newsArticlesSaved}${colors.reset}`);
    console.log(`   Games Processed: ${colors.green}${processingReport.gamesProcessed}${colors.reset}`);
    console.log(`   Injuries Updated: ${colors.green}${processingReport.injuriesUpdated}${colors.reset}`);
    console.log(`   Success Rate: ${colors.green}${processingReport.successRate}%${colors.reset}\n`);
  }
  
  // Check API health
  await checkAPIHealth();
  
  // Check recent player updates
  await checkRecentUpdates();
  
  console.log(`\n${colors.cyan}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.yellow}Refreshing every 10 seconds... Press Ctrl+C to exit${colors.reset}`);
}

function getDataCollectionStats() {
  try {
    const apiFiles = fs.readdirSync(path.join(DATA_DIR, 'api')).length;
    const newsFiles = fs.readdirSync(path.join(DATA_DIR, 'news')).length;
    const officialFiles = fs.readdirSync(path.join(DATA_DIR, 'official')).length;
    
    return {
      api: apiFiles,
      news: newsFiles,
      official: officialFiles,
      total: apiFiles + newsFiles + officialFiles
    };
  } catch (error) {
    return { api: 0, news: 0, official: 0, total: 0 };
  }
}

function getProcessingReport() {
  try {
    const reportPath = path.join(DATA_DIR, 'reports', 'processing-report.json');
    if (fs.existsSync(reportPath)) {
      return JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    }
  } catch (error) {
    return null;
  }
}

async function checkAPIHealth() {
  console.log(`${colors.bright}🌐 API HEALTH:${colors.reset}`);
  
  const endpoints = [
    { name: 'Live Players', url: 'http://localhost:3000/api/sports/live-players?limit=1' },
    { name: 'AI Analysis', url: 'http://localhost:3000/api/ai-analysis' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const start = Date.now();
      const response = await fetch(endpoint.url);
      const time = Date.now() - start;
      
      if (response.ok) {
        console.log(`   ${endpoint.name}: ${colors.green}✓ OK${colors.reset} (${time}ms)`);
      } else {
        console.log(`   ${endpoint.name}: ${colors.red}✗ ERROR${colors.reset} (${response.status})`);
      }
    } catch (error) {
      console.log(`   ${endpoint.name}: ${colors.red}✗ OFFLINE${colors.reset}`);
    }
  }
}

async function checkRecentUpdates() {
  console.log(`\n${colors.bright}📈 RECENT PLAYER UPDATES:${colors.reset}`);
  
  try {
    const response = await fetch('http://localhost:3000/api/sports/live-players?limit=5');
    if (response.ok) {
      const data = await response.json();
      
      if (data.players) {
        data.players.forEach((player: any) => {
          const trend = player.trend === 'up' ? '↑' : player.trend === 'down' ? '↓' : '→';
          const trendColor = player.trend === 'up' ? colors.green : player.trend === 'down' ? colors.red : colors.yellow;
          
          console.log(`   ${player.name}: ${player.projectedPoints} pts ${trendColor}${trend}${colors.reset} (${player.injuryStatus})`);
        });
      }
    }
  } catch (error) {
    console.log(`   ${colors.red}Unable to fetch player updates${colors.reset}`);
  }
}

// Start monitoring
async function startMonitoring() {
  // Initial display
  await monitorSystem();
  
  // Refresh every 10 seconds
  const interval = setInterval(async () => {
    await monitorSystem();
  }, 10000);
  
  // Handle exit
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.clear();
    console.log(`\n${colors.green}✅ Monitoring stopped${colors.reset}`);
    process.exit(0);
  });
}

startMonitoring().catch(console.error);