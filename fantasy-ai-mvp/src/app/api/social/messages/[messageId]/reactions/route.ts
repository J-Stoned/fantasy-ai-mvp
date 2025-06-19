import { NextRequest, NextResponse } from 'next/server';
import { socialService, ReactionType } from '@/lib/social-service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await context.params;
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['userId', 'reactionType'];
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

    // Validate reaction type
    const reactionType = body.reactionType as ReactionType;
    if (!Object.values(ReactionType).includes(reactionType)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid reaction type' 
        },
        { status: 400 }
      );
    }

    await socialService.addReactionToMessage(messageId, body.userId, reactionType);

    return NextResponse.json({
      success: true,
      message: 'Reaction added successfully'
    });

  } catch (error) {
    console.error('Error adding reaction to message:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to add reaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}