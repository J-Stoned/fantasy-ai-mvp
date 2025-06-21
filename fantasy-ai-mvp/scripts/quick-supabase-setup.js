#!/usr/bin/env node

/**
 * ⚡ FANTASY.AI QUICK SUPABASE SETUP
 * 
 * The fastest way to get Fantasy.AI production database running!
 * This script will guide you through creating a new Supabase project
 * and automatically configure your environment.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// ANSI colors
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

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function updateEnvironment(credentials) {
  const envPath = path.join(__dirname, '../.env.local');
  
  try {
    let content = fs.readFileSync(envPath, 'utf8');
    
    // Update all Supabase-related environment variables
    content = content.replace(/DATABASE_URL="[^"]*"/, `DATABASE_URL="${credentials.databaseUrl}"`);
    content = content.replace(/NEXT_PUBLIC_SUPABASE_URL=[^\n]*/, `NEXT_PUBLIC_SUPABASE_URL=${credentials.projectUrl}`);
    content = content.replace(/NEXT_PUBLIC_SUPABASE_ANON_KEY=[^\n]*/, `NEXT_PUBLIC_SUPABASE_ANON_KEY=${credentials.anonKey}`);
    content = content.replace(/SUPABASE_SERVICE_ROLE_KEY=[^\n]*/, `SUPABASE_SERVICE_ROLE_KEY=${credentials.serviceKey}`);
    content = content.replace(/SUPABASE_PROJECT_REF=[^\n]*/, `SUPABASE_PROJECT_REF=${credentials.projectRef}`);
    content = content.replace(/EXPO_PUBLIC_SUPABASE_URL=[^\n]*/, `EXPO_PUBLIC_SUPABASE_URL=${credentials.projectUrl}`);
    content = content.replace(/EXPO_PUBLIC_SUPABASE_ANON_KEY=[^\n]*/, `EXPO_PUBLIC_SUPABASE_ANON_KEY=${credentials.anonKey}`);
    
    fs.writeFileSync(envPath, content);
    logSuccess('Environment file updated!');
    return true;
  } catch (error) {
    logError(`Failed to update environment: ${error.message}`);
    return false;
  }
}

async function deploySchema(databaseUrl) {
  try {
    logInfo('Deploying 79-table schema...');
    
    // Set environment for Prisma
    process.env.DATABASE_URL = databaseUrl;
    
    const projectRoot = path.join(__dirname, '..');
    
    // Generate Prisma client
    execSync('npm run db:generate', { stdio: 'inherit', cwd: projectRoot });
    logSuccess('Prisma client generated');
    
    // Deploy schema
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', cwd: projectRoot });
    logSuccess('Schema deployed to production database!');
    
    return true;
  } catch (error) {
    logError(`Schema deployment failed: ${error.message}`);
    return false;
  }
}

async function main() {
  log('\n⚡ FANTASY.AI QUICK SUPABASE SETUP', 'bright');
  log('=' .repeat(50), 'cyan');
  
  log('\n🎯 STEP 1: CREATE SUPABASE PROJECT', 'bright');
  log('Go to: https://supabase.com/dashboard/new', 'yellow');
  log('Project Name: Fantasy-AI-Production', 'cyan');
  log('Region: US East (us-east-1)', 'cyan');
  log('Database Password: Create a strong password', 'cyan');
  log('Pricing: Pro ($25/month recommended)', 'cyan');
  
  await ask('\n✋ Press ENTER when your project is created and ready...');
  
  log('\n🔑 STEP 2: COLLECT CREDENTIALS', 'bright');
  log('Go to: Settings → API in your Supabase dashboard', 'yellow');
  
  // Collect credentials
  const projectUrl = await ask('\n📍 Enter Project URL (https://xxxxx.supabase.co): ');
  const anonKey = await ask('🔓 Enter anon key: ');
  const serviceKey = await ask('🔐 Enter service_role key: ');
  const dbPassword = await ask('🔒 Enter database password (from step 1): ');
  
  // Extract project reference
  const projectRef = projectUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!projectRef) {
    logError('Invalid project URL format');
    process.exit(1);
  }
  
  // Build database URL
  const databaseUrl = `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`;
  
  const credentials = {
    projectUrl,
    projectRef,
    anonKey,
    serviceKey,
    databaseUrl
  };
  
  log('\n⚙️ STEP 3: UPDATING CONFIGURATION', 'bright');
  const updated = await updateEnvironment(credentials);
  if (!updated) {
    logError('Failed to update configuration');
    process.exit(1);
  }
  
  log('\n🗄️ STEP 4: DEPLOYING DATABASE SCHEMA', 'bright');
  const deployed = await deploySchema(databaseUrl);
  if (!deployed) {
    logError('Schema deployment failed - check your credentials');
    process.exit(1);
  }
  
  log('\n🎉 FANTASY.AI PRODUCTION DATABASE IS LIVE!', 'bright');
  logSuccess('✅ Supabase project created');
  logSuccess('✅ Environment configured');
  logSuccess('✅ 79-table schema deployed');
  logSuccess('✅ Ready for 537+ sports records!');
  
  log('\n🌟 YOUR PRODUCTION SETUP:', 'bright');
  log(`📊 Project: ${projectUrl}`, 'cyan');
  log(`🎛️ Dashboard: https://supabase.com/dashboard/project/${projectRef}`, 'cyan');
  log(`⚡ Status: PRODUCTION READY`, 'green');
  
  log('\n🚀 NEXT STEPS:', 'bright');
  log('1. Test your app: npm run dev', 'yellow');
  log('2. Import sports data', 'yellow');
  log('3. Deploy to production', 'yellow');
  
  rl.close();
}

// Run the setup
if (require.main === module) {
  main().catch(error => {
    logError(`Setup failed: ${error.message}`);
    rl.close();
    process.exit(1);
  });
}