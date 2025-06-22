import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.player.count();
    console.log(`Total players in database: ${count}`);
    
    // Get count by sport/league
    const byLeague = await prisma.player.groupBy({
      by: ['leagueId'],
      _count: true,
    });
    
    console.log('\nPlayers by league:');
    for (const league of byLeague) {
      console.log(`League ${league.leagueId}: ${league._count} players`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();