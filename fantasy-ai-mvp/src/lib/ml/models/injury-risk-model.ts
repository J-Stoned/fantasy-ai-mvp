/**
 * Injury Risk Assessment Model
 * Predicts injury probability and impact using deep learning
 */

import * as tf from '@tensorflow/tfjs';
import { BaseMLModel, ModelConfig, PredictionResult } from '../base-model';

export interface InjuryFeatures {
  // Player physical attributes
  age: number;
  position: string;
  height: number; // inches
  weight: number; // lbs
  bmi: number;
  
  // Injury history
  previousInjuries: {
    type: string; // Hamstring, ACL, Concussion, etc.
    severity: number; // 1-10 scale
    daysAgo: number;
    gamessMissed: number;
    bodyPart: string;
  }[];
  
  // Workload metrics
  snapsLastGame: number;
  snapsLast4Games: number[];
  snapShareTrend: number; // Increasing/decreasing
  touchesLastGame: number;
  touchesLast4Games: number[];
  
  // Recovery metrics
  daysSinceLastGame: number;
  consecutiveGames: number;
  practiceParticipation: string; // Full, Limited, DNP
  injuryReportStatus: string; // Questionable, Doubtful, etc.
  
  // Biomechanical stress
  routeDepth: number; // Average for WRs
  yardsAfterContact: number; // For RBs
  hitsAbsorbed: number; // QBs
  tacklesMade: number; // Defensive players
  
  // Environmental factors
  gameTemperature: number;
  fieldType: string; // Grass, Turf
  altitude: number;
  travelDistance: number; // Miles from home
}

export interface InjuryPrediction {
  riskScore: number; // 0-1 probability
  riskLevel: string;
  topRiskFactors: {
    factor: string;
    contribution: number;
    mitigation: string;
  }[];
  projectedGamesImpact: number;
  recommendedAction: string;
}

export class InjuryRiskModel extends BaseMLModel {
  private readonly injuryTypeEncodings: Record<string, number> = {
    'Hamstring': 0.1,
    'Knee': 0.2,
    'Ankle': 0.3,
    'Shoulder': 0.4,
    'Concussion': 0.5,
    'Back': 0.6,
    'Groin': 0.7,
    'Calf': 0.8,
    'Other': 0.9,
  };

  private readonly practiceStatusEncodings: Record<string, number> = {
    'Full': 0,
    'Limited': 0.5,
    'DNP': 1,
  };

  constructor() {
    super({
      name: 'injury-risk',
      version: '1.0',
      inputShape: [45], // All injury-related features
      outputShape: [6], // Risk score + 5 risk factor contributions
      batchSize: 32,
      epochs: 100,
      learningRate: 0.0008,
    });
  }

  protected buildModel(): tf.LayersModel {
    const model = tf.sequential();

    // Input layer with careful initialization
    model.add(tf.layers.dense({
      units: 64,
      inputShape: this.config.inputShape as [number],
      activation: 'relu',
      kernelInitializer: 'heNormal',
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.3 }));

    // Attention-like mechanism for injury history
    model.add(tf.layers.dense({
      units: 128,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.3 }));

    // Deep layers for complex pattern recognition
    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
    }));
    model.add(tf.layers.batchNormalization());
    
    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu',
    }));

    // Output layer with sigmoid for probability
    model.add(tf.layers.dense({
      units: this.config.outputShape[0],
      activation: 'sigmoid',
    }));

    model.compile({
      optimizer: tf.train.adam(this.config.learningRate!),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy', 'precision', 'recall'],
    });

    return model;
  }

  protected preprocessInput(features: InjuryFeatures): tf.Tensor {
    // Aggregate injury history features
    const injuryHistory = this.aggregateInjuryHistory(features.previousInjuries);
    
    // Calculate workload stress
    const workloadStress = this.calculateWorkloadStress(features);
    
    // Calculate recovery score
    const recoveryScore = this.calculateRecoveryScore(features);
    
    const inputFeatures = [
      // Physical attributes
      features.age / 40,
      this.encodePosition(features.position),
      features.height / 80,
      features.weight / 350,
      features.bmi / 40,
      
      // Injury history features
      injuryHistory.totalInjuries / 10,
      injuryHistory.recentInjuryScore,
      injuryHistory.severityScore,
      injuryHistory.chronicScore,
      injuryHistory.diversityScore,
      
      // Workload features
      features.snapsLastGame / 80,
      workloadStress.snapTrend,
      workloadStress.touchTrend,
      workloadStress.fatigueScore,
      workloadStress.overuseRisk,
      
      // Recovery features
      features.daysSinceLastGame / 14,
      features.consecutiveGames / 20,
      this.practiceStatusEncodings[features.practiceParticipation] || 0,
      this.encodeInjuryStatus(features.injuryReportStatus),
      recoveryScore,
      
      // Position-specific stress
      features.routeDepth / 20,
      features.yardsAfterContact / 10,
      features.hitsAbsorbed / 30,
      features.tacklesMade / 15,
      
      // Environmental risk factors
      this.calculateTemperatureRisk(features.gameTemperature),
      features.fieldType === 'Turf' ? 1 : 0,
      features.altitude / 10000,
      features.travelDistance / 3000,
      
      // Derived risk indicators
      this.calculateAgePositionRisk(features),
      this.calculateCumulativeLoad(features),
      this.calculateInjuryRecurrence(features),
      this.calculateBiomechanicalRisk(features),
      this.calculateEnvironmentalRisk(features),
      
      // Interaction features
      features.age * workloadStress.fatigueScore / 40,
      injuryHistory.recentInjuryScore * workloadStress.overuseRisk,
      features.consecutiveGames * features.snapsLastGame / 1600,
      recoveryScore * workloadStress.fatigueScore,
      
      // Time-based features
      Math.sin(2 * Math.PI * features.consecutiveGames / 17), // Season fatigue cycle
      Math.cos(2 * Math.PI * features.consecutiveGames / 17),
      
      // Risk accumulation features
      this.calculateRiskAccumulation(features, injuryHistory, workloadStress),
      this.calculatePreventionScore(features),
      this.calculatePositionalDurability(features),
      this.calculateSeasonalRisk(features),
      this.calculateGameContextRisk(features),
    ];
    
    return tf.tensor2d([inputFeatures]);
  }

  protected postprocessOutput(output: tf.Tensor): PredictionResult {
    const values = output.arraySync() as number[][];
    const predictions = values[0];
    
    const riskScore = predictions[0];
    const factorContributions = predictions.slice(1);
    
    // Map risk factors
    const topRiskFactors = this.mapRiskFactors(factorContributions);
    
    // Calculate projected impact
    const projectedGamesImpact = this.calculateProjectedImpact(riskScore);
    
    // Get recommendation
    const recommendedAction = this.getRecommendedAction(riskScore, topRiskFactors);
    
    return {
      prediction: riskScore,
      confidence: this.calculateConfidence(riskScore, factorContributions),
      metadata: {
        riskScore,
        riskLevel: this.getRiskLevel(riskScore),
        topRiskFactors,
        projectedGamesImpact,
        recommendedAction,
      } as InjuryPrediction,
    };
  }

  /**
   * Predict injury risk with temporal analysis
   */
  async predictWithTemporal(
    currentFeatures: InjuryFeatures,
    historicalFeatures: InjuryFeatures[]
  ): Promise<InjuryPrediction> {
    // Analyze trend over time
    const historicalRisks = await Promise.all(
      historicalFeatures.map(f => this.predict(f))
    );
    
    const currentPrediction = await this.predict(currentFeatures);
    const trend = this.calculateRiskTrend(historicalRisks.map(r => r.prediction as number));
    
    // Adjust prediction based on trend
    const adjustedRisk = (currentPrediction.prediction as number) * (1 + trend * 0.2);
    
    return {
      ...(currentPrediction.metadata as InjuryPrediction),
      riskScore: Math.min(1, adjustedRisk),
      riskLevel: this.getRiskLevel(adjustedRisk),
    };
  }

  // Helper methods
  private encodePosition(position: string): number {
    const riskByPosition: Record<string, number> = {
      'RB': 0.9, // Highest injury risk
      'WR': 0.7,
      'TE': 0.6,
      'LB': 0.8,
      'DB': 0.7,
      'DL': 0.6,
      'OL': 0.5,
      'QB': 0.4,
      'K': 0.2, // Lowest injury risk
    };
    return riskByPosition[position] || 0.5;
  }

  private encodeInjuryStatus(status: string): number {
    const statusMap: Record<string, number> = {
      'Healthy': 0,
      'Probable': 0.2,
      'Questionable': 0.5,
      'Doubtful': 0.8,
      'Out': 1,
    };
    return statusMap[status] || 0;
  }

  private aggregateInjuryHistory(injuries: InjuryFeatures['previousInjuries']) {
    if (!injuries || injuries.length === 0) {
      return {
        totalInjuries: 0,
        recentInjuryScore: 0,
        severityScore: 0,
        chronicScore: 0,
        diversityScore: 0,
      };
    }
    
    const totalInjuries = injuries.length;
    
    // Recent injury impact (exponential decay)
    const recentInjuryScore = injuries.reduce((score, injury) => {
      const recencyWeight = Math.exp(-injury.daysAgo / 365);
      return score + (injury.severity / 10) * recencyWeight;
    }, 0) / totalInjuries;
    
    // Average severity
    const severityScore = injuries.reduce((sum, i) => sum + i.severity, 0) / (totalInjuries * 10);
    
    // Chronic injury indicator (same body part)
    const bodyPartCounts = injuries.reduce((counts, injury) => {
      counts[injury.bodyPart] = (counts[injury.bodyPart] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    const chronicScore = Math.max(...Object.values(bodyPartCounts)) / totalInjuries;
    
    // Injury diversity (different types)
    const uniqueTypes = new Set(injuries.map(i => i.type)).size;
    const diversityScore = uniqueTypes / injuries.length;
    
    return {
      totalInjuries,
      recentInjuryScore,
      severityScore,
      chronicScore,
      diversityScore,
    };
  }

  private calculateWorkloadStress(features: InjuryFeatures) {
    const recentSnaps = features.snapsLast4Games || [];
    const recentTouches = features.touchesLast4Games || [];
    
    // Calculate trends
    const snapTrend = this.calculateTrend(recentSnaps);
    const touchTrend = this.calculateTrend(recentTouches);
    
    // Fatigue score based on cumulative load
    const totalRecentSnaps = recentSnaps.reduce((a, b) => a + b, 0);
    const avgSnaps = totalRecentSnaps / (recentSnaps.length || 1);
    const fatigueScore = Math.min(1, avgSnaps / 70);
    
    // Overuse risk
    const snapIncrease = features.snapsLastGame / (avgSnaps || 1);
    const overuseRisk = snapIncrease > 1.3 ? (snapIncrease - 1) : 0;
    
    return {
      snapTrend,
      touchTrend,
      fatigueScore,
      overuseRisk,
    };
  }

  private calculateRecoveryScore(features: InjuryFeatures): number {
    let score = 1;
    
    // Days since last game
    score *= Math.min(1, features.daysSinceLastGame / 7);
    
    // Practice participation
    score *= 1 - (this.practiceStatusEncodings[features.practiceParticipation] || 0);
    
    // Consecutive games fatigue
    score *= Math.max(0.5, 1 - features.consecutiveGames / 20);
    
    return score;
  }

  private calculateTemperatureRisk(temp: number): number {
    // Extreme temperatures increase injury risk
    if (temp < 32) return 0.3; // Cold
    if (temp > 85) return 0.2; // Hot
    return 0;
  }

  private calculateAgePositionRisk(features: InjuryFeatures): number {
    const ageRisk = Math.min(1, (features.age - 25) / 15);
    const positionRisk = this.encodePosition(features.position);
    return ageRisk * positionRisk;
  }

  private calculateCumulativeLoad(features: InjuryFeatures): number {
    const snaps = features.snapsLast4Games || [];
    const cumulative = snaps.reduce((a, b) => a + b, 0);
    return Math.min(1, cumulative / 280); // 70 snaps * 4 games
  }

  private calculateInjuryRecurrence(features: InjuryFeatures): number {
    const recentInjuries = features.previousInjuries.filter(i => i.daysAgo < 365);
    return Math.min(1, recentInjuries.length / 3);
  }

  private calculateBiomechanicalRisk(features: InjuryFeatures): number {
    let risk = 0;
    
    if (features.position === 'WR') {
      risk += features.routeDepth / 30;
    } else if (features.position === 'RB') {
      risk += features.yardsAfterContact / 15;
    } else if (features.position === 'QB') {
      risk += features.hitsAbsorbed / 40;
    }
    
    return Math.min(1, risk);
  }

  private calculateEnvironmentalRisk(features: InjuryFeatures): number {
    let risk = 0;
    
    risk += features.fieldType === 'Turf' ? 0.2 : 0;
    risk += features.altitude > 5000 ? 0.1 : 0;
    risk += features.travelDistance > 2000 ? 0.1 : 0;
    risk += this.calculateTemperatureRisk(features.gameTemperature);
    
    return Math.min(1, risk);
  }

  private calculateRiskAccumulation(
    features: InjuryFeatures,
    injuryHistory: any,
    workloadStress: any
  ): number {
    return Math.min(1, 
      injuryHistory.recentInjuryScore * 0.3 +
      workloadStress.fatigueScore * 0.3 +
      this.calculateAgePositionRisk(features) * 0.2 +
      this.calculateEnvironmentalRisk(features) * 0.2
    );
  }

  private calculatePreventionScore(features: InjuryFeatures): number {
    let score = 1;
    
    // Good recovery time
    if (features.daysSinceLastGame >= 7) score *= 0.8;
    
    // Full practice participation
    if (features.practiceParticipation === 'Full') score *= 0.8;
    
    // Low consecutive games
    if (features.consecutiveGames < 5) score *= 0.9;
    
    return 1 - score;
  }

  private calculatePositionalDurability(features: InjuryFeatures): number {
    // Some positions are naturally more durable
    const durabilityMap: Record<string, number> = {
      'K': 0.9,
      'QB': 0.7,
      'OL': 0.6,
      'WR': 0.4,
      'RB': 0.2,
    };
    return 1 - (durabilityMap[features.position] || 0.5);
  }

  private calculateSeasonalRisk(features: InjuryFeatures): number {
    // Risk increases as season progresses
    const weekEstimate = Math.min(17, features.consecutiveGames);
    return weekEstimate / 17 * 0.3;
  }

  private calculateGameContextRisk(features: InjuryFeatures): number {
    // High-stakes games might increase injury risk
    return 0; // Placeholder - would need game importance data
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    return (secondAvg - firstAvg) / (firstAvg || 1);
  }

  private calculateRiskTrend(risks: number[]): number {
    if (risks.length < 2) return 0;
    return this.calculateTrend(risks);
  }

  private calculateConfidence(riskScore: number, factors: number[]): number {
    // Higher confidence when factors align
    const factorAlignment = 1 - (factors.reduce((sum, f) => sum + Math.abs(f - riskScore), 0) / factors.length);
    return factorAlignment;
  }

  private mapRiskFactors(contributions: number[]): InjuryPrediction['topRiskFactors'] {
    const factors = [
      { name: 'Workload & Fatigue', mitigation: 'Reduce snap count or provide extra rest' },
      { name: 'Injury History', mitigation: 'Enhanced recovery protocols and monitoring' },
      { name: 'Age & Position Risk', mitigation: 'Position-specific conditioning program' },
      { name: 'Environmental Factors', mitigation: 'Adjust warm-up and hydration strategies' },
      { name: 'Biomechanical Stress', mitigation: 'Technique refinement and load management' },
    ];
    
    return contributions
      .map((contrib, i) => ({
        factor: factors[i].name,
        contribution: contrib,
        mitigation: factors[i].mitigation,
      }))
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 3);
  }

  private calculateProjectedImpact(riskScore: number): number {
    // Estimate games potentially missed
    if (riskScore < 0.2) return 0;
    if (riskScore < 0.4) return 0.5;
    if (riskScore < 0.6) return 1;
    if (riskScore < 0.8) return 2;
    return 3;
  }

  private getRiskLevel(riskScore: number): string {
    if (riskScore < 0.2) return 'Low Risk';
    if (riskScore < 0.4) return 'Moderate Risk';
    if (riskScore < 0.6) return 'Elevated Risk';
    if (riskScore < 0.8) return 'High Risk';
    return 'Critical Risk';
  }

  private getRecommendedAction(riskScore: number, factors: InjuryPrediction['topRiskFactors']): string {
    if (riskScore < 0.2) {
      return 'Continue normal usage - player shows minimal injury risk';
    } else if (riskScore < 0.4) {
      return `Monitor ${factors[0].factor.toLowerCase()} - consider slight workload reduction`;
    } else if (riskScore < 0.6) {
      return `Implement preventive measures: ${factors[0].mitigation}`;
    } else if (riskScore < 0.8) {
      return `High risk detected - strongly consider limiting usage and ${factors[0].mitigation}`;
    } else {
      return 'Critical risk - recommend sitting player or severe snap count limitation';
    }
  }
}