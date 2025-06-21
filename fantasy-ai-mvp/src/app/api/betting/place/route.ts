import { NextRequest, NextResponse } from 'next/server';
import { bettingService } from '@/lib/betting-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['userId', 'selections', 'stake'];
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

    // Validate selections array
    if (!Array.isArray(body.selections) || body.selections.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Selections must be a non-empty array' 
        },
        { status: 400 }
      );
    }

    // Validate stake
    if (typeof body.stake !== 'number' || body.stake <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Stake must be a positive number' 
        },
        { status: 400 }
      );
    }

    const bettingSlip = await bettingService.placeBet(
      body.selections,
      body.stake,
      body.userId
    );

    return NextResponse.json({
      success: true,
      data: bettingSlip,
      message: 'Bet placed successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error placing bet:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to place bet',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}