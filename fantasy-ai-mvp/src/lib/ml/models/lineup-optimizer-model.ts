/**
 * Lineup Optimization Engine
 * Uses reinforcement learning and combinatorial optimization for optimal lineups
 */

import * as tf from '@tensorflow/tfjs';
import { BaseMLModel, ModelConfig, PredictionResult } from '../base-model';

export interface PlayerProjection {
  playerId: string;
  name: string;
  position: string;
  projection: number;
  floor: number;
  ceiling: number;
  ownership?: number; // For DFS
  salary?: number; // For DFS
  confidence: number;
  injuryRisk: number;
  matchupScore: number;
}

export interface LineupConstraints {
  positions: {
    QB: number;
    RB: { min: number; max: number };
    WR: { min: number; max: number };
    TE: { min: number; max: number };
    FLEX?: { positions: string[]; count: number };
    K?: number;
    DST?: number;
  };
  salaryCap?: number; // For DFS
  maxFromTeam?: number;
  lockedPlayers?: string[];
  excludedPlayers?: string[];
  stackRules?: {
    QB_WR?: boolean;
    QB_TE?: boolean;
    RB_DST?: boolean; // Avoid
  };
}

export interface OptimizationStrategy {
  type: 'ceiling' | 'floor' | 'balanced' | 'contrarian' | 'correlation';
  riskTolerance: number; // 0-1
  correlationWeight: number;
  ownershipWeight: number; // For DFS
}

export interface OptimizedLineup {
  players: PlayerProjection[];
  totalProjection: number;
  totalFloor: number;
  totalCeiling: number;
  totalSalary?: number;
  averageOwnership?: number;
  confidenceScore: number;
  riskScore: number;
  correlationScore: number;
  alternativeLineups?: OptimizedLineup[];
}

export class LineupOptimizerModel extends BaseMLModel {
  private correlationMatrix: Map<string, Map<string, number>> = new Map();
  
  constructor() {
    super({
      name: 'lineup-optimizer',
      version: '1.0',
      inputShape: [50], // Lineup features
      outputShape: [1], // Lineup score
      batchSize: 128,
      epochs: 100,
      learningRate: 0.001,
    });
  }

  protected buildModel(): tf.LayersModel {
    const model = tf.sequential();

    // Neural network for lineup scoring
    model.add(tf.layers.dense({
      units: 128,
      inputShape: this.config.inputShape as [number],
      activation: 'relu',
      kernelInitializer: 'heNormal',
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(tf.layers.dense({
      units: 256,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.3 }));

    model.add(tf.layers.dense({
      units: 128,
      activation: 'relu',
    }));
    model.add(tf.layers.batchNormalization());

    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
    }));

    // Output layer
    model.add(tf.layers.dense({
      units: 1,
      activation: 'sigmoid',
    }));

    model.compile({
      optimizer: tf.train.adam(this.config.learningRate!),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });

    return model;
  }

  protected preprocessInput(lineup: PlayerProjection[]): tf.Tensor {
    // Extract lineup features
    const features = [
      // Projection statistics
      this.calculateMean(lineup.map(p => p.projection)),
      this.calculateStdDev(lineup.map(p => p.projection)),
      this.calculateSum(lineup.map(p => p.projection)),
      
      // Floor/Ceiling analysis
      this.calculateSum(lineup.map(p => p.floor)),
      this.calculateSum(lineup.map(p => p.ceiling)),
      this.calculateMean(lineup.map(p => p.ceiling - p.floor)),
      
      // Risk metrics
      this.calculateMean(lineup.map(p => p.confidence)),
      this.calculateMean(lineup.map(p => p.injuryRisk)),
      this.calculateMean(lineup.map(p => p.matchupScore)),
      
      // Position distribution
      ...this.getPositionDistribution(lineup),
      
      // Team diversity
      this.calculateTeamDiversity(lineup),
      
      // Correlation score
      this.calculateLineupCorrelation(lineup),
      
      // Ownership (for DFS)
      this.calculateMean(lineup.map(p => p.ownership || 0)),
      this.calculateStdDev(lineup.map(p => p.ownership || 0)),
      
      // Salary efficiency (for DFS)
      this.calculateSalaryEfficiency(lineup),
      
      // Additional features (pad to 50)
      ...Array(26).fill(0),
    ];
    
    return tf.tensor2d([features.slice(0, 50)]);
  }

  protected postprocessOutput(output: tf.Tensor): PredictionResult {
    const score = (output.arraySync() as number[][])[0][0];
    
    return {
      prediction: score,
      confidence: score, // Score itself represents confidence
      metadata: {
        lineupScore: score,
        recommendation: this.getLineupRecommendation(score),
      },
    };
  }

  /**
   * Optimize lineup using genetic algorithm with neural network scoring
   */
  async optimizeLineup(
    players: PlayerProjection[],
    constraints: LineupConstraints,
    strategy: OptimizationStrategy
  ): Promise<OptimizedLineup> {
    // Initialize correlation matrix
    this.buildCorrelationMatrix(players);
    
    // Generate initial population
    let population = this.generateInitialPopulation(players, constraints, 100);
    
    // Genetic algorithm optimization
    for (let generation = 0; generation < 50; generation++) {
      // Score all lineups
      const scoredLineups = await this.scorePopulation(population, strategy);
      
      // Select best lineups
      const elite = this.selectElite(scoredLineups, 20);
      
      // Create next generation
      population = [
        ...elite.map(sl => sl.lineup),
        ...this.crossoverAndMutate(elite.map(sl => sl.lineup), constraints, players, 80),
      ];
    }
    
    // Final scoring and selection
    const finalScored = await this.scorePopulation(population, strategy);
    const best = this.selectElite(finalScored, 5);
    
    // Build optimized lineup result
    const optimal = best[0];
    return {
      players: optimal.lineup,
      totalProjection: this.calculateSum(optimal.lineup.map(p => p.projection)),
      totalFloor: this.calculateSum(optimal.lineup.map(p => p.floor)),
      totalCeiling: this.calculateSum(optimal.lineup.map(p => p.ceiling)),
      totalSalary: constraints.salaryCap ? 
        this.calculateSum(optimal.lineup.map(p => p.salary || 0)) : undefined,
      averageOwnership: this.calculateMean(optimal.lineup.map(p => p.ownership || 0)),
      confidenceScore: optimal.score,
      riskScore: this.calculateLineupRisk(optimal.lineup),
      correlationScore: this.calculateLineupCorrelation(optimal.lineup),
      alternativeLineups: best.slice(1).map(sl => ({
        players: sl.lineup,
        totalProjection: this.calculateSum(sl.lineup.map(p => p.projection)),
        totalFloor: this.calculateSum(sl.lineup.map(p => p.floor)),
        totalCeiling: this.calculateSum(sl.lineup.map(p => p.ceiling)),
        totalSalary: constraints.salaryCap ? 
          this.calculateSum(sl.lineup.map(p => p.salary || 0)) : undefined,
        averageOwnership: this.calculateMean(sl.lineup.map(p => p.ownership || 0)),
        confidenceScore: sl.score,
        riskScore: this.calculateLineupRisk(sl.lineup),
        correlationScore: this.calculateLineupCorrelation(sl.lineup),
      })),
    };
  }

  /**
   * Multi-lineup optimization for DFS
   */
  async optimizeMultipleLineups(
    players: PlayerProjection[],
    constraints: LineupConstraints,
    strategy: OptimizationStrategy,
    count: number,
    diversityRequirement: number = 0.3
  ): Promise<OptimizedLineup[]> {
    const lineups: OptimizedLineup[] = [];
    const usedPlayers = new Set<string>();
    
    for (let i = 0; i < count; i++) {
      // Adjust player pool based on diversity requirement
      const adjustedPlayers = players.map(p => ({
        ...p,
        projection: p.projection * (usedPlayers.has(p.playerId) ? 
          (1 - diversityRequirement) : 1),
      }));
      
      // Optimize lineup
      const lineup = await this.optimizeLineup(adjustedPlayers, constraints, strategy);
      lineups.push(lineup);
      
      // Track used players
      lineup.players.forEach(p => usedPlayers.add(p.playerId));
    }
    
    return lineups;
  }

  // Helper methods
  private generateInitialPopulation(
    players: PlayerProjection[],
    constraints: LineupConstraints,
    size: number
  ): PlayerProjection[][] {
    const population: PlayerProjection[][] = [];
    
    for (let i = 0; i < size; i++) {
      const lineup = this.generateValidLineup(players, constraints);
      if (lineup) {
        population.push(lineup);
      }
    }
    
    return population;
  }

  private generateValidLineup(
    players: PlayerProjection[],
    constraints: LineupConstraints
  ): PlayerProjection[] | null {
    const lineup: PlayerProjection[] = [];
    const usedPlayers = new Set<string>();
    
    // Handle locked players first
    if (constraints.lockedPlayers) {
      for (const playerId of constraints.lockedPlayers) {
        const player = players.find(p => p.playerId === playerId);
        if (player) {
          lineup.push(player);
          usedPlayers.add(playerId);
        }
      }
    }
    
    // Fill required positions
    const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];
    
    for (const pos of positions) {
      const requirement = constraints.positions[pos as keyof typeof constraints.positions];
      if (!requirement) continue;
      
      const count = typeof requirement === 'number' ? requirement : requirement.min;
      const eligible = players.filter(p => 
        p.position === pos && 
        !usedPlayers.has(p.playerId) &&
        !constraints.excludedPlayers?.includes(p.playerId)
      );
      
      // Random selection with bias towards better projections
      const selected = this.weightedRandomSelection(eligible, count);
      selected.forEach(p => {
        lineup.push(p);
        usedPlayers.add(p.playerId);
      });
    }
    
    // Handle FLEX positions
    if (constraints.positions.FLEX) {
      const flexEligible = players.filter(p => 
        constraints.positions.FLEX!.positions.includes(p.position) &&
        !usedPlayers.has(p.playerId) &&
        !constraints.excludedPlayers?.includes(p.playerId)
      );
      
      const flexSelected = this.weightedRandomSelection(
        flexEligible, 
        constraints.positions.FLEX.count
      );
      flexSelected.forEach(p => {
        lineup.push(p);
        usedPlayers.add(p.playerId);
      });
    }
    
    // Validate constraints
    if (constraints.salaryCap) {
      const totalSalary = this.calculateSum(lineup.map(p => p.salary || 0));
      if (totalSalary > constraints.salaryCap) {
        return this.optimizeSalary(lineup, players, constraints, usedPlayers);
      }
    }
    
    return lineup;
  }

  private weightedRandomSelection(
    players: PlayerProjection[],
    count: number
  ): PlayerProjection[] {
    if (players.length <= count) return players;
    
    const selected: PlayerProjection[] = [];
    const available = [...players];
    
    for (let i = 0; i < count; i++) {
      // Calculate weights based on projection
      const weights = available.map(p => Math.pow(p.projection, 2));
      const totalWeight = this.calculateSum(weights);
      
      // Random selection
      let random = Math.random() * totalWeight;
      let idx = 0;
      
      for (let j = 0; j < weights.length; j++) {
        random -= weights[j];
        if (random <= 0) {
          idx = j;
          break;
        }
      }
      
      selected.push(available[idx]);
      available.splice(idx, 1);
    }
    
    return selected;
  }

  private optimizeSalary(
    lineup: PlayerProjection[],
    allPlayers: PlayerProjection[],
    constraints: LineupConstraints,
    usedPlayers: Set<string>
  ): PlayerProjection[] | null {
    if (!constraints.salaryCap) return lineup;
    
    // Sort by value (projection per dollar)
    const lineupWithValue = lineup.map(p => ({
      player: p,
      value: p.projection / (p.salary || 1),
    })).sort((a, b) => a.value - b.value);
    
    let currentSalary = this.calculateSum(lineup.map(p => p.salary || 0));
    
    // Replace low-value players
    for (const item of lineupWithValue) {
      if (currentSalary <= constraints.salaryCap) break;
      
      const position = item.player.position;
      const cheaper = allPlayers.filter(p => 
        p.position === position &&
        !usedPlayers.has(p.playerId) &&
        (p.salary || 0) < (item.player.salary || 0) &&
        !constraints.excludedPlayers?.includes(p.playerId)
      ).sort((a, b) => b.projection - a.projection);
      
      if (cheaper.length > 0) {
        const replacement = cheaper[0];
        const savingsNeeded = currentSalary - constraints.salaryCap;
        const savings = (item.player.salary || 0) - (replacement.salary || 0);
        
        if (savings >= savingsNeeded * 0.5) {
          // Replace player
          const idx = lineup.findIndex(p => p.playerId === item.player.playerId);
          lineup[idx] = replacement;
          currentSalary -= savings;
          usedPlayers.delete(item.player.playerId);
          usedPlayers.add(replacement.playerId);
        }
      }
    }
    
    return currentSalary <= constraints.salaryCap ? lineup : null;
  }

  private async scorePopulation(
    population: PlayerProjection[][],
    strategy: OptimizationStrategy
  ): Promise<{ lineup: PlayerProjection[]; score: number }[]> {
    const scored = await Promise.all(
      population.map(async (lineup) => {
        const nnScore = await this.scoreLineup(lineup);
        const strategyScore = this.applyStrategy(lineup, strategy);
        const finalScore = nnScore * 0.5 + strategyScore * 0.5;
        
        return { lineup, score: finalScore };
      })
    );
    
    return scored.sort((a, b) => b.score - a.score);
  }

  private async scoreLineup(lineup: PlayerProjection[]): Promise<number> {
    const result = await this.predict(lineup);
    return result.prediction as number;
  }

  private applyStrategy(
    lineup: PlayerProjection[],
    strategy: OptimizationStrategy
  ): number {
    let score = 0;
    
    switch (strategy.type) {
      case 'ceiling':
        score = this.calculateSum(lineup.map(p => p.ceiling)) / 300;
        break;
        
      case 'floor':
        score = this.calculateSum(lineup.map(p => p.floor)) / 200;
        break;
        
      case 'balanced':
        const proj = this.calculateSum(lineup.map(p => p.projection));
        const floor = this.calculateSum(lineup.map(p => p.floor));
        const ceiling = this.calculateSum(lineup.map(p => p.ceiling));
        score = (proj / 250 + floor / 200 + ceiling / 300) / 3;
        break;
        
      case 'contrarian':
        const ownership = this.calculateMean(lineup.map(p => p.ownership || 0));
        const projection = this.calculateSum(lineup.map(p => p.projection));
        score = (projection / 250) * (1 - ownership);
        break;
        
      case 'correlation':
        const correlation = this.calculateLineupCorrelation(lineup);
        const proj2 = this.calculateSum(lineup.map(p => p.projection));
        score = (proj2 / 250) * (0.7 + correlation * 0.3);
        break;
    }
    
    // Apply risk tolerance
    const risk = this.calculateLineupRisk(lineup);
    score *= (1 - risk * (1 - strategy.riskTolerance));
    
    // Apply correlation weight
    if (strategy.correlationWeight > 0) {
      const correlation = this.calculateLineupCorrelation(lineup);
      score *= (1 + correlation * strategy.correlationWeight);
    }
    
    // Apply ownership weight (for DFS)
    if (strategy.ownershipWeight > 0) {
      const ownership = this.calculateMean(lineup.map(p => p.ownership || 0));
      score *= (1 - ownership * strategy.ownershipWeight);
    }
    
    return Math.min(1, score);
  }

  private selectElite(
    scored: { lineup: PlayerProjection[]; score: number }[],
    count: number
  ): { lineup: PlayerProjection[]; score: number }[] {
    return scored.slice(0, count);
  }

  private crossoverAndMutate(
    eliteLineups: PlayerProjection[][],
    constraints: LineupConstraints,
    allPlayers: PlayerProjection[],
    count: number
  ): PlayerProjection[][] {
    const offspring: PlayerProjection[][] = [];
    
    for (let i = 0; i < count; i++) {
      // Select two parents
      const parent1 = eliteLineups[Math.floor(Math.random() * eliteLineups.length)];
      const parent2 = eliteLineups[Math.floor(Math.random() * eliteLineups.length)];
      
      // Crossover
      const child = this.crossover(parent1, parent2, constraints, allPlayers);
      
      // Mutation
      if (Math.random() < 0.1) {
        this.mutate(child, constraints, allPlayers);
      }
      
      offspring.push(child);
    }
    
    return offspring;
  }

  private crossover(
    parent1: PlayerProjection[],
    parent2: PlayerProjection[],
    constraints: LineupConstraints,
    allPlayers: PlayerProjection[]
  ): PlayerProjection[] {
    const child: PlayerProjection[] = [];
    const usedPlayers = new Set<string>();
    
    // Random crossover point
    const crossoverPoint = Math.floor(parent1.length / 2);
    
    // Take first half from parent1
    for (let i = 0; i < crossoverPoint; i++) {
      if (!usedPlayers.has(parent1[i].playerId)) {
        child.push(parent1[i]);
        usedPlayers.add(parent1[i].playerId);
      }
    }
    
    // Fill rest from parent2
    for (const player of parent2) {
      if (!usedPlayers.has(player.playerId)) {
        child.push(player);
        usedPlayers.add(player.playerId);
      }
    }
    
    // Ensure valid lineup
    return this.repairLineup(child, constraints, allPlayers) || child;
  }

  private mutate(
    lineup: PlayerProjection[],
    constraints: LineupConstraints,
    allPlayers: PlayerProjection[]
  ): void {
    // Random mutation: swap one player
    const idx = Math.floor(Math.random() * lineup.length);
    const player = lineup[idx];
    
    const alternatives = allPlayers.filter(p => 
      p.position === player.position &&
      p.playerId !== player.playerId &&
      !lineup.some(lp => lp.playerId === p.playerId) &&
      !constraints.excludedPlayers?.includes(p.playerId)
    );
    
    if (alternatives.length > 0) {
      lineup[idx] = alternatives[Math.floor(Math.random() * alternatives.length)];
    }
  }

  private repairLineup(
    lineup: PlayerProjection[],
    constraints: LineupConstraints,
    allPlayers: PlayerProjection[]
  ): PlayerProjection[] | null {
    // This would implement constraint satisfaction repair
    // For brevity, returning null if invalid
    return null;
  }

  private buildCorrelationMatrix(players: PlayerProjection[]): void {
    // In practice, this would load historical correlation data
    // For now, using simple team-based correlations
    this.correlationMatrix.clear();
    
    for (const p1 of players) {
      if (!this.correlationMatrix.has(p1.playerId)) {
        this.correlationMatrix.set(p1.playerId, new Map());
      }
      
      for (const p2 of players) {
        if (p1.playerId !== p2.playerId) {
          // Simple correlation based on same team
          const correlation = this.calculatePlayerCorrelation(p1, p2);
          this.correlationMatrix.get(p1.playerId)!.set(p2.playerId, correlation);
        }
      }
    }
  }

  private calculatePlayerCorrelation(p1: PlayerProjection, p2: PlayerProjection): number {
    // Simplified correlation logic
    // In practice, would use historical performance correlation
    
    // Same team positive correlation for certain position combos
    if (p1.name.split(' ').pop() === p2.name.split(' ').pop()) { // Same team (simplified)
      if (p1.position === 'QB' && (p2.position === 'WR' || p2.position === 'TE')) {
        return 0.6;
      }
      if (p1.position === 'RB' && p2.position === 'DST') {
        return -0.3; // Negative correlation
      }
    }
    
    return 0;
  }

  private calculateLineupCorrelation(lineup: PlayerProjection[]): number {
    let totalCorrelation = 0;
    let pairs = 0;
    
    for (let i = 0; i < lineup.length; i++) {
      for (let j = i + 1; j < lineup.length; j++) {
        const correlation = this.correlationMatrix
          .get(lineup[i].playerId)
          ?.get(lineup[j].playerId) || 0;
        totalCorrelation += correlation;
        pairs++;
      }
    }
    
    return pairs > 0 ? totalCorrelation / pairs : 0;
  }

  private calculateLineupRisk(lineup: PlayerProjection[]): number {
    const injuryRisk = this.calculateMean(lineup.map(p => p.injuryRisk));
    const confidenceRisk = 1 - this.calculateMean(lineup.map(p => p.confidence));
    const varianceRisk = this.calculateStdDev(lineup.map(p => p.projection)) / 
      this.calculateMean(lineup.map(p => p.projection));
    
    return (injuryRisk * 0.4 + confidenceRisk * 0.3 + varianceRisk * 0.3);
  }

  private getPositionDistribution(lineup: PlayerProjection[]): number[] {
    const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];
    const counts = positions.map(pos => 
      lineup.filter(p => p.position === pos).length / lineup.length
    );
    return counts;
  }

  private calculateTeamDiversity(lineup: PlayerProjection[]): number {
    const teams = new Set(lineup.map(p => p.name.split(' ').pop())); // Simplified
    return teams.size / lineup.length;
  }

  private calculateSalaryEfficiency(lineup: PlayerProjection[]): number {
    if (!lineup[0]?.salary) return 0;
    
    const totalProjection = this.calculateSum(lineup.map(p => p.projection));
    const totalSalary = this.calculateSum(lineup.map(p => p.salary || 0));
    
    return totalSalary > 0 ? totalProjection / totalSalary : 0;
  }

  private getLineupRecommendation(score: number): string {
    if (score > 0.8) return 'Excellent lineup with high win probability';
    if (score > 0.6) return 'Strong lineup with good balance';
    if (score > 0.4) return 'Average lineup - consider alternatives';
    return 'Suboptimal lineup - review player selections';
  }

  // Statistical helpers
  private calculateSum(values: number[]): number {
    return values.reduce((a, b) => a + b, 0);
  }

  private calculateMean(values: number[]): number {
    return values.length > 0 ? this.calculateSum(values) / values.length : 0;
  }

  private calculateStdDev(values: number[]): number {
    const mean = this.calculateMean(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
}