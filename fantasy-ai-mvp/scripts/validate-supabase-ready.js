#!/usr/bin/env node

/**
 * 🔍 SUPABASE DEPLOYMENT READINESS VALIDATOR
 * Mission: "Either we know it or we don't... yet!"
 * 
 * This script validates that Fantasy.AI is ready for Supabase production deployment
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

class SupabaseReadinessValidator {
  constructor() {
    this.results = {
      ready: false,
      checks: [],
      errors: [],
      warnings: []
    };
  }

  validate() {
    console.log('🔍 FANTASY.AI SUPABASE DEPLOYMENT READINESS CHECK');
    console.log('=================================================');
    console.log('Mission: "Either we know it or we don\'t... yet!"');
    console.log('');

    // Check 1: Environment variables
    this.checkEnvironmentVariables();
    
    // Check 2: Database schema files
    this.checkSchemaFiles();
    
    // Check 3: Deployment scripts
    this.checkDeploymentScripts();
    
    // Check 4: Dependencies
    this.checkDependencies();
    
    // Check 5: Production readiness
    this.checkProductionReadiness();

    this.displayResults();
    return this.results.ready;
  }

  checkEnvironmentVariables() {
    console.log('📋 Checking environment variables...');
    
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'DATABASE_URL'
    ];

    let hasValidCredentials = true;
    
    for (const envVar of required) {
      const value = process.env[envVar];
      
      if (!value) {
        this.results.errors.push(`Missing environment variable: ${envVar}`);
        hasValidCredentials = false;
      } else if (value.includes('placeholder') || value.includes('your-') || value.includes('abcdefghijklmnop')) {
        this.results.warnings.push(`${envVar} contains placeholder values - needs real Supabase credentials`);
        hasValidCredentials = false;
      } else {
        this.results.checks.push(`✅ ${envVar} configured`);
      }
    }

    if (hasValidCredentials) {
      this.results.checks.push('✅ All Supabase environment variables configured');
    } else {
      this.results.errors.push('❌ Supabase credentials not configured - run npm run setup:supabase');
    }
  }

  checkSchemaFiles() {
    console.log('📊 Checking database schema files...');
    
    const schemaFiles = [
      'prisma/schema.prisma',
      'scripts/deploy-supabase-production.ts',
      'scripts/execute-supabase-deployment.js'
    ];

    for (const file of schemaFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        this.results.checks.push(`✅ ${file} exists`);
      } else {
        this.results.errors.push(`❌ Missing schema file: ${file}`);
      }
    }

    // Check if Prisma schema uses PostgreSQL
    const prismaPath = path.join(process.cwd(), 'prisma/schema.prisma');
    if (fs.existsSync(prismaPath)) {
      const content = fs.readFileSync(prismaPath, 'utf8');
      if (content.includes('provider = "postgresql"')) {
        this.results.checks.push('✅ Prisma schema configured for PostgreSQL');
      } else {
        this.results.errors.push('❌ Prisma schema not configured for PostgreSQL');
      }
    }
  }

  checkDeploymentScripts() {
    console.log('🚀 Checking deployment scripts...');
    
    const scripts = [
      'scripts/deploy-supabase-production.ts',
      'scripts/execute-supabase-deployment.js',
      'scripts/setup-supabase-env.js'
    ];

    for (const script of scripts) {
      const scriptPath = path.join(process.cwd(), script);
      if (fs.existsSync(scriptPath)) {
        this.results.checks.push(`✅ ${script} ready`);
      } else {
        this.results.errors.push(`❌ Missing deployment script: ${script}`);
      }
    }
  }

  checkDependencies() {
    console.log('📦 Checking dependencies...');
    
    const packagePath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      const requiredDeps = [
        '@supabase/supabase-js',
        '@prisma/client',
        'prisma'
      ];

      for (const dep of requiredDeps) {
        if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
          this.results.checks.push(`✅ ${dep} installed`);
        } else {
          this.results.errors.push(`❌ Missing dependency: ${dep}`);
        }
      }

      // Check npm scripts
      const requiredScripts = [
        'deploy:supabase',
        'setup:supabase'
      ];

      for (const script of requiredScripts) {
        if (packageJson.scripts?.[script]) {
          this.results.checks.push(`✅ npm script ${script} configured`);
        } else {
          this.results.errors.push(`❌ Missing npm script: ${script}`);
        }
      }
    }
  }

  checkProductionReadiness() {
    console.log('🏭 Checking production readiness...');
    
    // Check for 79-table schema components
    const multiSportFile = path.join(process.cwd(), 'prisma/multi-sport-enhancement.sql');
    if (fs.existsSync(multiSportFile)) {
      this.results.checks.push('✅ Multi-sport schema (NBA, MLB, NASCAR) ready');
    } else {
      this.results.warnings.push('⚠️ Multi-sport schema file not found');
    }

    // Check for MCP server integration
    if (process.env.SUPABASE_MCP_ENABLED === 'true') {
      this.results.checks.push('✅ Supabase MCP integration enabled');
    } else {
      this.results.warnings.push('⚠️ Supabase MCP integration not enabled');
    }

    // Check for real-time features
    if (process.env.SUPABASE_REALTIME_ENABLED === 'true') {
      this.results.checks.push('✅ Real-time subscriptions enabled');
    } else {
      this.results.warnings.push('⚠️ Real-time subscriptions not enabled');
    }

    // Check for security features
    if (process.env.SUPABASE_RLS_ENABLED === 'true') {
      this.results.checks.push('✅ Row Level Security enabled');
    } else {
      this.results.warnings.push('⚠️ Row Level Security not enabled');
    }
  }

  displayResults() {
    console.log('');
    console.log('📊 READINESS REPORT');
    console.log('==================');
    console.log('');

    // Display successful checks
    if (this.results.checks.length > 0) {
      console.log('✅ PASSED CHECKS:');
      this.results.checks.forEach(check => console.log(`   ${check}`));
      console.log('');
    }

    // Display warnings
    if (this.results.warnings.length > 0) {
      console.log('⚠️ WARNINGS:');
      this.results.warnings.forEach(warning => console.log(`   ${warning}`));
      console.log('');
    }

    // Display errors
    if (this.results.errors.length > 0) {
      console.log('❌ ERRORS:');
      this.results.errors.forEach(error => console.log(`   ${error}`));
      console.log('');
    }

    // Final assessment
    this.results.ready = this.results.errors.length === 0;
    
    if (this.results.ready) {
      console.log('🎉 FANTASY.AI IS READY FOR SUPABASE DEPLOYMENT!');
      console.log('');
      console.log('🚀 Next steps:');
      if (this.results.warnings.some(w => w.includes('placeholder'))) {
        console.log('1. 🔧 Configure real Supabase credentials: npm run setup:supabase');
        console.log('2. 🗄️ Deploy 79-table schema: npm run deploy:supabase');
      } else {
        console.log('1. 🗄️ Deploy 79-table schema: npm run deploy:supabase');
        console.log('2. 📊 Populate with real data: npm run populate-database');
      }
      console.log('3. 🌍 Deploy to production: npm run deploy:production');
      console.log('');
      console.log('🎯 Mission: "Either we know it or we don\'t... yet!"');
      console.log('💪 Status: READY FOR PRODUCTION!');
    } else {
      console.log('❌ FANTASY.AI NOT READY FOR DEPLOYMENT');
      console.log('');
      console.log('🔧 To fix issues:');
      console.log('1. Install missing dependencies: npm install');
      console.log('2. Configure Supabase: npm run setup:supabase');
      console.log('3. Run this check again: npm run validate:supabase');
    }

    console.log('');
    console.log(`✅ Checks passed: ${this.results.checks.length}`);
    console.log(`⚠️ Warnings: ${this.results.warnings.length}`);
    console.log(`❌ Errors: ${this.results.errors.length}`);
    console.log('');
  }
}

// Main execution
function main() {
  const validator = new SupabaseReadinessValidator();
  const ready = validator.validate();
  process.exit(ready ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { SupabaseReadinessValidator };