import { NextRequest, NextResponse } from 'next/server';
import { draftService, DraftType, DraftStatus, DraftOrder } from '@/lib/draft-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      sport: searchParams.get('sport') || undefined,
      draftType: searchParams.get('draftType') as DraftType || undefined,
      status: searchParams.get('status') as DraftStatus || undefined,
      isPublic: searchParams.get('isPublic') ? searchParams.get('isPublic') === 'true' : undefined,
      isMockDraft: searchParams.get('isMockDraft') ? searchParams.get('isMockDraft') === 'true' : undefined,
    };

    const drafts = await draftService.getDrafts(filters);

    return NextResponse.json({
      success: true,
      data: drafts,
      count: drafts.length
    });

  } catch (error) {
    console.error('Error fetching drafts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch drafts',
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
    const requiredFields = [
      'name', 'sport', 'draftType', 'creatorId'
    ];
    
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

    // Convert date strings to Date objects if provided
    const draftData = {
      ...body,
      draftOrder: body.draftOrder || DraftOrder.SNAKE,
      totalRounds: body.totalRounds || 15,
      timePerPick: body.timePerPick || 90,
      isAuction: body.isAuction || false,
      isSnakeDraft: body.isSnakeDraft !== false, // Default to true
      isMockDraft: body.isMockDraft || false,
      isPublic: body.isPublic !== false, // Default to true
      maxParticipants: body.maxParticipants || 12,
      status: DraftStatus.SCHEDULED,
      currentRound: 1,
      currentPick: 1,
      settings: body.settings || {},
      scheduledStart: body.scheduledStart ? new Date(body.scheduledStart) : undefined,
    };

    const draft = await draftService.createDraft(draftData);

    return NextResponse.json({
      success: true,
      data: draft,
      message: 'Draft created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating draft:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create draft',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}