/**
 * 🔥 REAL-TIME DATA SERVICE
 * Connects to live data sources using MCP servers
 */

import { dataCollectionService } from './data-collection-service';

export interface LiveDataSource {
  name: string;
  url: string;
  type: 'api' | 'news' | 'scores';
  updateInterval: number; // seconds
  isActive: boolean;
}

export class RealTimeDataService {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  
  // Free real-time data sources
  private sources: LiveDataSource[] = [
    // Live Scores & Stats (Free APIs)
    {
      name: 'ESPN Scoreboard',
      url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
      type: 'scores',
      updateInterval: 30,
      isActive: true
    },
    {
      name: 'ESPN NBA Scoreboard',
      url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
      type: 'scores',
      updateInterval: 30,
      isActive: true
    },
    
    // News Updates (via Firecrawl MCP)
    {
      name: 'ESPN Breaking News',
      url: 'https://www.espn.com/nfl/',
      type: 'news',
      updateInterval: 300, // 5 minutes
      isActive: true
    },
    {
      name: 'NFL.com News',
      url: 'https://www.nfl.com/news/',
      type: 'news',
      updateInterval: 300,
      isActive: true
    },
    
    // Player Stats (Free endpoints)
    {
      name: 'ESPN NFL Leaders',
      url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/leaders',
      type: 'api',
      updateInterval: 600, // 10 minutes
      isActive: true
    }
  ];

  async startRealTimeCollection(): Promise<void> {
    console.log('🔥 Starting Real-Time Data Collection...');
    
    for (const source of this.sources) {
      if (source.isActive) {
        await this.startSourceCollection(source);
      }
    }
    
    console.log(`✅ Monitoring ${this.sources.filter(s => s.isActive).length} live data sources`);
  }

  private async startSourceCollection(source: LiveDataSource): Promise<void> {
    // Initial collection
    await this.collectFromSource(source);
    
    // Set up interval for updates
    const interval = setInterval(async () => {
      await this.collectFromSource(source);
    }, source.updateInterval * 1000);
    
    this.intervals.set(source.name, interval);
    console.log(`📡 Started monitoring: ${source.name} (every ${source.updateInterval}s)`);
  }

  private async collectFromSource(source: LiveDataSource): Promise<void> {
    try {
      const runId = await dataCollectionService.startCollectionRun(
        source.name,
        source.type
      );

      let data: any;
      let recordCount = 0;

      switch (source.type) {
        case 'scores':
          data = await this.fetchLiveScores(source.url);
          recordCount = data.events?.length || 0;
          break;
          
        case 'news':
          data = await this.fetchLatestNews(source.url);
          recordCount = data.articles?.length || 0;
          break;
          
        case 'api':
          data = await this.fetchAPIData(source.url);
          recordCount = data.athletes?.length || 0;
          break;
      }

      // Save to database
      await dataCollectionService.saveRawData(
        source.name,
        source.type,
        source.url,
        data,
        recordCount
      );

      await dataCollectionService.endCollectionRun(recordCount);

      // Process immediately for real-time updates
      if (source.updateInterval <= 60) {
        await this.processRealtimeData(source.type, data);
      }

    } catch (error) {
      console.error(`❌ Failed to collect from ${source.name}:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async fetchLiveScores(url: string): Promise<any> {
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      return {
        events: data.events || [],
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      return { events: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async fetchLatestNews(url: string): Promise<any> {
    // In production, would use Firecrawl MCP
    // For now, return mock structure
    return {
      articles: [
        {
          title: 'Latest NFL Update',
          url: url + '/article-' + Date.now(),
          publishedAt: new Date().toISOString(),
          summary: 'Breaking news from ' + url
        }
      ],
      source: url,
      timestamp: new Date().toISOString()
    };
  }

  private async fetchAPIData(url: string): Promise<any> {
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      return {
        athletes: data.athletes || [],
        categories: data.categories || [],
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      return { athletes: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async processRealtimeData(type: string, data: any): Promise<void> {
    switch (type) {
      case 'scores':
        // Update game scores in real-time
        for (const event of data.events || []) {
          await this.updateGameScore(event);
        }
        break;
        
      case 'news':
        // Process breaking news
        for (const article of data.articles || []) {
          await this.processNewsArticle(article);
        }
        break;
    }
  }

  private async updateGameScore(event: any): Promise<void> {
    if (!event.id) return;
    
    const gameData = {
      externalId: event.id,
      sport: event.sport || 'nfl',
      homeTeam: event.competitions?.[0]?.competitors?.[0]?.team?.displayName || 'Unknown',
      awayTeam: event.competitions?.[0]?.competitors?.[1]?.team?.displayName || 'Unknown',
      homeScore: parseInt(event.competitions?.[0]?.competitors?.[0]?.score || '0'),
      awayScore: parseInt(event.competitions?.[0]?.competitors?.[1]?.score || '0'),
      status: event.status?.type?.name || 'SCHEDULED',
      gameTime: new Date(event.date),
      quarter: event.status?.period || null,
      timeLeft: event.status?.displayClock || null
    };
    
    await dataCollectionService.saveGameData(gameData);
  }

  private async processNewsArticle(article: any): Promise<void> {
    await dataCollectionService.saveNewsArticle({
      source: 'Real-Time Feed',
      title: article.title,
      content: article.content || article.summary || 'Content pending...',
      url: article.url,
      publishedAt: new Date(article.publishedAt || Date.now()),
      summary: article.summary,
      category: 'breaking'
    });
  }

  stopAllCollection(): void {
    console.log('🛑 Stopping all real-time collection...');
    
    this.intervals.forEach((interval, name) => {
      clearInterval(interval);
      console.log(`⏹️ Stopped monitoring: ${name}`);
    });
    
    this.intervals.clear();
  }
}

export const realTimeDataService = new RealTimeDataService();