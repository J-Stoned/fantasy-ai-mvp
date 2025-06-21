import { NextRequest, NextResponse } from 'next/server';
import { dfsService } from '@/lib/dfs-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.contestId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'contestId is required' 
        },
        { status: 400 }
      );
    }

    const constraints = {
      lockedPlayers: body.lockedPlayers || [],
      excludedPlayers: body.excludedPlayers || [],
      maxOwnership: body.maxOwnership || undefined,
      stackTeams: body.stackTeams || []
    };

    const optimizedLineup = await dfsService.optimizeLineup(body.contestId, constraints);

    return NextResponse.json({
      success: true,
      data: optimizedLineup,
      message: 'Lineup optimized successfully'
    });

  } catch (error) {
    console.error('Error optimizing lineup:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to optimize lineup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}