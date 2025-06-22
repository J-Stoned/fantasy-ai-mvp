const { PrismaClient } = require('@prisma/client');

// Use the Supabase connection string
process.env.DATABASE_URL = 'postgresql://postgres.jhfhsbqrdblytrlrconc:rfoYfhORq9Y8fkLo@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('🔌 Testing Supabase connection...');
    console.log('📍 Database URL:', process.env.DATABASE_URL);
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Successfully connected to Supabase!');
    
    // Count players
    const playerCount = await prisma.player.count();
    console.log(`📊 Total players in database: ${playerCount}`);
    
    // Get sample players
    const samplePlayers = await prisma.player.findMany({
      take: 5,
      orderBy: { name: 'asc' }
    });
    
    console.log('\n🏈 Sample players:');
    samplePlayers.forEach(player => {
      console.log(`  - ${player.name} (${player.position}) - ${player.team}`);
    });
    
    // Check if players have the isActive field
    const firstPlayer = await prisma.player.findFirst();
    console.log('\n🔍 Player schema check:');
    console.log('  - Has isActive field:', 'isActive' in firstPlayer);
    console.log('  - Player fields:', Object.keys(firstPlayer));
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();