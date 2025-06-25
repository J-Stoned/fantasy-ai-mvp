import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { tournamentSystem } from '@/lib/social/tournament-system';

// GET /api/tournaments - Get available tournaments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'upcoming';
    const type = searchParams.get('type');

    // Get tournaments
    const tournaments = await prisma.tournament.findMany({
      where: {
        status,
        ...(type && { type })
      },
      include: {
        TournamentEntry: {
          select: {
            userId: true
          }
        },
        _count: {
          select: {
            TournamentEntry: true
          }
        }
      },
      orderBy: { startDate: 'asc' }
    });

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    // Format tournaments
    const formattedTournaments = tournaments.map(tournament => ({
      id: tournament.id,
      name: tournament.name,
      type: tournament.type,
      format: tournament.format,
      entryFee: tournament.entryFee,
      prizePool: tournament.prizePool,
      maxEntries: tournament.maxEntries,
      currentEntries: tournament._count.TournamentEntry,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      status: tournament.status,
      isRegistered: user ? tournament.TournamentEntry.some(e => e.userId === user.id) : false,
      settings: tournament.settings,
      rules: tournament.rules
    }));

    return NextResponse.json({
      tournaments: formattedTournaments,
      stats: {
        upcoming: formattedTournaments.filter(t => t.status === 'upcoming').length,
        active: formattedTournaments.filter(t => t.status === 'active').length,
        completed: formattedTournaments.filter(t => t.status === 'completed').length
      }
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    );
  }
}

// POST /api/tournaments - Create a new tournament (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      name,
      type,
      format,
      entryFee,
      prizePool,
      maxEntries,
      startDate,
      endDate,
      settings,
      rules
    } = await request.json();

    // Get user and check admin status
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // TODO: Add admin check
    // if (!user.isAdmin) {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    // }

    // Create tournament
    const tournament = await prisma.tournament.create({
      data: {
        name,
        type,
        format,
        entryFee: entryFee || 0,
        prizePool: prizePool || {},
        maxEntries,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'upcoming',
        currentRound: 0,
        settings: settings || {},
        rules: rules || {}
      }
    });

    return NextResponse.json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        type: tournament.type,
        status: tournament.status
      }
    });
  } catch (error) {
    console.error('Error creating tournament:', error);
    return NextResponse.json(
      { error: 'Failed to create tournament' },
      { status: 500 }
    );
  }
}

