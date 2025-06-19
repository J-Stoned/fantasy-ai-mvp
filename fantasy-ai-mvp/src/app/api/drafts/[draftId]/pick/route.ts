import { NextRequest, NextResponse } from 'next/server';
import { draftService } from '@/lib/draft-service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ draftId: string }> }
) {
  try {
    const { draftId } = await context.params;
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['userId', 'playerId'];
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

    const pick = await draftService.makePick(
      draftId,
      body.userId,
      body.playerId,
      body.auctionPrice
    );

    return NextResponse.json({
      success: true,
      data: pick,
      message: 'Pick made successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error making pick:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to make pick',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}