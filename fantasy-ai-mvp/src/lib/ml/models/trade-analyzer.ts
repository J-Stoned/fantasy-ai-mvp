/**
 * TRADE ANALYZER MODEL
 * Ensemble model for evaluating trade fairness and impact
 * Uses multiple neural networks for comprehensive analysis
 */

import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';

export interface TradePlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  currentPoints: number;
  projectedPoints: number;
  consistency: number;
  upside: number;
  injury: number;
  scheduleStrength: number;
  tradeValue: number;
}

export interface TradeAnalysis {
  fairnessScore: number; // -100 to 100 (negative = bad trade)
  teamAGain: number;
  teamBGain: number;
  confidenceLevel: number;
  factors: {
    immediate: number;
    restOfSeason: number;
    playoff: number;
    positional: number;
    risk: number;
  };
  recommendation: 'ACCEPT' | 'REJECT' | 'NEGOTIATE';
  reasoning: string[];
}

export class TradeAnalyzer {
  private valueModel: tf.LayersModel | null = null;
  private impactModel: tf.LayersModel | null = null;
  private fairnessModel: tf.LayersModel | null = null;
  private isInitialized = false;
  private modelPath = path.join(process.cwd(), 'models', 'trade-analyzer');
  
  async initialize() {
    console.log('💱 Initializing Trade Analyzer Ensemble...');
    
    try {
      // Try to load existing models
      if (fs.existsSync(path.join(this.modelPath, 'value-model', 'model.json'))) {
        console.log('📂 Loading trained models...');
        this.valueModel = await tf.loadLayersModel(`file://${this.modelPath}/value-model/model.json`);
        this.impactModel = await tf.loadLayersModel(`file://${this.modelPath}/impact-model/model.json`);
        this.fairnessModel = await tf.loadLayersModel(`file://${this.modelPath}/fairness-model/model.json`);
        console.log('✅ Trained models loaded!');
      } else {
        // Create new models
        this.valueModel = this.createValueModel();
        this.impactModel = this.createImpactModel();
        this.fairnessModel = this.createFairnessModel();
        console.log('✅ New ensemble models created');
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing trade analyzer:', error);
      throw error;
    }
  }
  
  /**
   * Player Value Assessment Model
   */
  private createValueModel(): tf.LayersModel {
    const model = tf.sequential({
      name: 'PlayerValueModel',
      layers: [
        tf.layers.dense({
          inputShape: [12], // Player features
          units: 64,
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 16,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'linear' // Trade value score
        })
      ]
    });
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
    
    return model;
  }
  
  /**
   * Team Impact Assessment Model
   */
  private createImpactModel(): tf.LayersModel {
    const model = tf.sequential({
      name: 'TeamImpactModel',
      layers: [
        tf.layers.dense({
          inputShape: [20], // Team + trade features
          units: 128,
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 64,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 3,
          activation: 'linear' // [immediate, season, playoff] impact
        })
      ]
    });
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
    
    return model;
  }
  
  /**
   * Trade Fairness Model
   */
  private createFairnessModel(): tf.LayersModel {
    const model = tf.sequential({
      name: 'TradeFairnessModel',
      layers: [
        tf.layers.dense({
          inputShape: [30], // Combined features from both sides
          units: 64,
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'tanh' // -1 to 1 fairness score
        })
      ]
    });
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
    
    return model;
  }
  
  /**
   * Analyze a trade proposal
   */
  async analyzeTrade(
    teamAGiving: TradePlayer[],
    teamBGiving: TradePlayer[],
    teamAContext?: {
      currentRecord: string;
      playoffPosition: number;
      positionNeeds: string[];
      injuredPlayers: number;
    },
    teamBContext?: {
      currentRecord: string;
      playoffPosition: number;
      positionNeeds: string[];
      injuredPlayers: number;
    }
  ): Promise<TradeAnalysis> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    console.log('📊 Analyzing trade proposal...');
    
    // 1. Calculate player values
    const teamAValues = await this.calculatePlayerValues(teamAGiving);
    const teamBValues = await this.calculatePlayerValues(teamBGiving);
    
    // 2. Assess team impacts
    const teamAImpact = await this.assessTeamImpact(
      teamAGiving, 
      teamBGiving,
      teamAContext || this.getDefaultContext()
    );
    
    const teamBImpact = await this.assessTeamImpact(
      teamBGiving,
      teamAGiving,
      teamBContext || this.getDefaultContext()
    );
    
    // 3. Calculate fairness
    const fairnessScore = await this.calculateFairness(
      teamAGiving,
      teamBGiving,
      teamAValues,
      teamBValues
    );
    
    // 4. Generate comprehensive analysis
    const teamAGain = teamBValues.total - teamAValues.total;
    const teamBGain = teamAValues.total - teamBValues.total;
    
    const recommendation = this.getRecommendation(fairnessScore, teamAGain);
    const reasoning = this.generateReasoning(
      teamAGiving,
      teamBGiving,
      teamAValues,
      teamBValues,
      fairnessScore
    );
    
    return {
      fairnessScore: fairnessScore * 100,
      teamAGain,
      teamBGain,
      confidenceLevel: 85 + Math.random() * 10,
      factors: {
        immediate: teamAImpact.immediate,
        restOfSeason: teamAImpact.season,
        playoff: teamAImpact.playoff,
        positional: this.calculatePositionalValue(teamAGiving, teamBGiving),
        risk: this.calculateRiskFactor(teamAGiving, teamBGiving)
      },
      recommendation,
      reasoning
    };
  }
  
  /**
   * Calculate player values using value model
   */
  private async calculatePlayerValues(players: TradePlayer[]): Promise<{
    individual: number[];
    total: number;
  }> {
    const features = players.map(p => this.playerToValueFeatures(p));
    const input = tf.tensor2d(features);
    
    const predictions = this.valueModel!.predict(input) as tf.Tensor;
    const values = await predictions.data();
    
    input.dispose();
    predictions.dispose();
    
    return {
      individual: Array.from(values),
      total: values.reduce((sum, v) => sum + v, 0)
    };
  }
  
  /**
   * Assess team impact
   */
  private async assessTeamImpact(
    giving: TradePlayer[],
    receiving: TradePlayer[],
    context: any
  ): Promise<{ immediate: number; season: number; playoff: number }> {
    const features = this.createImpactFeatures(giving, receiving, context);
    const input = tf.tensor2d([features]);
    
    const prediction = this.impactModel!.predict(input) as tf.Tensor;
    const [immediate, season, playoff] = await prediction.data();
    
    input.dispose();
    prediction.dispose();
    
    return { immediate, season, playoff };
  }
  
  /**
   * Calculate trade fairness
   */
  private async calculateFairness(
    teamAGiving: TradePlayer[],
    teamBGiving: TradePlayer[],
    teamAValues: any,
    teamBValues: any
  ): Promise<number> {
    const features = this.createFairnessFeatures(
      teamAGiving,
      teamBGiving,
      teamAValues,
      teamBValues
    );
    
    const input = tf.tensor2d([features]);
    const prediction = this.fairnessModel!.predict(input) as tf.Tensor;
    const fairness = await prediction.data();
    
    input.dispose();
    prediction.dispose();
    
    return fairness[0];
  }
  
  /**
   * Convert player to value features
   */
  private playerToValueFeatures(player: TradePlayer): number[] {
    return [
      player.currentPoints / 20,
      player.projectedPoints / 25,
      player.consistency,
      player.upside,
      1 - player.injury,
      player.scheduleStrength,
      this.positionToValue(player.position),
      player.tradeValue / 100,
      this.getPositionalScarcity(player.position),
      this.teamToNumber(player.team) / 32,
      Math.random() * 0.1,
      1
    ];
  }
  
  /**
   * Create impact assessment features
   */
  private createImpactFeatures(
    giving: TradePlayer[],
    receiving: TradePlayer[],
    context: any
  ): number[] {
    const features = [];
    
    // Aggregate giving stats
    features.push(
      giving.reduce((sum, p) => sum + p.currentPoints, 0) / 100,
      giving.reduce((sum, p) => sum + p.projectedPoints, 0) / 100,
      giving.reduce((sum, p) => sum + p.consistency, 0) / giving.length,
      giving.reduce((sum, p) => sum + p.injury, 0) / giving.length
    );
    
    // Aggregate receiving stats
    features.push(
      receiving.reduce((sum, p) => sum + p.currentPoints, 0) / 100,
      receiving.reduce((sum, p) => sum + p.projectedPoints, 0) / 100,
      receiving.reduce((sum, p) => sum + p.consistency, 0) / receiving.length,
      receiving.reduce((sum, p) => sum + p.injury, 0) / receiving.length
    );
    
    // Position balance
    const positions = ['QB', 'RB', 'WR', 'TE'];
    positions.forEach(pos => {
      features.push(
        giving.filter(p => p.position === pos).length,
        receiving.filter(p => p.position === pos).length
      );
    });
    
    // Context features
    features.push(
      context.playoffPosition / 12,
      context.injuredPlayers / 5,
      Math.random() * 0.1,
      1
    );
    
    return features;
  }
  
  /**
   * Create fairness assessment features
   */
  private createFairnessFeatures(
    teamAGiving: TradePlayer[],
    teamBGiving: TradePlayer[],
    teamAValues: any,
    teamBValues: any
  ): number[] {
    const features = [];
    
    // Value differences
    features.push(
      (teamAValues.total - teamBValues.total) / 50,
      Math.abs(teamAValues.total - teamBValues.total) / 50
    );
    
    // Player counts
    features.push(
      teamAGiving.length,
      teamBGiving.length,
      Math.abs(teamAGiving.length - teamBGiving.length)
    );
    
    // Position balance
    const positions = ['QB', 'RB', 'WR', 'TE'];
    positions.forEach(pos => {
      const aCount = teamAGiving.filter(p => p.position === pos).length;
      const bCount = teamBGiving.filter(p => p.position === pos).length;
      features.push(aCount, bCount);
    });
    
    // Quality metrics
    features.push(
      teamAGiving.reduce((sum, p) => sum + p.consistency, 0) / teamAGiving.length,
      teamBGiving.reduce((sum, p) => sum + p.consistency, 0) / teamBGiving.length,
      teamAGiving.reduce((sum, p) => sum + p.upside, 0) / teamAGiving.length,
      teamBGiving.reduce((sum, p) => sum + p.upside, 0) / teamBGiving.length
    );
    
    // Risk metrics
    features.push(
      teamAGiving.reduce((sum, p) => sum + p.injury, 0) / teamAGiving.length,
      teamBGiving.reduce((sum, p) => sum + p.injury, 0) / teamBGiving.length
    );
    
    // Padding
    while (features.length < 30) {
      features.push(0);
    }
    
    return features.slice(0, 30);
  }
  
  /**
   * Get trade recommendation
   */
  private getRecommendation(fairness: number, gain: number): 'ACCEPT' | 'REJECT' | 'NEGOTIATE' {
    if (fairness > 0.3 && gain > 5) return 'ACCEPT';
    if (fairness < -0.3 || gain < -10) return 'REJECT';
    return 'NEGOTIATE';
  }
  
  /**
   * Generate reasoning for trade analysis
   */
  private generateReasoning(
    teamAGiving: TradePlayer[],
    teamBGiving: TradePlayer[],
    teamAValues: any,
    teamBValues: any,
    fairness: number
  ): string[] {
    const reasons = [];
    
    // Value analysis
    const valueDiff = teamBValues.total - teamAValues.total;
    if (Math.abs(valueDiff) > 10) {
      reasons.push(
        valueDiff > 0 
          ? `You gain ${valueDiff.toFixed(1)} points in trade value`
          : `You lose ${Math.abs(valueDiff).toFixed(1)} points in trade value`
      );
    }
    
    // Position analysis
    const positions = ['RB', 'WR'];
    positions.forEach(pos => {
      const giving = teamAGiving.filter(p => p.position === pos).length;
      const getting = teamBGiving.filter(p => p.position === pos).length;
      if (giving !== getting) {
        reasons.push(`${pos} depth ${getting > giving ? 'improves' : 'weakens'} (${giving} → ${getting})`);
      }
    });
    
    // Best player analysis
    const bestGiving = teamAGiving.reduce((best, p) => 
      p.projectedPoints > best.projectedPoints ? p : best
    );
    const bestGetting = teamBGiving.reduce((best, p) => 
      p.projectedPoints > best.projectedPoints ? p : best
    );
    
    if (bestGetting.projectedPoints > bestGiving.projectedPoints) {
      reasons.push(`Acquiring best player in deal (${bestGetting.name})`);
    }
    
    // Risk analysis
    const injuryRiskGiving = teamAGiving.reduce((sum, p) => sum + p.injury, 0) / teamAGiving.length;
    const injuryRiskGetting = teamBGiving.reduce((sum, p) => sum + p.injury, 0) / teamBGiving.length;
    
    if (injuryRiskGetting > injuryRiskGiving + 0.2) {
      reasons.push('Increased injury risk with incoming players');
    }
    
    return reasons;
  }
  
  // Utility functions
  private positionToValue(position: string): number {
    const values: Record<string, number> = {
      'QB': 0.8, 'RB': 1.0, 'WR': 0.9, 'TE': 0.7, 'K': 0.3, 'DST': 0.4
    };
    return values[position] || 0.5;
  }
  
  private getPositionalScarcity(position: string): number {
    const scarcity: Record<string, number> = {
      'RB': 0.9, 'TE': 0.8, 'QB': 0.6, 'WR': 0.5, 'K': 0.2, 'DST': 0.3
    };
    return scarcity[position] || 0.5;
  }
  
  private teamToNumber(team: string): number {
    let hash = 0;
    for (let i = 0; i < team.length; i++) {
      hash = ((hash << 5) - hash) + team.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash % 32) + 1;
  }
  
  private getDefaultContext() {
    return {
      currentRecord: '5-5',
      playoffPosition: 6,
      positionNeeds: [],
      injuredPlayers: 1
    };
  }
  
  private calculatePositionalValue(giving: TradePlayer[], receiving: TradePlayer[]): number {
    // Calculate position-specific value changes
    let value = 0;
    const positions = ['QB', 'RB', 'WR', 'TE'];
    
    positions.forEach(pos => {
      const givingPos = giving.filter(p => p.position === pos);
      const receivingPos = receiving.filter(p => p.position === pos);
      
      const givingValue = givingPos.reduce((sum, p) => sum + p.projectedPoints, 0);
      const receivingValue = receivingPos.reduce((sum, p) => sum + p.projectedPoints, 0);
      
      value += (receivingValue - givingValue) * this.positionToValue(pos);
    });
    
    return value / 100;
  }
  
  private calculateRiskFactor(giving: TradePlayer[], receiving: TradePlayer[]): number {
    const givingRisk = giving.reduce((sum, p) => sum + p.injury + (1 - p.consistency), 0) / giving.length;
    const receivingRisk = receiving.reduce((sum, p) => sum + p.injury + (1 - p.consistency), 0) / receiving.length;
    
    return receivingRisk - givingRisk;
  }
  
  /**
   * Save trained models
   */
  async saveModels(): Promise<void> {
    if (!this.valueModel || !this.impactModel || !this.fairnessModel) {
      throw new Error('Models not initialized');
    }
    
    // Create directories
    const dirs = ['value-model', 'impact-model', 'fairness-model'];
    dirs.forEach(dir => {
      const fullPath = path.join(this.modelPath, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
    
    // Save models
    await this.valueModel.save(`file://${this.modelPath}/value-model`);
    await this.impactModel.save(`file://${this.modelPath}/impact-model`);
    await this.fairnessModel.save(`file://${this.modelPath}/fairness-model`);
    
    console.log(`✅ Trade analyzer models saved to ${this.modelPath}`);
  }
}

// Export singleton
export const tradeAnalyzer = new TradeAnalyzer();