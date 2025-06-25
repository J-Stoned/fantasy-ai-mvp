import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { playerPerformanceModel } from '@/lib/ml/models/player-performance-predictor';
import { injuryRiskModel } from '@/lib/ml/models/injury-risk-assessment';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get all connected leagues
    const leagues = await prisma.connectedLeague.findMany({
      where: { userId: session.user.id },
      include: {
        teams: {
          where: { userId: session.user.id }
        },
        standings: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Get platform connections
    const connections = await prisma.platformConnection.findMany({
      where: { userId: session.user.id }
    });
    
    // Process leagues with ML insights
    const leaguesWithInsights = await Promise.all(
      leagues.map(async (league) => {
        const team = league.teams[0];
        let insights = null;
        
        if (team?.roster) {
          // Initialize ML models
          await playerPerformanceModel.initialize();
          await injuryRiskModel.initialize();
          
          // Get top players from roster
          const topPlayers = (team.roster as any).players?.slice(0, 3) || [];
          
          // Generate insights for top players
          const playerInsights = await Promise.all(
            topPlayers.map(async (player: any) => {
              try {
                // Player performance prediction
                const performance = await playerPerformanceModel.predictPoints({
                  playerId: player.player_id || player.id,
                  name: player.full_name || player.name,
                  position: player.position,
                  team: player.team,
                  week: league.currentWeek + 1,
                  opponent: 'TBD', // Would need schedule data
                  isHome: true,
                  weather: { temperature: 72, wind: 5, precipitation: 0 },
                  restDays: 7,
                  injuryStatus: player.injury_status || 'healthy'
                });
                
                // Injury risk
                const injury = await injuryRiskModel.assessRisk(
                  player.player_id || player.id,
                  4
                );
                
                return {
                  player: player.full_name || player.name,
                  projectedPoints: performance.points,
                  confidence: performance.confidence,
                  injuryRisk: injury.highRiskAlert,
                  weeklyRisks: injury.weeklyRisks
                };
              } catch (error) {
                return null;
              }
            })
          );
          
          insights = {
            topPerformers: playerInsights.filter(p => p !== null),
            teamProjection: playerInsights
              .filter(p => p !== null)
              .reduce((sum, p) => sum + p.projectedPoints, 0),
            injuryAlerts: playerInsights
              .filter(p => p?.injuryRisk)
              .map(p => p.player)
          };
        }
        
        return {
          id: league.id,
          platform: league.platform,
          name: league.name,
          sport: league.sport,
          season: league.season,
          currentWeek: league.currentWeek,
          team: team ? {
            id: team.id,
            name: team.name,
            rosterSize: (team.roster as any).players?.length || 0
          } : null,
          standings: league.standings[0]?.standings || [],
          insights
        };
      })
    );
    
    return NextResponse.json({
      leagues: leaguesWithInsights,
      connections: connections.map(c => ({
        platform: c.platform,
        isActive: c.isActive,
        connectedAt: c.createdAt
      })),
      summary: {
        totalLeagues: leagues.length,
        byPlatform: leagues.reduce((acc, l) => {
          acc[l.platform] = (acc[l.platform] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        bySport: leagues.reduce((acc, l) => {
          acc[l.sport] = (acc[l.sport] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    });
    
  } catch (error) {
    console.error('Get leagues error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leagues' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to disconnect a league
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { leagueId } = await req.json();
    
    if (!leagueId) {
      return NextResponse.json(
        { error: 'League ID is required' },
        { status: 400 }
      );
    }
    
    // Verify ownership
    const league = await prisma.connectedLeague.findFirst({
      where: {
        id: leagueId,
        userId: session.user.id
      }
    });
    
    if (!league) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      );
    }
    
    // Delete league and related data
    await prisma.connectedLeague.delete({
      where: { id: leagueId }
    });
    
    return NextResponse.json({
      success: true,
      message: 'League disconnected successfully'
    });
    
  } catch (error) {
    console.error('Delete league error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect league' },
      { status: 500 }
    );
  }
}