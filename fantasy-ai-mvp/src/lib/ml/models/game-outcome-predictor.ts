/**
 * GAME OUTCOME PREDICTOR MODEL
 * Neural network for predicting game outcomes and player performance
 * Considers team matchups, weather, injuries, and historical data
 */

import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';

export interface TeamStats {
  teamId: string;
  name: string;
  abbreviation: string;
  offensiveRating: number; // Points per game
  defensiveRating: number; // Points allowed per game
  pace: number; // Possessions per game
  homeRecord: string;
  awayRecord: string;
  lastGameResult: 'W' | 'L';
  restDays: number;
  injuries: number; // Key players injured
  form: number; // Last 5 games performance
}

export interface GameContext {
  gameId: string;
  homeTeam: TeamStats;
  awayTeam: TeamStats;
  venue: string;
  weather?: {
    temperature: number;
    wind: number;
    precipitation: number;
    dome: boolean;
  };
  primetime: boolean;
  divisional: boolean;
  weekNumber: number;
  season: number;
}

export interface GamePrediction {
  winner: 'HOME' | 'AWAY';
  confidence: number;
  homeScore: number;
  awayScore: number;
  totalPoints: number;
  spread: number;
  factors: {
    homeAdvantage: number;
    matchupFavorability: number;
    restAdvantage: number;
    weatherImpact: number;
    motivationFactor: number;
  };
  playerImpacts: Array<{
    playerId: string;
    name: string;
    projectedChange: number; // % change from average
    reasoning: string;
  }>;
}

export class GameOutcomePredictor {
  private outcomeModel: tf.LayersModel | null = null;
  private scoreModel: tf.LayersModel | null = null;
  private playerImpactModel: tf.LayersModel | null = null;
  private isInitialized = false;
  private modelPath = path.join(process.cwd(), 'models', 'game-outcome');
  
  async initialize() {
    console.log('🏈 Initializing Game Outcome Predictor...');
    
    try {
      // Try to load existing models
      if (fs.existsSync(path.join(this.modelPath, 'outcome-model', 'model.json'))) {
        console.log('📂 Loading trained models...');
        this.outcomeModel = await tf.loadLayersModel(`file://${this.modelPath}/outcome-model/model.json`);
        this.scoreModel = await tf.loadLayersModel(`file://${this.modelPath}/score-model/model.json`);
        this.playerImpactModel = await tf.loadLayersModel(`file://${this.modelPath}/impact-model/model.json`);
        console.log('✅ Trained models loaded!');
      } else {
        // Create new models
        this.outcomeModel = this.createOutcomeModel();
        this.scoreModel = this.createScoreModel();
        this.playerImpactModel = this.createPlayerImpactModel();
        console.log('✅ New models created');
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing game predictor:', error);
      throw error;
    }
  }
  
  /**
   * Winner prediction model
   */
  private createOutcomeModel(): tf.LayersModel {
    const model = tf.sequential({
      name: 'GameOutcomeModel',
      layers: [
        tf.layers.dense({
          inputShape: [30], // Game features
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
          units: 16,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid' // 0 = Away win, 1 = Home win
        })
      ]
    });
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
    
    return model;
  }
  
  /**
   * Score prediction model
   */
  private createScoreModel(): tf.LayersModel {
    const model = tf.sequential({
      name: 'ScorePredictionModel',
      layers: [
        tf.layers.dense({
          inputShape: [35], // Extended features
          units: 256,
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 128,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 64,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 2,
          activation: 'linear' // [homeScore, awayScore]
        })
      ]
    });
    
    model.compile({
      optimizer: tf.train.adam(0.0005),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
    
    return model;
  }
  
  /**
   * Player impact model
   */
  private createPlayerImpactModel(): tf.LayersModel {
    const model = tf.sequential({
      name: 'PlayerImpactModel',
      layers: [
        tf.layers.dense({
          inputShape: [25], // Player + game context features
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
          activation: 'tanh' // -1 to 1 (negative to positive impact)
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
   * Predict game outcome
   */
  async predictGame(
    context: GameContext,
    players?: Array<{
      id: string;
      name: string;
      team: string;
      position: string;
      averagePoints: number;
    }>
  ): Promise<GamePrediction> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    console.log(`🏈 Predicting ${context.awayTeam.abbreviation} @ ${context.homeTeam.abbreviation}...`);
    
    // 1. Predict winner
    const outcomeFeatures = this.createOutcomeFeatures(context);
    const outcomeTensor = tf.tensor2d([outcomeFeatures]);
    const winProbability = await (this.outcomeModel!.predict(outcomeTensor) as tf.Tensor).data();
    
    // 2. Predict scores
    const scoreFeatures = this.createScoreFeatures(context);
    const scoreTensor = tf.tensor2d([scoreFeatures]);
    const scores = await (this.scoreModel!.predict(scoreTensor) as tf.Tensor).data();
    
    // 3. Calculate factors
    const factors = this.calculateGameFactors(context);
    
    // 4. Predict player impacts if provided
    let playerImpacts: any[] = [];
    if (players) {
      playerImpacts = await this.predictPlayerImpacts(players, context, factors);
    }
    
    // Cleanup tensors
    outcomeTensor.dispose();
    scoreTensor.dispose();
    
    // Build prediction
    const homeWin = winProbability[0] > 0.5;
    const confidence = Math.abs(winProbability[0] - 0.5) * 200; // Convert to percentage
    
    return {
      winner: homeWin ? 'HOME' : 'AWAY',
      confidence: Math.min(95, 50 + confidence),
      homeScore: Math.round(scores[0]),
      awayScore: Math.round(scores[1]),
      totalPoints: Math.round(scores[0] + scores[1]),
      spread: Math.round(scores[1] - scores[0]),
      factors,
      playerImpacts
    };
  }
  
  /**
   * Create outcome prediction features
   */
  private createOutcomeFeatures(context: GameContext): number[] {
    const features = [
      // Team ratings
      context.homeTeam.offensiveRating / 30,
      context.homeTeam.defensiveRating / 30,
      context.awayTeam.offensiveRating / 30,
      context.awayTeam.defensiveRating / 30,
      
      // Pace and style
      context.homeTeam.pace / 100,
      context.awayTeam.pace / 100,
      
      // Form and momentum
      context.homeTeam.form,
      context.awayTeam.form,
      context.homeTeam.lastGameResult === 'W' ? 1 : 0,
      context.awayTeam.lastGameResult === 'W' ? 1 : 0,
      
      // Rest advantage
      Math.tanh(context.homeTeam.restDays / 7),
      Math.tanh(context.awayTeam.restDays / 7),
      
      // Injuries
      1 - context.homeTeam.injuries / 5,
      1 - context.awayTeam.injuries / 5,
      
      // Home advantage
      1, // Home team indicator
      this.parseRecord(context.homeTeam.homeRecord),
      this.parseRecord(context.awayTeam.awayRecord),
      
      // Game context
      context.primetime ? 1 : 0,
      context.divisional ? 1 : 0,
      context.weekNumber / 18,
      
      // Weather (if outdoor)
      context.weather && !context.weather.dome ? context.weather.temperature / 100 : 0.7,
      context.weather && !context.weather.dome ? context.weather.wind / 30 : 0,
      context.weather && !context.weather.dome ? context.weather.precipitation : 0,
      
      // Matchup specific
      (context.homeTeam.offensiveRating - context.awayTeam.defensiveRating) / 20,
      (context.awayTeam.offensiveRating - context.homeTeam.defensiveRating) / 20,
      
      // Historical (simplified)
      0.52, // Home team historical win rate
      
      // Padding
      Math.random() * 0.1,
      Math.random() * 0.1,
      Math.random() * 0.1,
      1
    ];
    
    return features;
  }
  
  /**
   * Create score prediction features
   */
  private createScoreFeatures(context: GameContext): number[] {
    // Include all outcome features
    const features = [...this.createOutcomeFeatures(context)];
    
    // Add score-specific features
    features.push(
      // Combined ratings
      (context.homeTeam.offensiveRating + context.awayTeam.offensiveRating) / 60,
      (context.homeTeam.defensiveRating + context.awayTeam.defensiveRating) / 60,
      
      // Total pace
      (context.homeTeam.pace + context.awayTeam.pace) / 200,
      
      // Scoring environment
      context.weather && !context.weather.dome && context.weather.wind > 20 ? 0.8 : 1,
      context.weekNumber > 14 ? 1.1 : 1 // Late season scoring
    );
    
    return features;
  }
  
  /**
   * Calculate game factors
   */
  private calculateGameFactors(context: GameContext): GamePrediction['factors'] {
    const homeAdvantage = 0.1 + (context.primetime ? 0.05 : 0) + 
                         (this.parseRecord(context.homeTeam.homeRecord) * 0.1);
    
    const offMatchup = (context.homeTeam.offensiveRating - context.awayTeam.defensiveRating) / 30;
    const defMatchup = (context.awayTeam.offensiveRating - context.homeTeam.defensiveRating) / 30;
    const matchupFavorability = (offMatchup - defMatchup) / 2;
    
    const restAdvantage = (context.homeTeam.restDays - context.awayTeam.restDays) / 7;
    
    let weatherImpact = 0;
    if (context.weather && !context.weather.dome) {
      if (context.weather.wind > 20) weatherImpact -= 0.1;
      if (context.weather.temperature < 32) weatherImpact -= 0.05;
      if (context.weather.precipitation > 0.5) weatherImpact -= 0.1;
    }
    
    const motivationFactor = (context.divisional ? 0.1 : 0) +
                           (context.weekNumber > 14 ? 0.15 : 0) +
                           (context.primetime ? 0.05 : 0);
    
    return {
      homeAdvantage,
      matchupFavorability,
      restAdvantage,
      weatherImpact,
      motivationFactor
    };
  }
  
  /**
   * Predict player impacts
   */
  private async predictPlayerImpacts(
    players: any[],
    context: GameContext,
    factors: any
  ): Promise<any[]> {
    const impacts = [];
    
    for (const player of players.slice(0, 10)) { // Top 10 players
      const features = this.createPlayerImpactFeatures(player, context, factors);
      const tensor = tf.tensor2d([features]);
      const impact = await (this.playerImpactModel!.predict(tensor) as tf.Tensor).data();
      tensor.dispose();
      
      const changePercent = impact[0] * 20; // -20% to +20%
      
      let reasoning = '';
      if (changePercent > 5) {
        reasoning = this.getPositiveReasoning(player, context, factors);
      } else if (changePercent < -5) {
        reasoning = this.getNegativeReasoning(player, context, factors);
      } else {
        reasoning = 'Expected to perform at season average';
      }
      
      impacts.push({
        playerId: player.id,
        name: player.name,
        projectedChange: changePercent,
        reasoning
      });
    }
    
    return impacts.sort((a, b) => Math.abs(b.projectedChange) - Math.abs(a.projectedChange));
  }
  
  /**
   * Create player impact features
   */
  private createPlayerImpactFeatures(player: any, context: GameContext, factors: any): number[] {
    const isHome = player.team === context.homeTeam.abbreviation;
    const team = isHome ? context.homeTeam : context.awayTeam;
    const opponent = isHome ? context.awayTeam : context.homeTeam;
    
    return [
      // Player base stats
      player.averagePoints / 30,
      this.positionToNumber(player.position) / 6,
      
      // Team context
      team.offensiveRating / 30,
      opponent.defensiveRating / 30,
      team.pace / 100,
      team.form,
      
      // Matchup
      (team.offensiveRating - opponent.defensiveRating) / 20,
      factors.matchupFavorability * (isHome ? 1 : -1),
      
      // Game context
      isHome ? 1 : 0,
      context.primetime ? 1 : 0,
      context.divisional ? 1 : 0,
      
      // Environmental
      factors.weatherImpact,
      team.restDays / 7,
      
      // Position-specific
      player.position === 'QB' && context.weather?.wind > 20 ? -0.2 : 0,
      player.position === 'RB' && opponent.defensiveRating < 20 ? 0.2 : 0,
      player.position === 'WR' && team.pace > 70 ? 0.1 : 0,
      
      // Injuries
      1 - team.injuries / 5,
      
      // Random factors
      Math.random() * 0.1,
      Math.random() * 0.1,
      Math.random() * 0.1,
      Math.random() * 0.1,
      Math.random() * 0.1,
      Math.random() * 0.1,
      1
    ];
  }
  
  /**
   * Get positive reasoning
   */
  private getPositiveReasoning(player: any, context: GameContext, factors: any): string {
    const reasons = [];
    
    if (factors.matchupFavorability > 0.2) {
      reasons.push('Favorable matchup against weak defense');
    }
    
    if (context.primetime && player.position === 'QB') {
      reasons.push('Thrives in primetime games');
    }
    
    if (player.team === context.homeTeam.abbreviation && factors.homeAdvantage > 0.15) {
      reasons.push('Strong home field advantage');
    }
    
    if (reasons.length === 0) {
      reasons.push('Positive game script expected');
    }
    
    return reasons[0];
  }
  
  /**
   * Get negative reasoning
   */
  private getNegativeReasoning(player: any, context: GameContext, factors: any): string {
    const reasons = [];
    
    if (factors.matchupFavorability < -0.2) {
      reasons.push('Tough matchup against elite defense');
    }
    
    if (factors.weatherImpact < -0.1) {
      reasons.push('Weather conditions may limit production');
    }
    
    if (context.awayTeam.injuries > 2) {
      reasons.push('Multiple key injuries affecting offense');
    }
    
    if (reasons.length === 0) {
      reasons.push('Difficult game environment expected');
    }
    
    return reasons[0];
  }
  
  // Utility functions
  private parseRecord(record: string): number {
    const [wins, losses] = record.split('-').map(Number);
    return wins / (wins + losses || 1);
  }
  
  private positionToNumber(position: string): number {
    const positions: Record<string, number> = {
      'QB': 1, 'RB': 2, 'WR': 3, 'TE': 4, 'K': 5, 'DST': 6
    };
    return positions[position] || 0;
  }
  
  /**
   * Save models
   */
  async saveModels(): Promise<void> {
    if (!this.outcomeModel || !this.scoreModel || !this.playerImpactModel) {
      throw new Error('Models not initialized');
    }
    
    // Create directories
    const dirs = ['outcome-model', 'score-model', 'impact-model'];
    dirs.forEach(dir => {
      const fullPath = path.join(this.modelPath, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
    
    // Save models
    await this.outcomeModel.save(`file://${this.modelPath}/outcome-model`);
    await this.scoreModel.save(`file://${this.modelPath}/score-model`);
    await this.playerImpactModel.save(`file://${this.modelPath}/impact-model`);
    
    console.log(`✅ Game predictor models saved to ${this.modelPath}`);
  }
}

// Export singleton
export const gameOutcomePredictor = new GameOutcomePredictor();