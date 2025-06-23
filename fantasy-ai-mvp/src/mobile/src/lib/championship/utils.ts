/**
 * Championship Engine Utilities
 * 
 * Helper functions and utilities for the championship probability engine
 */

import { Team, Player, ChampionshipProbability } from './championship-engine';

/**
 * Statistical utility functions
 */
export class Statistics {
  /**
   * Calculate linear regression slope
   */
  static linearTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const xSum = (n * (n - 1)) / 2; // 0+1+2+...+(n-1)
    const ySum = values.reduce((a, b) => a + b, 0);
    const xySum = values.reduce((sum, y, x) => sum + x * y, 0);
    const xxSum = (n * (n - 1) * (2 * n - 1)) / 6; // Sum of squares
    
    const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
    return slope || 0;
  }

  /**
   * Calculate coefficient of variation
   */
  static coefficientOfVariation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if (mean === 0) return 0;
    
    const variance = values.reduce(
      (sum, value) => sum + Math.pow(value - mean, 2),
      0
    ) / values.length;
    
    return Math.sqrt(variance) / mean;
  }

  /**
   * Calculate percentile rank
   */
  static percentileRank(value: number, dataset: number[]): number {
    const sorted = [...dataset].sort((a, b) => a - b);
    const below = sorted.filter(v => v < value).length;
    const equal = sorted.filter(v => v === value).length;
    
    return (below + equal * 0.5) / sorted.length;
  }

  /**
   * Calculate correlation coefficient
   */
  static correlation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let sumSqX = 0;
    let sumSqY = 0;
    
    for (let i = 0; i < n; i++) {
      const deltaX = x[i] - meanX;
      const deltaY = y[i] - meanY;
      numerator += deltaX * deltaY;
      sumSqX += deltaX * deltaX;
      sumSqY += deltaY * deltaY;
    }
    
    const denominator = Math.sqrt(sumSqX * sumSqY);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Generate random number with normal distribution
   */
  static normalRandom(mean: number = 0, stdDev: number = 1): number {
    // Box-Muller transformation
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
  }
}

/**
 * Team analysis utilities
 */
export class TeamAnalysis {
  /**
   * Calculate team power ranking
   */
  static calculatePowerRanking(team: Team, allTeams: Team[]): number {
    const winPct = team.record.wins / (team.record.wins + team.record.losses);
    const pointDiff = (team.pointsFor - team.pointsAgainst) / (team.record.wins + team.record.losses);
    const strengthOfVictory = this.calculateStrengthOfVictory(team, allTeams);
    
    return winPct * 0.4 + (pointDiff / 100) * 0.4 + strengthOfVictory * 0.2;
  }

  /**
   * Calculate strength of victory
   */
  static calculateStrengthOfVictory(team: Team, allTeams: Team[]): number {
    // Simplified calculation - would use actual game results
    const avgOpponentRank = allTeams.length / 2;
    return 1 - (avgOpponentRank / allTeams.length);
  }

  /**
   * Identify team's strongest position group
   */
  static getStrongestPosition(team: Team): string {
    const positionStrengths = new Map<string, number>();
    
    for (const player of team.roster) {
      const current = positionStrengths.get(player.position) || 0;
      positionStrengths.set(player.position, current + player.projectedPoints);
    }
    
    let strongest = '';
    let maxStrength = 0;
    
    for (const [position, strength] of positionStrengths) {
      if (strength > maxStrength) {
        maxStrength = strength;
        strongest = position;
      }
    }
    
    return strongest;
  }

  /**
   * Calculate roster diversity score
   */
  static calculateRosterDiversity(team: Team): number {
    const positionCounts = new Map<string, number>();
    
    for (const player of team.roster) {
      positionCounts.set(
        player.position,
        (positionCounts.get(player.position) || 0) + 1
      );
    }
    
    // Shannon diversity index
    const total = team.roster.length;
    let diversity = 0;
    
    for (const count of positionCounts.values()) {
      const proportion = count / total;
      diversity -= proportion * Math.log2(proportion);
    }
    
    return diversity;
  }
}

/**
 * Probability utilities
 */
export class ProbabilityUtils {
  /**
   * Convert odds to probability
   */
  static oddsToProbability(odds: string): number {
    if (odds.startsWith('+')) {
      const value = parseInt(odds.substring(1));
      return 100 / (value + 100);
    } else if (odds.startsWith('-')) {
      const value = parseInt(odds.substring(1));
      return value / (value + 100);
    }
    return 0.5; // Default for invalid odds
  }

  /**
   * Convert probability to odds
   */
  static probabilityToOdds(probability: number): string {
    if (probability > 0.5) {
      const odds = (probability / (1 - probability)) * 100;
      return `-${Math.round(odds)}`;
    } else {
      const odds = ((1 - probability) / probability) * 100;
      return `+${Math.round(odds)}`;
    }
  }

  /**
   * Calculate implied probability from multiple probabilities
   */
  static combineIndependentProbabilities(probabilities: number[]): number {
    return probabilities.reduce((combined, prob) => 
      combined + prob - (combined * prob), 0
    );
  }

  /**
   * Calculate Kelly Criterion for optimal bet sizing
   */
  static kellyCriterion(
    winProbability: number,
    odds: number,
    bankroll: number
  ): number {
    const b = odds - 1; // Net odds received
    const p = winProbability;
    const q = 1 - p;
    
    const kellyFraction = (b * p - q) / b;
    return Math.max(0, kellyFraction * bankroll);
  }
}

/**
 * Formatting utilities
 */
export class Formatters {
  /**
   * Format probability as percentage
   */
  static probability(value: number, decimals: number = 1): string {
    return `${(value * 100).toFixed(decimals)}%`;
  }

  /**
   * Format change with sign
   */
  static change(value: number, decimals: number = 1): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(decimals)}`;
  }

  /**
   * Format large numbers with suffixes
   */
  static largeNumber(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  }

  /**
   * Format time duration
   */
  static duration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Format team record
   */
  static record(wins: number, losses: number, ties: number = 0): string {
    return ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
  }
}

/**
 * Validation utilities
 */
export class Validators {
  /**
   * Validate team data
   */
  static validateTeam(team: Team): string[] {
    const errors: string[] = [];
    
    if (!team.id) errors.push('Team ID is required');
    if (!team.name) errors.push('Team name is required');
    if (team.record.wins < 0) errors.push('Wins cannot be negative');
    if (team.record.losses < 0) errors.push('Losses cannot be negative');
    if (team.pointsFor < 0) errors.push('Points for cannot be negative');
    if (team.pointsAgainst < 0) errors.push('Points against cannot be negative');
    if (!Array.isArray(team.roster)) errors.push('Roster must be an array');
    if (!Array.isArray(team.schedule)) errors.push('Schedule must be an array');
    
    return errors;
  }

  /**
   * Validate player data
   */
  static validatePlayer(player: Player): string[] {
    const errors: string[] = [];
    
    if (!player.id) errors.push('Player ID is required');
    if (!player.name) errors.push('Player name is required');
    if (!player.position) errors.push('Player position is required');
    if (player.projectedPoints < 0) errors.push('Projected points cannot be negative');
    
    const validPositions = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
    if (!validPositions.includes(player.position)) {
      errors.push(`Invalid position: ${player.position}`);
    }
    
    return errors;
  }

  /**
   * Validate probability value
   */
  static validateProbability(value: number, name: string = 'Probability'): string[] {
    const errors: string[] = [];
    
    if (typeof value !== 'number') {
      errors.push(`${name} must be a number`);
    } else if (value < 0 || value > 1) {
      errors.push(`${name} must be between 0 and 1`);
    } else if (isNaN(value)) {
      errors.push(`${name} cannot be NaN`);
    }
    
    return errors;
  }
}

/**
 * Simulation utilities
 */
export class SimulationUtils {
  /**
   * Run Monte Carlo simulation
   */
  static runMonteCarlo<T>(
    simulation: () => T,
    iterations: number,
    onProgress?: (progress: number) => void
  ): T[] {
    const results: T[] = [];
    
    for (let i = 0; i < iterations; i++) {
      results.push(simulation());
      
      if (onProgress && i % 100 === 0) {
        onProgress(i / iterations);
      }
    }
    
    if (onProgress) onProgress(1);
    return results;
  }

  /**
   * Calculate confidence interval
   */
  static confidenceInterval(
    values: number[],
    confidence: number = 0.95
  ): { lower: number; upper: number; mean: number } {
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    
    const alpha = 1 - confidence;
    const lowerIndex = Math.floor(sorted.length * alpha / 2);
    const upperIndex = Math.ceil(sorted.length * (1 - alpha / 2)) - 1;
    
    return {
      lower: sorted[lowerIndex],
      upper: sorted[upperIndex],
      mean
    };
  }

  /**
   * Generate bootstrap sample
   */
  static bootstrap<T>(data: T[], sampleSize?: number): T[] {
    const size = sampleSize || data.length;
    const sample: T[] = [];
    
    for (let i = 0; i < size; i++) {
      const randomIndex = Math.floor(Math.random() * data.length);
      sample.push(data[randomIndex]);
    }
    
    return sample;
  }
}

/**
 * Caching utilities
 */
export class CacheManager {
  private static cache = new Map<string, { value: any; expiry: number }>();

  /**
   * Get cached value
   */
  static get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.value;
  }

  /**
   * Set cached value
   */
  static set<T>(key: string, value: T, ttlMs: number = 300000): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs
    });
  }

  /**
   * Clear cache
   */
  static clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  static size(): number {
    return this.cache.size;
  }
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private static timers = new Map<string, number>();

  /**
   * Start timing operation
   */
  static start(operation: string): void {
    this.timers.set(operation, Date.now());
  }

  /**
   * End timing operation
   */
  static end(operation: string): number {
    const start = this.timers.get(operation);
    if (!start) return 0;
    
    const duration = Date.now() - start;
    this.timers.delete(operation);
    
    console.log(`⏱️ ${operation}: ${duration}ms`);
    return duration;
  }

  /**
   * Time a function execution
   */
  static async time<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    this.start(operation);
    try {
      const result = await fn();
      this.end(operation);
      return result;
    } catch (error) {
      this.end(operation);
      throw error;
    }
  }
}

/**
 * Export all utilities
 */
export const Utils = {
  Statistics,
  TeamAnalysis,
  ProbabilityUtils,
  Formatters,
  Validators,
  SimulationUtils,
  CacheManager,
  PerformanceMonitor
};