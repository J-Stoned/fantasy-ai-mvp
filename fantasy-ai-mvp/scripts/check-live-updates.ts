#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLiveUpdates() {
  console.log('🔍 CHECKING LIVE DATABASE UPDATES...\n');
  
  // Get recently updated players
  const recentlyUpdated = await prisma.player.findMany({
    take: 10,
    orderBy: { updatedAt: 'desc' },
    select: {
      name: true,
      team: true,
      updatedAt: true,
      stats: true
    }
  });
  
  console.log('🔥 RECENTLY UPDATED PLAYERS:');
  console.log('============================');
  recentlyUpdated.forEach(player => {
    const stats = player.stats ? JSON.parse(player.stats as string) : {};
    console.log(`  • ${player.name} (${player.team})`);
    console.log(`    Updated: ${player.updatedAt.toLocaleTimeString()}`);
    if (stats.lastUpdate || stats.gamesPlayed !== undefined) {
      console.log(`    Stats: ${stats.gamesPlayed || 0} games, ${stats.points || 0} points, ${stats.assists || 0} assists`);
    }
    console.log('');
  });
  
  // Get update statistics
  const totalPlayers = await prisma.player.count();
  const updatedToday = await prisma.player.count({
    where: {
      updatedAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    }
  });
  
  console.log('📊 UPDATE STATISTICS:');
  console.log('====================');
  console.log(`  Total Players: ${totalPlayers}`);
  console.log(`  Updated Today: ${updatedToday}`);
  console.log(`  Update Rate: ${((updatedToday / totalPlayers) * 100).toFixed(1)}%`);
  
  await prisma.$disconnect();
}

checkLiveUpdates().catch(console.error);