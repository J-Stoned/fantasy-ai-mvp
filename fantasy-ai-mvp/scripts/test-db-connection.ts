#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

async function testConnection() {
  console.log('🔍 Testing database connection...\n');
  
  const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
  
  if (!databaseUrl) {
    console.error('❌ No DATABASE_URL or DIRECT_URL found in environment');
    process.exit(1);
  }
  
  // Check if URL has SSL
  const hasSSL = databaseUrl.includes('sslmode=');
  console.log(`📌 Database URL: ${databaseUrl.split('@')[1]}`); // Hide password
  console.log(`🔒 SSL Mode: ${hasSSL ? 'Configured' : 'Not configured'}\n`);
  
  // Try with SSL if not already included
  const urlWithSSL = hasSSL ? databaseUrl : `${databaseUrl}?sslmode=require`;
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: urlWithSSL
      }
    }
  });
  
  try {
    console.log('🔄 Attempting to connect...');
    
    // Test basic connection
    const userCount = await prisma.user.count();
    console.log(`✅ Connected! User count: ${userCount}`);
    
    // Test other tables
    const counts = {
      players: await prisma.player.count(),
      leagues: await prisma.league.count(),
      teams: await prisma.team.count(),
    };
    
    console.log('\n📊 Database Statistics:');
    console.log(`   Players: ${counts.players}`);
    console.log(`   Leagues: ${counts.leagues}`);
    console.log(`   Teams: ${counts.teams}`);
    
    console.log('\n✅ Database connection successful!');
    
  } catch (error) {
    console.error('\n❌ Connection failed:');
    console.error(error);
    
    if (error instanceof Error && error.message.includes("Can't reach database server")) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Check if your Supabase project is active (not paused)');
      console.log('2. Verify the database password is correct');
      console.log('3. Try adding ?sslmode=require to your DATABASE_URL');
      console.log('4. Check Supabase dashboard for any connection limits');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();