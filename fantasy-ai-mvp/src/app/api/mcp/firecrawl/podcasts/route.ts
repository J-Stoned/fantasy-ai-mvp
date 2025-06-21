/**
 * Real Podcast Data via Firecrawl MCP - NO MOCK DATA
 * Returns ONLY real podcast data or honest empty response
 */

import { NextRequest, NextResponse } from 'next/server';
import { unifiedMCPManager } from '@/lib/mcp-integration/unified-mcp-manager';

export async function POST(req: NextRequest) {
  try {
    const { query, sources } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    // Use Firecrawl MCP for REAL podcast data scraping
    const result = await unifiedMCPManager.executeCapability({
      operation: "crawl_podcast_content",
      servers: ["firecrawl"],
      priority: "high",
      parameters: {
        query,
        sources: sources || [
          'https://podcasts.apple.com/search',
          'https://open.spotify.com/search',
          'https://www.cbssports.com/fantasy/football/podcast'
        ],
        extractTranscripts: true,
        analyzeSentiment: true,
        maxResults: 5
      }
    });

    // "EITHER WE KNOW IT OR WE DON'T... YET!" - return real data or honest empty response
    if (!result || !result.podcasts) {
      return NextResponse.json({ 
        podcasts: [], 
        message: "No real podcast data available for this query... yet! We're working on expanding our sources."
      });
    }

    // Return ONLY validated real data
    const realPodcasts = result.podcasts.filter((podcast: any) => 
      podcast.title && podcast.source // Basic validation for real data
    );

    return NextResponse.json({
      podcasts: realPodcasts,
      totalFound: realPodcasts.length,
      dataSource: "real_firecrawl_mcp",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Firecrawl podcast MCP error:', error);
    
    // ABSOLUTE HONESTY - tell the truth about failures
    return NextResponse.json({ 
      podcasts: [],
      error: "Unable to retrieve real podcast data at this time"
    }, { status: 500 });
  }
}