import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { achievementSystem } from '@/lib/gamification/achievement-system';

// GET /api/achievements - Get user's achievements
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

    // Get all achievements with user progress
    const achievements = await prisma.achievement.findMany({
      include: {
        UserAchievement: {
          where: { userId: user.id }
        }
      },
      orderBy: [
        { category: 'asc' },
        { xpReward: 'asc' }
      ]
    });

    // Get user's game stats
    const gameStats = await prisma.userGameStats.findUnique({
      where: { userId: user.id }
    });

    // Format response
    const formattedAchievements = achievements.map(achievement => ({
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      category: achievement.category,
      rarity: achievement.rarity,
      xpReward: achievement.xpReward,
      gemReward: achievement.gemReward,
      secret: achievement.secret,
      requirements: achievement.requirements,
      unlocked: achievement.UserAchievement.length > 0,
      unlockedAt: achievement.UserAchievement[0]?.unlockedAt,
      progress: achievement.UserAchievement[0]?.progress
    }));

    return NextResponse.json({
      achievements: formattedAchievements,
      stats: {
        totalUnlocked: formattedAchievements.filter(a => a.unlocked).length,
        totalAvailable: achievements.length,
        level: gameStats?.level || 1,
        currentXP: gameStats?.currentXP || 0,
        totalXP: gameStats?.totalXP || 0,
        gems: gameStats?.gems || 0
      }
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}

// POST /api/achievements/check - Check for new achievements
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event } = await request.json();

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check achievements using the achievement system
    const newAchievements = await achievementSystem.checkAchievements(
      user.id,
      event
    );

    // Save new achievements to database
    for (const achievement of newAchievements) {
      await prisma.userAchievement.create({
        data: {
          userId: user.id,
          achievementId: achievement.id,
          progress: {}
        }
      });

      // Update user's XP and gems
      await prisma.userGameStats.upsert({
        where: { userId: user.id },
        update: {
          currentXP: { increment: achievement.xpReward },
          totalXP: { increment: achievement.xpReward },
          gems: achievement.gemReward ? { increment: achievement.gemReward } : undefined
        },
        create: {
          userId: user.id,
          level: 1,
          currentXP: achievement.xpReward,
          totalXP: achievement.xpReward,
          gems: achievement.gemReward || 0
        }
      });
    }

    return NextResponse.json({
      newAchievements,
      count: newAchievements.length
    });
  } catch (error) {
    console.error('Error checking achievements:', error);
    return NextResponse.json(
      { error: 'Failed to check achievements' },
      { status: 500 }
    );
  }
}