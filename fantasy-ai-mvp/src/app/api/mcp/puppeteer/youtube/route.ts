/**
 * Real YouTube Data via Puppeteer MCP - NO MOCK DATA
 * Mission: "Either we know it or we don't... yet!"
 */

import { NextRequest, NextResponse } from 'next/server';
import { unifiedMCPManager } from '@/lib/mcp-integration/unified-mcp-manager';

export async function POST(req: NextRequest) {
  try {
    const { query, maxResults, includeMetrics, extractTranscript } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    // Use Puppeteer MCP for REAL YouTube data scraping
    const result = await unifiedMCPManager.executeCapability({
      operation: "scrape_youtube_videos",
      servers: ["puppeteer"],
      priority: "high",
      parameters: {
        searchQuery: query,
        maxResults: maxResults || 5,
        includeViewCounts: includeMetrics || true,
        extractDescription: true,
        extractThumbnail: true,
        extractTranscript: extractTranscript || false,
        orderBy: "relevance"
      }
    });

    // "EITHER WE KNOW IT OR WE DON'T... YET!" - return real data or honest empty response
    if (!result || !result.videos) {
      return NextResponse.json({ 
        videos: [], 
        message: "No real YouTube data available for this query... yet! We're improving our scraping capabilities."
      });
    }

    // Return ONLY validated real data - no fake view counts or mock content
    const realVideos = result.videos.filter((video: any) => 
      video.videoId && video.title && video.channel // Basic validation for real data
    ).map((video: any) => ({
      videoId: video.videoId,
      title: video.title,
      channel: video.channel,
      publishDate: video.publishDate || null,
      thumbnail: video.thumbnail || null,
      description: video.description || '',
      viewCount: video.viewCount || 0, // REAL view count or 0 - no fake numbers
      sentiment: video.sentiment || 'neutral',
      highlights: video.highlights || [],
      url: `https://youtube.com/watch?v=${video.videoId}`
    }));

    return NextResponse.json({
      videos: realVideos,
      totalFound: realVideos.length,
      dataSource: "real_puppeteer_mcp",
      missionStatement: "Either we know it or we don't... yet!",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Puppeteer YouTube MCP error:', error);
    
    // ABSOLUTE HONESTY - tell the truth about failures
    return NextResponse.json({ 
      videos: [],
      error: "Unable to retrieve real YouTube data at this time... yet! We're working on it.",
      missionStatement: "Either we know it or we don't... yet!"
    }, { status: 500 });
  }
}