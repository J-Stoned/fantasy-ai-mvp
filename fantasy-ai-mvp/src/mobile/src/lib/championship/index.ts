/**
 * Championship Probability Engine - Main Export
 * 
 * The ultimate championship probability engine for Fantasy.AI,
 * featuring Monte Carlo simulations, ML predictions, and real-time updates.
 */

// Core Engine
export { default as ChampionshipEngine } from './championship-engine';
export type {
  Team,
  Player,
  MatchupSchedule,
  WeatherData,
  ChampionshipProbability,
  KeyFactor,
  PlayoffPath,
  SimulationResult
} from './championship-engine';

// Analysis Modules
export { default as HistoricalPatternAnalyzer } from './historical-patterns';
export type {
  HistoricalPattern,
  TeamTrends,
  MatchupHistory,
  PlayoffHistory
} from './historical-patterns';

export { default as InjuryImpactModel } from './injury-impact';
export type {
  InjuryAnalysis,
  PlayerInjuryImpact,
  InjuryTimeline,
  DepthAnalysis,
  RecoveryProjection
} from './injury-impact';

export { default as WeatherFactorCalculator } from './weather-factors';
export type {
  WeatherImpact,
  WeatherFactor,
  TeamWeatherProfile,
  HistoricalWeatherPerformance
} from './weather-factors';

export { default as TeamMomentumTracker } from './team-momentum';
export type {
  MomentumAnalysis,
  MomentumComponent,
  StreakAnalysis,
  PlayerMomentumMap,
  MomentumPrediction,
  MomentumTrigger
} from './team-momentum';

export { default as StrengthOfScheduleAnalyzer } from './strength-of-schedule';
export type {
  ScheduleStrength,
  WeekStrength,
  ScheduleStretch,
  BackToBackAnalysis
} from './strength-of-schedule';

// Optimization & Strategy
export { default as ChampionshipPathOptimizer } from './path-optimizer';
export type {
  OptimizationStrategy,
  OptimizationAction,
  ScenarioAnalysis,
  OptimizationReport,
  Recommendation,
  CompetitiveInsight
} from './path-optimizer';

// Real-time & Live Updates
export { default as RealTimeProbabilityUpdater } from './real-time-updater';
export type {
  LiveGameEvent,
  LiveScore,
  ProbabilityUpdate,
  RealTimeConfig
} from './real-time-updater';

// Visualization
export { default as BracketVisualizer } from './bracket-visualizer';

// Utility Functions & Helpers
export * from './utils';

/**
 * Championship Engine Factory
 * 
 * Creates a fully configured championship engine with all modules
 */
export class ChampionshipEngineFactory {
  static create(config?: {
    enableRealTime?: boolean;
    webSocketUrl?: string;
    simulationCount?: number;
    updateInterval?: number;
  }): {
    engine: ChampionshipEngine;
    updater?: RealTimeProbabilityUpdater;
    optimizer: ChampionshipPathOptimizer;
  } {
    const engine = new ChampionshipEngine();
    const optimizer = new ChampionshipPathOptimizer();
    
    let updater: RealTimeProbabilityUpdater | undefined;
    
    if (config?.enableRealTime) {
      updater = new RealTimeProbabilityUpdater(engine, {
        webSocketUrl: config.webSocketUrl,
        updateInterval: config.updateInterval || 30000,
        enableWebSocket: !!config.webSocketUrl,
        enableNotifications: true,
        significantChangeThreshold: 5,
        maxHistoryLength: 1000
      });
    }
    
    return { engine, updater, optimizer };
  }
}

/**
 * Quick Start Helper
 * 
 * Provides a simple interface for basic championship analysis
 */
export class ChampionshipAnalyzer {
  private engine: ChampionshipEngine;
  private optimizer: ChampionshipPathOptimizer;
  
  constructor() {
    this.engine = new ChampionshipEngine();
    this.optimizer = new ChampionshipPathOptimizer();
  }
  
  /**
   * Analyze championship prospects for all teams
   */
  async analyzeLeague(
    teams: Team[],
    currentWeek: number,
    totalWeeks: number = 17
  ): Promise<{
    probabilities: ChampionshipProbability[];
    topContenders: ChampionshipProbability[];
    insights: string[];
  }> {
    const probabilities = await this.engine.calculateChampionshipProbabilities(
      teams,
      currentWeek,
      totalWeeks
    );
    
    const topContenders = probabilities
      .filter(p => p.championshipProbability > 0.1)
      .slice(0, 6);
    
    const insights = this.generateInsights(probabilities, teams);
    
    return { probabilities, topContenders, insights };
  }
  
  /**
   * Get optimization recommendations for a specific team
   */
  async optimizeTeam(
    team: Team,
    allTeams: Team[],
    currentWeek: number
  ): Promise<{
    report: OptimizationReport;
    quickActions: string[];
    riskFactors: string[];
  }> {
    // Get current probability
    const probabilities = await this.engine.calculateChampionshipProbabilities(
      allTeams,
      currentWeek
    );
    
    const teamProbability = probabilities.find(p => p.teamId === team.id);
    if (!teamProbability) {
      throw new Error('Team not found in probability analysis');
    }
    
    // Analyze momentum and injuries (simplified for demo)
    const momentum = {
      overall: 0.1,
      trend: 'neutral' as const,
      confidence: 0.8,
      components: [],
      streaks: {
        current: { type: 'none' as const, length: 0, strength: 0 },
        recent: { wins: 2, losses: 1, period: 3 },
        scoring: { trend: 'flat' as const, change: 0, consistency: 0.7 }
      },
      playerMomentum: { hot: [], cold: [], breakout: [], declining: [], injury_return: [] },
      predictions: [],
      triggers: []
    };
    
    const injuries = {
      teamImpact: -0.05,
      keyInjuries: [],
      positionDepth: new Map(),
      replacementQuality: 0.7,
      recoveryTimeline: [],
      riskScore: 0.3,
      recommendations: []
    };
    
    const report = await this.optimizer.generateOptimizationReport(
      team,
      allTeams,
      teamProbability,
      momentum,
      injuries,
      currentWeek
    );
    
    const quickActions = report.recommendations
      .filter(r => r.difficulty < 0.5)
      .slice(0, 3)
      .map(r => r.action);
    
    const riskFactors = report.competitiveAnalysis
      .filter(c => c.threat > 0.6)
      .map(c => `High threat from Team ${c.opponentId}`);
    
    return { report, quickActions, riskFactors };
  }
  
  /**
   * Generate league insights
   */
  private generateInsights(
    probabilities: ChampionshipProbability[],
    teams: Team[]
  ): string[] {
    const insights: string[] = [];
    
    const topTeam = probabilities[0];
    if (topTeam.championshipProbability > 0.4) {
      insights.push(`Team ${topTeam.teamId} is the heavy championship favorite at ${(topTeam.championshipProbability * 100).toFixed(1)}%`);
    } else {
      insights.push('Championship race is wide open - no clear favorite has emerged');
    }
    
    const playoffContenders = probabilities.filter(p => p.playoffProbability > 0.5).length;
    insights.push(`${playoffContenders} teams have >50% playoff probability`);
    
    const closeRace = probabilities.slice(0, 3).every(p => p.championshipProbability < 0.3);
    if (closeRace) {
      insights.push('Top 3 teams are tightly bunched - small moves could have big impact');
    }
    
    return insights;
  }
}

/**
 * Demo Data Generator
 * 
 * Creates sample data for testing and demonstrations
 */
export class DemoDataGenerator {
  static generateSampleTeams(count: number = 12): Team[] {
    const teams: Team[] = [];
    
    for (let i = 1; i <= count; i++) {
      teams.push({
        id: `team-${i}`,
        name: `Team ${i}`,
        record: {
          wins: Math.floor(Math.random() * 8) + 2,
          losses: Math.floor(Math.random() * 6) + 1
        },
        pointsFor: Math.floor(Math.random() * 400) + 800,
        pointsAgainst: Math.floor(Math.random() * 300) + 700,
        roster: this.generateSampleRoster(),
        schedule: this.generateSampleSchedule(count),
        currentRank: i,
        divisionId: `div-${Math.ceil(i / 4)}`
      });
    }
    
    return teams;
  }
  
  private static generateSampleRoster(): Player[] {
    const positions = ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'K', 'DEF'];
    
    return positions.map((position, index) => ({
      id: `player-${Math.random().toString(36).substr(2, 9)}`,
      name: `${position} Player ${index + 1}`,
      position,
      team: 'NFL Team',
      projectedPoints: this.getProjectedPoints(position),
      recentPerformance: Array.from({ length: 5 }, () => 
        Math.floor(Math.random() * 20) + 5
      ),
      injuryStatus: Math.random() > 0.85 ? 'questionable' : 'healthy',
      consistency: Math.random() * 0.4 + 0.6
    }));
  }
  
  private static getProjectedPoints(position: string): number {
    const baselines = { QB: 18, RB: 12, WR: 10, TE: 8, K: 8, DEF: 8 };
    const base = baselines[position] || 10;
    return base + Math.floor(Math.random() * 8) - 2;
  }
  
  private static generateSampleSchedule(teamCount: number): MatchupSchedule[] {
    const schedule: MatchupSchedule[] = [];
    
    for (let week = 1; week <= 17; week++) {
      const opponentId = `team-${Math.floor(Math.random() * teamCount) + 1}`;
      const actualScore = week <= 10 ? Math.floor(Math.random() * 50) + 80 : undefined;
      
      schedule.push({
        week,
        opponentId,
        isHome: Math.random() > 0.5,
        projectedScore: Math.floor(Math.random() * 30) + 100,
        actualScore,
        weatherConditions: Math.random() > 0.8 ? {
          temperature: Math.floor(Math.random() * 60) + 20,
          windSpeed: Math.floor(Math.random() * 25),
          precipitation: Math.random() * 0.5,
          dome: Math.random() > 0.7
        } : undefined
      });
    }
    
    return schedule;
  }
}