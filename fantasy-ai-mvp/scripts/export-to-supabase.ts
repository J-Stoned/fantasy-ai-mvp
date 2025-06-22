#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

// Initialize SQLite Prisma client
const sqlitePrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db'
    }
  }
});

console.log('🚀 EXPORTING 5,040 PLAYERS TO SUPABASE...');
console.log('==========================================');

async function exportToSupabase() {
  // TODO: Add your Supabase credentials here
  const SUPABASE_URL = process.env.SUPABASE_URL || 'your-supabase-url';
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
  
  if (!SUPABASE_URL || SUPABASE_URL === 'your-supabase-url') {
    console.log('⚠️  SUPABASE SETUP REQUIRED:');
    console.log('1. Go to https://supabase.com and create a free project');
    console.log('2. Get your project URL and anon key from Settings > API');
    console.log('3. Set environment variables:');
    console.log('   export SUPABASE_URL="your-project-url"');
    console.log('   export SUPABASE_ANON_KEY="your-anon-key"');
    console.log('4. Run this script again');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // Export Users
    console.log('📤 Exporting users...');
    const users = await sqlitePrisma.user.findMany();
    const { error: userError } = await supabase
      .from('User')
      .insert(users);
    if (userError) throw userError;
    console.log(`✅ Exported ${users.length} users`);

    // Export Leagues
    console.log('📤 Exporting leagues...');
    const leagues = await sqlitePrisma.league.findMany();
    const { error: leagueError } = await supabase
      .from('League')
      .insert(leagues);
    if (leagueError) throw leagueError;
    console.log(`✅ Exported ${leagues.length} leagues`);

    // Export Players in batches
    console.log('📤 Exporting players...');
    const players = await sqlitePrisma.player.findMany();
    const batchSize = 500;
    
    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);
      const { error } = await supabase
        .from('Player')
        .insert(batch);
      if (error) throw error;
      console.log(`✅ Exported ${i + batch.length}/${players.length} players`);
    }

    console.log('\\n🎉 EXPORT COMPLETE!');
    console.log(`📊 Total players exported: ${players.length}`);
    console.log('🚀 Your Supabase database is ready for production!');

  } catch (error) {
    console.error('❌ Export failed:', error);
    console.log('\\n💡 TIP: Make sure you have created the tables in Supabase first!');
    console.log('You can use the Prisma schema to generate SQL for Supabase.');
  } finally {
    await sqlitePrisma.$disconnect();
  }
}

// Quick setup instructions
console.log('\\n📋 QUICK SUPABASE SETUP:');
console.log('========================');
console.log('1. Create free account at https://supabase.com');
console.log('2. Create new project (takes ~2 minutes)');
console.log('3. Go to SQL Editor and run our schema');
console.log('4. Get credentials from Settings > API');
console.log('5. Run: npm install @supabase/supabase-js');
console.log('6. Set environment variables and run this script');
console.log('\\nEstimated time: 5-10 minutes');

exportToSupabase();