import { NextRequest, NextResponse } from 'next/server';
import { contentService } from '@/lib/content-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type');

    if (!query) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing search query parameter (q)' 
        },
        { status: 400 }
      );
    }

    if (type && !['articles', 'news', 'all'].includes(type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid type parameter. Must be: articles, news, or all' 
        },
        { status: 400 }
      );
    }

    const results = await contentService.searchContent(
      query, 
      type as 'articles' | 'news' | 'all' | undefined
    );

    return NextResponse.json({
      success: true,
      data: results,
      totalResults: results.articles.length + results.news.length
    });

  } catch (error) {
    console.error('Error searching content:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}