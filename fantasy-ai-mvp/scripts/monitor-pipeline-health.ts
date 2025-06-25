#!/usr/bin/env tsx
/**
 * MONITOR PIPELINE HEALTH
 * Real-time monitoring dashboard for the live data pipeline
 * Shows health status, metrics, and alerts
 */

import { pipelineMonitor } from '../src/lib/live-data-pipeline/pipeline-monitor';
import { realTimeSportsCollector } from '../src/lib/live-data-pipeline/real-time-sports-collector';
import chalk from 'chalk';
import { table } from 'table';

// Terminal colors
const log = {
  info: (msg: string) => console.log(chalk.blue('ℹ️'), msg),
  success: (msg: string) => console.log(chalk.green('✅'), msg),
  warning: (msg: string) => console.log(chalk.yellow('⚠️'), msg),
  error: (msg: string) => console.log(chalk.red('❌'), msg),
  metric: (label: string, value: any, unit?: string) => {
    const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;
    console.log(`  ${chalk.cyan(label.padEnd(20))} ${chalk.white(formattedValue)}${unit ? chalk.gray(unit) : ''}`);
  }
};

// Health status indicators
const healthIndicators = {
  healthy: chalk.green('⬤'),
  degraded: chalk.yellow('⬤'),
  unhealthy: chalk.red('⬤')
};

let displayMode: 'overview' | 'sources' | 'errors' | 'live' = 'overview';
let refreshInterval: NodeJS.Timeout;

async function startMonitoring() {
  console.clear();
  console.log(chalk.cyan.bold('
📡 Fantasy.AI Live Data Pipeline Monitor'));
  console.log(chalk.gray('Press Q to quit, O for overview, S for sources, E for errors, L for live feed\n'));

  // Set up keyboard input
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', handleKeypress);

  // Set up event listeners
  setupEventListeners();

  // Start display refresh
  refreshDisplay();
  refreshInterval = setInterval(refreshDisplay, 1000);
}

function handleKeypress(key: string) {
  switch (key.toLowerCase()) {
    case 'q':
      shutdown();
      break;
    case 'o':
      displayMode = 'overview';
      refreshDisplay();
      break;
    case 's':
      displayMode = 'sources';
      refreshDisplay();
      break;
    case 'e':
      displayMode = 'errors';
      refreshDisplay();
      break;
    case 'l':
      displayMode = 'live';
      refreshDisplay();
      break;
    case '\u0003': // Ctrl+C
      shutdown();
      break;
  }
}

function setupEventListeners() {
  // Listen for critical events
  pipelineMonitor.on('sourceUnhealthy', (data) => {
    log.error(`Source unhealthy: ${data.source} - ${data.failures} failures`);
  });

  pipelineMonitor.on('collectionError', (error) => {
    if (displayMode === 'live') {
      log.error(`Error: ${error.source} - ${error.error}`);
    }
  });

  pipelineMonitor.on('collectionSuccess', (data) => {
    if (displayMode === 'live') {
      log.success(`Collected ${data.recordCount} records from ${data.source}`);
    }
  });
}

async function refreshDisplay() {
  // Clear screen except for header
  process.stdout.write('\x1B[2J\x1B[3;0H');

  // Display navigation
  console.log(chalk.gray('Navigation: [O]verview [S]ources [E]rrors [L]ive [Q]uit'));
  console.log(chalk.gray(`Current view: ${chalk.white(displayMode.toUpperCase())}\n`));

  switch (displayMode) {
    case 'overview':
      await displayOverview();
      break;
    case 'sources':
      await displaySources();
      break;
    case 'errors':
      await displayErrors();
      break;
    case 'live':
      // Live updates are handled by event listeners
      console.log(chalk.cyan('Live Feed (showing real-time updates):\n'));
      break;
  }
}

async function displayOverview() {
  const metrics = pipelineMonitor.getMetrics();
  const health = await pipelineMonitor.getHealth();
  const pipelineStatus = realTimeSportsCollector.getStatus();

  // Health Status
  console.log(chalk.white.bold('System Health'));
  console.log(`  Status: ${healthIndicators[health.status]} ${health.status}`);
  if (health.issues.length > 0) {
    health.issues.forEach(issue => {
      console.log(`  ${chalk.yellow('⚠')} ${issue}`);
    });
  }
  console.log();

  // Pipeline Status
  console.log(chalk.white.bold('Pipeline Status'));
  log.metric('Running:', pipelineStatus.isRunning ? chalk.green('Yes') : chalk.red('No'));
  log.metric('Run ID:', pipelineStatus.runId || 'N/A');
  log.metric('Active Sources:', `${pipelineStatus.activeSources}/${pipelineStatus.totalSources}`);
  console.log();

  // Performance Metrics
  console.log(chalk.white.bold('Performance Metrics'));
  log.metric('Uptime:', formatDuration(metrics.uptime));
  log.metric('Total Requests:', metrics.totalRequests);
  log.metric('Success Rate:', 
    metrics.totalRequests > 0 
      ? `${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2)}%`
      : 'N/A'
  );
  log.metric('Data Processed:', metrics.dataProcessed, ' records');
  log.metric('Avg Latency:', `${metrics.averageLatency.toFixed(0)}ms`);
  log.metric('Errors/Min:', metrics.errorsPerMinute);
  console.log();

  // System Resources
  console.log(chalk.white.bold('System Resources'));
  log.metric('Memory Usage:', `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);
  log.metric('CPU Usage:', `${process.cpuUsage().user / 1000000}s`);
  console.log();

  // Last Error
  if (metrics.lastError) {
    console.log(chalk.white.bold('Last Error'));
    log.metric('Source:', metrics.lastError.source);
    log.metric('Error:', metrics.lastError.error.substring(0, 50) + '...');
    log.metric('Time:', new Date(metrics.lastError.timestamp).toLocaleTimeString());
  }
}

async function displaySources() {
  const sourcePerformance = pipelineMonitor.getSourcePerformance();
  const pipelineStatus = realTimeSportsCollector.getStatus();

  console.log(chalk.white.bold('Data Source Performance\n'));

  // Create table
  const tableData = [
    ['Source', 'Status', 'Success Rate', 'Requests', 'Rate Limit']
  ];

  pipelineStatus.sources.forEach(source => {
    const perf = sourcePerformance.find(p => p.source === source.id);
    const status = source.active ? chalk.green('● Active') : 
                   source.enabled ? chalk.yellow('● Enabled') : 
                   chalk.gray('○ Disabled');
    
    const successRate = perf ? `${perf.successRate.toFixed(1)}%` : 'N/A';
    const requests = perf ? perf.totalRequests.toString() : '0';
    const rateLimit = source.rateLimit 
      ? `${source.rateLimit.currentRequests}/${source.rateLimit.requestsPerMinute}/min`
      : 'N/A';

    tableData.push([
      source.name,
      status,
      successRate,
      requests,
      rateLimit
    ]);
  });

  console.log(table(tableData, {
    border: {
      topBody: `─`,
      topJoin: `┬`,
      topLeft: `┌`,
      topRight: `┐`,
      bottomBody: `─`,
      bottomJoin: `┴`,
      bottomLeft: `└`,
      bottomRight: `┘`,
      bodyLeft: `│`,
      bodyRight: `│`,
      bodyJoin: `│`,
      joinBody: `─`,
      joinLeft: `├`,
      joinRight: `┤`,
      joinJoin: `┼`
    }
  }));

  // Show detailed metrics for each source
  const sourceMetrics = pipelineMonitor.getMetrics().sourceMetrics;
  if (sourceMetrics.size > 0) {
    console.log(chalk.white.bold('\nDetailed Source Metrics:'));
    sourceMetrics.forEach((metric, sourceId) => {
      console.log(`\n  ${chalk.cyan(sourceId)}`);
      console.log(`    Last Success: ${metric.lastSuccess ? new Date(metric.lastSuccess).toLocaleTimeString() : 'Never'}`);
      console.log(`    Last Failure: ${metric.lastFailure ? new Date(metric.lastFailure).toLocaleTimeString() : 'Never'}`);
      console.log(`    Avg Latency: ${metric.averageLatency.toFixed(0)}ms`);
    });
  }
}

async function displayErrors() {
  const errorHistory = pipelineMonitor.getErrorHistory(10); // Last 10 minutes
  
  console.log(chalk.white.bold('Error History (Last 10 Minutes)\n'));

  if (errorHistory.length === 0) {
    console.log(chalk.green('No errors in the last 10 minutes! 🎉'));
    return;
  }

  // Group errors by source
  const errorsBySource = new Map<string, typeof errorHistory>();
  errorHistory.forEach(error => {
    if (!errorsBySource.has(error.source)) {
      errorsBySource.set(error.source, []);
    }
    errorsBySource.get(error.source)!.push(error);
  });

  // Display errors grouped by source
  errorsBySource.forEach((errors, source) => {
    console.log(`\n${chalk.red(source)} (${errors.length} errors)`);
    errors.slice(0, 5).forEach(error => {
      console.log(`  ${chalk.gray(new Date(error.timestamp).toLocaleTimeString())} - ${error.error.substring(0, 80)}...`);
    });
    if (errors.length > 5) {
      console.log(`  ${chalk.gray(`... and ${errors.length - 5} more`)}`);
    }
  });

  // Error summary
  console.log('\n' + chalk.white.bold('Error Summary:'));
  const metrics = pipelineMonitor.getMetrics();
  log.metric('Total Errors:', metrics.failedRequests);
  log.metric('Error Rate:', `${metrics.errorsPerMinute}/min`);
  log.metric('Failure Rate:', 
    metrics.totalRequests > 0 
      ? `${((metrics.failedRequests / metrics.totalRequests) * 100).toFixed(2)}%`
      : 'N/A'
  );
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
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

function shutdown() {
  console.log('\n' + chalk.yellow('Shutting down monitor...'));
  
  // Clear interval
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  // Reset terminal
  process.stdin.setRawMode(false);
  process.stdin.pause();
  
  console.log(chalk.green('Monitor stopped. Goodbye!'));
  process.exit(0);
}

// Table formatting utility
const table = (data: string[][], config?: any) => {
  // Simple table implementation
  const colWidths = data[0].map((_, colIndex) => 
    Math.max(...data.map(row => row[colIndex]?.length || 0))
  );

  return data.map((row, rowIndex) => {
    const formattedRow = row.map((cell, colIndex) => 
      cell.padEnd(colWidths[colIndex])
    ).join(' | ');
    
    if (rowIndex === 0) {
      const separator = colWidths.map(w => '-'.repeat(w)).join('-+-');
      return formattedRow + '\n' + separator;
    }
    return formattedRow;
  }).join('\n');
};

// Color utilities
const chalk = {
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  gray: (text: string) => `\x1b[90m${text}\x1b[0m`,
  white: {
    (text: string) => `\x1b[37m${text}\x1b[0m`,
    bold: (text: string) => `\x1b[1m\x1b[37m${text}\x1b[0m`
  }
};

// Start monitoring
startMonitoring().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});