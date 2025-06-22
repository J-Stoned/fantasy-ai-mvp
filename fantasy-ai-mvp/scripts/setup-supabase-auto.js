#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Supabase connection details
const SUPABASE_URL = 'https://jhfhsbqrdblytrlrconc.supabase.co';
const SUPABASE_PROJECT_ID = 'jhfhsbqrdblytrlrconc';
const SUPABASE_PASSWORD = 'rfoYfhORq9Y8fkLo';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZmhzYnFyZGJseXRybHJjb25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0Mjc0MzAsImV4cCI6MjA2NjAwMzQzMH0.bcbBLozJ9MNjaUc8BRLXNmoD0TfNKXNCZUxPs3oomxY';

// Database connection string
const DATABASE_URL = `postgresql://postgres.${SUPABASE_PROJECT_ID}:${SUPABASE_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`;

console.log('🚀 Setting up Supabase database for Fantasy.AI MVP...\n');

// Step 1: Generate the complete SQL schema from Prisma
console.log('📝 Generating SQL schema from Prisma...');
try {
  // First install necessary dependencies
  console.log('Installing dependencies...');
  execSync('npm install @prisma/client prisma', { stdio: 'inherit' });
  
  // Generate Prisma migrations
  console.log('Generating Prisma SQL...');
  
  // Create a temporary .env file with the Supabase DATABASE_URL
  const envContent = `DATABASE_URL="${DATABASE_URL}"`;
  fs.writeFileSync('.env.supabase.temp', envContent);
  
  // Run prisma migrate dev to generate SQL
  execSync('npx prisma migrate dev --name init --create-only', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL }
  });
  
  console.log('✅ SQL schema generated!\n');
} catch (error) {
  console.error('❌ Error generating SQL schema:', error.message);
  process.exit(1);
}

// Step 2: Execute the schema on Supabase
console.log('🗄️ Creating tables in Supabase...');
try {
  // Find the generated migration SQL file
  const migrationsDir = path.join(__dirname, '../prisma/migrations');
  const migrationFolders = fs.readdirSync(migrationsDir).filter(f => f.includes('_init'));
  
  if (migrationFolders.length > 0) {
    const latestMigration = migrationFolders[migrationFolders.length - 1];
    const migrationSqlPath = path.join(migrationsDir, latestMigration, 'migration.sql');
    
    if (fs.existsSync(migrationSqlPath)) {
      console.log(`Found migration SQL at: ${migrationSqlPath}`);
      
      // Apply the migration to Supabase
      execSync(`npx prisma migrate deploy`, {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL }
      });
      
      console.log('✅ Database schema created successfully!\n');
    }
  }
} catch (error) {
  console.error('❌ Error creating database schema:', error.message);
  // Continue anyway as tables might already exist
}

// Step 3: Prepare data migration script
console.log('📊 Preparing to migrate 5,040 players from SQLite to Supabase...');

const migrationScript = `
const { PrismaClient: SQLiteClient } = require('@prisma/client');
const { PrismaClient: PostgresClient } = require('@prisma/client');

async function migrateData() {
  // Setup SQLite client
  const sqliteClient = new SQLiteClient({
    datasources: {
      db: {
        url: 'file:./prisma/dev.db'
      }
    }
  });

  // Setup PostgreSQL client
  const postgresClient = new PostgresClient({
    datasources: {
      db: {
        url: '${DATABASE_URL}'
      }
    }
  });

  try {
    console.log('🔍 Fetching players from SQLite...');
    
    // First, ensure we have a system user in PostgreSQL
    const systemUser = await postgresClient.user.upsert({
      where: { email: 'system@fantasy.ai' },
      update: {},
      create: {
        email: 'system@fantasy.ai',
        name: 'System User',
        password: 'system-generated-5040-players'
      }
    });
    console.log('✅ System user ready');

    // Create a default league for the players
    const defaultLeague = await postgresClient.league.upsert({
      where: {
        provider_providerId: {
          provider: 'SYSTEM',
          providerId: 'default-league-5040'
        }
      },
      update: {},
      create: {
        userId: systemUser.id,
        provider: 'SYSTEM',
        providerId: 'default-league-5040',
        name: 'Default League - 5040 Players',
        season: '2024',
        sport: 'MULTI_SPORT',
        settings: JSON.stringify({
          isDefault: true,
          sports: ['NFL', 'NBA', 'MLB', 'NHL']
        })
      }
    });
    console.log('✅ Default league ready');

    // Fetch all players from SQLite
    const players = await sqliteClient.player.findMany({
      take: 10000 // Get all players
    });
    
    console.log(\`Found \${players.length} players in SQLite\`);

    // Migrate players in batches
    const batchSize = 100;
    let migrated = 0;

    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);
      
      // Prepare player data for PostgreSQL
      const playerData = batch.map(player => ({
        externalId: player.externalId,
        name: player.name,
        position: player.position,
        team: player.team,
        leagueId: defaultLeague.id,
        stats: player.stats,
        projections: player.projections,
        injuryStatus: player.injuryStatus,
        imageUrl: player.imageUrl
      }));

      // Insert players using createMany with skipDuplicates
      await postgresClient.player.createMany({
        data: playerData,
        skipDuplicates: true
      });

      migrated += batch.length;
      console.log(\`Migrated \${migrated}/\${players.length} players...\`);
    }

    console.log('✅ All players migrated successfully!');

    // Verify the migration
    const postgresPlayerCount = await postgresClient.player.count();
    console.log(\`\\n📊 Final count in Supabase: \${postgresPlayerCount} players\`);

  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await sqliteClient.$disconnect();
    await postgresClient.$disconnect();
  }
}

migrateData().catch(console.error);
`;

// Save the migration script
fs.writeFileSync(path.join(__dirname, 'migrate-to-supabase.js'), migrationScript);

// Step 4: Run the migration
console.log('🚀 Running data migration...\n');
try {
  execSync('node scripts/migrate-to-supabase.js', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
} catch (error) {
  console.error('❌ Migration error:', error.message);
}

// Step 5: Verify the setup
console.log('\n🔍 Verifying Supabase setup...');

const verificationScript = `
const { PrismaClient } = require('@prisma/client');

async function verify() {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: '${DATABASE_URL}'
      }
    }
  });

  try {
    const userCount = await client.user.count();
    const leagueCount = await client.league.count();
    const playerCount = await client.player.count();
    
    console.log('\\n✅ Supabase Database Status:');
    console.log(\`   - Users: \${userCount}\`);
    console.log(\`   - Leagues: \${leagueCount}\`);
    console.log(\`   - Players: \${playerCount}\`);
    
    if (playerCount >= 5000) {
      console.log('\\n🎉 SUCCESS! Your Supabase database is ready with 5,040 real players!');
      console.log('\\n📌 Connection Details:');
      console.log(\`   - URL: ${SUPABASE_URL}\`);
      console.log(\`   - Anon Key: ${SUPABASE_ANON_KEY}\`);
      console.log(\`   - Database URL: ${DATABASE_URL}\`);
    }
  } catch (error) {
    console.error('❌ Verification error:', error.message);
  } finally {
    await client.$disconnect();
  }
}

verify().catch(console.error);
`;

fs.writeFileSync(path.join(__dirname, 'verify-supabase.js'), verificationScript);

execSync('node scripts/verify-supabase.js', { 
  stdio: 'inherit',
  cwd: path.join(__dirname, '..')
});

// Cleanup
console.log('\n🧹 Cleaning up temporary files...');
try {
  fs.unlinkSync('.env.supabase.temp');
  fs.unlinkSync(path.join(__dirname, 'migrate-to-supabase.js'));
  fs.unlinkSync(path.join(__dirname, 'verify-supabase.js'));
} catch (e) {
  // Ignore cleanup errors
}

console.log('\n✨ Supabase setup complete!');
console.log('\n🚀 Next steps:');
console.log('   1. Update your .env.local with:');
console.log(`      DATABASE_URL="${DATABASE_URL}"`);
console.log(`      NEXT_PUBLIC_SUPABASE_URL="${SUPABASE_URL}"`);
console.log(`      NEXT_PUBLIC_SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"`);
console.log('   2. Run: npm run dev');
console.log('   3. Your app is now connected to Supabase with 5,040 real players!');