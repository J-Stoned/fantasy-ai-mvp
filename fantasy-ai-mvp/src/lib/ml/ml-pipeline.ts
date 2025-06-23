/**
 * ML Pipeline Orchestrator
 * Coordinates all ML models for comprehensive fantasy analytics
 */

import { PlayerPredictionModel, PlayerFeatures } from './models/player-prediction-model';
import { MatchupAnalysisModel, MatchupFeatures } from './models/matchup-analysis-model';
import { InjuryRiskModel, InjuryFeatures } from './models/injury-risk-model';
import { TradeValueModel, TradeFeatures } from './models/trade-value-model';
import { LineupOptimizerModel, PlayerProjection, LineupConstraints, OptimizationStrategy } from './models/lineup-optimizer-model';
import { WeatherImpactModel, WeatherConditions, PlayerWeatherProfile } from './models/weather-impact-model';
import { PatternRecognitionModel, PlayerSequence } from './models/pattern-recognition-model';

export interface ComprehensivePlayerAnalysis {
  playerId: string;
  playerName: string;
  position: string;
  
  // Core predictions
  projectedPoints: number;
  confidence: number;
  floor: number;
  ceiling: number;
  
  // Risk assessments
  injuryRisk: {
    score: number;
    level: string;
    factors: string[];
  };
  
  // Matchup analysis
  matchup: {
    advantage: number;
    rating: string;
    keyFactors: string[];
  };
  
  // Weather impact
  weather: {
    impact: number;
    multiplier: number;
    concerns: string[];
  };
  
  // Historical patterns
  patterns: {
    type: string;
    confidence: number;
    description: string;
  }[];
  
  // Trade value
  tradeValue: {
    score: number;
    rank: number;
    recommendation: string;
  };
  
  // Composite scores
  startConfidence: number;
  dfsValue: number;
  seasonLongValue: number;
  
  // Recommendations
  recommendation: string;
  alternativeOptions: string[];
}

export class MLPipeline {
  private static instance: MLPipeline;
  
  private playerPredictionModel: PlayerPredictionModel;
  private matchupAnalysisModel: MatchupAnalysisModel;
  private injuryRiskModel: InjuryRiskModel;
  private tradeValueModel: TradeValueModel;
  private lineupOptimizerModel: LineupOptimizerModel;
  private weatherImpactModel: WeatherImpactModel;
  private patternRecognitionModel: PatternRecognitionModel;
  
  private modelsInitialized = false;
  
  private constructor() {
    this.playerPredictionModel = new PlayerPredictionModel();
    this.matchupAnalysisModel = new MatchupAnalysisModel();
    this.injuryRiskModel = new InjuryRiskModel();
    this.tradeValueModel = new TradeValueModel();
    this.lineupOptimizerModel = new LineupOptimizerModel();
    this.weatherImpactModel = new WeatherImpactModel();
    this.patternRecognitionModel = new PatternRecognitionModel();
  }
  
  static getInstance(): MLPipeline {
    if (!MLPipeline.instance) {
      MLPipeline.instance = new MLPipeline();
    }
    return MLPipeline.instance;
  }
  
  /**
   * Initialize all ML models
   */
  async initialize(): Promise<void> {
    if (this.modelsInitialized) return;
    
    console.log('Initializing ML Pipeline...');
    
    await Promise.all([
      this.playerPredictionModel.initialize(),
      this.matchupAnalysisModel.initialize(),
      this.injuryRiskModel.initialize(),
      this.tradeValueModel.initialize(),
      this.lineupOptimizerModel.initialize(),
      this.weatherImpactModel.initialize(),
      this.patternRecognitionModel.initialize(),
    ]);
    
    this.modelsInitialized = true;
    console.log('ML Pipeline initialized successfully');
  }
  
  /**
   * Comprehensive player analysis using all models
   */
  async analyzePlayer(
    playerId: string,
    playerName: string,
    playerFeatures: PlayerFeatures,
    matchupFeatures: MatchupFeatures,
    injuryFeatures: InjuryFeatures,
    tradeFeatures: TradeFeatures,
    weatherConditions: WeatherConditions,
    weatherProfile: PlayerWeatherProfile,
    historicalSequence: PlayerSequence
  ): Promise<ComprehensivePlayerAnalysis> {
    await this.initialize();
    
    // Run all predictions in parallel
    const [
      playerPrediction,
      matchupAnalysis,
      injuryAssessment,
      tradeAnalysis,
      weatherImpact,
      patternAnalysis,
    ] = await Promise.all([
      this.playerPredictionModel.predictWithEnsemble(playerFeatures),
      this.matchupAnalysisModel.analyzeMatchup(matchupFeatures),
      this.injuryRiskModel.predict(injuryFeatures),
      this.tradeValueModel.predict(tradeFeatures),
      this.weatherImpactModel.analyzeWeatherImpact(weatherConditions, weatherProfile),
      this.patternRecognitionModel.analyzePatterns(historicalSequence),
    ]);
    
    // Apply all adjustments to get final projection
    let adjustedProjection = playerPrediction.prediction as number;
    adjustedProjection *= matchupAnalysis.projectedPointsMultiplier;
    adjustedProjection *= weatherImpact.projectionMultiplier;
    adjustedProjection *= (1 - injuryAssessment.metadata.riskScore * 0.3);
    
    // Calculate floor and ceiling
    const variance = playerPrediction.metadata.variance || 5;
    const floor = Math.max(0, adjustedProjection - variance * 1.5);
    const ceiling = adjustedProjection + variance * 2;
    
    // Calculate composite confidence
    const confidence = this.calculateCompositeConfidence(
      playerPrediction.confidence,
      matchupAnalysis.advantage,
      injuryAssessment.metadata.riskScore,
      weatherImpact.confidenceScore
    );
    
    // Calculate start confidence (0-100)
    const startConfidence = this.calculateStartConfidence(
      adjustedProjection,
      confidence,
      injuryAssessment.metadata.riskScore,
      matchupAnalysis.advantage
    );
    
    // Calculate DFS value
    const dfsValue = this.calculateDFSValue(
      adjustedProjection,
      ceiling,
      tradeFeatures.targetShare,
      matchupAnalysis.advantage
    );
    
    // Calculate season-long value
    const seasonLongValue = this.calculateSeasonLongValue(
      tradeAnalysis.metadata.overallValue,
      patternAnalysis.patterns[0]?.type,
      injuryAssessment.metadata.riskScore
    );
    
    // Generate recommendations
    const recommendation = this.generateRecommendation(
      adjustedProjection,
      startConfidence,
      injuryAssessment.metadata,
      matchupAnalysis,
      weatherImpact,
      patternAnalysis.patterns[0]
    );
    
    const alternativeOptions = this.generateAlternatives(
      playerFeatures.position,
      startConfidence,
      matchupAnalysis.advantage
    );
    
    return {
      playerId,
      playerName,
      position: playerFeatures.position,
      
      projectedPoints: adjustedProjection,
      confidence,
      floor,
      ceiling,
      
      injuryRisk: {
        score: injuryAssessment.metadata.riskScore,
        level: injuryAssessment.metadata.riskLevel,
        factors: injuryAssessment.metadata.topRiskFactors.map(f => f.factor),
      },
      
      matchup: {
        advantage: matchupAnalysis.advantage,
        rating: matchupAnalysis.matchupRating,
        keyFactors: matchupAnalysis.keyFactors.slice(0, 3).map(f => f.factor),
      },
      
      weather: {
        impact: weatherImpact.impactScore,
        multiplier: weatherImpact.projectionMultiplier,
        concerns: weatherImpact.keyFactors
          .filter(f => f.impact < -0.1)
          .map(f => f.description),
      },
      
      patterns: patternAnalysis.patterns.slice(0, 2).map(p => ({
        type: p.type,
        confidence: p.confidence,
        description: p.description,
      })),
      
      tradeValue: {
        score: tradeAnalysis.metadata.overallValue,
        rank: 0, // Would be calculated with full player pool
        recommendation: tradeAnalysis.metadata.tradeRecommendation,
      },
      
      startConfidence,
      dfsValue,
      seasonLongValue,
      
      recommendation,
      alternativeOptions,
    };
  }
  
  /**
   * Optimize full lineup using all ML insights
   */
  async optimizeLineup(
    availablePlayers: {
      player: ComprehensivePlayerAnalysis;
      salary?: number;
      ownership?: number;
    }[],
    constraints: LineupConstraints,
    strategy: OptimizationStrategy
  ): Promise<{
    lineup: ComprehensivePlayerAnalysis[];
    totalProjection: number;
    totalSalary?: number;
    confidence: number;
    alternativeLineups: ComprehensivePlayerAnalysis[][];
  }> {
    await this.initialize();
    
    // Convert to optimizer format
    const projections: PlayerProjection[] = availablePlayers.map(p => ({
      playerId: p.player.playerId,
      name: p.player.playerName,
      position: p.player.position,
      projection: p.player.projectedPoints,
      floor: p.player.floor,
      ceiling: p.player.ceiling,
      salary: p.salary,
      ownership: p.ownership,
      confidence: p.player.confidence,
      injuryRisk: p.player.injuryRisk.score,
      matchupScore: p.player.matchup.advantage,
    }));
    
    // Run optimization
    const optimized = await this.lineupOptimizerModel.optimizeLineup(
      projections,
      constraints,
      strategy
    );
    
    // Map back to comprehensive analysis
    const lineup = optimized.players.map(p => 
      availablePlayers.find(ap => ap.player.playerId === p.playerId)!.player
    );
    
    const alternativeLineups = optimized.alternativeLineups?.map(alt =>
      alt.players.map(p => 
        availablePlayers.find(ap => ap.player.playerId === p.playerId)!.player
      )
    ) || [];
    
    return {
      lineup,
      totalProjection: optimized.totalProjection,
      totalSalary: optimized.totalSalary,
      confidence: optimized.confidenceScore,
      alternativeLineups,
    };
  }
  
  /**
   * Batch analyze multiple players efficiently
   */
  async batchAnalyze(
    players: Array<{
      playerId: string;
      playerName: string;
      features: {
        player: PlayerFeatures;
        matchup: MatchupFeatures;
        injury: InjuryFeatures;
        trade: TradeFeatures;
        weather: WeatherConditions;
        weatherProfile: PlayerWeatherProfile;
        sequence: PlayerSequence;
      };
    }>
  ): Promise<ComprehensivePlayerAnalysis[]> {
    await this.initialize();
    
    // Process in batches to avoid memory issues
    const batchSize = 10;
    const results: ComprehensivePlayerAnalysis[] = [];
    
    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(p => 
          this.analyzePlayer(
            p.playerId,
            p.playerName,
            p.features.player,
            p.features.matchup,
            p.features.injury,
            p.features.trade,
            p.features.weather,
            p.features.weatherProfile,
            p.features.sequence
          )
        )
      );
      results.push(...batchResults);
    }
    
    return results;
  }
  
  // Helper methods
  private calculateCompositeConfidence(
    predictionConfidence: number,
    matchupAdvantage: number,
    injuryRisk: number,
    weatherConfidence: number
  ): number {
    const weights = {
      prediction: 0.4,
      matchup: 0.25,
      injury: 0.2,
      weather: 0.15,
    };
    
    const matchupConfidence = Math.abs(matchupAdvantage);
    const injuryConfidence = 1 - injuryRisk;
    
    return (
      predictionConfidence * weights.prediction +
      matchupConfidence * weights.matchup +
      injuryConfidence * weights.injury +
      weatherConfidence * weights.weather
    );
  }
  
  private calculateStartConfidence(
    projection: number,
    confidence: number,
    injuryRisk: number,
    matchupAdvantage: number
  ): number {
    let startConfidence = confidence * 100;
    
    // Boost for good matchup
    if (matchupAdvantage > 0.3) startConfidence += 10;
    
    // Penalty for injury risk
    startConfidence -= injuryRisk * 30;
    
    // Projection impact
    if (projection > 15) startConfidence += 5;
    if (projection > 20) startConfidence += 5;
    
    return Math.max(0, Math.min(100, startConfidence));
  }
  
  private calculateDFSValue(
    projection: number,
    ceiling: number,
    targetShare: number,
    matchupAdvantage: number
  ): number {
    // DFS values ceiling and correlation
    let value = (projection * 0.6 + ceiling * 0.4) / 25 * 100;
    
    // High target share is good for DFS
    value += targetShare * 20;
    
    // Good matchups increase tournament value
    if (matchupAdvantage > 0.5) value += 10;
    
    return Math.min(100, value);
  }
  
  private calculateSeasonLongValue(
    tradeValue: number,
    dominantPattern: string | undefined,
    injuryRisk: number
  ): number {
    let value = tradeValue;
    
    // Pattern adjustments
    if (dominantPattern === 'breakout') value += 15;
    if (dominantPattern === 'regression') value -= 15;
    if (dominantPattern === 'consistency') value += 10;
    
    // Injury risk penalty
    value -= injuryRisk * 20;
    
    return Math.max(0, Math.min(100, value));
  }
  
  private generateRecommendation(
    projection: number,
    startConfidence: number,
    injuryData: any,
    matchupData: any,
    weatherData: any,
    dominantPattern: any
  ): string {
    const recommendations: string[] = [];
    
    // Start/sit recommendation
    if (startConfidence > 75) {
      recommendations.push('Strong start recommendation');
    } else if (startConfidence > 50) {
      recommendations.push('Viable starting option');
    } else if (startConfidence > 25) {
      recommendations.push('Consider alternatives if available');
    } else {
      recommendations.push('Sit if possible');
    }
    
    // Risk warnings
    if (injuryData.riskScore > 0.6) {
      recommendations.push(`High injury risk (${injuryData.riskLevel})`);
    }
    
    if (weatherData.impactScore < -0.3) {
      recommendations.push('Weather conditions are a concern');
    }
    
    // Opportunities
    if (matchupData.advantage > 0.5) {
      recommendations.push(`Elite matchup vs ${matchupData.matchupRating}`);
    }
    
    if (dominantPattern?.type === 'breakout') {
      recommendations.push('Breakout pattern detected - ride the wave');
    }
    
    return recommendations.join('. ');
  }
  
  private generateAlternatives(
    position: string,
    startConfidence: number,
    matchupAdvantage: number
  ): string[] {
    const alternatives: string[] = [];
    
    if (startConfidence < 50) {
      alternatives.push(`Look for other ${position}s with better matchups`);
      
      if (matchupAdvantage < -0.3) {
        alternatives.push('Consider streaming options against weaker defenses');
      }
      
      alternatives.push('Check waiver wire for emerging players');
    }
    
    return alternatives;
  }
  
  /**
   * Cleanup and dispose of models
   */
  dispose(): void {
    this.playerPredictionModel.dispose();
    this.matchupAnalysisModel.dispose();
    this.injuryRiskModel.dispose();
    this.tradeValueModel.dispose();
    this.lineupOptimizerModel.dispose();
    this.weatherImpactModel.dispose();
    this.patternRecognitionModel.dispose();
    
    this.modelsInitialized = false;
  }
}