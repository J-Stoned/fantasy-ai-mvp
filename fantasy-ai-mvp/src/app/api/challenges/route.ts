import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { weeklyChallenges } from '@/lib/gamification/weekly-challenges';

// GET /api/challenges - Get active challenges
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

    // Get active challenges
    const now = new Date();
    const challenges = await prisma.challenge.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now }
      },
      include: {
        UserChallenge: {
          where: { userId: user.id }
        },
        ChallengeLeaderboard: {
          orderBy: { rank: 'asc' },
          take: 10
        }
      }
    });

    // Format response
    const formattedChallenges = challenges.map(challenge => ({
      id: challenge.id,
      name: challenge.name,
      description: challenge.description,
      icon: challenge.icon,
      type: challenge.type,
      category: challenge.category,
      difficulty: challenge.difficulty,
      requirements: challenge.requirements,
      rewards: challenge.rewards,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      participants: challenge.participants,
      userProgress: challenge.UserChallenge[0]?.progress,
      completed: !!challenge.UserChallenge[0]?.completedAt,
      claimed: challenge.UserChallenge[0]?.claimed || false,
      leaderboard: challenge.ChallengeLeaderboard
    }));

    return NextResponse.json({
      challenges: formattedChallenges,
      activeChallenges: formattedChallenges.filter(c => !c.completed).length,
      completedChallenges: formattedChallenges.filter(c => c.completed).length
    });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}

// POST /api/challenges/progress - Update challenge progress
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

    // Check challenge progress
    const completedChallenges = await weeklyChallenges.checkChallengeProgress(
      user.id,
      event
    );

    // Update database for completed challenges
    for (const challenge of completedChallenges) {
      await prisma.userChallenge.update({
        where: {
          userId_challengeId: {
            userId: user.id,
            challengeId: challenge.id
          }
        },
        data: {
          completedAt: new Date(),
          score: 100 // Default score
        }
      });

      // Add to leaderboard
      const userGameStats = await prisma.userGameStats.findUnique({
        where: { userId: user.id }
      });

      await prisma.challengeLeaderboard.create({
        data: {
          challengeId: challenge.id,
          userId: user.id,
          username: user.name || 'Anonymous',
          score: 100,
          rank: 0, // Will be updated by a background job
          completedAt: new Date()
        }
      });

      // Award rewards
      if (challenge.rewards) {
        const rewards = challenge.rewards as any;
        if (rewards.xp) {
          await prisma.userGameStats.update({
            where: { userId: user.id },
            data: {
              currentXP: { increment: rewards.xp },
              totalXP: { increment: rewards.xp }
            }
          });
        }
        if (rewards.gems) {
          await prisma.userGameStats.update({
            where: { userId: user.id },
            data: {
              gems: { increment: rewards.gems }
            }
          });
        }
      }
    }

    return NextResponse.json({
      completedChallenges,
      count: completedChallenges.length
    });
  } catch (error) {
    console.error('Error updating challenge progress:', error);
    return NextResponse.json(
      { error: 'Failed to update challenge progress' },
      { status: 500 }
    );
  }
}

// PUT /api/challenges/:id/claim - Claim challenge rewards
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const challengeId = params.id;

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify challenge is completed
    const userChallenge = await prisma.userChallenge.findUnique({
      where: {
        userId_challengeId: {
          userId: user.id,
          challengeId
        }
      },
      include: {
        Challenge: true
      }
    });

    if (!userChallenge || !userChallenge.completedAt) {
      return NextResponse.json(
        { error: 'Challenge not completed' },
        { status: 400 }
      );
    }

    if (userChallenge.claimed) {
      return NextResponse.json(
        { error: 'Rewards already claimed' },
        { status: 400 }
      );
    }

    // Mark as claimed
    await prisma.userChallenge.update({
      where: {
        userId_challengeId: {
          userId: user.id,
          challengeId
        }
      },
      data: {
        claimed: true
      }
    });

    return NextResponse.json({
      success: true,
      rewards: userChallenge.Challenge.rewards
    });
  } catch (error) {
    console.error('Error claiming rewards:', error);
    return NextResponse.json(
      { error: 'Failed to claim rewards' },
      { status: 500 }
    );
  }
}