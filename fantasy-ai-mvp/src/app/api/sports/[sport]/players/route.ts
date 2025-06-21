import { NextRequest, NextResponse } from 'next/server';
import { multiSportService } from '@/lib/multi-sport-service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sport: string }> }
) {
  try {
    const { sport } = await context.params;
    const { searchParams } = new URL(request.url);
    
    const options: any = {};
    
    // Parse query parameters
    const position = searchParams.get('position');
    if (position) {
      options.position = position;
    }
    
    const team = searchParams.get('team');
    if (team) {
      options.team = team;
    }
    
    const limit = searchParams.get('limit');
    if (limit) {
      options.limit = parseInt(limit, 10);
    }
    
    const active = searchParams.get('active');
    if (active !== null) {
      options.active = active === 'true';
    }

    const players = await multiSportService.getPlayers(sport, options);

    return NextResponse.json({
      success: true,
      data: players,
      count: players.length,
      sport
    });

  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch players',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}