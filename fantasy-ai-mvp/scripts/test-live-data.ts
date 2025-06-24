#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testLiveData() {
  console.log('🏈 FANTASY.AI LIVE DATA TEST');
  console.log('==============================\n');

  try {
    // Get player counts by position
    const positions = await prisma.player.groupBy({
      by: ['position'],
      _count: true,
      orderBy: {
        _count: {
          position: 'desc'
        }
      }
    });

    console.log('📊 PLAYERS BY POSITION:');
    positions.forEach(p => {
      console.log(`   ${p.position}: ${p._count} players`);
    });

    // Get leagues
    const leagues = await prisma.league.count();
    console.log(`\n🏆 Total Leagues: ${leagues}`);

    // Get sample players
    const topPlayers = await prisma.player.findMany({
      take: 10,
      orderBy: { name: 'asc' }
    });

    console.log('\n⭐ SAMPLE PLAYERS:');
    topPlayers.forEach(p => {
      console.log(`   ${p.name} - ${p.position} (${p.team})`);
    });

    // Check for different sports
    const sports = await prisma.player.groupBy({
      by: ['team'],
      _count: true
    });

    console.log('\n🏀 SAMPLE TEAMS:');
    sports.forEach(s => {
      console.log(`   ${s.team}: ${s._count} players`);
    });

    const total = await prisma.player.count();
    console.log(`\n🎯 TOTAL PLAYERS: ${total.toLocaleString()}`);
    console.log('✅ DATABASE FULLY OPERATIONAL!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLiveData();