import { NextRequest, NextResponse } from 'next/server';
import { bettingService } from '@/lib/betting-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    const playerId = searchParams.get('playerId');

    const playerProps = await bettingService.getPlayerProps(gameId || undefined, playerId || undefined);

    return NextResponse.json({
      success: true,
      data: playerProps,
      count: playerProps.length
    });

  } catch (error) {
    console.error('Error fetching player props:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch player props',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}