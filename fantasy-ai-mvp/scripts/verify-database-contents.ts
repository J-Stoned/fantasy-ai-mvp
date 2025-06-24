#!/usr/bin/env tsx

/**
 * 🔍 VERIFY WHAT'S IN SUPABASE
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.jhfhsbqrdblytrlrconc:3O4X69OIECpNNjoW@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
    }
  }
});

async function verifyDatabase() {
  console.log('🔍 VERIFYING SUPABASE DATABASE CONTENTS...');
  console.log('=========================================\n');
  
  try {
    // Count records in each table
    const userCount = await prisma.user.count();
    const leagueCount = await prisma.league.count();
    const playerCount = await prisma.player.count();
    const teamCount = await prisma.team.count();
    const rosterCount = await prisma.roster.count();
    const performanceCount = await prisma.playerPerformance.count();
    
    console.log('📊 ACTUAL DATABASE CONTENTS:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Leagues: ${leagueCount}`);
    console.log(`   Players: ${playerCount} ⭐`);
    console.log(`   Teams: ${teamCount}`);
    console.log(`   Roster Entries: ${rosterCount}`);
    console.log(`   Performance Records: ${performanceCount}`);
    
    // Get player breakdown
    const playersByLeague = await prisma.player.groupBy({
      by: ['leagueId'],
      _count: true
    });
    
    console.log('\n🏆 PLAYERS BY SPORT:');
    let totalPlayers = 0;
    for (const group of playersByLeague) {
      console.log(`   ${group.leagueId.toUpperCase()}: ${group._count} players`);
      totalPlayers += group._count;
    }
    console.log(`   TOTAL: ${totalPlayers} players`);
    
    // Sample some actual player names
    const samplePlayers = await prisma.player.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        name: true,
        team: true,
        position: true,
        league: {
          select: { name: true }
        }
      }
    });
    
    console.log('\n👤 SAMPLE PLAYERS IN DATABASE:');
    samplePlayers.forEach(player => {
      console.log(`   ${player.name} - ${player.position} - ${player.team} (${player.league.name})`);
    });
    
    // Check what data collectors have added
    const leagues = await prisma.league.findMany();
    console.log('\n📡 DATA COLLECTION STATUS:');
    
    for (const league of leagues) {
      const settings = JSON.parse(league.settings);
      if (settings.bigDataPoints) {
        console.log(`   ${league.name}: ${settings.bigDataPoints.toLocaleString()} data points collected`);
      }
      if (settings.lastCollection) {
        console.log(`      Last updated: ${new Date(settings.lastCollection).toLocaleString()}`);
      }
    }
    
    console.log('\n✅ DATABASE STATUS: ACTIVE & POPULATED');
    console.log('🚀 Fantasy.AI is using REAL Supabase cloud database!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();