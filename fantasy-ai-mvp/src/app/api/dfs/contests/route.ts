import { NextRequest, NextResponse } from 'next/server';
import { dfsService, ContestType, ContestStatus } from '@/lib/dfs-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      sport: searchParams.get('sport') || undefined,
      contestType: searchParams.get('contestType') as ContestType || undefined,
      minEntryFee: searchParams.get('minEntryFee') ? Number(searchParams.get('minEntryFee')) : undefined,
      maxEntryFee: searchParams.get('maxEntryFee') ? Number(searchParams.get('maxEntryFee')) : undefined,
      status: searchParams.get('status') as ContestStatus || undefined,
    };

    const contests = await dfsService.getContests(filters);

    return NextResponse.json({
      success: true,
      data: contests,
      count: contests.length
    });

  } catch (error) {
    console.error('Error fetching contests:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch contests',
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
      'name', 'description', 'sport', 'contestType', 
      'entryFee', 'totalPrizePool', 'maxEntries', 
      'salaryCap', 'startTime', 'endTime'
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

    // Convert date strings to Date objects
    const contestData = {
      ...body,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      status: ContestStatus.UPCOMING,
      isPublic: body.isPublic ?? true,
      isGuaranteed: body.isGuaranteed ?? false
    };

    const contest = await dfsService.createContest(contestData);

    return NextResponse.json({
      success: true,
      data: contest,
      message: 'Contest created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating contest:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create contest',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}