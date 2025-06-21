import { NextRequest, NextResponse } from 'next/server';
import { dfsService } from '@/lib/dfs-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['userId', 'contestId', 'name', 'players'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Missing required field: ${field}` 
          },
          { status: 400 }
        );
      }
    }

    // Validate players array
    if (!Array.isArray(body.players) || body.players.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Players array is required and cannot be empty' 
        },
        { status: 400 }
      );
    }

    // Validate each player object
    for (const player of body.players) {
      if (!player.dfsPlayerId || !player.position || !player.slotPosition) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Each player must have dfsPlayerId, position, and slotPosition' 
          },
          { status: 400 }
        );
      }
    }

    const lineup = await dfsService.createLineup(body.userId, body.contestId, {
      name: body.name,
      players: body.players
    });

    return NextResponse.json({
      success: true,
      data: lineup,
      message: 'Lineup created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating lineup:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create lineup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const contestId = searchParams.get('contestId') || undefined;

    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'userId is required' 
        },
        { status: 400 }
      );
    }

    const lineups = await dfsService.getUserLineups(userId, contestId);

    return NextResponse.json({
      success: true,
      data: lineups,
      count: lineups.length,
      userId,
      contestId
    });

  } catch (error) {
    console.error('Error fetching lineups:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch lineups',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}