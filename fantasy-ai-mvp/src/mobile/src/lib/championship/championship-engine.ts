/**
 * Championship Probability Engine
 * 
 * Advanced Monte Carlo simulation engine for calculating championship probabilities
 * using statistical analysis, ML predictions, and real-time data.
 */

import { HistoricalPatternAnalyzer } from './historical-patterns';
import { InjuryImpactModel } from './injury-impact';
import { WeatherFactorCalculator } from './weather-factors';
import { TeamMomentumTracker } from './team-momentum';
import { StrengthOfScheduleAnalyzer } from './strength-of-schedule';

export interface Team {
  id: string;
  name: string;
  record: { wins: number; losses: number; ties?: number };
  pointsFor: number;
  pointsAgainst: number;
  roster: Player[];
  schedule: MatchupSchedule[];
  currentRank: number;
  divisionId: string;
}

export interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  projectedPoints: number;
  recentPerformance: number[];
  injuryStatus?: 'healthy' | 'questionable' | 'doubtful' | 'out';
  consistency: number; // 0-1 score
}

export interface MatchupSchedule {
  week: number;
  opponentId: string;
  isHome: boolean;
  projectedScore?: number;
  actualScore?: number;
  weatherConditions?: WeatherData;
}

export interface WeatherData {
  temperature: number;
  windSpeed: number;
  precipitation: number;
  dome: boolean;
}

export interface ChampionshipProbability {
  teamId: string;
  playoffProbability: number;
  divisionWinProbability: number;
  championshipProbability: number;
  expectedSeed: number;
  strengthOfSchedule: number;
  momentum: number;
  keyFactors: KeyFactor[];
  optimalPath: PlayoffPath;
  simulations: SimulationResult[];
}

export interface KeyFactor {
  factor: string;
  impact: number; // -1 to 1
  description: string;
  confidence: number; // 0-1
}

export interface PlayoffPath {
  seed: number;
  round1: { opponent: string; winProbability: number };
  round2: { opponent: string; winProbability: number };
  championship: { opponent: string; winProbability: number };
  totalProbability: number;
}

export interface SimulationResult {
  seed: number;
  madePlayoffs: boolean;
  wonDivision: boolean;
  playoffWins: number;
  wonChampionship: boolean;
  finalRank: number;
  path: string[];
}

export class ChampionshipEngine {
  private historicalAnalyzer: HistoricalPatternAnalyzer;
  private injuryModel: InjuryImpactModel;
  private weatherCalculator: WeatherFactorCalculator;
  private momentumTracker: TeamMomentumTracker;
  private scheduleAnalyzer: StrengthOfScheduleAnalyzer;
  
  private readonly SIMULATION_COUNT = 10000;
  private readonly PLAYOFF_TEAMS = 6; // Configurable
  
  constructor() {
    this.historicalAnalyzer = new HistoricalPatternAnalyzer();
    this.injuryModel = new InjuryImpactModel();
    this.weatherCalculator = new WeatherFactorCalculator();
    this.momentumTracker = new TeamMomentumTracker();
    this.scheduleAnalyzer = new StrengthOfScheduleAnalyzer();
  }

  /**
   * Calculate championship probabilities for all teams
   */
  async calculateChampionshipProbabilities(
    teams: Team[],
    currentWeek: number,
    totalWeeks: number
  ): Promise<ChampionshipProbability[]> {
    const results: ChampionshipProbability[] = [];
    
    // Run Monte Carlo simulations
    const simulations = await this.runMonteCarloSimulations(
      teams,
      currentWeek,
      totalWeeks
    );
    
    // Calculate probabilities for each team
    for (const team of teams) {
      const teamSimulations = simulations.filter(s => s.teamId === team.id);
      const probability = this.calculateTeamProbabilities(
        team,
        teamSimulations,
        teams,
        currentWeek
      );
      results.push(probability);
    }
    
    return results.sort((a, b) => 
      b.championshipProbability - a.championshipProbability
    );
  }

  /**
   * Run Monte Carlo simulations for all possible season outcomes
   */
  private async runMonteCarloSimulations(
    teams: Team[],
    currentWeek: number,
    totalWeeks: number
  ): Promise<SimulationResult[]> {
    const allSimulations: SimulationResult[] = [];
    
    for (let sim = 0; sim < this.SIMULATION_COUNT; sim++) {
      const seasonResult = await this.simulateSeason(
        teams,
        currentWeek,
        totalWeeks
      );
      allSimulations.push(...seasonResult);
    }
    
    return allSimulations;
  }

  /**
   * Simulate one complete season
   */
  private async simulateSeason(
    teams: Team[],
    currentWeek: number,
    totalWeeks: number
  ): Promise<SimulationResult[]> {
    // Clone teams to avoid mutation
    const simTeams = teams.map(t => ({ ...t, simRecord: { ...t.record } }));
    
    // Simulate remaining regular season games
    for (let week = currentWeek + 1; week <= totalWeeks; week++) {
      await this.simulateWeek(simTeams, week);
    }
    
    // Determine playoff teams
    const playoffTeams = this.determinePlayoffTeams(simTeams);
    
    // Simulate playoffs
    const playoffResults = await this.simulatePlayoffs(playoffTeams);
    
    // Create simulation results
    return simTeams.map(team => ({
      teamId: team.id,
      seed: playoffTeams.findIndex(t => t.id === team.id) + 1 || 0,
      madePlayoffs: playoffTeams.some(t => t.id === team.id),
      wonDivision: this.wonDivision(team, simTeams),
      playoffWins: playoffResults[team.id]?.wins || 0,
      wonChampionship: playoffResults.championId === team.id,
      finalRank: this.calculateFinalRank(team, simTeams, playoffResults),
      path: playoffResults[team.id]?.path || []
    }));
  }

  /**
   * Simulate a single week of games
   */
  private async simulateWeek(teams: any[], week: number): Promise<void> {
    for (const team of teams) {
      const matchup = team.schedule.find((m: MatchupSchedule) => m.week === week);
      if (!matchup) continue;
      
      const opponent = teams.find(t => t.id === matchup.opponentId);
      if (!opponent) continue;
      
      // Calculate win probability based on multiple factors
      const winProbability = await this.calculateWinProbability(
        team,
        opponent,
        matchup
      );
      
      // Simulate game outcome
      const won = Math.random() < winProbability;
      if (won) {
        team.simRecord.wins++;
      } else {
        team.simRecord.losses++;
      }
    }
  }

  /**
   * Calculate win probability for a matchup
   */
  private async calculateWinProbability(
    team: any,
    opponent: any,
    matchup: MatchupSchedule
  ): Promise<number> {
    let probability = 0.5; // Base probability
    
    // Team strength differential
    const teamStrength = this.calculateTeamStrength(team);
    const opponentStrength = this.calculateTeamStrength(opponent);
    const strengthDiff = teamStrength - opponentStrength;
    probability += strengthDiff * 0.3;
    
    // Home field advantage
    if (matchup.isHome) {
      probability += 0.03;
    }
    
    // Injury impact
    const injuryImpact = await this.injuryModel.calculateImpact(
      team.roster,
      opponent.roster
    );
    probability += injuryImpact * 0.2;
    
    // Weather impact (for outdoor games)
    if (matchup.weatherConditions) {
      const weatherImpact = this.weatherCalculator.calculateImpact(
        team,
        matchup.weatherConditions
      );
      probability += weatherImpact * 0.1;
    }
    
    // Team momentum
    const momentum = this.momentumTracker.calculateMomentum(team);
    probability += momentum * 0.15;
    
    // Historical patterns
    const historicalEdge = await this.historicalAnalyzer.getMatchupEdge(
      team,
      opponent
    );
    probability += historicalEdge * 0.1;
    
    // Ensure probability is between 0 and 1
    return Math.max(0, Math.min(1, probability));
  }

  /**
   * Calculate team strength based on various metrics
   */
  private calculateTeamStrength(team: any): number {
    const winPercentage = team.simRecord.wins / 
      (team.simRecord.wins + team.simRecord.losses);
    
    const pointsDifferential = 
      (team.pointsFor - team.pointsAgainst) / 
      (team.simRecord.wins + team.simRecord.losses);
    
    const rosterStrength = team.roster.reduce(
      (sum: number, player: Player) => sum + player.projectedPoints,
      0
    ) / team.roster.length;
    
    return (
      winPercentage * 0.4 +
      (pointsDifferential / 100) * 0.3 +
      (rosterStrength / 20) * 0.3
    );
  }

  /**
   * Determine playoff teams based on records and tiebreakers
   */
  private determinePlayoffTeams(teams: any[]): any[] {
    // Sort by record, then by points for (tiebreaker)
    const sorted = [...teams].sort((a, b) => {
      const aWinPct = a.simRecord.wins / (a.simRecord.wins + a.simRecord.losses);
      const bWinPct = b.simRecord.wins / (b.simRecord.wins + b.simRecord.losses);
      
      if (aWinPct !== bWinPct) {
        return bWinPct - aWinPct;
      }
      
      return b.pointsFor - a.pointsFor;
    });
    
    return sorted.slice(0, this.PLAYOFF_TEAMS);
  }

  /**
   * Simulate playoff bracket
   */
  private async simulatePlayoffs(teams: any[]): Promise<any> {
    const results: any = { championId: null };
    
    // Seed teams
    const bracket = teams.map((team, index) => ({
      ...team,
      seed: index + 1,
      wins: 0,
      path: []
    }));
    
    // First round byes for top 2 seeds
    const round1Winners = [
      bracket[0], // 1 seed bye
      bracket[1], // 2 seed bye
      await this.simulatePlayoffGame(bracket[2], bracket[5]), // 3 vs 6
      await this.simulatePlayoffGame(bracket[3], bracket[4])  // 4 vs 5
    ];
    
    // Semi-finals
    const round2Winners = [
      await this.simulatePlayoffGame(round1Winners[0], round1Winners[3]), // 1 vs 4/5
      await this.simulatePlayoffGame(round1Winners[1], round1Winners[2])  // 2 vs 3/6
    ];
    
    // Championship
    const champion = await this.simulatePlayoffGame(round2Winners[0], round2Winners[1]);
    results.championId = champion.id;
    
    // Track results
    bracket.forEach(team => {
      results[team.id] = {
        wins: team.wins,
        path: team.path
      };
    });
    
    return results;
  }

  /**
   * Simulate a single playoff game
   */
  private async simulatePlayoffGame(team1: any, team2: any): Promise<any> {
    const winProbability = await this.calculateWinProbability(
      team1,
      team2,
      { week: 99, opponentId: team2.id, isHome: team1.seed < team2.seed }
    );
    
    const team1Wins = Math.random() < winProbability;
    const winner = team1Wins ? team1 : team2;
    const loser = team1Wins ? team2 : team1;
    
    winner.wins++;
    winner.path.push(`Defeated ${loser.name}`);
    
    return winner;
  }

  /**
   * Calculate team-specific probabilities from simulations
   */
  private calculateTeamProbabilities(
    team: Team,
    simulations: SimulationResult[],
    allTeams: Team[],
    currentWeek: number
  ): ChampionshipProbability {
    const totalSims = simulations.length;
    
    const madePlayoffs = simulations.filter(s => s.madePlayoffs).length;
    const wonDivision = simulations.filter(s => s.wonDivision).length;
    const wonChampionship = simulations.filter(s => s.wonChampionship).length;
    
    const avgSeed = simulations
      .filter(s => s.madePlayoffs)
      .reduce((sum, s) => sum + s.seed, 0) / (madePlayoffs || 1);
    
    // Calculate key factors
    const keyFactors = this.identifyKeyFactors(team, allTeams, currentWeek);
    
    // Calculate optimal path
    const optimalPath = this.calculateOptimalPath(team, allTeams, simulations);
    
    // Calculate strength of schedule
    const strengthOfSchedule = this.scheduleAnalyzer.analyze(
      team,
      allTeams,
      currentWeek
    );
    
    // Get team momentum
    const momentum = this.momentumTracker.calculateMomentum(team);
    
    return {
      teamId: team.id,
      playoffProbability: madePlayoffs / totalSims,
      divisionWinProbability: wonDivision / totalSims,
      championshipProbability: wonChampionship / totalSims,
      expectedSeed: avgSeed,
      strengthOfSchedule,
      momentum,
      keyFactors,
      optimalPath,
      simulations: simulations.slice(0, 100) // Sample for visualization
    };
  }

  /**
   * Identify key factors affecting championship probability
   */
  private identifyKeyFactors(
    team: Team,
    allTeams: Team[],
    currentWeek: number
  ): KeyFactor[] {
    const factors: KeyFactor[] = [];
    
    // Current standing factor
    const standingImpact = this.calculateStandingImpact(team, allTeams);
    factors.push({
      factor: 'Current Standing',
      impact: standingImpact,
      description: `Rank ${team.currentRank} of ${allTeams.length}`,
      confidence: 0.9
    });
    
    // Injury factor
    const injuryCount = team.roster.filter(
      p => p.injuryStatus && p.injuryStatus !== 'healthy'
    ).length;
    const injuryImpact = -injuryCount * 0.1;
    factors.push({
      factor: 'Team Health',
      impact: injuryImpact,
      description: `${injuryCount} injured players`,
      confidence: 0.8
    });
    
    // Schedule difficulty
    const remainingSchedule = team.schedule.filter(m => m.week > currentWeek);
    const scheduleImpact = this.calculateScheduleImpact(
      remainingSchedule,
      allTeams
    );
    factors.push({
      factor: 'Remaining Schedule',
      impact: scheduleImpact,
      description: `${scheduleImpact > 0 ? 'Easier' : 'Harder'} than average`,
      confidence: 0.7
    });
    
    // Roster strength
    const rosterImpact = this.calculateRosterImpact(team, allTeams);
    factors.push({
      factor: 'Roster Strength',
      impact: rosterImpact,
      description: `Top ${Math.round((1 - rosterImpact) * 100)}% roster`,
      confidence: 0.85
    });
    
    // Momentum
    const momentum = this.momentumTracker.calculateMomentum(team);
    factors.push({
      factor: 'Team Momentum',
      impact: momentum,
      description: momentum > 0 ? 'Trending upward' : 'Trending downward',
      confidence: 0.75
    });
    
    return factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  }

  /**
   * Calculate optimal playoff path
   */
  private calculateOptimalPath(
    team: Team,
    allTeams: Team[],
    simulations: SimulationResult[]
  ): PlayoffPath {
    // Find most common successful path
    const championshipPaths = simulations
      .filter(s => s.teamId === team.id && s.wonChampionship)
      .map(s => ({
        seed: s.seed,
        path: s.path
      }));
    
    if (championshipPaths.length === 0) {
      return this.getDefaultPath(team, allTeams);
    }
    
    // Analyze most successful seed
    const seedCounts = championshipPaths.reduce((acc, p) => {
      acc[p.seed] = (acc[p.seed] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const optimalSeed = Object.entries(seedCounts)
      .sort(([, a], [, b]) => b - a)[0][0];
    
    return this.buildOptimalPath(parseInt(optimalSeed), team, allTeams);
  }

  /**
   * Helper methods
   */
  private wonDivision(team: any, teams: any[]): boolean {
    const divisionTeams = teams.filter(t => t.divisionId === team.divisionId);
    const sorted = divisionTeams.sort((a, b) => {
      const aWins = a.simRecord.wins;
      const bWins = b.simRecord.wins;
      return bWins - aWins;
    });
    return sorted[0].id === team.id;
  }

  private calculateFinalRank(team: any, teams: any[], playoffResults: any): number {
    if (playoffResults.championId === team.id) return 1;
    if (team.wins === 2) return 2; // Runner-up
    if (team.wins === 1) return 3 + (team.seed > 2 ? 1 : 0); // 3rd or 4th
    if (team.madePlayoffs) return 5 + (6 - team.seed); // 5th or 6th
    
    // Regular season rank
    const nonPlayoffTeams = teams
      .filter(t => !playoffResults[t.id])
      .sort((a, b) => {
        const aWins = a.simRecord.wins;
        const bWins = b.simRecord.wins;
        return bWins - aWins;
      });
    
    return 7 + nonPlayoffTeams.findIndex(t => t.id === team.id);
  }

  private calculateStandingImpact(team: Team, allTeams: Team[]): number {
    const position = team.currentRank;
    const total = allTeams.length;
    return 1 - (position / total);
  }

  private calculateScheduleImpact(
    schedule: MatchupSchedule[],
    allTeams: Team[]
  ): number {
    if (schedule.length === 0) return 0;
    
    const avgOpponentRank = schedule.reduce((sum, matchup) => {
      const opponent = allTeams.find(t => t.id === matchup.opponentId);
      return sum + (opponent?.currentRank || allTeams.length / 2);
    }, 0) / schedule.length;
    
    const leagueAvg = allTeams.length / 2;
    return (avgOpponentRank - leagueAvg) / leagueAvg;
  }

  private calculateRosterImpact(team: Team, allTeams: Team[]): number {
    const teamStrength = team.roster.reduce(
      (sum, player) => sum + player.projectedPoints,
      0
    );
    
    const allStrengths = allTeams.map(t =>
      t.roster.reduce((sum, player) => sum + player.projectedPoints, 0)
    );
    
    const rank = allStrengths.filter(s => s > teamStrength).length + 1;
    return rank / allTeams.length;
  }

  private getDefaultPath(team: Team, allTeams: Team[]): PlayoffPath {
    const estimatedSeed = Math.min(6, Math.max(1, team.currentRank));
    return this.buildOptimalPath(estimatedSeed, team, allTeams);
  }

  private buildOptimalPath(
    seed: number,
    team: Team,
    allTeams: Team[]
  ): PlayoffPath {
    // Build path based on seed
    const path: PlayoffPath = {
      seed,
      round1: { opponent: '', winProbability: 0 },
      round2: { opponent: '', winProbability: 0 },
      championship: { opponent: '', winProbability: 0 },
      totalProbability: 0
    };
    
    // Calculate matchups based on seed
    if (seed <= 2) {
      // Bye week
      path.round1 = { opponent: 'BYE', winProbability: 1.0 };
    } else if (seed === 3) {
      path.round1 = { opponent: '6th Seed', winProbability: 0.65 };
    } else if (seed === 4) {
      path.round1 = { opponent: '5th Seed', winProbability: 0.55 };
    } else if (seed === 5) {
      path.round1 = { opponent: '4th Seed', winProbability: 0.45 };
    } else {
      path.round1 = { opponent: '3rd Seed', winProbability: 0.35 };
    }
    
    // Semi-final matchups
    if (seed === 1) {
      path.round2 = { opponent: '4/5 Winner', winProbability: 0.7 };
    } else if (seed === 2) {
      path.round2 = { opponent: '3/6 Winner', winProbability: 0.65 };
    } else {
      path.round2 = { 
        opponent: seed <= 3 ? '2nd Seed' : '1st Seed', 
        winProbability: seed <= 3 ? 0.35 : 0.3 
      };
    }
    
    // Championship
    path.championship = { 
      opponent: 'Conference Winner', 
      winProbability: 0.5 - (seed - 3.5) * 0.05 
    };
    
    // Calculate total probability
    path.totalProbability = 
      path.round1.winProbability *
      path.round2.winProbability *
      path.championship.winProbability;
    
    return path;
  }

  /**
   * Update probabilities with live game data
   */
  async updateLiveProbabilities(
    teams: Team[],
    liveScores: Map<string, number>,
    currentWeek: number,
    totalWeeks: number
  ): Promise<ChampionshipProbability[]> {
    // Update team scores with live data
    const updatedTeams = teams.map(team => {
      const liveScore = liveScores.get(team.id);
      if (liveScore !== undefined) {
        const matchup = team.schedule.find(m => m.week === currentWeek);
        if (matchup) {
          matchup.projectedScore = liveScore;
        }
      }
      return team;
    });
    
    // Recalculate with updated projections
    return this.calculateChampionshipProbabilities(
      updatedTeams,
      currentWeek,
      totalWeeks
    );
  }
}

export default ChampionshipEngine;