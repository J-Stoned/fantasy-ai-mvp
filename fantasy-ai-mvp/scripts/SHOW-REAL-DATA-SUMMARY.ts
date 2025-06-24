#!/usr/bin/env tsx

/**
 * 📊💥 SHOW REAL DATA SUMMARY - WHAT'S ACTUALLY IN SUPABASE! 💥📊
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function showRealDataSummary() {
  console.log('\n📊💥 REAL DATA IN SUPABASE! 💥📊');
  console.log('===================================\n');

  try {
    // Get total counts
    const playerCount = await prisma.player.count();
    const leagueCount = await prisma.league.count();
    const gameCount = await prisma.gameData.count();
    const newsCount = await prisma.newsArticle.count();
    const collectionRunCount = await prisma.dataCollectionRun.count();

    console.log('📊 DATABASE TOTALS:');
    console.log(`   🏈 Players: ${playerCount.toLocaleString()}`);
    console.log(`   🏆 Leagues: ${leagueCount.toLocaleString()}`);
    console.log(`   🎮 Games: ${gameCount.toLocaleString()}`);
    console.log(`   📰 News Articles: ${newsCount.toLocaleString()}`);
    console.log(`   📡 Collection Runs: ${collectionRunCount.toLocaleString()}`);

    // Get sample players by team
    const samplePlayers = await prisma.player.findMany({
      take: 20,
      orderBy: { rating: 'desc' },
      where: { rating: { gte: 90 } }
    });

    console.log('\n⭐ TOP 20 HIGHEST RATED PLAYERS:');
    samplePlayers.forEach((player, i) => {
      console.log(`   ${i + 1}. ${player.name} (${player.position}) - ${player.team} - Rating: ${player.rating}`);
    });

    // Count players by team
    const teams = await prisma.player.findMany({
      select: { team: true },
      distinct: ['team']
    });

    console.log(`\n🏆 TOTAL UNIQUE TEAMS: ${teams.length}`);
    console.log('   Sample teams:', teams.slice(0, 10).map(t => t.team).join(', '));

    // Recent collection runs
    const recentRuns = await prisma.dataCollectionRun.findMany({
      take: 5,
      orderBy: { startTime: 'desc' }
    });

    if (recentRuns.length > 0) {
      console.log('\n📡 RECENT DATA COLLECTIONS:');
      recentRuns.forEach(run => {
        console.log(`   - ${run.source}: ${run.recordsCount} records (${run.status})`);
      });
    }

    // Summary
    const totalDataPoints = playerCount + gameCount + newsCount;
    console.log('\n✅ SUMMARY:');
    console.log(`   Total Data Points: ${totalDataPoints.toLocaleString()}`);
    console.log(`   Player Database: ${playerCount > 3000 ? '🚀 MASSIVE! Ready for production!' : '⚠️ Needs more data'}`);
    console.log(`   Status: ${playerCount > 4000 ? '💥 EXCEEDED ALL EXPECTATIONS!' : '📈 Growing...'}`);

    // ML Status Check
    try {
      const mlRunsRaw = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM "MLLearningRun" 
        WHERE "createdAt" > CURRENT_TIMESTAMP - INTERVAL '1 hour'
      `;
      const mlRuns = (mlRunsRaw as any[])[0]?.count || 0;
      console.log(`\n🧠 ML LEARNING STATUS:`);
      console.log(`   Recent runs (last hour): ${mlRuns}`);
    } catch (e) {
      // ML table might not exist yet
      console.log('\n🧠 ML LEARNING STATUS: Not yet initialized');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute
showRealDataSummary()
  .then(() => {
    console.log('\n🏁 DATA SUMMARY COMPLETE! 🏁\n');
  })
  .catch(console.error);