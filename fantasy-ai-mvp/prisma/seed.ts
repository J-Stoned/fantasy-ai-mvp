import { PrismaClient, Sport } from '@prisma/client';

const prisma = new PrismaClient();

// Top NFL Players by Position (2024 Fantasy Relevant)
const TOP_PLAYERS = [
  // Quarterbacks
  { name: 'Josh Allen', position: 'QB', team: 'BUF', jerseyNumber: '17' },
  { name: 'Patrick Mahomes', position: 'QB', team: 'KC', jerseyNumber: '15' },
  { name: 'Jalen Hurts', position: 'QB', team: 'PHI', jerseyNumber: '1' },
  { name: 'Lamar Jackson', position: 'QB', team: 'BAL', jerseyNumber: '8' },
  { name: 'Joe Burrow', position: 'QB', team: 'CIN', jerseyNumber: '9' },
  { name: 'Justin Herbert', position: 'QB', team: 'LAC', jerseyNumber: '10' },
  { name: 'Dak Prescott', position: 'QB', team: 'DAL', jerseyNumber: '4' },
  { name: 'Tua Tagovailoa', position: 'QB', team: 'MIA', jerseyNumber: '1' },
  
  // Running Backs
  { name: 'Christian McCaffrey', position: 'RB', team: 'SF', jerseyNumber: '23' },
  { name: 'Austin Ekeler', position: 'RB', team: 'LAC', jerseyNumber: '30' },
  { name: 'Bijan Robinson', position: 'RB', team: 'ATL', jerseyNumber: '7' },
  { name: 'Jonathan Taylor', position: 'RB', team: 'IND', jerseyNumber: '28' },
  { name: 'Saquon Barkley', position: 'RB', team: 'NYG', jerseyNumber: '26' },
  { name: 'Tony Pollard', position: 'RB', team: 'DAL', jerseyNumber: '20' },
  { name: 'Derrick Henry', position: 'RB', team: 'TEN', jerseyNumber: '22' },
  { name: 'Nick Chubb', position: 'RB', team: 'CLE', jerseyNumber: '24' },
  
  // Wide Receivers
  { name: 'Tyreek Hill', position: 'WR', team: 'MIA', jerseyNumber: '10' },
  { name: 'CeeDee Lamb', position: 'WR', team: 'DAL', jerseyNumber: '88' },
  { name: 'Justin Jefferson', position: 'WR', team: 'MIN', jerseyNumber: '18' },
  { name: 'Ja\'Marr Chase', position: 'WR', team: 'CIN', jerseyNumber: '1' },
  { name: 'A.J. Brown', position: 'WR', team: 'PHI', jerseyNumber: '11' },
  { name: 'Stefon Diggs', position: 'WR', team: 'BUF', jerseyNumber: '14' },
  { name: 'Davante Adams', position: 'WR', team: 'LV', jerseyNumber: '17' },
  { name: 'Cooper Kupp', position: 'WR', team: 'LAR', jerseyNumber: '10' },
  
  // Tight Ends
  { name: 'Travis Kelce', position: 'TE', team: 'KC', jerseyNumber: '87' },
  { name: 'Mark Andrews', position: 'TE', team: 'BAL', jerseyNumber: '89' },
  { name: 'T.J. Hockenson', position: 'TE', team: 'MIN', jerseyNumber: '87' },
  { name: 'George Kittle', position: 'TE', team: 'SF', jerseyNumber: '85' },
  { name: 'Dallas Goedert', position: 'TE', team: 'PHI', jerseyNumber: '88' },
  
  // Kickers
  { name: 'Justin Tucker', position: 'K', team: 'BAL', jerseyNumber: '9' },
  { name: 'Daniel Carlson', position: 'K', team: 'LV', jerseyNumber: '2' },
  { name: 'Harrison Butker', position: 'K', team: 'KC', jerseyNumber: '7' },
];

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await prisma.prediction.deleteMany();
    await prisma.player.deleteMany();
    await prisma.team.deleteMany();
    await prisma.league.deleteMany();
    await prisma.user.deleteMany();
    
    // Create a demo user
    console.log('👤 Creating demo user...');
    const demoUser = await prisma.user.create({
      data: {
        email: 'demo@fantasy-ai.com',
        name: 'Demo User'
      }
    });
    console.log('✅ Created demo user');
    
    // Create sample league
    console.log('🏆 Creating sample league...');
    const league = await prisma.league.create({
      data: {
        userId: demoUser.id,
        provider: 'YAHOO',
        providerId: 'demo-league-123',
        name: 'Fantasy.AI Demo League',
        season: '2024',
        sport: Sport.FOOTBALL,
        isActive: true,
        settings: JSON.stringify({
          rosterSize: 16,
          startingQB: 1,
          startingRB: 2,
          startingWR: 3,
          startingTE: 1,
          startingFLEX: 1,
          startingDST: 1,
          startingK: 1,
          scoringSystem: 'PPR'
        })
      }
    });
    console.log('✅ Created demo league');
    
    // Create players
    console.log('👥 Creating NFL players...');
    const players = await Promise.all(
      TOP_PLAYERS.map((playerData, index) => 
        prisma.player.create({
          data: {
            externalId: `nfl-${playerData.team}-${playerData.jerseyNumber}`,
            name: playerData.name,
            position: playerData.position,
            team: playerData.team,
            leagueId: league.id,
            stats: JSON.stringify({
              passingYards: playerData.position === 'QB' ? Math.floor(Math.random() * 4000) + 2000 : 0,
              rushingYards: ['RB', 'QB'].includes(playerData.position) ? Math.floor(Math.random() * 1500) + 200 : 0,
              receivingYards: ['WR', 'TE'].includes(playerData.position) ? Math.floor(Math.random() * 1400) + 400 : 0,
              touchdowns: Math.floor(Math.random() * 15) + 3,
              fantasyPoints: Math.floor(Math.random() * 200) + 100
            }),
            projections: JSON.stringify({
              weeklyPoints: Math.floor(Math.random() * 25) + 8,
              seasonTotal: Math.floor(Math.random() * 200) + 150,
              confidence: Math.random() * 0.3 + 0.7
            }),
            injuryStatus: Math.random() > 0.85 ? 'QUESTIONABLE' : 'HEALTHY',
            imageUrl: `https://a.espncdn.com/i/headshots/nfl/players/full/${4000000 + index}.png`
          }
        })
      )
    );
    console.log(`✅ Created ${players.length} players`);
    
    // Create sample predictions for players
    console.log('🔮 Creating player predictions...');
    const predictions = await Promise.all(
      players.slice(0, 20).map(player => // Only create predictions for first 20 players
        prisma.prediction.create({
          data: {
            userId: demoUser.id,
            playerId: player.id,
            type: 'POINTS',
            week: 1,
            season: '2024',
            prediction: JSON.stringify({
              projectedPoints: Math.floor(Math.random() * 30) + 5,
              rationale: `AI analysis based on recent performance, matchup difficulty, and weather conditions for ${player.name}.`
            }),
            confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
            actual: JSON.stringify({
              actualPoints: Math.floor(Math.random() * 25) + 3,
              gameCompleted: Math.random() > 0.3 // 70% of games completed
            }),
            accuracy: Math.random() * 0.4 + 0.6 // 60-100% accuracy
          }
        })
      )
    );
    console.log(`✅ Created ${predictions.length} predictions`);
    
    // Create a fantasy team for the demo user
    console.log('🏈 Creating demo fantasy team...');
    const fantasyTeam = await prisma.team.create({
      data: {
        userId: demoUser.id,
        leagueId: league.id,
        name: 'Demo Champions',
        rank: 1,
        points: 1247.5,
        wins: 8,
        losses: 3,
        ties: 0
      }
    });
    console.log('✅ Created demo fantasy team');
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - 1 demo user`);
    console.log(`   - 1 demo league`);
    console.log(`   - ${players.length} NFL players`);
    console.log(`   - ${predictions.length} predictions`);
    console.log(`   - 1 fantasy team`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    console.error('Error details:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log('\n✅ Seed script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed script failed:', error);
    process.exit(1);
  });