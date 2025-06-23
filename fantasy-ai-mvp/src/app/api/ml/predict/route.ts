/**
 * ML Prediction API Endpoint
 * Provides access to all ML models through a unified API
 */

import { NextRequest, NextResponse } from 'next/server';
import { MLPipeline } from '@/lib/ml/ml-pipeline';
import { prisma } from '@/lib/prisma';

// Initialize ML Pipeline singleton
const mlPipeline = MLPipeline.getInstance();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, data } = body;
    
    // Initialize ML models if needed
    await mlPipeline.initialize();
    
    switch (action) {
      case 'analyzePlayer':
        return await handlePlayerAnalysis(data);
        
      case 'optimizeLineup':
        return await handleLineupOptimization(data);
        
      case 'batchAnalyze':
        return await handleBatchAnalysis(data);
        
      case 'compareMatchups':
        return await handleMatchupComparison(data);
        
      case 'assessInjuryRisk':
        return await handleInjuryAssessment(data);
        
      case 'calculateTradeValue':
        return await handleTradeValuation(data);
        
      case 'analyzeWeatherImpact':
        return await handleWeatherAnalysis(data);
        
      case 'detectPatterns':
        return await handlePatternDetection(data);
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('ML API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

async function handlePlayerAnalysis(data: any) {
  const { playerId } = data;
  
  // Fetch player data from database
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      predictions: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      valueSnapshots: {
        orderBy: { timestamp: 'desc' },
        take: 20,
      },
      league: true,
    },
  });
  
  if (!player) {
    return NextResponse.json(
      { error: 'Player not found' },
      { status: 404 }
    );
  }
  
  // Prepare features for ML models
  const features = await preparePlayerFeatures(player, data);
  
  // Run comprehensive analysis
  const analysis = await mlPipeline.analyzePlayer(
    player.id,
    player.name,
    features.player,
    features.matchup,
    features.injury,
    features.trade,
    features.weather,
    features.weatherProfile,
    features.sequence
  );
  
  return NextResponse.json({ analysis });
}

async function handleLineupOptimization(data: any) {
  const { playerIds, constraints, strategy } = data;
  
  // Fetch all players
  const players = await prisma.player.findMany({
    where: { id: { in: playerIds } },
  });
  
  // Analyze each player
  const analyzedPlayers = await Promise.all(
    players.map(async (player) => {
      const features = await preparePlayerFeatures(player, data);
      const analysis = await mlPipeline.analyzePlayer(
        player.id,
        player.name,
        features.player,
        features.matchup,
        features.injury,
        features.trade,
        features.weather,
        features.weatherProfile,
        features.sequence
      );
      
      return {
        player: analysis,
        salary: data.salaries?.[player.id],
        ownership: data.ownership?.[player.id],
      };
    })
  );
  
  // Optimize lineup
  const optimizedLineup = await mlPipeline.optimizeLineup(
    analyzedPlayers,
    constraints,
    strategy
  );
  
  return NextResponse.json({ optimizedLineup });
}

async function handleBatchAnalysis(data: any) {
  const { playerIds } = data;
  
  // Fetch all players
  const players = await prisma.player.findMany({
    where: { id: { in: playerIds } },
  });
  
  // Prepare batch data
  const batchData = await Promise.all(
    players.map(async (player) => ({
      playerId: player.id,
      playerName: player.name,
      features: await preparePlayerFeatures(player, data),
    }))
  );
  
  // Run batch analysis
  const results = await mlPipeline.batchAnalyze(batchData);
  
  return NextResponse.json({ results });
}

async function handleMatchupComparison(data: any) {
  // Implementation for matchup comparison
  return NextResponse.json({ 
    message: 'Matchup comparison endpoint',
    data: data 
  });
}

async function handleInjuryAssessment(data: any) {
  // Implementation for injury assessment
  return NextResponse.json({ 
    message: 'Injury assessment endpoint',
    data: data 
  });
}

async function handleTradeValuation(data: any) {
  // Implementation for trade valuation
  return NextResponse.json({ 
    message: 'Trade valuation endpoint',
    data: data 
  });
}

async function handleWeatherAnalysis(data: any) {
  // Implementation for weather analysis
  return NextResponse.json({ 
    message: 'Weather analysis endpoint',
    data: data 
  });
}

async function handlePatternDetection(data: any) {
  // Implementation for pattern detection
  return NextResponse.json({ 
    message: 'Pattern detection endpoint',
    data: data 
  });
}

// Helper function to prepare features from player data
async function preparePlayerFeatures(player: any, requestData: any) {
  // This is a simplified version - in production, this would pull from multiple data sources
  
  const recentStats = player.stats || [];
  const position = player.position;
  
  return {
    player: {
      recentPoints: recentStats.map((s: any) => s.points || 0),
      recentYards: recentStats.map((s: any) => s.yards || 0),
      recentTouchdowns: recentStats.map((s: any) => s.touchdowns || 0),
      recentTargets: recentStats.map((s: any) => s.targets || 0),
      position,
      age: calculateAge(player.birthDate),
      yearsInLeague: new Date().getFullYear() - (player.rookieYear || 2020),
      injuryStatus: player.injuryStatus || 0,
      teamOffensiveRank: player.team?.offensiveRank || 16,
      teamDefensiveRank: player.team?.defensiveRank || 16,
      homeGame: requestData.homeGame || false,
      opponentDefensiveRank: requestData.opponentRank || 16,
      opponentPointsAllowed: requestData.opponentPointsAllowed || 20,
      weather: requestData.weather || {
        temperature: 72,
        windSpeed: 5,
        precipitation: 0,
      },
      weekNumber: requestData.week || 1,
      timeOfGame: requestData.gameTime || 13,
      restDays: requestData.restDays || 7,
    },
    matchup: {
      playerPosition: position,
      playerAveragePoints: calculateAverage(recentStats.map((s: any) => s.points || 0)),
      playerRecentForm: calculateAverage(recentStats.slice(0, 3).map((s: any) => s.points || 0)),
      playerConsistency: calculateStdDev(recentStats.map((s: any) => s.points || 0)),
      playerUsage: player.usageRate || 0.2,
      defenseRankVsPosition: requestData.defenseRankVsPosition || 16,
      defensePointsAllowedVsPosition: requestData.defensePointsAllowed || 20,
      defenseRecentForm: requestData.defenseRecentForm || 20,
      defenseInjuries: requestData.defenseInjuries || 0,
      defenseScheme: requestData.defenseScheme || 'Hybrid',
      previousMatchups: [],
      gameSpread: requestData.gameSpread || 0,
      overUnder: requestData.overUnder || 45,
      impliedTeamTotal: requestData.impliedTeamTotal || 24,
      timeOfPossession: requestData.timeOfPossession || 30,
      pace: requestData.pace || 65,
      division: requestData.divisionGame || false,
      primetime: requestData.primetime || false,
      playoffs: requestData.playoffs || false,
      mustWin: requestData.mustWin || false,
    },
    injury: {
      age: calculateAge(player.birthDate),
      position,
      height: player.height || 72,
      weight: player.weight || 200,
      bmi: calculateBMI(player.height || 72, player.weight || 200),
      previousInjuries: [],
      snapsLastGame: requestData.snapsLastGame || 60,
      snapsLast4Games: requestData.snapsLast4Games || [60, 58, 62, 55],
      snapShareTrend: 0,
      touchesLastGame: requestData.touchesLastGame || 15,
      touchesLast4Games: requestData.touchesLast4Games || [15, 18, 12, 16],
      daysSinceLastGame: requestData.daysSinceLastGame || 7,
      consecutiveGames: requestData.consecutiveGames || 10,
      practiceParticipation: requestData.practiceStatus || 'Full',
      injuryReportStatus: player.injuryStatus || 'Healthy',
      routeDepth: requestData.routeDepth || 12,
      yardsAfterContact: requestData.yardsAfterContact || 3,
      hitsAbsorbed: requestData.hitsAbsorbed || 5,
      tacklesMade: requestData.tacklesMade || 0,
      gameTemperature: requestData.weather?.temperature || 72,
      fieldType: requestData.fieldType || 'Grass',
      altitude: requestData.altitude || 0,
      travelDistance: requestData.travelDistance || 0,
    },
    trade: {
      currentSeasonPoints: calculateSum(recentStats.map((s: any) => s.points || 0)),
      projectedSeasonPoints: requestData.projectedSeasonPoints || 200,
      consistencyScore: 1 - (calculateStdDev(recentStats.map((s: any) => s.points || 0)) / 10),
      ceilingScore: Math.max(...recentStats.map((s: any) => s.points || 0)),
      floorScore: Math.min(...recentStats.map((s: any) => s.points || 0)),
      position,
      positionalScarcity: requestData.positionalScarcity || 0.5,
      leagueSize: requestData.leagueSize || 12,
      scoringSystem: requestData.scoringSystem || 'PPR',
      rosterRequirements: requestData.rosterRequirements || {
        QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1, K: 1, DST: 1
      },
      teamRecord: requestData.teamRecord || '5-5',
      playoffProbability: requestData.playoffProbability || 0.5,
      scheduleStrength: requestData.scheduleStrength || 0.5,
      byeWeekPassed: requestData.byeWeekPassed || false,
      age: calculateAge(player.birthDate),
      contractYear: requestData.contractYear || 2,
      injuryRisk: 0.2,
      trendDirection: calculateTrend(recentStats.map((s: any) => s.points || 0)),
      tradeDeadlineProximity: requestData.weeksToDeadline || 4,
      keeperEligible: requestData.keeperEligible || false,
      dynastyValue: requestData.dynastyValue || 0.5,
      last4WeeksAverage: calculateAverage(recentStats.slice(0, 4).map((s: any) => s.points || 0)),
      last4WeeksRank: requestData.last4WeeksRank || 20,
      targetShare: player.targetShare || 0.2,
      redZoneShare: player.redZoneShare || 0.15,
    },
    weather: requestData.weather || {
      temperature: 72,
      windSpeed: 5,
      windDirection: 'N',
      precipitation: 0,
      precipitationType: 'none',
      humidity: 50,
      pressure: 1013,
      visibility: 10,
      cloudCover: 20,
      stadiumType: 'outdoor',
      fieldType: 'grass',
      altitude: 0,
    },
    weatherProfile: {
      playerId: player.id,
      position,
      coldWeatherGames: 10,
      coldWeatherAverage: 15,
      warmWeatherGames: 20,
      warmWeatherAverage: 18,
      windGames: 5,
      windAverage: 14,
      precipitationGames: 3,
      precipitationAverage: 12,
      domeGames: 15,
      domeAverage: 17,
      outdoorGames: 25,
      outdoorAverage: 16,
    },
    sequence: {
      playerId: player.id,
      position,
      pointsSequence: recentStats.map((s: any) => s.points || 0),
      usageSequence: recentStats.map((s: any) => s.targets || s.carries || 0),
      efficiencySequence: recentStats.map((s: any) => s.yardsPerTouch || 0),
      opponentRankSequence: Array(20).fill(16),
      gameScriptSequence: Array(20).fill(0),
      injuryStatusSequence: Array(20).fill(0),
      seasonNumber: requestData.seasonNumber || 3,
      gamesPlayed: recentStats.length,
      age: calculateAge(player.birthDate),
      teamChange: false,
      coachChange: false,
      schemeChange: false,
      currentStreak: 0,
      recentTrend: calculateTrend(recentStats.map((s: any) => s.points || 0)),
      volatilityScore: calculateStdDev(recentStats.map((s: any) => s.points || 0)) / 10,
    },
  };
}

// Utility functions
function calculateAge(birthDate: string | Date | null): number {
  if (!birthDate) return 25;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function calculateBMI(heightInches: number, weightLbs: number): number {
  return (weightLbs / (heightInches * heightInches)) * 703;
}

function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function calculateSum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function calculateStdDev(values: number[]): number {
  const avg = calculateAverage(values);
  const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0;
  const recent = values.slice(0, Math.floor(values.length / 2));
  const older = values.slice(Math.floor(values.length / 2));
  const recentAvg = calculateAverage(recent);
  const olderAvg = calculateAverage(older);
  return olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
}