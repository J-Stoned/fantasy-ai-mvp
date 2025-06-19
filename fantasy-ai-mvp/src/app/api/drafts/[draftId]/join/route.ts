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
    if (!body.userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required field: userId' 
        },
        { status: 400 }
      );
    }

    const participant = await draftService.joinDraft(
      draftId, 
      body.userId, 
      body.teamName
    );

    return NextResponse.json({
      success: true,
      data: participant,
      message: 'Successfully joined draft'
    }, { status: 201 });

  } catch (error) {
    console.error('Error joining draft:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to join draft',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ draftId: string }> }
) {
  try {
    const { draftId } = await context.params;
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

    await draftService.leaveDraft(draftId, userId);

    return NextResponse.json({
      success: true,
      message: 'Successfully left draft'
    });

  } catch (error) {
    console.error('Error leaving draft:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to leave draft',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}