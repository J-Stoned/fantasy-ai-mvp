#!/usr/bin/env tsx

/**
 * 🛠️ FANTASY.AI DEVELOPMENT SUITE LAUNCHER
 * 
 * Interactive development environment with:
 * • Hot reloading dashboard
 * • ML model development
 * • Real-time WebSocket testing
 * • Mobile app development
 * • Component testing
 */

import { spawn, ChildProcess } from 'child_process';
import * as readline from 'readline';

interface DevTool {
  id: string;
  name: string;
  description: string;
  command: string;
  args: string[];
  port?: number;
  process?: ChildProcess;
  enabled: boolean;
}

class DevelopmentSuite {
  private tools: DevTool[] = [
    {
      id: 'dashboard',
      name: '📊 Dashboard (Hot Reload)',
      description: 'Next.js development server with hot reloading',
      command: 'npm',
      args: ['run', 'dev'],
      port: 3000,
      enabled: true
    },
    {
      id: 'websocket',
      name: '📡 WebSocket Development',
      description: 'WebSocket server with development logging',
      command: 'npm',
      args: ['run', 'websocket'],
      port: 3001,
      enabled: true
    },
    {
      id: 'mobile',
      name: '📱 Mobile Development',
      description: 'React Native development with Expo',
      command: 'npm',
      args: ['run', 'mobile:start'],
      enabled: false
    },
    {
      id: 'ml-train',
      name: '🧠 ML Model Training',
      description: 'Train ML models with development data',
      command: 'npm',
      args: ['run', 'ml:train:all'],
      enabled: false
    },
    {
      id: 'test-watch',
      name: '🧪 Test Watcher',
      description: 'Run tests in watch mode',
      command: 'npm',
      args: ['run', 'test:watch'],
      enabled: false
    },
    {
      id: 'type-check',
      name: '📝 TypeScript Check',
      description: 'TypeScript compiler in watch mode',
      command: 'npx',
      args: ['tsc', '--noEmit', '--watch'],
      enabled: false
    }
  ];

  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start() {
    this.showHeader();
    await this.showMenu();
  }

  private showHeader() {
    console.clear();
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                                                              ║');
    console.log('║  🛠️  FANTASY.AI DEVELOPMENT SUITE  🛠️                       ║');
    console.log('║                                                              ║');
    console.log('║  Interactive development environment for all systems        ║');
    console.log('║                                                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
  }

  private async showMenu() {
    console.log('🎯 AVAILABLE DEVELOPMENT TOOLS:\n');
    
    this.tools.forEach((tool, index) => {
      const status = tool.enabled ? '🟢' : '⚪';
      const port = tool.port ? ` (port ${tool.port})` : '';
      console.log(`${index + 1}. ${status} ${tool.name}${port}`);
      console.log(`   ${tool.description}\n`);
    });

    console.log('📋 QUICK COMMANDS:');
    console.log('  s - Start selected tools');
    console.log('  a - Toggle all tools');
    console.log('  c - Clear and refresh menu');
    console.log('  h - Show development help');
    console.log('  q - Quit development suite\n');

    this.rl.question('Enter tool numbers to toggle (e.g., 1,3,5) or command: ', async (input) => {
      await this.handleInput(input.trim());
    });
  }

  private async handleInput(input: string) {
    if (input === 'q') {
      await this.shutdown();
      return;
    }
    
    if (input === 'c') {
      await this.showMenu();
      return;
    }
    
    if (input === 'a') {
      const allEnabled = this.tools.every(t => t.enabled);
      this.tools.forEach(tool => tool.enabled = !allEnabled);
      await this.showMenu();
      return;
    }
    
    if (input === 'h') {
      this.showHelp();
      await this.showMenu();
      return;
    }
    
    if (input === 's') {
      await this.startSelectedTools();
      return;
    }

    // Handle tool selection
    const numbers = input.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    
    numbers.forEach(num => {
      if (num >= 1 && num <= this.tools.length) {
        this.tools[num - 1].enabled = !this.tools[num - 1].enabled;
      }
    });

    await this.showMenu();
  }

  private showHelp() {
    console.log('\n🔧 DEVELOPMENT SUITE HELP:\n');
    console.log('RECOMMENDED WORKFLOWS:');
    console.log('  Dashboard Development: Enable tools 1,2,6 (Dashboard + WebSocket + TypeScript)');
    console.log('  Mobile Development: Enable tools 1,2,3 (Dashboard + WebSocket + Mobile)');
    console.log('  ML Development: Enable tools 1,4,5 (Dashboard + ML Training + Tests)');
    console.log('  Full Stack: Enable tools 1,2,3,4 (Everything except tests)');
    
    console.log('\nPORT USAGE:');
    console.log('  3000: Next.js dashboard');
    console.log('  3001: WebSocket server');
    console.log('  19000+: Expo mobile app');
    
    console.log('\nDEVELOPMENT TIPS:');
    console.log('  • Start with Dashboard + WebSocket for basic development');
    console.log('  • Add Mobile when testing cross-platform features');
    console.log('  • Use ML Training to update models with new data');
    console.log('  • Enable Test Watcher for TDD development');
    console.log('  • TypeScript Check catches errors before runtime');
    
    console.log('\nPress Enter to continue...');
    await new Promise(resolve => this.rl.once('line', resolve));
  }

  private async startSelectedTools() {
    const enabledTools = this.tools.filter(t => t.enabled);
    
    if (enabledTools.length === 0) {
      console.log('❌ No tools selected. Please select tools first.\n');
      await this.showMenu();
      return;
    }

    console.log(`\n🚀 Starting ${enabledTools.length} development tools...\n`);

    for (const tool of enabledTools) {
      await this.startTool(tool);
      await this.sleep(1000);
    }

    this.showRunningStatus();
    this.setupShutdownHandler();
    this.startCommandInterface();
  }

  private async startTool(tool: DevTool) {
    console.log(`🚀 Starting ${tool.name}...`);
    
    try {
      tool.process = spawn(tool.command, tool.args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true
      });

      tool.process.stdout?.on('data', (data) => {
        const output = data.toString();
        // Only show important output to avoid spam
        if (output.includes('ready') || output.includes('error') || output.includes('warning')) {
          console.log(`  ${tool.name}: ${output.trim()}`);
        }
      });

      tool.process.stderr?.on('data', (data) => {
        const output = data.toString();
        if (!output.includes('warning') && !output.includes('deprecated')) {
          console.log(`  ⚠️ ${tool.name}: ${output.trim()}`);
        }
      });

      console.log(`  ✅ ${tool.name} started`);
      if (tool.port) {
        console.log(`  🌐 Available at: http://localhost:${tool.port}`);
      }
      
    } catch (error) {
      console.log(`  ❌ Failed to start ${tool.name}: ${error}`);
    }
  }

  private showRunningStatus() {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 DEVELOPMENT SUITE RUNNING! 🎉');
    console.log('='.repeat(60));
    
    const running = this.tools.filter(t => t.enabled && t.process);
    
    console.log('\n📊 ACTIVE TOOLS:');
    running.forEach(tool => {
      const port = tool.port ? ` (http://localhost:${tool.port})` : '';
      console.log(`  🟢 ${tool.name}${port}`);
    });
    
    console.log('\n💡 DEVELOPMENT COMMANDS:');
    console.log('  help - Show development guide');
    console.log('  status - Show current status');
    console.log('  logs <tool> - Show logs for specific tool');
    console.log('  restart <tool> - Restart specific tool');
    console.log('  quit - Stop all tools and exit');
    
    console.log('\n🔥 Ready for development! Type commands or press Ctrl+C to stop.\n');
  }

  private startCommandInterface() {
    const askCommand = () => {
      this.rl.question('dev> ', async (command) => {
        await this.handleDevCommand(command.trim());
        askCommand();
      });
    };
    askCommand();
  }

  private async handleDevCommand(command: string) {
    const [cmd, ...args] = command.split(' ');
    
    switch (cmd) {
      case 'help':
        this.showDevHelp();
        break;
      case 'status':
        this.showStatus();
        break;
      case 'logs':
        this.showLogs(args[0]);
        break;
      case 'restart':
        await this.restartTool(args[0]);
        break;
      case 'quit':
        await this.shutdown();
        break;
      case '':
        break;
      default:
        console.log(`Unknown command: ${cmd}. Type 'help' for available commands.`);
    }
  }

  private showDevHelp() {
    console.log('\n🔧 DEVELOPMENT COMMANDS:');
    console.log('  help - Show this help');
    console.log('  status - Show tool status');
    console.log('  logs dashboard - Show dashboard logs');
    console.log('  logs websocket - Show WebSocket logs');
    console.log('  logs mobile - Show mobile app logs');
    console.log('  restart <tool> - Restart specific tool');
    console.log('  quit - Stop all and exit');
    
    console.log('\n📱 QUICK LINKS:');
    console.log('  Dashboard: http://localhost:3000/dashboard');
    console.log('  API Docs: http://localhost:3000/api/docs');
    console.log('  ML Endpoint: http://localhost:3000/api/ml/predict');
    console.log('');
  }

  private showStatus() {
    console.log('\n📊 TOOL STATUS:');
    this.tools.forEach(tool => {
      if (tool.enabled) {
        const status = tool.process && !tool.process.killed ? '🟢 RUNNING' : '🔴 STOPPED';
        console.log(`  ${tool.name}: ${status}`);
      }
    });
    console.log('');
  }

  private showLogs(toolId: string) {
    const tool = this.tools.find(t => t.id === toolId);
    if (!tool) {
      console.log(`Tool '${toolId}' not found. Available: ${this.tools.map(t => t.id).join(', ')}`);
      return;
    }
    
    console.log(`\n📋 Recent logs for ${tool.name}:`);
    console.log('(Live logs are shown above as they happen)');
    console.log('');
  }

  private async restartTool(toolId: string) {
    const tool = this.tools.find(t => t.id === toolId);
    if (!tool) {
      console.log(`Tool '${toolId}' not found.`);
      return;
    }
    
    console.log(`🔄 Restarting ${tool.name}...`);
    
    if (tool.process) {
      tool.process.kill('SIGTERM');
      await this.sleep(2000);
    }
    
    await this.startTool(tool);
    console.log(`✅ ${tool.name} restarted\n`);
  }

  private setupShutdownHandler() {
    process.on('SIGINT', async () => {
      await this.shutdown();
    });
  }

  private async shutdown() {
    console.log('\n🛑 Shutting down development suite...');
    
    this.tools.forEach(tool => {
      if (tool.process && !tool.process.killed) {
        console.log(`  Stopping ${tool.name}...`);
        tool.process.kill('SIGTERM');
      }
    });
    
    this.rl.close();
    
    setTimeout(() => {
      console.log('👋 Development suite stopped.');
      process.exit(0);
    }, 2000);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Start the development suite
if (require.main === module) {
  const suite = new DevelopmentSuite();
  suite.start().catch(console.error);
}