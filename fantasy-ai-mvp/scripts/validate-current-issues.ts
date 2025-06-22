#!/usr/bin/env tsx

/**
 * 🔍 FANTASY.AI ISSUES VALIDATOR
 * Quick diagnostic to identify all current issues before fixing
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync } from 'fs';

const log = (message: string, color = '\x1b[37m') => {
  console.log(`${color}${message}\x1b[0m`);
};

class IssuesValidator {
  async validateAllSystems(): Promise<void> {
    log('🔍 FANTASY.AI CURRENT ISSUES DIAGNOSTIC', '\x1b[36m\x1b[1m');
    log('Scanning for all issues blocking your destiny...\n', '\x1b[33m');

    // 1. TypeScript Errors
    await this.checkTypeScriptErrors();
    
    // 2. Environment Configuration
    await this.checkEnvironmentConfig();
    
    // 3. Dependencies
    await this.checkDependencies();
    
    // 4. Database Configuration
    await this.checkDatabaseConfig();
    
    // 5. API Endpoints
    await this.checkAPIEndpoints();
    
    // 6. Phantom Files
    await this.checkPhantomFiles();
    
    // 7. Integration Status
    await this.checkIntegrationStatus();

    log('\n🎯 DIAGNOSTIC COMPLETE - Ready to run bulletproof fixer!', '\x1b[32m\x1b[1m');
  }

  private async checkTypeScriptErrors(): Promise<void> {
    log('🔴 CHECKING TYPESCRIPT ERRORS...', '\x1b[31m');
    
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      log('✅ No TypeScript errors found', '\x1b[32m');
    } catch (error) {
      const output = error.toString();
      const errorCount = (output.match(/error TS/g) || []).length;
      log(`❌ Found ${errorCount} TypeScript errors`, '\x1b[31m');
      log('   These will be fixed by the bulletproof fixer', '\x1b[33m');
    }
  }

  private async checkEnvironmentConfig(): Promise<void> {
    log('\n🔧 CHECKING ENVIRONMENT CONFIGURATION...', '\x1b[34m');
    
    const hasEnvLocal = existsSync('.env.local');
    const hasEnvExample = existsSync('.env.example');
    
    if (!hasEnvLocal) {
      log('❌ .env.local file missing', '\x1b[31m');
    } else {
      log('✅ .env.local file exists', '\x1b[32m');
    }
    
    if (!hasEnvExample) {
      log('❌ .env.example file missing', '\x1b[31m');
    } else {
      log('✅ .env.example file exists', '\x1b[32m');
    }
  }

  private async checkDependencies(): Promise<void> {
    log('\n📦 CHECKING DEPENDENCIES...', '\x1b[35m');
    
    try {
      execSync('npm ls --depth=0', { stdio: 'pipe' });
      log('✅ All dependencies properly installed', '\x1b[32m');
    } catch (error) {
      log('⚠️ Some dependency issues detected', '\x1b[33m');
      log('   These will be resolved by the bulletproof fixer', '\x1b[33m');
    }
  }

  private async checkDatabaseConfig(): Promise<void> {
    log('\n🗄️ CHECKING DATABASE CONFIGURATION...', '\x1b[36m');
    
    const hasPrismaSchema = existsSync('prisma/schema.prisma');
    const hasDatabase = existsSync('prisma/dev.db') || process.env.DATABASE_URL;
    
    if (hasPrismaSchema) {
      log('✅ Prisma schema found', '\x1b[32m');
    } else {
      log('❌ Prisma schema missing', '\x1b[31m');
    }
    
    if (hasDatabase) {
      log('✅ Database configuration present', '\x1b[32m');
    } else {
      log('❌ Database not configured', '\x1b[31m');
    }
  }

  private async checkAPIEndpoints(): Promise<void> {
    log('\n🔗 CHECKING API ENDPOINTS...', '\x1b[34m');
    
    const apiPath = 'src/app/api';
    if (existsSync(apiPath)) {
      const endpoints = readdirSync(apiPath);
      log(`✅ Found ${endpoints.length} API endpoint directories`, '\x1b[32m');
      endpoints.forEach(endpoint => {
        log(`   📁 ${endpoint}`, '\x1b[36m');
      });
    } else {
      log('❌ API endpoints directory not found', '\x1b[31m');
    }
  }

  private async checkPhantomFiles(): Promise<void> {
    log('\n👻 CHECKING FOR PHANTOM SCI-FI FEATURES...', '\x1b[35m');
    
    const phantomFiles = [
      'src/lib/universal-consciousness-interface.ts',
      'src/lib/agi-fantasy-commissioner.ts',
      'src/lib/interplanetary-communication-system.ts',
      'src/lib/reality-simulation-engine.ts',
      'src/lib/time-traveling-prediction-engine.ts'
    ];

    let phantomCount = 0;
    phantomFiles.forEach(file => {
      if (existsSync(file)) {
        phantomCount++;
        log(`👻 Found phantom file: ${file}`, '\x1b[33m');
      }
    });

    if (phantomCount === 0) {
      log('✅ No phantom files found', '\x1b[32m');
    } else {
      log(`❌ Found ${phantomCount} phantom files causing TypeScript errors`, '\x1b[31m');
      log('   These will be disabled by the bulletproof fixer', '\x1b[33m');
    }
  }

  private async checkIntegrationStatus(): Promise<void> {
    log('\n🔌 CHECKING INTEGRATION STATUS...', '\x1b[36m');
    
    // Check OAuth integration
    const hasOAuthConfig = existsSync('src/lib/fantasy-oauth.ts');
    log(hasOAuthConfig ? '✅ OAuth integration configured' : '❌ OAuth integration missing', 
        hasOAuthConfig ? '\x1b[32m' : '\x1b[31m');
    
    // Check MCP servers
    const hasMCPServers = existsSync('src/mcp/servers');
    if (hasMCPServers) {
      const mcpServers = readdirSync('src/mcp/servers').filter(f => f.endsWith('.ts'));
      log(`✅ Found ${mcpServers.length} MCP servers`, '\x1b[32m');
    } else {
      log('❌ MCP servers not found', '\x1b[31m');
    }
    
    // Check database integration
    const hasPrismaClient = existsSync('src/lib/prisma.ts');
    log(hasPrismaClient ? '✅ Database client configured' : '❌ Database client missing', 
        hasPrismaClient ? '\x1b[32m' : '\x1b[31m');
  }
}

// Execute validation
async function main() {
  const validator = new IssuesValidator();
  await validator.validateAllSystems();
  
  log('\n🚀 NEXT STEPS:', '\x1b[32m\x1b[1m');
  log('1. Run: npm run fix:all', '\x1b[36m');
  log('2. Wait for bulletproof fixes to complete', '\x1b[36m');
  log('3. Run: npm run build', '\x1b[36m');
  log('4. Deploy to production!', '\x1b[36m');
}

if (require.main === module) {
  main().catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
} 