import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { battleSystem } from '@/lib/social/head-to-head-battles';

// GET /api/battles - Get user's battles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const type = searchParams.get('type');

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get battles
    const battles = await prisma.battle.findMany({
      where: {
        status,
        ...(type && { type }),
        BattleParticipant: {
          some: {
            userId: user.id
          }
        }
      },
      include: {
        BattleParticipant: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        BattleRound: {
          orderBy: { roundNumber: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format battles
    const formattedBattles = battles.map(battle => ({
      id: battle.id,
      type: battle.type,
      format: battle.format,
      status: battle.status,
      settings: battle.settings,
      prizes: battle.prizes,
      currentRound: battle.currentRound,
      participants: battle.BattleParticipant.map(p => ({
        user: p.User,
        score: p.score,
        rank: p.rank,
        eliminated: p.eliminated
      })),
      rounds: battle.BattleRound,
      startedAt: battle.startedAt,
      completedAt: battle.completedAt,
      createdAt: battle.createdAt
    }));

    return NextResponse.json({
      battles: formattedBattles,
      stats: {
        active: formattedBattles.filter(b => b.status === 'active').length,
        completed: formattedBattles.filter(b => b.status === 'completed').length,
        waiting: formattedBattles.filter(b => b.status === 'waiting').length
      }
    });
  } catch (error) {
    console.error('Error fetching battles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch battles' },
      { status: 500 }
    );
  }
}

// POST /api/battles - Create a new battle
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, format, settings, inviteIds, isPublic } = await request.json();

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create battle
    const battle = await prisma.battle.create({
      data: {
        type,
        format,
        status: 'waiting',
        settings: settings || {},
        prizes: determinePrizes(type),
        chatEnabled: true,
        BattleParticipant: {
          create: {
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
        }
      },
      include: {
        BattleParticipant: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        }
      }
    });

    // Send invites
    if (inviteIds && inviteIds.length > 0) {
      for (const inviteId of inviteIds) {
        await prisma.notification.create({
          data: {
            userId: inviteId,
            notificationType: 'battle_invite',
            title: 'Battle Invitation',
            message: `${user.name || 'A player'} invited you to a ${type} battle!`,
            data: JSON.stringify({ battleId: battle.id, fromUserId: user.id })
          }
        });
      }
    }

    return NextResponse.json({
      battle: {
        id: battle.id,
        type: battle.type,
        format: battle.format,
        status: battle.status,
        participants: battle.BattleParticipant.map(p => ({
          user: p.User,
          score: p.score
        }))
      }
    });
  } catch (error) {
    console.error('Error creating battle:', error);
    return NextResponse.json(
      { error: 'Failed to create battle' },
      { status: 500 }
    );
  }
}

// Helper functions

function determinePrizes(type: string): any {
  switch (type) {
    case 'quick':
      return [
        { type: 'gems', amount: 10, description: 'Winner gets 10 gems' },
        { type: 'xp', amount: 100, description: 'All participants get 100 XP' }
      ];
    case 'tournament':
      return [
        { type: 'gems', amount: 100, description: '1st place: 100 gems' },
        { type: 'badge', itemId: 'tournament_winner', description: 'Tournament Winner badge' },
        { type: 'title', itemId: 'champion', description: 'Champion title' }
      ];
    case 'ladder':
      return [
        { type: 'gems', amount: 25, description: 'Ladder win: 25 gems' },
        { type: 'xp', amount: 200, description: 'Ladder XP bonus' }
      ];
    default:
      return [{ type: 'xp', amount: 50, description: 'Participation XP' }];
  }
}