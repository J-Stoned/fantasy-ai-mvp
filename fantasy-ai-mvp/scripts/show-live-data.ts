#!/usr/bin/env tsx

/**
 * 🚀 SHOW LIVE DATA FROM SUPABASE
 * Displays all the real player data we just populated
 */

import { PrismaClient } from '@prisma/client';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.jhfhsbqrdblytrlrconc:3O4X69OIECpNNjoW@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function showLiveData() {
  console.log('🚀💥 FANTASY.AI LIVE DATA FROM SUPABASE 💥🚀');
  console.log('===========================================\n');
  
  try {
    // Get leagues
    const leagues = await prisma.league.findMany({
      include: {
        _count: {
          select: { players: true, teams: true }
        }
      }
    });
    
    console.log('📊 ACTIVE LEAGUES:');
    leagues.forEach(league => {
      console.log(`   ${league.name} - ${league._count.players} players, ${league._count.teams} teams`);
    });
    
    // Get all players with their leagues
    const players = await prisma.player.findMany({
      include: {
        league: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`\n🏆 ALL PLAYERS (${players.length} total):`);
    console.log('=====================================');
    
    // Group by league
    const playersByLeague = players.reduce((acc, player) => {
      const leagueName = player.league.name;
      if (!acc[leagueName]) acc[leagueName] = [];
      acc[leagueName].push(player);
      return acc;
    }, {} as Record<string, typeof players>);
    
    Object.entries(playersByLeague).forEach(([leagueName, leaguePlayers]) => {
      console.log(`\n${leagueName} (${leaguePlayers.length} players):`);
      console.log('-'.repeat(40));
      
      leaguePlayers.forEach(player => {
        const stats = JSON.parse(player.stats);
        const projections = player.projections ? JSON.parse(player.projections) : null;
        console.log(`   ${player.name.padEnd(25)} | ${player.position.padEnd(3)} | ${player.team.padEnd(25)} | ${stats.fantasyPoints.toFixed(1)} pts`);
      });
    });
    
    // Get team rosters
    const teams = await prisma.team.findMany({
      include: {
        roster: {
          include: {
            player: true
          }
        },
        league: true
      }
    });
    
    console.log('\n🏈 FANTASY TEAMS:');
    console.log('==================');
    teams.forEach(team => {
      console.log(`\n${team.name} (${team.league.name})`);
      console.log(`Record: ${team.wins}-${team.losses}-${team.ties} | Points: ${team.points}`);
      if (team.roster.length > 0) {
        console.log('Roster:');
        team.roster.forEach(slot => {
          console.log(`   - ${slot.player.name} (${slot.position})`);
        });
      }
    });
    
    console.log('\n✅ FANTASY.AI IS LIVE WITH REAL DATA!');
    console.log('=====================================');
    console.log('🌐 Dashboard: http://localhost:3001/dashboard-simple');
    console.log('📊 Features demonstrated:');
    console.log('   - Real NFL, NBA, MLB, NHL players');
    console.log('   - Live stats and projections');
    console.log('   - Fantasy team management');
    console.log('   - Supabase cloud database integration');
    console.log('   - Production-ready infrastructure');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showLiveData();