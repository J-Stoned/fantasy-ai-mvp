/**
 * Trade Value Calculator Model
 * Evaluates player trade values using market dynamics and performance projections
 */

import * as tf from '@tensorflow/tfjs';
import { BaseMLModel, ModelConfig, PredictionResult } from '../base-model';

export interface TradeFeatures {
  // Player performance metrics
  currentSeasonPoints: number;
  projectedSeasonPoints: number;
  consistencyScore: number; // Standard deviation inverse
  ceilingScore: number; // 90th percentile performance
  floorScore: number; // 10th percentile performance
  
  // Market dynamics
  position: string;
  positionalScarcity: number; // How many quality players at position
  leagueSize: number;
  scoringSystem: string; // Standard, PPR, Half-PPR
  rosterRequirements: {
    [position: string]: number;
  };
  
  // Team context
  teamRecord: string; // W-L
  playoffProbability: number;
  scheduleStrength: number; // Remaining schedule
  byeWeekPassed: boolean;
  
  // Player attributes
  age: number;
  contractYear: number; // For dynasty
  injuryRisk: number; // From injury model
  trendDirection: number; // -1 to 1
  
  // League context
  tradeDeadlineProximity: number; // Weeks until deadline
  keeperEligible: boolean;
  dynastyValue: number; // Long-term value
  
  // Recent performance
  last4WeeksAverage: number;
  last4WeeksRank: number;
  targetShare: number; // Usage metrics
  redZoneShare: number;
}

export interface TradeValue {
  overallValue: number; // 0-100 scale
  positionalRank: number;
  fairTradeTargets: {
    playerId: string;
    playerName: string;
    position: string;
    valueScore: number;
    matchQuality: number;
  }[];
  valueFactors: {
    factor: string;
    impact: number;
    description: string;
  }[];
  tradeRecommendation: string;
}

export class TradeValueModel extends BaseMLModel {
  private readonly scoringMultipliers: Record<string, number> = {
    'Standard': 1.0,
    'PPR': 1.2,
    'Half-PPR': 1.1,
  };

  constructor() {
    super({
      name: 'trade-value',
      version: '1.0',
      inputShape: [40], // Trade-related features
      outputShape: [8], // Value score + 7 factor impacts
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
      kernelInitializer: 'glorotNormal',
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.2 }));

    // Hidden layers for value computation
    model.add(tf.layers.dense({
      units: 128,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.3 }));

    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
    }));
    model.add(tf.layers.batchNormalization());

    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu',
    }));

    // Output layer
    model.add(tf.layers.dense({
      units: this.config.outputShape[0],
      activation: 'sigmoid', // 0-1 for normalized value scores
    }));

    model.compile({
      optimizer: tf.train.adam(this.config.learningRate!),
      loss: 'meanSquaredError',
      metrics: ['mae'],
    });

    return model;
  }

  protected preprocessInput(features: TradeFeatures): tf.Tensor {
    // Calculate derived metrics
    const performanceValue = this.calculatePerformanceValue(features);
    const scarcityValue = this.calculateScarcityValue(features);
    const situationalValue = this.calculateSituationalValue(features);
    const marketTiming = this.calculateMarketTiming(features);
    
    const inputFeatures = [
      // Performance metrics (normalized)
      features.currentSeasonPoints / 300,
      features.projectedSeasonPoints / 300,
      features.consistencyScore,
      features.ceilingScore / 40,
      features.floorScore / 20,
      
      // Market dynamics
      this.encodePosition(features.position),
      features.positionalScarcity,
      features.leagueSize / 16,
      this.scoringMultipliers[features.scoringSystem] - 1,
      this.calculatePositionalDemand(features),
      
      // Team context
      this.encodeTeamRecord(features.teamRecord),
      features.playoffProbability,
      features.scheduleStrength,
      features.byeWeekPassed ? 1 : 0,
      
      // Player attributes
      features.age / 40,
      features.contractYear / 5,
      1 - features.injuryRisk,
      (features.trendDirection + 1) / 2,
      
      // League context
      features.tradeDeadlineProximity / 10,
      features.keeperEligible ? 1 : 0,
      features.dynastyValue,
      
      // Recent performance
      features.last4WeeksAverage / 25,
      1 - (features.last4WeeksRank / 50),
      features.targetShare,
      features.redZoneShare,
      
      // Composite values
      performanceValue,
      scarcityValue,
      situationalValue,
      marketTiming,
      
      // Interaction features
      performanceValue * scarcityValue,
      features.consistencyScore * features.playoffProbability,
      features.trendDirection * marketTiming,
      features.dynastyValue * (1 - features.age / 40),
      
      // Advanced metrics
      this.calculateValueVolatility(features),
      this.calculateReplaceabilityScore(features),
      this.calculatePlayoffValue(features),
      this.calculateTradeUrgency(features),
      this.calculatePackageValue(features),
    ];
    
    return tf.tensor2d([inputFeatures]);
  }

  protected postprocessOutput(output: tf.Tensor): PredictionResult {
    const values = output.arraySync() as number[][];
    const predictions = values[0];
    
    const overallValue = predictions[0] * 100; // Convert to 0-100 scale
    const factorImpacts = predictions.slice(1);
    
    // Map value factors
    const valueFactors = this.mapValueFactors(factorImpacts);
    
    return {
      prediction: overallValue,
      confidence: this.calculateValueConfidence(overallValue, factorImpacts),
      metadata: {
        overallValue,
        valueFactors,
        tradeRecommendation: this.getTradeRecommendation(overallValue, valueFactors),
      },
    };
  }

  /**
   * Calculate fair trade targets
   */
  async findFairTrades(
    playerFeatures: TradeFeatures,
    availablePlayers: { id: string; name: string; features: TradeFeatures }[]
  ): Promise<TradeValue> {
    const playerValue = await this.predict(playerFeatures);
    const targetValue = playerValue.prediction as number;
    
    // Evaluate all available players
    const tradeTargets = await Promise.all(
      availablePlayers.map(async (player) => {
        const value = await this.predict(player.features);
        return {
          playerId: player.id,
          playerName: player.name,
          position: player.features.position,
          valueScore: value.prediction as number,
          matchQuality: this.calculateMatchQuality(
            targetValue,
            value.prediction as number,
            playerFeatures,
            player.features
          ),
        };
      })
    );
    
    // Sort by match quality
    const fairTradeTargets = tradeTargets
      .filter(t => t.matchQuality > 0.7)
      .sort((a, b) => b.matchQuality - a.matchQuality)
      .slice(0, 10);
    
    // Calculate positional rank
    const positionalRank = this.calculatePositionalRank(
      targetValue,
      availablePlayers.filter(p => p.features.position === playerFeatures.position)
    );
    
    return {
      overallValue: targetValue,
      positionalRank,
      fairTradeTargets,
      valueFactors: playerValue.metadata?.valueFactors || [],
      tradeRecommendation: playerValue.metadata?.tradeRecommendation || '',
    };
  }

  /**
   * Evaluate multi-player trades
   */
  async evaluatePackageDeal(
    givingPlayers: TradeFeatures[],
    receivingPlayers: TradeFeatures[]
  ): Promise<{
    givingSideValue: number;
    receivingSideValue: number;
    fairness: number;
    recommendation: string;
  }> {
    // Calculate total values for each side
    const givingValues = await Promise.all(
      givingPlayers.map(p => this.predict(p))
    );
    const receivingValues = await Promise.all(
      receivingPlayers.map(p => this.predict(p))
    );
    
    const givingSideValue = givingValues.reduce(
      (sum, v) => sum + (v.prediction as number),
      0
    );
    const receivingSideValue = receivingValues.reduce(
      (sum, v) => sum + (v.prediction as number),
      0
    );
    
    // Account for roster consolidation value
    const consolidationBonus = this.calculateConsolidationBonus(
      givingPlayers.length,
      receivingPlayers.length
    );
    
    const adjustedReceivingValue = receivingSideValue * consolidationBonus;
    const fairness = Math.min(
      adjustedReceivingValue / givingSideValue,
      givingSideValue / adjustedReceivingValue
    );
    
    return {
      givingSideValue,
      receivingSideValue: adjustedReceivingValue,
      fairness,
      recommendation: this.getPackageDealRecommendation(
        givingSideValue,
        adjustedReceivingValue,
        fairness
      ),
    };
  }

  // Helper methods
  private encodePosition(position: string): number {
    const positionValues: Record<string, number> = {
      'QB': 0.3,
      'RB': 0.9,
      'WR': 0.7,
      'TE': 0.5,
      'K': 0.1,
      'DST': 0.2,
    };
    return positionValues[position] || 0.5;
  }

  private encodeTeamRecord(record: string): number {
    const [wins, losses] = record.split('-').map(Number);
    const total = wins + losses;
    return total > 0 ? wins / total : 0.5;
  }

  private calculatePerformanceValue(features: TradeFeatures): number {
    const current = features.currentSeasonPoints / 300;
    const projected = features.projectedSeasonPoints / 300;
    const consistency = features.consistencyScore;
    const ceiling = features.ceilingScore / 40;
    
    return (current * 0.3 + projected * 0.3 + consistency * 0.2 + ceiling * 0.2);
  }

  private calculateScarcityValue(features: TradeFeatures): number {
    const positionalScarcity = features.positionalScarcity;
    const leagueSizeFactor = features.leagueSize / 12;
    const positionDemand = this.calculatePositionalDemand(features);
    
    return (positionalScarcity * 0.5 + positionDemand * 0.3 + leagueSizeFactor * 0.2);
  }

  private calculateSituationalValue(features: TradeFeatures): number {
    let value = 0.5;
    
    // Playoff teams value consistency
    if (features.playoffProbability > 0.7) {
      value += features.consistencyScore * 0.2;
    }
    // Non-playoff teams value ceiling
    else if (features.playoffProbability < 0.3) {
      value += (features.ceilingScore / 40) * 0.2;
    }
    
    // Schedule bonus
    value += (1 - features.scheduleStrength) * 0.1;
    
    // Bye week bonus
    if (features.byeWeekPassed) value += 0.1;
    
    return Math.min(1, value);
  }

  private calculateMarketTiming(features: TradeFeatures): number {
    const deadlineUrgency = 1 - (features.tradeDeadlineProximity / 10);
    const trendBonus = (features.trendDirection + 1) / 2;
    const recentPerformance = features.last4WeeksAverage / features.currentSeasonPoints;
    
    return (deadlineUrgency * 0.4 + trendBonus * 0.3 + recentPerformance * 0.3);
  }

  private calculatePositionalDemand(features: TradeFeatures): number {
    const requirements = features.rosterRequirements[features.position] || 2;
    const scarcity = features.positionalScarcity;
    return Math.min(1, requirements * scarcity / 5);
  }

  private calculateValueVolatility(features: TradeFeatures): number {
    const range = features.ceilingScore - features.floorScore;
    const avg = (features.ceilingScore + features.floorScore) / 2;
    return avg > 0 ? range / avg : 1;
  }

  private calculateReplaceabilityScore(features: TradeFeatures): number {
    // How hard is it to replace this player's production
    const scarcity = features.positionalScarcity;
    const performance = features.currentSeasonPoints / 300;
    const consistency = features.consistencyScore;
    
    return (scarcity * 0.5 + performance * 0.3 + consistency * 0.2);
  }

  private calculatePlayoffValue(features: TradeFeatures): number {
    // Value during fantasy playoffs
    const scheduleBonus = 1 - features.scheduleStrength;
    const consistencyBonus = features.consistencyScore;
    const healthBonus = 1 - features.injuryRisk;
    
    return (scheduleBonus * 0.4 + consistencyBonus * 0.4 + healthBonus * 0.2);
  }

  private calculateTradeUrgency(features: TradeFeatures): number {
    let urgency = 0;
    
    // Deadline approaching
    urgency += (1 - features.tradeDeadlineProximity / 10) * 0.3;
    
    // Team needs (playoff probability)
    if (features.playoffProbability > 0.3 && features.playoffProbability < 0.7) {
      urgency += 0.3; // Bubble teams most urgent
    }
    
    // Trending direction
    if (features.trendDirection < -0.5) urgency += 0.2; // Sell low candidates
    if (features.trendDirection > 0.5) urgency += 0.1; // Buy low opportunities
    
    // Injury risk
    urgency += features.injuryRisk * 0.1;
    
    return Math.min(1, urgency);
  }

  private calculatePackageValue(features: TradeFeatures): number {
    // How valuable in multi-player deals
    const overallValue = features.currentSeasonPoints / 300;
    const consistency = features.consistencyScore;
    
    // Mid-tier consistent players are good package pieces
    if (overallValue > 0.4 && overallValue < 0.7 && consistency > 0.6) {
      return 0.8;
    }
    
    // Elite players less likely to be packaged
    if (overallValue > 0.8) return 0.3;
    
    return 0.5;
  }

  private calculateMatchQuality(
    value1: number,
    value2: number,
    features1: TradeFeatures,
    features2: TradeFeatures
  ): number {
    // Value similarity
    const valueDiff = Math.abs(value1 - value2) / Math.max(value1, value2);
    const valueSimilarity = 1 - valueDiff;
    
    // Position need fit
    let positionFit = 0.5;
    if (features1.position !== features2.position) {
      positionFit = 0.8; // Different positions often better for trades
    }
    
    // Team need fit
    const team1Needs = features1.playoffProbability > 0.5 ? 'consistency' : 'upside';
    const team2Needs = features2.playoffProbability > 0.5 ? 'consistency' : 'upside';
    
    let needFit = 0.5;
    if (team1Needs === 'consistency' && features2.consistencyScore > features1.consistencyScore) {
      needFit = 0.8;
    } else if (team1Needs === 'upside' && features2.ceilingScore > features1.ceilingScore) {
      needFit = 0.8;
    }
    
    return valueSimilarity * 0.6 + positionFit * 0.2 + needFit * 0.2;
  }

  private calculatePositionalRank(
    value: number,
    positionPlayers: { features: TradeFeatures }[]
  ): number {
    const betterPlayers = positionPlayers.filter(
      p => p.features.currentSeasonPoints > (value / 100) * 300
    ).length;
    
    return betterPlayers + 1;
  }

  private calculateConsolidationBonus(giving: number, receiving: number): number {
    // 2-for-1 trades get a bonus for consolidating talent
    if (giving > receiving) {
      return 1 + (giving - receiving) * 0.1;
    }
    return 1;
  }

  private calculateValueConfidence(value: number, factors: number[]): number {
    // Higher confidence when factors align with overall value
    const avgFactor = factors.reduce((a, b) => a + b, 0) / factors.length;
    const factorAlignment = 1 - Math.abs(value / 100 - avgFactor);
    
    // Extreme values have lower confidence
    const extremePenalty = Math.abs(value - 50) / 50 * 0.2;
    
    return Math.max(0.3, factorAlignment - extremePenalty);
  }

  private mapValueFactors(impacts: number[]): TradeValue['valueFactors'] {
    const factorNames = [
      'Performance & Projections',
      'Positional Scarcity',
      'Team Situation',
      'Recent Trend',
      'Schedule Strength',
      'Health & Durability',
      'Market Timing',
    ];
    
    return impacts
      .map((impact, i) => ({
        factor: factorNames[i],
        impact,
        description: this.getFactorDescription(factorNames[i], impact),
      }))
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      .slice(0, 5);
  }

  private getFactorDescription(factor: string, impact: number): string {
    const positive = impact > 0.5;
    const magnitude = Math.abs(impact - 0.5) * 2;
    
    const descriptions: Record<string, { positive: string; negative: string }> = {
      'Performance & Projections': {
        positive: `Strong performance and favorable projections increase value`,
        negative: `Below-average performance limits trade value`,
      },
      'Positional Scarcity': {
        positive: `High demand at position due to scarcity`,
        negative: `Position is deep, limiting trade leverage`,
      },
      'Team Situation': {
        positive: `Team context (playoffs, schedule) enhances value`,
        negative: `Team situation reduces immediate value`,
      },
      'Recent Trend': {
        positive: `Trending upward, increasing market value`,
        negative: `Recent struggles dampening trade interest`,
      },
    };
    
    const desc = descriptions[factor];
    if (!desc) return `${factor}: ${positive ? 'Positive' : 'Negative'} impact (${magnitude.toFixed(1)})`;
    
    return positive ? desc.positive : desc.negative;
  }

  private getTradeRecommendation(value: number, factors: TradeValue['valueFactors']): string {
    const topFactor = factors[0];
    
    if (value > 80) {
      return `Elite trade value - only move for significant overpay or specific team needs. ${topFactor.factor} is driving exceptional value.`;
    } else if (value > 60) {
      return `Strong trade value - good position to negotiate favorable deals. Leverage ${topFactor.factor} in negotiations.`;
    } else if (value > 40) {
      return `Average trade value - consider packaging with other assets or targeting specific team needs. ${topFactor.factor} is the key selling point.`;
    } else if (value > 20) {
      return `Below-average value - may need to sell low or wait for improvement. ${topFactor.factor} is limiting current value.`;
    } else {
      return `Minimal trade value - consider holding unless part of larger package deal. ${topFactor.factor} significantly impacts marketability.`;
    }
  }

  private getPackageDealRecommendation(
    giving: number,
    receiving: number,
    fairness: number
  ): string {
    const ratio = receiving / giving;
    
    if (fairness > 0.9) {
      return 'Very fair trade - both sides receive equivalent value';
    } else if (ratio > 1.15) {
      return 'You win this trade - receiving significantly more value';
    } else if (ratio < 0.85) {
      return 'You lose this trade - giving up too much value';
    } else {
      return 'Reasonably fair trade - slight edge to ' + (ratio > 1 ? 'you' : 'other party');
    }
  }
}