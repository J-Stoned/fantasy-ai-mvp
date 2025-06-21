import { NextRequest, NextResponse } from 'next/server';
import { getAllUserLeagues, getStoredConnections, getIntegrationStats } from '@/lib/fantasy-oauth';

// GET /api/leagues - Get all user leagues across platforms
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const sport = searchParams.get('sport');

    // Get all connections and leagues
    const connections = getStoredConnections();
    let leagues = getAllUserLeagues();

    // Filter by platform if specified
    if (platform) {
      leagues = leagues.filter(league => league.platform === platform);
    }

    // Filter by sport if specified
    if (sport) {
      leagues = leagues.filter(league => league.sport.toLowerCase() === sport.toLowerCase());
    }

    // Get integration stats
    const stats = getIntegrationStats();

    return NextResponse.json({
      success: true,
      leagues,
      stats,
      connections: connections.map(conn => ({
        platformId: conn.platformId,
        connectedAt: conn.connectedAt,
        leagueCount: conn.leagues.length
      }))
    });

  } catch (error) {
    console.error('Get leagues error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leagues' },
      { status: 500 }
    );
  }
}

// POST /api/leagues - Manually add/sync leagues (for testing)
export async function POST(request: NextRequest) {
  try {
    const { action, platform, leagues } = await request.json();

    if (action === 'sync') {
      // Simulate syncing leagues from platform
      const mockLeagues = leagues || [
        {
          id: `${platform}_mock_league_${Date.now()}`,
          name: `Mock ${platform.toUpperCase()} League`,
          platform,
          sport: 'NFL',
          season: '2024',
          totalTeams: 12,
          currentWeek: 14,
          userTeam: {
            id: `${platform}_team_1`,
            name: 'Fantasy.AI Powered Team',
            wins: Math.floor(Math.random() * 12) + 1,
            losses: Math.floor(Math.random() * 12) + 1,
            rank: Math.floor(Math.random() * 12) + 1
          }
        }
      ];

      return NextResponse.json({
        success: true,
        action: 'sync',
        platform,
        leagues: mockLeagues,
        message: `Synced ${mockLeagues.length} leagues from ${platform}`
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Post leagues error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}