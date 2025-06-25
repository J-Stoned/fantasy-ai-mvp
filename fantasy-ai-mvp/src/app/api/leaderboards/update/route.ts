import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// POST /api/leaderboards/update - Update user score
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, points, metadata } = await request.json();

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        UserGameStats: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user's game stats based on type
    const updates: any = {};
    
    switch (type) {
      case 'game':
        updates.gamesWon = metadata?.won ? { increment: 1 } : undefined;
        updates.gamesLost = !metadata?.won ? { increment: 1 } : undefined;
        updates.totalPoints = { increment: points };
        if (points > (user.UserGameStats?.highestWeeklyScore || 0)) {
          updates.highestWeeklyScore = points;
        }
        break;
      case 'achievement':
        // XP already handled by achievement system
        break;
      case 'challenge':
        updates.currentXP = { increment: points };
        updates.totalXP = { increment: points };
        break;
      case 'social':
        // Track social interactions
        break;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.userGameStats.update({
        where: { userId: user.id },
        data: updates
      });
    }

    // Update leaderboards
    const leaderboardsToUpdate = [
      { type: 'global', category: 'overall', timeframe: 'all-time' },
      { type: 'global', category: 'overall', timeframe: 'season' },
      { type: 'global', category: 'overall', timeframe: 'week' }
    ];

    if (type === 'social') {
      leaderboardsToUpdate.push(
        { type: 'global', category: 'social', timeframe: 'all-time' }
      );
    }

    for (const lb of leaderboardsToUpdate) {
      const leaderboard = await prisma.leaderboard.findFirst({
        where: {
          type: lb.type,
          category: lb.category,
          timeframe: lb.timeframe
        }
      });

      if (leaderboard) {
        await prisma.leaderboardEntry.upsert({
          where: {
            leaderboardId_userId: {
              leaderboardId: leaderboard.id,
              userId: user.id
            }
          },
          update: {
            score: { increment: points },
            lastUpdated: new Date()
          },
          create: {
            leaderboardId: leaderboard.id,
            userId: user.id,
            username: user.name || 'Anonymous',
            avatar: user.image,
            level: user.UserGameStats?.level || 1,
            score: points,
            rank: 999999, // Will be updated by background job
            lastUpdated: new Date()
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      pointsAdded: points
    });
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to update leaderboard' },
      { status: 500 }
    );
  }
}