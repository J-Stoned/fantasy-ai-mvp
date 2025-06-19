import { NextRequest, NextResponse } from 'next/server';
import { draftService, DraftType } from '@/lib/draft-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['userId', 'sport', 'draftType', 'teamCount', 'rounds', 'userPosition'];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Missing required field: ${field}` 
          },
          { status: 400 }
        );
      }
    }

    // Validate ranges
    if (body.teamCount < 2 || body.teamCount > 20) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Team count must be between 2 and 20' 
        },
        { status: 400 }
      );
    }

    if (body.userPosition < 1 || body.userPosition > body.teamCount) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User position must be between 1 and team count' 
        },
        { status: 400 }
      );
    }

    const settings = {
      sport: body.sport,
      draftType: body.draftType as DraftType,
      teamCount: Number(body.teamCount),
      rounds: Number(body.rounds),
      userPosition: Number(body.userPosition)
    };

    const mockDraftResult = await draftService.runMockDraft(body.userId, settings);

    return NextResponse.json({
      success: true,
      data: mockDraftResult,
      message: 'Mock draft completed successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error running mock draft:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to run mock draft',
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

    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameter: userId' 
        },
        { status: 400 }
      );
    }

    const mockDrafts = await draftService.getUserMockDrafts(userId);

    return NextResponse.json({
      success: true,
      data: mockDrafts,
      count: mockDrafts.length
    });

  } catch (error) {
    console.error('Error fetching mock drafts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch mock drafts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}