const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.jhfhsbqrdblytrlrconc:rfoYfhORq9Y8fkLo@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
    }
  }
});

async function testConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    const playerCount = await prisma.player.count();
    console.log(`✅ Connected! Found ${playerCount} players in Supabase`);
    
    const leagues = await prisma.league.count();
    console.log(`📊 Found ${leagues} leagues`);
    
    const sample = await prisma.player.findFirst();
    console.log(`\n🏈 Sample player: ${sample?.name} (${sample?.position}) - ${sample?.league}`);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();