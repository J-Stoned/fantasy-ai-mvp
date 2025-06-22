/**
 * 🚀 MIGRATE TO SUPABASE
 * Transfer all 5,040 players from SQLite to Supabase
 */

import { PrismaClient as SqliteClient } from '@prisma/client';
import { PrismaClient as PostgresClient } from '@prisma/client';
import { config } from 'dotenv';

config({ path: '.env.local' });

// SQLite source database - using the correct path
const sqliteDb = new SqliteClient({
  datasources: {
    db: {
      url: 'file:./prisma/prisma/dev.db'
    }
  }
});

// Supabase PostgreSQL target database
const supabaseDb = new PostgresClient({
  datasources: {
    db: {
      url: process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

async function migrateToSupabase() {
  console.log('🚀 Starting migration to Supabase...\n');

  try {
    // 1. Get all players from SQLite
    console.log('📊 Reading players from SQLite...');
    const players = await sqliteDb.player.findMany({
      include: {
        team: true
      }
    });
    console.log(`✅ Found ${players.length} players to migrate\n`);

    // 2. Get unique teams
    const teams = await sqliteDb.team.findMany();
    console.log(`📋 Found ${teams.length} teams\n`);

    // 3. Create teams in Supabase first
    console.log('🏢 Creating teams in Supabase...');
    for (const team of teams) {
      try {
        await supabaseDb.team.upsert({
          where: { id: team.id },
          update: {},
          create: {
            id: team.id,
            name: team.name,
            abbreviation: team.abbreviation,
            city: team.city,
            logo: team.logo,
            primaryColor: team.primaryColor,
            secondaryColor: team.secondaryColor
          }
        });
      } catch (error) {
        console.log(`⚠️ Team ${team.name} might already exist`);
      }
    }
    console.log('✅ Teams created\n');

    // 4. Create system user if needed
    console.log('👤 Creating system user...');
    const systemUser = await supabaseDb.user.upsert({
      where: { email: 'system@fantasy.ai' },
      update: {},
      create: {
        email: 'system@fantasy.ai',
        name: 'System',
        id: 'system-user'
      }
    });
    console.log('✅ System user ready\n');

    // 5. Migrate players in batches
    console.log('🏃 Migrating players to Supabase...');
    const batchSize = 100;
    let migrated = 0;

    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);
      
      await supabaseDb.player.createMany({
        data: batch.map(player => ({
          id: player.id,
          name: player.name,
          position: player.position,
          teamId: player.teamId,
          jerseyNumber: player.jerseyNumber,
          height: player.height,
          weight: player.weight,
          age: player.age,
          experience: player.experience,
          college: player.college,
          status: player.status,
          injuryStatus: player.injuryStatus,
          photoUrl: player.photoUrl,
          stats: player.stats,
          weeklyProjections: player.weeklyProjections,
          seasonProjection: player.seasonProjection,
          adpRank: player.adpRank,
          positionRank: player.positionRank,
          tier: player.tier,
          byeWeek: player.byeWeek,
          lastUpdated: player.lastUpdated,
          createdById: systemUser.id,
          league: player.league
        })),
        skipDuplicates: true
      });

      migrated += batch.length;
      console.log(`📊 Progress: ${migrated}/${players.length} players`);
    }

    console.log('\n✅ Migration complete!');
    console.log(`🎉 Successfully migrated ${players.length} players to Supabase!`);

    // 6. Verify migration
    const supabaseCount = await supabaseDb.player.count();
    console.log(`\n🔍 Verification: ${supabaseCount} players in Supabase`);

    // Show breakdown by league
    const breakdown = await supabaseDb.player.groupBy({
      by: ['league'],
      _count: true
    });

    console.log('\n📊 Players by league:');
    breakdown.forEach(league => {
      console.log(`   ${league.league}: ${league._count} players`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sqliteDb.$disconnect();
    await supabaseDb.$disconnect();
  }
}

// Run migration
migrateToSupabase();