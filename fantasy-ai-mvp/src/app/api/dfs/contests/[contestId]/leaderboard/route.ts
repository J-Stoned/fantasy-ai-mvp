import { NextRequest, NextResponse } from 'next/server';
import { dfsService } from '@/lib/dfs-service';

export async function GET(
  request: NextRequest, 
  context: { params: Promise<{ contestId: string }> }
) {
  try {
    const { contestId } = await context.params;
    
    const leaderboard = await dfsService.getContestLeaderboard(contestId);

    return NextResponse.json({
      success: true,
      data: leaderboard,
      count: leaderboard.length,
      contestId
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch leaderboard',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}