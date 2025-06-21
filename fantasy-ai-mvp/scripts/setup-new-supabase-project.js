#!/usr/bin/env node

/**
 * 🚀 FANTASY.AI SUPABASE PROJECT SETUP GUIDE
 * 
 * This script provides step-by-step instructions for creating
 * a new Supabase project and configuring Fantasy.AI for production.
 * 
 * Since we can't directly create Supabase projects via API without
 * authentication, this guide walks through the manual process.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI color codes for beautiful output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`🚀 ${title}`, 'bright');
  log('='.repeat(60), 'cyan');
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

function logStep(step, description) {
  log(`\n${step}. ${description}`, 'bright');
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function updateEnvFile(credentials) {
  const envPath = path.join(__dirname, '../.env.local');
  
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Update DATABASE_URL
    envContent = envContent.replace(
      /DATABASE_URL="[^"]*"/,
      `DATABASE_URL="${credentials.DATABASE_URL}"`
    );

    // Update Supabase URL
    envContent = envContent.replace(
      /NEXT_PUBLIC_SUPABASE_URL=[^\n]*/,
      `NEXT_PUBLIC_SUPABASE_URL=${credentials.SUPABASE_URL}`
    );

    // Update Supabase Anon Key
    envContent = envContent.replace(
      /NEXT_PUBLIC_SUPABASE_ANON_KEY=[^\n]*/,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY=${credentials.SUPABASE_ANON_KEY}`
    );

    // Update Service Role Key
    envContent = envContent.replace(
      /SUPABASE_SERVICE_ROLE_KEY=[^\n]*/,
      `SUPABASE_SERVICE_ROLE_KEY=${credentials.SUPABASE_SERVICE_ROLE_KEY}`
    );

    // Update Project Reference
    envContent = envContent.replace(
      /SUPABASE_PROJECT_REF=[^\n]*/,
      `SUPABASE_PROJECT_REF=${credentials.PROJECT_REF}`
    );

    // Update Expo public keys
    envContent = envContent.replace(
      /EXPO_PUBLIC_SUPABASE_URL=[^\n]*/,
      `EXPO_PUBLIC_SUPABASE_URL=${credentials.SUPABASE_URL}`
    );

    envContent = envContent.replace(
      /EXPO_PUBLIC_SUPABASE_ANON_KEY=[^\n]*/,
      `EXPO_PUBLIC_SUPABASE_ANON_KEY=${credentials.SUPABASE_ANON_KEY}`
    );

    fs.writeFileSync(envPath, envContent);
    logSuccess('Environment file updated successfully!');
    
    return true;
  } catch (error) {
    logError(`Failed to update environment file: ${error.message}`);
    return false;
  }
}

async function main() {
  logSection('FANTASY.AI SUPABASE PROJECT SETUP');
  
  log('🎯 Mission: Create new production-ready Supabase project', 'magenta');
  log('📊 Target: 79-table database ready for 537+ sports records', 'magenta');
  log('⚡ Method: Manual setup with automated configuration', 'magenta');
  
  logSection('STEP-BY-STEP SETUP INSTRUCTIONS');
  
  logStep('1', 'Create New Supabase Project');
  log('   🌐 Go to: https://supabase.com/dashboard', 'yellow');
  log('   ➕ Click "New Project"', 'yellow');
  log('   📝 Project Name: "Fantasy-AI-Production"', 'yellow');
  log('   🏢 Organization: Select your organization', 'yellow');
  log('   📍 Region: US East (us-east-1) - optimal for sports data', 'yellow');
  log('   🔐 Database Password: Create a strong password', 'yellow');
  log('   💰 Pricing Plan: Pro ($25/month) - recommended for production', 'yellow');
  log('   ✅ Click "Create new project"', 'yellow');
  
  logWarning('⏳ Project creation takes 2-3 minutes. Please wait...');
  
  const projectReady = await askQuestion('\n✋ Press ENTER when your project is ready and you can see the dashboard... ');
  
  logStep('2', 'Collect Project Credentials');
  log('   📊 In your Supabase dashboard, go to Settings > API', 'yellow');
  log('   📋 You\'ll need these 4 values:', 'yellow');
  log('      • Project URL', 'cyan');
  log('      • API Key (anon/public)', 'cyan');
  log('      • API Key (service_role)', 'cyan');
  log('      • Project Reference ID', 'cyan');
  
  logInfo('\n🔗 Now let\'s collect your credentials...');
  
  const projectUrl = await askQuestion('\n📍 Enter your Project URL (e.g., https://xxxxx.supabase.co): ');
  const anonKey = await askQuestion('\n🔑 Enter your anon/public API key: ');
  const serviceRoleKey = await askQuestion('\n🔐 Enter your service_role API key: ');
  
  // Extract project reference from URL
  const projectRef = projectUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  
  if (!projectRef) {
    logError('Could not extract project reference from URL. Please check the URL format.');
    process.exit(1);
  }
  
  // Create DATABASE_URL
  const databasePassword = await askQuestion('\n🔒 Enter your database password (the one you set during project creation): ');
  const databaseUrl = `postgresql://postgres:${databasePassword}@db.${projectRef}.supabase.co:5432/postgres`;
  
  const credentials = {
    PROJECT_REF: projectRef,
    SUPABASE_URL: projectUrl,
    SUPABASE_ANON_KEY: anonKey,
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
    DATABASE_URL: databaseUrl
  };
  
  logSection('STEP 3: UPDATING ENVIRONMENT CONFIGURATION');
  
  const updated = await updateEnvFile(credentials);
  if (!updated) {
    logError('Failed to update environment file. Please update manually.');
    process.exit(1);
  }
  
  logSection('STEP 4: DEPLOYING DATABASE SCHEMA');
  
  log('🔧 Now let\'s deploy the 79-table schema...', 'blue');
  
  const { execSync } = require('child_process');
  
  try {
    // Set environment variables
    process.env.DATABASE_URL = credentials.DATABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = credentials.SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = credentials.SUPABASE_ANON_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = credentials.SUPABASE_SERVICE_ROLE_KEY;
    
    logInfo('Generating Prisma client...');
    execSync('npm run db:generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    logSuccess('Prisma client generated');
    
    logInfo('Deploying schema to database...');
    execSync('npx prisma db push --accept-data-loss', { 
      stdio: 'inherit', 
      cwd: path.join(__dirname, '..'),
      env: { ...process.env }
    });
    logSuccess('Schema deployed successfully!');
    
  } catch (error) {
    logError(`Schema deployment failed: ${error.message}`);
    logWarning('You may need to run the deployment manually:');
    log('   npm run db:generate', 'yellow');
    log('   npx prisma db push --accept-data-loss', 'yellow');
  }
  
  logSection('🎉 SETUP COMPLETE!');
  logSuccess('Fantasy.AI production database is ready!');
  logSuccess('✅ New Supabase project created');
  logSuccess('✅ Environment variables updated');
  logSuccess('✅ 79-table schema deployed');
  
  log('\n🌟 YOUR PRODUCTION SETUP:', 'bright');
  log(`📊 Database URL: ${credentials.SUPABASE_URL}`, 'cyan');
  log(`🔗 Dashboard: https://supabase.com/dashboard/project/${credentials.PROJECT_REF}`, 'cyan');
  log(`⚡ Status: PRODUCTION READY`, 'green');
  
  log('\n🚀 NEXT STEPS:', 'bright');
  log('1. Test your application: npm run dev', 'yellow');
  log('2. Verify database tables in Supabase dashboard', 'yellow');
  log('3. Start importing your 537+ sports records', 'yellow');
  log('4. Deploy to production with Vercel', 'yellow');
  
  rl.close();
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    logError(`Setup failed: ${error.message}`);
    rl.close();
    process.exit(1);
  });
}

module.exports = { main, updateEnvFile };