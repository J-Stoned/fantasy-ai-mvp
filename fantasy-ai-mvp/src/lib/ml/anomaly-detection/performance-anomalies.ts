/**
 * Advanced Anomaly Detection System
 * Identifies unusual patterns in player performance, injuries, and market behavior
 */

import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types';

export interface Anomaly {
  id: string;
  type: 'performance' | 'injury' | 'usage' | 'market' | 'social' | 'weather';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  playerId?: string;
  playerName?: string;
  teamId?: string;
  description: string;
  details: {
    metric: string;
    expectedValue: number;
    actualValue: number;
    deviation: number;
    historicalContext: string;
  };
  fantasyImpact: {
    projectionChange: number;
    recommendedAction: 'start' | 'bench' | 'trade' | 'pickup' | 'hold' | 'monitor';
    urgency: 'immediate' | 'this_week' | 'monitor';
  };
  timestamp: Date;
  relatedAnomalies?: string[];
}

export interface AnomalyDetectionConfig {
  sensitivityLevel: 'low' | 'medium' | 'high';
  windowSize: number; // Days of historical data
  updateFrequency: number; // Minutes between checks
  enabledTypes: Set<Anomaly['type']>;
}

export interface PlayerMetrics {
  playerId: string;
  snapPercentage: number[];
  targets: number[];
  touches: number[];
  redZoneUsage: number[];
  fantasyPoints: number[];
  efficiency: number[];
  timestamps: Date[];
}

export class AdvancedAnomalyDetector {
  private static instance: AdvancedAnomalyDetector;
  private autoencoderModel: tf.LayersModel | null = null;
  private lstmModel: tf.LayersModel | null = null;
  private isolationForestModel: tf.LayersModel | null = null;
  private isInitialized = false;
  
  // Historical baselines
  private playerBaselines: Map<string, {
    mean: number[];
    std: number[];
    seasonalPattern: number[];
  }> = new Map();
  
  // Active anomalies
  private activeAnomalies: Map<string, Anomaly> = new Map();
  
  // Thresholds
  private readonly thresholds = {
    performance: { low: 1.5, medium: 2.5, high: 3.5, critical: 5.0 },
    injury: { low: 0.6, medium: 0.7, high: 0.8, critical: 0.9 },
    usage: { low: 0.3, medium: 0.5, high: 0.7, critical: 0.9 },
    market: { low: 2.0, medium: 3.0, high: 4.0, critical: 5.0 }
  };
  
  private constructor() {}
  
  static getInstance(): AdvancedAnomalyDetector {
    if (!AdvancedAnomalyDetector.instance) {
      AdvancedAnomalyDetector.instance = new AdvancedAnomalyDetector();
    }
    return AdvancedAnomalyDetector.instance;
  }
  
  /**
   * Initialize anomaly detection models
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Create deep learning models
      this.autoencoderModel = await this.createAutoencoderModel();
      this.lstmModel = await this.createLSTMModel();
      this.isolationForestModel = await this.createIsolationForestModel();
      
      this.isInitialized = true;
      console.log('Anomaly detection system initialized');
    } catch (error) {
      console.error('Failed to initialize anomaly detector:', error);
      throw error;
    }
  }
  
  /**
   * Detect anomalies in player performance
   */
  async detectPerformanceAnomalies(
    player: Player,
    recentMetrics: PlayerMetrics,
    config: AnomalyDetectionConfig
  ): Promise<Anomaly[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const anomalies: Anomaly[] = [];
    
    // Get or calculate baseline
    const baseline = await this.getPlayerBaseline(player.id, recentMetrics);
    
    // Check each metric type
    if (config.enabledTypes.has('performance')) {
      const perfAnomalies = await this.detectMetricAnomalies(
        player,
        recentMetrics.fantasyPoints,
        baseline.mean[0],
        baseline.std[0],
        'performance',
        'Fantasy Points'
      );
      anomalies.push(...perfAnomalies);
    }
    
    if (config.enabledTypes.has('usage')) {
      // Snap percentage anomalies
      const snapAnomalies = await this.detectMetricAnomalies(
        player,
        recentMetrics.snapPercentage,
        baseline.mean[1],
        baseline.std[1],
        'usage',
        'Snap Percentage'
      );
      anomalies.push(...snapAnomalies);
      
      // Target share anomalies
      const targetAnomalies = await this.detectMetricAnomalies(
        player,
        recentMetrics.targets,
        baseline.mean[2],
        baseline.std[2],
        'usage',
        'Target Share'
      );
      anomalies.push(...targetAnomalies);
    }
    
    // Use autoencoder for complex pattern detection
    const complexAnomalies = await this.detectComplexAnomalies(
      player,
      recentMetrics,
      config
    );
    anomalies.push(...complexAnomalies);
    
    // Correlate anomalies
    this.correlateAnomalies(anomalies);
    
    // Update active anomalies
    for (const anomaly of anomalies) {
      this.activeAnomalies.set(anomaly.id, anomaly);
    }
    
    return anomalies;
  }
  
  /**
   * Detect market anomalies (ownership, trade activity)
   */
  async detectMarketAnomalies(
    player: Player,
    marketData: {
      ownership: number[];
      tradeVolume: number[];
      sentimentScore: number[];
      timestamps: Date[];
    }
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    // Ownership spike detection
    const ownershipChange = this.calculateRateOfChange(marketData.ownership);
    
    if (Math.abs(ownershipChange) > this.thresholds.market.medium) {
      const severity = this.getSeverity(Math.abs(ownershipChange), this.thresholds.market);
      
      anomalies.push({
        id: `market_${player.id}_${Date.now()}`,
        type: 'market',
        severity,
        confidence: 0.85,
        playerId: player.id,
        playerName: player.name,
        description: `Unusual ${ownershipChange > 0 ? 'increase' : 'decrease'} in ownership`,
        details: {
          metric: 'Ownership %',
          expectedValue: marketData.ownership[marketData.ownership.length - 2],
          actualValue: marketData.ownership[marketData.ownership.length - 1],
          deviation: ownershipChange,
          historicalContext: 'Significant change compared to typical ownership patterns'
        },
        fantasyImpact: {
          projectionChange: 0,
          recommendedAction: ownershipChange > 0 ? 'monitor' : 'pickup',
          urgency: severity === 'critical' ? 'immediate' : 'this_week'
        },
        timestamp: new Date()
      });
    }
    
    // Trade volume anomalies
    const avgVolume = marketData.tradeVolume.slice(-7).reduce((a, b) => a + b) / 7;
    const currentVolume = marketData.tradeVolume[marketData.tradeVolume.length - 1];
    
    if (currentVolume > avgVolume * 3) {
      anomalies.push({
        id: `trade_${player.id}_${Date.now()}`,
        type: 'market',
        severity: 'medium',
        confidence: 0.8,
        playerId: player.id,
        playerName: player.name,
        description: 'Unusually high trade activity',
        details: {
          metric: 'Trade Volume',
          expectedValue: avgVolume,
          actualValue: currentVolume,
          deviation: (currentVolume - avgVolume) / avgVolume,
          historicalContext: 'Trade volume significantly above 7-day average'
        },
        fantasyImpact: {
          projectionChange: 0,
          recommendedAction: 'monitor',
          urgency: 'this_week'
        },
        timestamp: new Date()
      });
    }
    
    return anomalies;
  }
  
  /**
   * Detect injury risk anomalies
   */
  async detectInjuryRiskAnomalies(
    player: Player,
    healthData: {
      practiceParticipation: ('full' | 'limited' | 'none')[];
      injuryReports: string[];
      workload: number[];
      daysRest: number;
    }
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    // Create feature vector
    const features = this.extractHealthFeatures(healthData);
    const inputTensor = tf.tensor2d([features]);
    
    // Run injury risk model
    const prediction = this.lstmModel!.predict(inputTensor) as tf.Tensor;
    const riskScore = (await prediction.data())[0];
    
    inputTensor.dispose();
    prediction.dispose();
    
    // Check if risk exceeds threshold
    const severity = this.getSeverity(riskScore, this.thresholds.injury);
    
    if (severity !== 'low') {
      anomalies.push({
        id: `injury_${player.id}_${Date.now()}`,
        type: 'injury',
        severity,
        confidence: riskScore,
        playerId: player.id,
        playerName: player.name,
        description: 'Elevated injury risk detected',
        details: {
          metric: 'Injury Risk Score',
          expectedValue: 0.3,
          actualValue: riskScore,
          deviation: riskScore - 0.3,
          historicalContext: this.getInjuryContext(healthData)
        },
        fantasyImpact: {
          projectionChange: -riskScore * 5,
          recommendedAction: severity === 'critical' ? 'bench' : 'monitor',
          urgency: severity === 'critical' ? 'immediate' : 'this_week'
        },
        timestamp: new Date()
      });
    }
    
    return anomalies;
  }
  
  /**
   * Real-time anomaly monitoring
   */
  async *monitorAnomalies(
    players: Player[],
    getMetrics: (playerId: string) => Promise<PlayerMetrics>,
    config: AnomalyDetectionConfig
  ): AsyncGenerator<Anomaly[]> {
    while (true) {
      const allAnomalies: Anomaly[] = [];
      
      for (const player of players) {
        try {
          const metrics = await getMetrics(player.id);
          const anomalies = await this.detectPerformanceAnomalies(
            player,
            metrics,
            config
          );
          allAnomalies.push(...anomalies);
        } catch (error) {
          console.error(`Error detecting anomalies for ${player.name}:`, error);
        }
      }
      
      // Remove resolved anomalies
      this.cleanupResolvedAnomalies();
      
      yield allAnomalies;
      
      // Wait for next update
      await new Promise(resolve => 
        setTimeout(resolve, config.updateFrequency * 60 * 1000)
      );
    }
  }
  
  /**
   * Detect metric-specific anomalies
   */
  private async detectMetricAnomalies(
    player: Player,
    values: number[],
    mean: number,
    std: number,
    type: Anomaly['type'],
    metricName: string
  ): Promise<Anomaly[]> {
    if (values.length < 3) return [];
    
    const anomalies: Anomaly[] = [];
    const recentValue = values[values.length - 1];
    const zScore = Math.abs((recentValue - mean) / std);
    
    // Statistical anomaly detection
    if (zScore > this.thresholds.performance.low) {
      const severity = this.getSeverity(zScore, this.thresholds.performance);
      const isPositive = recentValue > mean;
      
      anomalies.push({
        id: `${type}_${player.id}_${metricName}_${Date.now()}`,
        type,
        severity,
        confidence: Math.min(zScore / 5, 1),
        playerId: player.id,
        playerName: player.name,
        description: `${isPositive ? 'Exceptional' : 'Poor'} ${metricName}`,
        details: {
          metric: metricName,
          expectedValue: mean,
          actualValue: recentValue,
          deviation: zScore,
          historicalContext: `${zScore.toFixed(1)} standard deviations from average`
        },
        fantasyImpact: {
          projectionChange: (recentValue - mean) * (type === 'performance' ? 1 : 0.5),
          recommendedAction: this.getRecommendedAction(type, severity, isPositive),
          urgency: severity === 'critical' ? 'immediate' : 'this_week'
        },
        timestamp: new Date()
      });
    }
    
    // Trend anomaly detection
    if (values.length >= 5) {
      const trend = this.detectTrendAnomaly(values);
      if (trend) {
        anomalies.push(trend);
      }
    }
    
    return anomalies;
  }
  
  /**
   * Detect complex anomalies using autoencoder
   */
  private async detectComplexAnomalies(
    player: Player,
    metrics: PlayerMetrics,
    config: AnomalyDetectionConfig
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    // Prepare input features
    const features = this.prepareAutoencoderFeatures(metrics);
    const inputTensor = tf.tensor2d([features]);
    
    // Encode and decode
    const reconstructed = this.autoencoderModel!.predict(inputTensor) as tf.Tensor;
    const reconstructionError = await this.calculateReconstructionError(
      inputTensor,
      reconstructed
    );
    
    inputTensor.dispose();
    reconstructed.dispose();
    
    // High reconstruction error indicates anomaly
    if (reconstructionError > 0.3) {
      anomalies.push({
        id: `complex_${player.id}_${Date.now()}`,
        type: 'performance',
        severity: reconstructionError > 0.5 ? 'high' : 'medium',
        confidence: Math.min(reconstructionError, 1),
        playerId: player.id,
        playerName: player.name,
        description: 'Unusual performance pattern detected',
        details: {
          metric: 'Performance Pattern',
          expectedValue: 0.1,
          actualValue: reconstructionError,
          deviation: reconstructionError - 0.1,
          historicalContext: 'Multiple metrics showing unusual correlation'
        },
        fantasyImpact: {
          projectionChange: -reconstructionError * 3,
          recommendedAction: 'monitor',
          urgency: 'this_week'
        },
        timestamp: new Date()
      });
    }
    
    return anomalies;
  }
  
  /**
   * Get or calculate player baseline
   */
  private async getPlayerBaseline(
    playerId: string,
    metrics: PlayerMetrics
  ): Promise<{ mean: number[]; std: number[]; seasonalPattern: number[] }> {
    if (this.playerBaselines.has(playerId)) {
      return this.playerBaselines.get(playerId)!;
    }
    
    // Calculate baseline from historical data
    const baseline = {
      mean: [
        this.calculateMean(metrics.fantasyPoints),
        this.calculateMean(metrics.snapPercentage),
        this.calculateMean(metrics.targets),
        this.calculateMean(metrics.touches)
      ],
      std: [
        this.calculateStd(metrics.fantasyPoints),
        this.calculateStd(metrics.snapPercentage),
        this.calculateStd(metrics.targets),
        this.calculateStd(metrics.touches)
      ],
      seasonalPattern: this.detectSeasonalPattern(metrics.fantasyPoints)
    };
    
    this.playerBaselines.set(playerId, baseline);
    return baseline;
  }
  
  /**
   * Calculate rate of change
   */
  private calculateRateOfChange(values: number[]): number {
    if (values.length < 2) return 0;
    
    const recent = values[values.length - 1];
    const previous = values[values.length - 2];
    
    if (previous === 0) return recent > 0 ? 10 : 0;
    return (recent - previous) / previous;
  }
  
  /**
   * Get severity level based on threshold
   */
  private getSeverity(
    value: number,
    thresholds: { low: number; medium: number; high: number; critical: number }
  ): Anomaly['severity'] {
    if (value >= thresholds.critical) return 'critical';
    if (value >= thresholds.high) return 'high';
    if (value >= thresholds.medium) return 'medium';
    return 'low';
  }
  
  /**
   * Get recommended action
   */
  private getRecommendedAction(
    type: Anomaly['type'],
    severity: Anomaly['severity'],
    isPositive: boolean
  ): Anomaly['fantasyImpact']['recommendedAction'] {
    if (type === 'performance') {
      if (isPositive) {
        return severity === 'critical' ? 'start' : 'hold';
      } else {
        return severity === 'critical' ? 'bench' : 'monitor';
      }
    } else if (type === 'usage') {
      if (!isPositive && severity !== 'low') {
        return 'trade';
      }
    } else if (type === 'injury') {
      return severity === 'critical' ? 'bench' : 'monitor';
    }
    
    return 'monitor';
  }
  
  /**
   * Extract health features
   */
  private extractHealthFeatures(healthData: any): number[] {
    const practiceScore = healthData.practiceParticipation
      .map((p: string) => p === 'full' ? 1 : p === 'limited' ? 0.5 : 0)
      .reduce((a: number, b: number) => a + b, 0) / healthData.practiceParticipation.length;
    
    const injuryMentions = healthData.injuryReports.length;
    const avgWorkload = healthData.workload.reduce((a: number, b: number) => a + b, 0) / healthData.workload.length;
    const restScore = Math.min(healthData.daysRest / 7, 1);
    
    return [practiceScore, injuryMentions, avgWorkload, restScore];
  }
  
  /**
   * Get injury context
   */
  private getInjuryContext(healthData: any): string {
    const recentPractice = healthData.practiceParticipation[healthData.practiceParticipation.length - 1];
    const injuryCount = healthData.injuryReports.length;
    
    if (recentPractice === 'none' && injuryCount > 0) {
      return 'Did not practice with injury designation';
    } else if (recentPractice === 'limited') {
      return 'Limited practice participation';
    } else if (healthData.daysRest < 4) {
      return 'Short rest between games';
    }
    
    return 'Multiple risk factors present';
  }
  
  /**
   * Detect trend anomalies
   */
  private detectTrendAnomaly(values: number[]): Anomaly | null {
    // Simple trend detection - could be enhanced
    const recentTrend = values.slice(-3);
    const isIncreasing = recentTrend.every((v, i) => i === 0 || v > recentTrend[i - 1]);
    const isDecreasing = recentTrend.every((v, i) => i === 0 || v < recentTrend[i - 1]);
    
    if (!isIncreasing && !isDecreasing) return null;
    
    const changeRate = Math.abs(
      (recentTrend[recentTrend.length - 1] - recentTrend[0]) / recentTrend[0]
    );
    
    if (changeRate < 0.3) return null;
    
    return {
      id: `trend_${Date.now()}`,
      type: 'performance',
      severity: changeRate > 0.5 ? 'medium' : 'low',
      confidence: 0.7,
      description: `${isIncreasing ? 'Upward' : 'Downward'} trend detected`,
      details: {
        metric: 'Performance Trend',
        expectedValue: recentTrend[0],
        actualValue: recentTrend[recentTrend.length - 1],
        deviation: changeRate,
        historicalContext: `${(changeRate * 100).toFixed(0)}% change over 3 periods`
      },
      fantasyImpact: {
        projectionChange: (isIncreasing ? 1 : -1) * changeRate * 2,
        recommendedAction: isIncreasing ? 'start' : 'monitor',
        urgency: 'this_week'
      },
      timestamp: new Date()
    };
  }
  
  /**
   * Prepare features for autoencoder
   */
  private prepareAutoencoderFeatures(metrics: PlayerMetrics): number[] {
    // Normalize and flatten recent metrics
    const features: number[] = [];
    
    const recentGames = 5;
    const metricArrays = [
      metrics.fantasyPoints,
      metrics.snapPercentage,
      metrics.targets,
      metrics.touches,
      metrics.efficiency
    ];
    
    for (const arr of metricArrays) {
      const recent = arr.slice(-recentGames);
      const normalized = this.normalize(recent);
      features.push(...normalized);
    }
    
    // Pad if needed
    while (features.length < 25) {
      features.push(0);
    }
    
    return features.slice(0, 25);
  }
  
  /**
   * Calculate reconstruction error
   */
  private async calculateReconstructionError(
    original: tf.Tensor,
    reconstructed: tf.Tensor
  ): Promise<number> {
    const mse = tf.losses.meanSquaredError(original, reconstructed);
    const error = await mse.data();
    mse.dispose();
    return error[0];
  }
  
  /**
   * Correlate related anomalies
   */
  private correlateAnomalies(anomalies: Anomaly[]): void {
    for (let i = 0; i < anomalies.length; i++) {
      for (let j = i + 1; j < anomalies.length; j++) {
        if (this.areAnomaliesRelated(anomalies[i], anomalies[j])) {
          anomalies[i].relatedAnomalies = anomalies[i].relatedAnomalies || [];
          anomalies[i].relatedAnomalies.push(anomalies[j].id);
          
          anomalies[j].relatedAnomalies = anomalies[j].relatedAnomalies || [];
          anomalies[j].relatedAnomalies.push(anomalies[i].id);
        }
      }
    }
  }
  
  /**
   * Check if anomalies are related
   */
  private areAnomaliesRelated(a1: Anomaly, a2: Anomaly): boolean {
    // Same player
    if (a1.playerId && a1.playerId === a2.playerId) return true;
    
    // Same team
    if (a1.teamId && a1.teamId === a2.teamId) return true;
    
    // Similar timing
    const timeDiff = Math.abs(a1.timestamp.getTime() - a2.timestamp.getTime());
    if (timeDiff < 60 * 60 * 1000) return true; // Within 1 hour
    
    return false;
  }
  
  /**
   * Clean up resolved anomalies
   */
  private cleanupResolvedAnomalies(): void {
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    for (const [id, anomaly] of this.activeAnomalies) {
      if (now - anomaly.timestamp.getTime() > maxAge) {
        this.activeAnomalies.delete(id);
      }
    }
  }
  
  /**
   * Calculate mean
   */
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  
  /**
   * Calculate standard deviation
   */
  private calculateStd(values: number[]): number {
    if (values.length < 2) return 1;
    const mean = this.calculateMean(values);
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
  
  /**
   * Detect seasonal patterns
   */
  private detectSeasonalPattern(values: number[]): number[] {
    // Simplified - would use FFT or more sophisticated methods
    if (values.length < 17) return [];
    
    const weeklyPattern: number[] = [];
    for (let i = 0; i < 17; i++) {
      const weekValues = values.filter((_, idx) => idx % 17 === i);
      weeklyPattern.push(this.calculateMean(weekValues));
    }
    
    return weeklyPattern;
  }
  
  /**
   * Normalize values
   */
  private normalize(values: number[]): number[] {
    const mean = this.calculateMean(values);
    const std = this.calculateStd(values);
    return values.map(v => std === 0 ? 0 : (v - mean) / std);
  }
  
  /**
   * Create autoencoder model
   */
  private async createAutoencoderModel(): Promise<tf.LayersModel> {
    const encoder = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [25],
          units: 16,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 8,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 4,
          activation: 'relu'
        })
      ]
    });
    
    const decoder = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [4],
          units: 8,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 16,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 25,
          activation: 'sigmoid'
        })
      ]
    });
    
    const input = tf.input({ shape: [25] });
    const encoded = encoder.apply(input) as tf.SymbolicTensor;
    const decoded = decoder.apply(encoded) as tf.SymbolicTensor;
    
    return tf.model({ inputs: input, outputs: decoded });
  }
  
  /**
   * Create LSTM model for time series
   */
  private async createLSTMModel(): Promise<tf.LayersModel> {
    return tf.sequential({
      layers: [
        tf.layers.lstm({
          inputShape: [10, 4],
          units: 32,
          returnSequences: false
        }),
        tf.layers.dense({
          units: 16,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid'
        })
      ]
    });
  }
  
  /**
   * Create isolation forest model
   */
  private async createIsolationForestModel(): Promise<tf.LayersModel> {
    // Simplified - real implementation would use proper isolation forest
    return tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [10],
          units: 20,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 10,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid'
        })
      ]
    });
  }
}

// Export singleton instance
export const anomalyDetector = AdvancedAnomalyDetector.getInstance();