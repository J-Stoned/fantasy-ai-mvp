#!/usr/bin/env node

/**
 * 🔧 SUPABASE ENVIRONMENT SETUP HELPER
 * Mission: "Either we know it or we don't... yet!"
 * 
 * This script helps users configure their Supabase environment variables
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

class SupabaseEnvSetup {
  constructor() {
    this.envPath = path.join(process.cwd(), '.env.local');
    this.config = {};
  }

  async setup() {
    console.log('🚀 FANTASY.AI SUPABASE ENVIRONMENT SETUP');
    console.log('=========================================');
    console.log('');
    console.log('This script will help you configure Supabase for Fantasy.AI production deployment.');
    console.log('You need to have created a Supabase project first.');
    console.log('');
    console.log('📋 Prerequisites:');
    console.log('1. Supabase account created at https://supabase.com');
    console.log('2. New project created in Supabase dashboard');
    console.log('3. Project credentials available');
    console.log('');

    const hasProject = await ask('Do you have a Supabase project ready? (y/n): ');
    if (hasProject.toLowerCase() !== 'y') {
      console.log('');
      console.log('🛠️ Please create a Supabase project first:');
      console.log('1. Go to https://supabase.com/dashboard');
      console.log('2. Click "New Project"');
      console.log('3. Fill in project details');
      console.log('4. Wait for project to be created');
      console.log('5. Come back and run this script again');
      console.log('');
      process.exit(0);
    }

    console.log('');
    console.log('📡 Enter your Supabase project details:');
    console.log('(You can find these in Settings → API)');
    console.log('');

    // Get project URL
    this.config.supabaseUrl = await ask('Project URL (https://xxx.supabase.co): ');
    if (!this.config.supabaseUrl.startsWith('https://') || !this.config.supabaseUrl.includes('.supabase.co')) {
      console.log('❌ Invalid URL format. Should be: https://your-project-ref.supabase.co');
      process.exit(1);
    }

    // Extract project ref
    const projectRef = this.config.supabaseUrl.match(/https:\/\/([a-zA-Z0-9]+)\.supabase\.co/)?.[1];
    if (!projectRef) {
      console.log('❌ Could not extract project reference from URL');
      process.exit(1);
    }

    // Get anon key
    this.config.anonKey = await ask('Anon public key (starts with eyJhbGciOiJIUzI1NiI...): ');
    if (!this.config.anonKey.startsWith('eyJ')) {
      console.log('❌ Invalid anon key format. Should start with eyJ');
      process.exit(1);
    }

    // Get service role key
    this.config.serviceRoleKey = await ask('Service role key (starts with eyJhbGciOiJIUzI1NiI...): ');
    if (!this.config.serviceRoleKey.startsWith('eyJ')) {
      console.log('❌ Invalid service role key format. Should start with eyJ');
      process.exit(1);
    }

    // Get database password
    this.config.dbPassword = await ask('Database password (from your project creation): ');
    if (!this.config.dbPassword || this.config.dbPassword.length < 8) {
      console.log('❌ Database password is required and should be at least 8 characters');
      process.exit(1);
    }

    // Generate database URLs
    this.config.databaseUrl = `postgresql://postgres.${projectRef}:${this.config.dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
    this.config.directUrl = `postgresql://postgres.${projectRef}:${this.config.dbPassword}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;

    console.log('');
    console.log('✅ Configuration collected successfully!');
    console.log('');

    // Show configuration summary
    console.log('📋 Configuration Summary:');
    console.log(`   Project URL: ${this.config.supabaseUrl}`);
    console.log(`   Project Ref: ${projectRef}`);
    console.log(`   Anon Key: ${this.config.anonKey.substring(0, 20)}...`);
    console.log(`   Service Key: ${this.config.serviceRoleKey.substring(0, 20)}...`);
    console.log(`   Database URL: postgresql://postgres.${projectRef}:*****@aws-0-us-east-1.pooler.supabase.com:6543/postgres`);
    console.log('');

    const confirm = await ask('Update .env.local with these values? (y/n): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('❌ Setup cancelled');
      process.exit(0);
    }

    await this.updateEnvFile(projectRef);
    await this.runDeployment();

    rl.close();
  }

  async updateEnvFile(projectRef) {
    console.log('');
    console.log('📝 Updating .env.local file...');

    let envContent = '';

    // Read existing env file if it exists
    if (fs.existsSync(this.envPath)) {
      envContent = fs.readFileSync(this.envPath, 'utf8');
    }

    // Update or add Supabase configuration
    const supabaseConfig = `
# 🗄️ SUPABASE PRODUCTION DATABASE (79 TABLES)
DATABASE_URL="${this.config.databaseUrl}"
DIRECT_URL="${this.config.directUrl}"

# Supabase Configuration (PRODUCTION READY)
NEXT_PUBLIC_SUPABASE_URL="${this.config.supabaseUrl}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${this.config.anonKey}"
SUPABASE_SERVICE_ROLE_KEY="${this.config.serviceRoleKey}"

# Supabase Production Features
SUPABASE_MCP_ENABLED=true
SUPABASE_REALTIME_ENABLED=true
SUPABASE_RLS_ENABLED=true
SUPABASE_PROJECT_REF="${projectRef}"
`;

    // Remove old Supabase config if exists
    envContent = envContent.replace(/# 🗄️ SUPABASE.*?SUPABASE_PROJECT_REF=".*?"/s, '');
    envContent = envContent.replace(/# Database \(PostgreSQL.*?DATABASE_URL=".*?"/s, '');

    // Add new configuration
    envContent = envContent.trim() + '\n' + supabaseConfig;

    fs.writeFileSync(this.envPath, envContent);
    console.log('✅ .env.local updated successfully');
  }

  async runDeployment() {
    console.log('');
    console.log('🚀 Ready to deploy 79-table schema to Supabase!');
    console.log('');
    
    const deploy = await ask('Deploy now? (y/n): ');
    if (deploy.toLowerCase() === 'y') {
      console.log('');
      console.log('🎯 Starting deployment...');
      
      // Import and run the deployment
      try {
        const { SupabaseDeploymentExecutor } = require('./execute-supabase-deployment.js');
        const executor = new SupabaseDeploymentExecutor();
        const result = await executor.executeDeployment();
        
        if (result.success) {
          console.log('');
          console.log('🎉 DEPLOYMENT SUCCESSFUL!');
          console.log('Fantasy.AI is ready for production with Supabase!');
          console.log('');
          console.log('Next steps:');
          console.log('1. 🌍 Deploy web app: npm run deploy:production');
          console.log('2. 📱 Test mobile app: npm run mobile:dev');
          console.log('3. 🔧 Populate real data: npm run populate-database');
        } else {
          console.log('');
          console.log('❌ Deployment had issues. Check the errors above.');
        }
      } catch (error) {
        console.error('❌ Deployment failed:', error.message);
      }
    } else {
      console.log('');
      console.log('⏸️ Deployment skipped. You can run it later with:');
      console.log('   npm run deploy:supabase');
    }
  }
}

// Main execution
async function main() {
  const setup = new SupabaseEnvSetup();
  await setup.setup();
}

main().catch(console.error);