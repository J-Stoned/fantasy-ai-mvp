import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { leaderboardSystem } from '@/lib/gamification/leaderboards';

// GET /api/leaderboards - Get leaderboard data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'global';
    const category = searchParams.get('category') || 'overall';
    const timeframe = searchParams.get('timeframe') || 'all-time';
    const limit = parseInt(searchParams.get('limit') || '100');

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get leaderboard from database
    const leaderboard = await prisma.leaderboard.findFirst({
      where: {
        type,
        category: category || null,
        timeframe
      },
      include: {
        LeaderboardEntry: {
          orderBy: { rank: 'asc' },
          take: limit
        }
      }
    });

    if (!leaderboard) {
      return NextResponse.json(
        { error: 'Leaderboard not found' },
        { status: 404 }
      );
    }

    // Get user's rank
    const userEntry = await prisma.leaderboardEntry.findFirst({
      where: {
        leaderboardId: leaderboard.id,
        userId: user.id
      }
    });

    // Get friends' ranks if viewing friends leaderboard
    let friendsEntries = [];
    if (type === 'friends' || searchParams.get('includeFriends') === 'true') {
      const friendConnections = await prisma.friendConnection.findMany({
        where: {
          OR: [
            { userId: user.id, status: 'accepted' },
            { friendId: user.id, status: 'accepted' }
          ]
        }
      });

      const friendIds = friendConnections.map(c => 
        c.userId === user.id ? c.friendId : c.userId
      );

      friendsEntries = await prisma.leaderboardEntry.findMany({
        where: {
          leaderboardId: leaderboard.id,
          userId: { in: friendIds }
        },
        orderBy: { rank: 'asc' }
      });
    }

    return NextResponse.json({
      leaderboard: {
        id: leaderboard.id,
        name: leaderboard.name,
        type: leaderboard.type,
        category: leaderboard.category,
        timeframe: leaderboard.timeframe,
        lastUpdated: leaderboard.lastUpdated,
        metadata: leaderboard.metadata,
        entries: leaderboard.LeaderboardEntry,
        userEntry,
        friendsEntries
      },
      stats: {
        totalParticipants: (leaderboard.metadata as any)?.totalParticipants || 0,
        averageScore: (leaderboard.metadata as any)?.averageScore || 0,
        topScore: (leaderboard.metadata as any)?.topScore || 0,
        userRank: userEntry?.rank,
        userPercentile: userEntry ? 
          leaderboardSystem.getPercentileRank(
            userEntry.rank,
            (leaderboard.metadata as any)?.totalParticipants || 100
          ) : null
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}


