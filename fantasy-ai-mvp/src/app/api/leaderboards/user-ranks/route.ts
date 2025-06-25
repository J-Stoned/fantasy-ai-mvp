import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { leaderboardSystem } from '@/lib/gamification/leaderboards';

// GET /api/leaderboards/user-ranks - Get user's ranks across all leaderboards
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all user's leaderboard entries
    const entries = await prisma.leaderboardEntry.findMany({
      where: { userId: user.id },
      include: {
        Leaderboard: true
      }
    });

    // Format ranks
    const ranks = entries.map(entry => ({
      leaderboardId: entry.leaderboardId,
      name: entry.Leaderboard.name,
      type: entry.Leaderboard.type,
      category: entry.Leaderboard.category,
      timeframe: entry.Leaderboard.timeframe,
      rank: entry.rank,
      score: entry.score,
      percentile: leaderboardSystem.getPercentileRank(
        entry.rank,
        (entry.Leaderboard.metadata as any)?.totalParticipants || 100
      ),
      trend: entry.trend
    }));

    return NextResponse.json({
      ranks,
      totalLeaderboards: ranks.length
    });
  } catch (error) {
    console.error('Error fetching user ranks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user ranks' },
      { status: 500 }
    );
  }
}