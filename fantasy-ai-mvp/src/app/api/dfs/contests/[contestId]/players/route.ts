import { NextRequest, NextResponse } from 'next/server';
import { dfsService } from '@/lib/dfs-service';

export async function GET(
  request: NextRequest, 
  context: { params: Promise<{ contestId: string }> }
) {
  try {
    const { contestId } = await context.params;
    const { searchParams } = new URL(request.url);
    
    const filters = {
      position: searchParams.get('position') || undefined,
      minSalary: searchParams.get('minSalary') ? Number(searchParams.get('minSalary')) : undefined,
      maxSalary: searchParams.get('maxSalary') ? Number(searchParams.get('maxSalary')) : undefined,
      minProjected: searchParams.get('minProjected') ? Number(searchParams.get('minProjected')) : undefined,
      maxProjected: searchParams.get('maxProjected') ? Number(searchParams.get('maxProjected')) : undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
    };

    const players = await dfsService.getContestPlayers(contestId, filters);

    return NextResponse.json({
      success: true,
      data: players,
      count: players.length,
      contestId
    });

  } catch (error) {
    console.error('Error fetching contest players:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch contest players',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}