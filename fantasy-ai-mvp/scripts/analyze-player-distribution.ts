#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzePlayerDistribution() {
  console.log('🏈 ANALYZING PLAYER DISTRIBUTION');
  console.log('================================\n');
  
  try {
    // Get total count
    const totalCount = await prisma.player.count();
    console.log(`📊 TOTAL PLAYERS: ${totalCount.toLocaleString()}\n`);
    
    // Get all leagues
    const leagues = await prisma.league.findMany({
      include: {
        _count: {
          select: { Player: true }
        }
      }
    });
    
    console.log('🏆 LEAGUES AND PLAYER COUNTS:');
    console.log('-----------------------------');
    for (const league of leagues) {
      console.log(`${league.name} (${league.sport}): ${league._count.Player.toLocaleString()} players`);
    }
    
    // Get unique teams
    const teams = await prisma.player.groupBy({
      by: ['team'],
      _count: true,
      orderBy: {
        _count: {
          team: 'desc'
        }
      }
    });
    
    console.log('\n🏟️ UNIQUE TEAMS:', teams.length);
    console.log('\n📍 TOP TEAMS BY PLAYER COUNT:');
    console.log('-----------------------------');
    teams.slice(0, 20).forEach(t => {
      console.log(`${t.team}: ${t._count} players`);
    });
    
    // Get position breakdown
    const positions = await prisma.player.groupBy({
      by: ['position'],
      _count: true,
      orderBy: {
        _count: {
          position: 'desc'
        }
      }
    });
    
    console.log('\n🎯 POSITION BREAKDOWN:');
    console.log('---------------------');
    
    // Group positions by sport
    const footballPositions = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF', 'OL', 'DL', 'LB', 'DB', 'CB', 'S'];
    const basketballPositions = ['PG', 'SG', 'SF', 'PF', 'C'];
    const baseballPositions = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
    const hockeyPositions = ['C', 'LW', 'RW', 'D', 'G'];
    
    let footballCount = 0;
    let basketballCount = 0;
    let baseballCount = 0;
    let hockeyCount = 0;
    let otherCount = 0;
    
    positions.forEach(p => {
      if (footballPositions.includes(p.position)) {
        footballCount += p._count;
      } else if (basketballPositions.includes(p.position)) {
        basketballCount += p._count;
      } else if (baseballPositions.includes(p.position)) {
        baseballCount += p._count;
      } else if (hockeyPositions.includes(p.position)) {
        hockeyCount += p._count;
      } else {
        otherCount += p._count;
      }
    });
    
    console.log(`\n🏈 Football positions: ${footballCount.toLocaleString()} players`);
    console.log(`🏀 Basketball positions: ${basketballCount.toLocaleString()} players`);
    console.log(`⚾ Baseball positions: ${baseballCount.toLocaleString()} players`);
    console.log(`🏒 Hockey positions: ${hockeyCount.toLocaleString()} players`);
    console.log(`❓ Other positions: ${otherCount.toLocaleString()} players`);
    
    console.log('\n📈 DETAILED POSITION COUNTS:');
    console.log('---------------------------');
    positions.forEach(p => {
      console.log(`${p.position}: ${p._count} players`);
    });
    
    // Sample some players
    console.log('\n⭐ SAMPLE PLAYERS:');
    console.log('-----------------');
    const samplePlayers = await prisma.player.findMany({
      take: 10,
      orderBy: { name: 'asc' }
    });
    
    samplePlayers.forEach(p => {
      console.log(`${p.name} - ${p.position} (${p.team})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzePlayerDistribution();