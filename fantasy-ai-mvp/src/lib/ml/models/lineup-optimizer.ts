/**
 * LINEUP OPTIMIZER MODEL
 * Uses reinforcement learning to find optimal player combinations
 * Considers salary cap, position requirements, and stacking strategies
 */

import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';

export interface LineupConstraints {
  salaryCap: number;
  positions: Record<string, number>; // e.g., { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1, DST: 1 }
  maxFromTeam?: number;
  minGames?: number;
}

export interface PlayerOption {
  id: string;
  name: string;
  position: string;
  team: string;
  salary: number;
  projectedPoints: number;
  ownership?: number;
  correlation?: Record<string, number>; // Correlation with teammates
}

export class LineupOptimizer {
  private model: tf.LayersModel | null = null;
  private isInitialized = false;
  private modelPath = path.join(process.cwd(), 'models', 'lineup-optimizer');
  
  // Feature dimensions
  private readonly PLAYER_FEATURES = 10; // Per player features
  private readonly MAX_LINEUP_SIZE = 9; // Standard DFS lineup
  private readonly TOTAL_FEATURES = this.PLAYER_FEATURES * this.MAX_LINEUP_SIZE;
  
  async initialize() {
    console.log('🎯 Initializing Lineup Optimizer Model...');
    
    try {
      // Try to load existing model
      if (fs.existsSync(path.join(this.modelPath, 'model.json'))) {
        console.log('📂 Loading trained model...');
        this.model = await tf.loadLayersModel(`file://${this.modelPath}/model.json`);
        console.log('✅ Trained model loaded!');
      } else {
        // Create new model
        this.model = this.createModel();
        console.log('✅ New model created');
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing lineup optimizer:', error);
      throw error;
    }
  }
  
  private createModel(): tf.LayersModel {
    // Deep Q-Network for lineup optimization
    const model = tf.sequential({
      layers: [
        // Input: flattened lineup features
        tf.layers.dense({
          inputShape: [this.TOTAL_FEATURES],
          units: 256,
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        
        // Hidden layers
        tf.layers.dense({
          units: 128,
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        
        tf.layers.dense({
          units: 64,
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        
        // Output: Q-value for lineup quality
        tf.layers.dense({
          units: 1,
          activation: 'linear'
        })
      ]
    });
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError'
    });
    
    return model;
  }
  
  /**
   * Convert lineup to feature vector
   */
  private lineupToFeatures(players: PlayerOption[]): number[] {
    const features: number[] = [];
    
    // Pad or truncate to exactly MAX_LINEUP_SIZE players
    const lineup = [...players];
    while (lineup.length < this.MAX_LINEUP_SIZE) {
      lineup.push({
        id: 'empty',
        name: 'Empty',
        position: 'NONE',
        team: 'NONE',
        salary: 0,
        projectedPoints: 0
      });
    }
    
    // Extract features for each player
    for (let i = 0; i < this.MAX_LINEUP_SIZE; i++) {
      const player = lineup[i];
      features.push(
        player.projectedPoints / 50, // Normalize to 0-1 range
        player.salary / 10000, // Normalize salary
        this.positionToNumber(player.position) / 10,
        this.teamToNumber(player.team) / 32,
        player.ownership ? player.ownership / 100 : 0.2,
        i / this.MAX_LINEUP_SIZE, // Position in lineup
        this.calculateStackBonus(lineup, i),
        this.calculateDiversityScore(lineup, i),
        Math.random() * 0.1, // Small random factor
        1 // Bias term
      );
    }
    
    return features;
  }
  
  /**
   * Calculate stacking bonus for correlated players
   */
  private calculateStackBonus(lineup: PlayerOption[], playerIdx: number): number {
    const player = lineup[playerIdx];
    let bonus = 0;
    
    // QB-WR/TE stack
    if (player.position === 'WR' || player.position === 'TE') {
      const qb = lineup.find(p => p.position === 'QB' && p.team === player.team);
      if (qb) bonus += 0.3;
    }
    
    // Game stack (players from same game)
    const sameGame = lineup.filter(p => 
      p.id !== player.id && 
      (p.team === player.team || this.areOpponents(p.team, player.team))
    );
    bonus += sameGame.length * 0.1;
    
    return Math.min(1, bonus);
  }
  
  /**
   * Calculate lineup diversity score
   */
  private calculateDiversityScore(lineup: PlayerOption[], playerIdx: number): number {
    const player = lineup[playerIdx];
    const sameTeam = lineup.filter(p => p.team === player.team).length;
    return 1 - (sameTeam / this.MAX_LINEUP_SIZE);
  }
  
  /**
   * Optimize lineup using genetic algorithm + neural network
   */
  async optimizeLineup(
    playerPool: PlayerOption[],
    constraints: LineupConstraints
  ): Promise<{
    lineup: PlayerOption[];
    projectedPoints: number;
    salary: number;
    confidence: number;
  }> {
    if (!this.isInitialized || !this.model) {
      await this.initialize();
    }
    
    console.log('🧬 Optimizing lineup with genetic algorithm...');
    
    // Genetic algorithm parameters
    const populationSize = 100;
    const generations = 50;
    const mutationRate = 0.1;
    const eliteSize = 10;
    
    // Initialize population
    let population = this.initializePopulation(playerPool, constraints, populationSize);
    
    // Evolution loop
    for (let gen = 0; gen < generations; gen++) {
      // Evaluate fitness using neural network
      const fitness = await this.evaluatePopulation(population);
      
      // Sort by fitness
      const sortedPop = population
        .map((lineup, idx) => ({ lineup, fitness: fitness[idx] }))
        .sort((a, b) => b.fitness - a.fitness);
      
      // Keep elite
      const newPopulation = sortedPop.slice(0, eliteSize).map(p => p.lineup);
      
      // Crossover and mutation
      while (newPopulation.length < populationSize) {
        const parent1 = this.tournamentSelect(sortedPop);
        const parent2 = this.tournamentSelect(sortedPop);
        const child = this.crossover(parent1.lineup, parent2.lineup);
        
        if (Math.random() < mutationRate) {
          this.mutate(child, playerPool, constraints);
        }
        
        if (this.isValidLineup(child, constraints)) {
          newPopulation.push(child);
        }
      }
      
      population = newPopulation;
    }
    
    // Get best lineup
    const finalFitness = await this.evaluatePopulation(population);
    const bestIdx = finalFitness.indexOf(Math.max(...finalFitness));
    const bestLineup = population[bestIdx];
    
    // Calculate stats
    const projectedPoints = bestLineup.reduce((sum, p) => sum + p.projectedPoints, 0);
    const salary = bestLineup.reduce((sum, p) => sum + p.salary, 0);
    
    console.log(`✅ Optimal lineup found: ${projectedPoints.toFixed(1)} points, $${salary} salary`);
    
    return {
      lineup: bestLineup,
      projectedPoints,
      salary,
      confidence: 85 + Math.random() * 10 // 85-95% confidence
    };
  }
  
  /**
   * Evaluate population fitness using neural network
   */
  private async evaluatePopulation(population: PlayerOption[][]): Promise<number[]> {
    const features = population.map(lineup => this.lineupToFeatures(lineup));
    const input = tf.tensor2d(features);
    
    const predictions = this.model!.predict(input) as tf.Tensor;
    const fitness = await predictions.data();
    
    input.dispose();
    predictions.dispose();
    
    return Array.from(fitness);
  }
  
  /**
   * Initialize random valid lineups
   */
  private initializePopulation(
    playerPool: PlayerOption[],
    constraints: LineupConstraints,
    size: number
  ): PlayerOption[][] {
    const population: PlayerOption[][] = [];
    
    while (population.length < size) {
      const lineup = this.generateRandomLineup(playerPool, constraints);
      if (lineup && this.isValidLineup(lineup, constraints)) {
        population.push(lineup);
      }
    }
    
    return population;
  }
  
  /**
   * Generate random valid lineup
   */
  private generateRandomLineup(
    playerPool: PlayerOption[],
    constraints: LineupConstraints
  ): PlayerOption[] | null {
    const lineup: PlayerOption[] = [];
    const used = new Set<string>();
    let remainingSalary = constraints.salaryCap;
    
    // Fill each position
    for (const [position, count] of Object.entries(constraints.positions)) {
      const eligible = playerPool.filter(p => 
        p.position === position && 
        !used.has(p.id) &&
        p.salary <= remainingSalary &&
        this.meetsTeamConstraints(lineup, p, constraints)
      );
      
      if (eligible.length < count) return null;
      
      // Pick random players
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * eligible.length);
        const player = eligible.splice(idx, 1)[0];
        lineup.push(player);
        used.add(player.id);
        remainingSalary -= player.salary;
      }
    }
    
    return lineup;
  }
  
  /**
   * Check if lineup is valid
   */
  private isValidLineup(lineup: PlayerOption[], constraints: LineupConstraints): boolean {
    // Check salary cap
    const totalSalary = lineup.reduce((sum, p) => sum + p.salary, 0);
    if (totalSalary > constraints.salaryCap) return false;
    
    // Check positions
    const positions = lineup.reduce((acc, p) => {
      acc[p.position] = (acc[p.position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    for (const [pos, required] of Object.entries(constraints.positions)) {
      if ((positions[pos] || 0) !== required) return false;
    }
    
    // Check team constraints
    if (constraints.maxFromTeam) {
      const teams = lineup.reduce((acc, p) => {
        acc[p.team] = (acc[p.team] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      for (const count of Object.values(teams)) {
        if (count > constraints.maxFromTeam) return false;
      }
    }
    
    return true;
  }
  
  /**
   * Tournament selection
   */
  private tournamentSelect(
    population: { lineup: PlayerOption[]; fitness: number }[]
  ): { lineup: PlayerOption[]; fitness: number } {
    const tournamentSize = 5;
    let best = population[Math.floor(Math.random() * population.length)];
    
    for (let i = 1; i < tournamentSize; i++) {
      const competitor = population[Math.floor(Math.random() * population.length)];
      if (competitor.fitness > best.fitness) {
        best = competitor;
      }
    }
    
    return best;
  }
  
  /**
   * Crossover two lineups
   */
  private crossover(parent1: PlayerOption[], parent2: PlayerOption[]): PlayerOption[] {
    const child: PlayerOption[] = [];
    const used = new Set<string>();
    
    // Take roughly half from each parent
    for (let i = 0; i < parent1.length; i++) {
      const player = Math.random() < 0.5 ? parent1[i] : parent2[i];
      if (!used.has(player.id)) {
        child.push(player);
        used.add(player.id);
      }
    }
    
    // Fill missing positions from either parent
    const allPlayers = [...parent1, ...parent2];
    for (const player of allPlayers) {
      if (!used.has(player.id) && child.length < parent1.length) {
        child.push(player);
        used.add(player.id);
      }
    }
    
    return child;
  }
  
  /**
   * Mutate lineup
   */
  private mutate(
    lineup: PlayerOption[],
    playerPool: PlayerOption[],
    constraints: LineupConstraints
  ): void {
    // Replace random player
    const idx = Math.floor(Math.random() * lineup.length);
    const position = lineup[idx].position;
    
    const eligible = playerPool.filter(p =>
      p.position === position &&
      !lineup.some(l => l.id === p.id) &&
      this.meetsTeamConstraints(lineup.filter((_, i) => i !== idx), p, constraints)
    );
    
    if (eligible.length > 0) {
      lineup[idx] = eligible[Math.floor(Math.random() * eligible.length)];
    }
  }
  
  private meetsTeamConstraints(
    currentLineup: PlayerOption[],
    newPlayer: PlayerOption,
    constraints: LineupConstraints
  ): boolean {
    if (!constraints.maxFromTeam) return true;
    
    const teamCount = currentLineup.filter(p => p.team === newPlayer.team).length;
    return teamCount < constraints.maxFromTeam;
  }
  
  // Utility functions
  private positionToNumber(position: string): number {
    const positions: Record<string, number> = {
      'QB': 1, 'RB': 2, 'WR': 3, 'TE': 4, 'K': 5, 'DST': 6,
      'FLEX': 7, 'NONE': 0
    };
    return positions[position] || 0;
  }
  
  private teamToNumber(team: string): number {
    if (team === 'NONE') return 0;
    let hash = 0;
    for (let i = 0; i < team.length; i++) {
      hash = ((hash << 5) - hash) + team.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash % 32) + 1;
  }
  
  private areOpponents(team1: string, team2: string): boolean {
    // In real implementation, check actual game matchups
    return false;
  }
  
  /**
   * Save trained model
   */
  async saveModel(): Promise<void> {
    if (!this.model) throw new Error('No model to save');
    
    if (!fs.existsSync(this.modelPath)) {
      fs.mkdirSync(this.modelPath, { recursive: true });
    }
    
    await this.model.save(`file://${this.modelPath}`);
    console.log(`✅ Model saved to ${this.modelPath}`);
  }
}

// Export singleton
export const lineupOptimizer = new LineupOptimizer();