/**
 * Data Pipeline Orchestrator
 * Manages and coordinates all real-time data collection pipelines
 */

import { espnDataAggregator } from './espn-data-aggregator';
import { yahooDataAggregator } from './yahoo-data-aggregator';
import { injuryWeatherPipeline } from './injury-weather-pipeline';
import { marketDataCollector } from './market-data-collector';
import { featureEngineering } from './real-time-feature-engineering';
import { prisma } from '@/lib/prisma';

interface PipelineStatus {
  name: string;
  status: 'running' | 'stopped' | 'error';
  lastUpdate: Date;
  updateInterval: number;
  recordsProcessed: number;
  errors: string[];
}

interface PipelineConfig {
  espnInterval?: number;
  yahooInterval?: number;
  injuryWeatherInterval?: number;
  marketDataInterval?: number;
  featureEngineeringInterval?: number;
}

export class DataPipelineOrchestrator {
  private pipelines: Map<string, PipelineStatus> = new Map();
  private isRunning = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  // Default intervals (in seconds)
  private defaultIntervals = {
    espn: 30,              // 30 seconds for live game data
    yahoo: 30,             // 30 seconds for live game data
    injuryWeather: 300,    // 5 minutes for injury/weather
    marketData: 300,       // 5 minutes for market data
    featureEngineering: 60 // 1 minute for feature updates
  };
  
  /**
   * Initialize all pipelines
   */
  private initializePipelines() {
    this.pipelines.set('ESPN', {
      name: 'ESPN Data Aggregator',
      status: 'stopped',
      lastUpdate: new Date(),
      updateInterval: this.defaultIntervals.espn,
      recordsProcessed: 0,
      errors: []
    });
    
    this.pipelines.set('Yahoo', {
      name: 'Yahoo Data Aggregator',
      status: 'stopped',
      lastUpdate: new Date(),
      updateInterval: this.defaultIntervals.yahoo,
      recordsProcessed: 0,
      errors: []
    });
    
    this.pipelines.set('InjuryWeather', {
      name: 'Injury & Weather Pipeline',
      status: 'stopped',
      lastUpdate: new Date(),
      updateInterval: this.defaultIntervals.injuryWeather,
      recordsProcessed: 0,
      errors: []
    });
    
    this.pipelines.set('MarketData', {
      name: 'Market Data Collector',
      status: 'stopped',
      lastUpdate: new Date(),
      updateInterval: this.defaultIntervals.marketData,
      recordsProcessed: 0,
      errors: []
    });
    
    this.pipelines.set('FeatureEngineering', {
      name: 'Real-Time Feature Engineering',
      status: 'stopped',
      lastUpdate: new Date(),
      updateInterval: this.defaultIntervals.featureEngineering,
      recordsProcessed: 0,
      errors: []
    });
  }
  
  /**
   * Start all data pipelines
   */
  async startAllPipelines(config?: PipelineConfig) {
    if (this.isRunning) {
      console.log('⚠️ Data pipelines are already running');
      return;
    }
    
    console.log('🚀 Starting Fantasy.AI Data Pipeline Orchestrator...');
    this.initializePipelines();
    this.isRunning = true;
    
    try {
      // Start individual pipelines with configured intervals
      await this.startPipeline('ESPN', 
        () => espnDataAggregator.startRealTimeUpdates(config?.espnInterval || this.defaultIntervals.espn)
      );
      
      await this.startPipeline('Yahoo',
        () => yahooDataAggregator.startRealTimeUpdates(config?.yahooInterval || this.defaultIntervals.yahoo)
      );
      
      await this.startPipeline('InjuryWeather',
        () => injuryWeatherPipeline.startPipeline(config?.injuryWeatherInterval || this.defaultIntervals.injuryWeather)
      );
      
      await this.startPipeline('MarketData',
        () => marketDataCollector.startMarketDataCollection(config?.marketDataInterval || this.defaultIntervals.marketData)
      );
      
      await this.startPipeline('FeatureEngineering',
        () => featureEngineering.startFeatureEngineering(config?.featureEngineeringInterval || this.defaultIntervals.featureEngineering)
      );
      
      // Start monitoring
      this.startMonitoring();
      
      // Log initial status
      await this.logSystemStatus();
      
      console.log('✅ All data pipelines started successfully!');
      console.log('📊 Real-time data collection is now active');
      
    } catch (error) {
      console.error('❌ Failed to start data pipelines:', error);
      this.isRunning = false;
      throw error;
    }
  }
  
  /**
   * Stop all data pipelines
   */
  async stopAllPipelines() {
    if (!this.isRunning) {
      console.log('⚠️ Data pipelines are not running');
      return;
    }
    
    console.log('🛑 Stopping all data pipelines...');
    
    // Stop individual pipelines
    espnDataAggregator.stopRealTimeUpdates();
    this.updatePipelineStatus('ESPN', 'stopped');
    
    yahooDataAggregator.stopRealTimeUpdates();
    this.updatePipelineStatus('Yahoo', 'stopped');
    
    injuryWeatherPipeline.stopPipeline();
    this.updatePipelineStatus('InjuryWeather', 'stopped');
    
    marketDataCollector.stopMarketDataCollection();
    this.updatePipelineStatus('MarketData', 'stopped');
    
    featureEngineering.stopFeatureEngineering();
    this.updatePipelineStatus('FeatureEngineering', 'stopped');
    
    // Stop monitoring
    this.stopMonitoring();
    
    this.isRunning = false;
    
    // Log final status
    await this.logSystemStatus();
    
    console.log('✅ All data pipelines stopped');
  }
  
  /**
   * Start individual pipeline with error handling
   */
  private async startPipeline(name: string, startFunction: () => Promise<void>) {
    try {
      await startFunction();
      this.updatePipelineStatus(name, 'running');
      console.log(`✅ ${name} pipeline started`);
    } catch (error) {
      console.error(`❌ Failed to start ${name} pipeline:`, error);
      this.updatePipelineStatus(name, 'error', error.message);
      throw error;
    }
  }
  
  /**
   * Update pipeline status
   */
  private updatePipelineStatus(name: string, status: 'running' | 'stopped' | 'error', error?: string) {
    const pipeline = this.pipelines.get(name);
    if (pipeline) {
      pipeline.status = status;
      pipeline.lastUpdate = new Date();
      if (error) {
        pipeline.errors.push(`${new Date().toISOString()}: ${error}`);
        // Keep only last 10 errors
        if (pipeline.errors.length > 10) {
          pipeline.errors = pipeline.errors.slice(-10);
        }
      }
    }
  }
  
  /**
   * Start monitoring pipeline health
   */
  private startMonitoring() {
    // Monitor every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      await this.checkPipelineHealth();
    }, 30000);
  }
  
  /**
   * Stop monitoring
   */
  private stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
  
  /**
   * Check health of all pipelines
   */
  private async checkPipelineHealth() {
    for (const [name, pipeline] of this.pipelines) {
      if (pipeline.status === 'running') {
        // Check if pipeline has updated recently (within 2x its interval)
        const timeSinceUpdate = Date.now() - pipeline.lastUpdate.getTime();
        const maxAllowedTime = pipeline.updateInterval * 2 * 1000;
        
        if (timeSinceUpdate > maxAllowedTime) {
          console.warn(`⚠️ ${name} pipeline may be stuck (no update for ${timeSinceUpdate / 1000}s)`);
          this.updatePipelineStatus(name, 'error', 'Pipeline appears to be stuck');
        }
      }
    }
    
    // Check database records
    const recentRecords = await prisma.dataSourceRecord.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
      }
    });
    
    if (this.isRunning && recentRecords === 0) {
      console.error('❌ No data records created in last 5 minutes!');
      await this.createAlert('No data records', 'high');
    }
  }
  
  /**
   * Log system status
   */
  private async logSystemStatus() {
    const status = {
      timestamp: new Date(),
      isRunning: this.isRunning,
      pipelines: Array.from(this.pipelines.entries()).map(([name, status]) => ({
        name,
        ...status
      })),
      databaseStats: await this.getDatabaseStats()
    };
    
    // Store status in database
    await prisma.dataSourceRecord.create({
      data: {
        sourceId: `pipeline_status_${Date.now()}`,
        dataType: 'PIPELINE_STATUS',
        source: 'ORCHESTRATOR',
        data: status as any
      }
    });
    
    console.log('📊 Pipeline Status:', JSON.stringify(status, null, 2));
  }
  
  /**
   * Get database statistics
   */
  private async getDatabaseStats() {
    const [totalRecords, recentRecords, recordsByType] = await Promise.all([
      prisma.dataSourceRecord.count(),
      prisma.dataSourceRecord.count({
        where: { createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } }
      }),
      prisma.dataSourceRecord.groupBy({
        by: ['dataType'],
        _count: true
      })
    ]);
    
    return {
      totalRecords,
      recentRecords,
      recordsByType: recordsByType.reduce((acc, item) => {
        acc[item.dataType] = item._count;
        return acc;
      }, {} as Record<string, number>)
    };
  }
  
  /**
   * Create system alert
   */
  private async createAlert(message: string, severity: 'low' | 'medium' | 'high') {
    await prisma.alert.create({
      data: {
        type: 'SYSTEM',
        severity,
        title: 'Data Pipeline Alert',
        message,
        data: {
          timestamp: new Date(),
          pipelines: Array.from(this.pipelines.entries())
        }
      }
    });
  }
  
  /**
   * Get current pipeline status
   */
  getPipelineStatus() {
    return {
      isRunning: this.isRunning,
      pipelines: Array.from(this.pipelines.entries()).map(([name, status]) => ({
        name,
        ...status
      }))
    };
  }
  
  /**
   * Restart a specific pipeline
   */
  async restartPipeline(pipelineName: string) {
    console.log(`🔄 Restarting ${pipelineName} pipeline...`);
    
    switch (pipelineName) {
      case 'ESPN':
        espnDataAggregator.stopRealTimeUpdates();
        await espnDataAggregator.startRealTimeUpdates(this.defaultIntervals.espn);
        break;
      case 'Yahoo':
        yahooDataAggregator.stopRealTimeUpdates();
        await yahooDataAggregator.startRealTimeUpdates(this.defaultIntervals.yahoo);
        break;
      case 'InjuryWeather':
        injuryWeatherPipeline.stopPipeline();
        await injuryWeatherPipeline.startPipeline(this.defaultIntervals.injuryWeather);
        break;
      case 'MarketData':
        marketDataCollector.stopMarketDataCollection();
        await marketDataCollector.startMarketDataCollection(this.defaultIntervals.marketData);
        break;
      case 'FeatureEngineering':
        featureEngineering.stopFeatureEngineering();
        await featureEngineering.startFeatureEngineering(this.defaultIntervals.featureEngineering);
        break;
      default:
        throw new Error(`Unknown pipeline: ${pipelineName}`);
    }
    
    this.updatePipelineStatus(pipelineName, 'running');
    console.log(`✅ ${pipelineName} pipeline restarted`);
  }
  
  /**
   * Get data pipeline metrics
   */
  async getMetrics() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const metrics = await prisma.dataSourceRecord.groupBy({
      by: ['dataType', 'source'],
      where: {
        createdAt: { gte: oneHourAgo }
      },
      _count: true
    });
    
    return {
      timestamp: now,
      hourlyMetrics: metrics,
      pipelineStatus: this.getPipelineStatus(),
      totalRecordsLastHour: metrics.reduce((sum, m) => sum + m._count, 0)
    };
  }
}

// Create singleton instance
export const dataPipelineOrchestrator = new DataPipelineOrchestrator();