import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/redis/redis-client';

export class FeatureEngineer {
  private featureCache = new Map<string, any>();
  private readonly CACHE_TTL = 300; // 5 minutes

  /**
   * Extract comprehensive features for a player
   */
  async extractPlayerFeatures(playerId: string, options: {
    includeOpponent?: boolean;
    includeWeather?: boolean;
    includeHistorical?: boolean;
    includeSocial?: boolean;
  } = {}) {
    const cacheKey = `features:player:${playerId}:${JSON.stringify(options)}`;
    
    // Check cache
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    // Get player data
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        PlayerStats: {
          orderBy: { week: 'desc' },
          take: 10
        },
        PlayerProjection: {
          orderBy: { week: 'desc' },
          take: 1
        },
        PlayerInjury: {
          orderBy: { reportedDate: 'desc' },
          take: 1
        }
      }
    });

    if (!player) {
      throw new Error(`Player not found: ${playerId}`);
    }

    const features: any = {
      // Basic info
      playerId,
      position: player.position,
      team: player.team,
      
      // Performance metrics
      ...this.calculatePerformanceMetrics(player.PlayerStats),
      
      // Injury status
      injuryStatus: player.PlayerInjury[0]?.status || 'healthy',
      injuryRisk: this.calculateInjuryRisk(player),
      
      // Projections
      projectedPoints: player.PlayerProjection[0]?.projectedPoints || 0,
      projectionConfidence: player.PlayerProjection[0]?.confidence || 0.7
    };

    // Add opponent features
    if (options.includeOpponent) {
      features.opponent = await this.getOpponentFeatures(player.team);
    }

    // Add weather features
    if (options.includeWeather) {
      features.weather = await this.getWeatherFeatures(player.team);
    }

    // Add historical features
    if (options.includeHistorical) {
      features.historical = await this.getHistoricalFeatures(playerId);
    }

    // Add social sentiment
    if (options.includeSocial) {
      features.social = await this.getSocialFeatures(playerId);
    }

    // Cache features
    await cache.set(cacheKey, features, this.CACHE_TTL);

    return features;
  }

  /**
   * Extract features for lineup optimization
   */
  async extractLineupFeatures(lineup: string[], constraints: any) {
    const features = {
      lineup: [],
      constraints,
      synergies: [],
      risks: [],
      opportunities: []
    };

    // Get features for each player
    for (const playerId of lineup) {
      const playerFeatures = await this.extractPlayerFeatures(playerId, {
        includeOpponent: true,
        includeWeather: true
      });
      features.lineup.push(playerFeatures);
    }

    // Calculate team synergies
    features.synergies = this.calculateSynergies(features.lineup);

    // Identify risks
    features.risks = this.identifyLineupRisks(features.lineup);

    // Find opportunities
    features.opportunities = await this.findLineupOpportunities(features.lineup);

    return features;
  }

  /**
   * Extract features for game outcome prediction
   */
  async extractGameFeatures(homeTeamId: string, awayTeamId: string) {
    const [homeTeam, awayTeam] = await Promise.all([
      this.getTeamFeatures(homeTeamId),
      this.getTeamFeatures(awayTeamId)
    ]);

    const features = {
      homeTeam,
      awayTeam,
      matchup: {
        homeAdvantage: 3, // Average home field advantage in points
        divisionGame: homeTeam.division === awayTeam.division,
        revengeGame: await this.isRevengeGame(homeTeamId, awayTeamId),
        primetimeGame: false, // Would check schedule
        restDaysDiff: homeTeam.restDays - awayTeam.restDays
      },
      betting: await this.getBettingFeatures(homeTeamId, awayTeamId),
      weather: await this.getWeatherFeatures(homeTeamId)
    };

    return features;
  }

  /**
   * Extract features for trade analysis
   */
  async extractTradeFeatures(givingPlayerIds: string[], receivingPlayerIds: string[]) {
    const features = {
      giving: [],
      receiving: [],
      balance: {},
      impact: {}
    };

    // Get features for giving players
    for (const playerId of givingPlayerIds) {
      const playerFeatures = await this.extractPlayerFeatures(playerId, {
        includeHistorical: true
      });
      features.giving.push(playerFeatures);
    }

    // Get features for receiving players
    for (const playerId of receivingPlayerIds) {
      const playerFeatures = await this.extractPlayerFeatures(playerId, {
        includeHistorical: true
      });
      features.receiving.push(playerFeatures);
    }

    // Calculate trade balance
    features.balance = this.calculateTradeBalance(features.giving, features.receiving);

    // Predict impact
    features.impact = await this.predictTradeImpact(features.giving, features.receiving);

    return features;
  }

  /**
   * Extract features for draft assistance
   */
  async extractDraftFeatures(draftState: {
    round: number;
    pick: number;
    myPicks: string[];
    takenPlayers: string[];
    availablePlayers: string[];
  }) {
    const features = {
      draftPosition: {
        round: draftState.round,
        pick: draftState.pick,
        totalPicks: draftState.myPicks.length
      },
      teamNeeds: await this.analyzeTeamNeeds(draftState.myPicks),
      availableValue: [],
      positionScarcity: {},
      adpValue: []
    };

    // Analyze available players
    for (const playerId of draftState.availablePlayers.slice(0, 50)) {
      const player = await prisma.player.findUnique({
        where: { id: playerId },
        include: {
          PlayerProjection: {
            orderBy: { season: 'desc' },
            take: 1
          }
        }
      });

      if (player) {
        const value = this.calculateDraftValue(player, draftState);
        features.availableValue.push({
          playerId,
          name: player.name,
          position: player.position,
          value,
          adp: player.adp || 200,
          projectedPoints: player.PlayerProjection[0]?.projectedPoints || 0
        });
      }
    }

    // Sort by value
    features.availableValue.sort((a, b) => b.value - a.value);

    // Calculate position scarcity
    features.positionScarcity = this.calculatePositionScarcity(
      draftState.availablePlayers,
      draftState.takenPlayers
    );

    // Find ADP values
    features.adpValue = features.availableValue
      .filter(p => p.adp > draftState.round * 12 + draftState.pick)
      .slice(0, 10);

    return features;
  }

  // Helper methods

  private calculatePerformanceMetrics(stats: any[]) {
    if (!stats || stats.length === 0) {
      return {
        averagePoints: 0,
        consistency: 0,
        trend: 0,
        floor: 0,
        ceiling: 0
      };
    }

    const points = stats.map(s => s.fantasyPoints || 0);
    const average = points.reduce((a, b) => a + b, 0) / points.length;
    const stdDev = Math.sqrt(
      points.reduce((sq, n) => sq + Math.pow(n - average, 2), 0) / points.length
    );

    // Calculate trend (linear regression slope)
    const trend = this.calculateTrend(points);

    return {
      averagePoints: average,
      consistency: average > 0 ? 1 - (stdDev / average) : 0,
      trend,
      floor: Math.max(0, average - stdDev),
      ceiling: average + stdDev,
      last3Average: points.slice(0, 3).reduce((a, b) => a + b, 0) / 3,
      last5Average: points.slice(0, 5).reduce((a, b) => a + b, 0) / 5
    };
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  private calculateInjuryRisk(player: any): number {
    let risk = 0.1; // Base 10% risk

    // Recent injury
    if (player.PlayerInjury?.[0]) {
      const injury = player.PlayerInjury[0];
      if (injury.status === 'questionable') risk += 0.2;
      if (injury.status === 'doubtful') risk += 0.4;
      if (injury.status === 'out') risk = 1.0;
    }

    // Age factor
    if (player.age > 30) risk += 0.1;
    if (player.age > 32) risk += 0.1;

    // Position factor
    if (['RB', 'TE'].includes(player.position)) risk += 0.1;

    return Math.min(risk, 0.95);
  }

  private async getOpponentFeatures(team: string) {
    // Mock implementation - would fetch real opponent data
    return {
      defensiveRank: Math.floor(Math.random() * 32) + 1,
      pointsAllowed: 20 + Math.random() * 10,
      yardsAllowed: 350 + Math.random() * 100,
      isHome: Math.random() > 0.5
    };
  }

  private async getWeatherFeatures(team: string) {
    // Mock implementation - would fetch real weather data
    return {
      temperature: 65 + Math.random() * 20,
      windSpeed: Math.random() * 15,
      precipitation: Math.random() * 0.3,
      dome: Math.random() > 0.7
    };
  }

  private async getHistoricalFeatures(playerId: string) {
    const stats = await prisma.playerStats.findMany({
      where: { playerId },
      orderBy: { week: 'desc' },
      take: 16 // Last season
    });

    return {
      seasonStats: this.calculatePerformanceMetrics(stats),
      careerHighPoints: Math.max(...stats.map(s => s.fantasyPoints || 0)),
      gamesPlayed: stats.length
    };
  }

  private async getSocialFeatures(playerId: string) {
    // Mock implementation - would analyze social media sentiment
    return {
      sentiment: 0.7, // Positive
      buzzScore: Math.random() * 100,
      mentionCount: Math.floor(Math.random() * 1000)
    };
  }

  private calculateSynergies(lineup: any[]) {
    const synergies = [];

    // Stack synergy (QB-WR from same team)
    const qb = lineup.find(p => p.position === 'QB');
    if (qb) {
      const receivers = lineup.filter(p => 
        ['WR', 'TE'].includes(p.position) && p.team === qb.team
      );
      if (receivers.length > 0) {
        synergies.push({
          type: 'stack',
          players: [qb.playerId, ...receivers.map(r => r.playerId)],
          boost: 0.1 * receivers.length
        });
      }
    }

    // Game stack (players from same game)
    const gameGroups = this.groupByGame(lineup);
    for (const [game, players] of Object.entries(gameGroups)) {
      if ((players as any[]).length >= 3) {
        synergies.push({
          type: 'game_stack',
          players: (players as any[]).map(p => p.playerId),
          boost: 0.05 * (players as any[]).length
        });
      }
    }

    return synergies;
  }

  private identifyLineupRisks(lineup: any[]) {
    const risks = [];

    // Injury risk
    const injuredPlayers = lineup.filter(p => p.injuryRisk > 0.3);
    if (injuredPlayers.length > 0) {
      risks.push({
        type: 'injury',
        severity: 'high',
        players: injuredPlayers.map(p => p.playerId),
        impact: injuredPlayers.reduce((sum, p) => sum + p.injuryRisk, 0)
      });
    }

    // Concentration risk (too many players from one team)
    const teamCounts = lineup.reduce((acc, p) => {
      acc[p.team] = (acc[p.team] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    for (const [team, count] of Object.entries(teamCounts)) {
      if (count > 3) {
        risks.push({
          type: 'concentration',
          severity: 'medium',
          team,
          count,
          impact: 0.2 * (count - 3)
        });
      }
    }

    // Weather risk
    const badWeatherPlayers = lineup.filter(p => 
      p.weather && (p.weather.windSpeed > 20 || p.weather.precipitation > 0.5)
    );
    if (badWeatherPlayers.length > 0) {
      risks.push({
        type: 'weather',
        severity: 'medium',
        players: badWeatherPlayers.map(p => p.playerId),
        impact: 0.1 * badWeatherPlayers.length
      });
    }

    return risks;
  }

  private async findLineupOpportunities(lineup: any[]) {
    const opportunities = [];

    // Low ownership plays
    const lowOwnership = lineup.filter(p => p.projectedOwnership < 10);
    if (lowOwnership.length > 0) {
      opportunities.push({
        type: 'contrarian',
        players: lowOwnership.map(p => p.playerId),
        upside: 0.2
      });
    }

    // Positive game script
    const favoredPlayers = lineup.filter(p => 
      p.opponent && p.opponent.spread > 7
    );
    if (favoredPlayers.length > 0) {
      opportunities.push({
        type: 'game_script',
        players: favoredPlayers.map(p => p.playerId),
        upside: 0.15
      });
    }

    return opportunities;
  }

  private async getTeamFeatures(teamId: string) {
    // Mock implementation - would fetch real team data
    return {
      teamId,
      wins: Math.floor(Math.random() * 10),
      losses: Math.floor(Math.random() * 10),
      pointsFor: 20 + Math.random() * 10,
      pointsAgainst: 20 + Math.random() * 10,
      offensiveRank: Math.floor(Math.random() * 32) + 1,
      defensiveRank: Math.floor(Math.random() * 32) + 1,
      restDays: 7 + Math.floor(Math.random() * 7),
      injuries: Math.floor(Math.random() * 5),
      division: ['AFC East', 'AFC West', 'NFC East', 'NFC West'][Math.floor(Math.random() * 4)]
    };
  }

  private async isRevengeGame(team1: string, team2: string): Promise<boolean> {
    // Check if teams played recently and one team lost
    return Math.random() > 0.8;
  }

  private async getBettingFeatures(homeTeam: string, awayTeam: string) {
    // Mock implementation - would fetch real betting data
    return {
      spread: (Math.random() - 0.5) * 14,
      overUnder: 40 + Math.random() * 20,
      moneylineHome: -110 + Math.random() * 200,
      moneylineAway: -110 + Math.random() * 200
    };
  }

  private calculateTradeBalance(giving: any[], receiving: any[]) {
    const givingValue = giving.reduce((sum, p) => sum + p.averagePoints, 0);
    const receivingValue = receiving.reduce((sum, p) => sum + p.averagePoints, 0);

    return {
      givingValue,
      receivingValue,
      netValue: receivingValue - givingValue,
      fairness: Math.abs(receivingValue - givingValue) < 5 ? 'fair' : 
                receivingValue > givingValue ? 'favorable' : 'unfavorable'
    };
  }

  private async predictTradeImpact(giving: any[], receiving: any[]) {
    // Analyze position changes
    const positionChanges = this.analyzePositionChanges(giving, receiving);

    return {
      positionChanges,
      projectedPointsChange: receiving.reduce((sum, p) => sum + p.projectedPoints, 0) -
                            giving.reduce((sum, p) => sum + p.projectedPoints, 0),
      consistencyChange: receiving.reduce((sum, p) => sum + p.consistency, 0) / receiving.length -
                        giving.reduce((sum, p) => sum + p.consistency, 0) / giving.length,
      riskChange: receiving.reduce((sum, p) => sum + p.injuryRisk, 0) -
                  giving.reduce((sum, p) => sum + p.injuryRisk, 0)
    };
  }

  private analyzePositionChanges(giving: any[], receiving: any[]) {
    const changes: Record<string, number> = {};
    
    giving.forEach(p => {
      changes[p.position] = (changes[p.position] || 0) - 1;
    });
    
    receiving.forEach(p => {
      changes[p.position] = (changes[p.position] || 0) + 1;
    });

    return changes;
  }

  private async analyzeTeamNeeds(picks: string[]) {
    const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];
    const needs: Record<string, number> = {};
    const current: Record<string, number> = {};

    // Count current positions
    for (const playerId of picks) {
      const player = await prisma.player.findUnique({
        where: { id: playerId },
        select: { position: true }
      });
      if (player) {
        current[player.position] = (current[player.position] || 0) + 1;
      }
    }

    // Calculate needs
    const targets = {
      QB: 2,
      RB: 5,
      WR: 5,
      TE: 2,
      K: 1,
      DST: 1
    };

    for (const position of positions) {
      needs[position] = Math.max(0, (targets[position] || 0) - (current[position] || 0));
    }

    return needs;
  }

  private calculateDraftValue(player: any, draftState: any): number {
    let value = 100;

    // ADP value
    const expectedPick = draftState.round * 12 + draftState.pick;
    const adpDiff = (player.adp || 200) - expectedPick;
    if (adpDiff > 0) {
      value += adpDiff * 0.5; // Falling in draft
    }

    // Projection value
    value += (player.PlayerProjection[0]?.projectedPoints || 0) * 0.1;

    // Position scarcity
    const scarcity = this.getPositionScarcity(player.position, draftState);
    value += scarcity * 10;

    return value;
  }

  private calculatePositionScarcity(available: string[], taken: string[]): Record<string, number> {
    const scarcity: Record<string, number> = {};
    const positions = ['QB', 'RB', 'WR', 'TE'];

    for (const position of positions) {
      const availableCount = available.filter(id => 
        // Would need to check player position
        Math.random() > 0.7 // Mock
      ).length;
      
      const takenCount = taken.filter(id =>
        // Would need to check player position  
        Math.random() > 0.7 // Mock
      ).length;

      scarcity[position] = 1 - (availableCount / (availableCount + takenCount + 1));
    }

    return scarcity;
  }

  private getPositionScarcity(position: string, draftState: any): number {
    // Mock implementation
    const scarcityMap: Record<string, number> = {
      RB: 0.8,
      WR: 0.6,
      QB: 0.4,
      TE: 0.7,
      K: 0.1,
      DST: 0.1
    };
    return scarcityMap[position] || 0.5;
  }

  private groupByGame(lineup: any[]): Record<string, any[]> {
    const games: Record<string, any[]> = {};
    
    lineup.forEach(player => {
      const game = `${player.team}@${player.opponent?.team || 'UNK'}`;
      if (!games[game]) {
        games[game] = [];
      }
      games[game].push(player);
    });

    return games;
  }
}

// Export singleton
export const featureEngineer = new FeatureEngineer();