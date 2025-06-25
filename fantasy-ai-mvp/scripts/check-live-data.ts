import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLiveData() {
  try {
    console.log('🔍 Checking live data in database...\n');

    // Check players
    const playerCount = await prisma.player.count();
    const activePlayers = await prisma.player.count({ where: { isActive: true } });
    const recentPlayers = await prisma.player.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { name: true, team: true, position: true, createdAt: true }
    });

    console.log(`📊 Players: ${playerCount} total (${activePlayers} active)`);
    console.log('Recent players:', recentPlayers);

    // Check leagues
    const leagueCount = await prisma.league.count();
    console.log(`\n🏆 Leagues: ${leagueCount} total`);

    // Check predictions
    const predictionCount = await prisma.prediction.count();
    console.log(`\n🤖 Predictions: ${predictionCount} total`);

    // Check if we have any real sports data
    const nflPlayers = await prisma.player.findMany({
      where: { 
        OR: [
          { team: { contains: 'Chiefs' } },
          { team: { contains: '49ers' } },
          { team: { contains: 'Bills' } }
        ]
      },
      take: 10
    });

    console.log(`\n🏈 NFL Players found: ${nflPlayers.length}`);
    if (nflPlayers.length > 0) {
      console.log('Sample NFL players:', nflPlayers.slice(0, 3).map(p => `${p.name} (${p.team})`));
    }

    // Check for recent data updates
    const lastUpdate = await prisma.player.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true, name: true }
    });

    if (lastUpdate) {
      console.log(`\n⏰ Last data update: ${lastUpdate.updatedAt} (${lastUpdate.name})`);
    }

  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLiveData();