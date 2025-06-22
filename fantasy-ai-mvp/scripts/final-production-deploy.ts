#!/usr/bin/env tsx

/**
 * 🚀 FANTASY.AI MVP - FINAL PRODUCTION DEPLOYMENT
 * Complete production deployment with verification
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface DeploymentStatus {
  phase: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  details?: string;
  url?: string;
}

class FantasyAIProductionDeployer {
  private deploymentPhases: DeploymentStatus[] = [
    { phase: 'Environment Setup', status: 'pending' },
    { phase: 'Build Verification', status: 'pending' },
    { phase: 'Database Migration', status: 'pending' },
    { phase: 'Vercel Deployment', status: 'pending' },
    { phase: 'Live Verification', status: 'pending' },
    { phase: 'Performance Check', status: 'pending' }
  ];

  private updatePhase(phase: string, status: DeploymentStatus['status'], details?: string, url?: string) {
    const phaseIndex = this.deploymentPhases.findIndex(p => p.phase === phase);
    if (phaseIndex !== -1) {
      this.deploymentPhases[phaseIndex] = { 
        phase, 
        status, 
        details,
        url
      };
    }
    this.logProgress();
  }

  private logProgress() {
    console.clear();
    console.log('🚀 FANTASY.AI MVP - PRODUCTION DEPLOYMENT');
    console.log('==========================================\n');
    
    this.deploymentPhases.forEach(phase => {
      const statusEmoji = {
        pending: '⏳',
        running: '🔄',
        success: '✅',
        failed: '❌'
      }[phase.status];
      
      console.log(`${statusEmoji} ${phase.phase} - ${phase.status.toUpperCase()}`);
      if (phase.details) console.log(`   ${phase.details}`);
      if (phase.url) console.log(`   🔗 ${phase.url}`);
      console.log('');
    });
  }

  async runFullDeployment(): Promise<void> {
    try {
      console.log('🚀 Starting Fantasy.AI MVP Production Deployment...\n');

      // Phase 1: Environment Setup
      await this.setupEnvironment();
      
      // Phase 2: Build Verification
      await this.verifyBuild();
      
      // Phase 3: Database Migration
      await this.migrateDatabase();
      
      // Phase 4: Vercel Deployment
      await this.deployToVercel();
      
      // Phase 5: Live Verification
      await this.verifyLiveDeployment();
      
      // Phase 6: Performance Check
      await this.performanceCheck();

      console.log('\n🎉 FANTASY.AI MVP SUCCESSFULLY DEPLOYED TO PRODUCTION!');
      console.log('🌐 Your Fantasy.AI platform is now LIVE and ready for users!');

    } catch (error) {
      console.error('❌ Deployment failed:', error);
      throw error;
    }
  }

  private async setupEnvironment(): Promise<void> {
    this.updatePhase('Environment Setup', 'running', 'Configuring production environment...');
    
    try {
      // Verify .env.production exists
      const { stdout } = await execAsync('ls -la .env.production');
      
      this.updatePhase('Environment Setup', 'success', 'Production environment configured');
    } catch (error) {
      this.updatePhase('Environment Setup', 'failed', `Environment setup failed: ${error}`);
      throw error;
    }
  }

  private async verifyBuild(): Promise<void> {
    this.updatePhase('Build Verification', 'running', 'Running production build...');
    
    try {
      await execAsync('npm run build', { timeout: 300000 });
      this.updatePhase('Build Verification', 'success', 'Build completed successfully');
    } catch (error) {
      this.updatePhase('Build Verification', 'failed', `Build failed: ${error}`);
      throw error;
    }
  }

  private async migrateDatabase(): Promise<void> {
    this.updatePhase('Database Migration', 'running', 'Running database migrations...');
    
    try {
      await execAsync('npx prisma generate');
      await execAsync('npx prisma db push');
      this.updatePhase('Database Migration', 'success', 'Database migrations completed');
    } catch (error) {
      this.updatePhase('Database Migration', 'failed', `Database migration failed: ${error}`);
      throw error;
    }
  }

  private async deployToVercel(): Promise<void> {
    this.updatePhase('Vercel Deployment', 'running', 'Deploying to Vercel production...');
    
    try {
      const { stdout } = await execAsync('vercel --prod --yes', { timeout: 300000 });
      const urlMatch = stdout.match(/https:\/\/[^\s]+/);
      const deploymentUrl = urlMatch ? urlMatch[0] : 'Deployment URL not found';
      
      this.updatePhase('Vercel Deployment', 'success', 'Deployed to production', deploymentUrl);
      
      // Store deployment URL for verification
      process.env.DEPLOYMENT_URL = deploymentUrl;
      
    } catch (error) {
      this.updatePhase('Vercel Deployment', 'failed', `Vercel deployment failed: ${error}`);
      throw error;
    }
  }

  private async verifyLiveDeployment(): Promise<void> {
    this.updatePhase('Live Verification', 'running', 'Verifying live deployment...');
    
    try {
      const deploymentUrl = process.env.DEPLOYMENT_URL;
      if (!deploymentUrl) throw new Error('No deployment URL found');
      
      // Test deployment health
      const { stdout } = await execAsync(`curl -I "${deploymentUrl}"`);
      
      if (stdout.includes('200') || stdout.includes('302')) {
        this.updatePhase('Live Verification', 'success', 'Live deployment verified', deploymentUrl);
      } else {
        throw new Error('Deployment not responding correctly');
      }
    } catch (error) {
      this.updatePhase('Live Verification', 'failed', `Live verification failed: ${error}`);
      throw error;
    }
  }

  private async performanceCheck(): Promise<void> {
    this.updatePhase('Performance Check', 'running', 'Running performance checks...');
    
    try {
      // Simple performance check
      const startTime = Date.now();
      await execAsync(`curl -s "${process.env.DEPLOYMENT_URL}" > /dev/null`);
      const responseTime = Date.now() - startTime;
      
      this.updatePhase('Performance Check', 'success', `Response time: ${responseTime}ms`);
    } catch (error) {
      this.updatePhase('Performance Check', 'failed', `Performance check failed: ${error}`);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const deployer = new FantasyAIProductionDeployer();
  await deployer.runFullDeployment();
}

if (require.main === module) {
  main().catch(console.error);
}