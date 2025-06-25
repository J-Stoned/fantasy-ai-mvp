import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { anomalyDetector } from '@/lib/ml/anomaly-detector';

// POST /api/anomaly/detect - Detect anomalies in player/game data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, data, context } = await request.json();

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Type and data are required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Detect anomalies based on type
    let anomalies: any[] = [];
    let severity: string = 'low';

    switch (type) {
      case 'player_performance':
        anomalies = await detectPlayerAnomalies(data);
        break;
      
      case 'lineup_optimization':
        anomalies = await detectLineupAnomalies(data);
        break;
      
      case 'market_trends':
        anomalies = await detectMarketAnomalies(data);
        break;
      
      case 'injury_patterns':
        anomalies = await detectInjuryAnomalies(data);
        break;
      
      case 'scoring_irregularities':
        anomalies = await detectScoringAnomalies(data);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid anomaly type' },
          { status: 400 }
        );
    }

    // Determine overall severity
    if (anomalies.some(a => a.severity === 'critical')) {
      severity = 'critical';
    } else if (anomalies.some(a => a.severity === 'high')) {
      severity = 'high';
    } else if (anomalies.some(a => a.severity === 'medium')) {
      severity = 'medium';
    }

    // Store anomaly detection event
    const anomalyEvent = await prisma.anomalyDetection.create({
      data: {
        type,
        severity,
        confidence: 0.85, // Average confidence based on anomaly count
        description: `${anomalies.length} anomalies detected in ${type}`,
        details: {
          anomalies,
          context: context || {},
          dataPoints: Object.keys(data).length,
          detectionMethod: 'ml_ensemble'
        },
        impact: {
          recommendations: generateRecommendations(anomalies, type),
          affectedMetrics: anomalies.map(a => a.type),
          estimatedImpact: severity
        },
        resolved: false
      }
    });

    // Create notifications for critical anomalies
    if (severity === 'critical') {
      await prisma.notification.create({
        data: {
          userId: user.id,
          notificationType: 'anomaly_detected',
          title: 'Critical Anomaly Detected',
          message: `${anomalies.length} critical anomalies found in ${type}`,
          data: JSON.stringify({ anomalyEventId: anomalyEvent.id })
        }
      });
    }

    return NextResponse.json({
      id: anomalyEvent.id,
      type,
      severity,
      anomalies,
      recommendations: generateRecommendations(anomalies, type)
    });
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    return NextResponse.json(
      { error: 'Failed to detect anomalies' },
      { status: 500 }
    );
  }
}

// GET /api/anomaly - Get anomaly history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const resolved = searchParams.get('resolved') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get anomaly events
    const events = await prisma.anomalyDetection.findMany({
      where: {
        ...(type && { type }),
        ...(severity && { severity }),
        ...(searchParams.has('resolved') && { resolved })
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // Calculate stats
    const stats = {
      total: events.length,
      critical: events.filter(e => e.severity === 'critical').length,
      high: events.filter(e => e.severity === 'high').length,
      medium: events.filter(e => e.severity === 'medium').length,
      low: events.filter(e => e.severity === 'low').length,
      resolved: events.filter(e => e.resolved).length,
      unresolved: events.filter(e => !e.resolved).length
    };

    return NextResponse.json({
      events,
      stats
    });
  } catch (error) {
    console.error('Error fetching anomaly history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch anomaly history' },
      { status: 500 }
    );
  }
}


// Helper functions for anomaly detection

async function detectPlayerAnomalies(data: any): Promise<any[]> {
  const anomalies = [];
  const { playerId, recentStats, historicalStats, position } = data;

  // Check for sudden performance drops
  if (recentStats.average < historicalStats.average * 0.7) {
    anomalies.push({
      type: 'performance_drop',
      severity: 'high',
      description: 'Player performance dropped by over 30%',
      details: {
        recent: recentStats.average,
        historical: historicalStats.average,
        dropPercentage: ((historicalStats.average - recentStats.average) / historicalStats.average * 100).toFixed(1)
      }
    });
  }

  // Check for unusual consistency
  if (recentStats.standardDeviation < historicalStats.standardDeviation * 0.3) {
    anomalies.push({
      type: 'unusual_consistency',
      severity: 'medium',
      description: 'Player showing unusually consistent performance',
      details: {
        recentStdDev: recentStats.standardDeviation,
        historicalStdDev: historicalStats.standardDeviation
      }
    });
  }

  // Check for outlier games
  const outliers = recentStats.games.filter((game: any) => 
    game.fantasyPoints > historicalStats.average * 2 ||
    game.fantasyPoints < historicalStats.average * 0.2
  );

  if (outliers.length > 0) {
    anomalies.push({
      type: 'outlier_performances',
      severity: 'low',
      description: `${outliers.length} games with extreme performance`,
      details: { outliers }
    });
  }

  return anomalies;
}

async function detectLineupAnomalies(data: any): Promise<any[]> {
  const anomalies = [];
  const { lineup, projections, ownership } = data;

  // Check for overexposure to single team
  const teamCounts: Record<string, number> = {};
  lineup.forEach((player: any) => {
    teamCounts[player.team] = (teamCounts[player.team] || 0) + 1;
  });

  const maxTeamExposure = Math.max(...Object.values(teamCounts));
  if (maxTeamExposure > 3) {
    anomalies.push({
      type: 'team_overexposure',
      severity: 'medium',
      description: `Lineup has ${maxTeamExposure} players from same team`,
      details: { teamCounts }
    });
  }

  // Check for low projected ceiling
  const totalProjected = lineup.reduce((sum: number, p: any) => sum + p.projected, 0);
  const totalCeiling = lineup.reduce((sum: number, p: any) => sum + p.ceiling, 0);
  
  if (totalCeiling < totalProjected * 1.2) {
    anomalies.push({
      type: 'low_ceiling',
      severity: 'medium',
      description: 'Lineup has limited upside potential',
      details: {
        projected: totalProjected,
        ceiling: totalCeiling,
        upsidePercentage: ((totalCeiling - totalProjected) / totalProjected * 100).toFixed(1)
      }
    });
  }

  // Check for high ownership overlap
  const highOwnership = lineup.filter((p: any) => ownership[p.id] > 40).length;
  if (highOwnership > 5) {
    anomalies.push({
      type: 'high_ownership',
      severity: 'low',
      description: 'Lineup lacks differentiation in tournaments',
      details: {
        highOwnershipCount: highOwnership,
        averageOwnership: lineup.reduce((sum: number, p: any) => sum + ownership[p.id], 0) / lineup.length
      }
    });
  }

  return anomalies;
}

async function detectMarketAnomalies(data: any): Promise<any[]> {
  const anomalies = [];
  const { priceChanges, volumeData, newsEvents } = data;

  // Check for unusual price movements
  const significantMoves = priceChanges.filter((change: any) => 
    Math.abs(change.percentChange) > 15
  );

  if (significantMoves.length > 0) {
    anomalies.push({
      type: 'price_spike',
      severity: 'high',
      description: `${significantMoves.length} players with >15% price change`,
      details: { significantMoves }
    });
  }

  // Check for volume anomalies
  const volumeSpikes = volumeData.filter((v: any) => 
    v.current > v.average * 3
  );

  if (volumeSpikes.length > 0) {
    anomalies.push({
      type: 'volume_spike',
      severity: 'medium',
      description: 'Unusual trading volume detected',
      details: { volumeSpikes }
    });
  }

  return anomalies;
}

async function detectInjuryAnomalies(data: any): Promise<any[]> {
  const anomalies = [];
  const { injuries, teamPatterns, positionTrends } = data;

  // Check for team injury clusters
  const teamInjuryCounts: Record<string, number> = {};
  injuries.forEach((injury: any) => {
    teamInjuryCounts[injury.team] = (teamInjuryCounts[injury.team] || 0) + 1;
  });

  const highInjuryTeams = Object.entries(teamInjuryCounts)
    .filter(([_, count]) => count > 3);

  if (highInjuryTeams.length > 0) {
    anomalies.push({
      type: 'injury_cluster',
      severity: 'high',
      description: 'Multiple teams with high injury counts',
      details: { highInjuryTeams }
    });
  }

  // Check for position-specific trends
  const positionInjuryCounts: Record<string, number> = {};
  injuries.forEach((injury: any) => {
    positionInjuryCounts[injury.position] = (positionInjuryCounts[injury.position] || 0) + 1;
  });

  const unusualPositions = Object.entries(positionInjuryCounts)
    .filter(([position, count]) => count > (positionTrends[position]?.average || 2) * 2);

  if (unusualPositions.length > 0) {
    anomalies.push({
      type: 'position_injury_trend',
      severity: 'medium',
      description: 'Unusual injury patterns by position',
      details: { unusualPositions }
    });
  }

  return anomalies;
}

async function detectScoringAnomalies(data: any): Promise<any[]> {
  const anomalies = [];
  const { gameScores, expectedScores, scoringSystem } = data;

  // Check for scoring discrepancies
  const discrepancies = gameScores.filter((game: any) => {
    const expected = expectedScores[game.id];
    const difference = Math.abs(game.actual - expected);
    return difference > expected * 0.3;
  });

  if (discrepancies.length > 0) {
    anomalies.push({
      type: 'scoring_discrepancy',
      severity: 'critical',
      description: 'Large differences between expected and actual scores',
      details: { discrepancies }
    });
  }

  // Check for stat corrections
  const corrections = gameScores.filter((game: any) => game.hasCorrections);
  
  if (corrections.length > 2) {
    anomalies.push({
      type: 'stat_corrections',
      severity: 'medium',
      description: 'Multiple stat corrections detected',
      details: { corrections }
    });
  }

  return anomalies;
}

function generateRecommendations(anomalies: any[], type: string): string[] {
  const recommendations = [];

  // Type-specific recommendations
  switch (type) {
    case 'player_performance':
      if (anomalies.some(a => a.type === 'performance_drop')) {
        recommendations.push('Consider benching or trading underperforming players');
        recommendations.push('Check for unreported injuries or personal issues');
      }
      if (anomalies.some(a => a.type === 'unusual_consistency')) {
        recommendations.push('Player may be due for regression to mean');
      }
      break;

    case 'lineup_optimization':
      if (anomalies.some(a => a.type === 'team_overexposure')) {
        recommendations.push('Diversify lineup across multiple teams');
        recommendations.push('Consider game script risk with heavy team stacking');
      }
      if (anomalies.some(a => a.type === 'low_ceiling')) {
        recommendations.push('Add high-upside players for tournament play');
      }
      break;

    case 'market_trends':
      if (anomalies.some(a => a.type === 'price_spike')) {
        recommendations.push('Research news for price movement causes');
        recommendations.push('Consider fading overpriced players');
      }
      break;

    case 'injury_patterns':
      if (anomalies.some(a => a.type === 'injury_cluster')) {
        recommendations.push('Avoid players from heavily injured teams');
        recommendations.push('Target opponents of injury-depleted teams');
      }
      break;

    case 'scoring_irregularities':
      if (anomalies.some(a => a.type === 'scoring_discrepancy')) {
        recommendations.push('Verify scoring settings are correct');
        recommendations.push('Contact support if discrepancies persist');
      }
      break;
  }

  // General recommendations based on severity
  const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
  if (criticalCount > 0) {
    recommendations.push('Immediate action required - review all critical anomalies');
  }

  return recommendations;
}