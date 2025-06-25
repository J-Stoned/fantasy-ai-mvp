import { prisma } from '@/lib/prisma';
import { cache, pubsub } from '@/lib/redis/redis-client';
import { notificationManager } from '@/lib/realtime/notification-manager';
import { mlOrchestrator } from './ml-orchestrator';
import { EventEmitter } from 'events';

export interface ModelMetrics {
  modelType: string;
  version: number;
  timestamp: Date;
  performance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    latency: {
      p50: number;
      p95: number;
      p99: number;
      average: number;
    };
    throughput: number;
    errorRate: number;
  };
  dataQuality: {
    missingFeatures: number;
    outliers: number;
    invalidInputs: number;
  };
  drift: {
    featureDrift: Record<string, number>;
    predictionDrift: number;
    conceptDrift: number;
  };
  resource: {
    cpuUsage: number;
    memoryUsage: number;
    gpuUsage?: number;
    cacheHitRate: number;
  };
}

export interface Alert {
  id: string;
  modelType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  message: string;
  metrics: any;
  timestamp: Date;
  resolved: boolean;
}

export class ModelMonitor extends EventEmitter {
  private metricsBuffer: Map<string, ModelMetrics[]> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private thresholds: Map<string, any> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initializeThresholds();
    this.startMonitoring();
  }

  /**
   * Initialize monitoring thresholds
   */
  private initializeThresholds() {
    // Default thresholds for all models
    const defaultThresholds = {
      accuracy: { min: 0.8, warning: 0.85 },
      latency: { max: 100, warning: 50 }, // ms
      errorRate: { max: 0.05, warning: 0.02 },
      drift: { max: 0.3, warning: 0.2 },
      cpuUsage: { max: 0.9, warning: 0.7 },
      memoryUsage: { max: 0.9, warning: 0.7 }
    };

    // Model-specific thresholds
    this.thresholds.set('player_performance', {
      ...defaultThresholds,
      accuracy: { min: 0.75, warning: 0.8 } // Lower threshold for regression
    });

    this.thresholds.set('injury_risk', {
      ...defaultThresholds,
      accuracy: { min: 0.85, warning: 0.9 } // Higher threshold for safety
    });

    this.thresholds.set('lineup_optimizer', {
      ...defaultThresholds,
      latency: { max: 200, warning: 100 } // More complex computation
    });
  }

  /**
   * Start monitoring loop
   */
  private startMonitoring() {
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
        await this.analyzeMetrics();
        await this.checkAlerts();
      } catch (error) {
        console.error('Model monitoring error:', error);
      }
    }, 60000); // Every minute

    console.log('✅ Model monitoring started');
  }

  /**
   * Collect metrics for all active models
   */
  private async collectMetrics() {
    const systemStatus = await mlOrchestrator.getSystemStatus();

    for (const modelStatus of systemStatus.models) {
      if (modelStatus.status === 'idle' || modelStatus.status === 'inferring') {
        const metrics = await this.collectModelMetrics(modelStatus);
        
        // Add to buffer
        if (!this.metricsBuffer.has(modelStatus.name)) {
          this.metricsBuffer.set(modelStatus.name, []);
        }
        
        const buffer = this.metricsBuffer.get(modelStatus.name)!;
        buffer.push(metrics);
        
        // Keep last hour of metrics (60 data points)
        if (buffer.length > 60) {
          buffer.shift();
        }

        // Store in Redis for dashboards
        await cache.set(
          `ml:metrics:${modelStatus.name}:latest`,
          metrics,
          300 // 5 minutes
        );

        // Publish metrics
        await pubsub.publish('ml:metrics', {
          modelType: modelStatus.name,
          metrics
        });
      }
    }
  }

  /**
   * Collect metrics for a specific model
   */
  private async collectModelMetrics(modelStatus: any): Promise<ModelMetrics> {
    // Get recent predictions for accuracy calculation
    const recentPredictions = await prisma.mLPrediction.findMany({
      where: {
        modelType: modelStatus.name,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Calculate performance metrics
    const performance = this.calculatePerformanceMetrics(recentPredictions);

    // Check data quality
    const dataQuality = this.analyzeDataQuality(recentPredictions);

    // Detect drift
    const drift = await this.detectDrift(modelStatus.name, recentPredictions);

    // Get resource usage
    const resource = await this.getResourceUsage(modelStatus.name);

    return {
      modelType: modelStatus.name,
      version: parseInt(modelStatus.version),
      timestamp: new Date(),
      performance,
      dataQuality,
      drift,
      resource
    };
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(predictions: any[]): ModelMetrics['performance'] {
    if (predictions.length === 0) {
      return {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        latency: { p50: 0, p95: 0, p99: 0, average: 0 },
        throughput: 0,
        errorRate: 0
      };
    }

    // Calculate accuracy (simplified - would need actual vs predicted)
    const accuracy = predictions.reduce((sum, p) => sum + (p.confidence || 0), 0) / predictions.length;

    // Calculate latency percentiles
    const latencies = predictions
      .map(p => p.metadata?.latency || 0)
      .filter(l => l > 0)
      .sort((a, b) => a - b);

    const latency = {
      p50: this.percentile(latencies, 0.5),
      p95: this.percentile(latencies, 0.95),
      p99: this.percentile(latencies, 0.99),
      average: latencies.reduce((a, b) => a + b, 0) / latencies.length || 0
    };

    // Calculate throughput (predictions per second)
    const timeRange = predictions[0].createdAt.getTime() - 
                     predictions[predictions.length - 1].createdAt.getTime();
    const throughput = timeRange > 0 ? (predictions.length / timeRange) * 1000 : 0;

    // Calculate error rate
    const errors = predictions.filter(p => p.metadata?.error).length;
    const errorRate = errors / predictions.length;

    return {
      accuracy,
      precision: accuracy * 0.95, // Mock
      recall: accuracy * 0.9, // Mock
      f1Score: accuracy * 0.92, // Mock
      latency,
      throughput,
      errorRate
    };
  }

  /**
   * Analyze data quality
   */
  private analyzeDataQuality(predictions: any[]): ModelMetrics['dataQuality'] {
    let missingFeatures = 0;
    let outliers = 0;
    let invalidInputs = 0;

    predictions.forEach(p => {
      const input = p.inputData as any;
      
      // Check for missing features
      if (input && Object.values(input).some(v => v === null || v === undefined)) {
        missingFeatures++;
      }

      // Check for outliers (simplified)
      if (input && this.hasOutliers(input)) {
        outliers++;
      }

      // Check for invalid inputs
      if (!input || Object.keys(input).length === 0) {
        invalidInputs++;
      }
    });

    return {
      missingFeatures: missingFeatures / predictions.length,
      outliers: outliers / predictions.length,
      invalidInputs: invalidInputs / predictions.length
    };
  }

  /**
   * Detect model drift
   */
  private async detectDrift(
    modelType: string,
    predictions: any[]
  ): Promise<ModelMetrics['drift']> {
    // Get baseline distribution
    const baseline = await cache.get<any>(`ml:baseline:${modelType}`);
    if (!baseline) {
      // No baseline yet, create one
      await this.createBaseline(modelType, predictions);
      return {
        featureDrift: {},
        predictionDrift: 0,
        conceptDrift: 0
      };
    }

    // Calculate feature drift
    const featureDrift: Record<string, number> = {};
    const currentFeatures = this.extractFeatureDistribution(predictions);
    
    for (const [feature, distribution] of Object.entries(currentFeatures)) {
      if (baseline.features[feature]) {
        featureDrift[feature] = this.calculateKLDivergence(
          baseline.features[feature],
          distribution as any
        );
      }
    }

    // Calculate prediction drift
    const currentPredictions = predictions.map(p => p.prediction);
    const predictionDrift = this.calculateDistributionDrift(
      baseline.predictions,
      currentPredictions
    );

    // Calculate concept drift (change in accuracy over time)
    const conceptDrift = Math.abs(baseline.accuracy - this.calculateAccuracy(predictions));

    return {
      featureDrift,
      predictionDrift,
      conceptDrift
    };
  }

  /**
   * Get resource usage
   */
  private async getResourceUsage(modelType: string): Promise<ModelMetrics['resource']> {
    // Get from system metrics
    const systemStatus = await mlOrchestrator.getSystemStatus();
    
    // Calculate cache hit rate
    const cacheHits = await cache.get<number>(`ml:cache:hits:${modelType}`) || 0;
    const cacheTotal = await cache.get<number>(`ml:cache:total:${modelType}`) || 1;
    const cacheHitRate = cacheHits / cacheTotal;

    return {
      cpuUsage: 0.3 + Math.random() * 0.4, // Mock
      memoryUsage: systemStatus.gpu.memory / 8, // Assuming 8GB max
      gpuUsage: systemStatus.gpu.utilization / 100,
      cacheHitRate
    };
  }

  /**
   * Analyze metrics and generate alerts
   */
  private async analyzeMetrics() {
    for (const [modelType, metricsBuffer] of this.metricsBuffer) {
      if (metricsBuffer.length === 0) continue;

      const latestMetrics = metricsBuffer[metricsBuffer.length - 1];
      const thresholds = this.thresholds.get(modelType) || this.thresholds.get('default');

      // Check accuracy
      if (latestMetrics.performance.accuracy < thresholds.accuracy.min) {
        await this.createAlert({
          modelType,
          severity: 'critical',
          type: 'accuracy_degradation',
          message: `Model accuracy (${(latestMetrics.performance.accuracy * 100).toFixed(1)}%) below threshold (${thresholds.accuracy.min * 100}%)`,
          metrics: { accuracy: latestMetrics.performance.accuracy }
        });
      } else if (latestMetrics.performance.accuracy < thresholds.accuracy.warning) {
        await this.createAlert({
          modelType,
          severity: 'medium',
          type: 'accuracy_warning',
          message: `Model accuracy (${(latestMetrics.performance.accuracy * 100).toFixed(1)}%) approaching threshold`,
          metrics: { accuracy: latestMetrics.performance.accuracy }
        });
      }

      // Check latency
      if (latestMetrics.performance.latency.p95 > thresholds.latency.max) {
        await this.createAlert({
          modelType,
          severity: 'high',
          type: 'high_latency',
          message: `P95 latency (${latestMetrics.performance.latency.p95}ms) exceeds threshold (${thresholds.latency.max}ms)`,
          metrics: { latency: latestMetrics.performance.latency }
        });
      }

      // Check error rate
      if (latestMetrics.performance.errorRate > thresholds.errorRate.max) {
        await this.createAlert({
          modelType,
          severity: 'critical',
          type: 'high_error_rate',
          message: `Error rate (${(latestMetrics.performance.errorRate * 100).toFixed(1)}%) exceeds threshold`,
          metrics: { errorRate: latestMetrics.performance.errorRate }
        });
      }

      // Check drift
      const maxDrift = Math.max(...Object.values(latestMetrics.drift.featureDrift));
      if (maxDrift > thresholds.drift.max) {
        await this.createAlert({
          modelType,
          severity: 'high',
          type: 'model_drift',
          message: `Feature drift detected (${(maxDrift * 100).toFixed(1)}% divergence)`,
          metrics: { drift: latestMetrics.drift }
        });
      }

      // Check resource usage
      if (latestMetrics.resource.cpuUsage > thresholds.cpuUsage.max) {
        await this.createAlert({
          modelType,
          severity: 'medium',
          type: 'high_cpu_usage',
          message: `CPU usage (${(latestMetrics.resource.cpuUsage * 100).toFixed(1)}%) exceeds threshold`,
          metrics: { cpuUsage: latestMetrics.resource.cpuUsage }
        });
      }
    }
  }

  /**
   * Create or update alert
   */
  private async createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'resolved'>) {
    const alertId = `${alertData.modelType}:${alertData.type}`;
    const existingAlert = this.alerts.get(alertId);

    if (existingAlert && !existingAlert.resolved) {
      // Update existing alert
      existingAlert.metrics = alertData.metrics;
      existingAlert.timestamp = new Date();
    } else {
      // Create new alert
      const alert: Alert = {
        id: alertId,
        ...alertData,
        timestamp: new Date(),
        resolved: false
      };

      this.alerts.set(alertId, alert);

      // Send notification
      await this.sendAlertNotification(alert);

      // Emit event
      this.emit('alert', alert);
    }
  }

  /**
   * Send alert notification
   */
  private async sendAlertNotification(alert: Alert) {
    // Get all admin users
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true }
    });

    for (const admin of admins) {
      await notificationManager.send({
        userId: admin.id,
        type: 'ml_alert',
        title: `ML Alert: ${alert.modelType}`,
        message: alert.message,
        data: alert,
        priority: alert.severity === 'critical' ? 'high' : 'medium',
        push: alert.severity === 'critical'
      });
    }
  }

  /**
   * Check and auto-resolve alerts
   */
  private async checkAlerts() {
    for (const [alertId, alert] of this.alerts) {
      if (!alert.resolved) {
        // Check if condition still exists
        const metricsBuffer = this.metricsBuffer.get(alert.modelType);
        if (metricsBuffer && metricsBuffer.length > 0) {
          const latestMetrics = metricsBuffer[metricsBuffer.length - 1];
          const isResolved = this.isAlertConditionResolved(alert, latestMetrics);

          if (isResolved) {
            alert.resolved = true;
            this.emit('alert_resolved', alert);
            console.log(`✅ Alert resolved: ${alert.id}`);
          }
        }
      }
    }
  }

  /**
   * Check if alert condition is resolved
   */
  private isAlertConditionResolved(alert: Alert, metrics: ModelMetrics): boolean {
    const thresholds = this.thresholds.get(alert.modelType) || this.thresholds.get('default');

    switch (alert.type) {
      case 'accuracy_degradation':
      case 'accuracy_warning':
        return metrics.performance.accuracy >= thresholds.accuracy.warning;
      
      case 'high_latency':
        return metrics.performance.latency.p95 <= thresholds.latency.warning;
      
      case 'high_error_rate':
        return metrics.performance.errorRate <= thresholds.errorRate.warning;
      
      case 'model_drift':
        const maxDrift = Math.max(...Object.values(metrics.drift.featureDrift));
        return maxDrift <= thresholds.drift.warning;
      
      case 'high_cpu_usage':
        return metrics.resource.cpuUsage <= thresholds.cpuUsage.warning;
      
      default:
        return false;
    }
  }

  /**
   * Get monitoring dashboard data
   */
  async getDashboardData(modelType?: string): Promise<{
    metrics: Record<string, ModelMetrics[]>;
    alerts: Alert[];
    summary: Record<string, any>;
  }> {
    const metrics: Record<string, ModelMetrics[]> = {};
    
    if (modelType) {
      const buffer = this.metricsBuffer.get(modelType);
      if (buffer) {
        metrics[modelType] = buffer;
      }
    } else {
      // Get all models
      for (const [type, buffer] of this.metricsBuffer) {
        metrics[type] = buffer;
      }
    }

    const alerts = Array.from(this.alerts.values()).filter(
      alert => !modelType || alert.modelType === modelType
    );

    // Calculate summary statistics
    const summary: Record<string, any> = {};
    
    for (const [type, buffer] of Object.entries(metrics)) {
      if (buffer.length > 0) {
        const latest = buffer[buffer.length - 1];
        summary[type] = {
          accuracy: latest.performance.accuracy,
          latency: latest.performance.latency.average,
          throughput: latest.performance.throughput,
          errorRate: latest.performance.errorRate,
          alerts: alerts.filter(a => a.modelType === type && !a.resolved).length
        };
      }
    }

    return { metrics, alerts, summary };
  }

  /**
   * Force refresh metrics
   */
  async refreshMetrics(): Promise<void> {
    await this.collectMetrics();
    await this.analyzeMetrics();
  }

  /**
   * Update monitoring thresholds
   */
  updateThresholds(modelType: string, thresholds: any): void {
    this.thresholds.set(modelType, {
      ...this.thresholds.get('default'),
      ...thresholds
    });
    console.log(`✅ Updated thresholds for ${modelType}`);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🛑 Model monitoring stopped');
    }
  }

  // Helper methods

  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const index = Math.ceil(values.length * p) - 1;
    return values[Math.max(0, Math.min(index, values.length - 1))];
  }

  private hasOutliers(data: any): boolean {
    // Simplified outlier detection
    const values = Object.values(data).filter(v => typeof v === 'number') as number[];
    if (values.length === 0) return false;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length
    );

    return values.some(v => Math.abs(v - mean) > 3 * stdDev);
  }

  private async createBaseline(modelType: string, predictions: any[]): Promise<void> {
    const baseline = {
      features: this.extractFeatureDistribution(predictions),
      predictions: predictions.map(p => p.prediction),
      accuracy: this.calculateAccuracy(predictions),
      createdAt: new Date()
    };

    await cache.set(`ml:baseline:${modelType}`, baseline, 86400 * 7); // 7 days
  }

  private extractFeatureDistribution(predictions: any[]): Record<string, any> {
    // Simplified - would extract actual feature distributions
    const distributions: Record<string, any> = {};
    
    predictions.forEach(p => {
      const input = p.inputData as any;
      if (input) {
        Object.entries(input).forEach(([key, value]) => {
          if (!distributions[key]) {
            distributions[key] = [];
          }
          distributions[key].push(value);
        });
      }
    });

    return distributions;
  }

  private calculateKLDivergence(p: number[], q: number[]): number {
    // Simplified KL divergence
    return Math.random() * 0.5; // Mock
  }

  private calculateDistributionDrift(baseline: any[], current: any[]): number {
    // Simplified distribution comparison
    return Math.random() * 0.3; // Mock
  }

  private calculateAccuracy(predictions: any[]): number {
    return predictions.reduce((sum, p) => sum + (p.confidence || 0), 0) / predictions.length;
  }
}

// Export singleton
export const modelMonitor = new ModelMonitor();