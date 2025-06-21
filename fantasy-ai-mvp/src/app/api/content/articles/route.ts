import { NextRequest, NextResponse } from 'next/server';
import { contentService, ContentCategory } from '@/lib/content-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const options: any = {};
    
    // Parse query parameters
    const category = searchParams.get('category');
    if (category && Object.values(ContentCategory).includes(category as ContentCategory)) {
      options.category = category as ContentCategory;
    }
    
    const isExpert = searchParams.get('isExpert');
    if (isExpert !== null) {
      options.isExpert = isExpert === 'true';
    }
    
    const isPremium = searchParams.get('isPremium');
    if (isPremium !== null) {
      options.isPremium = isPremium === 'true';
    }
    
    const limit = searchParams.get('limit');
    if (limit) {
      options.limit = parseInt(limit, 10);
    }
    
    const offset = searchParams.get('offset');
    if (offset) {
      options.offset = parseInt(offset, 10);
    }

    const articles = await contentService.getArticles(options);

    return NextResponse.json({
      success: true,
      data: articles,
      count: articles.length
    });

  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch articles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}