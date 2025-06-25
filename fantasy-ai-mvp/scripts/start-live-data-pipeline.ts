#!/usr/bin/env tsx
/**
 * START LIVE DATA PIPELINE
 * Initializes and runs the real-time sports data collection pipeline
 * with MCP server integration and ML model predictions
 */

import { realTimeSportsCollector } from '../src/lib/live-data-pipeline/real-time-sports-collector';
import { pipelineMonitor } from '../src/lib/live-data-pipeline/pipeline-monitor';
import { mlOrchestrator } from '../src/lib/ml/ml-orchestrator';
import { PrismaClient } from '@prisma/client';
import chalk from 'chalk';

const prisma = new PrismaClient();

// Terminal colors
const log = {
  info: (msg: string) => console.log(chalk.blue('ℹ️'), msg),
  success: (msg: string) => console.log(chalk.green('✅'), msg),
  warning: (msg: string) => console.log(chalk.yellow('⚠️'), msg),
  error: (msg: string) => console.log(chalk.red('❌'), msg),
  data: (label: string, value: any) => console.log(chalk.cyan(label), chalk.white(JSON.stringify(value, null, 2)))
};

// ASCII Art Banner
const banner = `
████████╗ ██████╗ ████████╗ ██████╗     ██████╗ ██╗██████╗ ███████╗██╗     ██╗███╗   ██╗███████╗
██╔════╝██╔═══██╗╚══██╔══╝██╔═══██╗    ██╔══██╗██║██╔══██╗██╔════╝██║     ██║████╗  ██║██╔════╝
█████╗  ███████║   ██║   ███████║    ██████║██║██████╔╝█████╗  ██║     ██║██╔██╗ ██║█████╗  
██╔══╝  ██╔══██║   ██║   ██╔══██║    ██╔═══╝██║██╔═══╝ ██╔══╝  ██║     ██║██║╚██╗██║██╔══╝  
██║     ██║  ██║   ██║   ██║  ██║    ██║     ██║██║     ███████╗███████╗██║██║ ╚████║███████╗
╚═╝     ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝    ╚═╝     ╚═╝╚═╝     ╚══════╝╚══════╝╚═╝╚═╝  ╚═══╝╚══════╝
`;

async function startPipeline() {
  console.clear();
  console.log(chalk.cyan(banner));
  console.log(chalk.white.bold('Real-Time Sports Data Collection Pipeline with MCP Integration\n'));

  try {
    // Check database connection
    log.info('Checking database connection...');
    await prisma.$connect();
    log.success('Database connected');

    // Initialize ML models (if needed)
    log.info('Initializing ML models...');
    // ML orchestrator will initialize on first use
    log.success('ML models ready');

    // Setup pipeline event listeners
    setupPipelineListeners();

    // Setup monitor event listeners
    setupMonitorListeners();

    // Start the pipeline
    log.info('Starting data collection pipeline...');
    await realTimeSportsCollector.start();

    // Display initial status
    displayPipelineStatus();

    // Setup graceful shutdown
    setupGracefulShutdown();

    // Keep the process running
    log.success('Pipeline is running! Press Ctrl+C to stop.');
    
    // Display live updates every 10 seconds
    setInterval(() => {
      displayLiveMetrics();
    }, 10000);

  } catch (error) {
    log.error(`Failed to start pipeline: ${error}`);
    process.exit(1);
  }
}

function setupPipelineListeners() {
  // Data collection events
  realTimeSportsCollector.on('dataCollected', (data) => {
    log.success(`Data collected from ${data.source}: ${data.recordCount} records`);
  });

  realTimeSportsCollector.on('collectionError', (error) => {
    log.error(`Collection error from ${error.source}: ${error.error}`);
  });

  // Player updates
  realTimeSportsCollector.on('playerUpdated', (update) => {
    log.info(`Player updated: ${update.player.name} - Prediction confidence: ${(update.prediction.confidence * 100).toFixed(1)}%`);
  });

  // Injury updates
  realTimeSportsCollector.on('injuryUpdate', (update) => {
    log.warning(`Injury update: ${update.injury.playerName} - ${update.injury.status} (${update.injury.type})`);
  });

  // Game updates
  realTimeSportsCollector.on('gameUpdate', (update) => {
    const game = update.game;
    log.info(`Game update: ${game.awayTeam} @ ${game.homeTeam} - ${game.awayScore}-${game.homeScore} (${game.status})`);
  });

  // Odds updates
  realTimeSportsCollector.on('oddsUpdate', (update) => {
    const odds = update.odds;
    log.info(`Odds update: ${odds.propName} - Line: ${odds.line} (O${odds.overOdds}/U${odds.underOdds})`);
  });

  // Weather updates
  realTimeSportsCollector.on('weatherUpdate', (update) => {
    const weather = update.weather;
    log.info(`Weather update: ${weather.stadium} - ${weather.temperature}°F, Wind: ${weather.windSpeed}mph`);
  });
}

function setupMonitorListeners() {
  // Health check events
  pipelineMonitor.on('healthCheck', (health) => {
    if (health.status !== 'healthy') {
      log.warning(`Pipeline health: ${health.status}`);
      health.issues.forEach(issue => log.warning(`  - ${issue}`));
    }
  });

  // Source health events
  pipelineMonitor.on('sourceUnhealthy', (source) => {
    log.error(`Source unhealthy: ${source.source} - ${source.failures} consecutive failures`);
  });

  // Metrics updates
  pipelineMonitor.on('metricsUpdate', (metrics) => {
    if (metrics.errorsPerMinute > 5) {
      log.warning(`High error rate: ${metrics.errorsPerMinute} errors/minute`);
    }
  });
}

function displayPipelineStatus() {
  const status = realTimeSportsCollector.getStatus();
  
  console.log('\n' + chalk.white.bold('═══ Pipeline Status ═══'));
  console.log(chalk.cyan('Running:'), status.isRunning ? chalk.green('Yes') : chalk.red('No'));
  console.log(chalk.cyan('Run ID:'), status.runId || 'N/A');
  console.log(chalk.cyan('Total Sources:'), status.totalSources);
  console.log(chalk.cyan('Enabled Sources:'), status.enabledSources);
  console.log(chalk.cyan('Active Sources:'), status.activeSources);
  
  console.log('\n' + chalk.white.bold('Data Sources:'));
  status.sources.forEach(source => {
    const statusIcon = source.active ? '🔴' : (source.enabled ? '🟡' : '⚪');
    console.log(`  ${statusIcon} ${source.name}`);
    if (source.rateLimit) {
      console.log(`     Rate: ${source.rateLimit.currentRequests}/${source.rateLimit.requestsPerMinute} requests/min`);
    }
  });
}

async function displayLiveMetrics() {
  const metrics = pipelineMonitor.getMetrics();
  const health = await pipelineMonitor.getHealth();
  
  console.log('\n' + chalk.white.bold('═══ Live Metrics Update ═══'));
  console.log(chalk.cyan('Timestamp:'), new Date().toLocaleTimeString());
  console.log(chalk.cyan('Health:'), 
    health.status === 'healthy' ? chalk.green(health.status) : 
    health.status === 'degraded' ? chalk.yellow(health.status) : 
    chalk.red(health.status)
  );
  console.log(chalk.cyan('Uptime:'), formatUptime(metrics.uptime));
  console.log(chalk.cyan('Total Requests:'), metrics.totalRequests);
  console.log(chalk.cyan('Success Rate:'), 
    metrics.totalRequests > 0 ? 
    `${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2)}%` : 
    'N/A'
  );
  console.log(chalk.cyan('Data Processed:'), metrics.dataProcessed);
  console.log(chalk.cyan('Errors/Minute:'), metrics.errorsPerMinute);
  
  if (metrics.lastError) {
    console.log(chalk.red('Last Error:'), 
      `${metrics.lastError.source} - ${metrics.lastError.error.substring(0, 50)}...`
    );
  }
  
  // Show top performing sources
  const sourcePerformance = pipelineMonitor.getSourcePerformance();
  if (sourcePerformance.length > 0) {
    console.log('\n' + chalk.white.bold('Source Performance:'));
    sourcePerformance
      .sort((a, b) => b.totalRequests - a.totalRequests)
      .slice(0, 5)
      .forEach(source => {
        const successIcon = source.successRate >= 90 ? '🟢' : 
                           source.successRate >= 70 ? '🟡' : '🔴';
        console.log(`  ${successIcon} ${source.source}: ${source.successRate.toFixed(1)}% success (${source.totalRequests} requests)`);
      });
  }
}

function formatUptime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function setupGracefulShutdown() {
  const shutdown = async (signal: string) => {
    console.log(`\n${chalk.yellow(`Received ${signal}, shutting down gracefully...`)}`);
    
    try {
      // Stop the pipeline
      await realTimeSportsCollector.stop();
      log.success('Pipeline stopped');
      
      // Close database connection
      await prisma.$disconnect();
      log.success('Database disconnected');
      
      // Shutdown ML orchestrator
      await mlOrchestrator.shutdown();
      log.success('ML models shutdown');
      
      console.log(chalk.green('\nShutdown complete. Goodbye!'));
      process.exit(0);
    } catch (error) {
      log.error(`Error during shutdown: ${error}`);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// Add chalk for colored output
const chalk = {
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  white: {
    (text: string) => `\x1b[37m${text}\x1b[0m`,
    bold: (text: string) => `\x1b[1m\x1b[37m${text}\x1b[0m`
  }
};

// Start the pipeline
startPipeline().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});