import { NextRequest, NextResponse } from 'next/server';
import { draftService } from '@/lib/draft-service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ draftId: string }> }
) {
  try {
    const { draftId } = await context.params;
    
    const draft = await draftService.getDraft(draftId);

    if (!draft) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Draft not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: draft
    });

  } catch (error) {
    console.error('Error fetching draft:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch draft',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}