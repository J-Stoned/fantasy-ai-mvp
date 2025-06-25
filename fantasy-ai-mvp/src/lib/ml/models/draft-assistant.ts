/**
 * DRAFT ASSISTANT MODEL
 * LSTM-based model for draft pick recommendations
 * Predicts optimal picks based on draft position and available players
 */

import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';

export interface DraftContext {
  round: number;
  pick: number;
  draftPosition: number;
  totalTeams: number;
  scoringFormat: 'STANDARD' | 'PPR' | 'HALF_PPR';
  rosterRequirements: Record<string, number>;
}

export interface DraftedPlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  adp: number; // Average Draft Position
  round: number;
  pick: number;
}

export interface AvailablePlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  adp: number;
  projectedPoints: number;
  tier: number;
  upside: number;
  consistency: number;
  injury: number;
  bye: number;
}

export interface DraftRecommendation {
  player: AvailablePlayer;
  score: number;
  confidence: number;
  reasoning: string[];
  alternates: Array<{
    player: AvailablePlayer;
    score: number;
  }>;
}

export class DraftAssistant {
  private model: tf.LayersModel | null = null;
  private adpModel: tf.LayersModel | null = null;
  private isInitialized = false;
  private modelPath = path.join(process.cwd(), 'models', 'draft-assistant');
  
  async initialize() {
    console.log('📝 Initializing Draft Assistant LSTM...');
    
    try {
      // Try to load existing models
      if (fs.existsSync(path.join(this.modelPath, 'model.json'))) {
        console.log('📂 Loading trained models...');
        this.model = await tf.loadLayersModel(`file://${this.modelPath}/model.json`);
        this.adpModel = await tf.loadLayersModel(`file://${this.modelPath}/adp-model.json`);
        console.log('✅ Trained models loaded!');
      } else {
        // Create new models
        this.model = this.createPickModel();
        this.adpModel = this.createADPModel();
        console.log('✅ New models created');
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing draft assistant:', error);
      throw error;
    }
  }
  
  /**
   * Main draft pick recommendation model
   */
  private createPickModel(): tf.LayersModel {
    const model = tf.sequential({
      name: 'DraftPickModel',
      layers: [
        // LSTM for draft sequence understanding
        tf.layers.lstm({
          units: 128,
          returnSequences: true,
          inputShape: [10, 15], // Last 10 picks, 15 features each
          kernelInitializer: 'glorotNormal',
          recurrentInitializer: 'orthogonal',
          dropout: 0.2,
          recurrentDropout: 0.2
        }),
        tf.layers.lstm({
          units: 64,
          returnSequences: false,
          kernelInitializer: 'glorotNormal',
          recurrentInitializer: 'orthogonal',
          dropout: 0.2
        }),
        // Dense layers for final prediction
        tf.layers.dense({
          units: 128,
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 64,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        // Output: score for each position type
        tf.layers.dense({
          units: 6, // QB, RB, WR, TE, K, DST
          activation: 'softmax'
        })
      ]
    });
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
    
    return model;
  }
  
  /**
   * ADP prediction model
   */
  private createADPModel(): tf.LayersModel {
    const model = tf.sequential({
      name: 'ADPPredictionModel',
      layers: [
        tf.layers.dense({
          inputShape: [20], // Player features
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
          activation: 'linear' // Predict ADP value
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
   * Get draft recommendations
   */
  async recommendPick(
    context: DraftContext,
    draftedPlayers: DraftedPlayer[],
    availablePlayers: AvailablePlayer[],
    myRoster: DraftedPlayer[]
  ): Promise<DraftRecommendation[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    console.log(`📊 Analyzing round ${context.round}, pick ${context.pick}...`);
    
    // 1. Prepare draft sequence for LSTM
    const draftSequence = this.prepareDraftSequence(draftedPlayers, context);
    
    // 2. Get position needs
    const positionNeeds = this.analyzePositionNeeds(myRoster, context);
    
    // 3. Score each available player
    const scoredPlayers = await this.scoreAvailablePlayers(
      availablePlayers,
      draftSequence,
      positionNeeds,
      context
    );
    
    // 4. Apply draft strategy adjustments
    const adjustedScores = this.applyStrategyAdjustments(
      scoredPlayers,
      context,
      myRoster
    );
    
    // 5. Sort and create recommendations
    const topPlayers = adjustedScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    return topPlayers.map((scored, idx) => ({
      player: scored.player,
      score: scored.score,
      confidence: this.calculateConfidence(scored, idx, context),
      reasoning: this.generateReasoning(scored.player, context, myRoster, positionNeeds),
      alternates: topPlayers
        .filter((_, i) => i !== idx)
        .slice(0, 3)
        .map(alt => ({
          player: alt.player,
          score: alt.score
        }))
    }));
  }
  
  /**
   * Prepare draft sequence for LSTM
   */
  private prepareDraftSequence(
    draftedPlayers: DraftedPlayer[],
    context: DraftContext
  ): number[][] {
    // Get last 10 picks
    const recentPicks = draftedPlayers.slice(-10);
    const sequence: number[][] = [];
    
    // Pad if needed
    while (sequence.length + recentPicks.length < 10) {
      sequence.push(new Array(15).fill(0));
    }
    
    // Convert picks to features
    recentPicks.forEach(pick => {
      sequence.push([
        pick.round / 20,
        pick.pick / 200,
        this.positionToNumber(pick.position) / 6,
        pick.adp / 200,
        (pick.pick - pick.adp) / 50, // Reach/value
        this.teamToNumber(pick.team) / 32,
        // Position counts at time of pick
        ...this.getPositionCounts(draftedPlayers, pick.pick),
        Math.random() * 0.1,
        1
      ]);
    });
    
    return sequence;
  }
  
  /**
   * Analyze position needs
   */
  private analyzePositionNeeds(
    myRoster: DraftedPlayer[],
    context: DraftContext
  ): Record<string, number> {
    const filled: Record<string, number> = {};
    const needs: Record<string, number> = {};
    
    // Count filled positions
    myRoster.forEach(player => {
      filled[player.position] = (filled[player.position] || 0) + 1;
    });
    
    // Calculate needs
    Object.entries(context.rosterRequirements).forEach(([pos, required]) => {
      const have = filled[pos] || 0;
      needs[pos] = Math.max(0, required - have) / required;
    });
    
    // Adjust for draft stage
    const draftProgress = context.round / 16;
    
    // Early rounds: focus on RB/WR
    if (draftProgress < 0.25) {
      needs['RB'] = Math.min(1, needs['RB'] * 1.5);
      needs['WR'] = Math.min(1, needs['WR'] * 1.3);
    }
    
    // Middle rounds: balanced
    else if (draftProgress < 0.75) {
      // Keep as is
    }
    
    // Late rounds: fill gaps
    else {
      Object.keys(needs).forEach(pos => {
        if (needs[pos] > 0) needs[pos] = Math.min(1, needs[pos] * 1.5);
      });
    }
    
    return needs;
  }
  
  /**
   * Score available players
   */
  private async scoreAvailablePlayers(
    availablePlayers: AvailablePlayer[],
    draftSequence: number[][],
    positionNeeds: Record<string, number>,
    context: DraftContext
  ): Promise<Array<{ player: AvailablePlayer; score: number; features: any }>> {
    const sequenceTensor = tf.tensor3d([draftSequence]);
    
    // Get position preferences from LSTM
    const positionPrediction = this.model!.predict(sequenceTensor) as tf.Tensor;
    const positionScores = await positionPrediction.data();
    
    sequenceTensor.dispose();
    positionPrediction.dispose();
    
    // Score each player
    const scores = await Promise.all(
      availablePlayers.map(async player => {
        // Base score from projections
        let score = player.projectedPoints / 20;
        
        // Position preference from model
        const posIdx = this.positionToNumber(player.position) - 1;
        score *= (1 + positionScores[posIdx]);
        
        // Position need multiplier
        score *= (1 + (positionNeeds[player.position] || 0));
        
        // ADP value
        const expectedPick = context.round * context.totalTeams + context.pick;
        const adpValue = player.adp - expectedPick;
        
        if (adpValue > 20) {
          score *= 1.3; // Great value
        } else if (adpValue > 10) {
          score *= 1.15; // Good value
        } else if (adpValue < -20) {
          score *= 0.7; // Big reach
        }
        
        // Tier considerations
        score *= (1 + (6 - player.tier) * 0.1);
        
        // Risk adjustments
        score *= (1 - player.injury * 0.5);
        score *= (0.5 + player.consistency * 0.5);
        
        // Upside bonus in early rounds
        if (context.round <= 5) {
          score *= (1 + player.upside * 0.2);
        }
        
        return {
          player,
          score,
          features: {
            positionScore: positionScores[posIdx],
            needScore: positionNeeds[player.position] || 0,
            adpValue
          }
        };
      })
    );
    
    return scores;
  }
  
  /**
   * Apply draft strategy adjustments
   */
  private applyStrategyAdjustments(
    scoredPlayers: Array<{ player: AvailablePlayer; score: number; features: any }>,
    context: DraftContext,
    myRoster: DraftedPlayer[]
  ): Array<{ player: AvailablePlayer; score: number; features: any }> {
    return scoredPlayers.map(scored => {
      let adjustedScore = scored.score;
      
      // Zero RB strategy
      if (context.round <= 5 && myRoster.filter(p => p.position === 'RB').length === 0) {
        if (scored.player.position === 'WR') {
          adjustedScore *= 1.1;
        }
      }
      
      // Avoid same bye weeks
      const byeWeeks = myRoster.map(p => p.bye || 0);
      if (byeWeeks.includes(scored.player.bye)) {
        adjustedScore *= 0.95;
      }
      
      // Stack QB with pass catchers
      const myQB = myRoster.find(p => p.position === 'QB');
      if (myQB && scored.player.team === myQB.team && 
          ['WR', 'TE'].includes(scored.player.position)) {
        adjustedScore *= 1.1;
      }
      
      // Late round fliers
      if (context.round >= 13) {
        adjustedScore *= (1 + scored.player.upside * 0.3);
      }
      
      return {
        ...scored,
        score: adjustedScore
      };
    });
  }
  
  /**
   * Calculate confidence level
   */
  private calculateConfidence(
    scored: any,
    rank: number,
    context: DraftContext
  ): number {
    let confidence = 85;
    
    // Higher confidence for clear best picks
    if (rank === 0) {
      confidence += scored.features.adpValue / 10;
    }
    
    // Lower confidence in middle rounds
    if (context.round >= 6 && context.round <= 10) {
      confidence -= 5;
    }
    
    // Adjust for position scarcity
    if (scored.features.needScore > 0.7) {
      confidence += 5;
    }
    
    return Math.min(95, Math.max(70, confidence));
  }
  
  /**
   * Generate reasoning for recommendation
   */
  private generateReasoning(
    player: AvailablePlayer,
    context: DraftContext,
    myRoster: DraftedPlayer[],
    positionNeeds: Record<string, number>
  ): string[] {
    const reasons: string[] = [];
    
    // Value reasoning
    const expectedPick = context.round * context.totalTeams + context.pick;
    const adpDiff = player.adp - expectedPick;
    
    if (adpDiff > 15) {
      reasons.push(`Excellent value - ADP ${player.adp} at pick ${expectedPick}`);
    } else if (adpDiff > 5) {
      reasons.push(`Good value pick based on ADP`);
    }
    
    // Position need
    if (positionNeeds[player.position] > 0.5) {
      reasons.push(`Fills critical need at ${player.position}`);
    }
    
    // Tier reasoning
    if (player.tier <= 3) {
      reasons.push(`Elite tier ${player.tier} player at position`);
    }
    
    // Upside/consistency
    if (player.upside > 0.8) {
      reasons.push('High upside player with league-winning potential');
    } else if (player.consistency > 0.8) {
      reasons.push('Consistent floor player for stable production');
    }
    
    // Stack potential
    const myQB = myRoster.find(p => p.position === 'QB');
    if (myQB && player.team === myQB.team && ['WR', 'TE'].includes(player.position)) {
      reasons.push(`Stacks with your QB ${myQB.name}`);
    }
    
    // Competition/situation
    if (player.position === 'RB' && reasons.length < 3) {
      reasons.push('Clear lead back with minimal competition');
    }
    
    return reasons;
  }
  
  // Utility functions
  private positionToNumber(position: string): number {
    const positions: Record<string, number> = {
      'QB': 1, 'RB': 2, 'WR': 3, 'TE': 4, 'K': 5, 'DST': 6
    };
    return positions[position] || 0;
  }
  
  private teamToNumber(team: string): number {
    let hash = 0;
    for (let i = 0; i < team.length; i++) {
      hash = ((hash << 5) - hash) + team.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash % 32) + 1;
  }
  
  private getPositionCounts(drafted: DraftedPlayer[], upToPick: number): number[] {
    const relevant = drafted.filter(p => p.pick <= upToPick);
    const counts = [0, 0, 0, 0, 0, 0]; // QB, RB, WR, TE, K, DST
    
    relevant.forEach(p => {
      const idx = this.positionToNumber(p.position) - 1;
      if (idx >= 0 && idx < 6) counts[idx]++;
    });
    
    // Normalize
    return counts.map(c => c / Math.max(1, relevant.length));
  }
  
  /**
   * Save models
   */
  async saveModels(): Promise<void> {
    if (!this.model || !this.adpModel) {
      throw new Error('Models not initialized');
    }
    
    if (!fs.existsSync(this.modelPath)) {
      fs.mkdirSync(this.modelPath, { recursive: true });
    }
    
    await this.model.save(`file://${this.modelPath}`);
    await this.adpModel.save(`file://${this.modelPath}/adp-model`);
    
    console.log(`✅ Draft assistant models saved to ${this.modelPath}`);
  }
}

// Export singleton
export const draftAssistant = new DraftAssistant();