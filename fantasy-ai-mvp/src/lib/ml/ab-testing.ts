import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/redis/redis-client';
import { mlOrchestrator } from './ml-orchestrator';
import { modelVersionManager } from './model-versioning';

export interface ABTest {
  id: string;
  name: string;
  modelType: string;
  status: 'active' | 'completed' | 'paused';
  variants: {
    control: {
      version: number;
      traffic: number;
      metrics: TestMetrics;
    };
    treatment: {
      version: number;
      traffic: number;
      metrics: TestMetrics;
    };
  };
  startDate: Date;
  endDate?: Date;
  minimumSampleSize: number;
  confidenceLevel: number;
  primaryMetric: string;
}

export interface TestMetrics {
  predictions: number;
  accuracy: number;
  latency: number;
  errors: number;
  customMetrics: Record<string, number>;
}

export class ABTestingManager {
  private activeTests = new Map<string, ABTest>();
  private userAssignments = new Map<string, Map<string, 'control' | 'treatment'>>();

  constructor() {
    this.loadActiveTests();
  }

  /**
   * Load active tests from database
   */
  private async loadActiveTests() {
    try {
      // In production, would load from database
      // For now, load from cache
      const tests = await cache.get<ABTest[]>('ml:ab_tests:active') || [];
      tests.forEach(test => {
        this.activeTests.set(test.id, test);
      });
    } catch (error) {
      console.error('Failed to load active A/B tests:', error);
    }
  }

  /**
   * Create a new A/B test
   */
  async createTest(config: {
    name: string;
    modelType: string;
    controlVersion: number;
    treatmentVersion: number;
    trafficSplit?: number; // Percentage for treatment (default 50)
    minimumSampleSize?: number;
    confidenceLevel?: number;
    primaryMetric?: string;
  }): Promise<ABTest> {
    const {
      name,
      modelType,
      controlVersion,
      treatmentVersion,
      trafficSplit = 50,
      minimumSampleSize = 1000,
      confidenceLevel = 0.95,
      primaryMetric = 'accuracy'
    } = config;

    // Validate versions exist
    const [control, treatment] = await Promise.all([
      modelVersionManager.loadModelVersion(modelType, controlVersion),
      modelVersionManager.loadModelVersion(modelType, treatmentVersion)
    ]);

    if (!control || !treatment) {
      throw new Error('One or both model versions not found');
    }

    const test: ABTest = {
      id: `${modelType}_${Date.now()}`,
      name,
      modelType,
      status: 'active',
      variants: {
        control: {
          version: controlVersion,
          traffic: 100 - trafficSplit,
          metrics: this.initializeMetrics()
        },
        treatment: {
          version: treatmentVersion,
          traffic: trafficSplit,
          metrics: this.initializeMetrics()
        }
      },
      startDate: new Date(),
      minimumSampleSize,
      confidenceLevel,
      primaryMetric
    };

    // Save test
    this.activeTests.set(test.id, test);
    await this.saveActiveTests();

    console.log(`✅ Created A/B test: ${name}`);
    console.log(`   Control: v${controlVersion} (${100 - trafficSplit}%)`);
    console.log(`   Treatment: v${treatmentVersion} (${trafficSplit}%)`);

    return test;
  }

  /**
   * Get variant assignment for a user
   */
  async getVariantAssignment(
    userId: string,
    modelType: string
  ): Promise<{ variant: 'control' | 'treatment'; version: number } | null> {
    // Find active test for this model type
    const test = Array.from(this.activeTests.values()).find(
      t => t.modelType === modelType && t.status === 'active'
    );

    if (!test) {
      return null; // No active test
    }

    // Check if user already assigned
    let userTests = this.userAssignments.get(userId);
    if (!userTests) {
      userTests = new Map();
      this.userAssignments.set(userId, userTests);
    }

    let variant = userTests.get(test.id);
    if (!variant) {
      // Assign user to variant based on traffic split
      variant = Math.random() * 100 < test.variants.treatment.traffic
        ? 'treatment'
        : 'control';
      
      userTests.set(test.id, variant);
      
      // Persist assignment
      await cache.set(
        `ml:ab_assignment:${userId}:${test.id}`,
        variant,
        86400 * 30 // 30 days
      );
    }

    return {
      variant,
      version: test.variants[variant].version
    };
  }

  /**
   * Record prediction result for A/B test
   */
  async recordPrediction(
    userId: string,
    modelType: string,
    result: {
      prediction: any;
      latency: number;
      error?: boolean;
      actual?: any; // For accuracy calculation
      customMetrics?: Record<string, number>;
    }
  ): Promise<void> {
    const assignment = await this.getVariantAssignment(userId, modelType);
    if (!assignment) return;

    const test = Array.from(this.activeTests.values()).find(
      t => t.modelType === modelType && t.status === 'active'
    );
    if (!test) return;

    const metrics = test.variants[assignment.variant].metrics;
    
    // Update metrics
    metrics.predictions++;
    metrics.latency = (metrics.latency * (metrics.predictions - 1) + result.latency) / metrics.predictions;
    
    if (result.error) {
      metrics.errors++;
    }
    
    // Update accuracy if actual result provided
    if (result.actual !== undefined) {
      const correct = this.isPredictionCorrect(result.prediction, result.actual, modelType);
      const previousCorrect = metrics.accuracy * (metrics.predictions - 1);
      metrics.accuracy = (previousCorrect + (correct ? 1 : 0)) / metrics.predictions;
    }
    
    // Update custom metrics
    if (result.customMetrics) {
      for (const [key, value] of Object.entries(result.customMetrics)) {
        const current = metrics.customMetrics[key] || 0;
        metrics.customMetrics[key] = (current * (metrics.predictions - 1) + value) / metrics.predictions;
      }
    }

    // Check if test should complete
    await this.checkTestCompletion(test);
    
    // Save updated metrics
    await this.saveActiveTests();
  }

  /**
   * Get test results and statistical analysis
   */
  async getTestResults(testId: string): Promise<{
    test: ABTest;
    analysis: {
      winner?: 'control' | 'treatment' | 'no_difference';
      confidence: number;
      uplift: number;
      pValue: number;
      recommendation: string;
    };
  }> {
    const test = this.activeTests.get(testId);
    if (!test) {
      throw new Error('Test not found');
    }

    const analysis = this.analyzeTestResults(test);

    return { test, analysis };
  }

  /**
   * Complete an A/B test
   */
  async completeTest(testId: string, deploy?: 'control' | 'treatment'): Promise<void> {
    const test = this.activeTests.get(testId);
    if (!test) {
      throw new Error('Test not found');
    }

    test.status = 'completed';
    test.endDate = new Date();

    // Deploy winning variant if specified
    if (deploy) {
      const version = test.variants[deploy].version;
      await modelVersionManager.deployModelVersion(test.modelType, version);
      console.log(`✅ Deployed ${deploy} variant (v${version}) to production`);
    }

    // Archive test results
    await this.archiveTest(test);
    
    // Remove from active tests
    this.activeTests.delete(testId);
    await this.saveActiveTests();

    console.log(`✅ Completed A/B test: ${test.name}`);
  }

  /**
   * Pause an A/B test
   */
  async pauseTest(testId: string): Promise<void> {
    const test = this.activeTests.get(testId);
    if (!test) {
      throw new Error('Test not found');
    }

    test.status = 'paused';
    await this.saveActiveTests();
    
    console.log(`⏸️ Paused A/B test: ${test.name}`);
  }

  /**
   * Resume a paused A/B test
   */
  async resumeTest(testId: string): Promise<void> {
    const test = this.activeTests.get(testId);
    if (!test) {
      throw new Error('Test not found');
    }

    test.status = 'active';
    await this.saveActiveTests();
    
    console.log(`▶️ Resumed A/B test: ${test.name}`);
  }

  /**
   * Get all active tests
   */
  getActiveTests(): ABTest[] {
    return Array.from(this.activeTests.values()).filter(
      test => test.status === 'active'
    );
  }

  /**
   * Get test history
   */
  async getTestHistory(modelType?: string, limit: number = 10): Promise<ABTest[]> {
    // In production, would load from database
    const history = await cache.get<ABTest[]>('ml:ab_tests:history') || [];
    
    let filtered = history;
    if (modelType) {
      filtered = history.filter(test => test.modelType === modelType);
    }
    
    return filtered.slice(0, limit);
  }

  // Helper methods

  private initializeMetrics(): TestMetrics {
    return {
      predictions: 0,
      accuracy: 0,
      latency: 0,
      errors: 0,
      customMetrics: {}
    };
  }

  private async saveActiveTests(): Promise<void> {
    const tests = Array.from(this.activeTests.values());
    await cache.set('ml:ab_tests:active', tests, 86400); // 24 hours
  }

  private isPredictionCorrect(prediction: any, actual: any, modelType: string): boolean {
    // Implementation depends on model type
    switch (modelType) {
      case 'player_performance':
        // Check if prediction is within 10% of actual
        return Math.abs(prediction.fantasyPoints - actual) / actual < 0.1;
      
      case 'injury_risk':
        // Check if risk level matches
        return prediction.riskLevel === actual.injured;
      
      case 'game_outcome':
        // Check if prediction matches outcome
        return prediction.prediction === actual.outcome;
      
      default:
        // Simple equality check
        return prediction === actual;
    }
  }

  private async checkTestCompletion(test: ABTest): Promise<void> {
    const controlSamples = test.variants.control.metrics.predictions;
    const treatmentSamples = test.variants.treatment.metrics.predictions;
    
    // Check if both variants have minimum samples
    if (controlSamples >= test.minimumSampleSize && 
        treatmentSamples >= test.minimumSampleSize) {
      
      const analysis = this.analyzeTestResults(test);
      
      // Auto-complete if clear winner with high confidence
      if (analysis.confidence >= test.confidenceLevel && 
          analysis.pValue < 0.05) {
        await this.completeTest(test.id);
        console.log(`🏁 Auto-completed test ${test.name} - Winner: ${analysis.winner}`);
      }
    }
  }

  private analyzeTestResults(test: ABTest): {
    winner?: 'control' | 'treatment' | 'no_difference';
    confidence: number;
    uplift: number;
    pValue: number;
    recommendation: string;
  } {
    const control = test.variants.control.metrics;
    const treatment = test.variants.treatment.metrics;
    
    // Get primary metric values
    const controlValue = this.getMetricValue(control, test.primaryMetric);
    const treatmentValue = this.getMetricValue(treatment, test.primaryMetric);
    
    // Calculate uplift
    const uplift = controlValue > 0 
      ? ((treatmentValue - controlValue) / controlValue) * 100
      : 0;
    
    // Calculate statistical significance (simplified)
    const { pValue, confidence } = this.calculateSignificance(
      controlValue,
      treatmentValue,
      control.predictions,
      treatment.predictions
    );
    
    // Determine winner
    let winner: 'control' | 'treatment' | 'no_difference' = 'no_difference';
    if (pValue < 0.05) {
      winner = treatmentValue > controlValue ? 'treatment' : 'control';
    }
    
    // Generate recommendation
    let recommendation = '';
    if (winner === 'treatment' && uplift > 5) {
      recommendation = `Deploy treatment variant (${uplift.toFixed(1)}% improvement)`;
    } else if (winner === 'control') {
      recommendation = 'Keep control variant (treatment performed worse)';
    } else if (control.predictions < test.minimumSampleSize || 
               treatment.predictions < test.minimumSampleSize) {
      recommendation = 'Continue test to gather more data';
    } else {
      recommendation = 'No significant difference detected';
    }
    
    return {
      winner,
      confidence,
      uplift,
      pValue,
      recommendation
    };
  }

  private getMetricValue(metrics: TestMetrics, metricName: string): number {
    switch (metricName) {
      case 'accuracy':
        return metrics.accuracy;
      case 'latency':
        return -metrics.latency; // Lower is better
      case 'error_rate':
        return -(metrics.errors / metrics.predictions); // Lower is better
      default:
        return metrics.customMetrics[metricName] || 0;
    }
  }

  private calculateSignificance(
    controlValue: number,
    treatmentValue: number,
    controlN: number,
    treatmentN: number
  ): { pValue: number; confidence: number } {
    // Simplified z-test for proportions
    const pooledProportion = (controlValue * controlN + treatmentValue * treatmentN) / 
                            (controlN + treatmentN);
    
    const standardError = Math.sqrt(
      pooledProportion * (1 - pooledProportion) * (1/controlN + 1/treatmentN)
    );
    
    const zScore = Math.abs(treatmentValue - controlValue) / standardError;
    
    // Approximate p-value (two-tailed)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
    const confidence = 1 - pValue;
    
    return { pValue, confidence };
  }

  private normalCDF(z: number): number {
    // Approximation of normal CDF
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  }

  private async archiveTest(test: ABTest): Promise<void> {
    // Save to history
    const history = await cache.get<ABTest[]>('ml:ab_tests:history') || [];
    history.unshift(test);
    
    // Keep last 100 tests
    if (history.length > 100) {
      history.splice(100);
    }
    
    await cache.set('ml:ab_tests:history', history);
  }
}

// Export singleton
export const abTestingManager = new ABTestingManager();