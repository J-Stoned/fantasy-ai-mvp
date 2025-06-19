import { NextRequest, NextResponse } from 'next/server';
import { socialService } from '@/lib/social-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'friends'; // 'friends' or 'requests'

    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameter: userId' 
        },
        { status: 400 }
      );
    }

    let data;
    if (type === 'requests') {
      data = await socialService.getPendingFriendRequests(userId);
    } else {
      data = await socialService.getFriends(userId);
    }

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
      type
    });

  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch friends',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['initiatorId', 'recipientId'];
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

    if (body.initiatorId === body.recipientId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot send friend request to yourself' 
        },
        { status: 400 }
      );
    }

    const friendship = await socialService.sendFriendRequest(body.initiatorId, body.recipientId);

    return NextResponse.json({
      success: true,
      data: friendship,
      message: 'Friend request sent successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error sending friend request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send friend request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}