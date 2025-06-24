#!/usr/bin/env tsx

/**
 * 📊🚀 PRODUCTION STATUS MONITOR 🚀📊
 * Real-time monitoring of all Fantasy.AI systems
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface SystemStatus {
  service: string;
  status: 'running' | 'stopped' | 'error';
  lastUpdate?: Date;
  metrics?: any;
}

class ProductionMonitor {
  private systems: SystemStatus[] = [];
  
  async checkAllSystems() {
    console.clear();
    console.log('🚀💥 FANTASY.AI PRODUCTION STATUS MONITOR 💥🚀');
    console.log('==============================================');
    console.log(`Timestamp: ${new Date().toLocaleString()}\n`);
    
    // Check web server
    await this.checkWebServer();
    
    // Check data collection
    await this.checkDataCollection();
    
    // Check ML systems
    await this.checkMLSystems();
    
    // Check database
    await this.checkDatabase();
    
    // Check APIs
    await this.checkAPIs();
    
    // Display summary
    this.displaySummary();
  }
  
  private async checkWebServer() {
    try {
      const { stdout } = await execAsync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001');
      const isRunning = stdout.trim() === '200';
      
      this.systems.push({
        service: '🌐 Web Server',
        status: isRunning ? 'running' : 'stopped',
        metrics: { port: 3001, responseCode: stdout.trim() }
      });
    } catch (error) {
      this.systems.push({
        service: '🌐 Web Server',
        status: 'error'
      });
    }
  }
  
  private async checkDataCollection() {
    try {
      const logPath = path.join(__dirname, 'collector.log');
      if (fs.existsSync(logPath)) {
        const stats = fs.statSync(logPath);
        const lastModified = new Date(stats.mtime);
        const minutesAgo = (Date.now() - lastModified.getTime()) / 1000 / 60;
        
        this.systems.push({
          service: '📊 Data Collector',
          status: minutesAgo < 10 ? 'running' : 'stopped',
          lastUpdate: lastModified,
          metrics: { 
            lastRun: `${minutesAgo.toFixed(1)} minutes ago`,
            logSize: `${(stats.size / 1024).toFixed(2)} KB`
          }
        });
      }
    } catch (error) {
      this.systems.push({
        service: '📊 Data Collector',
        status: 'error'
      });
    }
  }
  
  private async checkMLSystems() {
    try {
      const mlLogPath = path.join(__dirname, 'ml-engine.log');
      if (fs.existsSync(mlLogPath)) {
        const content = fs.readFileSync(mlLogPath, 'utf-8');
        const lines = content.split('\n');
        const accuracyLine = lines.find(line => line.includes('Current accuracy:'));
        const accuracy = accuracyLine ? accuracyLine.match(/(\d+\.\d+)%/)?.[1] : '0';
        
        this.systems.push({
          service: '🧠 ML Engine',
          status: 'running',
          metrics: { 
            accuracy: `${accuracy}%`,
            learningCycles: lines.filter(l => l.includes('RUNNING LEARNING CYCLE')).length
          }
        });
      }
    } catch (error) {
      this.systems.push({
        service: '🧠 ML Engine',
        status: 'error'
      });
    }
  }
  
  private async checkDatabase() {
    try {
      // Check Supabase connection (simulated)
      const dbUrl = process.env.DATABASE_URL;
      this.systems.push({
        service: '💾 Database (Supabase)',
        status: dbUrl ? 'running' : 'stopped',
        metrics: { 
          type: 'PostgreSQL',
          provider: 'Supabase'
        }
      });
    } catch (error) {
      this.systems.push({
        service: '💾 Database',
        status: 'error'
      });
    }
  }
  
  private async checkAPIs() {
    const apis = [
      { name: 'OpenWeather', key: 'OPENWEATHER_API_KEY' },
      { name: 'Odds API', key: 'ODDS_API_KEY' },
      { name: 'News API', key: 'NEWS_API_KEY' },
      { name: 'OpenAI', key: 'OPENAI_API_KEY' },
      { name: 'Stripe', key: 'STRIPE_SECRET_KEY' },
      { name: 'ElevenLabs', key: 'ELEVENLABS_API_KEY' }
    ];
    
    const configured = apis.filter(api => process.env[api.key]).length;
    
    this.systems.push({
      service: '🔑 External APIs',
      status: configured === apis.length ? 'running' : 'stopped',
      metrics: { 
        configured: `${configured}/${apis.length}`,
        apis: apis.map(a => ({
          name: a.name,
          status: process.env[a.key] ? '✅' : '❌'
        }))
      }
    });
  }
  
  private displaySummary() {
    console.log('📊 SYSTEM STATUS:');
    console.log('================\n');
    
    this.systems.forEach(system => {
      const statusEmoji = {
        running: '✅',
        stopped: '⚠️',
        error: '❌'
      }[system.status];
      
      console.log(`${statusEmoji} ${system.service}: ${system.status.toUpperCase()}`);
      
      if (system.lastUpdate) {
        console.log(`   Last Update: ${system.lastUpdate.toLocaleString()}`);
      }
      
      if (system.metrics) {
        Object.entries(system.metrics).forEach(([key, value]) => {
          if (typeof value !== 'object') {
            console.log(`   ${key}: ${value}`);
          }
        });
      }
      
      console.log('');
    });
    
    // Overall health
    const running = this.systems.filter(s => s.status === 'running').length;
    const total = this.systems.length;
    const healthPercent = (running / total * 100).toFixed(0);
    
    console.log('💪 OVERALL HEALTH:');
    console.log(`   Systems Running: ${running}/${total}`);
    console.log(`   Health Score: ${healthPercent}%`);
    console.log(`   Status: ${healthPercent === '100' ? '🟢 OPTIMAL' : healthPercent > '50' ? '🟡 DEGRADED' : '🔴 CRITICAL'}`);
    
    console.log('\n🔧 QUICK ACTIONS:');
    console.log('   - View logs: tail -f scripts/*.log');
    console.log('   - Restart all: ./START-EVERYTHING.sh');
    console.log('   - Check APIs: npx tsx scripts/TEST-API-KEYS.ts');
    console.log('   - Run tests: npm test && npx playwright test');
    
    console.log('\n🚀 FANTASY.AI PRODUCTION MONITOR 🚀');
  }
  
  async startMonitoring() {
    // Check immediately
    await this.checkAllSystems();
    
    // Then check every 30 seconds
    setInterval(() => this.checkAllSystems(), 30000);
  }
}

// Start monitoring
const monitor = new ProductionMonitor();
monitor.startMonitoring();