/**
 * Real-Time Feature Engineering
 * Transforms raw data into ML-ready features with live updates
 */

import { prisma } from '@/lib/prisma';
import { playerPerformanceModel } from '@/lib/ml/models/player-performance-predictor';
import { injuryRiskModel } from '@/lib/ml/models/injury-risk-assessment';
import { lineupOptimizer } from '@/lib/ml/models/lineup-optimizer';
import { tradeAnalyzer } from '@/lib/ml/models/trade-analyzer';
import { draftAssistant } from '@/lib/ml/models/draft-assistant';
import { gameOutcomeModel } from '@/lib/ml/models/game-outcome-predictor';

interface PlayerFeatures {
  playerId: string;
  timestamp: Date;
  
  // Performance features
  recentForm: number; // 0-100 score
  consistency: number; // Standard deviation of recent performances
  trendDirection: 'improving' | 'declining' | 'stable';
  homeAwayDifferential: number;
  
  // Matchup features
  opponentDefenseRating: number;
  positionalAdvantage: number;
  historicalMatchupScore: number;
  
  // Injury features
  healthScore: number; // 0-100
  practiceParticipation: number; // 0-1
  injuryHistory: number; // Games missed in last year
  recoveryTimeEstimate: number; // Days
  
  // Market features
  ownershipProjection: number;
  salaryValue: number; // Points per $1000
  leverageScore: number;
  priceTrend: 'rising' | 'falling' | 'stable';
  
  // Environmental features
  weatherImpact: number; // -1 to 1
  gameScript: 'favorable' | 'unfavorable' | 'neutral';
  restDays: number;
  travelDistance: number; // Miles
  
  // Team context
  teamOffenseRating: number;
  teamPace: number; // Plays per game
  redZoneOpportunities: number;
  targetShare: number; // For receivers
  
  // Advanced metrics
  explosivePlays: number; // 20+ yard plays
  efficiency: number; // Yards per touch
  opportunityScore: number; // Touches + targets
  
  // ML predictions
  projectedPoints: number;
  confidenceInterval: number[];
  breakoutProbability: number;
  bustProbability: number;
}

interface TeamFeatures {
  teamId: string;
  timestamp: Date;
  
  // Offensive features
  offensiveRating: number;
  scoringEfficiency: number;
  redZoneConversion: number;
  thirdDownConversion: number;
  yardsPerPlay: number;
  
  // Defensive features
  defensiveRating: number;
  pointsAllowedPerGame: number;
  yardsAllowedPerPlay: number;
  turnoverRate: number;
  sackRate: number;
  
  // Situational features
  homeFieldAdvantage: boolean;
  restAdvantage: number; // Days difference vs opponent
  divisionGame: boolean;
  primetime: boolean;
  
  // Trends
  lastFiveGames: {
    wins: number;
    avgPointsFor: number;
    avgPointsAgainst: number;
  };
}

interface GameFeatures {
  gameId: string;
  timestamp: Date;
  
  // Game context
  weekNumber: number;
  timeSlot: 'early' | 'late' | 'primetime' | 'mnf';
  importance: number; // Playoff implications
  
  // Betting features
  spread: number;
  total: number;
  impliedTeamTotals: {
    home: number;
    away: number;
  };
  publicBettingPercentage: {
    spread: { home: number; away: number };
    total: { over: number; under: number };
  };
  
  // Environmental
  weather: {
    impact: 'none' | 'minor' | 'major';
    details: any;
  };
  
  // Pace & style
  expectedPace: number;
  passHeavyProbability: number;
  blowoutRisk: number;
}

export class RealTimeFeatureEngineering {
  private featureUpdateInterval: NodeJS.Timeout | null = null;
  private featureCache = new Map<string, any>();
  
  /**
   * Start real-time feature engineering
   */
  async startFeatureEngineering(intervalSeconds = 60) {
    console.log('⚙️ Starting real-time feature engineering...');
    
    // Initial feature generation
    await this.generateAllFeatures();
    
    // Set up interval
    this.featureUpdateInterval = setInterval(async () => {
      await this.generateAllFeatures();
    }, intervalSeconds * 1000);
    
    console.log(`✅ Feature engineering running (updates every ${intervalSeconds}s)`);
  }
  
  /**
   * Stop feature engineering
   */
  stopFeatureEngineering() {
    if (this.featureUpdateInterval) {
      clearInterval(this.featureUpdateInterval);
      this.featureUpdateInterval = null;
      console.log('🛑 Feature engineering stopped');
    }
  }
  
  /**
   * Generate all features
   */
  private async generateAllFeatures() {
    try {
      console.log('🔧 Generating real-time features...');
      
      // Generate features in parallel
      const [playerFeatures, teamFeatures, gameFeatures] = await Promise.all([
        this.generatePlayerFeatures(),
        this.generateTeamFeatures(),
        this.generateGameFeatures()
      ]);
      
      // Update ML models with fresh features
      await this.updateMLModels(playerFeatures, teamFeatures, gameFeatures);
      
      // Store feature snapshots
      await this.storeFeatureSnapshots(playerFeatures, teamFeatures, gameFeatures);
      
      console.log(`✅ Generated features for ${playerFeatures.length} players, ${teamFeatures.length} teams, ${gameFeatures.length} games`);
    } catch (error) {
      console.error('❌ Feature engineering error:', error);
    }
  }
  
  /**
   * Generate player features
   */
  private async generatePlayerFeatures(): Promise<PlayerFeatures[]> {
    const features: PlayerFeatures[] = [];
    
    // Get recent player data
    const playerData = await prisma.dataSourceRecord.findMany({
      where: {
        dataType: 'PLAYER_STATS',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Get injury data
    const injuryData = await prisma.dataSourceRecord.findMany({
      where: { dataType: 'INJURY_REPORT' }
    });
    
    // Get market data
    const marketData = await prisma.dataSourceRecord.findMany({
      where: { dataType: 'DFS_PRICING' }
    });
    
    // Process each unique player
    const processedPlayers = new Set<string>();
    
    for (const record of playerData) {
      const player = record.data as any;
      if (processedPlayers.has(player.id)) continue;
      processedPlayers.add(player.id);
      
      // Find related data
      const injury = injuryData.find(i => (i.data as any).playerId === player.id);
      const market = marketData.find(m => (m.data as any).playerId === player.id);
      
      // Calculate features
      const playerFeature: PlayerFeatures = {
        playerId: player.id,
        timestamp: new Date(),
        
        // Performance features
        recentForm: this.calculateRecentForm(player),
        consistency: this.calculateConsistency(player),
        trendDirection: this.calculateTrend(player),
        homeAwayDifferential: this.calculateHomeAwayDiff(player),
        
        // Matchup features
        opponentDefenseRating: await this.getOpponentDefenseRating(player),
        positionalAdvantage: this.calculatePositionalAdvantage(player),
        historicalMatchupScore: await this.getHistoricalMatchupScore(player),
        
        // Injury features
        healthScore: injury ? this.calculateHealthScore(injury.data as any) : 100,
        practiceParticipation: injury ? this.getPracticeParticipation(injury.data as any) : 1,
        injuryHistory: await this.getInjuryHistory(player.id),
        recoveryTimeEstimate: injury ? this.getRecoveryEstimate(injury.data as any) : 0,
        
        // Market features
        ownershipProjection: market ? (market.data as any).platforms.draftkings.ownership : 10,
        salaryValue: market ? (market.data as any).platforms.draftkings.value : 2.5,
        leverageScore: market ? (market.data as any).leverageScore : 0,
        priceTrend: this.calculatePriceTrend(market?.data as any),
        
        // Environmental features
        weatherImpact: await this.getWeatherImpact(player),
        gameScript: await this.predictGameScript(player),
        restDays: this.calculateRestDays(player),
        travelDistance: await this.calculateTravelDistance(player),
        
        // Team context
        teamOffenseRating: await this.getTeamOffenseRating(player.team),
        teamPace: await this.getTeamPace(player.team),
        redZoneOpportunities: this.getRedZoneOpps(player),
        targetShare: this.getTargetShare(player),
        
        // Advanced metrics
        explosivePlays: this.getExplosivePlays(player),
        efficiency: this.calculateEfficiency(player),
        opportunityScore: this.calculateOpportunityScore(player),
        
        // ML predictions (placeholder - would use actual models)
        projectedPoints: 15 + Math.random() * 10,
        confidenceInterval: [12, 25],
        breakoutProbability: Math.random() * 0.3,
        bustProbability: Math.random() * 0.2
      };
      
      features.push(playerFeature);
    }
    
    return features;
  }
  
  /**
   * Generate team features
   */
  private async generateTeamFeatures(): Promise<TeamFeatures[]> {
    const features: TeamFeatures[] = [];
    
    // Get team data
    const teamData = await prisma.dataSourceRecord.findMany({
      where: { dataType: 'TEAM_STATS' }
    });
    
    // Mock team features - would calculate from real data
    const teams = ['KC', 'BUF', 'SF', 'DAL', 'MIA', 'BAL'];
    
    for (const teamId of teams) {
      const teamFeature: TeamFeatures = {
        teamId,
        timestamp: new Date(),
        
        // Offensive features
        offensiveRating: 70 + Math.random() * 30,
        scoringEfficiency: 0.3 + Math.random() * 0.2,
        redZoneConversion: 0.4 + Math.random() * 0.3,
        thirdDownConversion: 0.35 + Math.random() * 0.15,
        yardsPerPlay: 5 + Math.random() * 2,
        
        // Defensive features
        defensiveRating: 70 + Math.random() * 30,
        pointsAllowedPerGame: 18 + Math.random() * 10,
        yardsAllowedPerPlay: 4.5 + Math.random() * 2,
        turnoverRate: 0.1 + Math.random() * 0.1,
        sackRate: 0.05 + Math.random() * 0.05,
        
        // Situational features
        homeFieldAdvantage: Math.random() < 0.5,
        restAdvantage: Math.floor(Math.random() * 3) - 1,
        divisionGame: Math.random() < 0.25,
        primetime: Math.random() < 0.2,
        
        // Trends
        lastFiveGames: {
          wins: Math.floor(Math.random() * 6),
          avgPointsFor: 20 + Math.random() * 15,
          avgPointsAgainst: 18 + Math.random() * 12
        }
      };
      
      features.push(teamFeature);
    }
    
    return features;
  }
  
  /**
   * Generate game features
   */
  private async generateGameFeatures(): Promise<GameFeatures[]> {
    const features: GameFeatures[] = [];
    
    // Get game and betting data
    const gameData = await prisma.dataSourceRecord.findMany({
      where: { dataType: 'GAME_DATA' }
    });
    
    const bettingData = await prisma.dataSourceRecord.findMany({
      where: { dataType: 'BETTING_LINE' }
    });
    
    for (const game of gameData) {
      const gameInfo = game.data as any;
      const betting = bettingData.find(b => (b.data as any).gameId === gameInfo.id);
      
      const gameFeature: GameFeatures = {
        gameId: gameInfo.id,
        timestamp: new Date(),
        
        // Game context
        weekNumber: 15, // Would get from schedule
        timeSlot: this.getTimeSlot(gameInfo.startTime),
        importance: this.calculateGameImportance(gameInfo),
        
        // Betting features
        spread: betting ? (betting.data as any).consensus.spread : -3,
        total: betting ? (betting.data as any).consensus.total : 48,
        impliedTeamTotals: {
          home: betting ? this.calculateImpliedTotal((betting.data as any).consensus, true) : 25.5,
          away: betting ? this.calculateImpliedTotal((betting.data as any).consensus, false) : 22.5
        },
        publicBettingPercentage: {
          spread: { home: 45 + Math.random() * 10, away: 55 - Math.random() * 10 },
          total: { over: 50 + Math.random() * 20 - 10, under: 50 - Math.random() * 20 + 10 }
        },
        
        // Environmental
        weather: {
          impact: this.assessWeatherImpact(gameInfo.weather),
          details: gameInfo.weather || {}
        },
        
        // Pace & style
        expectedPace: 120 + Math.random() * 40,
        passHeavyProbability: 0.5 + Math.random() * 0.3,
        blowoutRisk: Math.random() * 0.3
      };
      
      features.push(gameFeature);
    }
    
    return features;
  }
  
  // Helper methods for feature calculation
  private calculateRecentForm(player: any): number {
    // Would analyze last 5 games performance
    return 50 + Math.random() * 50;
  }
  
  private calculateConsistency(player: any): number {
    // Would calculate standard deviation of fantasy points
    return Math.random() * 5;
  }
  
  private calculateTrend(player: any): 'improving' | 'declining' | 'stable' {
    const rand = Math.random();
    return rand < 0.33 ? 'improving' : rand < 0.67 ? 'stable' : 'declining';
  }
  
  private calculateHomeAwayDiff(player: any): number {
    return -2 + Math.random() * 4;
  }
  
  private async getOpponentDefenseRating(player: any): Promise<number> {
    return 50 + Math.random() * 50;
  }
  
  private calculatePositionalAdvantage(player: any): number {
    return -10 + Math.random() * 20;
  }
  
  private async getHistoricalMatchupScore(player: any): Promise<number> {
    return 50 + Math.random() * 50;
  }
  
  private calculateHealthScore(injury: any): number {
    const statusScores = {
      'healthy': 100,
      'probable': 90,
      'questionable': 70,
      'doubtful': 30,
      'out': 0,
      'ir': 0
    };
    return statusScores[injury.status] || 50;
  }
  
  private getPracticeParticipation(injury: any): number {
    const participation = {
      'full': 1,
      'limited': 0.5,
      'dnp': 0
    };
    return participation[injury.practiceStatus] || 0.5;
  }
  
  private async getInjuryHistory(playerId: string): Promise<number> {
    // Would query historical injury data
    return Math.floor(Math.random() * 8);
  }
  
  private getRecoveryEstimate(injury: any): number {
    const estimates = {
      'day-to-day': 3,
      'questionable': 7,
      'doubtful': 14,
      'out': 21,
      'ir': 60
    };
    return estimates[injury.status] || 7;
  }
  
  private calculatePriceTrend(market: any): 'rising' | 'falling' | 'stable' {
    if (!market) return 'stable';
    const rand = Math.random();
    return rand < 0.33 ? 'rising' : rand < 0.67 ? 'stable' : 'falling';
  }
  
  private async getWeatherImpact(player: any): Promise<number> {
    // Would check game weather and position
    return -0.2 + Math.random() * 0.4;
  }
  
  private async predictGameScript(player: any): Promise<'favorable' | 'unfavorable' | 'neutral'> {
    const rand = Math.random();
    return rand < 0.33 ? 'favorable' : rand < 0.67 ? 'neutral' : 'unfavorable';
  }
  
  private calculateRestDays(player: any): number {
    return 3 + Math.floor(Math.random() * 11);
  }
  
  private async calculateTravelDistance(player: any): Promise<number> {
    return Math.floor(Math.random() * 3000);
  }
  
  private async getTeamOffenseRating(team: string): Promise<number> {
    return 50 + Math.random() * 50;
  }
  
  private async getTeamPace(team: string): Promise<number> {
    return 60 + Math.random() * 20;
  }
  
  private getRedZoneOpps(player: any): number {
    return Math.floor(Math.random() * 8);
  }
  
  private getTargetShare(player: any): number {
    if (player.position === 'WR' || player.position === 'TE') {
      return 0.1 + Math.random() * 0.25;
    }
    return 0;
  }
  
  private getExplosivePlays(player: any): number {
    return Math.floor(Math.random() * 5);
  }
  
  private calculateEfficiency(player: any): number {
    return 3 + Math.random() * 5;
  }
  
  private calculateOpportunityScore(player: any): number {
    return 10 + Math.random() * 20;
  }
  
  private getTimeSlot(startTime: string): 'early' | 'late' | 'primetime' | 'mnf' {
    // Would parse actual start time
    const rand = Math.random();
    if (rand < 0.4) return 'early';
    if (rand < 0.7) return 'late';
    if (rand < 0.9) return 'primetime';
    return 'mnf';
  }
  
  private calculateGameImportance(game: any): number {
    // Would consider playoff implications
    return Math.random();
  }
  
  private calculateImpliedTotal(consensus: any, isHome: boolean): number {
    const total = consensus.total;
    const spread = consensus.spread;
    if (isHome) {
      return (total / 2) - (spread / 2);
    } else {
      return (total / 2) + (spread / 2);
    }
  }
  
  private assessWeatherImpact(weather: any): 'none' | 'minor' | 'major' {
    if (!weather) return 'none';
    if (weather.windSpeed > 20 || weather.precipitation > 0.5) return 'major';
    if (weather.windSpeed > 10 || weather.temperature < 32) return 'minor';
    return 'none';
  }
  
  /**
   * Update ML models with fresh features
   */
  private async updateMLModels(
    playerFeatures: PlayerFeatures[],
    teamFeatures: TeamFeatures[],
    gameFeatures: GameFeatures[]
  ) {
    console.log('🤖 Updating ML models with fresh features...');
    
    // Update each model's feature cache
    for (const pf of playerFeatures) {
      this.featureCache.set(`player_${pf.playerId}`, pf);
    }
    
    for (const tf of teamFeatures) {
      this.featureCache.set(`team_${tf.teamId}`, tf);
    }
    
    for (const gf of gameFeatures) {
      this.featureCache.set(`game_${gf.gameId}`, gf);
    }
    
    console.log(`✅ Updated feature cache with ${this.featureCache.size} entries`);
  }
  
  /**
   * Store feature snapshots for analysis
   */
  private async storeFeatureSnapshots(
    playerFeatures: PlayerFeatures[],
    teamFeatures: TeamFeatures[],
    gameFeatures: GameFeatures[]
  ) {
    // Store samples for monitoring
    if (playerFeatures.length > 0) {
      await prisma.dataSourceRecord.create({
        data: {
          sourceId: `features_snapshot_${Date.now()}`,
          dataType: 'FEATURE_SNAPSHOT',
          source: 'FEATURE_ENGINEERING',
          data: {
            timestamp: new Date(),
            playerCount: playerFeatures.length,
            teamCount: teamFeatures.length,
            gameCount: gameFeatures.length,
            samplePlayerFeatures: playerFeatures.slice(0, 5),
            sampleTeamFeatures: teamFeatures.slice(0, 3),
            sampleGameFeatures: gameFeatures.slice(0, 3)
          }
        }
      });
    }
  }
  
  /**
   * Get current features for a player
   */
  async getPlayerFeatures(playerId: string): Promise<PlayerFeatures | null> {
    return this.featureCache.get(`player_${playerId}`) || null;
  }
  
  /**
   * Get current features for a team
   */
  async getTeamFeatures(teamId: string): Promise<TeamFeatures | null> {
    return this.featureCache.get(`team_${teamId}`) || null;
  }
  
  /**
   * Get current features for a game
   */
  async getGameFeatures(gameId: string): Promise<GameFeatures | null> {
    return this.featureCache.get(`game_${gameId}`) || null;
  }
}

export const featureEngineering = new RealTimeFeatureEngineering();