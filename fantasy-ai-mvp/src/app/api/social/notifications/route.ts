import { NextRequest, NextResponse } from 'next/server';
import { socialService, NotificationType } from '@/lib/social-service';

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

    const filters = {
      isRead: searchParams.get('isRead') ? searchParams.get('isRead') === 'true' : undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
    };

    const notifications = await socialService.getNotifications(userId, filters);

    return NextResponse.json({
      success: true,
      data: notifications,
      count: notifications.length
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch notifications',
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
    const requiredFields = ['userId', 'notificationType', 'title', 'message'];
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

    // Validate notification type
    const notificationType = body.notificationType as NotificationType;
    if (!Object.values(NotificationType).includes(notificationType)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid notification type' 
        },
        { status: 400 }
      );
    }

    const notificationData = {
      userId: body.userId,
      notificationType,
      title: body.title,
      message: body.message,
      data: body.data
    };

    const notification = await socialService.createNotification(notificationData);

    return NextResponse.json({
      success: true,
      data: notification,
      message: 'Notification created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}