/**
 * Matchup Analysis Model
 * Analyzes player vs defense matchups using neural networks
 */

import * as tf from '@tensorflow/tfjs';
import { BaseMLModel, ModelConfig, PredictionResult } from '../base-model';

export interface MatchupFeatures {
  // Player features
  playerPosition: string;
  playerAveragePoints: number;
  playerRecentForm: number; // Last 3 games avg
  playerConsistency: number; // Standard deviation
  playerUsage: number; // Target share, carry share, etc.
  
  // Defense features
  defenseRankVsPosition: number;
  defensePointsAllowedVsPosition: number;
  defenseRecentForm: number;
  defenseInjuries: number; // Key defensive players out
  defenseScheme: string; // 3-4, 4-3, Zone, Man
  
  // Historical matchup data
  previousMatchups: {
    points: number;
    yards: number;
    touchdowns: number;
    date: number; // Days ago
  }[];
  
  // Game context
  gameSpread: number;
  overUnder: number;
  impliedTeamTotal: number;
  timeOfPossession: number;
  pace: number; // Plays per game
  
  // Situational factors
  division: boolean;
  primetime: boolean;
  playoffs: boolean;
  mustWin: boolean;
}

export interface MatchupPrediction {
  advantage: number; // -1 to 1 (-1 = bad matchup, 1 = great matchup)
  projectedPointsMultiplier: number;
  keyFactors: {
    factor: string;
    impact: number;
    description: string;
  }[];
}

export class MatchupAnalysisModel extends BaseMLModel {
  private readonly schemeEncodings: Record<string, number> = {
    '3-4': 0,
    '4-3': 1,
    'Zone': 2,
    'Man': 3,
    'Hybrid': 4,
  };

  constructor() {
    super({
      name: 'matchup-analysis',
      version: '1.0',
      inputShape: [35], // All features flattened
      outputShape: [10], // Advantage score + 9 factor impacts
      batchSize: 32,
      epochs: 80,
      learningRate: 0.0005,
    });
  }

  protected buildModel(): tf.LayersModel {
    const model = tf.sequential();

    // Input layer with batch normalization
    model.add(tf.layers.dense({
      units: 64,
      inputShape: this.config.inputShape as [number],
      activation: 'relu',
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.3 }));

    // Hidden layers with residual connections
    model.add(tf.layers.dense({
      units: 128,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }),
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.3 }));

    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu',
    }));

    // Output layer
    model.add(tf.layers.dense({
      units: this.config.outputShape[0],
      activation: 'tanh', // -1 to 1 for advantage scores
    }));

    model.compile({
      optimizer: tf.train.adam(this.config.learningRate!),
      loss: 'meanSquaredError',
      metrics: ['mae'],
    });

    return model;
  }

  protected preprocessInput(features: MatchupFeatures): tf.Tensor {
    // Calculate aggregated historical matchup stats
    const historicalStats = this.aggregateHistoricalMatchups(features.previousMatchups);
    
    const inputFeatures = [
      // Player features (normalized)
      this.encodePosition(features.playerPosition),
      features.playerAveragePoints / 30,
      features.playerRecentForm / 30,
      features.playerConsistency / 10,
      features.playerUsage,
      
      // Defense features
      features.defenseRankVsPosition / 32,
      features.defensePointsAllowedVsPosition / 30,
      features.defenseRecentForm / 30,
      features.defenseInjuries / 5,
      this.schemeEncodings[features.defenseScheme] / 4,
      
      // Historical matchup features
      historicalStats.avgPoints / 30,
      historicalStats.avgYards / 150,
      historicalStats.avgTouchdowns / 3,
      historicalStats.recency,
      historicalStats.consistency,
      
      // Game context
      (features.gameSpread + 14) / 28, // Normalize spread
      features.overUnder / 60,
      features.impliedTeamTotal / 35,
      features.timeOfPossession / 35,
      features.pace / 70,
      
      // Situational factors
      features.division ? 1 : 0,
      features.primetime ? 1 : 0,
      features.playoffs ? 1 : 0,
      features.mustWin ? 1 : 0,
      
      // Derived features
      this.calculateMatchupTrend(features),
      this.calculateScoringEnvironment(features),
      this.calculateUsageProjection(features),
      this.calculateDefensiveVulnerability(features),
      this.calculateGameScript(features),
      this.calculateHistoricalDominance(features),
      
      // Interaction features
      features.playerAveragePoints * features.defensePointsAllowedVsPosition / 900,
      features.playerUsage * features.impliedTeamTotal / 35,
      features.playerConsistency * features.defenseRecentForm / 300,
      features.pace * features.overUnder / 4200,
      features.gameSpread * features.playerUsage / 14,
    ];
    
    return tf.tensor2d([inputFeatures]);
  }

  protected postprocessOutput(output: tf.Tensor): PredictionResult {
    const values = output.arraySync() as number[][];
    const predictions = values[0];
    
    const advantage = predictions[0]; // Main advantage score
    const factorImpacts = predictions.slice(1);
    
    // Calculate projected points multiplier
    const multiplier = 1 + (advantage * 0.3); // -30% to +30% impact
    
    // Map factor impacts to descriptions
    const keyFactors = this.mapFactorImpacts(factorImpacts);
    
    return {
      prediction: advantage,
      confidence: Math.abs(advantage), // Higher absolute values = more confident
      metadata: {
        advantage,
        projectedPointsMultiplier: multiplier,
        keyFactors,
        matchupRating: this.getMatchupRating(advantage),
      } as MatchupPrediction,
    };
  }

  /**
   * Analyze head-to-head player vs defense matchup
   */
  async analyzeMatchup(features: MatchupFeatures): Promise<MatchupPrediction> {
    const result = await this.predict(features);
    return result.metadata as MatchupPrediction;
  }

  /**
   * Compare multiple matchup options
   */
  async compareMatchups(matchups: MatchupFeatures[]): Promise<{
    bestMatchup: number;
    rankings: MatchupPrediction[];
  }> {
    const predictions = await Promise.all(
      matchups.map(m => this.analyzeMatchup(m))
    );
    
    const ranked = predictions
      .map((p, i) => ({ ...p, index: i }))
      .sort((a, b) => b.advantage - a.advantage);
    
    return {
      bestMatchup: ranked[0].index,
      rankings: ranked,
    };
  }

  // Helper methods
  private encodePosition(position: string): number {
    const positionMap: Record<string, number> = {
      'QB': 0, 'RB': 0.2, 'WR': 0.4, 'TE': 0.6, 'K': 0.8, 'DST': 1
    };
    return positionMap[position] || 0.5;
  }

  private aggregateHistoricalMatchups(matchups: MatchupFeatures['previousMatchups']) {
    if (!matchups || matchups.length === 0) {
      return { avgPoints: 0, avgYards: 0, avgTouchdowns: 0, recency: 0, consistency: 0 };
    }
    
    const points = matchups.map(m => m.points);
    const yards = matchups.map(m => m.yards);
    const touchdowns = matchups.map(m => m.touchdowns);
    
    // Weight recent games more heavily
    const weights = matchups.map(m => Math.exp(-m.date / 365));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    
    const avgPoints = weights.reduce((sum, w, i) => sum + points[i] * w, 0) / totalWeight;
    const avgYards = weights.reduce((sum, w, i) => sum + yards[i] * w, 0) / totalWeight;
    const avgTouchdowns = weights.reduce((sum, w, i) => sum + touchdowns[i] * w, 0) / totalWeight;
    
    // Calculate consistency
    const pointsStdDev = Math.sqrt(
      points.reduce((sum, p) => sum + Math.pow(p - avgPoints, 2), 0) / points.length
    );
    
    return {
      avgPoints,
      avgYards,
      avgTouchdowns,
      recency: 1 / (1 + matchups[0]?.date / 365),
      consistency: 1 / (1 + pointsStdDev / 10),
    };
  }

  private calculateMatchupTrend(features: MatchupFeatures): number {
    // Trend of defense performance vs position
    return (features.defenseRecentForm - features.defensePointsAllowedVsPosition) / 30;
  }

  private calculateScoringEnvironment(features: MatchupFeatures): number {
    // High scoring game potential
    return (features.overUnder / 50 + features.impliedTeamTotal / 30) / 2;
  }

  private calculateUsageProjection(features: MatchupFeatures): number {
    // Expected usage in this matchup
    const gameScriptFactor = features.gameSpread > 0 ? 1.1 : 0.9;
    return features.playerUsage * gameScriptFactor * (features.pace / 65);
  }

  private calculateDefensiveVulnerability(features: MatchupFeatures): number {
    // How vulnerable is the defense
    return (features.defensePointsAllowedVsPosition / 25 + features.defenseInjuries / 5) / 2;
  }

  private calculateGameScript(features: MatchupFeatures): number {
    // Expected game flow impact
    const spreadImpact = features.gameSpread / 14;
    const totalImpact = features.impliedTeamTotal / 30;
    return (spreadImpact + totalImpact) / 2;
  }

  private calculateHistoricalDominance(features: MatchupFeatures): number {
    if (!features.previousMatchups || features.previousMatchups.length === 0) return 0;
    
    // How well has player done vs this defense historically
    const avgHistorical = features.previousMatchups.reduce((sum, m) => sum + m.points, 0) / features.previousMatchups.length;
    return (avgHistorical - features.playerAveragePoints) / features.playerAveragePoints;
  }

  private mapFactorImpacts(impacts: number[]): MatchupPrediction['keyFactors'] {
    const factorNames = [
      'Defense Ranking Impact',
      'Recent Form Trend',
      'Historical Performance',
      'Game Script Projection',
      'Scoring Environment',
      'Usage Opportunity',
      'Defensive Vulnerabilities',
      'Situational Factors',
      'Matchup-Specific Trends',
    ];
    
    return impacts
      .map((impact, i) => ({
        factor: factorNames[i],
        impact,
        description: this.getFactorDescription(factorNames[i], impact),
      }))
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      .slice(0, 5); // Top 5 factors
  }

  private getFactorDescription(factor: string, impact: number): string {
    const positive = impact > 0;
    const magnitude = Math.abs(impact);
    
    const descriptions: Record<string, { positive: string; negative: string }> = {
      'Defense Ranking Impact': {
        positive: `Facing a defense ranked poorly against the position (${magnitude > 0.5 ? 'major' : 'minor'} advantage)`,
        negative: `Facing a top-ranked defense against the position (${magnitude > 0.5 ? 'major' : 'minor'} disadvantage)`,
      },
      'Recent Form Trend': {
        positive: `Player trending up while defense trending down`,
        negative: `Player struggling recently against improving defense`,
      },
      'Historical Performance': {
        positive: `Strong historical success against this defense`,
        negative: `Historically struggles against this defense`,
      },
      'Game Script Projection': {
        positive: `Favorable game script expected (positive game flow)`,
        negative: `Unfavorable game script expected (negative game flow)`,
      },
      'Scoring Environment': {
        positive: `High-scoring game environment projected`,
        negative: `Low-scoring defensive battle expected`,
      },
    };
    
    const desc = descriptions[factor];
    return desc ? (positive ? desc.positive : desc.negative) : `${factor}: ${positive ? 'Positive' : 'Negative'} impact`;
  }

  private getMatchupRating(advantage: number): string {
    if (advantage > 0.6) return 'Elite Matchup';
    if (advantage > 0.3) return 'Great Matchup';
    if (advantage > 0) return 'Good Matchup';
    if (advantage > -0.3) return 'Neutral Matchup';
    if (advantage > -0.6) return 'Tough Matchup';
    return 'Avoid if Possible';
  }
}