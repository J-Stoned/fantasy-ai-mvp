import { NextRequest, NextResponse } from 'next/server';
import { contentService, NewsCategory } from '@/lib/content-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const options: any = {};
    
    // Parse query parameters
    const category = searchParams.get('category');
    if (category && Object.values(NewsCategory).includes(category as NewsCategory)) {
      options.category = category as NewsCategory;
    }
    
    const impact = searchParams.get('impact');
    if (impact && ['HIGH', 'MEDIUM', 'LOW'].includes(impact)) {
      options.impact = impact as 'HIGH' | 'MEDIUM' | 'LOW';
    }
    
    const limit = searchParams.get('limit');
    if (limit) {
      options.limit = parseInt(limit, 10);
    }

    const news = await contentService.getNews(options);

    return NextResponse.json({
      success: true,
      data: news,
      count: news.length
    });

  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch news',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}