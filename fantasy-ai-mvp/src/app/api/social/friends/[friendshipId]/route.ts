import { NextRequest, NextResponse } from 'next/server';
import { socialService } from '@/lib/social-service';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ friendshipId: string }> }
) {
  try {
    const { friendshipId } = await context.params;
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['userId', 'accept'];
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

    const friendship = await socialService.respondToFriendRequest(
      friendshipId,
      body.userId,
      body.accept
    );

    return NextResponse.json({
      success: true,
      data: friendship,
      message: `Friend request ${body.accept ? 'accepted' : 'declined'} successfully`
    });

  } catch (error) {
    console.error('Error responding to friend request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to respond to friend request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}