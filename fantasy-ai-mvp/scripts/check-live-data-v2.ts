import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLiveData() {
  try {
    console.log('🔍 Checking live data in database...\n');

    // Check players
    const playerCount = await prisma.player.count();
    const recentPlayers = await prisma.player.findMany({
      take: 10,
      orderBy: { updatedAt: 'desc' },
      select: { 
        name: true, 
        team: true, 
        position: true, 
        stats: true,
        projections: true,
        injuryStatus: true,
        updatedAt: true 
      }
    });

    console.log(`📊 Players: ${playerCount} total`);
    console.log('\nRecent players:');
    recentPlayers.forEach(p => {
      console.log(`- ${p.name} (${p.team} - ${p.position}) - Updated: ${p.updatedAt}`);
      if (p.stats) {
        try {
          const stats = JSON.parse(p.stats);
          console.log(`  Stats: ${JSON.stringify(stats).slice(0, 100)}...`);
        } catch (e) {
          console.log(`  Stats: ${p.stats.slice(0, 100)}...`);
        }
      }
    });

    // Check leagues
    const leagueCount = await prisma.league.count();
    const leagues = await prisma.league.findMany({ take: 5 });
    console.log(`\n🏆 Leagues: ${leagueCount} total`);
    leagues.forEach(l => console.log(`- ${l.name} (${l.platform})`));

    // Check predictions
    const predictionCount = await prisma.prediction.count();
    console.log(`\n🤖 Predictions: ${predictionCount} total`);

    // Check ML predictions
    const mlPredictionCount = await prisma.mLPrediction.count();
    const recentMLPredictions = await prisma.mLPrediction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { player: { select: { name: true } } }
    });
    
    console.log(`\n🧠 ML Predictions: ${mlPredictionCount} total`);
    if (recentMLPredictions.length > 0) {
      console.log('Recent ML predictions:');
      recentMLPredictions.forEach(p => {
        console.log(`- ${p.player.name}: ${p.predictionType} = ${p.predictedValue} (confidence: ${p.confidence})`);
      });
    }

    // Check for NFL teams
    const nflTeams = ['Chiefs', '49ers', 'Bills', 'Eagles', 'Cowboys'];
    console.log('\n🏈 Checking for NFL players...');
    
    for (const team of nflTeams) {
      const teamPlayers = await prisma.player.count({
        where: { team: { contains: team } }
      });
      if (teamPlayers > 0) {
        console.log(`- ${team}: ${teamPlayers} players`);
      }
    }

    // Check data freshness
    const lastUpdate = await prisma.player.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true, name: true, team: true }
    });

    if (lastUpdate) {
      const hoursSinceUpdate = (Date.now() - lastUpdate.updatedAt.getTime()) / (1000 * 60 * 60);
      console.log(`\n⏰ Last data update: ${lastUpdate.updatedAt.toISOString()}`);
      console.log(`   Player: ${lastUpdate.name} (${lastUpdate.team})`);
      console.log(`   Hours ago: ${hoursSinceUpdate.toFixed(1)}`);
    }

    // Check if API endpoints are returning real data
    console.log('\n🌐 Testing API endpoint...');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    try {
      const response = await fetch(`${apiUrl}/api/sports/live-players?limit=5`);
      if (response.ok) {
        const data = await response.json();
        console.log(`API returned ${data.players?.length || 0} players`);
        if (data.players?.[0]) {
          console.log('Sample player from API:', JSON.stringify(data.players[0], null, 2).slice(0, 200) + '...');
        }
      } else {
        console.log(`API error: ${response.status} ${response.statusText}`);
      }
    } catch (e) {
      console.log('Could not reach API - this is normal if running locally');
    }

  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLiveData();