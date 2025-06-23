/**
 * ML Data Preparation Utilities
 * Handles data fetching, transformation, and feature engineering
 */

import { prisma } from '@/lib/prisma';

export interface WeatherData {
  temperature: number;
  windSpeed: number;
  windDirection: string;
  precipitation: number;
  precipitationType: 'none' | 'rain' | 'snow' | 'sleet';
  humidity: number;
  pressure: number;
  visibility: number;
  cloudCover: number;
  stadiumType: 'dome' | 'retractable' | 'outdoor';
  fieldType: 'grass' | 'turf';
  altitude: number;
}

export interface GameContext {
  week: number;
  opponent: string;
  homeGame: boolean;
  gameTime: number;
  gameSpread: number;
  overUnder: number;
  impliedTeamTotal: number;
  divisionGame: boolean;
  primetime: boolean;
  playoffs: boolean;
  mustWin: boolean;
}

/**
 * Fetch and prepare player data for ML models
 */
export async function fetchPlayerMLData(playerId: string, gameContext: GameContext) {
  // Fetch comprehensive player data
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      stats: {
        orderBy: { week: 'desc' },
        take: 20,
      },
      team: {
        include: {
          games: {
            where: { week: gameContext.week },
            include: {
              homeTeam: true,
              awayTeam: true,
            },
          },
        },
      },
      injuries: {
        orderBy: { reportDate: 'desc' },
        take: 10,
      },
      fantasyScores: {
        orderBy: { week: 'desc' },
        take: 20,
      },
    },
  });

  if (!player) {
    throw new Error(`Player ${playerId} not found`);
  }

  return player;
}

/**
 * Fetch weather data for a game
 */
export async function fetchWeatherData(
  gameId: string,
  stadiumLocation: { lat: number; lon: number }
): Promise<WeatherData> {
  // In production, this would call a weather API
  // For now, returning mock data
  return {
    temperature: 72,
    windSpeed: 8,
    windDirection: 'NE',
    precipitation: 0,
    precipitationType: 'none',
    humidity: 65,
    pressure: 1013,
    visibility: 10,
    cloudCover: 30,
    stadiumType: 'outdoor',
    fieldType: 'grass',
    altitude: 500,
  };
}

/**
 * Calculate defensive rankings vs position
 */
export async function calculateDefensiveRankings(week: number) {
  // This would aggregate defensive performance vs each position
  const defensiveStats = await prisma.teamStats.groupBy({
    by: ['teamId', 'position'],
    where: {
      week: { lte: week },
    },
    _avg: {
      pointsAllowed: true,
      yardsAllowed: true,
      touchdownsAllowed: true,
    },
    _count: true,
  });

  // Convert to rankings
  const rankings = new Map<string, Map<string, number>>();
  
  // Group by position
  const byPosition = new Map<string, any[]>();
  defensiveStats.forEach(stat => {
    if (!byPosition.has(stat.position)) {
      byPosition.set(stat.position, []);
    }
    byPosition.get(stat.position)!.push(stat);
  });

  // Rank teams for each position
  byPosition.forEach((stats, position) => {
    const sorted = stats.sort((a, b) => 
      (a._avg.pointsAllowed || 0) - (b._avg.pointsAllowed || 0)
    );
    
    sorted.forEach((stat, index) => {
      if (!rankings.has(stat.teamId)) {
        rankings.set(stat.teamId, new Map());
      }
      rankings.get(stat.teamId)!.set(position, index + 1);
    });
  });

  return rankings;
}

/**
 * Calculate player usage trends
 */
export async function calculateUsageTrends(playerId: string, weeks: number = 4) {
  const recentStats = await prisma.playerStats.findMany({
    where: { playerId },
    orderBy: { week: 'desc' },
    take: weeks,
    select: {
      week: true,
      snaps: true,
      targets: true,
      carries: true,
      redZoneTargets: true,
      redZoneCarries: true,
      teamTotalPlays: true,
    },
  });

  if (recentStats.length === 0) {
    return {
      snapShareTrend: 0,
      targetShareTrend: 0,
      touchShareTrend: 0,
      redZoneShareTrend: 0,
    };
  }

  // Calculate shares for each week
  const shares = recentStats.map(stat => ({
    snapShare: stat.snaps / (stat.teamTotalPlays || 1),
    targetShare: stat.targets / (stat.teamTotalPlays || 1),
    touchShare: (stat.targets + stat.carries) / (stat.teamTotalPlays || 1),
    redZoneShare: (stat.redZoneTargets + stat.redZoneCarries) / 
      (stat.teamTotalPlays || 1),
  }));

  // Calculate trends (newer weeks weighted more heavily)
  const weights = shares.map((_, i) => Math.pow(0.8, i)).reverse();
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const trends = {
    snapShareTrend: 0,
    targetShareTrend: 0,
    touchShareTrend: 0,
    redZoneShareTrend: 0,
  };

  // Calculate weighted trends
  if (shares.length > 1) {
    const avgSnapShare = shares.reduce((sum, s) => sum + s.snapShare, 0) / shares.length;
    const avgTargetShare = shares.reduce((sum, s) => sum + s.targetShare, 0) / shares.length;
    const avgTouchShare = shares.reduce((sum, s) => sum + s.touchShare, 0) / shares.length;
    const avgRedZoneShare = shares.reduce((sum, s) => sum + s.redZoneShare, 0) / shares.length;

    trends.snapShareTrend = (shares[0].snapShare - avgSnapShare) / avgSnapShare;
    trends.targetShareTrend = (shares[0].targetShare - avgTargetShare) / avgTargetShare;
    trends.touchShareTrend = (shares[0].touchShare - avgTouchShare) / avgTouchShare;
    trends.redZoneShareTrend = (shares[0].redZoneShare - avgRedZoneShare) / avgRedZoneShare;
  }

  return trends;
}

/**
 * Calculate team pace and game script metrics
 */
export async function calculateTeamMetrics(teamId: string, week: number) {
  const recentGames = await prisma.game.findMany({
    where: {
      OR: [
        { homeTeamId: teamId },
        { awayTeamId: teamId },
      ],
      week: { lt: week },
    },
    orderBy: { week: 'desc' },
    take: 4,
    include: {
      gameStats: true,
    },
  });

  const metrics = {
    pace: 65, // Default NFL average
    averageMargin: 0,
    averageTotal: 45,
    timeOfPossession: 30,
  };

  if (recentGames.length > 0) {
    const teamStats = recentGames.map(game => {
      const isHome = game.homeTeamId === teamId;
      const teamScore = isHome ? game.homeScore : game.awayScore;
      const oppScore = isHome ? game.awayScore : game.homeScore;
      const stats = game.gameStats.find(s => s.teamId === teamId);

      return {
        margin: teamScore - oppScore,
        total: teamScore + oppScore,
        plays: stats?.totalPlays || 65,
        timeOfPossession: stats?.timeOfPossession || 30,
      };
    });

    metrics.pace = teamStats.reduce((sum, s) => sum + s.plays, 0) / teamStats.length;
    metrics.averageMargin = teamStats.reduce((sum, s) => sum + s.margin, 0) / teamStats.length;
    metrics.averageTotal = teamStats.reduce((sum, s) => sum + s.total, 0) / teamStats.length;
    metrics.timeOfPossession = teamStats.reduce((sum, s) => sum + s.timeOfPossession, 0) / teamStats.length;
  }

  return metrics;
}

/**
 * Generate training data for models
 */
export async function generateTrainingData(
  startWeek: number,
  endWeek: number,
  season: number
) {
  const trainingData = [];

  // Fetch all games in the range
  const games = await prisma.game.findMany({
    where: {
      season,
      week: {
        gte: startWeek,
        lte: endWeek,
      },
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      playerStats: {
        include: {
          player: true,
        },
      },
    },
  });

  // Process each game and player performance
  for (const game of games) {
    for (const playerStat of game.playerStats) {
      // Fetch historical data for this player up to this game
      const historicalStats = await prisma.playerStats.findMany({
        where: {
          playerId: playerStat.playerId,
          week: { lt: game.week },
        },
        orderBy: { week: 'desc' },
        take: 10,
      });

      if (historicalStats.length >= 5) {
        // Prepare features
        const features = {
          // Historical performance
          avgPoints: historicalStats.reduce((sum, s) => sum + s.fantasyPoints, 0) / historicalStats.length,
          recentForm: historicalStats.slice(0, 3).reduce((sum, s) => sum + s.fantasyPoints, 0) / 3,
          consistency: calculateStandardDeviation(historicalStats.map(s => s.fantasyPoints)),
          
          // Game context
          homeGame: playerStat.player.teamId === game.homeTeamId,
          spread: game.spread,
          total: game.overUnder,
          
          // Target (what we're trying to predict)
          actualPoints: playerStat.fantasyPoints,
        };

        trainingData.push(features);
      }
    }
  }

  return trainingData;
}

/**
 * Calculate player correlations for stacking
 */
export async function calculatePlayerCorrelations(
  season: number,
  minGames: number = 8
) {
  const correlations = new Map<string, Map<string, number>>();

  // Fetch all player performances grouped by game
  const games = await prisma.game.findMany({
    where: { season },
    include: {
      playerStats: {
        include: {
          player: true,
        },
      },
    },
  });

  // Group performances by team and game
  const performancesByGame = new Map<string, Map<string, number>>();
  
  games.forEach(game => {
    const gameKey = `${game.season}-${game.week}`;
    if (!performancesByGame.has(gameKey)) {
      performancesByGame.set(gameKey, new Map());
    }
    
    game.playerStats.forEach(stat => {
      performancesByGame.get(gameKey)!.set(stat.playerId, stat.fantasyPoints);
    });
  });

  // Calculate pairwise correlations
  const playerIds = Array.from(new Set(
    games.flatMap(g => g.playerStats.map(s => s.playerId))
  ));

  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      const player1 = playerIds[i];
      const player2 = playerIds[j];

      const performances1: number[] = [];
      const performances2: number[] = [];

      performancesByGame.forEach(gamePerfs => {
        if (gamePerfs.has(player1) && gamePerfs.has(player2)) {
          performances1.push(gamePerfs.get(player1)!);
          performances2.push(gamePerfs.get(player2)!);
        }
      });

      if (performances1.length >= minGames) {
        const correlation = calculateCorrelation(performances1, performances2);
        
        if (!correlations.has(player1)) {
          correlations.set(player1, new Map());
        }
        if (!correlations.has(player2)) {
          correlations.set(player2, new Map());
        }
        
        correlations.get(player1)!.set(player2, correlation);
        correlations.get(player2)!.set(player1, correlation);
      }
    }
  }

  return correlations;
}

// Utility functions
function calculateStandardDeviation(values: number[]): number {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
}