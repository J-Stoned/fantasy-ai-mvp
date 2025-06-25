import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// GET /api/tournaments/:tournamentId - Get tournament details
export async function GET(
  request: NextRequest,
  { params }: { params: { tournamentId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tournamentId = params.tournamentId;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        TournamentEntry: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          },
          orderBy: { rank: 'asc' }
        },
        TournamentRound: {
          orderBy: { roundNumber: 'asc' }
        }
      }
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    // Format tournament
    const formatted = {
      id: tournament.id,
      name: tournament.name,
      type: tournament.type,
      format: tournament.format,
      entryFee: tournament.entryFee,
      prizePool: tournament.prizePool,
      maxEntries: tournament.maxEntries,
      currentEntries: tournament.TournamentEntry.length,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      status: tournament.status,
      currentRound: tournament.currentRound,
      settings: tournament.settings,
      rules: tournament.rules,
      entries: tournament.TournamentEntry.map(entry => ({
        user: entry.User,
        rank: entry.rank,
        score: entry.score,
        bracket: entry.bracket,
        eliminated: entry.eliminated,
        stats: entry.stats
      })),
      rounds: tournament.TournamentRound,
      userEntry: user ? tournament.TournamentEntry.find(e => e.userId === user.id) : null
    };

    return NextResponse.json({ tournament: formatted });
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournament' },
      { status: 500 }
    );
  }
}