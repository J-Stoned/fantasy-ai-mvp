/**
 * Team Momentum Tracker
 * 
 * Tracks and analyzes team momentum based on recent performance,
 * player trends, and psychological factors affecting championship probability.
 */

import { Team, Player, MatchupSchedule } from './championship-engine';

export interface MomentumAnalysis {
  overall: number; // -1 to 1 (negative = bad momentum, positive = good)
  trend: 'hot' | 'cold' | 'neutral' | 'volatile';
  confidence: number; // 0-1
  components: MomentumComponent[];
  streaks: StreakAnalysis;
  playerMomentum: PlayerMomentumMap;
  predictions: MomentumPrediction[];
  triggers: MomentumTrigger[];
}

export interface MomentumComponent {
  factor: string;
  value: number; // -1 to 1
  weight: number; // 0-1
  description: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface StreakAnalysis {
  current: {
    type: 'win' | 'loss' | 'none';
    length: number;
    strength: number; // How convincing
  };
  recent: {
    wins: number;
    losses: number;
    period: number; // weeks
  };
  scoring: {
    trend: 'up' | 'down' | 'flat';
    change: number; // PPG change
    consistency: number; // 0-1
  };
}

export interface PlayerMomentumMap {
  hot: Player[];
  cold: Player[];
  breakout: Player[];
  declining: Player[];
  injury_return: Player[];
}

export interface MomentumPrediction {
  week: number;
  predictedMomentum: number;
  confidence: number;
  factors: string[];
}

export interface MomentumTrigger {
  event: string;
  impact: number;
  probability: number;
  timing: string;
}

export class TeamMomentumTracker {
  private readonly MOMENTUM_WEIGHTS = {
    recentRecord: 0.25,
    scoringTrend: 0.20,
    playerPerformance: 0.20,
    consistency: 0.15,
    injuries: 0.10,
    schedule: 0.10
  };

  private readonly STREAK_MULTIPLIERS = {
    win: {
      3: 1.2,
      5: 1.5,
      7: 1.8,
      10: 2.0
    },
    loss: {
      3: 0.8,
      5: 0.5,
      7: 0.3,
      10: 0.2
    }
  };

  /**
   * Calculate team's current momentum
   */
  calculateMomentum(team: Team): number {
    const analysis = this.analyzeTeamMomentum(team);
    return analysis.overall;
  }

  /**
   * Comprehensive momentum analysis
   */
  analyzeTeamMomentum(team: Team): MomentumAnalysis {
    const components = this.calculateMomentumComponents(team);
    const streaks = this.analyzeStreaks(team);
    const playerMomentum = this.analyzePlayerMomentum(team);
    const predictions = this.predictFutureMomentum(team, components);
    const triggers = this.identifyMomentumTriggers(team);
    
    const overall = this.calculateOverallMomentum(components);
    const trend = this.determineTrend(components, streaks);
    const confidence = this.calculateConfidence(components);
    
    return {
      overall,
      trend,
      confidence,
      components,
      streaks,
      playerMomentum,
      predictions,
      triggers
    };
  }

  /**
   * Calculate individual momentum components
   */
  private calculateMomentumComponents(team: Team): MomentumComponent[] {
    const components: MomentumComponent[] = [];
    
    // Recent record momentum
    const recordMomentum = this.calculateRecentRecordMomentum(team);
    components.push({
      factor: 'Recent Record',
      value: recordMomentum.value,
      weight: this.MOMENTUM_WEIGHTS.recentRecord,
      description: recordMomentum.description,
      trend: recordMomentum.trend
    });
    
    // Scoring trend momentum
    const scoringMomentum = this.calculateScoringTrendMomentum(team);
    components.push({
      factor: 'Scoring Trend',
      value: scoringMomentum.value,
      weight: this.MOMENTUM_WEIGHTS.scoringTrend,
      description: scoringMomentum.description,
      trend: scoringMomentum.trend
    });
    
    // Player performance momentum
    const playerMomentum = this.calculatePlayerPerformanceMomentum(team);
    components.push({
      factor: 'Player Performance',
      value: playerMomentum.value,
      weight: this.MOMENTUM_WEIGHTS.playerPerformance,
      description: playerMomentum.description,
      trend: playerMomentum.trend
    });
    
    // Consistency momentum
    const consistencyMomentum = this.calculateConsistencyMomentum(team);
    components.push({
      factor: 'Consistency',
      value: consistencyMomentum.value,
      weight: this.MOMENTUM_WEIGHTS.consistency,
      description: consistencyMomentum.description,
      trend: consistencyMomentum.trend
    });
    
    // Injury momentum
    const injuryMomentum = this.calculateInjuryMomentum(team);
    components.push({
      factor: 'Team Health',
      value: injuryMomentum.value,
      weight: this.MOMENTUM_WEIGHTS.injuries,
      description: injuryMomentum.description,
      trend: injuryMomentum.trend
    });
    
    // Schedule momentum
    const scheduleMomentum = this.calculateScheduleMomentum(team);
    components.push({
      factor: 'Schedule Strength',
      value: scheduleMomentum.value,
      weight: this.MOMENTUM_WEIGHTS.schedule,
      description: scheduleMomentum.description,
      trend: scheduleMomentum.trend
    });
    
    return components;
  }

  /**
   * Calculate recent record momentum
   */
  private calculateRecentRecordMomentum(team: Team): {
    value: number;
    description: string;
    trend: 'increasing' | 'decreasing' | 'stable';
  } {
    const recentGames = team.schedule
      .filter(m => m.actualScore !== undefined)
      .slice(-5);
    
    if (recentGames.length === 0) {
      return {
        value: 0,
        description: 'No recent games',
        trend: 'stable'
      };
    }
    
    const wins = recentGames.filter(m => 
      m.actualScore! > (m.projectedScore || 100)
    ).length;
    
    const winRate = wins / recentGames.length;
    let momentum = (winRate - 0.5) * 2; // -1 to 1
    
    // Boost for win streaks
    const currentStreak = this.getCurrentStreak(recentGames);
    if (currentStreak.type === 'win') {
      const multiplier = this.STREAK_MULTIPLIERS.win[currentStreak.length] || 1;
      momentum *= multiplier;
    } else if (currentStreak.type === 'loss') {
      const multiplier = this.STREAK_MULTIPLIERS.loss[currentStreak.length] || 1;
      momentum *= multiplier;
    }
    
    // Determine trend
    const first3 = recentGames.slice(0, 3);
    const last2 = recentGames.slice(-2);
    const firstWinRate = first3.filter(m => m.actualScore! > (m.projectedScore || 100)).length / 3;
    const lastWinRate = last2.filter(m => m.actualScore! > (m.projectedScore || 100)).length / 2;
    
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (lastWinRate > firstWinRate + 0.3) trend = 'increasing';
    else if (lastWinRate < firstWinRate - 0.3) trend = 'decreasing';
    
    return {
      value: Math.max(-1, Math.min(1, momentum)),
      description: `${wins}W-${recentGames.length - wins}L in last ${recentGames.length} games`,
      trend
    };
  }

  /**
   * Calculate scoring trend momentum
   */
  private calculateScoringTrendMomentum(team: Team): {
    value: number;
    description: string;
    trend: 'increasing' | 'decreasing' | 'stable';
  } {
    const recentScores = team.schedule
      .filter(m => m.actualScore !== undefined)
      .map(m => m.actualScore!)
      .slice(-5);
    
    if (recentScores.length < 3) {
      return {
        value: 0,
        description: 'Insufficient scoring data',
        trend: 'stable'
      };
    }
    
    // Calculate linear trend
    const trend = this.calculateLinearTrend(recentScores);
    const trendValue = trend / 5; // Normalize (5 points per game = 0.2 momentum)
    
    // Calculate versus expected
    const avgScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const expectedScore = team.pointsFor / (team.record.wins + team.record.losses);
    const vsExpected = (avgScore - expectedScore) / expectedScore;
    
    const combinedMomentum = (trendValue + vsExpected) / 2;
    
    // Determine trend direction
    let trendDirection: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (trend > 2) trendDirection = 'increasing';
    else if (trend < -2) trendDirection = 'decreasing';
    
    return {
      value: Math.max(-1, Math.min(1, combinedMomentum)),
      description: `Avg ${avgScore.toFixed(1)} PPG, ${trend > 0 ? '+' : ''}${trend.toFixed(1)} trend`,
      trend: trendDirection
    };
  }

  /**
   * Calculate player performance momentum
   */
  private calculatePlayerPerformanceMomentum(team: Team): {
    value: number;
    description: string;
    trend: 'increasing' | 'decreasing' | 'stable';
  } {
    let totalMomentum = 0;
    let playerCount = 0;
    let improvingPlayers = 0;
    let decliningPlayers = 0;
    
    for (const player of team.roster) {
      if (!player.recentPerformance || player.recentPerformance.length < 3) {
        continue;
      }
      
      const playerMomentum = this.calculateIndividualPlayerMomentum(player);
      const weight = this.getPlayerWeight(player);
      
      totalMomentum += playerMomentum * weight;
      playerCount += weight;
      
      if (playerMomentum > 0.2) improvingPlayers++;
      else if (playerMomentum < -0.2) decliningPlayers++;
    }
    
    const avgMomentum = playerCount > 0 ? totalMomentum / playerCount : 0;
    
    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (improvingPlayers > decliningPlayers + 1) trend = 'increasing';
    else if (decliningPlayers > improvingPlayers + 1) trend = 'decreasing';
    
    return {
      value: avgMomentum,
      description: `${improvingPlayers} hot, ${decliningPlayers} cold players`,
      trend
    };
  }

  /**
   * Calculate consistency momentum
   */
  private calculateConsistencyMomentum(team: Team): {
    value: number;
    description: string;
    trend: 'increasing' | 'decreasing' | 'stable';
  } {
    const recentScores = team.schedule
      .filter(m => m.actualScore !== undefined)
      .map(m => m.actualScore!)
      .slice(-5);
    
    if (recentScores.length < 3) {
      return {
        value: 0,
        description: 'Insufficient data',
        trend: 'stable'
      };
    }
    
    // Calculate coefficient of variation
    const mean = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const variance = recentScores.reduce((sum, score) => 
      sum + Math.pow(score - mean, 2), 0
    ) / recentScores.length;
    const cv = Math.sqrt(variance) / mean;
    
    // Lower CV = better consistency = positive momentum
    const consistencyScore = Math.max(0, 1 - cv);
    const momentum = (consistencyScore - 0.5) * 2; // Scale to -1 to 1
    
    // Compare to earlier games for trend
    const allScores = team.schedule
      .filter(m => m.actualScore !== undefined)
      .map(m => m.actualScore!);
    
    const earlyScores = allScores.slice(0, Math.max(3, allScores.length - 5));
    const earlyCv = this.calculateCV(earlyScores);
    
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (cv < earlyCv * 0.8) trend = 'increasing';
    else if (cv > earlyCv * 1.2) trend = 'decreasing';
    
    return {
      value: momentum,
      description: `${cv < 0.15 ? 'Very' : cv < 0.25 ? 'Fairly' : 'Not'} consistent`,
      trend
    };
  }

  /**
   * Calculate injury momentum
   */
  private calculateInjuryMomentum(team: Team): {
    value: number;
    description: string;
    trend: 'increasing' | 'decreasing' | 'stable';
  } {
    const injuredStarters = team.roster.filter(p => 
      p.projectedPoints > 10 && 
      p.injuryStatus && 
      p.injuryStatus !== 'healthy'
    );
    
    const totalStarters = team.roster.filter(p => p.projectedPoints > 10).length;
    const injuryRate = injuredStarters.length / totalStarters;
    
    // Negative momentum from injuries
    let momentum = -injuryRate * 2; // Scale to -2 to 0
    
    // Check for players returning from injury (positive momentum)
    const returningPlayers = team.roster.filter(p => 
      p.injuryStatus === 'questionable' && p.projectedPoints > 12
    );
    
    if (returningPlayers.length > 0) {
      momentum += returningPlayers.length * 0.3;
    }
    
    // Simple trend analysis (would use historical data in real implementation)
    const trend: 'increasing' | 'decreasing' | 'stable' = 
      returningPlayers.length > injuredStarters.length ? 'increasing' :
      injuredStarters.length > 2 ? 'decreasing' : 'stable';
    
    return {
      value: Math.max(-1, Math.min(1, momentum)),
      description: `${injuredStarters.length} key injuries, ${returningPlayers.length} returning`,
      trend
    };
  }

  /**
   * Calculate schedule momentum
   */
  private calculateScheduleMomentum(team: Team): {
    value: number;
    description: string;
    trend: 'increasing' | 'decreasing' | 'stable';
  } {
    const currentWeek = Math.max(...team.schedule.map(m => m.week));
    const remainingGames = team.schedule.filter(m => m.week > currentWeek);
    
    if (remainingGames.length === 0) {
      return {
        value: 0,
        description: 'Season complete',
        trend: 'stable'
      };
    }
    
    // Estimate difficulty of remaining schedule
    // (In real implementation, would calculate actual opponent strength)
    const avgDifficulty = remainingGames.reduce((sum, game) => {
      // Simplified: away games are harder
      return sum + (game.isHome ? 0.3 : 0.7);
    }, 0) / remainingGames.length;
    
    // Easier schedule = positive momentum
    const momentum = (0.5 - avgDifficulty) * 2;
    
    // Check for home stretch
    const homeGames = remainingGames.filter(g => g.isHome).length;
    const homeBonus = (homeGames / remainingGames.length - 0.5) * 0.5;
    
    const totalMomentum = momentum + homeBonus;
    
    return {
      value: Math.max(-1, Math.min(1, totalMomentum)),
      description: `${homeGames}/${remainingGames.length} home games remaining`,
      trend: 'stable' // Would analyze week-by-week difficulty in real implementation
    };
  }

  /**
   * Analyze win/loss streaks
   */
  private analyzeStreaks(team: Team): StreakAnalysis {
    const recentGames = team.schedule
      .filter(m => m.actualScore !== undefined)
      .slice(-8);
    
    const currentStreak = this.getCurrentStreak(recentGames);
    
    const recent5 = recentGames.slice(-5);
    const recentWins = recent5.filter(m => 
      m.actualScore! > (m.projectedScore || 100)
    ).length;
    
    // Scoring trend
    const scores = recentGames.map(m => m.actualScore!);
    const trend = this.calculateLinearTrend(scores);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const consistency = 1 - this.calculateCV(scores);
    
    return {
      current: {
        type: currentStreak.type,
        length: currentStreak.length,
        strength: currentStreak.strength
      },
      recent: {
        wins: recentWins,
        losses: recent5.length - recentWins,
        period: recent5.length
      },
      scoring: {
        trend: trend > 1 ? 'up' : trend < -1 ? 'down' : 'flat',
        change: trend,
        consistency
      }
    };
  }

  /**
   * Analyze individual player momentum
   */
  private analyzePlayerMomentum(team: Team): PlayerMomentumMap {
    const hot: Player[] = [];
    const cold: Player[] = [];
    const breakout: Player[] = [];
    const declining: Player[] = [];
    const injury_return: Player[] = [];
    
    for (const player of team.roster) {
      const momentum = this.calculateIndividualPlayerMomentum(player);
      
      if (momentum > 0.5) {
        hot.push(player);
      } else if (momentum < -0.5) {
        cold.push(player);
      }
      
      // Check for breakout potential
      if (this.isBreakoutCandidate(player)) {
        breakout.push(player);
      }
      
      // Check for decline
      if (this.isDecliningPlayer(player)) {
        declining.push(player);
      }
      
      // Check for injury returns
      if (player.injuryStatus === 'questionable' && player.projectedPoints > 10) {
        injury_return.push(player);
      }
    }
    
    return { hot, cold, breakout, declining, injury_return };
  }

  /**
   * Predict future momentum
   */
  private predictFutureMomentum(
    team: Team,
    components: MomentumComponent[]
  ): MomentumPrediction[] {
    const predictions: MomentumPrediction[] = [];
    const currentMomentum = this.calculateOverallMomentum(components);
    
    for (let week = 1; week <= 4; week++) {
      // Momentum tends to regress to mean over time
      const regression = 0.8 ** week; // Decay factor
      const predictedMomentum = currentMomentum * regression;
      
      const factors: string[] = [];
      if (week === 1) factors.push('Current trends continue');
      if (week === 2) factors.push('Slight regression expected');
      if (week >= 3) factors.push('Momentum typically fades');
      
      predictions.push({
        week,
        predictedMomentum,
        confidence: Math.max(0.3, 0.9 - week * 0.15),
        factors
      });
    }
    
    return predictions;
  }

  /**
   * Identify momentum triggers
   */
  private identifyMomentumTriggers(team: Team): MomentumTrigger[] {
    const triggers: MomentumTrigger[] = [];
    
    // Key player return from injury
    const injuredStars = team.roster.filter(p => 
      p.projectedPoints > 15 && 
      p.injuryStatus && 
      p.injuryStatus !== 'healthy'
    );
    
    if (injuredStars.length > 0) {
      triggers.push({
        event: `${injuredStars[0].name} returns from injury`,
        impact: 0.3,
        probability: 0.7,
        timing: 'Next 2-3 weeks'
      });
    }
    
    // Easy upcoming matchup
    const currentWeek = Math.max(...team.schedule.map(m => m.week));
    const nextGame = team.schedule.find(m => m.week === currentWeek + 1);
    
    if (nextGame && nextGame.isHome) {
      triggers.push({
        event: 'Home game advantage',
        impact: 0.15,
        probability: 0.8,
        timing: 'Next week'
      });
    }
    
    // Playoff push
    if (currentWeek >= 12) {
      triggers.push({
        event: 'Playoff desperation mode',
        impact: 0.25,
        probability: 0.6,
        timing: 'Remaining season'
      });
    }
    
    // Trade deadline moves (would check actual transactions)
    if (Math.random() > 0.8) { // 20% chance of recent trade
      triggers.push({
        event: 'Recent trade acquisition boost',
        impact: 0.2,
        probability: 0.5,
        timing: 'Next 2-4 weeks'
      });
    }
    
    return triggers;
  }

  /**
   * Helper methods
   */
  private calculateOverallMomentum(components: MomentumComponent[]): number {
    const weightedSum = components.reduce(
      (sum, comp) => sum + comp.value * comp.weight,
      0
    );
    const totalWeight = components.reduce(
      (sum, comp) => sum + comp.weight,
      0
    );
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private determineTrend(
    components: MomentumComponent[],
    streaks: StreakAnalysis
  ): 'hot' | 'cold' | 'neutral' | 'volatile' {
    const momentum = this.calculateOverallMomentum(components);
    const volatility = this.calculateVolatility(components);
    
    if (volatility > 0.5) return 'volatile';
    if (momentum > 0.3) return 'hot';
    if (momentum < -0.3) return 'cold';
    return 'neutral';
  }

  private calculateConfidence(components: MomentumComponent[]): number {
    // Higher confidence when components agree
    const values = components.map(c => c.value);
    const consistency = 1 - this.calculateCV(values);
    
    // Also factor in data quality
    const dataQuality = components.reduce(
      (sum, comp) => sum + comp.weight,
      0
    ) / components.length;
    
    return (consistency * 0.7 + dataQuality * 0.3);
  }

  private getCurrentStreak(games: MatchupSchedule[]): {
    type: 'win' | 'loss' | 'none';
    length: number;
    strength: number;
  } {
    if (games.length === 0) {
      return { type: 'none', length: 0, strength: 0 };
    }
    
    const mostRecentWon = games[games.length - 1].actualScore! > 
      (games[games.length - 1].projectedScore || 100);
    
    let length = 1;
    let totalMargin = Math.abs(
      games[games.length - 1].actualScore! - 
      (games[games.length - 1].projectedScore || 100)
    );
    
    for (let i = games.length - 2; i >= 0; i--) {
      const gameWon = games[i].actualScore! > (games[i].projectedScore || 100);
      if (gameWon === mostRecentWon) {
        length++;
        totalMargin += Math.abs(
          games[i].actualScore! - (games[i].projectedScore || 100)
        );
      } else {
        break;
      }
    }
    
    const avgMargin = totalMargin / length;
    const strength = Math.min(1, avgMargin / 20); // Normalize margin
    
    return {
      type: mostRecentWon ? 'win' : 'loss',
      length,
      strength
    };
  }

  private calculateLinearTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const xSum = (n * (n - 1)) / 2; // 0+1+2+...+(n-1)
    const ySum = values.reduce((a, b) => a + b, 0);
    const xySum = values.reduce((sum, y, x) => sum + x * y, 0);
    const xxSum = (n * (n - 1) * (2 * n - 1)) / 6; // Sum of squares
    
    const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
    return slope;
  }

  private calculateCV(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if (mean === 0) return 0;
    
    const variance = values.reduce(
      (sum, value) => sum + Math.pow(value - mean, 2),
      0
    ) / values.length;
    
    return Math.sqrt(variance) / mean;
  }

  private calculateIndividualPlayerMomentum(player: Player): number {
    if (!player.recentPerformance || player.recentPerformance.length < 3) {
      return 0;
    }
    
    const trend = this.calculateLinearTrend(player.recentPerformance);
    const recent = player.recentPerformance.slice(-3);
    const earlier = player.recentPerformance.slice(0, -3);
    
    if (earlier.length === 0) return trend / 5; // Just trend
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    
    const improvement = (recentAvg - earlierAvg) / (earlierAvg || 1);
    return Math.max(-1, Math.min(1, (trend / 5 + improvement) / 2));
  }

  private getPlayerWeight(player: Player): number {
    const positionWeights = { QB: 1.0, RB: 0.9, WR: 0.7, TE: 0.6, K: 0.3, DEF: 0.4 };
    const positionWeight = positionWeights[player.position] || 0.5;
    const pointsWeight = Math.min(1, player.projectedPoints / 20);
    
    return positionWeight * pointsWeight;
  }

  private isBreakoutCandidate(player: Player): boolean {
    if (!player.recentPerformance || player.recentPerformance.length < 4) {
      return false;
    }
    
    const recent = player.recentPerformance.slice(-2);
    const earlier = player.recentPerformance.slice(0, -2);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    
    return recentAvg > earlierAvg * 1.5 && recentAvg > player.projectedPoints * 1.2;
  }

  private isDecliningPlayer(player: Player): boolean {
    if (!player.recentPerformance || player.recentPerformance.length < 4) {
      return false;
    }
    
    const recent = player.recentPerformance.slice(-3);
    const earlier = player.recentPerformance.slice(0, -3);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    
    return recentAvg < earlierAvg * 0.7 && recentAvg < player.projectedPoints * 0.8;
  }

  private calculateVolatility(components: MomentumComponent[]): number {
    const values = components.map(c => c.value);
    return this.calculateCV(values);
  }
}

export default TeamMomentumTracker;