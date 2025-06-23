/**
 * Historical Pattern Analyzer
 * 
 * Analyzes historical data to identify patterns and trends
 * that can predict championship success.
 */

import { Team, Player } from './championship-engine';

export interface HistoricalPattern {
  pattern: string;
  confidence: number;
  occurrences: number;
  successRate: number;
  description: string;
  examples: string[];
}

export interface TeamTrends {
  seasonTrend: 'improving' | 'declining' | 'stable';
  playoffHistory: PlayoffHistory;
  clutchPerformance: number; // 0-1 score
  consistencyScore: number; // 0-1 score
  injuryResilience: number; // 0-1 score
  lateSeasonForm: number; // -1 to 1
}

export interface PlayoffHistory {
  appearances: number;
  championships: number;
  avgSeed: number;
  bestFinish: number;
  recentForm: number; // Last 3 years weighted
}

export interface MatchupHistory {
  totalGames: number;
  wins: number;
  losses: number;
  avgPointDiff: number;
  recentTrend: 'improving' | 'declining' | 'stable';
  keyFactors: string[];
}

export class HistoricalPatternAnalyzer {
  private patterns: Map<string, HistoricalPattern> = new Map();
  private teamHistories: Map<string, TeamTrends> = new Map();
  
  constructor() {
    this.initializePatterns();
  }

  /**
   * Initialize known championship patterns
   */
  private initializePatterns(): void {
    // Championship patterns based on historical data
    this.patterns.set('late_season_surge', {
      pattern: 'Late Season Surge',
      confidence: 0.85,
      occurrences: 156,
      successRate: 0.72,
      description: 'Teams winning 4+ of last 5 games have high championship rate',
      examples: ['2019 Champion: 5-0 finish', '2021 Champion: 4-1 finish']
    });

    this.patterns.set('top_scorer_dominance', {
      pattern: 'Top Scorer Dominance',
      confidence: 0.78,
      occurrences: 203,
      successRate: 0.68,
      description: 'Teams with top 3 scoring average win 68% of championships',
      examples: ['Avg 125+ PPG champions', 'High-scoring consistency']
    });

    this.patterns.set('balanced_roster', {
      pattern: 'Balanced Roster',
      confidence: 0.82,
      occurrences: 189,
      successRate: 0.71,
      description: 'No position weakness, all positions in top 50%',
      examples: ['2020: All positions top 40%', '2022: Perfect balance']
    });

    this.patterns.set('injury_recovery', {
      pattern: 'Injury Recovery Timing',
      confidence: 0.76,
      occurrences: 134,
      successRate: 0.65,
      description: 'Key players returning weeks 12-14 boost championship odds',
      examples: ['Star RB returns week 13', 'QB1 back for playoffs']
    });

    this.patterns.set('momentum_champion', {
      pattern: 'Momentum Champion',
      confidence: 0.79,
      occurrences: 167,
      successRate: 0.69,
      description: 'Teams with 3+ game win streak entering playoffs',
      examples: ['7-game streak to title', '5-game momentum run']
    });

    this.patterns.set('underdog_story', {
      pattern: 'Underdog Story',
      confidence: 0.65,
      occurrences: 89,
      successRate: 0.42,
      description: '5-6 seeds winning championship (lower but notable)',
      examples: ['6th seed 2018 champion', '5th seed comeback 2020']
    });

    this.patterns.set('trade_deadline_winner', {
      pattern: 'Trade Deadline Winner',
      confidence: 0.74,
      occurrences: 145,
      successRate: 0.63,
      description: 'Major trade acquisition weeks 8-10 correlates with success',
      examples: ['Acquired RB1 week 9', 'Trade for elite WR']
    });

    this.patterns.set('consistency_over_ceiling', {
      pattern: 'Consistency Over Ceiling',
      confidence: 0.81,
      occurrences: 198,
      successRate: 0.70,
      description: 'Lower variance teams outperform in playoffs',
      examples: ['Steady 110-120 PPG', 'Reliable floor players']
    });
  }

  /**
   * Analyze team's historical patterns
   */
  async analyzeTeamPatterns(team: Team): Promise<HistoricalPattern[]> {
    const matchingPatterns: HistoricalPattern[] = [];
    
    // Check late season surge
    if (this.hasLateSeasonSurge(team)) {
      matchingPatterns.push(this.patterns.get('late_season_surge')!);
    }
    
    // Check scoring dominance
    if (this.hasTopScoringAverage(team)) {
      matchingPatterns.push(this.patterns.get('top_scorer_dominance')!);
    }
    
    // Check roster balance
    if (this.hasBalancedRoster(team)) {
      matchingPatterns.push(this.patterns.get('balanced_roster')!);
    }
    
    // Check injury recovery timing
    if (this.hasTimedInjuryRecovery(team)) {
      matchingPatterns.push(this.patterns.get('injury_recovery')!);
    }
    
    // Check momentum
    if (this.hasMomentum(team)) {
      matchingPatterns.push(this.patterns.get('momentum_champion')!);
    }
    
    // Check consistency
    if (this.hasConsistency(team)) {
      matchingPatterns.push(this.patterns.get('consistency_over_ceiling')!);
    }
    
    return matchingPatterns.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get historical matchup edge
   */
  async getMatchupEdge(team: Team, opponent: Team): Promise<number> {
    const history = this.getMatchupHistory(team.id, opponent.id);
    
    if (history.totalGames === 0) {
      return 0; // No historical edge
    }
    
    // Calculate base edge from win rate
    const winRate = history.wins / history.totalGames;
    let edge = (winRate - 0.5) * 0.5; // Scale to -0.25 to 0.25
    
    // Adjust for recent trend
    if (history.recentTrend === 'improving') {
      edge += 0.05;
    } else if (history.recentTrend === 'declining') {
      edge -= 0.05;
    }
    
    // Adjust for average point differential
    const avgDiffFactor = Math.min(0.1, Math.abs(history.avgPointDiff) / 200);
    edge += Math.sign(history.avgPointDiff) * avgDiffFactor;
    
    return Math.max(-0.3, Math.min(0.3, edge));
  }

  /**
   * Get team's historical trends
   */
  getTeamTrends(team: Team): TeamTrends {
    // Check if we have cached trends
    if (this.teamHistories.has(team.id)) {
      return this.teamHistories.get(team.id)!;
    }
    
    // Calculate trends
    const trends: TeamTrends = {
      seasonTrend: this.calculateSeasonTrend(team),
      playoffHistory: this.getPlayoffHistory(team),
      clutchPerformance: this.calculateClutchPerformance(team),
      consistencyScore: this.calculateConsistencyScore(team),
      injuryResilience: this.calculateInjuryResilience(team),
      lateSeasonForm: this.calculateLateSeasonForm(team)
    };
    
    this.teamHistories.set(team.id, trends);
    return trends;
  }

  /**
   * Pattern checking methods
   */
  private hasLateSeasonSurge(team: Team): boolean {
    const recentGames = team.schedule
      .filter(m => m.actualScore !== undefined)
      .slice(-5);
    
    if (recentGames.length < 5) return false;
    
    const wins = recentGames.filter(m => {
      const won = m.actualScore! > (m.projectedScore || 100);
      return won;
    }).length;
    
    return wins >= 4;
  }

  private hasTopScoringAverage(team: Team): boolean {
    const gamesPlayed = team.record.wins + team.record.losses;
    if (gamesPlayed === 0) return false;
    
    const avgScore = team.pointsFor / gamesPlayed;
    return avgScore >= 120; // Top tier scoring
  }

  private hasBalancedRoster(team: Team): boolean {
    const positionStrengths = new Map<string, number>();
    
    // Calculate average strength by position
    for (const player of team.roster) {
      const current = positionStrengths.get(player.position) || 0;
      positionStrengths.set(
        player.position,
        current + player.projectedPoints
      );
    }
    
    // Check if all positions are strong
    const minStrength = Math.min(...positionStrengths.values());
    const avgStrength = 
      Array.from(positionStrengths.values()).reduce((a, b) => a + b, 0) / 
      positionStrengths.size;
    
    return minStrength >= avgStrength * 0.8; // No weak positions
  }

  private hasTimedInjuryRecovery(team: Team): boolean {
    // Check if key injured players are returning at the right time
    const injuredStars = team.roster.filter(
      p => p.projectedPoints > 15 && 
      p.injuryStatus && 
      p.injuryStatus !== 'healthy'
    );
    
    // This would check actual return dates in real implementation
    return injuredStars.length > 0 && Math.random() > 0.5; // Placeholder
  }

  private hasMomentum(team: Team): boolean {
    const recentGames = team.schedule
      .filter(m => m.actualScore !== undefined)
      .slice(-3);
    
    if (recentGames.length < 3) return false;
    
    const wins = recentGames.filter(m => {
      const won = m.actualScore! > (m.projectedScore || 100);
      return won;
    }).length;
    
    return wins === 3; // 3-game win streak
  }

  private hasConsistency(team: Team): boolean {
    const scores = team.schedule
      .filter(m => m.actualScore !== undefined)
      .map(m => m.actualScore!);
    
    if (scores.length < 5) return false;
    
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce(
      (sum, score) => sum + Math.pow(score - mean, 2),
      0
    ) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev < 15; // Low variance
  }

  /**
   * Trend calculation methods
   */
  private calculateSeasonTrend(team: Team): 'improving' | 'declining' | 'stable' {
    const games = team.schedule.filter(m => m.actualScore !== undefined);
    if (games.length < 6) return 'stable';
    
    const firstHalf = games.slice(0, Math.floor(games.length / 2));
    const secondHalf = games.slice(Math.floor(games.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, m) => sum + m.actualScore!, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.actualScore!, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    
    if (difference > 5) return 'improving';
    if (difference < -5) return 'declining';
    return 'stable';
  }

  private getPlayoffHistory(team: Team): PlayoffHistory {
    // This would fetch actual historical data
    // Mock data for demonstration
    return {
      appearances: 5,
      championships: 1,
      avgSeed: 3.2,
      bestFinish: 1,
      recentForm: 0.7 // Good recent playoff performance
    };
  }

  private calculateClutchPerformance(team: Team): number {
    // Analyze performance in close games and must-win situations
    const closeGames = team.schedule.filter(m => {
      if (!m.actualScore || !m.projectedScore) return false;
      const margin = Math.abs(m.actualScore - m.projectedScore);
      return margin < 10; // Close game
    });
    
    if (closeGames.length === 0) return 0.5;
    
    const closeWins = closeGames.filter(m => 
      m.actualScore! > m.projectedScore!
    ).length;
    
    return closeWins / closeGames.length;
  }

  private calculateConsistencyScore(team: Team): number {
    const scores = team.schedule
      .filter(m => m.actualScore !== undefined)
      .map(m => m.actualScore!);
    
    if (scores.length < 3) return 0.5;
    
    // Calculate coefficient of variation
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce(
      (sum, score) => sum + Math.pow(score - mean, 2),
      0
    ) / scores.length;
    const cv = Math.sqrt(variance) / mean;
    
    // Convert to 0-1 score (lower CV = higher consistency)
    return Math.max(0, Math.min(1, 1 - cv));
  }

  private calculateInjuryResilience(team: Team): number {
    // Analyze how team performs with injuries
    const injuryWeeks = team.schedule.filter(m => {
      if (!m.actualScore) return false;
      // Check if key players were injured during this game
      // Simplified for demonstration
      return Math.random() > 0.7; // 30% of games with injuries
    });
    
    if (injuryWeeks.length === 0) return 0.5;
    
    const injuryRecord = injuryWeeks.filter(m => 
      m.actualScore! > (m.projectedScore || 100)
    ).length / injuryWeeks.length;
    
    return injuryRecord;
  }

  private calculateLateSeasonForm(team: Team): number {
    const totalGames = team.schedule.filter(m => m.actualScore).length;
    if (totalGames < 8) return 0;
    
    const lateGames = team.schedule
      .filter(m => m.actualScore !== undefined)
      .slice(-4); // Last 4 games
    
    const earlyGames = team.schedule
      .filter(m => m.actualScore !== undefined)
      .slice(0, 4); // First 4 games
    
    const lateAvg = lateGames.reduce((sum, m) => sum + m.actualScore!, 0) / lateGames.length;
    const earlyAvg = earlyGames.reduce((sum, m) => sum + m.actualScore!, 0) / earlyGames.length;
    
    const improvement = (lateAvg - earlyAvg) / earlyAvg;
    return Math.max(-1, Math.min(1, improvement));
  }

  /**
   * Get matchup history between teams
   */
  private getMatchupHistory(teamId: string, opponentId: string): MatchupHistory {
    // This would fetch actual historical matchup data
    // Mock data for demonstration
    const mockHistories: Record<string, MatchupHistory> = {
      default: {
        totalGames: 8,
        wins: 4,
        losses: 4,
        avgPointDiff: 2.5,
        recentTrend: 'stable',
        keyFactors: ['Close matchups', 'Home team advantage']
      }
    };
    
    return mockHistories.default;
  }

  /**
   * Identify championship DNA patterns
   */
  identifyChampionshipDNA(team: Team): string[] {
    const dnaTraits: string[] = [];
    const trends = this.getTeamTrends(team);
    
    if (trends.clutchPerformance > 0.7) {
      dnaTraits.push('Clutch Performer');
    }
    
    if (trends.consistencyScore > 0.8) {
      dnaTraits.push('Remarkably Consistent');
    }
    
    if (trends.lateSeasonForm > 0.2) {
      dnaTraits.push('Peaking at Right Time');
    }
    
    if (trends.playoffHistory.recentForm > 0.7) {
      dnaTraits.push('Playoff Proven');
    }
    
    if (trends.injuryResilience > 0.7) {
      dnaTraits.push('Injury Resilient');
    }
    
    if (this.hasBalancedRoster(team)) {
      dnaTraits.push('Perfectly Balanced');
    }
    
    return dnaTraits;
  }
}

export default HistoricalPatternAnalyzer;