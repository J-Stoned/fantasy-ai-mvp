#!/usr/bin/env node

/**
 * 🧪 FANTASY.AI DATABASE CONNECTION TESTER
 * 
 * This script tests the current database connection and provides
 * actionable steps to fix any issues found.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function loadEnvVariables() {
  const envPath = path.join(__dirname, '../.env.local');
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    // Parse environment variables
    const lines = envContent.split('\n');
    for (const line of lines) {
      if (line.includes('=') && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        let value = valueParts.join('=');
        
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        
        envVars[key.trim()] = value.trim();
      }
    }
    
    return envVars;
  } catch (error) {
    logError(`Failed to load environment variables: ${error.message}`);
    return null;
  }
}

async function testSupabaseConnection(url, key) {
  try {
    logInfo('Testing Supabase connection...');
    
    const supabase = createClient(url, key);
    
    // Test a simple query
    const { data, error } = await supabase
      .from('pg_stat_database')
      .select('datname')
      .limit(1);
    
    if (error) {
      throw new Error(`Supabase query error: ${error.message}`);
    }
    
    logSuccess('Supabase connection test passed!');
    return true;
  } catch (error) {
    logError(`Supabase connection failed: ${error.message}`);
    return false;
  }
}

async function testDatabaseTables(url, key) {
  try {
    logInfo('Checking database tables...');
    
    const supabase = createClient(url, key);
    
    // Get list of tables
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error) {
      throw new Error(`Table query error: ${error.message}`);
    }
    
    const tableCount = data ? data.length : 0;
    logInfo(`Found ${tableCount} tables in the database`);
    
    if (tableCount === 0) {
      logWarning('No tables found. Schema needs to be deployed.');
    } else if (tableCount < 70) {
      logWarning(`Expected 79+ tables, found ${tableCount}. Schema may be incomplete.`);
    } else {
      logSuccess(`Table count looks good: ${tableCount} tables found`);
    }
    
    return { tableCount, tables: data };
  } catch (error) {
    logError(`Table check failed: ${error.message}`);
    return { tableCount: 0, tables: [] };
  }
}

async function generateNewCredentials() {
  log('\n🔧 GENERATING NEW SUPABASE PROJECT CREDENTIALS', 'bright');
  log('Since the current credentials are invalid, here are the steps to create a new project:', 'yellow');
  
  log('\n1. Go to https://supabase.com/dashboard', 'cyan');
  log('2. Click "New Project"', 'cyan');
  log('3. Project Name: "Fantasy-AI-Production"', 'cyan');
  log('4. Region: US East (recommended for sports data)', 'cyan');
  log('5. Create a strong database password', 'cyan');
  log('6. Select Pro tier for production use', 'cyan');
  log('7. Wait 2-3 minutes for project creation', 'cyan');
  
  log('\n8. Once created, go to Settings > API and collect:', 'cyan');
  log('   • Project URL', 'magenta');
  log('   • anon/public API key', 'magenta');
  log('   • service_role API key', 'magenta');
  
  log('\n9. Update your .env.local file with the new credentials', 'cyan');
  log('10. Run: node scripts/setup-new-supabase-project.js', 'cyan');
}

async function main() {
  log('\n🧪 FANTASY.AI DATABASE CONNECTION TEST', 'bright');
  log('='.repeat(50), 'cyan');
  
  // Load environment variables
  const envVars = await loadEnvVariables();
  if (!envVars) {
    logError('Could not load environment variables');
    return;
  }
  
  const {
    DATABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_PROJECT_REF
  } = envVars;
  
  log(`\n📋 CURRENT CONFIGURATION:`, 'bright');
  logInfo(`Project Reference: ${SUPABASE_PROJECT_REF}`);
  logInfo(`Supabase URL: ${NEXT_PUBLIC_SUPABASE_URL}`);
  logInfo(`Database URL: ${DATABASE_URL ? 'Present' : 'Missing'}`);
  logInfo(`Anon Key: ${NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing'}`);
  logInfo(`Service Role Key: ${SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing'}`);
  
  if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    logError('Missing required Supabase credentials');
    await generateNewCredentials();
    return;
  }
  
  // Test Supabase connection
  log(`\n🔗 TESTING CONNECTIONS:`, 'bright');
  const supabaseWorking = await testSupabaseConnection(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  );
  
  if (supabaseWorking) {
    // Test database tables
    const { tableCount, tables } = await testDatabaseTables(
      NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );
    
    if (tableCount === 0) {
      log(`\n🏗️  SCHEMA DEPLOYMENT NEEDED:`, 'bright');
      logInfo('Your database connection works, but no tables are present.');
      logInfo('Run the following commands to deploy the schema:');
      log('   npm run db:generate', 'yellow');
      log('   npx prisma db push --accept-data-loss', 'yellow');
    } else {
      log(`\n🎉 DATABASE STATUS: READY!`, 'bright');
      logSuccess('Database connection is working');
      logSuccess(`${tableCount} tables are present`);
      logSuccess('Ready for Fantasy.AI production use!');
      
      if (tables && tables.length > 0) {
        log(`\n📊 SAMPLE TABLES:`, 'bright');
        tables.slice(0, 10).forEach(table => {
          log(`   • ${table.table_name}`, 'cyan');
        });
        if (tableCount > 10) {
          log(`   ... and ${tableCount - 10} more tables`, 'cyan');
        }
      }
    }
  } else {
    logError('Database connection failed');
    await generateNewCredentials();
  }
}

// Run the test
if (require.main === module) {
  main().catch(error => {
    logError(`Test failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main, testSupabaseConnection, testDatabaseTables };