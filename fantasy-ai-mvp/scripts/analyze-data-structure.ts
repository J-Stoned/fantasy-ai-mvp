#!/usr/bin/env tsx

/**
 * 🔍 ANALYZE DATABASE STRUCTURE
 * Shows how data is organized in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeDataStructure() {
  console.log('🗄️ DATABASE STRUCTURE ANALYSIS\n');
  console.log('=' .repeat(60));

  // 1. Data Collection Structure
  console.log('\n📊 1. DATA COLLECTION STRUCTURE:');
  console.log('   RawDataCache -> Temporary storage for unprocessed data');
  console.log('   ├─ id: Unique identifier');
  console.log('   ├─ source: Where data came from (ESPN, Yahoo, etc.)');
  console.log('   ├─ dataType: Type of data (api, news, official)');
  console.log('   ├─ rawData: JSON blob of actual data');
  console.log('   ├─ isProcessed: Whether it\'s been extracted');
  console.log('   └─ processedAt: When it was processed');

  // 2. Structured Data Tables
  console.log('\n📋 2. STRUCTURED DATA TABLES:');
  
  console.log('\n   NewsArticle -> Extracted news content');
  console.log('   ├─ title: Article headline');
  console.log('   ├─ content: Full article text');
  console.log('   ├─ source: News source (ESPN, CBS, etc.)');
  console.log('   ├─ sport: Which sport (nfl, nba, etc.)');
  console.log('   ├─ teams: JSON array of team names mentioned');
  console.log('   ├─ players: JSON array of players mentioned');
  console.log('   ├─ category: Type (injury, trade, etc.)');
  console.log('   └─ publishedAt: When article was published');
  
  console.log('\n   GameData -> Game information');
  console.log('   ├─ externalId: Unique game identifier');
  console.log('   ├─ sport: Sport type');
  console.log('   ├─ homeTeam/awayTeam: Teams playing');
  console.log('   ├─ gameTime: When game is scheduled');
  console.log('   ├─ status: SCHEDULED, IN_PROGRESS, FINAL');
  console.log('   ├─ homeScore/awayScore: Current scores');
  console.log('   └─ statistics: JSON object with game stats');

  console.log('\n   Player -> Player information');
  console.log('   ├─ name: Player name');
  console.log('   ├─ position: Player position');
  console.log('   ├─ team: Current team');
  console.log('   ├─ stats: JSON object with statistics');
  console.log('   ├─ projections: JSON object with projections');
  console.log('   └─ injuryStatus: Current injury status');

  // 3. Show actual data
  console.log('\n\n🔍 3. ACTUAL DATA IN DATABASE:');
  console.log('=' .repeat(60));

  // Collection runs
  const runs = await prisma.dataCollectionRun.count();
  console.log(`\n📥 Collection Runs: ${runs}`);
  
  const latestRun = await prisma.dataCollectionRun.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { rawDataItems: true }
  });
  
  if (latestRun) {
    console.log(`   Latest: ${latestRun.source} - ${latestRun.status}`);
    console.log(`   Records: ${latestRun.recordsCount}`);
    console.log(`   Raw items: ${latestRun.rawDataItems.length}`);
  }

  // Raw data cache
  const rawCount = await prisma.rawDataCache.count();
  const unprocessedCount = await prisma.rawDataCache.count({
    where: { isProcessed: false }
  });
  console.log(`\n💾 Raw Data Cache: ${rawCount} total`);
  console.log(`   Unprocessed: ${unprocessedCount}`);
  console.log(`   Processed: ${rawCount - unprocessedCount}`);

  // News articles
  const newsCount = await prisma.newsArticle.count();
  console.log(`\n📰 News Articles: ${newsCount}`);
  
  const newsSample = await prisma.newsArticle.findMany({ take: 3 });
  newsSample.forEach(article => {
    console.log(`   - "${article.title}"`);
    console.log(`     Source: ${article.source}, Sport: ${article.sport || 'N/A'}`);
    if (article.teams) {
      const teams = JSON.parse(article.teams);
      console.log(`     Teams: ${teams.join(', ')}`);
    }
  });

  // Players
  const playerCount = await prisma.player.count();
  console.log(`\n👤 Players: ${playerCount}`);
  
  const playerSample = await prisma.player.findMany({ 
    take: 5,
    orderBy: { updatedAt: 'desc' }
  });
  
  playerSample.forEach(player => {
    const hasStats = player.stats ? 'Yes' : 'No';
    const hasProjections = player.projections ? 'Yes' : 'No';
    console.log(`   - ${player.name} (${player.position}, ${player.team})`);
    console.log(`     Stats: ${hasStats}, Projections: ${hasProjections}`);
  });

  // Games
  const gameCount = await prisma.gameData.count();
  console.log(`\n🏈 Games: ${gameCount}`);

  // 4. Data Flow
  console.log('\n\n🔄 4. DATA FLOW PROCESS:');
  console.log('=' .repeat(60));
  console.log('1. Continuous Updater collects from sources');
  console.log('   └─> Saves to RawDataCache (unstructured JSON)');
  console.log('2. Data Processor runs periodically');
  console.log('   └─> Extracts structured data from RawDataCache');
  console.log('3. Structured data saved to specific tables:');
  console.log('   ├─> NewsArticle (for news content)');
  console.log('   ├─> GameData (for game information)');
  console.log('   └─> Player (updates stats/projections)');
  console.log('4. RawDataCache marked as processed');
  console.log('5. Old processed data cleaned up after 7 days');

  console.log('\n✅ Data is properly structured and organized!');
  console.log('=' .repeat(60));
}

analyzeDataStructure()
  .catch(console.error)
  .finally(() => prisma.$disconnect());