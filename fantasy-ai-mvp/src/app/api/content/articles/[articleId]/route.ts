import { NextRequest, NextResponse } from 'next/server';
import { contentService } from '@/lib/content-service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ articleId: string }> }
) {
  try {
    const { articleId } = await context.params;

    if (!articleId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing articleId parameter' 
        },
        { status: 400 }
      );
    }

    const article = await contentService.getArticle(articleId);

    if (!article) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Article not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: article
    });

  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch article',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ articleId: string }> }
) {
  try {
    const { articleId } = await context.params;
    const body = await request.json();

    if (!articleId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing articleId parameter' 
        },
        { status: 400 }
      );
    }

    if (!body.userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing userId in request body' 
        },
        { status: 400 }
      );
    }

    if (body.action === 'like') {
      await contentService.likeContent(articleId, body.userId);
      
      return NextResponse.json({
        success: true,
        message: 'Article liked successfully'
      });
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Invalid action' 
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error updating article:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update article',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}