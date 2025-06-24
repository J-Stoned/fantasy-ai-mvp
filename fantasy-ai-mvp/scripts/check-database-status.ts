#!/usr/bin/env tsx

/**
 * 🔍 CHECK WHAT'S ACTUALLY IN OUR SUPABASE DATABASE
 */

import { PrismaClient } from '@prisma/client';

// Use environment variables instead of hardcoded URL
const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL || '';

if (!DATABASE_URL) {
  console.error('❌ No database URL found in environment variables');
  console.error('   Please set DIRECT_URL or DATABASE_URL');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function checkDatabaseStatus() {
  console.log('🔍 CHECKING SUPABASE DATABASE STATUS...');
  console.log('=====================================\n');
  
  try {
    // Check all tables
    const tables = [
      { name: 'Users', count: await prisma.user.count() },
      { name: 'Leagues', count: await prisma.league.count() },
      { name: 'Players', count: await prisma.player.count() },
      { name: 'Teams', count: await prisma.team.count() },
      { name: 'Rosters', count: await prisma.roster.count() },
      { name: 'PlayerPerformances', count: await prisma.playerPerformance.count() },
      { name: 'Predictions', count: await prisma.prediction.count() },
      { name: 'Alerts', count: await prisma.alert.count() },
    ];
    
    console.log('📊 TABLE RECORD COUNTS:');
    tables.forEach(table => {
      console.log(`   ${table.name}: ${table.count.toLocaleString()} records`);
    });
    
    // Check player distribution
    const playersByLeague = await prisma.player.groupBy({
      by: ['leagueId'],
      _count: true
    });
    
    console.log('\n🏆 PLAYERS BY LEAGUE:');
    playersByLeague.forEach(league => {
      console.log(`   ${league.leagueId.toUpperCase()}: ${league._count} players`);
    });
    
    // Check latest players added
    const latestPlayers = await prisma.player.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { league: true }
    });
    
    console.log('\n🆕 LATEST PLAYERS ADDED:');
    latestPlayers.forEach(player => {
      console.log(`   ${player.name} (${player.team}) - ${player.league.name}`);
    });
    
    // Check if we have any performance data
    const perfData = await prisma.playerPerformance.findMany({
      take: 5,
      include: { player: true }
    });
    
    if (perfData.length > 0) {
      console.log('\n📈 SAMPLE PERFORMANCE DATA:');
      perfData.forEach(perf => {
        console.log(`   ${perf.player.name}: ${perf.actualPoints || 0} points`);
      });
    }
    
    // Check last sync times
    const leagues = await prisma.league.findMany({
      select: { name: true, lastSync: true, settings: true }
    });
    
    console.log('\n🔄 LEAGUE SYNC STATUS:');
    leagues.forEach(league => {
      const settings = JSON.parse(league.settings);
      console.log(`   ${league.name}: Last sync ${league.lastSync || 'Never'}`);
      if (settings.bigDataPoints) {
        console.log(`      Big Data Points: ${settings.bigDataPoints?.toLocaleString() || 0}`);
      }
    });
    
    // Check total data volume
    const totalRecords = tables.reduce((sum, table) => sum + table.count, 0);
    
    console.log('\n💾 DATABASE SUMMARY:');
    console.log(`   Total Records: ${totalRecords.toLocaleString()}`);
    console.log(`   Total Players: ${tables.find(t => t.name === 'Players')?.count || 0}`);
    console.log(`   Database: Supabase PostgreSQL`);
    console.log(`   Status: ✅ CONNECTED & ACTIVE`);
    
    // Check if collectors added any metadata
    const latestLeague = await prisma.league.findFirst({
      orderBy: { updatedAt: 'desc' }
    });
    
    if (latestLeague && latestLeague.settings) {
      const settings = JSON.parse(latestLeague.settings);
      if (settings.lastCollection) {
        console.log(`\n⏰ LAST DATA COLLECTION: ${new Date(settings.lastCollection).toLocaleString()}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStatus();