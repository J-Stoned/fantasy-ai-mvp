import { NextRequest, NextResponse } from 'next/server';
import { socialService, MessageType } from '@/lib/social-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      leagueId: searchParams.get('leagueId') || undefined,
      draftId: searchParams.get('draftId') || undefined,
      userId: searchParams.get('userId') || undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
    };

    const messages = await socialService.getMessages(filters);

    return NextResponse.json({
      success: true,
      data: messages,
      count: messages.length
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch messages',
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
    const requiredFields = ['senderId', 'content'];
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

    // Validate message type
    const messageType = body.messageType as MessageType || MessageType.TEXT;
    if (!Object.values(MessageType).includes(messageType)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid message type' 
        },
        { status: 400 }
      );
    }

    const messageData = {
      senderId: body.senderId,
      content: body.content,
      messageType,
      recipientId: body.recipientId,
      leagueId: body.leagueId,
      draftId: body.draftId,
      parentId: body.parentId,
      attachments: body.attachments
    };

    const message = await socialService.sendMessage(messageData);

    return NextResponse.json({
      success: true,
      data: message,
      message: 'Message sent successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}