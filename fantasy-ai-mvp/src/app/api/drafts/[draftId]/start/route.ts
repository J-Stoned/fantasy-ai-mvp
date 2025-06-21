import { NextRequest, NextResponse } from 'next/server';
import { draftService } from '@/lib/draft-service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ draftId: string }> }
) {
  try {
    const { draftId } = await context.params;
    
    await draftService.startDraft(draftId);

    return NextResponse.json({
      success: true,
      message: 'Draft started successfully'
    });

  } catch (error) {
    console.error('Error starting draft:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to start draft',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}