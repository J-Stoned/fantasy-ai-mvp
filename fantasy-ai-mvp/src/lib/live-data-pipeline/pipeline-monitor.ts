/**
 * PIPELINE MONITOR SERVICE
 * Monitors health, performance, and errors of the live data pipeline
 * Provides real-time metrics and alerts
 */

import { EventEmitter } from 'events';
import { realTimeSportsCollector } from './real-time-sports-collector';

export interface PipelineMetrics {
  uptime: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  dataProcessed: number;
  errorsPerMinute: number;
  lastError?: {
    source: string;
    error: string;
    timestamp: Date;
  };
  sourceMetrics: Map<string, SourceMetrics>;
}

export interface SourceMetrics {
  source: string;
  requests: number;
  successes: number;
  failures: number;
  averageLatency: number;
  lastSuccess?: Date;
  lastFailure?: Date;
  rateLimit: {
    current: number;
    limit: number;
    resetTime: Date;
  };
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    pipeline: boolean;
    database: boolean;
    mlModels: boolean;
    mcpServers: boolean;
  };
  issues: string[];
  timestamp: Date;
}

export class PipelineMonitor extends EventEmitter {
  private metrics: PipelineMetrics;
  private sourceMetrics: Map<string, SourceMetrics> = new Map();
  private errorBuffer: Array<{ source: string; error: string; timestamp: Date }> = [];
  private startTime: Date;
  private monitoringInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.startTime = new Date();
    this.metrics = this.initializeMetrics();
    this.setupEventListeners();
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): PipelineMetrics {
    return {
      uptime: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      dataProcessed: 0,
      errorsPerMinute: 0,
      sourceMetrics: new Map()
    };
  }

  /**
   * Setup event listeners for the pipeline
   */
  private setupEventListeners() {
    // Pipeline events
    realTimeSportsCollector.on('pipelineStarted', (data) => {
      console.log('📡 Pipeline monitor: Pipeline started', data);
      this.startMonitoring();
    });

    realTimeSportsCollector.on('pipelineStopped', (data) => {
      console.log('🛑 Pipeline monitor: Pipeline stopped', data);
      this.stopMonitoring();
    });

    // Data collection events
    realTimeSportsCollector.on('dataCollected', (data) => {
      this.recordSuccess(data.source, data.recordCount);
    });

    realTimeSportsCollector.on('collectionError', (error) => {
      this.recordError(error.source, error.error);
    });

    // Data processing events
    realTimeSportsCollector.on('playerUpdated', () => {
      this.metrics.dataProcessed++;
    });

    realTimeSportsCollector.on('injuryUpdate', () => {
      this.metrics.dataProcessed++;
    });

    realTimeSportsCollector.on('gameUpdate', () => {
      this.metrics.dataProcessed++;
    });

    realTimeSportsCollector.on('oddsUpdate', () => {
      this.metrics.dataProcessed++;
    });

    realTimeSportsCollector.on('weatherUpdate', () => {
      this.metrics.dataProcessed++;
    });

    realTimeSportsCollector.on('newsUpdate', () => {
      this.metrics.dataProcessed++;
    });
  }

  /**
   * Start monitoring
   */
  private startMonitoring() {
    // Update metrics every second
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
    }, 1000);

    // Health check every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      const health = await this.performHealthCheck();
      this.emit('healthCheck', health);
    }, 30000);

    // Initial health check
    this.performHealthCheck().then(health => {
      this.emit('healthCheck', health);
    });
  }

  /**
   * Stop monitoring
   */
  private stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  /**
   * Update metrics
   */
  private updateMetrics() {
    // Update uptime
    this.metrics.uptime = Date.now() - this.startTime.getTime();

    // Calculate errors per minute
    const oneMinuteAgo = Date.now() - 60000;
    const recentErrors = this.errorBuffer.filter(e => e.timestamp.getTime() > oneMinuteAgo);
    this.metrics.errorsPerMinute = recentErrors.length;

    // Clean old errors from buffer
    this.errorBuffer = this.errorBuffer.filter(e => e.timestamp.getTime() > oneMinuteAgo - 300000); // Keep 5 minutes

    // Update source metrics
    this.metrics.sourceMetrics = new Map(this.sourceMetrics);

    // Emit metrics update
    this.emit('metricsUpdate', this.getMetrics());
  }

  /**
   * Record successful data collection
   */
  private recordSuccess(sourceId: string, recordCount: number) {
    this.metrics.totalRequests++;
    this.metrics.successfulRequests++;

    // Update source metrics
    const sourceMetric = this.getOrCreateSourceMetric(sourceId);
    sourceMetric.requests++;
    sourceMetric.successes++;
    sourceMetric.lastSuccess = new Date();

    // Emit success event
    this.emit('collectionSuccess', {
      source: sourceId,
      recordCount,
      timestamp: new Date()
    });
  }

  /**
   * Record collection error
   */
  private recordError(sourceId: string, error: string) {
    this.metrics.totalRequests++;
    this.metrics.failedRequests++;

    // Update source metrics
    const sourceMetric = this.getOrCreateSourceMetric(sourceId);
    sourceMetric.requests++;
    sourceMetric.failures++;
    sourceMetric.lastFailure = new Date();

    // Add to error buffer
    const errorEntry = {
      source: sourceId,
      error,
      timestamp: new Date()
    };
    this.errorBuffer.push(errorEntry);
    this.metrics.lastError = errorEntry;

    // Emit error event
    this.emit('collectionError', errorEntry);

    // Check if source needs intervention
    if (sourceMetric.failures > 5 && sourceMetric.successes === 0) {
      this.emit('sourceUnhealthy', {
        source: sourceId,
        failures: sourceMetric.failures,
        lastFailure: sourceMetric.lastFailure
      });
    }
  }

  /**
   * Get or create source metric
   */
  private getOrCreateSourceMetric(sourceId: string): SourceMetrics {
    if (!this.sourceMetrics.has(sourceId)) {
      this.sourceMetrics.set(sourceId, {
        source: sourceId,
        requests: 0,
        successes: 0,
        failures: 0,
        averageLatency: 0,
        rateLimit: {
          current: 0,
          limit: 60,
          resetTime: new Date(Date.now() + 60000)
        }
      });
    }
    return this.sourceMetrics.get(sourceId)!;
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<HealthCheck> {
    const issues: string[] = [];
    const checks = {
      pipeline: false,
      database: false,
      mlModels: false,
      mcpServers: false
    };

    // Check pipeline status
    const pipelineStatus = realTimeSportsCollector.getStatus();
    checks.pipeline = pipelineStatus.isRunning;
    if (!checks.pipeline) {
      issues.push('Pipeline is not running');
    }

    // Check database connection (simplified)
    try {
      // In production, actually test database connection
      checks.database = true;
    } catch (error) {
      checks.database = false;
      issues.push('Database connection failed');
    }

    // Check ML models (simplified)
    try {
      // In production, check ML orchestrator status
      checks.mlModels = true;
    } catch (error) {
      checks.mlModels = false;
      issues.push('ML models unavailable');
    }

    // Check MCP servers (simplified)
    try {
      // In production, ping each MCP server
      checks.mcpServers = true;
    } catch (error) {
      checks.mcpServers = false;
      issues.push('MCP servers unavailable');
    }

    // Check error rate
    if (this.metrics.errorsPerMinute > 10) {
      issues.push(`High error rate: ${this.metrics.errorsPerMinute} errors/minute`);
    }

    // Check success rate
    const successRate = this.metrics.totalRequests > 0
      ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100
      : 0;
    if (successRate < 80 && this.metrics.totalRequests > 100) {
      issues.push(`Low success rate: ${successRate.toFixed(2)}%`);
    }

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (issues.length > 0) {
      status = issues.length > 2 ? 'unhealthy' : 'degraded';
    }

    return {
      status,
      checks,
      issues,
      timestamp: new Date()
    };
  }

  /**
   * Get current metrics
   */
  getMetrics(): PipelineMetrics {
    return {
      ...this.metrics,
      sourceMetrics: new Map(this.sourceMetrics)
    };
  }

  /**
   * Get health status
   */
  async getHealth(): Promise<HealthCheck> {
    return this.performHealthCheck();
  }

  /**
   * Get error history
   */
  getErrorHistory(minutes: number = 5): Array<{ source: string; error: string; timestamp: Date }> {
    const cutoff = Date.now() - (minutes * 60000);
    return this.errorBuffer.filter(e => e.timestamp.getTime() > cutoff);
  }

  /**
   * Get source performance
   */
  getSourcePerformance(): Array<{
    source: string;
    successRate: number;
    failureRate: number;
    totalRequests: number;
  }> {
    return Array.from(this.sourceMetrics.values()).map(metric => ({
      source: metric.source,
      successRate: metric.requests > 0 ? (metric.successes / metric.requests) * 100 : 0,
      failureRate: metric.requests > 0 ? (metric.failures / metric.requests) * 100 : 0,
      totalRequests: metric.requests
    }));
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = this.initializeMetrics();
    this.sourceMetrics.clear();
    this.errorBuffer = [];
    this.startTime = new Date();
    console.log('🔄 Pipeline metrics reset');
  }
}

// Export singleton
export const pipelineMonitor = new PipelineMonitor();