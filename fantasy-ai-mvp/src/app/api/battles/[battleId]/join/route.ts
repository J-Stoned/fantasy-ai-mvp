import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// POST /api/battles/:battleId/join - Join a battle
export async function POST(
  request: NextRequest,
  { params }: { params: { battleId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const battleId = params.battleId;

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get battle
    const battle = await prisma.battle.findUnique({
      where: { id: battleId },
      include: {
        BattleParticipant: true
      }
    });

    if (!battle) {
      return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
    }

    if (battle.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Battle already started' },
        { status: 400 }
      );
    }

    // Check if already joined
    if (battle.BattleParticipant.some(p => p.userId === user.id)) {
      return NextResponse.json(
        { error: 'Already joined this battle' },
        { status: 400 }
      );
    }

    // Join battle
    await prisma.battleParticipant.create({
      data: {
        battleId,
        userId: user.id,
        score: 0,
        roster: null,
        eliminated: false,
        powerUpsUsed: [],
        stats: {
          roundsWon: 0,
          perfectLineups: 0,
          comebacks: 0,
          highestScore: 0
        }
      }
    });

    // Check if battle should start
    const maxParticipants = getMaxParticipants(battle.type);
    if (battle.BattleParticipant.length + 1 >= maxParticipants) {
      await startBattle(battleId);
    }

    return NextResponse.json({
      success: true,
      message: 'Joined battle successfully'
    });
  } catch (error) {
    console.error('Error joining battle:', error);
    return NextResponse.json(
      { error: 'Failed to join battle' },
      { status: 500 }
    );
  }
}

// Helper functions

function getMaxParticipants(type: string): number {
  switch (type) {
    case 'quick': return 2;
    case 'tournament': return 8;
    case 'ladder': return 2;
    default: return 4;
  }
}

async function startBattle(battleId: string): Promise<void> {
  // Update battle status
  await prisma.battle.update({
    where: { id: battleId },
    data: {
      status: 'active',
      startedAt: new Date(),
      currentRound: 1
    }
  });

  // Create first round
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 7);

  await prisma.battleRound.create({
    data: {
      battleId,
      roundNumber: 1,
      startDate: new Date(),
      endDate,
      matchups: {},
      leaderboard: {
        entries: [],
        averageScore: 0,
        highestScore: 0
      },
      events: []
    }
  });

  // Notify participants
  const participants = await prisma.battleParticipant.findMany({
    where: { battleId }
  });

  for (const participant of participants) {
    await prisma.notification.create({
      data: {
        userId: participant.userId,
        notificationType: 'battle_started',
        title: 'Battle Started!',
        message: 'Your battle has begun. Set your lineup now!',
        data: JSON.stringify({ battleId })
      }
    });
  }
}