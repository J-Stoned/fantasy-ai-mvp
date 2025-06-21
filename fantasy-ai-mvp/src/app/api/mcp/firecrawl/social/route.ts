/**
 * Real Social Media Data via Firecrawl MCP - NO MOCK DATA
 * Mission: "Either we know it or we don't... yet!"
 */

import { NextRequest, NextResponse } from 'next/server';
import { unifiedMCPManager } from '@/lib/mcp-integration/unified-mcp-manager';

export async function POST(req: NextRequest) {
  try {
    const { query, platforms, includeMetrics, timeframe } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    // Use Firecrawl MCP for REAL social media data scraping
    const result = await unifiedMCPManager.executeCapability({
      operation: "scrape_social_platforms",
      servers: ["firecrawl"],
      priority: "high",
      parameters: {
        query,
        platforms: platforms || ['twitter', 'reddit'],
        timeframe: timeframe || '7d',
        includeMetrics: includeMetrics || true,
        analyzeSentiment: true,
        detectInfluencers: true,
        maxPostsPerPlatform: 10
      }
    });

    // "EITHER WE KNOW IT OR WE DON'T... YET!" - return real data or honest empty response
    if (!result || !result.platforms) {
      return NextResponse.json({ 
        platforms: [], 
        message: "No real social media data available for this query... yet! We're expanding our social monitoring."
      });
    }

    // Return ONLY validated real data - no fake mention counts or mock posts
    const realPlatforms = result.platforms.filter((platform: any) => 
      platform.name && platform.posts // Basic validation for real data
    ).map((platform: any) => ({
      name: platform.name,
      mentionCount: platform.mentionCount || 0, // REAL count or 0 - no fake numbers
      overallSentiment: platform.overallSentiment || 'neutral',
      isTrending: platform.isTrending || false,
      samplePosts: platform.posts?.slice(0, 3).map((post: any) => ({
        text: post.text || '',
        author: post.author || 'Unknown',
        likes: post.likes || 0, // REAL likes or 0
        timestamp: post.timestamp || null,
        url: post.url || null
      })) || [],
      influencerPosts: platform.influencerPosts || [],
      topThreads: platform.topThreads || []
    }));

    return NextResponse.json({
      platforms: realPlatforms,
      totalPlatforms: realPlatforms.length,
      dataSource: "real_firecrawl_mcp",
      missionStatement: "Either we know it or we don't... yet!",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Firecrawl social MCP error:', error);
    
    // ABSOLUTE HONESTY - tell the truth about failures
    return NextResponse.json({ 
      platforms: [],
      error: "Unable to retrieve real social media data at this time... yet! We're improving our scraping.",
      missionStatement: "Either we know it or we don't... yet!"
    }, { status: 500 });
  }
}