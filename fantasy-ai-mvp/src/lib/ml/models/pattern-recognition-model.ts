/**
 * Historical Pattern Recognition Model
 * Identifies and predicts performance patterns using sequence analysis
 */

import * as tf from '@tensorflow/tfjs';
import { BaseMLModel, ModelConfig, PredictionResult } from '../base-model';

export interface HistoricalPattern {
  type: 'breakout' | 'regression' | 'consistency' | 'volatility' | 'seasonal' | 'situational';
  confidence: number;
  timeline: string;
  description: string;
  predictedDuration: number; // games
  historicalExamples: {
    playerId: string;
    year: number;
    similarity: number;
  }[];
}

export interface PlayerSequence {
  playerId: string;
  position: string;
  
  // Performance sequences (last 20 games)
  pointsSequence: number[];
  usageSequence: number[]; // Targets, touches, etc.
  efficiencySequence: number[]; // YPC, YPT, etc.
  
  // Context sequences
  opponentRankSequence: number[];
  gameScriptSequence: number[]; // Win margin
  injuryStatusSequence: number[]; // 0 = healthy, 1 = injured
  
  // Career context
  seasonNumber: number;
  gamesPlayed: number;
  age: number;
  
  // Team changes
  teamChange: boolean;
  coachChange: boolean;
  schemeChange: boolean;
  
  // Current situation
  currentStreak: number; // Games above/below average
  recentTrend: number; // -1 to 1
  volatilityScore: number;
}

export interface PatternPrediction {
  patterns: HistoricalPattern[];
  nextGameProjection: {
    points: number;
    confidence: number;
    range: { low: number; high: number };
  };
  seasonProjection: {
    remainingPoints: number;
    peakWeek: number;
    volatilityExpected: number;
  };
  insights: {
    type: string;
    message: string;
    actionable: boolean;
  }[];
}

export class PatternRecognitionModel extends BaseMLModel {
  private patternDatabase: Map<string, any[]> = new Map();
  
  constructor() {
    super({
      name: 'pattern-recognition',
      version: '1.0',
      inputShape: [20, 15], // 20 time steps, 15 features per step
      outputShape: [10], // Pattern probabilities + projections
      batchSize: 32,
      epochs: 120,
      learningRate: 0.0005,
    });
  }

  protected buildModel(): tf.LayersModel {
    const model = tf.sequential();

    // Bidirectional LSTM for pattern recognition
    model.add(tf.layers.bidirectional({
      layer: tf.layers.lstm({
        units: 64,
        returnSequences: true,
      }),
      inputShape: this.config.inputShape as [number, number],
    }));
    
    model.add(tf.layers.dropout({ rate: 0.2 }));
    
    // Dense attention mechanism (simplified)
    model.add(tf.layers.dense({
      units: 64,
      activation: 'tanh',
      name: 'attention_weights'
    }));
    
    // Second LSTM layer
    model.add(tf.layers.bidirectional({
      layer: tf.layers.lstm({
        units: 32,
        returnSequences: false,
      }),
    }));
    
    model.add(tf.layers.dropout({ rate: 0.3 }));

    // Dense layers for pattern classification
    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
    }));
    
    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu',
    }));
    
    // Output layer
    model.add(tf.layers.dense({
      units: this.config.outputShape[0],
      activation: 'sigmoid',
    }));

    model.compile({
      optimizer: tf.train.adam(this.config.learningRate!),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });

    return model;
  }

  protected preprocessInput(sequence: PlayerSequence): tf.Tensor {
    const timeSteps: number[][] = [];
    
    // Create feature vectors for each time step
    for (let i = 0; i < 20; i++) {
      const features = [
        // Performance features
        (sequence.pointsSequence[i] || 0) / 30,
        (sequence.usageSequence[i] || 0) / 30,
        (sequence.efficiencySequence[i] || 0) / 10,
        
        // Normalized by position average
        this.normalizeByPosition(sequence.pointsSequence[i] || 0, sequence.position),
        
        // Context features
        (sequence.opponentRankSequence[i] || 16) / 32,
        (sequence.gameScriptSequence[i] || 0) / 30,
        sequence.injuryStatusSequence[i] || 0,
        
        // Rolling statistics
        this.calculateRollingAverage(sequence.pointsSequence, i, 3) / 30,
        this.calculateRollingStdDev(sequence.pointsSequence, i, 3) / 10,
        
        // Trend indicators
        this.calculateLocalTrend(sequence.pointsSequence, i),
        this.calculateMomentum(sequence.pointsSequence, i),
        
        // Pattern indicators
        this.detectMiniStreak(sequence.pointsSequence, i),
        this.detectVolatilityChange(sequence.pointsSequence, i),
        
        // Seasonal indicator
        Math.sin(2 * Math.PI * (i + sequence.gamesPlayed) / 17),
        Math.cos(2 * Math.PI * (i + sequence.gamesPlayed) / 17),
      ];
      
      timeSteps.push(features);
    }
    
    return tf.tensor3d([timeSteps]);
  }

  protected postprocessOutput(output: tf.Tensor): PredictionResult {
    const values = output.arraySync() as number[][];
    const predictions = values[0];
    
    // Extract pattern probabilities
    const patternProbs = {
      breakout: predictions[0],
      regression: predictions[1],
      consistency: predictions[2],
      volatility: predictions[3],
      seasonal: predictions[4],
      situational: predictions[5],
    };
    
    // Extract projections
    const nextGameProjection = predictions[6] * 30;
    const confidence = predictions[7];
    const volatilityExpected = predictions[8];
    const trendStrength = predictions[9];
    
    return {
      prediction: nextGameProjection,
      confidence,
      metadata: {
        patternProbs,
        volatilityExpected,
        trendStrength,
      },
    };
  }

  /**
   * Comprehensive pattern analysis
   */
  async analyzePatterns(sequence: PlayerSequence): Promise<PatternPrediction> {
    const result = await this.predict(sequence);
    const { patternProbs, volatilityExpected, trendStrength } = result.metadata as any;
    
    // Identify dominant patterns
    const patterns = this.identifyPatterns(patternProbs, sequence);
    
    // Find historical matches
    const enrichedPatterns = await this.enrichWithHistoricalMatches(patterns, sequence);
    
    // Generate projections
    const nextGameProjection = {
      points: result.prediction as number,
      confidence: result.confidence,
      range: this.calculateProjectionRange(
        result.prediction as number,
        volatilityExpected,
        result.confidence
      ),
    };
    
    const seasonProjection = this.projectRestOfSeason(
      sequence,
      patterns,
      trendStrength
    );
    
    // Generate insights
    const insights = this.generateInsights(
      enrichedPatterns,
      sequence,
      nextGameProjection
    );
    
    return {
      patterns: enrichedPatterns,
      nextGameProjection,
      seasonProjection,
      insights,
    };
  }

  /**
   * Compare player to historical patterns
   */
  async findSimilarCareerArcs(
    sequence: PlayerSequence,
    historicalPlayers: PlayerSequence[]
  ): Promise<{
    playerId: string;
    similarity: number;
    outcome: string;
  }[]> {
    const similarities = await Promise.all(
      historicalPlayers.map(async (historical) => {
        const similarity = await this.calculateSequenceSimilarity(sequence, historical);
        return {
          playerId: historical.playerId,
          similarity,
          outcome: this.getPlayerOutcome(historical),
        };
      })
    );
    
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);
  }

  // Helper methods
  private normalizeByPosition(points: number, position: string): number {
    const positionAverages: Record<string, number> = {
      'QB': 18,
      'RB': 12,
      'WR': 10,
      'TE': 8,
      'K': 8,
      'DST': 8,
    };
    return points / (positionAverages[position] || 10);
  }

  private calculateRollingAverage(sequence: number[], currentIdx: number, window: number): number {
    const start = Math.max(0, currentIdx - window + 1);
    const values = sequence.slice(start, currentIdx + 1);
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  private calculateRollingStdDev(sequence: number[], currentIdx: number, window: number): number {
    const start = Math.max(0, currentIdx - window + 1);
    const values = sequence.slice(start, currentIdx + 1);
    if (values.length < 2) return 0;
    
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculateLocalTrend(sequence: number[], currentIdx: number): number {
    if (currentIdx < 2) return 0;
    
    const recent = sequence.slice(Math.max(0, currentIdx - 2), currentIdx + 1);
    const older = sequence.slice(Math.max(0, currentIdx - 5), currentIdx - 2);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;
    
    return olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
  }

  private calculateMomentum(sequence: number[], currentIdx: number): number {
    if (currentIdx < 1) return 0;
    
    let momentum = 0;
    const lookback = Math.min(3, currentIdx);
    
    for (let i = 0; i < lookback; i++) {
      const idx = currentIdx - i;
      if (idx > 0) {
        momentum += (sequence[idx] - sequence[idx - 1]) / (sequence[idx - 1] || 1);
      }
    }
    
    return momentum / lookback;
  }

  private detectMiniStreak(sequence: number[], currentIdx: number): number {
    if (currentIdx < 2) return 0;
    
    const avg = this.calculateRollingAverage(sequence, currentIdx, 10);
    let streak = 0;
    
    for (let i = currentIdx; i >= Math.max(0, currentIdx - 4); i--) {
      if (sequence[i] > avg * 1.1) {
        streak++;
      } else if (sequence[i] < avg * 0.9) {
        streak--;
      } else {
        break;
      }
    }
    
    return streak / 5; // Normalize
  }

  private detectVolatilityChange(sequence: number[], currentIdx: number): number {
    if (currentIdx < 6) return 0;
    
    const recentVol = this.calculateRollingStdDev(sequence, currentIdx, 3);
    const olderVol = this.calculateRollingStdDev(sequence, currentIdx - 3, 3);
    
    return olderVol > 0 ? (recentVol - olderVol) / olderVol : 0;
  }

  private identifyPatterns(
    probs: Record<string, number>,
    sequence: PlayerSequence
  ): HistoricalPattern[] {
    const patterns: HistoricalPattern[] = [];
    const threshold = 0.6;
    
    if (probs.breakout > threshold) {
      patterns.push({
        type: 'breakout',
        confidence: probs.breakout,
        timeline: this.getBreakoutTimeline(sequence),
        description: this.getBreakoutDescription(sequence),
        predictedDuration: this.predictPatternDuration('breakout', sequence),
        historicalExamples: [],
      });
    }
    
    if (probs.regression > threshold) {
      patterns.push({
        type: 'regression',
        confidence: probs.regression,
        timeline: 'Next 2-4 games',
        description: this.getRegressionDescription(sequence),
        predictedDuration: this.predictPatternDuration('regression', sequence),
        historicalExamples: [],
      });
    }
    
    if (probs.consistency > threshold) {
      patterns.push({
        type: 'consistency',
        confidence: probs.consistency,
        timeline: 'Ongoing',
        description: 'Reliable weekly performance with low variance',
        predictedDuration: 8,
        historicalExamples: [],
      });
    }
    
    if (probs.volatility > threshold) {
      patterns.push({
        type: 'volatility',
        confidence: probs.volatility,
        timeline: 'Current phase',
        description: 'High variance between games, boom-or-bust profile',
        predictedDuration: 4,
        historicalExamples: [],
      });
    }
    
    if (probs.seasonal > threshold) {
      patterns.push({
        type: 'seasonal',
        confidence: probs.seasonal,
        timeline: this.getSeasonalTimeline(sequence),
        description: this.getSeasonalDescription(sequence),
        predictedDuration: this.predictPatternDuration('seasonal', sequence),
        historicalExamples: [],
      });
    }
    
    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  private async enrichWithHistoricalMatches(
    patterns: HistoricalPattern[],
    sequence: PlayerSequence
  ): Promise<HistoricalPattern[]> {
    // In practice, this would query a historical database
    // For now, generating mock examples
    return patterns.map(pattern => ({
      ...pattern,
      historicalExamples: this.generateMockHistoricalExamples(pattern.type, sequence.position),
    }));
  }

  private generateMockHistoricalExamples(
    patternType: string,
    position: string
  ): HistoricalPattern['historicalExamples'] {
    // Mock data - in reality would be from historical database
    const examples = {
      breakout: [
        { playerId: 'player123', year: 2021, similarity: 0.85 },
        { playerId: 'player456', year: 2020, similarity: 0.78 },
      ],
      regression: [
        { playerId: 'player789', year: 2022, similarity: 0.82 },
        { playerId: 'player012', year: 2019, similarity: 0.75 },
      ],
    };
    
    return examples[patternType as keyof typeof examples] || [];
  }

  private getBreakoutTimeline(sequence: PlayerSequence): string {
    const recentAvg = this.calculateRollingAverage(sequence.pointsSequence, 19, 3);
    const seasonAvg = sequence.pointsSequence.reduce((a, b) => a + b, 0) / sequence.pointsSequence.length;
    
    if (recentAvg > seasonAvg * 1.3) {
      return 'Currently occurring';
    } else if (sequence.recentTrend > 0.5) {
      return 'Imminent (1-2 games)';
    } else {
      return 'Building (3-4 games)';
    }
  }

  private getBreakoutDescription(sequence: PlayerSequence): string {
    const factors = [];
    
    if (sequence.usageSequence[19] > sequence.usageSequence[0] * 1.2) {
      factors.push('increased usage');
    }
    if (sequence.teamChange) {
      factors.push('new team environment');
    }
    if (sequence.age < 26) {
      factors.push('natural progression');
    }
    
    return `Breakout pattern detected due to ${factors.join(', ') || 'multiple factors'}`;
  }

  private getRegressionDescription(sequence: PlayerSequence): string {
    const factors = [];
    
    if (sequence.injuryStatusSequence.slice(-3).some(s => s > 0)) {
      factors.push('injury concerns');
    }
    if (sequence.age > 30) {
      factors.push('age-related decline');
    }
    if (sequence.volatilityScore > 0.7) {
      factors.push('unsustainable hot streak');
    }
    
    return `Regression risk due to ${factors.join(', ') || 'performance indicators'}`;
  }

  private getSeasonalTimeline(sequence: PlayerSequence): string {
    const currentWeek = sequence.gamesPlayed % 17;
    
    if (currentWeek < 6) {
      return 'Early season phase';
    } else if (currentWeek < 12) {
      return 'Mid-season phase';
    } else {
      return 'Late season surge';
    }
  }

  private getSeasonalDescription(sequence: PlayerSequence): string {
    const currentWeek = sequence.gamesPlayed % 17;
    
    if (currentWeek > 12) {
      return 'Historical late-season performer';
    } else if (currentWeek < 6) {
      return 'Typically starts slow but improves';
    } else {
      return 'Mid-season consistency pattern';
    }
  }

  private predictPatternDuration(patternType: string, sequence: PlayerSequence): number {
    const baseDurations = {
      breakout: 6,
      regression: 3,
      consistency: 8,
      volatility: 4,
      seasonal: 5,
      situational: 2,
    };
    
    let duration = baseDurations[patternType as keyof typeof baseDurations] || 4;
    
    // Adjust based on player factors
    if (sequence.age < 25) duration *= 1.2;
    if (sequence.injuryStatusSequence.slice(-3).some(s => s > 0)) duration *= 0.7;
    
    return Math.round(duration);
  }

  private calculateProjectionRange(
    projection: number,
    volatility: number,
    confidence: number
  ): { low: number; high: number } {
    const variance = projection * volatility * (1 - confidence);
    return {
      low: Math.max(0, projection - variance),
      high: projection + variance,
    };
  }

  private projectRestOfSeason(
    sequence: PlayerSequence,
    patterns: HistoricalPattern[],
    trendStrength: number
  ): PatternPrediction['seasonProjection'] {
    const gamesRemaining = 17 - (sequence.gamesPlayed % 17);
    const currentAvg = sequence.pointsSequence.slice(-5).reduce((a, b) => a + b, 0) / 5;
    
    // Base projection
    let projectedPoints = currentAvg * gamesRemaining;
    
    // Adjust for patterns
    const dominantPattern = patterns[0];
    if (dominantPattern) {
      switch (dominantPattern.type) {
        case 'breakout':
          projectedPoints *= 1.15;
          break;
        case 'regression':
          projectedPoints *= 0.85;
          break;
        case 'seasonal':
          if (sequence.gamesPlayed % 17 < 10) {
            projectedPoints *= 1.1; // Expecting improvement
          }
          break;
      }
    }
    
    // Apply trend
    projectedPoints *= (1 + trendStrength * 0.1);
    
    // Peak week prediction
    const peakWeek = this.predictPeakWeek(sequence, patterns);
    
    return {
      remainingPoints: projectedPoints,
      peakWeek,
      volatilityExpected: sequence.volatilityScore,
    };
  }

  private predictPeakWeek(sequence: PlayerSequence, patterns: HistoricalPattern[]): number {
    const currentWeek = sequence.gamesPlayed % 17;
    
    // Look for seasonal pattern
    const seasonalPattern = patterns.find(p => p.type === 'seasonal');
    if (seasonalPattern) {
      return currentWeek < 12 ? 14 : 16; // Late season peak
    }
    
    // Breakout pattern suggests near-term peak
    const breakoutPattern = patterns.find(p => p.type === 'breakout');
    if (breakoutPattern) {
      return Math.min(17, currentWeek + 3);
    }
    
    // Default: steady performance
    return Math.min(17, currentWeek + Math.floor((17 - currentWeek) / 2));
  }

  private generateInsights(
    patterns: HistoricalPattern[],
    sequence: PlayerSequence,
    projection: any
  ): PatternPrediction['insights'] {
    const insights: PatternPrediction['insights'] = [];
    
    // Pattern-based insights
    for (const pattern of patterns.slice(0, 2)) {
      insights.push({
        type: 'pattern',
        message: this.getPatternInsight(pattern, sequence),
        actionable: true,
      });
    }
    
    // Projection insight
    const avgPoints = sequence.pointsSequence.reduce((a, b) => a + b, 0) / sequence.pointsSequence.length;
    if (projection.points > avgPoints * 1.2) {
      insights.push({
        type: 'projection',
        message: `Projected for ${projection.points.toFixed(1)} points, ${((projection.points / avgPoints - 1) * 100).toFixed(0)}% above season average`,
        actionable: true,
      });
    }
    
    // Risk insight
    if (sequence.volatilityScore > 0.7) {
      insights.push({
        type: 'risk',
        message: 'High volatility player - consider matchup and game script carefully',
        actionable: true,
      });
    }
    
    // Opportunity insight
    if (sequence.usageSequence[19] > sequence.usageSequence[0] * 1.3) {
      insights.push({
        type: 'opportunity',
        message: 'Usage trending up significantly - increased opportunity ahead',
        actionable: true,
      });
    }
    
    return insights;
  }

  private getPatternInsight(pattern: HistoricalPattern, sequence: PlayerSequence): string {
    const insights = {
      breakout: `Breakout pattern identified with ${(pattern.confidence * 100).toFixed(0)}% confidence - expect sustained elevated performance`,
      regression: `Regression indicators present - consider selling high or benching in tough matchups`,
      consistency: `Highly consistent performer - safe floor play for cash games`,
      volatility: `Boom-or-bust pattern - best suited for GPP tournaments`,
      seasonal: `${sequence.gamesPlayed % 17 > 12 ? 'Late season' : 'Mid-season'} performer historically`,
      situational: `Performance highly dependent on game context`,
    };
    
    return insights[pattern.type] || 'Pattern detected in historical performance';
  }

  private async calculateSequenceSimilarity(
    seq1: PlayerSequence,
    seq2: PlayerSequence
  ): Promise<number> {
    // Simple similarity based on performance sequences
    // In practice, would use more sophisticated similarity metrics
    
    let similarity = 0;
    const weights = {
      performance: 0.4,
      usage: 0.3,
      efficiency: 0.2,
      context: 0.1,
    };
    
    // Performance similarity
    similarity += weights.performance * this.compareSequences(
      seq1.pointsSequence,
      seq2.pointsSequence
    );
    
    // Usage similarity
    similarity += weights.usage * this.compareSequences(
      seq1.usageSequence,
      seq2.usageSequence
    );
    
    // Efficiency similarity
    similarity += weights.efficiency * this.compareSequences(
      seq1.efficiencySequence,
      seq2.efficiencySequence
    );
    
    // Context similarity
    const contextSim = (
      (seq1.position === seq2.position ? 1 : 0) +
      (Math.abs(seq1.age - seq2.age) < 2 ? 0.5 : 0) +
      (Math.abs(seq1.seasonNumber - seq2.seasonNumber) < 2 ? 0.5 : 0)
    ) / 2;
    similarity += weights.context * contextSim;
    
    return similarity;
  }

  private compareSequences(seq1: number[], seq2: number[]): number {
    const minLength = Math.min(seq1.length, seq2.length);
    let similarity = 0;
    
    for (let i = 0; i < minLength; i++) {
      const diff = Math.abs(seq1[i] - seq2[i]);
      const avg = (seq1[i] + seq2[i]) / 2;
      similarity += 1 - (diff / (avg || 1));
    }
    
    return similarity / minLength;
  }

  private getPlayerOutcome(historical: PlayerSequence): string {
    // Simplified outcome description
    const finalAvg = historical.pointsSequence.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const initialAvg = historical.pointsSequence.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
    
    if (finalAvg > initialAvg * 1.2) {
      return 'Successful breakout season';
    } else if (finalAvg < initialAvg * 0.8) {
      return 'Declined from early promise';
    } else {
      return 'Maintained consistent production';
    }
  }
}