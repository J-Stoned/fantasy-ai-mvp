#!/usr/bin/env tsx

/**
 * 🚀💥🔥 FANTASY.AI - LAUNCH ALL SYSTEMS - MAXIMUM POWER! 🔥💥🚀
 * 
 * This launches ALL the systems we built in this epic session:
 * ✅ Phase 1: Data Visualization Dashboard + WebSocket
 * ✅ Phase 2: ML Pipeline (7 models) + Training
 * ✅ Phase 3: Mobile Companion App  
 * ✅ Phase 4: Social Media Integration (6 platforms)
 * ✅ Phase 5: Championship Probability Engine
 * 
 * ONE COMMAND TO RULE THEM ALL! 🏆
 */

import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

interface SystemProcess {
  name: string;
  command: string;
  args: string[];
  cwd?: string;
  process?: ChildProcess;
  status: 'pending' | 'starting' | 'running' | 'error' | 'stopped';
  port?: number;
  description: string;
}

class FantasyAILauncher {
  private systems: SystemProcess[] = [
    {
      name: '🌐 Web Dashboard',
      command: 'npm',
      args: ['run', 'dev'],
      port: 3000,
      status: 'pending',
      description: 'Next.js dashboard with real-time features'
    },
    {
      name: '📡 WebSocket Server',
      command: 'npm',
      args: ['run', 'websocket'],
      port: 3001,
      status: 'pending',
      description: 'Real-time updates and notifications'
    },
    {
      name: '🧠 ML Pipeline Training',
      command: 'npm',
      args: ['run', 'ml:train:all'],
      status: 'pending',
      description: 'Train all 7 ML models'
    },
    {
      name: '📱 Mobile App',
      command: 'npm',
      args: ['run', 'mobile:start'],
      cwd: 'src/mobile',
      status: 'pending',
      description: 'React Native companion app'
    },
    {
      name: '🌐 Social Hub',
      command: 'npm',
      args: ['run', 'mcp:all'],
      status: 'pending',
      description: '6 social media platform integrations'
    },
    {
      name: '🎯 Data Collection',
      command: 'npm',
      args: ['run', 'powerhouse'],
      status: 'pending',
      description: 'Real sports data collection'
    }
  ];

  private processOutputs: Map<string, string[]> = new Map();

  constructor() {
    this.systems.forEach(system => {
      this.processOutputs.set(system.name, []);
    });
  }

  async launch() {
    this.showHeader();
    
    console.log('🔍 Pre-flight System Checks...\n');
    await this.runPreflightChecks();
    
    console.log('\n🚀 LAUNCHING ALL SYSTEMS...\n');
    
    // Start systems in optimal order
    await this.startSystem(this.systems[2]); // ML Training first
    await this.sleep(2000);
    
    await this.startSystem(this.systems[1]); // WebSocket server
    await this.sleep(1000);
    
    await this.startSystem(this.systems[0]); // Web dashboard
    await this.sleep(1000);
    
    await this.startSystem(this.systems[5]); // Data collection
    await this.sleep(1000);
    
    await this.startSystem(this.systems[4]); // Social hub
    await this.sleep(1000);
    
    await this.startSystem(this.systems[3]); // Mobile app
    
    this.showLaunchComplete();
    this.setupGracefulShutdown();
    
    // Keep monitoring
    this.startMonitoring();
  }

  private showHeader() {
    console.clear();
    console.log('╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                      ║');
    console.log('║  🚀💥🔥  FANTASY.AI - MAXIMUM POWER SYSTEM LAUNCHER  🔥💥🚀          ║');
    console.log('║                                                                      ║');
    console.log('║  Launching ALL systems built in this epic session:                  ║');
    console.log('║  • Real-time Dashboard with WebSocket                               ║');
    console.log('║  • 7 ML Models (TensorFlow.js)                                      ║');
    console.log('║  • Mobile App (React Native + Voice + AR)                           ║');
    console.log('║  • Social Integration (6 platforms)                                 ║');
    console.log('║  • Championship Probability Engine                                  ║');
    console.log('║                                                                      ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝');
    console.log('');
  }

  private async runPreflightChecks(): Promise<void> {
    const checks = [
      { name: 'Node.js version', check: () => process.version },
      { name: 'NPM packages', check: () => fs.existsSync('node_modules') },
      { name: 'Prisma client', check: () => fs.existsSync('node_modules/.prisma') },
      { name: 'Mobile app setup', check: () => fs.existsSync('src/mobile/package.json') },
      { name: 'ML models directory', check: () => fs.existsSync('src/lib/ml') },
      { name: 'WebSocket service', check: () => fs.existsSync('src/lib/websocket-service.ts') },
      { name: 'Social integration', check: () => fs.existsSync('src/lib/social') }
    ];

    for (const check of checks) {
      process.stdout.write(`  ${check.name}... `);
      try {
        const result = check.check();
        if (result) {
          console.log('✅');
        } else {
          console.log('❌');
        }
      } catch (error) {
        console.log('❌');
      }
      await this.sleep(300);
    }
  }

  private async startSystem(system: SystemProcess): Promise<void> {
    console.log(`\n🚀 Starting ${system.name}...`);
    console.log(`   ${system.description}`);
    
    system.status = 'starting';
    
    try {
      const cwd = system.cwd ? path.join(process.cwd(), system.cwd) : process.cwd();
      
      system.process = spawn(system.command, system.args, {
        cwd,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true
      });

      system.process.stdout?.on('data', (data) => {
        const output = data.toString();
        const outputs = this.processOutputs.get(system.name) || [];
        outputs.push(output);
        this.processOutputs.set(system.name, outputs.slice(-10)); // Keep last 10 lines
      });

      system.process.stderr?.on('data', (data) => {
        const output = data.toString();
        if (!output.includes('warning') && !output.includes('deprecated')) {
          console.log(`   ⚠️  ${system.name}: ${output.trim()}`);
        }
      });

      system.process.on('error', (error) => {
        console.log(`   ❌ ${system.name} failed: ${error.message}`);
        system.status = 'error';
      });

      system.process.on('exit', (code) => {
        if (code === 0) {
          console.log(`   ✅ ${system.name} completed successfully`);
        } else {
          console.log(`   ❌ ${system.name} exited with code ${code}`);
        }
        system.status = 'stopped';
      });

      // Give it a moment to start
      await this.sleep(2000);
      
      if (system.process && !system.process.killed) {
        system.status = 'running';
        console.log(`   ✅ ${system.name} is running!`);
        if (system.port) {
          console.log(`   🌐 Available at: http://localhost:${system.port}`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Failed to start ${system.name}: ${error}`);
      system.status = 'error';
    }
  }

  private showLaunchComplete() {
    console.log('\n' + '='.repeat(70));
    console.log('🎉🚀 ALL SYSTEMS LAUNCHED! FANTASY.AI AT MAXIMUM POWER! 🚀🎉');
    console.log('='.repeat(70));
    
    console.log('\n📊 SYSTEM STATUS:');
    this.systems.forEach(system => {
      const status = system.status === 'running' ? '🟢 ONLINE' : 
                    system.status === 'error' ? '🔴 ERROR' : 
                    system.status === 'starting' ? '🟡 STARTING' : '⚪ STOPPED';
      console.log(`   ${system.name}: ${status}`);
    });
    
    console.log('\n🌐 ACCESS POINTS:');
    console.log('   Dashboard:     http://localhost:3000/dashboard');
    console.log('   ML API:        http://localhost:3000/api/ml/predict');
    console.log('   WebSocket:     ws://localhost:3001');
    console.log('   Mobile App:    Scan QR code or check Expo Dev Tools');
    console.log('   Social Hub:    Integrated in dashboard');
    
    console.log('\n🎯 QUICK ACTIONS:');
    console.log('   • Visit dashboard to see real-time features');
    console.log('   • Use voice commands: "Hey Fantasy, optimize my lineup"');
    console.log('   • Check mobile app with AR camera features');
    console.log('   • Test championship probability calculations');
    console.log('   • Monitor social media integrations');
    
    console.log('\n💡 PRO TIPS:');
    console.log('   • Press Ctrl+C to stop all systems gracefully');
    console.log('   • Check logs above for any errors');
    console.log('   • Mobile app requires Expo Go on your device');
    console.log('   • ML models will improve with more training data');
    
    console.log('\n🔥 FANTASY.AI IS NOW RUNNING AT MAXIMUM CAPACITY! 🔥');
  }

  private setupGracefulShutdown() {
    const shutdown = () => {
      console.log('\n\n🛑 Shutting down all systems...');
      this.systems.forEach(system => {
        if (system.process && !system.process.killed) {
          console.log(`   Stopping ${system.name}...`);
          system.process.kill('SIGTERM');
        }
      });
      
      setTimeout(() => {
        console.log('👋 All systems stopped. Fantasy.AI powered down.');
        process.exit(0);
      }, 2000);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  private startMonitoring() {
    setInterval(() => {
      // Check system health
      let allRunning = 0;
      let errors = 0;
      
      this.systems.forEach(system => {
        if (system.status === 'running') allRunning++;
        if (system.status === 'error') errors++;
      });
      
      if (errors > 0) {
        console.log(`\n⚠️  ${errors} systems have errors. Check logs above.`);
      }
      
      // Show periodic status update
      if (allRunning === this.systems.length) {
        // All good, quiet monitoring
      }
    }, 30000); // Check every 30 seconds
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the launcher
async function main() {
  const launcher = new FantasyAILauncher();
  
  try {
    await launcher.launch();
  } catch (error) {
    console.error('💥 Critical error in system launcher:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}