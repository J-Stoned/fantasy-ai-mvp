import { NextRequest, NextResponse } from 'next/server';
import { socialService, ActivityType } from '@/lib/social-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      leagueId: searchParams.get('leagueId') || undefined,
      userId: searchParams.get('userId') || undefined,
      activityTypes: searchParams.get('activityTypes') ? 
        searchParams.get('activityTypes')!.split(',') as ActivityType[] : undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
    };

    const activities = await socialService.getActivityFeed(filters);

    return NextResponse.json({
      success: true,
      data: activities,
      count: activities.length
    });

  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch activities',
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
    const requiredFields = ['userId', 'activityType', 'title', 'description'];
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

    // Validate activity type
    const activityType = body.activityType as ActivityType;
    if (!Object.values(ActivityType).includes(activityType)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid activity type' 
        },
        { status: 400 }
      );
    }

    const activityData = {
      userId: body.userId,
      leagueId: body.leagueId,
      activityType,
      title: body.title,
      description: body.description,
      metadata: body.metadata,
      isPublic: body.isPublic
    };

    const activity = await socialService.createActivity(activityData);

    return NextResponse.json({
      success: true,
      data: activity,
      message: 'Activity created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create activity',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}