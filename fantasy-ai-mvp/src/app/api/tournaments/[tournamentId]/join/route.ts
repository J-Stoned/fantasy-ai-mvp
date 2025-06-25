import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// POST /api/tournaments/:tournamentId/join - Join a tournament
export async function POST(
  request: NextRequest,
  { params }: { params: { tournamentId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tournamentId = params.tournamentId;

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

    // Get tournament
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        _count: {
          select: {
            TournamentEntry: true
          }
        }
      }
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    if (tournament.status !== 'upcoming') {
      return NextResponse.json(
        { error: 'Tournament registration closed' },
        { status: 400 }
      );
    }

    if (tournament._count.TournamentEntry >= tournament.maxEntries) {
      return NextResponse.json(
        { error: 'Tournament is full' },
        { status: 400 }
      );
    }

    // Check if already joined
    const existingEntry = await prisma.tournamentEntry.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId: user.id
        }
      }
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: 'Already registered for this tournament' },
        { status: 400 }
      );
    }

    // Check entry fee
    if (tournament.entryFee > 0) {
      // Check if user has enough gems
      const gems = user.UserGameStats?.gems || 0;
      if (gems < tournament.entryFee) {
        return NextResponse.json(
          { error: 'Insufficient gems for entry fee' },
          { status: 400 }
        );
      }

      // Deduct gems
      await prisma.userGameStats.update({
        where: { userId: user.id },
        data: {
          gems: { decrement: tournament.entryFee }
        }
      });
    }

    // Create entry
    const entry = await prisma.tournamentEntry.create({
      data: {
        tournamentId,
        userId: user.id,
        rank: 0,
        score: 0,
        bracket: determineBracket(tournament._count.TournamentEntry + 1),
        eliminated: false,
        stats: {
          roundsWon: 0,
          highestScore: 0,
          totalPoints: 0
        }
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        notificationType: 'tournament_joined',
        title: 'Tournament Registration',
        message: `You've been registered for ${tournament.name}!`,
        data: JSON.stringify({ tournamentId })
      }
    });

    return NextResponse.json({
      success: true,
      entry: {
        id: entry.id,
        bracket: entry.bracket
      }
    });
  } catch (error) {
    console.error('Error joining tournament:', error);
    return NextResponse.json(
      { error: 'Failed to join tournament' },
      { status: 500 }
    );
  }
}

// Helper function
function determineBracket(entryNumber: number): string {
  // Simple bracket assignment
  const brackets = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const bracketSize = 8;
  const bracketIndex = Math.floor((entryNumber - 1) / bracketSize) % brackets.length;
  return brackets[bracketIndex];
}