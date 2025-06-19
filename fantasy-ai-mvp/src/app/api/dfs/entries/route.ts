import { NextRequest, NextResponse } from 'next/server';
import { dfsService } from '@/lib/dfs-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['userId', 'contestId', 'lineupId'];
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

    const entry = await dfsService.enterContest(body.userId, body.contestId, body.lineupId);

    return NextResponse.json({
      success: true,
      data: entry,
      message: 'Successfully entered contest'
    }, { status: 201 });

  } catch (error) {
    console.error('Error entering contest:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to enter contest',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}