import { NextRequest, NextResponse } from 'next/server';
import { dfsService } from '@/lib/dfs-service';

export async function GET(
  request: NextRequest, 
  context: { params: Promise<{ contestId: string }> }
) {
  try {
    const { contestId } = await context.params;
    
    const contest = await dfsService.getContest(contestId);

    if (!contest) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Contest not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: contest
    });

  } catch (error) {
    console.error('Error fetching contest:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch contest',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}